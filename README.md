# QuizLift — v0.6

Privacy-first iOS / iPad educational test-improvement app.
Stack: Expo + React Native + TypeScript + Expo Router.

> **Tagline:** Every miss becomes a lesson.

---

## What's new in v0.6

This release is the largest content + UX upgrade so far. The four headline changes:

### 1. New headline metric: ScoreLift Score (1–100)

The old QuestionLiftIQ Index (a 70–130 IQ-style scale modeled on Wechsler) is **gone**. It carried unacceptable legal and positioning risk.

In its place: the **ScoreLift Score**, a grade-anchored 1–100 scale where **50 = on-grade-level expected performance** for the chosen test, age, and grade. A 5th-grader scoring 50 on the aptitude snapshot is hitting expectations; a 5th-grader scoring 50 on the Algebra Fast-Track is also hitting expectations *for that test* — even though raw percent-correct will look very different.

Implemented in `src/features/scoring/scoreLiftScore.ts`. Each of the 9 tests has a per-grade expected percent that always maps to 50; the rest of the scale is built by piecewise-linear interpolation through 7 anchors.

### 2. Directional percentiles from public norm tables

We promised parents a percentile so the score has real-world meaning. We also promise no account, no server, no third-party analytics — so we can't build our own norm distributions.

Solution: bake in publicly-published norm tables from comparable tests and interpolate. The PDF and results screen now cite which benchmark each percentile is mapped against:

| Test                          | Benchmark                                             |
|-------------------------------|-------------------------------------------------------|
| Aptitude Snapshot             | NWEA MAP grade math norms                             |
| Compacted Math Readiness      | NWEA MAP grade math norms                             |
| Algebra Fast-Track Readiness  | Iowa Algebra Aptitude Test (IAAT)                     |
| Grade-Level Math Skills       | NWEA MAP grade math norms                             |
| Reading + Vocabulary          | NWEA MAP grade reading norms                          |
| STEM + Spatial                | Differential Aptitude Test 5th ed. (DAT-5)            |
| Coding Logic                  | Differential Aptitude Test 5th ed. (DAT-5)            |
| Kindergarten Readiness        | BRACKEN School Readiness Assessment 3rd ed.           |
| Military Aptitude (unofficial)| ASVAB AFQT                                            |

These are reference distributions. **No user data ever leaves the device.** Implemented in `src/features/scoring/externalBenchmarks.ts`.

### 3. Full dark mode + Liftie mascot + adaptive ordering

* **Dark mode** — every component and screen migrated to the `useColors() + makeStyles(colors)` factory pattern. Light and dark palettes live in `src/theme/colors.ts`. The PDF report intentionally stays light-mode only.
* **Illustrations** — `Mascot` (Liftie, 4 expressions × 3 moods), `Decoration`, `EmptyState`, `AchievementBadge` in `src/components/Illustrations.tsx`.
* **Adaptive presentation order** — same blueprint, same set of questions, but the order tunes to last-3-question accuracy. ≥80% correct steps difficulty up, ≤40% steps down. Implemented in `src/features/assessment/adaptiveSelector.ts`. Percent-correct stays meaningful.

### 4. Templates: 86 → 118

32 new v0.6 templates with a `phrase()` helper for deterministic surface-wording variants:

* **Reading comprehension** — 3 real-passage templates (honeybees, sequoias, Wright brothers, Maya/baking, Sam/dog, Pacific octopus, Mount Everest) with main-idea, inference, and detail variants
* **Vocabulary in context** — 1
* **Word problems** — 5 (two-step arithmetic, rate × distance, percent of, money + change, fractions sharing)
* **Spatial with visuals** — 4 wired to the SpatialVisual component
* **Science reasoning** — 4 (states of matter, life cycles, balanced forces, experimental variables)
* **Coding logic** — 4 (loop trace, conditional, Python negative-index, off-by-one debug)
* **Mechanical reasoning** — 3 (pulley advantage, lever balance, gear ratios)
* **Working memory** — 3 (digit recall reverse, instruction follow, letter recall)
* **Algebra readiness** — 3 (linear solve, expression evaluation, strict inequality)
* **K readiness with visuals** — 2 (count-stars, letter sounds)

---

## Project layout

```
app/                    Expo Router screens
  _layout.tsx           Stack + scheme-aware status bar
  index.tsx             Home (Liftie mascot + Quick Start + test catalog)
  select.tsx            Grade + test picker
  assessment.tsx        Question runner with adaptive ordering
  celebration.tsx       1.7-second finish moment
  results.tsx           ScoreLift Report (Score / Mistakes / Plan tabs)

src/
  config/brand.ts                          App brand + 1–100 scale + caveat
  theme/
    colors.ts                              light + dark palettes, useColors()
    domainColors.ts                        domain & 5 v0.6 band colors (light + dark)
    spacing.ts
  components/
    AppButton, Card, Screen, MetricBar, ProgressBar,
    QuestionOptionCard, LabeledPicker,
    SpatialVisual,                         theme-aware SVG illustrations
    PaywallModal,
    Illustrations.tsx                      Mascot, Decoration, EmptyState, AchievementBadge
  data/
    testCatalog, testBlueprints, practiceLibrary, questionBank,
    questionTemplates                      118 templates total
  features/
    assessment/
      types.ts                             ScoreLift Score, 5 v0.6 bands, benchmarkSource
      domainLabels                         5-band parent-friendly labels + thresholds
      assembleAssessment                   blueprint → questions
      scoreAssessment                      wires scoreLiftScore + externalBenchmarks
      adaptiveSelector                     pickInitialQuestion / pickNextQuestion
    generation/
      seededRandom, questionTemplateTypes
    scoring/
      scoreLiftScore.ts                    grade-anchored 1–100 mapping (NEW)
      externalBenchmarks.ts                NWEA MAP / IAAT / DAT-5 / BRACKEN-3 / ASVAB AFQT (NEW)
    reports/
      buildReportHtml                      light-mode PDF, ScoreLift Score lead, benchmark cite
  services/
    historyService                         opt-in local history, scoreLiftScore + previousScore + liftScore
    pdfReportService                       Print → Share → Delete
    paywallService                         $2.99 / $14.99, mock IAP (3 StoreKit 2 TODOs)
    notificationService                    Day-7 retake reminder
    privacyWipeService
  utils/
    ageFromGrade, speakPrompt

scripts/
  smoke-test-content.js                    201 v0.6 invariant checks
```

---

## Run the smoke test

```bash
node scripts/smoke-test-content.js
```

Should report:

```
ALL CHECKS PASSED — v0.6 is ready.
```

---

## Privacy promise (unchanged)

* **No account.** No sign-in, ever.
* **No server-stored results.** Everything is computed and stored on-device.
* **No third-party analytics.** No SDKs that phone home.
* **No ads.**
* **No child name required.** A grade picker is the only profile input.
* **Local-only scoring.** Even the percentile lookup is a baked-in pure function.
* **Opt-in history.** Default OFF. Stored as `qlq:history:v1` in AsyncStorage. Deleted with the app.

The benchmark norm tables in `src/features/scoring/externalBenchmarks.ts` are reference distributions only. **No user data is ever sent anywhere.**

---

## Pricing (unchanged from v0.5)

* **Single test** — $2.99 lifetime, unlocks Mistakes / Plan / PDF for one test.
* **All-Access** — $14.99 lifetime, unlocks all 9 modules forever.
* **Quick Start** — 10-question free sample, fully unlocked, no setup.

StoreKit 2 is still mocked in v0.6. Three TODOs in `paywallService.ts` are the integration points.

---

## Disclaimers (preserved)

QuizLift is an educational practice and screening tool. It is **not**:

* a clinical IQ test or diagnostic instrument,
* an official school placement test,
* an official military exam product,
* a normed assessment with QuizLift-specific percentile ranks.

ASVAB / military aptitude practice is unofficial. Percentile estimates are directional comparisons against published public norm tables for similar tests. The QuizLift trademark has not yet been formally cleared.

---

## Migration guide (v0.5 → v0.6)

If you forked v0.5, the rename map is:

| v0.5                                          | v0.6                                          |
|-----------------------------------------------|-----------------------------------------------|
| `BRAND.productIndexName`                      | `BRAND.productScoreName`                      |
| `result.questionLiftIndex`                    | `result.scoreLiftScore`                       |
| `result.percentileEstimate.distributionLabel` | `result.percentileEstimate.benchmarkSource`   |
| `HistoryEntry.questionLiftIndex`              | `HistoryEntry.scoreLiftScore`                 |
| `ScoreLift.previousIndex`                     | `ScoreLift.previousScore`                     |
| `ScoreLift.liftIndex`                         | `ScoreLift.liftScore`                         |
| `'needs-practice' \| 'developing' \| 'ready-soon' \| 'ready' \| 'advanced'` | `'below' \| 'approaching' \| 'on-grade' \| 'above' \| 'well-above'` |
| `colors` static import                        | `useColors()` hook + `makeStyles(colors)`     |
| `bandStyle()` static helper                   | `useBandStyle()` hook                         |
| `domainColor()` static helper                 | `useDomainColor()` hook                       |
| `staticDistributions.ts`                      | DELETED — replaced by `externalBenchmarks.ts` |
