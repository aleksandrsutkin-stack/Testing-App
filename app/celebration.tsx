// app/celebration.tsx
//
// 1.7-second finish-the-test moment. Live-scores the responses, counts the
// percent correct from 0 → final, animates a check, then forwards to /results.
// Always-dark by design (the celebration screen is its own visual moment).

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { createAssessmentSession } from '../src/features/assessment/assembleAssessment';
import { scoreAssessment } from '../src/features/assessment/scoreAssessment';
import { ResponseMap, TestId } from '../src/features/assessment/types';

function firstParam(value: string | string[] | undefined, fallback: string): string {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

export default function CelebrationScreen() {
  const params = useLocalSearchParams();
  const testId = firstParam(params.testId, 'quizlift-aptitude-snapshot') as TestId;
  const age = Number(firstParam(params.age, '10'));
  const grade = Number(firstParam(params.grade, '5'));
  const seed = firstParam(params.seed, '');
  const responsesJson = firstParam(params.responses, '{}');
  const sampleSize = firstParam(params.sampleSize, '');

  // Score quickly so we have a real percent to count up to
  const finalPercent = useMemo(() => {
    try {
      const responses: ResponseMap = JSON.parse(responsesJson);
      const session = createAssessmentSession({ testId, age, grade, seed });
      const questions = sampleSize ? session.questions.slice(0, Number(sampleSize)) : session.questions;
      const result = scoreAssessment({ profile: { testId, age, grade }, questions, responses, seed });
      return Math.round(result.percent * 100);
    } catch {
      return 0;
    }
  }, [testId, age, grade, seed, responsesJson, sampleSize]);

  const [displayPercent, setDisplayPercent] = useState(0);
  const checkScale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cardOpacity, {
      toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true
    }).start();

    Animated.sequence([
      Animated.delay(180),
      Animated.parallel([
        Animated.timing(checkOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(checkScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true })
      ])
    ]).start();

    const totalMs = 900;
    const steps = 30;
    const stepMs = totalMs / steps;
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      const progress = i / steps;
      const eased = 1 - Math.pow(1 - progress, 2.4);
      setDisplayPercent(Math.round(finalPercent * eased));
      if (i >= steps) {
        setDisplayPercent(finalPercent);
        clearInterval(interval);
      }
    }, stepMs);

    const forwardTimer = setTimeout(() => {
      router.replace({
        pathname: '/results',
        params: {
          testId, age: String(age), grade: String(grade), seed,
          responses: responsesJson,
          ...(sampleSize ? { sampleSize } : {})
        }
      });
    }, 1700);

    return () => {
      clearInterval(interval);
      clearTimeout(forwardTimer);
    };
  }, [finalPercent, testId, age, grade, seed, responsesJson, sampleSize, cardOpacity, checkOpacity, checkScale]);

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.card, { opacity: cardOpacity }]}>
        <Animated.View style={[styles.checkBubble, { opacity: checkOpacity, transform: [{ scale: checkScale }] }]}>
          <Check size={48} color="#FFFFFF" strokeWidth={3} />
        </Animated.View>
        <Text style={styles.title}>All done!</Text>
        <Text style={styles.percent}>{displayPercent}%</Text>
        <Text style={styles.subtitle}>Calculating your ScoreLift Report…</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1, backgroundColor: '#1E1B4B',
    alignItems: 'center', justifyContent: 'center', padding: 24
  },
  card: { alignItems: 'center', gap: 14 },
  checkBubble: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#10B981',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    shadowColor: '#10B981', shadowOpacity: 0.5, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }
  },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '700' },
  percent: { color: '#A5B4FC', fontSize: 64, fontWeight: '700', lineHeight: 70 },
  subtitle: { color: '#C7D2FE', fontSize: 14, fontWeight: '500', marginTop: 8 }
});
