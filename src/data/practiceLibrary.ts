import { PracticeLink } from '../features/assessment/types';

export const practiceLibrary: Record<string, PracticeLink> = {
  'arithmetic-operations': { provider: 'Khan Academy', label: 'Arithmetic operations', url: 'https://www.khanacademy.org/math/arithmetic', reason: 'Practice core addition, subtraction, multiplication, division, and number sense.', skillId: 'arithmetic-operations' },
  'fractions-ratios': { provider: 'Khan Academy', label: 'Fractions, ratios, and rates', url: 'https://www.khanacademy.org/math/pre-algebra/pre-algebra-ratios-rates', reason: 'Build comfort with ratios, equivalent fractions, unit rates, and proportional reasoning.', skillId: 'fractions-ratios' },
  'equations-one-step': { provider: 'Khan Academy', label: 'One-step equations', url: 'https://www.khanacademy.org/math/algebra-basics/alg-basics-linear-equations-and-inequalities', reason: 'Practice undoing operations and solving for an unknown.', skillId: 'equations-one-step' },
  'expressions-patterns': { provider: 'Khan Academy', label: 'Expressions and patterns', url: 'https://www.khanacademy.org/math/algebra-basics/alg-basics-algebraic-expressions', reason: 'Practice recognising rules and writing expressions.', skillId: 'expressions-patterns' },
  'geometry': { provider: 'Khan Academy', label: 'Geometry basics', url: 'https://www.khanacademy.org/math/basic-geo', reason: 'Review area, perimeter, angles, shapes, and spatial reasoning.', skillId: 'geometry' },
  'data-statistics': { provider: 'Khan Academy', label: 'Data and statistics', url: 'https://www.khanacademy.org/math/statistics-probability', reason: 'Practice mean, median, charts, probability, and data interpretation.', skillId: 'data-statistics' },
  'vocabulary': { provider: 'Khan Academy', label: 'Reading and vocabulary', url: 'https://www.khanacademy.org/ela', reason: 'Practice vocabulary in context and reading comprehension.', skillId: 'vocabulary' },
  'reading-evidence': { provider: 'Khan Academy', label: 'Reading comprehension', url: 'https://www.khanacademy.org/ela', reason: 'Practice finding evidence and understanding short passages.', skillId: 'reading-evidence' },
  'reading-comprehension': { provider: 'Khan Academy', label: 'Reading and language arts', url: 'https://www.khanacademy.org/ela', reason: 'Practice comprehension, inference, and text structure.', skillId: 'reading-comprehension' },
  'science-reasoning': { provider: 'Khan Academy', label: 'Science reasoning', url: 'https://www.khanacademy.org/science', reason: 'Practice cause-and-effect, experiment interpretation, and science foundations.', skillId: 'science-reasoning' },
  'coding-sequences': { provider: 'Khan Academy', label: 'Computer programming basics', url: 'https://www.khanacademy.org/computing/computer-programming', reason: 'Practice sequencing, logic, and introductory programming ideas.', skillId: 'coding-sequences' },
  'coding-logic': { provider: 'Khan Academy', label: 'Computer programming basics', url: 'https://www.khanacademy.org/computing/computer-programming', reason: 'Practice logic, conditionals, loops, and algorithmic thinking.', skillId: 'coding-logic' },
  'mechanical-reasoning': { provider: 'Other', label: 'Mechanical reasoning review', url: 'https://www.khanacademy.org/science/physics', reason: 'Review basic forces, motion, and physical systems.', skillId: 'mechanical-reasoning' },
  'spatial-reasoning': { provider: 'Khan Academy', label: 'Geometry and spatial reasoning', url: 'https://www.khanacademy.org/math/geometry', reason: 'Practice spatial visualisation, shapes, and geometric reasoning.', skillId: 'spatial-reasoning' },
  'working-memory': { provider: 'Khan Academy', label: 'Math practice', url: 'https://www.khanacademy.org/math', reason: 'Multi-step problems build working memory and attention.', skillId: 'working-memory' },
  'early-math': { provider: 'Khan Academy', label: 'Early math', url: 'https://www.khanacademy.org/math/early-math', reason: 'Practice counting, shapes, comparing, and early numeracy.', skillId: 'early-math' },
  'pattern-reasoning': { provider: 'Khan Academy', label: 'Math patterns and reasoning', url: 'https://www.khanacademy.org/math', reason: 'Practice recognising patterns and explaining rules.', skillId: 'pattern-reasoning' }
};

export function practiceLink(skillId: string): PracticeLink {
  return practiceLibrary[skillId] ?? {
    provider: 'Khan Academy',
    label: 'General practice',
    url: 'https://www.khanacademy.org',
    reason: 'Review this topic with free lessons and practice.',
    skillId
  };
}
