export interface SeededRandom {
  next: () => number;
  int: (min: number, max: number) => number;
  pick: <T>(items: T[]) => T;
  pickN: <T>(items: T[], n: number) => T[];
  fork: (salt: string) => SeededRandom;
}

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createSeededRandom(seed: string): SeededRandom {
  let state = hashString(seed) || 123456789;

  function next(): number {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    next,
    int(min: number, max: number): number {
      return Math.floor(next() * (max - min + 1)) + min;
    },
    pick<T>(items: T[]): T {
      if (items.length === 0) throw new Error('Cannot pick from empty list.');
      return items[Math.floor(next() * items.length)];
    },
    pickN<T>(items: T[], n: number): T[] {
      const copy = [...items];
      const result: T[] = [];
      for (let i = 0; i < n && copy.length > 0; i++) {
        const idx = Math.floor(next() * copy.length);
        result.push(copy.splice(idx, 1)[0]);
      }
      return result;
    },
    fork(salt: string): SeededRandom {
      return createSeededRandom(`${seed}:${salt}`);
    }
  };
}

export function shuffleWithRng<T>(items: T[], rng: SeededRandom): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function makeSessionSeed(testId: string, age: number, grade: number): string {
  return `${testId}:${age}:${grade}:${Date.now()}:${Math.floor(Math.random() * 1000000)}`;
}
