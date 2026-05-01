import { estimatePercentile } from '../src/features/scoring/externalBenchmarks';

describe('estimatePercentile', () => {
  test('returns a percentile in [1, 99] and a non-empty source/caveat', () => {
    const r = estimatePercentile(0.6, 'grade-math-skills-check');
    expect(r.percentile).toBeGreaterThanOrEqual(1);
    expect(r.percentile).toBeLessThanOrEqual(99);
    expect(r.source.length).toBeGreaterThan(0);
    expect(r.caveat.length).toBeGreaterThan(0);
  });

  test('higher percent correct → equal-or-higher percentile (monotone)', () => {
    let prev = -1;
    for (let p = 0; p <= 1.0001; p += 0.05) {
      const r = estimatePercentile(p, 'reading-vocabulary-snapshot');
      expect(r.percentile).toBeGreaterThanOrEqual(prev);
      prev = r.percentile;
    }
  });

  test('clamps out-of-range input', () => {
    expect(estimatePercentile(-1, 'grade-math-skills-check').percentile).toBeGreaterThanOrEqual(1);
    expect(estimatePercentile(2, 'grade-math-skills-check').percentile).toBeLessThanOrEqual(99);
  });

  test('cites a recognised norm table per test', () => {
    const ids: Array<[string, RegExp]> = [
      ['grade-math-skills-check',           /MAP|NWEA/i],
      ['reading-vocabulary-snapshot',       /MAP|NWEA/i],
      ['double-compacted-algebra-readiness', /Iowa|IAAT/i],
      ['stem-spatial-reasoning',            /DAT|Differential/i],
      ['kindergarten-readiness',            /BRACKEN/i],
      ['military-aptitude-practice',        /ASVAB|AFQT/i],
    ];
    for (const [id, pattern] of ids) {
      const r = estimatePercentile(0.5, id as any);
      expect(r.source).toMatch(pattern);
    }
  });
});
