import { DomainId, ScoreBand } from './types';

export const domainLabels: Record<DomainId, string> = {
  'fluid-reasoning': 'Pattern & Logical Reasoning',
  'visual-spatial': 'Visual-Spatial Reasoning',
  'verbal': 'Verbal Reasoning',
  'quantitative': 'Quantitative Reasoning',
  'working-memory': 'Working Memory',
  'processing-speed': 'Processing Speed',
  'number-sense': 'Number Sense',
  'fractions-ratios': 'Fractions & Ratios',
  'algebra-readiness': 'Algebra Readiness',
  'geometry': 'Geometry',
  'data-reasoning': 'Data & Statistics',
  'vocabulary': 'Vocabulary',
  'reading-comprehension': 'Reading Comprehension',
  'science-reasoning': 'Science Reasoning',
  'mechanical-reasoning': 'Mechanical Reasoning',
  'coding-logic': 'Coding Logic',
  'school-readiness': 'School Readiness',
  'executive-function': 'Focus & Executive Function'
};

export const scoreBandLabels: Record<ScoreBand, string> = {
  'needs-practice': 'Needs Practice',
  'developing': 'Developing',
  'ready-soon': 'Ready Soon',
  'ready': 'Ready',
  'advanced': 'Advanced'
};

export function getBand(percent: number): ScoreBand {
  if (percent >= 0.9) return 'advanced';
  if (percent >= 0.78) return 'ready';
  if (percent >= 0.65) return 'ready-soon';
  if (percent >= 0.45) return 'developing';
  return 'needs-practice';
}

export function getReadinessLabel(band: ScoreBand): string {
  return scoreBandLabels[band];
}

export function getMistakeTypeLabel(tags: string[]): string {
  if (tags.includes('concept-gap')) return 'Concept gap';
  if (tags.includes('procedure-error')) return 'Procedure error';
  if (tags.includes('calculation-error')) return 'Calculation error';
  if (tags.includes('vocabulary-confusion')) return 'Vocabulary confusion';
  if (tags.includes('pattern-recognition')) return 'Pattern recognition';
  if (tags.includes('spatial-visualization')) return 'Spatial visualization';
  if (tags.includes('multi-step-reasoning')) return 'Multi-step reasoning';
  if (tags.includes('attention-to-detail')) return 'Attention to detail';
  if (tags.includes('misread-question')) return 'Misread question';
  return 'Skill gap';
}
