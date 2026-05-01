// src/features/scoring/scoreLiftScore.ts
//
// v0.6 — NEW.
//
// The "ScoreLift Score" is the headline metric on the results screen and PDF
// cover. It is a grade-anchored 1–100 scale where 50 = on-grade-level expected
// performance for the chosen test, age, and grade.
//
// Why this design (and why not just use percent correct?):
//   - Percent correct is shown alongside this score, but it's misleading on
//     its own. 70% on a Pre-K Kindergarten Readiness test means something
//     completely different from 70% on Algebra Fast-Track.
//   - The old QuestionLiftIQ Index (70–130, mean 100, sd 15) was modelled on
//     a Wechsler IQ scale and carried unacceptable legal/positioning risk.
//   - 1–100 with 50 anchored to "on grade level" is intuitive for parents
//     and avoids any IQ-test inference.
//
// How the math works:
//   1. Each test has a per-grade expected raw percent. e.g. on Algebra
//      Fast-Track (designed to be hard), a 6th grader's expected percent is
//      ~0.45; an 8th grader's is ~0.60.
//   2. The expected percent maps to ScoreLift = 50.
//   3. Below expected: linear interpolation through three anchor points
//      (1, 20, 35) at fixed fractions of expected.
//   4. Above expected: linear interpolation through three anchor points
//      (65, 80, 100) at fixed fractions of the gap from expected to 100%.
//
// This produces a piecewise-linear monotone function that always returns
// 50 at the on-grade-level percent, regardless of which test or grade.

import { TestId } from '../assessment/types';

// ─── Per-test expected percent by grade ──────────────────────────────────────
//
// Each function takes a grade (-1 = Pre-K, 0 = K, 1–12 = grade, 20 = adult)
// and returns the expected raw percent (0–1) for an "on-grade-level" student.
//
// These are deliberately conservative starting points. They will be refined
// over time as the content matures. We never use user data for this — these
// are authored expectations based on the difficulty mix in each test
// blueprint + general grade expectations on comparable public tests.

type ExpectFn = (grade: number) => number;

function clamp01(v: number): number { return Math.max(0.05, Math.min(0.95, v)); }

export const TEST_EXPECTATIONS: Record<TestId, ExpectFn> = {
  // Broad aptitude snapshot. Slightly easier in early grades since templates
  // span a wide difficulty range; the "on grade level" student should be
  // landing around 60–65%.
  'quizlift-aptitude-snapshot': (grade) => clamp01(0.55 + (grade <= 0 ? 0.05 : Math.min(grade, 12)) * 0.012),

  // Compacted Math Readiness — designed for one grade ahead. Expected
  // performance is ~55% at the recommended grade.
  'compacted-math-readiness': (grade) => clamp01(0.50 + (grade <= 0 ? 0.0 : Math.min(grade, 8)) * 0.013),

  // Algebra Fast-Track — aggressive acceleration. Expected ~45% in grade 6,
  // ~60% in grade 8, ~70% in grade 9+.
  'double-compacted-algebra-readiness': (grade) => {
    if (grade <= 5) return 0.35;
    if (grade <= 6) return 0.45;
    if (grade <= 7) return 0.52;
    if (grade <= 8) return 0.60;
    return 0.70;
  },

  // Grade-Level Math Skills Check — should feel achievable. Expected ~70%.
  'grade-math-skills-check': () => 0.70,

  // Reading + Vocabulary — expected ~65%.
  'reading-vocabulary-snapshot': (grade) => clamp01(0.60 + (grade <= 0 ? 0.0 : Math.min(grade, 8)) * 0.008),

  // STEM + Spatial — expected ~60%, slightly higher with grade.
  'stem-spatial-reasoning': (grade) => clamp01(0.55 + (grade <= 0 ? 0.0 : Math.min(grade, 10)) * 0.010),

  // Coding Logic — expected ~58% (modest, since coding fluency is uneven).
  'coding-logic-sprint': (grade) => clamp01(0.55 + (grade <= 0 ? 0.0 : Math.min(grade, 10)) * 0.008),

  // Kindergarten Readiness — should feel mostly easy by the time a child is
  // close to K start. Expected ~75%.
  'kindergarten-readiness': () => 0.75,

  // Military Aptitude (unofficial ASVAB-style). Adult-leaning. Expected ~55%.
  'military-aptitude-practice': (grade) => clamp01(0.50 + (grade >= 12 ? 0.10 : Math.min(grade, 12) * 0.007)),
};

// ─── Score mapping ──────────────────────────────────────────────────────────

interface Anchor { pct: number; score: number; }

/**
 * Build the 7 anchor points for a given expected percent.
 * Anchors:
 *   pct=0           → score 1
 *   pct=0.40·exp    → score 20
 *   pct=0.70·exp    → score 35
 *   pct=exp         → score 50    ← on grade level
 *   pct=exp + 0.30·(1-exp) → score 65
 *   pct=exp + 0.60·(1-exp) → score 80
 *   pct=1           → score 100
 */
function thresholdsForExpectedPercent(expected: number): Anchor[] {
  const exp = clamp01(expected);
  const upGap = 1 - exp;
  return [
    { pct: 0,                    score: 1 },
    { pct: exp * 0.40,           score: 20 },
    { pct: exp * 0.70,           score: 35 },
    { pct: exp,                  score: 50 },
    { pct: exp + upGap * 0.30,   score: 65 },
    { pct: exp + upGap * 0.60,   score: 80 },
    { pct: 1,                    score: 100 },
  ];
}

/**
 * Linearly interpolate between two anchors.
 */
function interpolate(p: number, lo: Anchor, hi: Anchor): number {
  if (hi.pct === lo.pct) return lo.score;
  const t = (p - lo.pct) / (hi.pct - lo.pct);
  return lo.score + t * (hi.score - lo.score);
}

/**
 * Compute the ScoreLift Score for a session.
 * @param percent  Raw percent correct (0–1).
 * @param testId   Test identifier.
 * @param grade    Grade level (-1 = Pre-K, 0 = K, 1–12, 20 = adult).
 */
export function computeScoreLiftScore(percent: number, testId: TestId, grade: number): number {
  const expectFn = TEST_EXPECTATIONS[testId];
  const expected = expectFn ? expectFn(grade) : 0.6;
  const anchors = thresholdsForExpectedPercent(expected);

  // Walk anchors and interpolate
  for (let i = 0; i < anchors.length - 1; i++) {
    const lo = anchors[i], hi = anchors[i + 1];
    if (percent >= lo.pct && percent <= hi.pct) {
      return Math.round(interpolate(percent, lo, hi));
    }
  }
  // Edge cases
  if (percent < anchors[0].pct) return anchors[0].score;
  return anchors[anchors.length - 1].score;
}

/**
 * Short label for the score: "Well above grade" / "Above grade" / "On grade
 * level" / "Approaching grade" / "Building foundations". Tied to the
 * ScoreLift Score band thresholds (1–29 / 30–44 / 45–60 / 61–75 / 76–100).
 *
 * Note: this is independent of the percent-correct band thresholds in
 * `getBand()` — they answer different questions ("how did you do" vs
 * "what does that mean for grade level"). For v0.6 we keep them aligned in
 * spirit but separate in implementation.
 */
export function scoreLiftScoreLabel(score: number): string {
  if (score >= 76) return 'Well above grade';
  if (score >= 61) return 'Above grade';
  if (score >= 45) return 'On grade level';
  if (score >= 30) return 'Approaching grade';
  return 'Building foundations';
}
