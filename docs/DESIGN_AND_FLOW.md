# QuizLift — design and user flow (v0.8)

## Product position

QuizLift is a privacy-first short-test diagnostic app focused on score improvement. The app should feel useful after every attempt, because the value is not only the score; it is the explanation of what went wrong and what to practice next.

Tagline: **Every miss becomes a lesson.**

Core promise:

> Short diagnostic tests with percent scores, a 1–100 ScoreLift Score, directional percentile ranges sourced from public norm tables, mistake maps, step-by-step solutions, targeted practice links, and randomized retake sprints.

## Core user flow

1. **Home (`app/index.tsx`)**
   - Liftie mascot + tagline.
   - Privacy trust badge row (no account / nothing leaves your phone / no ads, ever).
   - **Quick Start** CTA: 10-question sample of the Aptitude Snapshot, fully unlocked, no setup.
   - Test catalog: 9 modules with parent-friendly subtitles and a `⚡ Most popular` chip on the Aptitude Snapshot.
   - Opt-in "Track score lift over time" switch (default OFF).
   - Privacy checklist + disclaimers.

2. **Test setup (`app/select.tsx`)**
   - Grade dropdown (-1 = Pre-K, 0 = K, 1–12, 20 = adult). Age is auto-derived.
   - Test type dropdown.
   - Recommended/outside-recommended-range pill.
   - Question count + duration + report promise.
   - Generates a unique session seed.

3. **Assessment (`app/assessment.tsx`)**
   - One question per screen. Blueprint determines the set; the **adaptive selector** in `src/features/assessment/adaptiveSelector.ts` decides the *order* based on rolling 3-question accuracy. ≥80% steps difficulty up; ≤40% steps down. Same total set is asked, so percent correct stays meaningful.
   - "Read aloud" button on KG / age ≤ 7 modules via `expo-speech`.
   - Optional `<SpatialVisual>` SVG above the prompt for visual items (cube, grid-3, grid-4, mirror-letter, mirror-arrow, shape, count-stars, **dot-compare** for KG number comparison).

4. **Celebration (`app/celebration.tsx`)**
   - 1.7-second finish moment: animated check + count-up to final percent. Forwards to results.

5. **Results (`app/results.tsx`)**
   - **Lead tile**: ScoreLift Score (1–100), label band, and inline retake delta when history is on (`⬆️ +N points from last time` etc).
   - Percent correct + estimated percentile range with the benchmark source cited (e.g. "vs. NWEA MAP").
   - Tabs: **Score** (free), **Mistakes** (paywalled — visible behind real `expo-blur`), **Plan** (same).
   - **Share Score** button (free, prominent) — captures `<ScoreCard>` (light-mode only PNG) via `react-native-view-shot`, opens native share sheet, deletes the temp file. Never includes name/age/grade.
   - **Export ScoreLift PDF** button (paywalled). Print → Share → Delete via `pdfReportService`.
   - **Retake with new numbers** button generates a fresh seed.

6. **Paywall (`src/components/PaywallModal.tsx`)**
   - $2.99 single-test or $14.99 all-access lifetime.
   - Real **StoreKit 2 / Play Billing** via `expo-iap`. Connection lifecycle in `app/_layout.tsx`.

## ScoreLift PDF report

The PDF is the paid product. It answers five questions:

1. How did I do?
2. What did I miss?
3. Why did I miss it?
4. How do I solve it correctly?
5. What should I practice next?

Sections (light-mode only, `src/features/reports/buildReportHtml.ts`):

- Cover summary with the **ScoreLift Score** as lead headline.
- Percent correct.
- Estimated percentile range with `benchmarkSource` cited (e.g. "vs. NWEA MAP grade math norms") and the per-test caveat.
- Readiness band (5 v0.6 names: well-above / above / on-grade / approaching / below).
- Domain ratings.
- Strengths and growth areas.
- Mistake Map.
- Step-by-step solution for every missed question.
- Practice links.
- 7-day ScoreLift plan.
- Retake recommendation.
- Disclaimers and privacy note.

## Scoring model (v0.6+)

Three numbers shown alongside each other:

1. **Percent correct** — most transparent score.
2. **ScoreLift Score (1–100)** — grade-anchored. 50 = on-grade-level expected performance for the chosen test/age/grade. Implemented as piecewise-linear interpolation through 7 anchors in `src/features/scoring/scoreLiftScore.ts`.
3. **Estimated percentile range** — directional, sourced from a public norm table for a comparable test (NWEA MAP / IAAT / DAT-5 / BRACKEN-3 / ASVAB AFQT). Implemented in `src/features/scoring/externalBenchmarks.ts`. Includes `source` and `caveat` fields.

Standard percentile disclaimer:

> Estimated percentile ranges are directional comparisons against published norm tables (such as NWEA MAP and ASVAB AFQT). They are not nationally normed scores for QuizLift.

ASVAB-related content:

> This module is unofficial ASVAB-style practice. It is not affiliated with, endorsed by, or equivalent to the official ASVAB.

## Randomized retake model

Blueprint + template + seed:

- **Blueprint** says: ask 4 fraction/ratio questions at difficulty 3.
- **Template** says: generate a ratio scaling recipe problem.
- **Seed** decides numbers, wording variant (via `phrase()`), distractors, name (via `randomName()`), and answer order.
- **Retake** uses a fresh seed → equivalent practice with different numbers.

The `phrase(rng, options)` helper picks one of N surface forms deterministically. The `NAME_POOL` (16 names across ethnicities/gender) keeps word problems from feeling tokenizing.

## Privacy model

Non-negotiable promises:

- No account.
- No server storage.
- No third-party analytics, no SDKs that phone home.
- No ads.
- No child name required.
- Local-only scoring; even the percentile lookup is a baked-in pure function.
- AsyncStorage uses the `qlft:` prefix for any opt-in local data.
- PDF and ScoreCard PNG are temp files; deleted after sharing returns.
- The Mistake Map / Plan content is gated, not the privacy story.
- Real IAP receipts are the source of truth; AsyncStorage is just a fast local mirror.

## Module map

```
.github/workflows/ci.yml         CI (typecheck + smoke + jest)
__tests__/                       Jest unit tests (5 suites, 50 tests)
app/                             Expo Router screens
src/
  config/brand.ts                Brand constants + privacy/terms/support URLs
  theme/                         colors / domainColors / spacing (light + dark)
  components/                    All on useColors() + makeStyles(colors) factory
    Illustrations.tsx            Liftie / Decoration / EmptyState / AchievementBadge
    SpatialVisual.tsx            Theme-aware SVG illustrations (incl. dot-compare)
    ScoreCard.tsx                v0.8 shareable PNG card
    PaywallModal.tsx
  data/
    testCatalog                  9 tests, popular flag on Aptitude Snapshot
    testBlueprints               domain/difficulty mix per test
    questionTemplates.ts         123 templates (118 v0.6 + 5 v0.7)
    practiceLibrary.ts
  features/
    assessment/
      types.ts                   ScoreLift Score, 5-band ScoreBand, benchmarkSource
      domainLabels.ts            5-band labels + 0.85/0.70/0.50/0.30 cuts
      assembleAssessment.ts      blueprint → questions
      scoreAssessment.ts         wires scoreLiftScore + externalBenchmarks
      adaptiveSelector.ts        pickInitialQuestion / pickNextQuestion
    generation/
      seededRandom.ts
      questionTemplateTypes.ts
    scoring/
      scoreLiftScore.ts          1–100 mapping
      externalBenchmarks.ts      NWEA MAP / IAAT / DAT-5 / BRACKEN-3 / ASVAB AFQT
    reports/
      buildReportHtml.ts         light-mode PDF
  services/
    historyService.ts            opt-in local history (qlft: prefix)
    pdfReportService.ts          Print → Share → Delete
    paywallService.ts            v0.8 real expo-iap (StoreKit 2 / Play Billing)
    scoreCardService.ts          v0.8 ScoreCard capture + share + delete
    notificationService.ts       Day-7 retake reminder
    privacyWipeService.ts
  utils/                         ageFromGrade, speakPrompt
scripts/
  smoke-test-content.js          Content invariant checks
```

## Build milestones

Done through v0.8:

- ✅ ScoreLift Score replaces the IQ-style metric.
- ✅ External-benchmark percentiles with cited sources.
- ✅ Full dark mode + Liftie + adaptive ordering.
- ✅ 123 reviewed templates with `phrase()` + `NAME_POOL`.
- ✅ Visual items (cube, grid-3/4, mirror-letter/arrow, shape, count-stars, dot-compare).
- ✅ Real StoreKit 2 / Play Billing via `expo-iap`.
- ✅ Shareable PNG ScoreCard for viral sharing (free, even when paywalled).
- ✅ Paywall teaser overlay with real `expo-blur`.
- ✅ Trust badge row + Most-popular chip.
- ✅ CI: typecheck + smoke + Jest on every push/PR.
- ✅ Privacy/terms/support URLs in `BRAND`.

Open before App Store submission:

1. Replace `com.example.quizlift.*` with the real bundle ID and create matching IAP products in App Store Connect / Play Console.
2. Stand up the public pages at `quizlift.app/privacy`, `/terms`, `/support`.
3. Trademark/domain/App Store name clearance for "QuizLift".
4. Apple Developer account + sandbox tester setup; build a custom dev client (`npx expo prebuild` + EAS Build) since `expo-iap` doesn't run in Expo Go.
5. Final professional content QA pass on every template.
