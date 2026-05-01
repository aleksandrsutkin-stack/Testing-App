// app/sample-report.tsx
//
// v0.9 — Full-screen sample of the ScoreLift Report. Renders the actual
// HTML produced by buildReportHtml() inside a WebView so parents see the
// real artifact (not a mockup) before paying.
//
// The sample data lives in src/data/sampleReport.ts. Anchored persona is
// "Alex, 4th grade, Compacted Math" landing in the on-grade band — chosen
// to show every section without leading parents to assume their child
// will land in the highest tier.

import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { WebView } from 'react-native-webview';
import { useColors, ColorPalette } from '../src/theme/colors';
import { SAMPLE_RESULT } from '../src/data/sampleReport';
import { buildReportHtml } from '../src/features/reports/buildReportHtml';
import { BRAND } from '../src/config/brand';

export default function SampleReportScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const html = useMemo(() => buildReportHtml(SAMPLE_RESULT), []);

  function takeATestNow() {
    router.replace('/select');
  }

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: 'Sample report' }} />

      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>This is a sample.</Text>
        <Text style={styles.bannerBody}>
          Hardcoded data for "Alex, Grade 4." Take a test to generate your own
          {' '}{BRAND.scoreReportName}.
        </Text>
      </View>

      <View style={styles.webViewWrap}>
        <WebView
          originWhitelist={['*']}
          source={{ html }}
          showsVerticalScrollIndicator
          // The PDF HTML is light-mode only by design.
          style={{ flex: 1, backgroundColor: '#FFFFFF' }}
        />
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={takeATestNow}
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.primaryBtnText}>Take a test now →</Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    banner: {
      backgroundColor: colors.info,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    bannerTitle: {
      color: colors.primaryDark,
      fontSize: 13,
      fontWeight: '700',
      marginBottom: 2,
    },
    bannerBody: {
      color: colors.primaryDark,
      fontSize: 12,
      lineHeight: 17,
    },
    webViewWrap: { flex: 1, backgroundColor: '#FFFFFF' },
    footer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    primaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
    },
    primaryBtnText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },
  });
}
