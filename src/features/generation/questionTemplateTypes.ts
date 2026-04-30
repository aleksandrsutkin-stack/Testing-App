import { AssessmentQuestion, DomainId, LearnerProfile, TestId } from '../assessment/types';
import { SeededRandom } from './seededRandom';

export interface QuestionGeneratorContext {
  testId: TestId;
  profile: LearnerProfile;
  rng: SeededRandom;
  variantIndex: number;
}

export interface QuestionTemplate {
  id: string;
  testIds: TestId[];
  domain: DomainId;
  skillId: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  generate: (context: QuestionGeneratorContext) => AssessmentQuestion;
}
