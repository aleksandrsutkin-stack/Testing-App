// src/features/assessment/domainLabels.ts
// v0.6: 5-band score model with parent-friendly labels.

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

// v0.6 5-band labels. Parent-friendly. No "Needs Practice" stigma.
export const scoreBandLabels: Record<ScoreBand, string> = {
  'well-above':  'Well above grade',
  'above':       'Above grade',
  'on-grade':    'On grade level',
  'approaching': 'Approaching grade',
  'below':       'Building foundations'
};

/**
 * v0.9 — Cover headlines paired with a unicode icon. Lead the cover with the
 * headline, not the score number, so a parent who glances at the report
 * immediately reads the answer to "how did my kid do?" rather than mistaking
 * a score of 50 (on grade level) for an F.
 *
 * Icons are unicode so they render in PDF and on every device without a
 * font dependency. "Building Foundations" replaces "Below grade" — same
 * information, encouraging frame, doesn't lie about the result.
 */
export const BAND_HEADLINES: Record<ScoreBand, { headline: string; icon: string }> = {
  'well-above':  { headline: 'Well Above Grade',     icon: '⭐' },
  'above':       { headline: 'Above Grade',          icon: '↑'  },
  'on-grade':    { headline: 'On Track',             icon: '✓'  },
  'approaching': { headline: 'Approaching Grade',    icon: '→'  },
  'below':       { headline: 'Building Foundations', icon: '◐'  },
};

/**
 * v0.6 band thresholds. Tied to the ScoreLift Score model where 50 = on-grade.
 * Cuts at the percent-correct level:
 *   ≥0.85 → well-above
 *   ≥0.70 → above
 *   ≥0.50 → on-grade
 *   ≥0.30 → approaching
 *   else  → below
 */
export function getBand(percent: number): ScoreBand {
  if (percent >= 0.85) return 'well-above';
  if (percent >= 0.70) return 'above';
  if (percent >= 0.50) return 'on-grade';
  if (percent >= 0.30) return 'approaching';
  return 'below';
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
