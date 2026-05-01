import { TestDefinition, TestId } from '../features/assessment/types';

export const testCatalog: TestDefinition[] = [
  {
    id: 'quizlift-aptitude-snapshot',
    title: 'QuizLift Aptitude Snapshot',
    subtitle: 'See how your child compares across core skills',
    popular: true,
    category: 'aptitude',
    recommendedAges: { min: 6, max: 18 },
    recommendedGrades: { min: 1, max: 12 },
    durationMinutes: 18,
    questionTarget: 30,
    icon: 'sparkles',
    parentBenefit: 'A quick picture of reasoning, verbal, spatial, memory, and quantitative strengths without clinical IQ claims.',
    studentBenefit: 'A puzzle sprint that turns missed questions into next-step practice.',
    reportPromise: 'Percent correct, estimated percentile range, ScoreLift Score, Mistake Map, Step Solutions, and practice links.',
    domains: ['fluid-reasoning', 'visual-spatial', 'verbal', 'quantitative', 'working-memory'],
    practiceLinks: [
      { provider: 'Khan Academy', label: 'Khan Academy math practice', url: 'https://www.khanacademy.org/math', reason: 'General quantitative practice by grade.' },
      { provider: 'Khan Academy', label: 'Khan Academy reading and language arts', url: 'https://www.khanacademy.org/ela', reason: 'Reading, vocabulary, and comprehension practice.' }
    ],
    disclaimer: 'This is an IQ-style cognitive aptitude snapshot, not a clinical IQ test, diagnostic evaluation, or gifted-placement test.'
  },
  {
    id: 'compacted-math-readiness',
    title: 'Compacted Math Readiness',
    subtitle: 'Is your child ready for compacted math?',
    category: 'math-readiness',
    recommendedAges: { min: 7, max: 13 },
    recommendedGrades: { min: 2, max: 7 },
    durationMinutes: 15,
    questionTarget: 25,
    icon: 'calculator',
    parentBenefit: 'Helps parents decide whether math acceleration is exciting, risky, or needs targeted support first.',
    studentBenefit: 'Shows which math skills are already strong and which ones need practice.',
    reportPromise: 'Percent correct, estimated percentile range, readiness band, gap list, step solutions, and Khan Academy practice links.',
    domains: ['number-sense', 'fractions-ratios', 'quantitative', 'geometry', 'data-reasoning'],
    practiceLinks: [
      { provider: 'Khan Academy', label: 'Arithmetic practice', url: 'https://www.khanacademy.org/math/arithmetic', reason: 'Core number sense and operations.' },
      { provider: 'Khan Academy', label: 'Pre-algebra practice', url: 'https://www.khanacademy.org/math/pre-algebra', reason: 'Ratios, expressions, equations, and readiness foundations.' }
    ],
    disclaimer: 'This readiness check is for planning and practice, not an official school placement test.'
  },
  {
    id: 'double-compacted-algebra-readiness',
    title: 'Double-Compacted / Algebra Fast-Track',
    subtitle: "Find out if they're ready to skip ahead",
    category: 'math-readiness',
    recommendedAges: { min: 9, max: 15 },
    recommendedGrades: { min: 4, max: 9 },
    durationMinutes: 16,
    questionTarget: 25,
    icon: 'rocket',
    parentBenefit: 'Flags whether the student is ready for compressed pre-algebra or early algebra expectations.',
    studentBenefit: 'Highlights equation, fraction, pattern, and word-problem skills.',
    reportPromise: 'Algebra-readiness profile, estimated percentile range, acceleration cautions, missed-question solutions, and practice sequence.',
    domains: ['fractions-ratios', 'algebra-readiness', 'quantitative', 'data-reasoning', 'fluid-reasoning'],
    practiceLinks: [
      { provider: 'Khan Academy', label: 'Pre-algebra practice', url: 'https://www.khanacademy.org/math/pre-algebra', reason: 'Bridge skills before a full algebra track.' },
      { provider: 'Khan Academy', label: 'Algebra basics practice', url: 'https://www.khanacademy.org/math/algebra-basics', reason: 'Expressions, equations, graphing, and algebra foundations.' }
    ],
    disclaimer: 'This is a planning tool. Final acceleration decisions should include teacher input and classroom performance.'
  },
  {
    id: 'grade-math-skills-check',
    title: 'Grade-Level Math Skills Check',
    subtitle: "Check if they're on track for their grade",
    category: 'math-readiness',
    recommendedAges: { min: 6, max: 18 },
    recommendedGrades: { min: 1, max: 12 },
    durationMinutes: 15,
    questionTarget: 25,
    icon: 'ruler',
    parentBenefit: 'Useful before tutoring, summer practice, or a school-year reset.',
    studentBenefit: 'Finds a small set of skills to fix first.',
    reportPromise: 'Percent correct, estimated percentile range, domain ratings, missed-question solutions, and a 7-day practice plan.',
    domains: ['number-sense', 'fractions-ratios', 'quantitative', 'geometry', 'data-reasoning'],
    practiceLinks: [
      { provider: 'Khan Academy', label: 'Khan Academy math by grade', url: 'https://www.khanacademy.org/math', reason: 'Grade-level math lessons and practice.' }
    ],
    disclaimer: 'This skills check is a practice diagnostic, not a school grade or official assessment.'
  },
  {
    id: 'reading-vocabulary-snapshot',
    title: 'Reading + Vocabulary Snapshot',
    subtitle: 'Spot reading and vocabulary gaps early',
    category: 'reading',
    recommendedAges: { min: 6, max: 18 },
    recommendedGrades: { min: 1, max: 12 },
    durationMinutes: 15,
    questionTarget: 25,
    icon: 'book-open',
    parentBenefit: 'Useful for tutoring intake and reading practice planning.',
    studentBenefit: 'Shows which word and passage skills are getting stronger.',
    reportPromise: 'Vocabulary score, comprehension score, estimated percentile range, missed-question explanations, and suggested reading practice.',
    domains: ['vocabulary', 'reading-comprehension', 'verbal'],
    practiceLinks: [
      { provider: 'Khan Academy', label: 'Reading and language arts practice', url: 'https://www.khanacademy.org/ela', reason: 'Vocabulary, comprehension, grammar, and close reading.' }
    ],
    disclaimer: 'This screen does not diagnose dyslexia, language disorders, or any reading disability.'
  },
  {
    id: 'stem-spatial-reasoning',
    title: 'STEM + Spatial Reasoning Sprint',
    subtitle: 'Test problem-solving and spatial thinking',
    category: 'stem',
    recommendedAges: { min: 7, max: 18 },
    recommendedGrades: { min: 2, max: 12 },
    durationMinutes: 15,
    questionTarget: 25,
    icon: 'shapes',
    parentBenefit: 'Good for enrichment, robotics, science clubs, and STEM confidence.',
    studentBenefit: 'Puzzles about shapes, cause-and-effect, and systems.',
    reportPromise: 'STEM reasoning profile, missed-question solutions, practice links, and enrichment ideas.',
    domains: ['visual-spatial', 'science-reasoning', 'fluid-reasoning'],
    practiceLinks: [
      { provider: 'Khan Academy', label: 'Science practice', url: 'https://www.khanacademy.org/science', reason: 'Life science, physical science, and scientific reasoning.' }
    ],
    disclaimer: 'This is an enrichment and practice screen, not a gifted-programme placement test.'
  },
  {
    id: 'coding-logic-sprint',
    title: 'Coding Logic Sprint',
    subtitle: 'See if they think like a programmer',
    category: 'coding',
    recommendedAges: { min: 8, max: 18 },
    recommendedGrades: { min: 3, max: 12 },
    durationMinutes: 15,
    questionTarget: 25,
    icon: 'code',
    parentBenefit: 'Tests whether coding classes may be a good fit before paying for a course.',
    studentBenefit: 'Logic puzzles that feel like game rules.',
    reportPromise: 'Algorithmic thinking profile, missed-question solutions, and next-step practice ideas.',
    domains: ['coding-logic', 'working-memory', 'fluid-reasoning'],
    practiceLinks: [
      { provider: 'Khan Academy', label: 'Computer programming practice', url: 'https://www.khanacademy.org/computing/computer-programming', reason: 'Introductory programming concepts and creative projects.' }
    ],
    disclaimer: 'This sprint measures logic readiness. It does not certify programming skill.'
  },
  {
    id: 'kindergarten-readiness',
    title: 'Kindergarten Readiness Mini Check',
    subtitle: 'A quick check before the big first day',
    category: 'school-readiness',
    recommendedAges: { min: 4, max: 6 },
    recommendedGrades: { min: -1, max: 1 },
    durationMinutes: 12,
    questionTarget: 20,
    icon: 'backpack',
    parentBenefit: 'Helps parents organise early literacy, numeracy, and attention observations.',
    studentBenefit: 'Simple playful questions and parent-observed skills.',
    reportPromise: 'School readiness profile, missed skills, step-by-step home practice, and early learning links.',
    domains: ['school-readiness', 'number-sense', 'vocabulary', 'executive-function'],
    practiceLinks: [
      { provider: 'Khan Academy', label: 'Early math practice', url: 'https://www.khanacademy.org/math/early-math', reason: 'Counting, shapes, comparing, and early number sense.' }
    ],
    disclaimer: 'This mini check is not a developmental diagnosis or kindergarten admission decision.'
  },
  {
    id: 'military-aptitude-practice',
    title: 'Military Aptitude Practice Sprint',
    subtitle: 'Unofficial ASVAB-style practice — start here',
    category: 'career-aptitude',
    recommendedAges: { min: 15, max: 60 },
    recommendedGrades: { min: 9, max: 20 },
    durationMinutes: 18,
    questionTarget: 28,
    icon: 'compass',
    parentBenefit: 'A quick low-stakes preview of academic and mechanical aptitude areas.',
    studentBenefit: 'Practice across words, arithmetic, science, and mechanical reasoning.',
    reportPromise: 'Practice profile across verbal, math, science, and mechanical reasoning with missed-question solutions.',
    domains: ['verbal', 'quantitative', 'science-reasoning', 'mechanical-reasoning'],
    practiceLinks: [
      { provider: 'Khan Academy', label: 'Arithmetic practice', url: 'https://www.khanacademy.org/math/arithmetic', reason: 'Arithmetic reasoning and basic computation.' },
      { provider: 'Khan Academy', label: 'High school science practice', url: 'https://www.khanacademy.org/science/high-school-biology', reason: 'Science foundations and reasoning practice.' }
    ],
    disclaimer: 'This module is unofficial ASVAB-style practice. It is not affiliated with, endorsed by, or equivalent to the official ASVAB.'
  }
];

export function getTestDefinition(testId: TestId): TestDefinition | undefined {
  return testCatalog.find(t => t.id === testId);
}

export function getRecommendedTestsForProfile(age: number, grade: number): TestDefinition[] {
  return testCatalog.filter(t =>
    age >= t.recommendedAges.min && age <= t.recommendedAges.max &&
    grade >= t.recommendedGrades.min && grade <= t.recommendedGrades.max
  );
}
