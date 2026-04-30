import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import {
  Sparkles, Calculator, Rocket, Ruler, BookOpen, Shapes, Code2,
  Backpack, Compass, ChevronRight, Zap
} from 'lucide-react-native';
import { AppButton } from '../src/components/AppButton';
import { Card } from '../src/components/Card';
import { Screen } from '../src/components/Screen';
import { BRAND } from '../src/config/brand';
import { testCatalog } from '../src/data/testCatalog';
import { TestId } from '../src/features/assessment/types';
import { makeSessionSeed } from '../src/features/generation/seededRandom';
import { ageFromGrade } from '../src/utils/ageFromGrade';
import { getSettings, setTrackHistory } from '../src/services/historyService';
import { privacyWipeChecklist } from '../src/services/privacyWipeService';
import { colors } from '../src/theme/colors';

// Map test catalog icon names to lucide components.
const ICONS: Record<string, any> = {
  sparkles: Sparkles,
  calculator: Calculator,
  rocket: Rocket,
  ruler: Ruler,
  'book-open': BookOpen,
  shapes: Shapes,
  code: Code2,
  backpack: Backpack,
  compass: Compass
};

// Each test gets a stable accent color (matches in-app domain mood).
const TEST_ACCENT: Record<TestId, string> = {
  'questionliftiq-aptitude-snapshot':       '#4F46E5',
  'compacted-math-readiness':               '#0891B2',
  'double-compacted-algebra-readiness':     '#9333EA',
  'grade-math-skills-check':                '#0D9488',
  'reading-vocabulary-snapshot':            '#D97706',
  'stem-spatial-reasoning':                 '#16A34A',
  'coding-logic-sprint':                    '#0369A1',
  'kindergarten-readiness':                 '#C026D3',
  'military-aptitude-practice':             '#15803D'
};

export default function HomeScreen() {
  const [trackHistory, setTrackHistoryState] = useState(false);

  useEffect(() => {
    getSettings().then(s => setTrackHistoryState(s.trackHistory));
  }, []);

  function handleTrackHistoryToggle(value: boolean) {
    setTrackHistoryState(value);
    setTrackHistory(value).catch(() => {});
  }

  function quickStart() {
    // Quick Start: 10-question sample of the aptitude snapshot.
    // Always free, full unlock — this is the demo experience.
    const grade = 5;
    const age = ageFromGrade(grade);
    const testId: TestId = 'questionliftiq-aptitude-snapshot';
    const seed = makeSessionSeed(testId, age, grade);
    router.push({
      pathname: '/assessment',
      params: { testId, age: String(age), grade: String(grade), seed, sampleSize: '10' }
    });
  }

  function openTest(testId: TestId) {
    router.push({ pathname: '/select', params: { preselect: testId } });
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Private test-improvement diagnostics</Text>
        <Text style={styles.title}>{BRAND.appName}</Text>
        <Text style={styles.subtitle}>{BRAND.tagline}</Text>
      </View>

      {/* Quick Start CTA — first-time-friendly, no setup */}
      <Card style={styles.quickStartCard}>
        <View style={styles.quickStartHead}>
          <View style={styles.zapIcon}>
            <Zap size={20} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          <View style={styles.quickStartTextBlock}>
            <Text style={styles.quickStartTitle}>Quick Start</Text>
            <Text style={styles.quickStartSub}>10-question sample — fully unlocked, no setup.</Text>
          </View>
        </View>
        <AppButton title="Try a sample test" onPress={quickStart} />
      </Card>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Or pick a specific test</Text>
        <Text style={styles.sectionSubtitle}>9 modules covering aptitude, math, reading, STEM, coding, and more.</Text>
      </View>

      <View style={styles.catalogGrid}>
        {testCatalog.map((test) => {
          const IconComp = ICONS[test.icon] ?? Sparkles;
          const accent = TEST_ACCENT[test.id];
          return (
            <Pressable
              key={test.id}
              onPress={() => openTest(test.id)}
              style={({ pressed }) => [styles.testCard, pressed && styles.testCardPressed]}
            >
              <View style={[styles.iconCircle, { backgroundColor: accent }]}>
                <IconComp size={22} color="#FFFFFF" strokeWidth={2.2} />
              </View>
              <View style={styles.testTextBlock}>
                <Text style={styles.testTitle}>{test.title}</Text>
                <Text style={styles.testSubtitle} numberOfLines={2}>{test.subtitle}</Text>
                <Text style={styles.testMeta}>{test.durationMinutes} min · {test.questionTarget} questions</Text>
              </View>
              <ChevronRight size={18} color={colors.inkMuted} />
            </Pressable>
          );
        })}
      </View>

      {/* History opt-in toggle - default OFF */}
      <Card style={styles.toggleCard}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleTextBlock}>
            <Text style={styles.toggleTitle}>Track score lift over time</Text>
            <Text style={styles.toggleSub}>
              Saves test scores locally on this device so you can see improvement on retakes. Off by default. Erases when you delete the app.
            </Text>
          </View>
          <Switch
            value={trackHistory}
            onValueChange={handleTrackHistoryToggle}
            trackColor={{ false: colors.surfaceMuted, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </Card>

      <Card style={styles.privacyCard}>
        <Text style={styles.cardTitle}>Privacy-first by default</Text>
        {privacyWipeChecklist().map((item) => (
          <Text key={item} style={styles.checkItem}>✓ {item}</Text>
        ))}
      </Card>

      <Text style={styles.disclaimer}>
        QuestionLiftIQ is an educational practice and screening tool. It is not a clinical IQ test, diagnostic instrument, official school placement test, or official military exam product.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 10, marginBottom: 20 },
  kicker: { color: colors.primary, fontWeight: '600', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.6 },
  title: { color: colors.ink, fontSize: 40, fontWeight: '700', lineHeight: 46 },
  subtitle: { color: colors.inkMuted, fontSize: 17, lineHeight: 25, fontWeight: '500' },

  quickStartCard: { gap: 14, marginBottom: 24, backgroundColor: '#1E1B4B', borderColor: '#312E81' },
  quickStartHead: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  zapIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' },
  quickStartTextBlock: { flex: 1, gap: 2 },
  quickStartTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  quickStartSub: { color: '#C7D2FE', fontSize: 13, lineHeight: 19 },

  sectionHeader: { gap: 5, marginBottom: 14 },
  sectionTitle: { color: colors.ink, fontWeight: '700', fontSize: 22 },
  sectionSubtitle: { color: colors.inkMuted, lineHeight: 21, fontSize: 14 },

  catalogGrid: { gap: 10, marginBottom: 22 },
  testCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border
  },
  testCardPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  iconCircle: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  testTextBlock: { flex: 1, gap: 3 },
  testTitle: { color: colors.ink, fontWeight: '600', fontSize: 15 },
  testSubtitle: { color: colors.inkMuted, lineHeight: 18, fontSize: 13 },
  testMeta: { color: colors.primary, fontWeight: '600', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2 },

  toggleCard: { marginBottom: 16 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  toggleTextBlock: { flex: 1, gap: 4 },
  toggleTitle: { color: colors.ink, fontWeight: '600', fontSize: 15 },
  toggleSub: { color: colors.inkMuted, fontSize: 12, lineHeight: 18 },

  privacyCard: { gap: 8, marginBottom: 14 },
  cardTitle: { color: colors.ink, fontSize: 18, fontWeight: '700', lineHeight: 24 },
  checkItem: { color: colors.inkMuted, lineHeight: 22, fontWeight: '500', fontSize: 13 },
  disclaimer: { color: colors.inkMuted, fontSize: 12, lineHeight: 18, textAlign: 'center' }
});
