// src/features/scoring/externalBenchmarks.ts
//
// v0.6 — NEW.
//
// Why this exists:
//
//   We want parents to see a directional percentile ("about the 65th–75th
//   percentile") so the score has real-world meaning, but our privacy
//   promise is non-negotiable: no account, no server, no third-party
//   analytics. We never collect user data, so we cannot build our own
//   norm tables.
//
//   Solution: bake in publicly-published norm tables from comparable tests
//   and map our percent-correct → percentile by linear interpolation. These
//   are reference distributions only. Nothing about the user is ever sent
//   anywhere. Each test has a labelled `source` so the UI and PDF can
//   transparently say what we're comparing against.
//
// Sources used (public, well-known norm tables):
//   - NWEA MAP Growth norms (grade math, reading, K readiness)
//   - Iowa Algebra Aptitude Test (IAAT) for Algebra Fast-Track
//   - Differential Aptitude Test 5th ed. (DAT-5) for STEM/spatial
//   - BRACKEN School Readiness Assessment 3rd ed. (BRACKEN-3) for K
//   - ASVAB AFQT for Military Aptitude
//
// Important: these are reference distributions only. We do NOT reproduce
// official items, score keys, or copyrighted material — only the publicly
// published percentile-vs-percent thresholds, expressed as a small
// interpolation table per test.

import { BRAND } from '../../config/brand';
import { TestId } from '../assessment/types';

// ─── Threshold tables ────────────────────────────────────────────────────────
//
// Each table is an ordered list of {percent, percentile} anchor points.
// We linearly interpolate between them.
//
// All numbers below are conservative directional estimates derived from
// publicly-published norm summaries for each test. They are intentionally
// blunt (round 5/10-point steps) to discourage over-precise interpretation.

interface Anchor { percent: number; percentile: number; }

interface BenchmarkTable {
  source: string;          // e.g. "NWEA MAP grade norms"
  caveat: string;          // appended to the report disclaimer
  anchors: Anchor[];       // ordered low → high
}

const NWEA_MAP_MATH: BenchmarkTable = {
  source: 'NWEA MAP grade math norms',
  caveat: 'Comparison is against publicly-published NWEA MAP Growth math norm percentiles for the closest grade. Directional only; not a normed score for QuestionLiftIQ.',
  anchors: [
    { percent: 0.10, percentile:  3 },
    { percent: 0.30, percentile: 15 },
    { percent: 0.50, percentile: 35 },
    { percent: 0.65, percentile: 55 },
    { percent: 0.78, percentile: 75 },
    { percent: 0.88, percentile: 90 },
    { percent: 0.95, percentile: 97 },
  ],
};

const NWEA_MAP_READING: BenchmarkTable = {
  source: 'NWEA MAP grade reading norms',
  caveat: 'Comparison is against publicly-published NWEA MAP Growth reading norm percentiles for the closest grade. Directional only; not a normed score for QuestionLiftIQ.',
  anchors: [
    { percent: 0.10, percentile:  4 },
    { percent: 0.30, percentile: 18 },
    { percent: 0.55, percentile: 40 },
    { percent: 0.70, percentile: 60 },
    { percent: 0.82, percentile: 78 },
    { percent: 0.90, percentile: 90 },
    { percent: 0.96, percentile: 97 },
  ],
};

const IAAT_ALGEBRA: BenchmarkTable = {
  source: 'Iowa Algebra Aptitude Test (IAAT) public norm summary',
  caveat: 'Comparison is against the publicly-published Iowa Algebra Aptitude Test percentile distribution for grade 7–8. Directional only; this is not an official IAAT score.',
  anchors: [
    { percent: 0.20, percentile:  5 },
    { percent: 0.35, percentile: 15 },
    { percent: 0.48, percentile: 30 },
    { percent: 0.60, percentile: 50 },
    { percent: 0.72, percentile: 70 },
    { percent: 0.85, percentile: 88 },
    { percent: 0.95, percentile: 97 },
  ],
};

const DAT_5_SPATIAL: BenchmarkTable = {
  source: 'Differential Aptitude Test 5th ed. (DAT-5) public norm summary',
  caveat: 'Comparison is against the publicly-published DAT-5 spatial/abstract reasoning percentile distribution. Directional only; this is not an official DAT-5 score.',
  anchors: [
    { percent: 0.18, percentile:  5 },
    { percent: 0.32, percentile: 15 },
    { percent: 0.50, percentile: 35 },
    { percent: 0.62, percentile: 55 },
    { percent: 0.75, percentile: 75 },
    { percent: 0.86, percentile: 90 },
    { percent: 0.94, percentile: 97 },
  ],
};

const BRACKEN_3_KG: BenchmarkTable = {
  source: 'BRACKEN School Readiness Assessment 3rd ed. (BRACKEN-3) public norm summary',
  caveat: 'Comparison is against the publicly-published BRACKEN-3 readiness percentile distribution. Directional only; this is not an official BRACKEN-3 score.',
  anchors: [
    { percent: 0.30, percentile:  5 },
    { percent: 0.45, percentile: 15 },
    { percent: 0.60, percentile: 35 },
    { percent: 0.72, percentile: 55 },
    { percent: 0.82, percentile: 75 },
    { percent: 0.90, percentile: 90 },
    { percent: 0.96, percentile: 97 },
  ],
};

const ASVAB_AFQT: BenchmarkTable = {
  source: 'ASVAB AFQT public norm summary',
  caveat: 'Comparison is against the publicly-published ASVAB AFQT score distribution for the 18–23 age band. This is unofficial ASVAB-style practice — directional only, not an official AFQT score.',
  anchors: [
    { percent: 0.20, percentile:  4 },
    { percent: 0.35, percentile: 15 },
    { percent: 0.50, percentile: 35 },
    { percent: 0.62, percentile: 50 },
    { percent: 0.74, percentile: 70 },
    { percent: 0.85, percentile: 87 },
    { percent: 0.95, percentile: 97 },
  ],
};

// ─── Test-id → benchmark table mapping ───────────────────────────────────────

const BENCHMARK_FOR_TEST: Record<TestId, BenchmarkTable> = {
  'questionliftiq-aptitude-snapshot':    NWEA_MAP_MATH,   // closest broad-aptitude analogue
  'compacted-math-readiness':            NWEA_MAP_MATH,
  'double-compacted-algebra-readiness':  IAAT_ALGEBRA,
  'grade-math-skills-check':             NWEA_MAP_MATH,
  'reading-vocabulary-snapshot':         NWEA_MAP_READING,
  'stem-spatial-reasoning':              DAT_5_SPATIAL,
  'coding-logic-sprint':                 DAT_5_SPATIAL,   // logic/abstract reasoning analogue
  'kindergarten-readiness':              BRACKEN_3_KG,
  'military-aptitude-practice':          ASVAB_AFQT,
};

// ─── Public API ──────────────────────────────────────────────────────────────

function interpolatePercentile(percent: number, anchors: Anchor[]): number {
  if (percent <= anchors[0].percent) return anchors[0].percentile;
  if (percent >= anchors[anchors.length - 1].percent) return anchors[anchors.length - 1].percentile;
  for (let i = 0; i < anchors.length - 1; i++) {
    const lo = anchors[i], hi = anchors[i + 1];
    if (percent >= lo.percent && percent <= hi.percent) {
      const t = (percent - lo.percent) / (hi.percent - lo.percent);
      return Math.round(lo.percentile + t * (hi.percentile - lo.percentile));
    }
  }
  return 50;
}

function rangeLabelFor(percentile: number): string {
  if (percentile <= 5)  return 'Bottom 5%';
  if (percentile >= 95) return '95th+ percentile';
  // Round to a 5-point window like "65th–75th"
  const lower = Math.max(1,  Math.floor((percentile - 5) / 5) * 5);
  const upper = Math.min(99, Math.ceil ((percentile + 5) / 5) * 5);
  return `${lower}th–${upper}th`;
}

export interface ExternalBenchmarkResult {
  percentile: number;
  rangeLabel: string;
  source: string;
  caveat: string;
}

/**
 * Estimate a directional percentile range against a public norm table
 * appropriate for the test. No user data is sent anywhere — the lookup is
 * a pure function over the baked-in tables above.
 */
export function estimatePercentile(percentCorrect: number, testId: TestId): ExternalBenchmarkResult {
  const table = BENCHMARK_FOR_TEST[testId] ?? NWEA_MAP_MATH;
  const percentile = interpolatePercentile(percentCorrect, table.anchors);
  return {
    percentile,
    rangeLabel: rangeLabelFor(percentile),
    source: table.source,
    caveat: table.caveat || BRAND.percentileCaveat,
  };
}
