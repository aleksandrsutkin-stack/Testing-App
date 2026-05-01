# QuizLift — Project Context Document (v0.8)

**Recommended use:** Load this document into the LLM project as the main project knowledge/context file. Use `PROJECT_INSTRUCTIONS_COMPACT.md` as the always-on Project Instructions if there is a separate instructions field.

**Working name:** QuizLift
**Tagline:** Every miss becomes a lesson.
**Current app version:** v0.8
**Platform:** iPhone/iPad first, using Expo + React Native + TypeScript + Expo Router.

---

## 1. What we are building

QuizLift is a privacy-first educational test-improvement app:

> A short-test diagnostic app that helps students improve test results by turning every missed question into a step-by-step practice plan.

User flow:

1. Choose a test and grade.
2. Take a short generated diagnostic with adaptive ordering.
3. See percent correct, **ScoreLift Score (1–100)**, estimated percentile range vs. a public benchmark, and domain ratings.
4. Review what was missed.
5. Learn each missed question through step-by-step solutions.
6. Follow links to Khan Academy or other free practice resources.
7. Export a polished PDF report (paid) or share a designed PNG score card (free).
8. Retake a new randomized but equivalent test sprint.

The PDF is the paid product. Single-test PDF: $2.99 lifetime. All-Access: $14.99 lifetime. Real **StoreKit 2 / Play Billing** via `expo-iap` is wired in v0.8.

---

## 2. Strategic positioning

QuizLift is an educational screening and practice tool. It must not be positioned as:

- a clinical IQ test
- a diagnostic instrument
- a gifted-identification test
- an official school placement decision
- an official ASVAB product
- an official SAT/ACT/MAP/CogAT/WISC/Raven replacement

Use careful language:

- aptitude snapshot (not "IQ-style aptitude snapshot")
- readiness screen
- practice sprint
- estimated percentile range
- ScoreLift Score
- ScoreLift Report
- practice plan

Do not say:

- real IQ score / clinical IQ
- nationally normed percentile (we say *"directional comparison against a published distribution"* instead)
- official placement score
- guaranteed test improvement
- official ASVAB/SAT/ACT practice

Standard percentile disclaimer:

> Estimated percentile ranges are directional comparisons against published norm tables (such as NWEA MAP and ASVAB AFQT). They are not nationally normed scores for QuizLift.

ASVAB-related content:

> This module is unofficial ASVAB-style practice. It is not affiliated with, endorsed by, or equivalent to the official ASVAB.

---

## 3. Privacy model

The privacy model is a key differentiator.

v0.8 promises:

- no account
- no server storage
- no third-party analytics
- no ads
- no child name required
- local-only scoring (even percentile lookup is a baked-in pure function)
- generated PDF report + native share sheet
- temporary PDF/PNG deletion after sharing returns
- session route replacement after export/erase
- benchmark distributions are static, baked-in, public-source data
- Mistake Map / Plan are paywalled, but the privacy story is not
- IAP receipts are the source of truth; AsyncStorage is a fast local mirror only
- AsyncStorage prefix `qlft:` for any opt-in local data
- ScoreCard PNG export never includes child name, age, or grade

If history is added, it is opt-in, local-only, and easy to erase. v0.6+ keeps the local-only `historyService` for the ScoreLift progress card but never networks it.

---

## 4. Codebase summary (v0.8)

Codebase: `quizlift-mobile-app` v0.8.0, Expo + React Native + TypeScript + Expo Router. Dependencies pinned to exact versions; lockfile committed. CI runs `tsc --noEmit`, the smoke test, and Jest on every push and PR.

### Main screens (`app/`)

- `_layout.tsx` — Stack + scheme-aware status bar + IAP connection lifecycle (connectIAP on mount, disconnectIAP on unmount).
- `index.tsx` — Home: Mascot + tagline + privacy trust badge row + Quick Start + test catalog with parent-friendly subtitles + `⚡ Most popular` chip on Aptitude Snapshot.
- `select.tsx` — Grade + test pickers; age auto-derived.
- `assessment.tsx` — One question at a time, **adaptive ordering** based on rolling 3-question accuracy.
- `celebration.tsx` — 1.7-second post-completion moment.
- `results.tsx` — ScoreLift Score lead tile with retake delta, percentile cite, Score / Mistakes / Plan tabs, **Share Score** PNG button (free), **Export PDF** button (paid).

### Theme (`src/theme/`)

- `colors.ts` — `lightColors` / `darkColors` / `useColors()` hook / `ColorPalette` type.
- `domainColors.ts` — `DOMAIN_COLORS` light + dark, `BAND_COLORS` (5 v0.6 bands × light + dark), `useDomainColor()` and `useBandStyle()` hooks.
- `spacing.ts`.

### Components (`src/components/`)

All on the `useColors() + makeStyles(colors)` factory pattern.

- `AppButton.tsx`, `Card.tsx`, `LabeledPicker.tsx`, `MetricBar.tsx`, `ProgressBar.tsx`, `QuestionOptionCard.tsx`, `Screen.tsx`, `SpatialVisual.tsx`, `PaywallModal.tsx`.
- `Illustrations.tsx` — Liftie mascot (4 expressions × 3 moods), `<Decoration>`, `<EmptyState>`, `<AchievementBadge>`.
- `ScoreCard.tsx` (v0.8) — fixed-size shareable card, light-mode only, Liftie + ScoreLift Score + test name + percentile + brand footer.

### Data (`src/data/`)

- `testCatalog.ts` — 9 tests with `subtitle` (parent-friendly) and optional `popular` flag.
- `testBlueprints.ts` — stable domain/difficulty mix.
- `questionTemplates.ts` — **123 templates** (118 v0.6 + 5 v0.7) using `phrase()` and `NAME_POOL` helpers.
- `practiceLibrary.ts` — Khan Academy and other free practice links.

### Scoring + assessment (`src/features/`)

- `assessment/types.ts` — `ScoreBand` is `'below' | 'approaching' | 'on-grade' | 'above' | 'well-above'`. `AssessmentResult.scoreLiftScore: number`. `PercentileEstimate` carries `benchmarkSource` and `caveat`. `visualType` includes `'dot-compare'`.
- `assessment/domainLabels.ts` — 5-band labels and `getBand()` thresholds at 0.85 / 0.70 / 0.50 / 0.30.
- `assessment/assembleAssessment.ts` — generates a session from test, profile, and seed.
- `assessment/scoreAssessment.ts` — wires percent correct, ScoreLift Score, external benchmark, domain ratings, Mistake Map, and practice plan.
- `assessment/adaptiveSelector.ts` — `pickInitialQuestion`, `pickNextQuestion`, `computeTargetDifficulty`. Adapts presentation order based on rolling 3-question accuracy.
- `generation/seededRandom.ts` — `rng.int`, `rng.pick`, `rng.fork`, `shuffleWithRng`, `makeSessionSeed`.
- `generation/questionTemplateTypes.ts` — template interfaces.
- `scoring/scoreLiftScore.ts` — `computeScoreLiftScore`, `TEST_EXPECTATIONS`, `scoreLiftScoreLabel`. Grade-anchored 1–100 with 7 anchors.
- `scoring/externalBenchmarks.ts` — `estimatePercentile(percentCorrect, testId)`. Maps to NWEA MAP, IAAT, DAT-5, BRACKEN-3, ASVAB AFQT.

### Services (`src/services/`)

- `pdfReportService.ts` — Print → Share → Delete.
- `historyService.ts` — opt-in local history; `previousScore` / `liftScore`. AsyncStorage prefix `qlft:`. Uses `removeMany` (AsyncStorage v2 API).
- `paywallService.ts` — **v0.8 real expo-iap**. `connectIAP`/`disconnectIAP` lifecycle, `purchaseUpdatedListener`, `finishTransaction({ isConsumable: false })`. AsyncStorage is a fast local mirror; platform receipts are the source of truth. SKUs marked `// REPLACE`.
- `scoreCardService.ts` (v0.8) — `shareScoreCard(ref)` captures via `react-native-view-shot`, opens native share sheet, deletes temp PNG.
- `notificationService.ts` — Day-7 retake reminder via `expo-notifications`.
- `privacyWipeService.ts` — wipe/checklist helpers.

### Reports (`src/features/reports/`)

- `buildReportHtml.ts` — light-mode PDF. Cover leads with `result.scoreLiftScore` and `result.scoreLiftScoreLabel`. Percentile section cites `result.percentileEstimate.benchmarkSource` (e.g. "NWEA MAP", "IAAT", "DAT-5", "BRACKEN-3", "ASVAB AFQT") and the per-test `caveat`.

### Tests (`__tests__/`)

50 unit tests across 5 suites covering `computeScoreLiftScore`, `getBand`, `estimatePercentile`, seeded RNG, and `createAssessmentSession`. Pure ts-jest; no jest-expo since the modules under test are framework-free.

### CI (`.github/workflows/ci.yml`)

Three-stage pipeline on every push and PR: typecheck, smoke, jest.

---

## 5. Test modules (unchanged from v0.5+)

1. **QuizLift Aptitude Snapshot** — broad aptitude screen; carries the `popular: true` flag for the home-screen chip.
2. **Compacted Math Readiness** — accelerated math readiness.
3. **Double-Compacted / Algebra Fast-Track** — aggressive math acceleration.
4. **Grade-Level Math Skills Check** — current-grade math gap diagnostic.
5. **Reading + Vocabulary Snapshot** — vocabulary and comprehension (with real passages including main idea, inference, detail).
6. **STEM + Spatial Reasoning Sprint** — spatial, science, and pattern reasoning.
7. **Coding Logic Sprint** — sequence, loop, and algorithmic-thinking readiness.
8. **Kindergarten Readiness Mini Check** — early numeracy with `dot-compare` visuals, beginning-letter sounds, parent observation, shape ID.
9. **Military Aptitude Practice Sprint** — unofficial ASVAB-style verbal, math, science, mechanical practice.

---

## 6. Scoring model

The results screen and PDF show three numbers:

1. **Percent correct** — most transparent score. Always shown.
2. **ScoreLift Score (1–100)** — lead headline. 50 = on-grade-level for the chosen test/age/grade. Replaces the v0.5 QuestionLiftIQ Index (70–130).
3. **Estimated percentile range** — directional, computed from a published norm table for a comparable test (NWEA MAP for grade math, ASVAB AFQT for the military module, etc.). Includes a `source` line on the UI: *"vs. NWEA MAP grade norms"* and a caveat in the PDF disclaimer.

Bands (5): well-above / above / on-grade / approaching / below. Thresholds at 0.85 / 0.70 / 0.50 / 0.30 of percent correct.

Improvement path: continue to refine grade-anchored expectations per test as content QA matures; never collect user data to build private norms.

---

## 7. Adaptive presentation model

Same blueprint, same set of questions. What v0.6+ adds is **order**:

- First question: closest available difficulty to 3 (medium).
- After ≥2 answers: target difficulty = function of the last 3 answers' accuracy.
- Pool filtered by `!answeredIds`, sorted by `|diff - target|` then original index (deterministic for a given seed + answer pattern).

This is intentionally *not* full adaptive testing (CAT). It's "adaptive ordering" — kids who are crushing it see harder items earlier; struggling kids see easier items earlier. Same total set is asked, so percent correct stays meaningful and seed-deterministic retake design still works.

---

## 8. Randomized retake model

Blueprint + template + seed:

- **Blueprint** says: ask 4 fraction/ratio questions at difficulty 3.
- **Template** says: generate a ratio scaling recipe problem.
- **Seed** decides: numbers, wording variant, distractors, name (`NAME_POOL`), answer order.
- **Retake** uses a new seed → equivalent practice with different numbers.

Helpers:

- `phrase(rng, options)` picks one of N surface forms deterministically.
- `randomName(rng)` picks from `NAME_POOL` (16 names across ethnicities/gender).
- `rng.fork(salt)` derives a child RNG so generators don't collide.

`makeSessionSeed(testId, age, grade)` is intentionally non-deterministic (it mixes in `Date.now()` and `Math.random()`) so each new session/retake gets a fresh seed.

---

## 9. ScoreLift PDF report spec

The PDF is the paid deliverable. Sections:

- Cover with **ScoreLift Score (1–100)** as the lead metric.
- Percent correct.
- Estimated percentile range with **benchmark source** cited (e.g. "vs. NWEA MAP grade math norms").
- Readiness band (well-above / above / on-grade / approaching / below).
- Domain ratings.
- Strengths.
- Growth areas.
- Mistake Map.
- Step-by-step solution for every missed question.
- Practice links.
- 7-day ScoreLift plan.
- Retake recommendation.
- Disclaimers (incl. percentile caveat referencing source norm tables) and privacy note.

Feature names: ScoreLift Report, Mistake Map, Step Solutions, Practice Links, Retake Sprint, Estimated Percentile Range, **ScoreLift Score**.

---

## 10. v0.8 product extras (sharing + conversion)

- **Privacy trust badge row** on the home screen — three quiet badges (no account / nothing leaves your phone / no ads, ever) above the Quick Start CTA.
- **Catalog subtitles** — every test has a parent-friendly one-line subtitle, plus an `⚡ Most popular` chip on the Aptitude Snapshot.
- **Shareable Score Card (PNG)** — `<ScoreCard>` rendered off-screen, captured to a temp PNG, shared via the native share sheet, deleted after share returns. Free even when the rest of the report is locked. Never includes child name/age/grade.
- **Retake delta** — when a previous attempt exists for the same test, the lead tile shows `⬆️ +N points from last time` / `➡️ Same score…` / `⬇️ -N points from last time` (negative is muted, not red — we don't discourage).
- **Paywall teaser overlay** — Mistakes/Plan tabs are navigable when locked; content renders behind real `expo-blur` `<BlurView>` with a centred "Unlock — $2.99" CTA. PDF stays paywalled; ScoreCard does not.

---

## 11. Naming notes

Working name: **QuizLift**. Not legal clearance. Names previously screened/avoided: BrightSpark, SparkIQ, WunderkindIQ, WizKidzIQ, TestsRus, TestLift, PrepLift, TestWise, TestCoach, TestSprint, StepWise, PracticeIQ, SkillSprint, TestFix.

Trademark/domain/App Store name clearance still pending.

---

## 12. References baked into the codebase

### Public norm references in `externalBenchmarks.ts`

- **NWEA MAP Growth norms** — grade-level math, reading, K readiness percentile mapping.
- **Iowa Algebra Aptitude Test (IAAT)** — Algebra Fast-Track percentile mapping.
- **Differential Aptitude Test, 5th ed. (DAT-5)** — STEM/spatial reasoning percentile mapping.
- **BRACKEN School Readiness Assessment, 3rd ed.** — Kindergarten Readiness percentile mapping.
- **ASVAB AFQT** — unofficial Military Aptitude module percentile mapping.

These are referenced as public published distributions. The app does not reproduce official items or call any external API — only directional percentile thresholds are baked in as numbers.

### Existing references

- Apple `developer.apple.com/kids` — Kids Category design and privacy expectations.
- Expo docs for Router, TypeScript, Print, Sharing, FileSystem, Speech, Notifications, View Shot, Blur, IAP.
- Khan Academy practice library.
- Apple privacy/data-use pages.
- Pearson assessments / WISC-V reference for what we are *not* doing.
- ASVAB official site for what "official" means and how we differentiate.

---

## 13. Status: done vs. open

### ✅ Done through v0.8

- Brand: QuizLift, ScoreLift Score, no IQ language.
- Theme system + dark mode across all components and screens.
- Domain + band colors (light + dark) with 5 v0.6 band names.
- ScoreLift Score (1–100) and external-benchmark percentiles for all 9 tests.
- Adaptive presentation order in the assessment flow.
- Illustrations (Liftie + Decoration + EmptyState + AchievementBadge).
- 123 templates (118 v0.6 + 5 v0.7) with phrasing variants and `NAME_POOL`.
- KG content overhaul: dot-compare visual, beginning-letter-sound items, parent-observation prompts, shape ID, KG-voice common traps.
- ScoreCard sharing + retake delta + paywall teaser blur (v0.8).
- Real expo-iap (StoreKit 2 / Play Billing) replacing the mock.
- CI: typecheck + smoke + jest on every push/PR.
- 50 Jest unit tests on scoring, percentile, RNG, and assembler.
- Pinned dependencies, committed lockfile, `.gitignore`.
- Privacy/terms/support URLs in `BRAND`.
- README + internal docs refreshed to current state.

### 🟡 Open before App Store submission

1. Apple Developer account + App Store Connect record under your real bundle ID. Replace `com.example.quizlift.*` with your real product IDs.
2. Stand up the public pages at `quizlift.app/privacy`, `/terms`, `/support`.
3. Trademark/domain/App Store name clearance for "QuizLift".
4. Sandbox tester account; build a custom dev client (`npx expo prebuild` + EAS Build) — `expo-iap` doesn't run in Expo Go.
5. Final professional content QA pass on every template.
6. Optional: swap the conservative percentile interpolation in `externalBenchmarks.ts` for richer per-grade tables once content stabilises.

---

## 14. Development rules

- Keep the app modular.
- Centralise product copy in `src/config/brand.ts`; do not hard-code claims into multiple places.
- New tests must have catalog entry, blueprint, templates, **external benchmark mapping**, and report disclaimer.
- Every new question template must produce correct answer, distractors, explanation steps (real teaching, not restated answer), common trap, mistake tags, and practice links.
- All new components must use `useColors()` + `makeStyles(colors)` factory pattern. No hardcoded color literals except deliberate brand accents.
- All new wording variants use `phrase()`; named characters use `randomName()`; everything routes through the seeded RNG so retakes stay reproducible.
- Avoid live AI-generated answer keys. Prefer authored or deterministic template-generated solutions.
- Never copy proprietary/official test items from WISC, Raven, ASVAB, MAP, SAT, CogAT, etc.
- Keep scoring transparent: ScoreLift Score is grade-anchored, not norm-referenced; the percentile is directional, sourced, and caveated.
- Keep privacy local-first. Benchmark distributions are baked in; user data is never sent anywhere.
- Treat the PDF report as the paid product. The ScoreCard PNG is free — it's the viral hook, not the product.
- Run `npm run typecheck && npm run smoke:test-content && npm test` before pushing. CI also runs all three.
