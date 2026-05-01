// src/components/SampleReportPreview.tsx
//
// v0.9 — Stylized "report screenshot" rendered as native RN. Shown on the
// home screen so parents see what they get with the ScoreLift Report
// before they pay.
//
// Design choices:
//  - Uses the SAMPLE_RESULT data — same shape as a real result, so the
//    structure of the preview always matches the real report.
//  - Hardcoded light-mode colors (with a dark-mode-aware outer frame) so
//    the preview reads as "screenshot of a light-mode PDF" — which is
//    exactly what the PDF is.
//  - Tap target wraps the whole card; opens the /sample-report screen.

import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { BAND_HEADLINES } from '../features/assessment/domainLabels';
import { SAMPLE_RESULT } from '../data/sampleReport';
import { BRAND } from '../config/brand';
import { useColors, ColorPalette } from '../theme/colors';

export function SampleReportPreview() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const headline = BAND_HEADLINES[SAMPLE_RESULT.readinessBand];
  const top3 = SAMPLE_RESULT.topPriorityFixes;

  return (
    <Pressable
      onPress={() => router.push('/sample-report')}
      style={({ pressed }) => [styles.outer, pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }]}
      accessibilityRole="button"
      accessibilityLabel="Open the full sample ScoreLift Report"
    >
      <Text style={styles.heading}>What you get with the ScoreLift Report</Text>
      <Text style={styles.subheading}>Tap to see a full sample.</Text>

      {/* Inner "PDF screenshot" — hardcoded light-mode palette */}
      <View style={styles.paper}>
        {/* Header strip */}
        <Text style={styles.kicker}>{BRAND.appName}  ·  {BRAND.scoreReportName}</Text>

        {/* Band headline lead */}
        <Text style={styles.bandHeadline}>
          {headline.headline} <Text style={styles.icon}>{headline.icon}</Text>
        </Text>
        <Text style={styles.scoreLine}>
          {BRAND.productScoreName}: {SAMPLE_RESULT.scoreLiftScore} / 100
        </Text>
        <Text style={styles.metaLine}>
          {SAMPLE_RESULT.testTitle}  ·  Grade {SAMPLE_RESULT.grade}  ·  Sample
        </Text>

        <View style={styles.divider} />

        {/* Parent summary */}
        <Text style={styles.sectionEyebrow}>Parent summary</Text>
        <Text style={styles.parentSummary} numberOfLines={3}>
          {SAMPLE_RESULT.parentSummary}
        </Text>

        {/* Top 3 fixes */}
        <Text style={styles.sectionEyebrow}>Top to fix first</Text>
        {top3.slice(0, 3).map((fix, i) => (
          <View key={fix.skillId} style={styles.fixRow}>
            <View style={styles.fixNum}><Text style={styles.fixNumText}>{i + 1}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fixSkill}>{fix.skillLabel}</Text>
              <Text style={styles.fixDomain}>{fix.domainLabel}  ·  {fix.missedCount} missed</Text>
            </View>
          </View>
        ))}

        <View style={[styles.divider, { marginTop: 12 }]} />
        <Text style={styles.cta}>Tap to see full sample →</Text>
      </View>
    </Pressable>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    outer: { marginBottom: 22 },
    heading: { color: colors.ink, fontSize: 18, fontWeight: '700', marginBottom: 4 },
    subheading: { color: colors.inkMuted, fontSize: 13, marginBottom: 10 },

    // PDF screenshot — hardcoded light palette so it reads as the export.
    paper: {
      backgroundColor: '#FFFFFF',
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      shadowColor: '#000000',
      shadowOpacity: 0.08,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    kicker: {
      color: '#4F46E5',
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.08,
      marginBottom: 12,
    },
    bandHeadline: {
      color: '#172033',
      fontSize: 28,
      fontWeight: '700',
      lineHeight: 32,
      letterSpacing: -0.01,
      marginBottom: 6,
    },
    icon: { fontSize: 24 },
    scoreLine: {
      color: '#2138B8',
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 2,
    },
    metaLine: {
      color: '#657083',
      fontSize: 11,
      fontWeight: '600',
    },
    divider: {
      height: 1,
      backgroundColor: '#E5E7EB',
      marginVertical: 14,
    },
    sectionEyebrow: {
      color: '#4F46E5',
      fontSize: 9,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.08,
      marginBottom: 6,
    },
    parentSummary: {
      color: '#1F2937',
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 14,
    },
    fixRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 8,
    },
    fixNum: {
      width: 20, height: 20, borderRadius: 10,
      backgroundColor: '#4F46E5',
      alignItems: 'center', justifyContent: 'center',
    },
    fixNumText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
    fixSkill: { color: '#172033', fontSize: 13, fontWeight: '600' },
    fixDomain: { color: '#657083', fontSize: 11, fontWeight: '600' },
    cta: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '700',
      textAlign: 'center',
    },
  });
}
