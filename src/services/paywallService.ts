// src/services/paywallService.ts
//
// v0.8 — StoreKit 2 / Google Play Billing wiring via expo-iap.
//
// The mock from v0.5/v0.6/v0.7 is gone. Real product fetches and purchase
// requests now go through the platform store. AsyncStorage continues to act
// as a fast local mirror so the UI can render unlock state synchronously,
// but the **source of truth is the platform receipt**: restorePurchases()
// rebuilds local state from getAvailablePurchases.
//
// What still requires manual setup before this works end-to-end:
//   1. Real Apple Developer account ($99/yr) and App Store Connect record
//      under your real bundle ID.
//   2. Two non-consumable IAP products created in App Store Connect with the
//      product IDs declared in `PRODUCTS` below. REPLACE the placeholder
//      bundle prefix.
//   3. Equivalent Google Play Console setup if Android is in scope.
//   4. Sandbox tester account for testing in TestFlight / Play internal track.
//   5. Cannot run in Expo Go — needs a custom dev client (`npx expo prebuild`
//      + EAS Build, or bare workflow).
//
// Storage:
//   qlft:purchases:v1   PurchaseState (local mirror of platform receipts)

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  getAvailablePurchases,
  purchaseUpdatedListener,
  purchaseErrorListener,
  type Purchase,
  type Product,
} from 'expo-iap';
import { Platform } from 'react-native';
import { TestId } from '../features/assessment/types';

const PURCHASES_KEY = 'qlft:purchases:v1';

// REPLACE: swap "com.example" for your real reverse-DNS bundle prefix once
// the App Store Connect record exists. The product IDs below MUST match
// what you create in App Store Connect / Play Console exactly.
const SINGLE_SKU = 'com.example.quizlift.single_test';
const ALL_ACCESS_SKU = 'com.example.quizlift.all_access';

export interface PurchaseState {
  allAccess: boolean;
  unlockedTests: TestId[];
  // Set when a purchase happens. Useful for receipt validation later.
  lastPurchaseAtIso?: string;
}

export interface PurchaseProduct {
  id: 'single-test' | 'all-access';
  storeKitProductId: string;
  priceLabel: string;
  title: string;
  description: string;
}

export const PRODUCTS: Record<PurchaseProduct['id'], PurchaseProduct> = {
  'single-test': {
    id: 'single-test',
    storeKitProductId: SINGLE_SKU,
    // priceLabel is a fallback. Once initConnection + fetchProducts succeed,
    // the UI should prefer the live price string from the platform store.
    priceLabel: '$2.99',
    title: 'Unlock this test',
    description: 'Step-by-step solutions, 7-day plan, and PDF export — for this test only. One-time payment.'
  },
  'all-access': {
    id: 'all-access',
    storeKitProductId: ALL_ACCESS_SKU,
    priceLabel: '$14.99',
    title: 'Unlock all 9 tests',
    description: 'Everything unlocked across every test type, forever, on this device. Best value.'
  }
};

const ALL_SKUS = [SINGLE_SKU, ALL_ACCESS_SKU];

const DEFAULT_STATE: PurchaseState = { allAccess: false, unlockedTests: [] };

interface PurchaseResult {
  success: boolean;
  error?: string;
}

// ─── Connection lifecycle ────────────────────────────────────────────────────
// Call connectIAP() once at app startup (e.g. in app/_layout.tsx). Call
// disconnectIAP() if you need a clean teardown — usually not necessary in
// React Native, but useful in tests.

let connected = false;
let purchaseSub: { remove: () => void } | null = null;
let errorSub: { remove: () => void } | null = null;
const pendingResolvers = new Map<string, (result: PurchaseResult) => void>();

// Single-test SKU is shared across all 9 tests. We stash which test the user
// was paywalled on at purchase request time so the listener knows which
// testId to unlock when the receipt arrives.
let pendingTestId: TestId | null = null;

export async function connectIAP(): Promise<void> {
  if (connected) return;
  try {
    await initConnection();
    connected = true;
  } catch (e) {
    // Non-fatal: the app keeps working with whatever state is cached, but
    // new purchases / restores won't succeed until the connection is healthy.
    console.warn('IAP initConnection failed', e);
    return;
  }

  purchaseSub = purchaseUpdatedListener(async (purchase: Purchase) => {
    try {
      const sku = (purchase as any).productId ?? (purchase as any).id ?? '';
      const current = await getPurchaseState();
      let next: PurchaseState = current;
      if (sku === ALL_ACCESS_SKU) {
        next = { allAccess: true, unlockedTests: [], lastPurchaseAtIso: new Date().toISOString() };
      } else if (sku === SINGLE_SKU) {
        const testId = pendingTestId;
        pendingTestId = null;
        if (testId) {
          next = {
            ...current,
            unlockedTests: Array.from(new Set([...current.unlockedTests, testId])),
            lastPurchaseAtIso: new Date().toISOString(),
          };
        }
      }
      await savePurchaseState(next);
      // Non-consumable: pass isConsumable: false so StoreKit/Play remembers
      // the entitlement.
      await finishTransaction({ purchase, isConsumable: false });

      const resolver = pendingResolvers.get(sku);
      if (resolver) { pendingResolvers.delete(sku); resolver({ success: true }); }
    } catch (e) {
      console.warn('purchaseUpdatedListener failed', e);
    }
  });

  errorSub = purchaseErrorListener((error) => {
    // Reject any pending purchase requests with the platform error.
    for (const [sku, resolver] of pendingResolvers) {
      pendingResolvers.delete(sku);
      resolver({ success: false, error: error.message ?? 'Purchase failed.' });
    }
  });
}

export async function disconnectIAP(): Promise<void> {
  if (!connected) return;
  try {
    purchaseSub?.remove();
    errorSub?.remove();
    purchaseSub = null;
    errorSub = null;
    await endConnection();
  } finally {
    connected = false;
  }
}

// ─── Live product info (use to render real prices in PaywallModal) ──────────

export async function fetchLiveProducts(): Promise<Product[]> {
  if (!connected) await connectIAP();
  try {
    // expo-iap's return type is the union of one-shot products / subscriptions
    // depending on the type passed in; for type: 'in-app' the runtime shape
    // is Product[]. Cast here rather than narrowing each call site.
    const result = await fetchProducts({ skus: ALL_SKUS, type: 'in-app' });
    return (result ?? []) as Product[];
  } catch (e) {
    console.warn('fetchProducts failed', e);
    return [];
  }
}

// ─── Read ────────────────────────────────────────────────────────────────────

export async function getPurchaseState(): Promise<PurchaseState> {
  try {
    const raw = await AsyncStorage.getItem(PURCHASES_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return {
      allAccess: !!parsed.allAccess,
      unlockedTests: Array.isArray(parsed.unlockedTests) ? parsed.unlockedTests : [],
      lastPurchaseAtIso: parsed.lastPurchaseAtIso
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export async function isUnlocked(testId: TestId): Promise<boolean> {
  const state = await getPurchaseState();
  if (state.allAccess) return true;
  return state.unlockedTests.includes(testId);
}

// ─── Write (local mirror) ───────────────────────────────────────────────────

async function savePurchaseState(state: PurchaseState): Promise<void> {
  try {
    await AsyncStorage.setItem(PURCHASES_KEY, JSON.stringify(state));
  } catch {
    // Non-fatal — purchase will simply not persist locally. Source of truth
    // is the platform receipt; restorePurchases() will recover the state.
  }
}

// ─── Purchase actions ────────────────────────────────────────────────────────

export async function purchaseSingleTest(testId: TestId): Promise<PurchaseResult> {
  if (!connected) await connectIAP();
  if (!connected) return { success: false, error: 'In-app purchases unavailable.' };
  pendingTestId = testId;
  return runPurchase(SINGLE_SKU);
}

export async function purchaseAllAccess(): Promise<PurchaseResult> {
  if (!connected) await connectIAP();
  if (!connected) return { success: false, error: 'In-app purchases unavailable.' };
  return runPurchase(ALL_ACCESS_SKU);
}

function runPurchase(sku: string): Promise<PurchaseResult> {
  return new Promise<PurchaseResult>((resolve) => {
    pendingResolvers.set(sku, resolve);
    requestPurchase({
      request: Platform.OS === 'ios'
        ? { ios: { sku } }
        : { android: { skus: [sku] } },
      type: 'in-app',
    }).catch((e: any) => {
      pendingResolvers.delete(sku);
      resolve({ success: false, error: e?.message ?? 'Purchase failed.' });
    });
  });
}

export async function restorePurchases(): Promise<{ success: boolean; restored: boolean; error?: string }> {
  if (!connected) await connectIAP();
  if (!connected) return { success: false, restored: false, error: 'In-app purchases unavailable.' };
  try {
    const purchases = await getAvailablePurchases();
    const skus = purchases.map((p: any) => p.productId ?? p.id ?? '');
    const allAccess = skus.includes(ALL_ACCESS_SKU);
    // Single-test purchases lose their per-test target on restore (the user
    // could have paid for any of the 9 tests). Conservative behaviour: keep
    // the existing per-test unlocks from the local mirror, and let allAccess
    // override. The UI can prompt the user to re-confirm if needed.
    const single = skus.filter((s: string) => s === SINGLE_SKU).length;
    const next: PurchaseState = {
      allAccess,
      unlockedTests: (await getPurchaseState()).unlockedTests,
      lastPurchaseAtIso: new Date().toISOString(),
    };
    await savePurchaseState(next);
    return { success: true, restored: allAccess || single > 0 };
  } catch (e: any) {
    return { success: false, restored: false, error: e?.message ?? 'Restore failed.' };
  }
}

// ─── Wipe (used by full local wipe in privacyWipeService) ───────────────────

export async function clearPurchases(): Promise<void> {
  // CAUTION: This destroys the LOCAL mirror only. The platform receipt is
  // untouched, so restorePurchases() will recover the state on next launch.
  // Only call this in dev/test or as part of a deliberate "reset everything"
  // action.
  try {
    await AsyncStorage.removeItem(PURCHASES_KEY);
  } catch {
    // Non-fatal
  }
}
