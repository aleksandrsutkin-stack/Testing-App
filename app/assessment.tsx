// app/assessment.tsx
//
// v0.6:
//   - Full dark mode via useColors() + makeStyles(colors).
//   - Adaptive presentation order: same blueprint, but the order in which
//     the user sees the questions tunes to their last-3-question accuracy.
//     See src/features/assessment/adaptiveSelector.ts for the policy.
//
// The session itself is still seed-deterministic — the *set* of questions
// is fixed. Only the order varies based on the answer pattern. That keeps
// percent-correct meaningful and the retake design intact.

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Volume2 } from 'lucide-react-native';
import { AppButton } from '../src/components/AppButton';
import { Card } from '../src/components/Card';
import { ProgressBar } from '../src/components/ProgressBar';
import { QuestionOptionCard } from '../src/components/QuestionOptionCard';
import { Screen } from '../src/components/Screen';
import { createAssessmentSession } from '../src/features/assessment/assembleAssessment';
import { ResponseMap, TestId } from '../src/features/assessment/types';
import { makeSessionSeed } from '../src/features/generation/seededRandom';
import { getTestDefinition } from '../src/data/testCatalog';
import { speakPrompt, stopSpeech } from '../src/utils/speakPrompt';
import { SpatialVisual } from '../src/components/SpatialVisual';
import {
  AdaptiveAnswerHistory, pickInitialQuestion, pickNextQuestion
} from '../src/features/assessment/adaptiveSelector';
import { useColors, ColorPalette } from '../src/theme/colors';

function firstParam(value: string | string[] | undefined, fallback: string): string {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

export default function AssessmentScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const params = useLocalSearchParams();
  const testId = firstParam(params.testId, 'questionliftiq-aptitude-snapshot') as TestId;
  const age = Number(firstParam(params.age, '10'));
  const grade = Number(firstParam(params.grade, '5'));
  const seed = firstParam(params.seed, makeSessionSeed(testId, age, grade));

  const definition = getTestDefinition(testId);
  const fullSession = useMemo(() => createAssessmentSession({ testId, age, grade, seed }), [testId, age, grade, seed]);
  const sampleSizeRaw = firstParam(params.sampleSize, '');
  const sampleSize = sampleSizeRaw ? Math.max(1, Number(sampleSizeRaw)) : 0;
  const session = useMemo(() => {
    if (!sampleSize) return fullSession;
    return { ...fullSession, questions: fullSession.questions.slice(0, sampleSize) };
  }, [fullSession, sampleSize]);

  // ── Adaptive order state ──
  // presentationOrder[i] = pool index of the question shown at position i.
  // We extend it as the user answers — never pre-compute the whole order.
  const [presentationOrder, setPresentationOrder] = useState<number[]>(() => {
    if (session.questions.length === 0) return [];
    return [pickInitialQuestion(session.questions)];
  });
  const [currentPosition, setCurrentPosition] = useState(0);
  const [responses, setResponses] = useState<ResponseMap>({});
  const [answerHistory, setAnswerHistory] = useState<AdaptiveAnswerHistory[]>([]);

  // KG and other early-childhood modules get a "Read aloud" button.
  const isYoungChildModule = testId === 'kindergarten-readiness' || age <= 7;

  // Stop any in-flight speech when the user navigates away or moves on.
  useEffect(() => {
    return () => { stopSpeech(); };
  }, []);

  if (!definition) {
    return (
      <Screen>
        <Card style={styles.emptyCard}>
          <Text style={styles.title}>Test not found</Text>
          <Text style={styles.body}>Return to the test menu and choose a module.</Text>
          <AppButton title="Back to test menu" onPress={() => router.replace('/select')} />
        </Card>
      </Screen>
    );
  }

  if (session.questions.length === 0) {
    return (
      <Screen>
        <Card style={styles.emptyCard}>
          <Text style={styles.title}>No questions yet</Text>
          <Text style={styles.body}>This module has not been populated for the selected profile.</Text>
          <AppButton title="Back to test menu" onPress={() => router.replace('/select')} />
        </Card>
      </Screen>
    );
  }

  const currentPoolIdx = presentationOrder[currentPosition] ?? 0;
  const currentQuestion = session.questions[currentPoolIdx];
  const selectedOptionId = responses[currentQuestion.id];
  const isLastQuestion = currentPosition === session.questions.length - 1;

  function readQuestionAloud() {
    const optionsText = currentQuestion.options.map((opt, i) => `Option ${i + 1}: ${opt.label}.`).join(' ');
    const helper = currentQuestion.helperText ? `${currentQuestion.helperText}. ` : '';
    speakPrompt(`${currentQuestion.prompt}. ${helper}${optionsText}`);
  }

  function selectOption(optionId: string) {
    stopSpeech();
    setResponses(cur => ({ ...cur, [currentQuestion.id]: optionId }));
  }

  function isCorrectAnswer(qId: string, optId: string | undefined): boolean {
    if (!optId) return false;
    const q = session.questions.find(x => x.id === qId);
    if (!q) return false;
    const opt = q.options.find(o => o.id === optId);
    return !!opt && opt.score > 0;
  }

  function goNext() {
    if (!selectedOptionId) {
      Alert.alert('Choose an answer', 'Select an answer to continue.');
      return;
    }
    stopSpeech();

    // Record the answer in the adaptive history.
    const historyEntry: AdaptiveAnswerHistory = {
      questionId: currentQuestion.id,
      difficulty: currentQuestion.difficulty,
      isCorrect: isCorrectAnswer(currentQuestion.id, selectedOptionId)
    };
    const newHistory = [...answerHistory, historyEntry];
    setAnswerHistory(newHistory);

    if (isLastQuestion) {
      router.replace({
        pathname: '/celebration',
        params: {
          testId, age: String(age), grade: String(grade), seed,
          responses: JSON.stringify(responses),
          ...(sampleSize ? { sampleSize: String(sampleSize) } : {})
        }
      });
      return;
    }

    // Pick the next question based on the updated answer history.
    const answered = new Set(presentationOrder.map(i => session.questions[i].id));
    const nextPoolIdx = pickNextQuestion(session.questions, answered, newHistory);
    if (nextPoolIdx === -1) {
      // Defensive: shouldn't happen unless we've answered everything.
      router.replace({
        pathname: '/celebration',
        params: {
          testId, age: String(age), grade: String(grade), seed,
          responses: JSON.stringify(responses),
          ...(sampleSize ? { sampleSize: String(sampleSize) } : {})
        }
      });
      return;
    }
    setPresentationOrder(cur => [...cur, nextPoolIdx]);
    setCurrentPosition(cur => cur + 1);
  }

  function goBack() {
    stopSpeech();
    if (currentPosition === 0) { router.back(); return; }
    setCurrentPosition(cur => cur - 1);
    setAnswerHistory(cur => cur.slice(0, -1));
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.kicker}>{definition.title}</Text>
        <ProgressBar current={currentPosition + 1} total={session.questions.length} />
      </View>

      <Card style={styles.questionCard}>
        <View style={styles.headerRow}>
          <View style={styles.pillRow}>
            <Text style={styles.pill}>{currentQuestion.domain.replace(/-/g, ' ')}</Text>
          </View>
          {isYoungChildModule ? (
            <Pressable
              onPress={readQuestionAloud}
              style={({ pressed }) => [styles.speakButton, pressed && styles.speakButtonPressed]}
              accessibilityLabel="Read question aloud"
            >
              <Volume2 size={16} color={colors.primaryDark} strokeWidth={2.4} />
              <Text style={styles.speakButtonText}>Read aloud</Text>
            </Pressable>
          ) : null}
        </View>

        {currentQuestion.visualType ? (
          <SpatialVisual visualType={currentQuestion.visualType} params={currentQuestion.visualParams} />
        ) : null}

        <Text style={styles.prompt}>{currentQuestion.prompt}</Text>
        {currentQuestion.helperText ? <Text style={styles.helper}>{currentQuestion.helperText}</Text> : null}
      </Card>

      <View style={styles.options}>
        {currentQuestion.options.map(option => (
          <QuestionOptionCard
            key={option.id}
            option={option}
            selected={selectedOptionId === option.id}
            onPress={() => selectOption(option.id)}
          />
        ))}
      </View>

      <View style={styles.actions}>
        <AppButton title="Back" variant="secondary" onPress={goBack} style={styles.actionButton} />
        <AppButton
          title={isLastQuestion ? 'See ScoreLift Report' : 'Next'}
          onPress={goNext}
          disabled={!selectedOptionId}
          style={styles.actionButton}
        />
      </View>

      <Text style={styles.privacyNote}>
        Adaptive order — questions tune to your performance · seed {seed.slice(-8)}
      </Text>
    </Screen>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    header: { gap: 12, marginBottom: 18 },
    kicker: { color: colors.primary, fontWeight: '600', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.6 },
    emptyCard: { gap: 14 },
    title: { color: colors.ink, fontSize: 22, fontWeight: '700' },
    body: { color: colors.inkMuted, lineHeight: 22, fontSize: 14 },
    questionCard: { gap: 12, marginBottom: 16 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
    pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, flex: 1 },
    pill: {
      alignSelf: 'flex-start', overflow: 'hidden', borderRadius: 999,
      paddingHorizontal: 10, paddingVertical: 6,
      backgroundColor: colors.info, color: colors.primaryDark,
      fontSize: 12, fontWeight: '700', textTransform: 'capitalize'
    },
    speakButton: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: colors.info, paddingHorizontal: 12, paddingVertical: 7,
      borderRadius: 999, borderWidth: 1, borderColor: colors.border
    },
    speakButtonPressed: { opacity: 0.7 },
    speakButtonText: { color: colors.primaryDark, fontWeight: '600', fontSize: 12 },
    prompt: { color: colors.ink, fontSize: 21, lineHeight: 30, fontWeight: '700' },
    helper: { color: colors.inkMuted, lineHeight: 22, fontSize: 14 },
    options: { gap: 10, marginBottom: 18 },
    actions: { flexDirection: 'row', gap: 12 },
    actionButton: { flex: 1 },
    privacyNote: { color: colors.inkMuted, fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 18 }
  });
}
