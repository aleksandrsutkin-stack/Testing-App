// app/select.tsx
// v0.6: useColors() + makeStyles(colors) factory pattern. Full dark mode.

import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../src/components/AppButton';
import { Card } from '../src/components/Card';
import { LabeledPicker, PickerOption } from '../src/components/LabeledPicker';
import { Screen } from '../src/components/Screen';
import { BRAND } from '../src/config/brand';
import { getBlueprint } from '../src/data/testBlueprints';
import { getRecommendedTestsForProfile, getTestDefinition, testCatalog } from '../src/data/testCatalog';
import { TestId } from '../src/features/assessment/types';
import { makeSessionSeed } from '../src/features/generation/seededRandom';
import { ageFromGrade } from '../src/utils/ageFromGrade';
import { useColors, ColorPalette } from '../src/theme/colors';

const gradeOptions: PickerOption<number>[] = [
  { label: 'Pre-K', value: -1 },
  { label: 'Kindergarten', value: 0 },
  ...Array.from({ length: 12 }, (_, i) => ({ label: `Grade ${i + 1}`, value: i + 1 })),
  { label: 'Adult / post-secondary', value: 20 }
];

const testOptions: PickerOption<TestId>[] = testCatalog.map(t => ({ label: t.title, value: t.id }));

function firstParam(value: string | string[] | undefined, fallback: string): string {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

export default function SelectScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const params = useLocalSearchParams();
  const preselect = firstParam(params.preselect, 'quizlift-aptitude-snapshot') as TestId;

  const [grade, setGrade] = useState(5);
  const [selectedTestId, setSelectedTestId] = useState<TestId>(preselect);

  const age = ageFromGrade(grade);
  const selectedTest = getTestDefinition(selectedTestId);
  const selectedBlueprint = getBlueprint(selectedTestId);
  const recommendedTests = useMemo(() => getRecommendedTestsForProfile(age, grade), [age, grade]);
  const isRecommended = recommendedTests.some(t => t.id === selectedTestId);

  function startAssessment() {
    const seed = makeSessionSeed(selectedTestId, age, grade);
    router.push({
      pathname: '/assessment',
      params: { testId: selectedTestId, age: String(age), grade: String(grade), seed }
    });
  }

  return (
    <Screen>
      <Text style={styles.title}>Set up the session</Text>
      <Text style={styles.subtitle}>
        Choose a short diagnostic. Every retake uses the same blueprint but changes the actual numbers and question variants.
      </Text>

      <Card style={styles.formCard}>
        <LabeledPicker
          label="Grade level"
          value={grade}
          options={gradeOptions}
          onChange={setGrade}
          helperText={`Age ${age} (auto-set — we use grade to pick the right question difficulty).`}
        />
        <LabeledPicker
          label="Test type"
          value={selectedTestId}
          options={testOptions}
          onChange={setSelectedTestId}
          helperText="Start broad with the aptitude snapshot, or choose a specific readiness/practice module."
        />
      </Card>

      {selectedTest ? (
        <Card style={styles.previewCard}>
          <View style={styles.pillRow}>
            <Text style={[styles.pill, isRecommended ? styles.pillGood : styles.pillWarn]}>
              {isRecommended ? 'Recommended for grade' : 'Outside recommended range'}
            </Text>
            <Text style={styles.pill}>{selectedBlueprint.totalQuestions} questions</Text>
            <Text style={styles.pill}>{selectedTest.durationMinutes} min</Text>
          </View>
          <Text style={styles.previewTitle}>{selectedTest.title}</Text>
          <Text style={styles.previewSubtitle}>{selectedTest.subtitle}</Text>
          <Text style={styles.body}>{selectedTest.parentBenefit}</Text>
          <Text style={styles.reportLabel}>{BRAND.scoreReportName} includes</Text>
          <Text style={styles.body}>{selectedTest.reportPromise}</Text>
          <Text style={styles.disclaimer}>{selectedTest.disclaimer}</Text>
          <AppButton title="Start private test sprint" onPress={startAssessment} />
        </Card>
      ) : null}

      <Card style={styles.recommendCard}>
        <Text style={styles.recommendTitle}>Recommended for this grade</Text>
        {recommendedTests.length > 0
          ? recommendedTests.map(t => <Text key={t.id} style={styles.recommendItem}>• {t.title}</Text>)
          : <Text style={styles.body}>No exact match yet. The broad aptitude snapshot can still be used as a demo module.</Text>}
      </Card>
    </Screen>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    title: { fontSize: 28, color: colors.ink, fontWeight: '700', marginBottom: 8 },
    subtitle: { color: colors.inkMuted, fontSize: 15, lineHeight: 22, marginBottom: 18 },
    formCard: { gap: 18, marginBottom: 16 },
    previewCard: { gap: 14, marginBottom: 16 },
    pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pill: { alignSelf: 'flex-start', overflow: 'hidden', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.surfaceMuted, color: colors.inkMuted, fontSize: 12, fontWeight: '600' },
    pillGood: { color: colors.success, backgroundColor: colors.surfaceMuted },
    pillWarn: { color: colors.warning, backgroundColor: colors.surfaceMuted },
    previewTitle: { color: colors.ink, fontSize: 21, fontWeight: '700' },
    previewSubtitle: { color: colors.primary, fontWeight: '600', lineHeight: 21, fontSize: 14 },
    body: { color: colors.inkMuted, lineHeight: 22, fontSize: 14 },
    reportLabel: { color: colors.ink, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
    disclaimer: { color: colors.inkMuted, fontSize: 12, lineHeight: 18, backgroundColor: colors.surfaceMuted, padding: 12, borderRadius: 14 },
    recommendCard: { gap: 8 },
    recommendTitle: { color: colors.ink, fontWeight: '700', fontSize: 17 },
    recommendItem: { color: colors.inkMuted, lineHeight: 22, fontWeight: '500', fontSize: 14 }
  });
}
