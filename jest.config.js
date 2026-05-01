// Pure-TypeScript tests for scoring + assembly logic. We deliberately do not
// use jest-expo here — those modules are framework-free, so ts-jest gives a
// faster, simpler test loop. UI components would need jest-expo when added.
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  // Don't try to type-check tests against the full app config; use a relaxed
  // config so RN/expo imports in the broader src/ tree don't trip Jest.
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { isolatedModules: true }],
  },
};
