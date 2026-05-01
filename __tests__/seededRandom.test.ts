import { createSeededRandom, makeSessionSeed, shuffleWithRng } from '../src/features/generation/seededRandom';

describe('createSeededRandom', () => {
  test('same seed → same sequence (determinism)', () => {
    const a = createSeededRandom('hello');
    const b = createSeededRandom('hello');
    const seqA = Array.from({ length: 10 }, () => a.int(0, 1000));
    const seqB = Array.from({ length: 10 }, () => b.int(0, 1000));
    expect(seqA).toEqual(seqB);
  });

  test('different seeds → different sequences (very high probability)', () => {
    const a = createSeededRandom('hello');
    const b = createSeededRandom('world');
    const seqA = Array.from({ length: 10 }, () => a.int(0, 1000));
    const seqB = Array.from({ length: 10 }, () => b.int(0, 1000));
    expect(seqA).not.toEqual(seqB);
  });

  test('int(min, max) stays in range and includes both endpoints', () => {
    const r = createSeededRandom('range-check');
    for (let i = 0; i < 200; i++) {
      const v = r.int(3, 7);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  test('pick returns one of the input items', () => {
    const r = createSeededRandom('pick-check');
    const items = ['a', 'b', 'c', 'd'];
    for (let i = 0; i < 50; i++) {
      expect(items).toContain(r.pick(items));
    }
  });
});

describe('shuffleWithRng', () => {
  test('preserves all items (permutation)', () => {
    const src = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const r = createSeededRandom('shuf');
    const out = shuffleWithRng(src, r);
    expect(out.slice().sort((a, b) => a - b)).toEqual(src);
  });

  test('does not mutate the input array', () => {
    const src = [1, 2, 3];
    const before = [...src];
    shuffleWithRng(src, createSeededRandom('immut'));
    expect(src).toEqual(before);
  });

  test('same seed → same shuffle order', () => {
    const src = [1, 2, 3, 4, 5];
    const a = shuffleWithRng(src, createSeededRandom('same-seed'));
    const b = shuffleWithRng(src, createSeededRandom('same-seed'));
    expect(a).toEqual(b);
  });
});

describe('makeSessionSeed', () => {
  // makeSessionSeed is intentionally NON-deterministic — it mixes in Date.now
  // and Math.random so each new session (including retakes of the same test)
  // gets a fresh seed. The test contract enforces uniqueness, not equality.
  test('two calls with the same inputs produce DIFFERENT seeds (each session is fresh)', () => {
    const a = makeSessionSeed('grade-math-skills-check', 10, 5);
    const b = makeSessionSeed('grade-math-skills-check', 10, 5);
    expect(a).not.toBe(b);
  });

  test('seed string includes the testId, age, and grade for traceability', () => {
    const s = makeSessionSeed('grade-math-skills-check', 10, 5);
    expect(s).toContain('grade-math-skills-check');
    expect(s).toContain(':10:');
    expect(s).toContain(':5:');
  });
});
