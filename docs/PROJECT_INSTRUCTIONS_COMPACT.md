# QuizLift — Project Instructions / Compact Context (v0.8)

Build **QuizLift**, a privacy-first iPhone/iPad educational test-improvement app.

Core promise:

> Take a short test → see percent correct, ScoreLift Score, and a directional percentile range → review what you got wrong → learn step-by-step solutions → practice targeted skills → retake with new but equivalent questions.

Tagline: **Every miss becomes a lesson.**

## Positioning

QuizLift is an educational screening and practice tool, not a clinical IQ test, diagnostic instrument, school placement decision, gifted-identification test, or official ASVAB product. Use phrases like **aptitude snapshot**, **readiness screen**, **practice sprint**, **estimated percentile range**, **ScoreLift Report**, and **ScoreLift Score**. Do not claim national norming.

Standard percentile disclaimer:

> Estimated percentile ranges are directional comparisons against published norm tables (such as NWEA MAP and ASVAB AFQT). They are not nationally normed scores for QuizLift.

ASVAB-related content must be phrased as **unofficial ASVAB-style practice** only.

## Privacy model (non-negotiable)

No account, no server storage, no third-party analytics, no ads, no child name required, local-only scoring, generated PDF report, native share sheet, deletion of temporary PDF/PNG after sharing returns. AsyncStorage prefix `qlft:` for any opt-in local data. The Mistake Map / Plan are paywalled but the privacy story is not. IAP receipts are the source of truth; AsyncStorage is a fast local mirror only. The shareable ScoreCard PNG never includes child name, age, or grade.

## Current codebase (v0.8)

`quizlift-mobile-app` v0.8.0, Expo + React Native + TypeScript + Expo Router. Dependencies pinned; lockfile committed. CI runs `tsc --noEmit`, the smoke test, and Jest on every push/PR.

Main screens:

- `app/_layout.tsx` — Stack + status bar + IAP connection lifecycle.
- `app/index.tsx` — Home: Mascot + tagline + privacy trust badge row + Quick Start + catalog (with subtitles + `⚡ Most popular` chip).
- `app/select.tsx` — Grade + test pickers; age auto-derived.
- `app/assessment.tsx` — One question at a time with **adaptive ordering**.
- `app/celebration.tsx` — 1.7-second finish moment.
- `app/results.tsx` — ScoreLift Score lead tile + retake delta + percentile cite + Score / Mistakes / Plan tabs + Share Score (free) + Export PDF (paid).

Main modules:

- `src/data/testCatalog.ts` — 9 tests with `subtitle` and optional `popular` flag.
- `src/data/testBlueprints.ts` — domain/difficulty mix per test.
- `src/data/questionTemplates.ts` — **123 templates** (118 v0.6 + 5 v0.7) using `phrase()` and `NAME_POOL`.
- `src/features/assessment/types.ts` — `ScoreBand` (5 bands), `AssessmentResult.scoreLiftScore`, `PercentileEstimate.benchmarkSource`, `visualType` includes `dot-compare`.
- `src/features/assessment/assembleAssessment.ts` — blueprint → questions.
- `src/features/assessment/scoreAssessment.ts` — wires ScoreLift Score + external benchmarks.
- `src/features/assessment/adaptiveSelector.ts` — `pickInitialQuestion`, `pickNextQuestion` (rolling 3-question accuracy).
- `src/features/scoring/scoreLiftScore.ts` — grade-anchored 1–100 mapping.
- `src/features/scoring/externalBenchmarks.ts` — NWEA MAP / IAAT / DAT-5 / BRACKEN-3 / ASVAB AFQT.
- `src/features/reports/buildReportHtml.ts` — light-mode PDF.
- `src/services/paywallService.ts` — **real expo-iap (StoreKit 2 / Play Billing)** in v0.8.
- `src/services/scoreCardService.ts` — `shareScoreCard(ref)` capture + share + delete.
- `src/services/historyService.ts` — opt-in local history (`qlft:` prefix).
- `src/components/Illustrations.tsx` — Liftie + Decoration + EmptyState + AchievementBadge.
- `src/components/ScoreCard.tsx` — shareable PNG card.
- `src/components/SpatialVisual.tsx` — theme-aware SVGs incl. `dot-compare`.

## Test modules

1. QuizLift Aptitude Snapshot (carries `popular: true`).
2. Compacted Math Readiness.
3. Double-Compacted / Algebra Fast-Track.
4. Grade-Level Math Skills Check.
5. Reading + Vocabulary Snapshot.
6. STEM + Spatial Reasoning Sprint.
7. Coding Logic Sprint.
8. Kindergarten Readiness Mini Check.
9. Military Aptitude Practice Sprint.

## Question / retake design

Use a **blueprint + template + seed** model:

- Blueprint controls domains, question counts, and target difficulty.
- Template generates similar but not identical problems.
- Seed makes each attempt deterministic and regenerable.
- Retake uses a new seed, so numbers/wording/answer order change while skills remain comparable.

Helpers:

- `phrase(rng, options)` for surface-wording variants.
- `randomName(rng)` from `NAME_POOL` (16 names across ethnicities/gender) for word problems.
- `rng.fork(salt)` for derived RNG that doesn't collide with parent.

`makeSessionSeed(testId, age, grade)` is intentionally non-deterministic (mixes in `Date.now()` and `Math.random()`) so retakes get fresh seeds.

Every question must include: domain, skill ID, difficulty, answer choices, correct answer, wrong-answer feedback when possible, mistake tags, **real step-by-step solution (not just a restated answer)**, common trap, practice links (usually Khan Academy).

## Scoring model

Three numbers, always shown together:

1. **Percent correct** — most transparent.
2. **ScoreLift Score (1–100)** — grade-anchored. 50 = on-grade-level for the chosen test/age/grade. Lead headline.
3. **Estimated percentile range** — directional, computed from a published norm table for a comparable test. Always cites the benchmark source.

Bands (5 v0.6): well-above / above / on-grade / approaching / below. Thresholds at 0.85 / 0.70 / 0.50 / 0.30.

## ScoreLift Report (PDF)

The PDF is the paid product. Sections:

- Cover summary with **ScoreLift Score** as lead.
- Percent correct.
- Estimated percentile range with `benchmarkSource` cited.
- Readiness band.
- Domain ratings.
- Strengths and growth areas.
- Mistake Map.
- Step-by-step solution for every missed question.
- Practice links.
- 7-day ScoreLift plan.
- Retake recommendation.
- Disclaimers and privacy note.

## Theme rules

All components use the `useColors() + makeStyles(colors)` factory pattern. No hardcoded color literals except deliberate brand accents (the dark-indigo Quick Start and BEST VALUE marks). The PDF and ScoreCard PNG stay light-mode only (export should look the same regardless of system theme).

## Naming

Working name: **QuizLift**. Not legal clearance. Avoid BrightSpark, SparkIQ, WunderkindIQ, WizKidzIQ, TestsRus, TestLift, PrepLift, TestWise, TestCoach, TestSprint, StepWise, PracticeIQ, SkillSprint, TestFix.

## Content rules

Do not copy copyrighted or proprietary test items / item formats from WISC, Raven, ASVAB, MAP, SAT, CogAT, or other official tests. Create original questions by skill, age band, grade band, difficulty, answer, explanation, mistake mapping, and practice links.

Real `explanationSteps` always — never just restate the answer. Aim for 2–3 teaching steps per scenario.

## Verification before pushing

```bash
npm run typecheck            # tsc --noEmit
npm run smoke:test-content   # node scripts/smoke-test-content.js
npm test                     # jest (50 unit tests)
```

CI runs all three on every push and PR (`.github/workflows/ci.yml`).

## Open before App Store submission

1. Replace `com.example.quizlift.*` placeholder SKUs with the real bundle ID. Create matching IAP products in App Store Connect / Play Console.
2. Stand up `quizlift.app/privacy`, `/terms`, `/support` pages (URLs already declared in `BRAND`).
3. Trademark/domain/App Store name clearance.
4. Sandbox tester account + custom dev client (`npx expo prebuild` + EAS Build) — expo-iap doesn't run in Expo Go.
5. Final professional content QA pass.
