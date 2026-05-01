// src/features/assessment/types.ts
// v0.6: scoreLiftScore (1–100) replaces questionLiftIndex (70–130).
// 5 v0.6 band names: well-above / above / on-grade / approaching / below.
// PercentileEstimate carries a benchmarkSource (e.g. "NWEA MAP grade norms").

export type TestId =
  | 'quizlift-aptitude-snapshot'
  | 'compacted-math-readiness'
  | 'double-compacted-algebra-readiness'
  | 'grade-math-skills-check'
  | 'reading-vocabulary-snapshot'
  | 'stem-spatial-reasoning'
  | 'coding-logic-sprint'
  | 'kindergarten-readiness'
  | 'military-aptitude-practice';

export type TestCategory = 'aptitude' | 'math-readiness' | 'reading' | 'stem' | 'coding' | 'school-readiness' | 'career-aptitude';

export type DomainId =
  | 'fluid-reasoning' | 'visual-spatial' | 'verbal' | 'quantitative' | 'working-memory'
  | 'processing-speed' | 'number-sense' | 'fractions-ratios' | 'algebra-readiness'
  | 'geometry' | 'data-reasoning' | 'vocabulary' | 'reading-comprehension'
  | 'science-reasoning' | 'mechanical-reasoning' | 'coding-logic' | 'school-readiness' | 'executive-function';

export type QuestionType = 'single-choice' | 'parent-rating';

export type MistakeTag =
  | 'concept-gap' | 'procedure-error' | 'calculation-error' | 'misread-question'
  | 'vocabulary-confusion' | 'pattern-recognition' | 'time-pressure'
  | 'multi-step-reasoning' | 'attention-to-detail' | 'spatial-visualization';

export interface Range { min: number; max: number; }

export interface PracticeLink {
  provider: 'Khan Academy' | 'Internal' | 'Other';
  label: string;
  url: string;
  reason: string;
  skillId?: string;
  gradeBand?: string;
}

export interface TestDefinition {
  id: TestId;
  title: string;
  subtitle: string;
  category: TestCategory;
  recommendedAges: Range;
  recommendedGrades: Range;
  durationMinutes: number;
  questionTarget: number;
  icon: string;
  parentBenefit: string;
  studentBenefit: string;
  reportPromise: string;
  domains: DomainId[];
  practiceLinks: PracticeLink[];
  disclaimer: string;
  // v0.8: optional "Most popular" home-screen chip. Default false.
  popular?: boolean;
}

export interface QuestionOption { id: string; label: string; score: number; feedback?: string; }

export interface AssessmentQuestion {
  id: string;
  templateId: string;
  testId: TestId;
  domain: DomainId;
  skillId: string;
  type: QuestionType;
  prompt: string;
  helperText?: string;
  options: QuestionOption[];
  correctOptionId?: string;
  correctAnswerLabel: string;
  explanationSteps: string[];
  commonTrap?: string;
  wrongAnswerFeedback?: Record<string, string>;
  mistakeTags: MistakeTag[];
  practiceLinks: PracticeLink[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  ageBand: Range;
  // v0.5: optional spatial-visual hint. When present, the assessment screen
  // renders the matching SVG above the prompt. Leaves text-only questions untouched.
  visualType?: 'cube' | 'grid-3' | 'grid-4' | 'mirror-letter' | 'mirror-arrow' | 'shape' | 'count-stars';
  visualParams?: Record<string, string | number>;
}

export interface LearnerProfile { testId: TestId; age: number; grade: number; }

export interface AssessmentSession {
  testId: TestId; age: number; grade: number;
  seed: string; generatedAtIso: string; questions: AssessmentQuestion[];
}

export type ResponseMap = Record<string, string>;

// ─── v0.6: 5-band readiness model ────────────────────────────────────────────
// Replaces: 'needs-practice' | 'developing' | 'ready-soon' | 'ready' | 'advanced'
// Reasons:
//  1. "below grade / above grade" reads parent-natural and ties cleanly to
//     a 50-anchored ScoreLift Score.
//  2. Removes "Needs Practice" stigma for early elementary parents.

export type ScoreBand = 'below' | 'approaching' | 'on-grade' | 'above' | 'well-above';

export interface DomainScore {
  domain: DomainId; label: string;
  rawScore: number; maxScore: number; percent: number; band: ScoreBand;
}

// ─── v0.6: PercentileEstimate carries benchmark source ───────────────────────

export interface PercentileEstimate {
  percentile: number;
  rangeLabel: string;
  // Legacy (v0.5): kept so old code paths don't crash. New code reads benchmarkSource.
  distributionLabel: string;
  /**
   * Human-readable name of the public norm table this percentile was mapped
   * against, e.g. "NWEA MAP grade norms" or "ASVAB AFQT". Surfaced in the UI
   * and in the PDF report so parents see what the comparison is against.
   */
  benchmarkSource?: string;
  caveat: string;
}

export interface MissedQuestionReview {
  questionId: string; prompt: string; domain: DomainId; domainLabel: string; skillId: string;
  selectedOptionId?: string; selectedAnswerLabel: string;
  correctOptionId?: string; correctAnswerLabel: string;
  mistakeTags: MistakeTag[]; mistakeTypeLabel: string;
  explanationSteps: string[]; commonTrap?: string; feedback?: string;
  practiceLinks: PracticeLink[];
}

export interface PracticeAssignment {
  skillId: string; title: string; reason: string;
  provider: PracticeLink['provider']; url: string; sourceQuestionIds: string[];
}

export interface AssessmentResult {
  testId: TestId; testTitle: string; age: number; grade: number; seed: string;
  rawScore: number; maxScore: number; percent: number; percentCorrectLabel: string;

  // v0.6: NEW headline metric. 1–100 scale, 50 = on-grade-level expected
  // performance for the test/age/grade. Replaces questionLiftIndex (70–130).
  scoreLiftScore: number;
  scoreLiftScoreLabel: string;

  percentileEstimate: PercentileEstimate;
  readinessBand: ScoreBand; readinessLabel: string; summary: string;
  strengths: string[]; growthAreas: string[]; domainScores: DomainScore[];
  missedQuestions: MissedQuestionReview[]; practicePlan: PracticeAssignment[];
  retakeRecommendation: string; completedAtIso: string; disclaimer: string;
}
