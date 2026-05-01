// src/components/ScoreCard.tsx
//
// v0.8: Shareable score card. Designed to be captured to a PNG via
// react-native-view-shot and shared in group chats. This is the viral hook.
//
// Privacy: NEVER renders the child's name, age, or grade. Only the test
// name, the ScoreLift Score, and the directional percentile band.
//
// Light mode only — export must look the same regardless of the user's
// system theme, like the PDF.

import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Mascot } from './Illustrations';
import { BRAND } from '../config/brand';

export interface ScoreCardProps {
  scoreLiftScore: number;
  testName: string;
  percentileLabel: string;
  scoreLabel?: string;
}

export const SCORE_CARD_WIDTH = 320;
export const SCORE_CARD_HEIGHT = 400;

// forwardRef so the parent can pass a ref to react-native-view-shot's
// captureRef without wrapping in another View.
export const ScoreCard = forwardRef<View, ScoreCardProps>(function ScoreCard(
  { scoreLiftScore, testName, percentileLabel, scoreLabel },
  ref
) {
  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <View style={styles.mascotRow}>
        <Mascot expression="celebrating" mood="primary" size={88} />
      </View>

      <View style={styles.scoreBlock}>
        <Text style={styles.scoreKicker}>{BRAND.productScoreName}</Text>
        <Text style={styles.scoreValue}>{scoreLiftScore}</Text>
        {scoreLabel ? <Text style={styles.scoreSub}>{scoreLabel}</Text> : null}
      </View>

      <View style={styles.divider} />

      <Text style={styles.testName} numberOfLines={2}>{testName}</Text>
      <Text style={styles.percentile}>{percentileLabel}</Text>

      <View style={styles.footer}>
        <Text style={styles.brandLine}>{BRAND.appName}  ·  quizlift.app</Text>
        <Text style={styles.tagLine}>Free · No account needed</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  // Light-mode-only export palette. Hardcoded by design — must look the
  // same in any system theme, same as the PDF report.
  card: {
    width: SCORE_CARD_WIDTH,
    height: SCORE_CARD_HEIGHT,
    backgroundColor: '#F7F4EC',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 14
  },
  mascotRow: { alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  scoreBlock: { alignItems: 'center', gap: 2 },
  scoreKicker: {
    color: '#3E5BFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.08
  },
  scoreValue: {
    color: '#172033',
    fontSize: 64,
    fontWeight: '700',
    lineHeight: 70
  },
  scoreSub: {
    color: '#657083',
    fontSize: 12,
    fontWeight: '600'
  },
  divider: {
    width: 56,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#3E5BFF',
    marginVertical: 4
  },
  testName: {
    color: '#172033',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 21
  },
  percentile: {
    color: '#2138B8',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center'
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    gap: 2
  },
  brandLine: {
    color: '#172033',
    fontSize: 13,
    fontWeight: '700'
  },
  tagLine: {
    color: '#657083',
    fontSize: 11,
    fontWeight: '600'
  }
});
