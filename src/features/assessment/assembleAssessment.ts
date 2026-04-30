import { BlueprintSection, getBlueprint } from '../../data/testBlueprints';
import { getTemplatesForDomain, getTemplatesForTest } from '../../data/questionTemplates';
import { AssessmentQuestion, AssessmentSession, DomainId, LearnerProfile, TestId } from './types';
import { createSeededRandom, makeSessionSeed } from '../generation/seededRandom';
import { QuestionTemplate } from '../generation/questionTemplateTypes';

function difficultyDistance(template: QuestionTemplate, section: BlueprintSection): number {
  return Math.abs(template.difficulty - section.targetDifficulty);
}

function domainCandidates(testId: TestId, domain: DomainId): QuestionTemplate[] {
  const domainTemplates = getTemplatesForDomain(testId, domain);
  return domainTemplates.length > 0 ? domainTemplates : getTemplatesForTest(testId);
}

function chooseTemplate(testId: TestId, section: BlueprintSection, occurrence: number, seed: string, attempt: number): QuestionTemplate {
  const candidates = domainCandidates(testId, section.domain);
  if (candidates.length === 0) throw new Error(`No templates available for ${testId} / ${section.domain}.`);

  // v0.5.1: blueprints now actually influence generation. Prefer the exact
  // target difficulty, then +/- 1, then fall back to any template in-domain.
  const exact = candidates.filter(t => difficultyDistance(t, section) === 0);
  const near = candidates.filter(t => difficultyDistance(t, section) <= 1);
  const pool = attempt < 4 && exact.length > 0
    ? exact
    : attempt < 8 && near.length > 0
      ? near
      : candidates;

  const rng = createSeededRandom(`${seed}:${section.domain}:${section.targetDifficulty}:${occurrence}:${attempt}`);
  return pool[rng.int(0, pool.length - 1)];
}

function isAgeAppropriate(question: AssessmentQuestion, age: number): boolean {
  if (!question.ageBand) return true;
  return age >= question.ageBand.min && age <= question.ageBand.max;
}

function generateQuestion(params: {
  testId: TestId;
  profile: LearnerProfile;
  section: BlueprintSection;
  occurrence: number;
  seed: string;
}): AssessmentQuestion {
  let fallback: AssessmentQuestion | null = null;

  // Try a few equivalent templates. This avoids serving obviously older-skill
  // items to young students when an age-appropriate template is available.
  for (let attempt = 0; attempt < 10; attempt++) {
    const template = chooseTemplate(params.testId, params.section, params.occurrence, params.seed, attempt);
    const rng = createSeededRandom(`${params.seed}:${template.id}:${params.occurrence}:${attempt}`);
    const question = template.generate({
      testId: params.testId,
      profile: params.profile,
      rng,
      variantIndex: params.occurrence
    });

    fallback = fallback ?? question;
    if (isAgeAppropriate(question, params.profile.age)) return question;
  }

  // If the current content bank has no perfect age match, return the best
  // deterministic fallback instead of failing the test session.
  return fallback as AssessmentQuestion;
}

/**
 * Selects a balanced demo subset across domains. The original full session is
 * generated section-by-section, so taking the first 10 questions can over-sample
 * the first blueprint domains. Quick Start should feel broad, so we round-robin
 * across domains while keeping deterministic question variants.
 */
export function selectBalancedSample(questions: AssessmentQuestion[], sampleSize: number): AssessmentQuestion[] {
  if (!sampleSize || sampleSize >= questions.length) return questions;

  const domainOrder: DomainId[] = [];
  const buckets = new Map<DomainId, AssessmentQuestion[]>();
  questions.forEach(question => {
    if (!buckets.has(question.domain)) {
      buckets.set(question.domain, []);
      domainOrder.push(question.domain);
    }
    buckets.get(question.domain)?.push(question);
  });

  const selected: AssessmentQuestion[] = [];
  while (selected.length < sampleSize) {
    let added = false;
    for (const domain of domainOrder) {
      if (selected.length >= sampleSize) break;
      const next = buckets.get(domain)?.shift();
      if (next) {
        selected.push(next);
        added = true;
      }
    }
    if (!added) break;
  }

  return selected;
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
      questions.push(generateQuestion({
        testId: params.testId,
        profile,
        section,
        occurrence,
        seed
      }));
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
