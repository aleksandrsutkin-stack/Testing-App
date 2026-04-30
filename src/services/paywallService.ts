// src/services/paywallService.ts
//
// v0.5 paywall service. Tracks purchase state in AsyncStorage so users only
// pay once per device. The actual IAP transaction is mocked for v0.5 — when
// you wire StoreKit 2 (via expo-iap or RNIap) you only need to swap the bodies
// of `purchaseSingleTest()`, `purchaseAllAccess()`, and `restorePurchases()`.
// The rest of the app calls this service through a stable interface.
//
// Storage:
//   qlq:purchases:v1   PurchaseState
//
// Pricing (hard-coded for v0.5 — replace with App Store Connect product IDs):
//   single test:   $2.99    com.example.questionliftiq.single_test
//   all-access:    $14.99   com.example.questionliftiq.all_access

import AsyncStorage from '@react-native-async-storage/async-storage';
import { TestId } from '../features/assessment/types';

const PURCHASES_KEY = 'qlq:purchases:v1';

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
    storeKitProductId: 'com.example.questionliftiq.single_test',
    priceLabel: '$2.99',
    title: 'Unlock this test',
    description: 'Step-by-step solutions, 7-day plan, and PDF export — for this test only. One-time payment.'
  },
  'all-access': {
    id: 'all-access',
    storeKitProductId: 'com.example.questionliftiq.all_access',
    priceLabel: '$14.99',
    title: 'Unlock all 9 tests',
    description: 'Everything unlocked across every test type, forever, on this device. Best value.'
  }
};

const DEFAULT_STATE: PurchaseState = { allAccess: false, unlockedTests: [] };

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

// ─── Write ───────────────────────────────────────────────────────────────────

async function savePurchaseState(state: PurchaseState): Promise<void> {
  try {
    await AsyncStorage.setItem(PURCHASES_KEY, JSON.stringify(state));
  } catch {
    // Non-fatal — purchase will simply not persist. Will retry next time.
  }
}

// ─── Purchase actions ────────────────────────────────────────────────────────
// In production these will call the IAP plugin (expo-iap / RNIap). For v0.5
// they immediately succeed and persist locally. The interface stays the same.

export async function purchaseSingleTest(testId: TestId): Promise<{ success: boolean; error?: string }> {
  // TODO(v0.6): Replace with StoreKit 2 transaction:
  //   const result = await IAP.requestPurchase({ sku: PRODUCTS['single-test'].storeKitProductId });
  //   await IAP.finishTransaction(result.transaction);
  //   if (!result.success) return { success: false, error: result.error };
  try {
    const current = await getPurchaseState();
    const next: PurchaseState = {
      ...current,
      unlockedTests: Array.from(new Set([...current.unlockedTests, testId])),
      lastPurchaseAtIso: new Date().toISOString()
    };
    await savePurchaseState(next);
    return { success: true };
  } catch (e) {
    return { success: false, error: 'Purchase could not be saved.' };
  }
}

export async function purchaseAllAccess(): Promise<{ success: boolean; error?: string }> {
  // TODO(v0.6): Replace with StoreKit 2 transaction for all-access SKU.
  try {
    const next: PurchaseState = {
      allAccess: true,
      unlockedTests: [],
      lastPurchaseAtIso: new Date().toISOString()
    };
    await savePurchaseState(next);
    return { success: true };
  } catch (e) {
    return { success: false, error: 'Purchase could not be saved.' };
  }
}

export async function restorePurchases(): Promise<{ success: boolean; restored: boolean; error?: string }> {
  // TODO(v0.6): Replace with IAP.getAvailablePurchases() and rebuild state from receipts.
  // In v0.5 we simply re-read whatever local state exists — restore is effectively a no-op
  // because everything is on-device anyway. The flow exists so the UI is App Store-compliant.
  try {
    const state = await getPurchaseState();
    const hasAnyPurchase = state.allAccess || state.unlockedTests.length > 0;
    return { success: true, restored: hasAnyPurchase };
  } catch (e) {
    return { success: false, restored: false, error: 'Restore failed.' };
  }
}

// ─── Wipe (used by full local wipe in privacyWipeService) ───────────────────

export async function clearPurchases(): Promise<void> {
  // CAUTION: This destroys local proof of purchase. In production, restorePurchases()
  // would re-fetch from Apple's receipt store. Only call this in dev/test or alongside
  // a deliberate "reset everything" action.
  try {
    await AsyncStorage.removeItem(PURCHASES_KEY);
  } catch {
    // Non-fatal
  }
}
