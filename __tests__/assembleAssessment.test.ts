import { createAssessmentSession } from '../src/features/assessment/assembleAssessment';
import { getBlueprint } from '../src/data/testBlueprints';
import { TestId } from '../src/features/assessment/types';

const ALL_TESTS: TestId[] = [
  'quizlift-aptitude-snapshot',
  'compacted-math-readiness',
  'double-compacted-algebra-readiness',
  'grade-math-skills-check',
  'reading-vocabulary-snapshot',
  'stem-spatial-reasoning',
  'coding-logic-sprint',
  'kindergarten-readiness',
  'military-aptitude-practice',
];

describe('createAssessmentSession', () => {
  test.each(ALL_TESTS)('produces at least one question for %s', (testId) => {
    const session = createAssessmentSession({ testId, age: 10, grade: 5, seed: 'unit-test' });
    expect(session.questions.length).toBeGreaterThan(0);
  });

  test('every question has a non-empty prompt and 4 options with exactly one correct', () => {
    const session = createAssessmentSession({
      testId: 'grade-math-skills-check', age: 10, grade: 5, seed: 'shape-check',
    });
    for (const q of session.questions) {
      expect(q.prompt.length).toBeGreaterThan(0);
      expect(q.options).toHaveLength(4);
      const correctCount = q.options.filter(o => o.score === 1).length;
      expect(correctCount).toBe(1);
    }
  });

  test('same seed produces the same question IDs in the same order', () => {
    const a = createAssessmentSession({ testId: 'grade-math-skills-check', age: 10, grade: 5, seed: 'fixed' });
    const b = createAssessmentSession({ testId: 'grade-math-skills-check', age: 10, grade: 5, seed: 'fixed' });
    expect(a.questions.map(q => q.id)).toEqual(b.questions.map(q => q.id));
  });

  test('different seeds produce different question sets (sanity)', () => {
    const a = createAssessmentSession({ testId: 'grade-math-skills-check', age: 10, grade: 5, seed: 'seed-a' });
    const b = createAssessmentSession({ testId: 'grade-math-skills-check', age: 10, grade: 5, seed: 'seed-b' });
    expect(a.questions.map(q => q.id)).not.toEqual(b.questions.map(q => q.id));
  });

  test('session size is at least 75% of the blueprint target (aging filter shouldn\'t starve the pool)', () => {
    for (const testId of ALL_TESTS) {
      const target = getBlueprint(testId).totalQuestions;
      // Use a child-age that all blueprints support for kindergarten / others.
      const age = testId === 'kindergarten-readiness' ? 5 : 10;
      const grade = testId === 'kindergarten-readiness' ? 0 : 5;
      const session = createAssessmentSession({ testId, age, grade, seed: 'pool-check' });
      expect(session.questions.length).toBeGreaterThanOrEqual(Math.floor(target * 0.75));
    }
  });
});
