import { getBand } from '../src/features/assessment/domainLabels';

describe('getBand (5-band v0.6 mapping at 0.30 / 0.50 / 0.70 / 0.85 cuts)', () => {
  test('cuts: 0.85+ = well-above', () => {
    expect(getBand(1.0)).toBe('well-above');
    expect(getBand(0.85)).toBe('well-above');
  });

  test('cuts: [0.70, 0.85) = above', () => {
    expect(getBand(0.84)).toBe('above');
    expect(getBand(0.70)).toBe('above');
  });

  test('cuts: [0.50, 0.70) = on-grade', () => {
    expect(getBand(0.69)).toBe('on-grade');
    expect(getBand(0.50)).toBe('on-grade');
  });

  test('cuts: [0.30, 0.50) = approaching', () => {
    expect(getBand(0.49)).toBe('approaching');
    expect(getBand(0.30)).toBe('approaching');
  });

  test('cuts: < 0.30 = below', () => {
    expect(getBand(0.29)).toBe('below');
    expect(getBand(0)).toBe('below');
  });

  test('returns one of the 5 v0.6 band names for any input in [0, 1]', () => {
    const valid = new Set(['below', 'approaching', 'on-grade', 'above', 'well-above']);
    for (let p = 0; p <= 1.0001; p += 0.01) {
      expect(valid.has(getBand(p))).toBe(true);
    }
  });
});
