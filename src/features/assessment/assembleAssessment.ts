import { getBlueprint } from '../../data/testBlueprints';
import { getTemplatesForDomain, getTemplatesForTest } from '../../data/questionTemplates';
import { AssessmentQuestion, AssessmentSession, DomainId, LearnerProfile, TestId } from './types';
import { createSeededRandom, makeSessionSeed } from '../generation/seededRandom';

function chooseTemplate(testId: TestId, domain: DomainId, occurrence: number, seed: string) {
  const domainTemplates = getTemplatesForDomain(testId, domain);
  const candidates = domainTemplates.length > 0 ? domainTemplates : getTemplatesForTest(testId);
  if (candidates.length === 0) throw new Error(`No templates available for ${testId} / ${domain}.`);
  const rng = createSeededRandom(`${seed}:${domain}:${occurrence}`);
  return candidates[rng.int(0, candidates.length - 1)];
}

export function createAssessmentSession(params: {
  testId: TestId;
  age: number;
  grade: number;
  seed?: string;
}): AssessmentSession {
  const seed = params.seed ?? makeSessionSeed(params.testId, params.age, params.grade);
  const blueprint = getBlueprint(params.testId);
  const profile: LearnerProfile = { testId: params.testId, age: params.age, grade: params.grade };
  const questions: AssessmentQuestion[] = [];

  blueprint.sections.forEach(section => {
    for (let i = 0; i < section.questionCount; i++) {
      const occurrence = questions.length + 1;
      const template = chooseTemplate(params.testId, section.domain, occurrence, seed);
      const rng = createSeededRandom(`${seed}:${template.id}:${occurrence}`);
      questions.push(template.generate({ testId: params.testId, profile, rng, variantIndex: occurrence }));
    }
  });

  return {
    testId: params.testId,
    age: params.age,
    grade: params.grade,
    seed,
    generatedAtIso: new Date().toISOString(),
    questions: questions.slice(0, blueprint.totalQuestions)
  };
}
