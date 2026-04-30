import { BRAND } from '../../config/brand';
import { ScoreBand, TestId } from '../assessment/types';
import { getBand, getReadinessLabel } from '../assessment/domainLabels';

export interface StaticDistribution {
  testId: TestId;
  audienceBand: 'early' | 'elementary' | 'middle' | 'high-school' | 'adult';
  distributionLabel: string;
  meanPercent: number;
  standardDeviationPercent: number;
}

const defaultDistribution: Omit<StaticDistribution, 'testId'> = {
  audienceBand: 'middle',
  distributionLabel: 'QuestionLiftIQ starter reference model',
  meanPercent: 0.62,
  standardDeviationPercent: 0.17
};

export const staticDistributions: StaticDistribution[] = [
  { testId: 'questionliftiq-aptitude-snapshot', audienceBand: 'elementary', distributionLabel: 'Aptitude Snapshot starter model, elementary', meanPercent: 0.58, standardDeviationPercent: 0.18 },
  { testId: 'questionliftiq-aptitude-snapshot', audienceBand: 'middle', distributionLabel: 'Aptitude Snapshot starter model, middle grades', meanPercent: 0.61, standardDeviationPercent: 0.17 },
  { testId: 'questionliftiq-aptitude-snapshot', audienceBand: 'high-school', distributionLabel: 'Aptitude Snapshot starter model, high school', meanPercent: 0.64, standardDeviationPercent: 0.16 },
  { testId: 'compacted-math-readiness', audienceBand: 'elementary', distributionLabel: 'Compacted Math readiness starter model', meanPercent: 0.60, standardDeviationPercent: 0.16 },
  { testId: 'double-compacted-algebra-readiness', audienceBand: 'middle', distributionLabel: 'Algebra Fast-Track readiness starter model', meanPercent: 0.56, standardDeviationPercent: 0.17 },
  { testId: 'grade-math-skills-check', audienceBand: 'elementary', distributionLabel: 'Grade math skills starter model, elementary', meanPercent: 0.66, standardDeviationPercent: 0.16 },
  { testId: 'grade-math-skills-check', audienceBand: 'middle', distributionLabel: 'Grade math skills starter model, middle grades', meanPercent: 0.64, standardDeviationPercent: 0.16 },
  { testId: 'reading-vocabulary-snapshot', audienceBand: 'elementary', distributionLabel: 'Reading + Vocabulary starter model, elementary', meanPercent: 0.65, standardDeviationPercent: 0.16 },
  { testId: 'reading-vocabulary-snapshot', audienceBand: 'middle', distributionLabel: 'Reading + Vocabulary starter model, middle grades', meanPercent: 0.67, standardDeviationPercent: 0.15 },
  { testId: 'stem-spatial-reasoning', audienceBand: 'middle', distributionLabel: 'STEM + Spatial starter model', meanPercent: 0.61, standardDeviationPercent: 0.17 },
  { testId: 'coding-logic-sprint', audienceBand: 'middle', distributionLabel: 'Coding Logic starter model', meanPercent: 0.60, standardDeviationPercent: 0.18 },
  { testId: 'kindergarten-readiness', audienceBand: 'early', distributionLabel: 'Kindergarten Readiness starter model', meanPercent: 0.70, standardDeviationPercent: 0.15 },
  { testId: 'military-aptitude-practice', audienceBand: 'high-school', distributionLabel: 'Military Aptitude Practice starter model', meanPercent: 0.58, standardDeviationPercent: 0.18 },
  { testId: 'military-aptitude-practice', audienceBand: 'adult', distributionLabel: 'Military Aptitude Practice starter model, adult', meanPercent: 0.60, standardDeviationPercent: 0.18 }
];

export function audienceBandFor(age: number, grade: number): StaticDistribution['audienceBand'] {
  if (age <= 6 || grade <= 0) return 'early';
  if (age <= 10 || grade <= 5) return 'elementary';
  if (age <= 14 || grade <= 8) return 'middle';
  if (age <= 18 || grade <= 12) return 'high-school';
  return 'adult';
}

export function getStaticDistribution(testId: TestId, age: number, grade: number): StaticDistribution {
  const band = audienceBandFor(age, grade);
  return (
    staticDistributions.find(d => d.testId === testId && d.audienceBand === band) ??
    staticDistributions.find(d => d.testId === testId) ??
    { testId, ...defaultDistribution }
  );
}

function normalCdf(z: number): number {
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * erf);
}

function percentileRangeLabel(percentile: number): string {
  const r = Math.round(percentile);
  const lower = Math.max(1, Math.floor((r - 5) / 5) * 5);
  const upper = Math.min(99, Math.ceil((r + 5) / 5) * 5);
  return `${lower}th–${upper}th`;
}

export function estimatePercentile(params: { testId: TestId; age: number; grade: number; percent: number }) {
  const dist = getStaticDistribution(params.testId, params.age, params.grade);
  const sd = Math.max(0.05, dist.standardDeviationPercent);
  const z = (params.percent - dist.meanPercent) / sd;
  const percentile = Math.max(1, Math.min(99, Math.round(normalCdf(z) * 100)));
  return {
    percentile,
    rangeLabel: percentileRangeLabel(percentile),
    distributionLabel: dist.distributionLabel,
    caveat: BRAND.percentileCaveat
  };
}

export function readinessFromPercent(percent: number): { band: ScoreBand; label: string } {
  const band = getBand(percent);
  return { band, label: getReadinessLabel(band) };
}
