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
  LearnerProfile, MissedQuestionReview, PracticeAssignment, PracticeLink,
  PriorityFix, ResponseMap, ScoreBand, ScreeningConfidence, MistakeTag
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

// ─── v0.9: Plain-English parent summary ──────────────────────────────────────
// Reads first on both the PDF and the Score tab. Neutral, encouraging voice.
// Avoids "low," "weak," "struggling," "failed."

function gradeLabelShort(g: number): string {
  if (g < 0) return 'Pre-K';
  if (g === 0) return 'Kindergarten';
  if (g <= 12) return `${g}${['th','st','nd','rd'][((g % 100 - 20) % 10 < 0 || (g % 100 - 20) % 10 > 3) ? 0 : (g % 100 - 20) % 10] ?? 'th'} grade`;
  return 'adult';
}

function buildParentSummary(args: {
  band: ScoreBand;
  testTitle: string;
  grade: number;
  topDomain: string;
  bottomDomain: string;
}): string {
  const { band, testTitle, grade, topDomain, bottomDomain } = args;
  const gradeStr = gradeLabelShort(grade);
  const sameTop = topDomain === bottomDomain;
  switch (band) {
    case 'well-above':
      return `Strong performance — well above what we'd expect for a ${gradeStr} student on this ${testTitle}. Strongest in ${topDomain}${sameTop ? '' : `; consider stretching with harder material in ${bottomDomain} too`}.`;
    case 'above':
      return `Above grade-level performance. Strongest in ${topDomain}.${sameTop ? ' Use the Mistake Map to lock in the few items missed.' : ` The biggest opportunity for growth is in ${bottomDomain} — see the Mistake Map for specifics.`}`;
    case 'on-grade':
      return `On track for a ${gradeStr} student. Strongest in ${topDomain}.${sameTop ? ' The Mistake Map shows where to focus practice next.' : ` The clearest place to focus practice is ${bottomDomain} — the Mistake Map shows exactly where.`}`;
    case 'approaching':
      return `Approaching grade-level expectations. Encouraging signs in ${topDomain}.${sameTop ? ' The Mistake Map and 7-day plan focus on what to fix first.' : ` The Mistake Map highlights the steps in ${bottomDomain} that need the most attention right now.`}`;
    case 'below':
    default:
      return `Foundations are still building. Brightest area is ${topDomain}.${sameTop ? ' The Mistake Map and 7-day plan focus on the most important fixes first — small wins build confidence.' : ` The Mistake Map and 7-day plan focus on the most important fixes in ${bottomDomain} first — small wins build confidence.`}`;
  }
}

// ─── v0.9: Top 3 priority fixes ──────────────────────────────────────────────
// Group missed questions by skill. Score each skill by impact (misses + difficulty).
// Map the dominant mistake tag to a plain-English cause.

const MISTAKE_RATIONALES: Record<MistakeTag, string> = {
  'concept-gap':            'this skill needs concept review',
  'procedure-error':        'the procedure is partly known but applied incorrectly',
  'calculation-error':      'the approach is right; arithmetic accuracy needs work',
  'multi-step-reasoning':   'the issue is keeping track across multiple steps',
  'attention-to-detail':    'the question was misread or a detail was skipped',
  'vocabulary-confusion':   'a key word was misunderstood',
  'pattern-recognition':    'the underlying pattern wasn\'t spotted',
  'spatial-visualization':  'mental rotation/visualization needs practice',
  'misread-question':       'the question was misinterpreted',
  'time-pressure':          'speed is fine; accuracy under pause is the goal',
  'reading-comprehension':  'the passage needs a closer second read',
  'spatial-reasoning':      'the geometric/spatial setup needs more practice',
  'science-reasoning':      'the underlying science concept needs review',
};

function dominantMistakeTag(tags: MistakeTag[][]): MistakeTag | null {
  const counts = new Map<MistakeTag, number>();
  for (const list of tags) for (const t of list) counts.set(t, (counts.get(t) ?? 0) + 1);
  let best: MistakeTag | null = null; let bestCount = 0;
  for (const [t, c] of counts) if (c > bestCount) { best = t; bestCount = c; }
  return best;
}

function skillLabelFromMissed(missed: MissedQuestionReview[]): string {
  // Use the practice link label if available, else fall back to the skillId
  // formatted as title case.
  const first = missed[0];
  const link = first?.practiceLinks?.[0];
  if (link) return link.label;
  return first.skillId
    .split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function computePriorityFixes(missed: MissedQuestionReview[], questions: AssessmentQuestion[]): PriorityFix[] {
  if (missed.length === 0) return [];
  const bySkill = new Map<string, { missed: MissedQuestionReview[]; difficulties: number[] }>();
  for (const m of missed) {
    const cur = bySkill.get(m.skillId) ?? { missed: [], difficulties: [] };
    cur.missed.push(m);
    const q = questions.find(qq => qq.id === m.questionId);
    if (q) cur.difficulties.push(q.difficulty);
    bySkill.set(m.skillId, cur);
  }

  type Scored = { skillId: string; impact: number; data: { missed: MissedQuestionReview[]; difficulties: number[] } };
  const scored: Scored[] = [];
  for (const [skillId, data] of bySkill) {
    const avgDiff = data.difficulties.length
      ? data.difficulties.reduce((a, b) => a + b, 0) / data.difficulties.length
      : 3;
    const impact = data.missed.length * 2 + avgDiff;
    scored.push({ skillId, impact, data });
  }
  scored.sort((a, b) => b.impact - a.impact);

  return scored.slice(0, 3).map(({ skillId, data }) => {
    const dominant = dominantMistakeTag(data.missed.map(m => m.mistakeTags));
    const rationale = dominant
      ? `${data.missed.length} missed in this skill — ${MISTAKE_RATIONALES[dominant]}.`
      : `${data.missed.length} missed in this skill.`;
    const practiceLink: PracticeLink | undefined = data.missed[0].practiceLinks[0];
    return {
      skillId,
      skillLabel: skillLabelFromMissed(data.missed),
      domainLabel: data.missed[0].domainLabel,
      rationale,
      practiceLink,
      missedCount: data.missed.length,
    };
  });
}

// ─── v0.9: Screening confidence ──────────────────────────────────────────────

function computeConfidence(totalQuestions: number): ScreeningConfidence {
  if (totalQuestions < 15) return 'low';
  if (totalQuestions < 30) return 'moderate';
  return 'stronger';
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

  // v0.9: Unified, directional caveat. Replaces the per-test caveat text so
  // every report reads the same credibility-honest line.
  const v9Caveat = `Directional comparison using public benchmark-style tables (${benchmark.source}). Not an official score from NWEA, IAAT, ASVAB, or any QuizLift-specific norming.`;
  const percentileEstimate = {
    percentile: benchmark.percentile,
    rangeLabel: benchmark.rangeLabel,
    distributionLabel: benchmark.source,        // legacy field; same value
    benchmarkSource: benchmark.source,           // v0.6: new explicit field
    caveat: v9Caveat,
  };

  const domainScores = Array.from(accumulators.values()).map<DomainScore>(s => {
    const dp = s.maxScore > 0 ? s.rawScore / s.maxScore : 0;
    return { domain: s.domain, label: domainLabels[s.domain], rawScore: s.rawScore, maxScore: s.maxScore, percent: dp, band: getBand(dp) };
  });

  const strengths = buildStrengths(domainScores);
  const growthAreas = buildGrowthAreas(domainScores);
  const missedQuestions = buildMissedQuestions(params.questions, params.responses);
  const practicePlan = buildPracticePlan(missedQuestions, growthAreas);

  // v0.9: parent summary uses strongest + weakest domain labels.
  const ranked = [...domainScores].sort((a, b) => b.percent - a.percent);
  const topDomain = ranked[0]?.label ?? 'this skill area';
  const bottomDomain = ranked[ranked.length - 1]?.label ?? topDomain;
  const parentSummary = buildParentSummary({
    band: readiness.band,
    testTitle: definition.title,
    grade: params.profile.grade,
    topDomain,
    bottomDomain,
  });

  // v0.9: top 3 priority fixes + screening confidence.
  const topPriorityFixes = computePriorityFixes(missedQuestions, params.questions);
  const screeningConfidence = computeConfidence(params.questions.length);

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
    // v0.9: Unified credibility paragraph appended to every test's
    // disclaimer. Test-specific copy stays canonical; the v0.9 paragraph
    // reads the same on every report so the credibility statement is
    // consistent regardless of which test the parent took.
    disclaimer: `${definition.disclaimer} QuizLift gives a directional benchmark range using public norm-style reference tables (${benchmark.source}). It is not an official score from those publishers, and is not a clinical IQ test, gifted-program admission decision, or school placement instrument. Confidence in the result depends on test length — see the screening confidence label.`,
    // v0.9
    parentSummary,
    topPriorityFixes,
    screeningConfidence,
    preparedFor: params.profile.preparedFor,
  };
}
