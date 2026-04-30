// src/features/assessment/adaptiveSelector.ts
//
// v0.6 — NEW.
//
// Adaptive *presentation order*. The blueprint still controls the total mix
// of questions (same skills, same domains, same total count). What this
// module does is decide which question to show *next* given how the student
// has done on the most recent three.
//
// The rules:
//   - First question: the one with difficulty closest to 3 (medium).
//   - After ≥2 answers: rolling 3-question accuracy decides target difficulty.
//       ≥0.80  → step UP   (target = lastDifficulty + 1, capped at 5)
//       ≤0.40  → step DOWN (target = lastDifficulty - 1, floored at 1)
//       else   → maintain  (target = lastDifficulty)
//   - From the remaining unanswered pool, pick the question whose difficulty
//     is closest to the target. Ties broken by original blueprint index, so
//     the order is fully deterministic for a given (seed, answer pattern).
//
// Why not full computer-adaptive testing (CAT)?
//   - We want percent-correct to remain meaningful and comparable across
//     attempts. CAT introduces hidden item-difficulty estimation that the
//     parent can't see. Adaptive *ordering* is much more transparent.
//   - It's compatible with the seed-deterministic retake design: the same
//     set of questions is asked, just in a kinder/harder order.
//
// This module is pure — no state lives here. The caller (assessment.tsx)
// holds the answer history and presentation order, and calls these helpers
// to compute the next index.

import { AssessmentQuestion } from './types';

export interface AdaptiveAnswerHistory {
  questionId: string;
  difficulty: number;
  isCorrect: boolean;
}

const TARGET_INITIAL = 3;     // medium
const STEP_UP_THRESHOLD = 0.80;
const STEP_DOWN_THRESHOLD = 0.40;
const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 5;

/**
 * Compute the next target difficulty given recent answer history.
 * Looks at the last 3 answers (or fewer if the user hasn't answered 3 yet).
 */
export function computeTargetDifficulty(history: AdaptiveAnswerHistory[]): number {
  if (history.length === 0) return TARGET_INITIAL;
  const recent = history.slice(-3);
  const correctCount = recent.filter(h => h.isCorrect).length;
  const accuracy = correctCount / recent.length;
  const last = recent[recent.length - 1];

  if (accuracy >= STEP_UP_THRESHOLD) {
    return Math.min(MAX_DIFFICULTY, last.difficulty + 1);
  }
  if (accuracy <= STEP_DOWN_THRESHOLD) {
    return Math.max(MIN_DIFFICULTY, last.difficulty - 1);
  }
  return last.difficulty;
}

/**
 * Pick the index of the first question to show. Always the question whose
 * difficulty is closest to TARGET_INITIAL, with ties broken by original index.
 */
export function pickInitialQuestion(pool: AssessmentQuestion[]): number {
  if (pool.length === 0) return 0;
  let bestIdx = 0;
  let bestDist = Math.abs(pool[0].difficulty - TARGET_INITIAL);
  for (let i = 1; i < pool.length; i++) {
    const d = Math.abs(pool[i].difficulty - TARGET_INITIAL);
    if (d < bestDist) { bestDist = d; bestIdx = i; }
  }
  return bestIdx;
}

/**
 * Pick the index (in `pool`) of the next question to show, given the IDs
 * already answered and the answer history.
 *
 * Returns -1 if there are no remaining unanswered questions.
 */
export function pickNextQuestion(
  pool: AssessmentQuestion[],
  answeredIds: Set<string>,
  history: AdaptiveAnswerHistory[]
): number {
  const target = computeTargetDifficulty(history);

  let bestIdx = -1;
  let bestDist = Number.POSITIVE_INFINITY;

  for (let i = 0; i < pool.length; i++) {
    if (answeredIds.has(pool[i].id)) continue;
    const d = Math.abs(pool[i].difficulty - target);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }

  return bestIdx;
}
