// src/data/sampleReport.ts
//
// v0.9 — Hardcoded sample AssessmentResult for the home-screen preview and
// the /sample-report screen. The persona is "Alex, 4th grade, Compacted
// Math Readiness" landing in the on-grade band — chosen because it shows
// off every section of the report without leading parents to assume their
// child will land in the highest tier.
//
// Test coverage: kept sample-data integrity in the smoke test so this
// stays a valid AssessmentResult shape as the type evolves.

import { AssessmentResult } from '../features/assessment/types';

export const SAMPLE_RESULT: AssessmentResult = {
  testId: 'compacted-math-readiness',
  testTitle: 'Compacted Math Readiness',
  age: 10,
  grade: 4,
  seed: 'sample-static-seed',
  rawScore: 16,
  maxScore: 25,
  percent: 0.64,
  percentCorrectLabel: '64%',

  scoreLiftScore: 62,
  scoreLiftScoreLabel: 'On grade level',

  percentileEstimate: {
    percentile: 58,
    rangeLabel: '50th–60th',
    distributionLabel: 'NWEA MAP grade math norms',
    benchmarkSource: 'NWEA MAP grade math norms',
    caveat: 'Directional comparison using public benchmark-style tables (NWEA MAP grade math norms). Not an official score from NWEA, IAAT, ASVAB, or any QuizLift-specific norming.',
  },

  readinessBand: 'on-grade',
  readinessLabel: 'On grade level',
  summary: 'On grade level: 64% correct, estimated around the 50th–60th range. A targeted week of practice on the missed-question patterns should help before retaking.',

  strengths: [
    'Number Sense: On grade level (78%)',
    'Geometry: On grade level (75%)',
    'Data & Statistics: On grade level (60%)',
  ],
  growthAreas: [
    'Fractions & Ratios: review this first (40%)',
    'Quantitative Reasoning: review this first (50%)',
    'Geometry: review this first (75%)',
  ],
  domainScores: [
    { domain: 'number-sense',     label: 'Number Sense',           rawScore: 7, maxScore: 9,  percent: 0.78, band: 'above'      },
    { domain: 'fractions-ratios', label: 'Fractions & Ratios',     rawScore: 2, maxScore: 5,  percent: 0.40, band: 'approaching' },
    { domain: 'quantitative',     label: 'Quantitative Reasoning', rawScore: 3, maxScore: 6,  percent: 0.50, band: 'on-grade'   },
    { domain: 'geometry',         label: 'Geometry',               rawScore: 3, maxScore: 4,  percent: 0.75, band: 'above'      },
    { domain: 'data-reasoning',   label: 'Data & Statistics',      rawScore: 1, maxScore: 1,  percent: 1.00, band: 'well-above' },
  ],

  missedQuestions: [
    {
      questionId: 'sample-miss-1',
      prompt: 'Aiden made 3 cups of pancake batter for 12 muffins. How many cups does he need for 36 muffins?',
      domain: 'fractions-ratios',
      domainLabel: 'Fractions & Ratios',
      skillId: 'fractions-ratios',
      selectedOptionId: 'b',
      selectedAnswerLabel: '6 cups',
      correctOptionId: 'a',
      correctAnswerLabel: '9 cups',
      mistakeTags: ['multi-step-reasoning'],
      mistakeTypeLabel: 'Multi-step reasoning',
      explanationSteps: [
        'Find the ratio: 3 cups makes 12 muffins, so 1 cup makes 4 muffins.',
        '36 muffins ÷ 4 = 9, so 9 cups are needed.',
      ],
      commonTrap: 'Doubling the original recipe instead of tripling.',
      practiceLinks: [
        { provider: 'Khan Academy', label: 'Ratios and rates', url: 'https://www.khanacademy.org/math/pre-algebra/pre-algebra-ratios-rates', reason: 'Practice scaling recipes and equivalent ratios.' },
      ],
    },
    {
      questionId: 'sample-miss-2',
      prompt: 'A pizza is cut into 8 equal slices. Maya eats 3 slices. What fraction did she eat?',
      domain: 'fractions-ratios',
      domainLabel: 'Fractions & Ratios',
      skillId: 'fractions-ratios',
      selectedOptionId: 'c',
      selectedAnswerLabel: '3/5',
      correctOptionId: 'a',
      correctAnswerLabel: '3/8',
      mistakeTags: ['concept-gap'],
      mistakeTypeLabel: 'Concept gap',
      explanationSteps: [
        'The denominator is the total number of equal pieces — 8.',
        'The numerator is what Maya ate — 3.',
        'So Maya ate 3/8 of the pizza.',
      ],
      practiceLinks: [
        { provider: 'Khan Academy', label: 'Equivalent fractions', url: 'https://www.khanacademy.org/math/arithmetic', reason: 'Practice naming and comparing fractions.' },
      ],
    },
    {
      questionId: 'sample-miss-3',
      prompt: 'A class has 30 pencils. The teacher gives 4 pencils to each of 5 students. How many pencils are left?',
      domain: 'quantitative',
      domainLabel: 'Quantitative Reasoning',
      skillId: 'arithmetic-operations',
      selectedOptionId: 'd',
      selectedAnswerLabel: '14',
      correctOptionId: 'b',
      correctAnswerLabel: '10',
      mistakeTags: ['multi-step-reasoning', 'calculation-error'],
      mistakeTypeLabel: 'Multi-step reasoning',
      explanationSteps: [
        'Step 1: Total given away = 4 × 5 = 20.',
        'Step 2: Pencils left = 30 − 20 = 10.',
      ],
      commonTrap: 'Stopping after one operation. Two-step problems need both.',
      practiceLinks: [
        { provider: 'Khan Academy', label: 'Multi-step word problems', url: 'https://www.khanacademy.org/math/arithmetic', reason: 'Practice tracking each step in word problems.' },
      ],
    },
  ],

  practicePlan: [
    { skillId: 'fractions-ratios',     title: 'Ratios and rates',         reason: 'Fractions & Ratios: scaling recipes and equivalent ratios.', provider: 'Khan Academy', url: 'https://www.khanacademy.org/math/pre-algebra/pre-algebra-ratios-rates', sourceQuestionIds: ['sample-miss-1'] },
    { skillId: 'fractions-ratios',     title: 'Equivalent fractions',     reason: 'Fractions & Ratios: naming fractions of a whole.',          provider: 'Khan Academy', url: 'https://www.khanacademy.org/math/arithmetic', sourceQuestionIds: ['sample-miss-2'] },
    { skillId: 'arithmetic-operations', title: 'Multi-step word problems', reason: 'Quantitative: tracking each step.',                         provider: 'Khan Academy', url: 'https://www.khanacademy.org/math/arithmetic', sourceQuestionIds: ['sample-miss-3'] },
  ],

  retakeRecommendation: 'Practise the top 2–3 weak skills for 3–4 days, then retake with new numbers and equivalent difficulty.',
  completedAtIso: '2025-04-15T16:00:00.000Z',
  disclaimer: 'This readiness check is for planning and practice, not an official school placement test. Directional comparison using public benchmark-style tables (NWEA MAP grade math norms). Not an official score from NWEA, IAAT, ASVAB, or any QuizLift-specific norming.',

  // v0.9
  parentSummary: 'On track for a 4th grade student. Strongest in Number Sense. The clearest place to focus practice is Fractions & Ratios — the Mistake Map shows exactly where.',
  topPriorityFixes: [
    {
      skillId: 'fractions-ratios',
      skillLabel: 'Ratios and rates',
      domainLabel: 'Fractions & Ratios',
      rationale: '2 missed in this skill — the issue is keeping track across multiple steps.',
      practiceLink: { provider: 'Khan Academy', label: 'Ratios and rates', url: 'https://www.khanacademy.org/math/pre-algebra/pre-algebra-ratios-rates', reason: 'Practice scaling recipes and equivalent ratios.' },
      missedCount: 2,
    },
    {
      skillId: 'arithmetic-operations',
      skillLabel: 'Multi-step word problems',
      domainLabel: 'Quantitative Reasoning',
      rationale: '1 missed in this skill — the issue is keeping track across multiple steps.',
      practiceLink: { provider: 'Khan Academy', label: 'Multi-step word problems', url: 'https://www.khanacademy.org/math/arithmetic', reason: 'Practice tracking each step in word problems.' },
      missedCount: 1,
    },
  ],
  screeningConfidence: 'moderate',
  preparedFor: 'Alex',
};
