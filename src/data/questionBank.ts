import { createAssessmentSession } from '../features/assessment/assembleAssessment';
import { AssessmentQuestion, TestId } from '../features/assessment/types';

// Backward-compatible helper. V0.3 generates questions from blueprint-driven
// templates — there is no fixed bank. This helper exists for smoke tests and
// preview tooling only.
export function getQuestionsForTest(
  testId: TestId,
  age = 10,
  grade = 5,
  seed = `${testId}:${age}:${grade}:preview`
): AssessmentQuestion[] {
  return createAssessmentSession({ testId, age, grade, seed }).questions;
}
