import {
  computeScoreLiftScore,
  scoreLiftScoreLabel,
  TEST_EXPECTATIONS,
} from '../src/features/scoring/scoreLiftScore';

describe('computeScoreLiftScore', () => {
  test('returns 1 at percent=0 for any test+grade', () => {
    expect(computeScoreLiftScore(0, 'grade-math-skills-check', 5)).toBe(1);
    expect(computeScoreLiftScore(0, 'kindergarten-readiness', 0)).toBe(1);
  });

  test('returns 100 at percent=1 for any test+grade', () => {
    expect(computeScoreLiftScore(1, 'grade-math-skills-check', 5)).toBe(100);
    expect(computeScoreLiftScore(1, 'double-compacted-algebra-readiness', 8)).toBe(100);
  });

  test('returns 50 when percent equals the on-grade-level expectation', () => {
    // Grade-Level Math expects 0.70 at any grade.
    expect(computeScoreLiftScore(0.70, 'grade-math-skills-check', 5)).toBe(50);
    // Algebra Fast-Track expects 0.45 at grade 6 (per TEST_EXPECTATIONS table).
    expect(computeScoreLiftScore(0.45, 'double-compacted-algebra-readiness', 6)).toBe(50);
  });

  test('is monotone non-decreasing across percent for a fixed test+grade', () => {
    let prev = -Infinity;
    for (let p = 0; p <= 1.0001; p += 0.05) {
      const s = computeScoreLiftScore(p, 'quizlift-aptitude-snapshot', 5);
      expect(s).toBeGreaterThanOrEqual(prev);
      prev = s;
    }
  });

  test('is in [1, 100] for any percent and clamps out-of-range input', () => {
    const tests: Array<[number, number]> = [[-0.5, 1], [1.5, 100]];
    for (const [pct, expected] of tests) {
      expect(computeScoreLiftScore(pct, 'grade-math-skills-check', 5)).toBe(expected);
    }
  });
});

describe('TEST_EXPECTATIONS', () => {
  test('has an entry for every TestId in the registry', () => {
    const ids = Object.keys(TEST_EXPECTATIONS);
    expect(ids).toContain('quizlift-aptitude-snapshot');
    expect(ids).toContain('compacted-math-readiness');
    expect(ids).toContain('double-compacted-algebra-readiness');
    expect(ids).toContain('grade-math-skills-check');
    expect(ids).toContain('reading-vocabulary-snapshot');
    expect(ids).toContain('stem-spatial-reasoning');
    expect(ids).toContain('coding-logic-sprint');
    expect(ids).toContain('kindergarten-readiness');
    expect(ids).toContain('military-aptitude-practice');
    expect(ids).toHaveLength(9);
  });

  test('returns a value in (0, 1) for every test at a typical grade', () => {
    for (const [id, fn] of Object.entries(TEST_EXPECTATIONS)) {
      const v = fn(5);
      expect(v).toBeGreaterThan(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('scoreLiftScoreLabel', () => {
  test.each([
    [10, 'Building foundations'],
    [29, 'Building foundations'],
    [30, 'Approaching grade'],
    [44, 'Approaching grade'],
    [45, 'On grade level'],
    [50, 'On grade level'],
    [60, 'On grade level'],
    [61, 'Above grade'],
    [75, 'Above grade'],
    [76, 'Well above grade'],
    [100, 'Well above grade'],
  ])('score %i → "%s"', (score, label) => {
    expect(scoreLiftScoreLabel(score)).toBe(label);
  });
});
