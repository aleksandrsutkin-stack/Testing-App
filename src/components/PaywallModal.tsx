// src/components/PaywallModal.tsx
//
// The unlock modal. Shows when a user taps a locked tab (Mistakes / Plan)
// or the locked PDF export. Lifetime-purchase model: $2.99 single-test or
// $14.99 all-access. Restore Purchases is always shown for App Store compliance.
//
// In v0.5 the purchase is mocked. The success path is the same as it will be
// when StoreKit 2 is wired in v0.6.

import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Lock, Sparkles, Check, Zap } from 'lucide-react-native';
import { AppButton } from './AppButton';
import {
  PRODUCTS, purchaseSingleTest, purchaseAllAccess, restorePurchases
} from '../services/paywallService';
import { TestId } from '../features/assessment/types';
import { colors } from '../theme/colors';

interface PaywallModalProps {
  visible: boolean;
  testId: TestId;
  testTitle: string;
  missedCount: number;
  onClose: () => void;
  onPurchased: () => void;
}

export function PaywallModal({ visible, testId, testTitle, missedCount, onClose, onPurchased }: PaywallModalProps) {
  const [busy, setBusy] = useState<null | 'single' | 'all' | 'restore'>(null);
  const [error, setError] = useState<string | null>(null);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  async function handlePurchaseSingle() {
    setBusy('single');
    setError(null);
    const result = await purchaseSingleTest(testId);
    setBusy(null);
    if (result.success) {
      onPurchased();
    } else {
      setError(result.error ?? 'Purchase failed.');
    }
  }

  async function handlePurchaseAll() {
    setBusy('all');
    setError(null);
    const result = await purchaseAllAccess();
    setBusy(null);
    if (result.success) {
      onPurchased();
    } else {
      setError(result.error ?? 'Purchase failed.');
    }
  }

  async function handleRestore() {
    setBusy('restore');
    setError(null);
    setRestoreMessage(null);
    const result = await restorePurchases();
    setBusy(null);
    if (result.success) {
      setRestoreMessage(result.restored
        ? 'Purchases restored.'
        : 'No previous purchases found on this device.');
      if (result.restored) {
        // Give the user a beat to read the toast, then dismiss.
        setTimeout(onPurchased, 800);
      }
    } else {
      setError(result.error ?? 'Restore failed.');
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.lockBadge}>
            <Lock size={20} color="#FFFFFF" strokeWidth={2.4} />
          </View>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close paywall">
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>

        {/* Pitch */}
        <Text style={styles.title}>You missed {missedCount} question{missedCount === 1 ? '' : 's'}.</Text>
        <Text style={styles.subtitle}>Want to see why?</Text>

        <View style={styles.benefitsCard}>
          <BenefitRow text="Step-by-step solution for every missed question" />
          <BenefitRow text="The common trap that fooled you" />
          <BenefitRow text="Khan Academy practice link for each skill" />
          <BenefitRow text="7-day ScoreLift practice plan" />
          <BenefitRow text="Polished PDF report you can keep or share" />
        </View>

        {/* Single-test option */}
        <Pressable
          onPress={handlePurchaseSingle}
          disabled={busy !== null}
          style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
        >
          <View style={styles.optionRow}>
            <View>
              <Text style={styles.optionTitle}>{PRODUCTS['single-test'].title}</Text>
              <Text style={styles.optionDesc}>For {testTitle} only.</Text>
            </View>
            <Text style={styles.optionPrice}>{PRODUCTS['single-test'].priceLabel}</Text>
          </View>
        </Pressable>

        {/* All-access option (recommended) */}
        <Pressable
          onPress={handlePurchaseAll}
          disabled={busy !== null}
          style={({ pressed }) => [styles.optionFeatured, pressed && styles.optionPressed]}
        >
          <View style={styles.bestValueBadge}>
            <Sparkles size={11} color="#FFFFFF" strokeWidth={2.6} />
            <Text style={styles.bestValueText}>BEST VALUE</Text>
          </View>
          <View style={styles.optionRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitleLight}>{PRODUCTS['all-access'].title}</Text>
              <Text style={styles.optionDescLight}>All 9 tests, unlimited retakes, forever.</Text>
            </View>
            <Text style={styles.optionPriceLight}>{PRODUCTS['all-access'].priceLabel}</Text>
          </View>
        </Pressable>

        <Text style={styles.legal}>
          One-time payment. No subscription. Stays on this device.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {restoreMessage ? <Text style={styles.restoreInfo}>{restoreMessage}</Text> : null}

        <View style={styles.actionRow}>
          <AppButton title="Restore purchases" variant="ghost" onPress={handleRestore} loading={busy === 'restore'} style={styles.restoreBtn} />
          <AppButton title="Maybe later" variant="secondary" onPress={onClose} style={styles.laterBtn} />
        </View>

        <Text style={styles.footer}>
          QuestionLiftIQ is privacy-first — your scores never leave this device. Mock IAP active in this build.
        </Text>
      </View>
    </Modal>
  );
}

function BenefitRow({ text }: { text: string }) {
  return (
    <View style={styles.benefitRow}>
      <View style={styles.checkBubble}>
        <Check size={12} color="#FFFFFF" strokeWidth={3} />
      </View>
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    paddingTop: 24
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  lockBadge: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.inkMuted, fontWeight: '600', fontSize: 14 },

  title: { fontSize: 26, fontWeight: '700', color: colors.ink, lineHeight: 32, marginBottom: 4 },
  subtitle: { fontSize: 16, fontWeight: '500', color: colors.inkMuted, marginBottom: 20 },

  benefitsCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 14, gap: 10, marginBottom: 22, borderWidth: 1, borderColor: colors.border },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkBubble: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  benefitText: { color: colors.ink, fontSize: 13, lineHeight: 18, fontWeight: '500', flex: 1 },

  option: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border
  },
  optionFeatured: {
    backgroundColor: '#1E1B4B',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#4F46E5'
  },
  optionPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  optionTitle: { color: colors.ink, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  optionDesc: { color: colors.inkMuted, fontSize: 13, lineHeight: 18 },
  optionPrice: { color: colors.primary, fontSize: 22, fontWeight: '700' },
  optionTitleLight: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  optionDescLight: { color: '#C7D2FE', fontSize: 13, lineHeight: 18 },
  optionPriceLight: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },

  bestValueBadge: {
    position: 'absolute',
    top: -10,
    right: 14,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  bestValueText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', letterSpacing: 0.05 },

  legal: { color: colors.inkMuted, fontSize: 12, lineHeight: 17, textAlign: 'center', marginBottom: 6 },
  error: { color: colors.danger, fontSize: 13, textAlign: 'center', marginTop: 8 },
  restoreInfo: { color: colors.success, fontSize: 13, textAlign: 'center', marginTop: 8 },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  restoreBtn: { flex: 1 },
  laterBtn: { flex: 1 },

  footer: { color: colors.inkMuted, fontSize: 11, textAlign: 'center', lineHeight: 16, marginTop: 20 }
});
