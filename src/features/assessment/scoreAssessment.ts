// src/features/assessment/scoreAssessment.ts
//
// v0.6: Migrated to ScoreLift Score + external benchmark percentiles.
// The old QuestionLiftIQ Index (toIndex) and static-distribution percentile
// estimation are gone. Now we use:
//   - computeScoreLiftScore(percent, testId, grade)  for the 1–100 headline
//   - estimatePercentile(percent, testId)            for directional percentile
//
// The result still exposes the same shape (just with `scoreLiftScore` instead
// of `questionLiftIndex`), so consumers (results screen, PDF, history) all
// migrate together.

import { getTestDefinition } from '../../data/testCatalog';
import { practiceLink } from '../../data/practiceLibrary';
import { computeScoreLiftScore, scoreLiftScoreLabel } from '../scoring/scoreLiftScore';
import { estimatePercentile } from '../scoring/externalBenchmarks';
import {
  AssessmentQuestion, AssessmentResult, DomainId, DomainScore,
  LearnerProfile, MissedQuestionReview, PracticeAssignment, ResponseMap, ScoreBand
} from './types';
import { domainLabels, getBand, getMistakeTypeLabel, scoreBandLabels } from './domainLabels';

interface DomainAccumulator { domain: DomainId; rawScore: number; maxScore: number; }

function optionScore(q: AssessmentQuestion, id: string | undefined): number {
  if (!id) return 0;
  return q.options.find(o => o.id === id)?.score ?? 0;
}
function maxQuestionScore(q: AssessmentQuestion): number {
  return Math.max(...q.options.map(o => o.score), 1);
}
function selectedAnswerLabel(q: AssessmentQuestion, id: string | undefined): string {
  if (!id) return 'No answer selected';
  return q.options.find(o => o.id === id)?.label ?? 'Unknown';
}

function buildStrengths(scores: DomainScore[]): string[] {
  return [...scores].sort((a, b) => b.percent - a.percent)
    .slice(0, 3)
    .map(s => `${s.label}: ${scoreBandLabels[s.band]} (${Math.round(s.percent * 100)}%)`);
}
function buildGrowthAreas(scores: DomainScore[]): string[] {
  return [...scores].sort((a, b) => a.percent - b.percent)
    .slice(0, 3)
    .map(s => `${s.label}: review this first (${Math.round(s.percent * 100)}%)`);
}

function buildMissedQuestions(questions: AssessmentQuestion[], responses: ResponseMap): MissedQuestionReview[] {
  return questions
    .filter(q => optionScore(q, responses[q.id]) < maxQuestionScore(q))
    .map(q => {
      const selectedId = responses[q.id];
      return {
        questionId: q.id, prompt: q.prompt, domain: q.domain,
        domainLabel: domainLabels[q.domain], skillId: q.skillId,
        selectedOptionId: selectedId,
        selectedAnswerLabel: selectedAnswerLabel(q, selectedId),
        correctOptionId: q.correctOptionId, correctAnswerLabel: q.correctAnswerLabel,
        mistakeTags: q.mistakeTags, mistakeTypeLabel: getMistakeTypeLabel(q.mistakeTags),
        explanationSteps: q.explanationSteps, commonTrap: q.commonTrap,
        feedback: selectedId ? q.wrongAnswerFeedback?.[selectedId] : undefined,
        practiceLinks: q.practiceLinks
      };
    });
}

function buildPracticePlan(missed: MissedQuestionReview[], growth: string[]): PracticeAssignment[] {
  const bySkill = new Map<string, PracticeAssignment>();
  missed.forEach(miss => {
    const link = miss.practiceLinks[0] ?? practiceLink(miss.skillId);
    const existing = bySkill.get(miss.skillId);
    if (existing) { existing.sourceQuestionIds.push(miss.questionId); return; }
    bySkill.set(miss.skillId, {
      skillId: miss.skillId, title: link.label,
      reason: `${miss.domainLabel}: ${link.reason}`,
      provider: link.provider, url: link.url, sourceQuestionIds: [miss.questionId]
    });
  });
  if (bySkill.size === 0) {
    growth.forEach((area, i) => {
      const link = practiceLink('pattern-reasoning');
      bySkill.set(`review-${i}`, { skillId: `review-${i}`, title: 'Keep skills fresh', reason: area, provider: link.provider, url: link.url, sourceQuestionIds: [] });
    });
  }
  return Array.from(bySkill.values()).slice(0, 6);
}

function buildSummary(p: { percent: number; readinessLabel: string; percentileRange: string; missedCount: number }): string {
  const pct = Math.round(p.percent * 100);
  if (p.percent >= 0.85) return `Strong result: ${pct}% correct, estimated around the ${p.percentileRange} range. Review the few misses, then try a harder sprint or related module.`;
  if (p.percent >= 0.70) return `Above-grade result: ${pct}% correct, estimated around the ${p.percentileRange} range. The ScoreLift plan focuses on the ${p.missedCount} missed questions.`;
  if (p.percent >= 0.50) return `On grade level: ${pct}% correct, estimated around the ${p.percentileRange} range. A targeted week of practice on the missed-question patterns should help before retaking.`;
  if (p.percent >= 0.30) return `Approaching grade: ${pct}% correct. The most valuable next step is reviewing the Mistake Map and practising the skills linked below.`;
  return `Building foundations: ${pct}% correct. Start with the first two growth areas and work through the step-by-step solutions before retaking.`;
}

function buildRetake(percent: number, missedCount: number): string {
  if (percent >= 0.85) return 'Retake with a harder or adjacent module when ready.';
  if (missedCount <= 2) return 'Review the missed solutions, practise for one short session, then take a new randomised retake sprint.';
  if (percent >= 0.50) return 'Practise the top 2–3 weak skills for 3–4 days, then retake with new numbers and equivalent difficulty.';
  return 'Work through the step-by-step solutions and practice links for 5–7 days before retaking.';
}

function readinessFromPercent(percent: number): { band: ScoreBand; label: string } {
  const band = getBand(percent);
  return { band, label: scoreBandLabels[band] };
}

export function scoreAssessment(params: {
  profile: LearnerProfile; questions: AssessmentQuestion[]; responses: ResponseMap; seed: string;
}): AssessmentResult {
  const definition = getTestDefinition(params.profile.testId);
  if (!definition) throw new Error(`Unknown test: ${params.profile.testId}`);

  const accumulators = new Map<DomainId, DomainAccumulator>();
  let rawScore = 0, maxScore = 0;

  params.questions.forEach(q => {
    const score = optionScore(q, params.responses[q.id]);
    const qMax = maxQuestionScore(q);
    rawScore += score; maxScore += qMax;
    const cur = accumulators.get(q.domain) ?? { domain: q.domain, rawScore: 0, maxScore: 0 };
    cur.rawScore += score; cur.maxScore += qMax;
    accumulators.set(q.domain, cur);
  });

  const percent = maxScore > 0 ? rawScore / maxScore : 0;
  const readiness = readinessFromPercent(percent);

  // v0.6: NEW score and percentile
  const scoreLiftScore = computeScoreLiftScore(percent, params.profile.testId, params.profile.grade);
  const scoreLiftScoreLbl = scoreLiftScoreLabel(scoreLiftScore);
  const benchmark = estimatePercentile(percent, params.profile.testId);

  const percentileEstimate = {
    percentile: benchmark.percentile,
    rangeLabel: benchmark.rangeLabel,
    distributionLabel: benchmark.source,        // legacy field; same value
    benchmarkSource: benchmark.source,           // v0.6: new explicit field
    caveat: benchmark.caveat,
  };

  const domainScores = Array.from(accumulators.values()).map<DomainScore>(s => {
    const dp = s.maxScore > 0 ? s.rawScore / s.maxScore : 0;
    return { domain: s.domain, label: domainLabels[s.domain], rawScore: s.rawScore, maxScore: s.maxScore, percent: dp, band: getBand(dp) };
  });

  const strengths = buildStrengths(domainScores);
  const growthAreas = buildGrowthAreas(domainScores);
  const missedQuestions = buildMissedQuestions(params.questions, params.responses);
  const practicePlan = buildPracticePlan(missedQuestions, growthAreas);

  return {
    testId: params.profile.testId, testTitle: definition.title,
    age: params.profile.age, grade: params.profile.grade, seed: params.seed,
    rawScore, maxScore, percent,
    percentCorrectLabel: `${Math.round(percent * 100)}%`,
    scoreLiftScore,
    scoreLiftScoreLabel: scoreLiftScoreLbl,
    percentileEstimate,
    readinessBand: readiness.band, readinessLabel: readiness.label,
    summary: buildSummary({ percent, readinessLabel: readiness.label, percentileRange: percentileEstimate.rangeLabel, missedCount: missedQuestions.length }),
    strengths, growthAreas, domainScores, missedQuestions, practicePlan,
    retakeRecommendation: buildRetake(percent, missedQuestions.length),
    completedAtIso: new Date().toISOString(),
    disclaimer: `${definition.disclaimer} ${percentileEstimate.caveat}`
  };
}
