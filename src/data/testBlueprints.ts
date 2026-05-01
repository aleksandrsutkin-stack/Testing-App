import { DomainId, TestId } from '../features/assessment/types';

export interface BlueprintSection {
  domain: DomainId;
  questionCount: number;
  targetDifficulty: 1 | 2 | 3 | 4 | 5;
}

export interface TestBlueprint {
  testId: TestId;
  totalQuestions: number;
  sections: BlueprintSection[];
  scoreModel: 'aptitude-index' | 'readiness' | 'practice';
}

// v0.3 — all sessions bumped to 25–30 questions.
// Rationale: 25 questions with 5 domains gives 5 questions per domain,
// the minimum for domain scores to be meaningful. 18 questions gave
// only 3 per domain — too noisy to trust.

export const testBlueprints: Record<TestId, TestBlueprint> = {
  'quizlift-aptitude-snapshot': {
    testId: 'quizlift-aptitude-snapshot',
    totalQuestions: 30,
    scoreModel: 'aptitude-index',
    sections: [
      { domain: 'fluid-reasoning',  questionCount: 6, targetDifficulty: 2 },
      { domain: 'verbal',           questionCount: 6, targetDifficulty: 2 },
      { domain: 'quantitative',     questionCount: 6, targetDifficulty: 2 },
      { domain: 'visual-spatial',   questionCount: 6, targetDifficulty: 2 },
      { domain: 'working-memory',   questionCount: 6, targetDifficulty: 2 },
    ]
  },
  'compacted-math-readiness': {
    testId: 'compacted-math-readiness',
    totalQuestions: 25,
    scoreModel: 'readiness',
    sections: [
      { domain: 'number-sense',     questionCount: 5, targetDifficulty: 2 },
      { domain: 'fractions-ratios', questionCount: 7, targetDifficulty: 2 },
      { domain: 'quantitative',     questionCount: 5, targetDifficulty: 2 },
      { domain: 'geometry',         questionCount: 4, targetDifficulty: 2 },
      { domain: 'data-reasoning',   questionCount: 4, targetDifficulty: 3 },
    ]
  },
  'double-compacted-algebra-readiness': {
    testId: 'double-compacted-algebra-readiness',
    totalQuestions: 25,
    scoreModel: 'readiness',
    sections: [
      { domain: 'fractions-ratios',  questionCount: 5, targetDifficulty: 3 },
      { domain: 'algebra-readiness', questionCount: 8, targetDifficulty: 3 },
      { domain: 'quantitative',      questionCount: 5, targetDifficulty: 3 },
      { domain: 'data-reasoning',    questionCount: 4, targetDifficulty: 3 },
      { domain: 'fluid-reasoning',   questionCount: 3, targetDifficulty: 3 },
    ]
  },
  'grade-math-skills-check': {
    testId: 'grade-math-skills-check',
    totalQuestions: 25,
    scoreModel: 'practice',
    sections: [
      { domain: 'number-sense',     questionCount: 6, targetDifficulty: 2 },
      { domain: 'fractions-ratios', questionCount: 5, targetDifficulty: 2 },
      { domain: 'quantitative',     questionCount: 6, targetDifficulty: 2 },
      { domain: 'geometry',         questionCount: 4, targetDifficulty: 2 },
      { domain: 'data-reasoning',   questionCount: 4, targetDifficulty: 2 },
    ]
  },
  'reading-vocabulary-snapshot': {
    testId: 'reading-vocabulary-snapshot',
    totalQuestions: 25,
    scoreModel: 'practice',
    sections: [
      { domain: 'vocabulary',             questionCount: 8, targetDifficulty: 2 },
      { domain: 'reading-comprehension',  questionCount: 10, targetDifficulty: 2 },
      { domain: 'verbal',                 questionCount: 7, targetDifficulty: 2 },
    ]
  },
  'stem-spatial-reasoning': {
    testId: 'stem-spatial-reasoning',
    totalQuestions: 25,
    scoreModel: 'practice',
    sections: [
      { domain: 'visual-spatial',   questionCount: 8, targetDifficulty: 2 },
      { domain: 'science-reasoning',questionCount: 9, targetDifficulty: 2 },
      { domain: 'fluid-reasoning',  questionCount: 8, targetDifficulty: 2 },
    ]
  },
  'coding-logic-sprint': {
    testId: 'coding-logic-sprint',
    totalQuestions: 25,
    scoreModel: 'practice',
    sections: [
      { domain: 'coding-logic',    questionCount: 12, targetDifficulty: 2 },
      { domain: 'working-memory',  questionCount: 7,  targetDifficulty: 2 },
      { domain: 'fluid-reasoning', questionCount: 6,  targetDifficulty: 2 },
    ]
  },
  'kindergarten-readiness': {
    testId: 'kindergarten-readiness',
    totalQuestions: 20,
    scoreModel: 'readiness',
    sections: [
      { domain: 'school-readiness',  questionCount: 4, targetDifficulty: 1 },
      { domain: 'number-sense',      questionCount: 6, targetDifficulty: 1 },
      { domain: 'vocabulary',        questionCount: 6, targetDifficulty: 1 },
      { domain: 'executive-function',questionCount: 4, targetDifficulty: 1 },
    ]
  },
  'military-aptitude-practice': {
    testId: 'military-aptitude-practice',
    totalQuestions: 28,
    scoreModel: 'practice',
    sections: [
      { domain: 'verbal',               questionCount: 7, targetDifficulty: 3 },
      { domain: 'quantitative',         questionCount: 7, targetDifficulty: 3 },
      { domain: 'science-reasoning',    questionCount: 7, targetDifficulty: 3 },
      { domain: 'mechanical-reasoning', questionCount: 7, targetDifficulty: 3 },
    ]
  },
};

export function getBlueprint(testId: TestId): TestBlueprint {
  return testBlueprints[testId];
}
