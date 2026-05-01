# QuizLift — v0.9

Privacy-first iOS / iPad educational test-improvement app.
Stack: Expo + React Native + TypeScript + Expo Router.

> **Tagline:** Every miss becomes a lesson.

---

## What's new in v0.9

Two themes: make the **ScoreLift Report feel like a $50 deliverable**, and rework scoring labels so the product reads as professional and trustworthy.

### Premium ScoreLift Report

* **Parent summary** — every report now opens with a 2–3 sentence plain-English summary in parent voice, computed from the band, strongest domain, and weakest domain. Read first on both the PDF and the Score tab.
* **Top 3 to fix first** — the most actionable section on the page. Skills are grouped by impact (`misses × 2 + avg difficulty`) and ranked. Each fix maps the dominant mistake tag to a plain-English cause ("the issue is keeping track across multiple steps") and a Khan Academy link.
* **Cover restructure** — leads with the band headline ("On Track ✓") at 36–48px, with the score number as a supporting line. A parent who sees "50" no longer reads it as an F.
* **Score-band gradient bar** — single horizontal bar from amber → green with 5 segments and a triangle pointer. The most legible "where am I?" visual on the page.
* **Domain radar** — pure inline SVG (PDF-safe) showing all domains at once with a dashed 50% on-grade reference ring. Sits next to the existing domain bars.
* **Better domain bars** — taller (14px), domain-colored fill, percentage on the right, dotted "On grade" reference line at 50%.
* **Sample report preview** — a screenshot-style card on the home screen ("What you get with the ScoreLift Report") tappable into a full-screen `WebView` of the actual `buildReportHtml()` output for a hardcoded sample (Alex, 4th grade Compacted Math). Converts uncertainty into "I want this for my kid" before payment.
* **"Send to tutor" framing** — after a successful PDF export, the action sheet now leads with "Send to tutor or teacher ›" instead of a generic share button. Reframes the value prop from "find out about my kid" to "I have a deliverable for the professional I'm paying."
* **Optional "Prepared for" name on the cover** — text input on the test setup screen ("Student first name or initials"). Session-only, never persisted, omitted entirely if blank.
* **PDF footer** now reads "Generated locally by QuizLift · No data was sent anywhere." — the single most important trust signal a tutor will see.
* **"How to read this report" callout** — three short paragraphs (`ScoreLift Score`, `Benchmark range`, `Confidence`) right before the legal footer. Does more for credibility than any individual relabel.

### Scoring credibility labels

* **"Estimated percentile" → "Benchmark range"** in every UI label and PDF section. Internal type names (`PercentileEstimate`, `percentileEstimate`) are unchanged. The new phrasing reads as a directional comparison rather than a measured claim.
* **Confidence badge** — every result now carries a `screeningConfidence` of `low` / `moderate` / `stronger` based on test length. Rendered as a neutral pill next to the benchmark range with a one-line explanation. A 10-question Quick Start no longer carries the same weight signal as a 30-question full assessment.
* **"On Track ✓" headlines** — `BAND_HEADLINES` map provides a parent-friendly headline per band (`Well Above Grade ⭐`, `Above Grade ↑`, `On Track ✓`, `Approaching Grade →`, `Building Foundations ◐`). "Building Foundations" replaces "Below grade" — same information, encouraging frame.
* **Unified directional caveat** — every percentile section now reads "Directional comparison using public benchmark-style tables ({benchmarkSource}). Not an official score from NWEA, IAAT, ASVAB, or any QuizLift-specific norming." Same line on every report regardless of which test was taken.
* **Disclaimer block** — every test's existing disclaimer is preserved; a unified credibility paragraph is appended automatically in `scoreAssessment.ts`.

### Templates / scoring math / blueprints

**Unchanged.** v0.9 is a UI + report + labels pass. The underlying score, percentile, blueprint, and adaptive-ordering logic are exactly as in v0.7 / v0.8.

---

## What's new in v0.8

Sharing, conversion, and infrastructure hardening.

* **Privacy trust badge row** on the home screen — three quiet badges (no account, nothing leaves your phone, no ads ever) above the Quick Start CTA. The privacy story is the differentiator; it should be visible without scrolling.
* **Catalog subtitles + "Most popular" chip** — every test gets a parent-friendly one-line subtitle. The Aptitude Snapshot carries an `⚡ Most popular` pill on the home screen.
* **Shareable Score Card (PNG)** — `src/components/ScoreCard.tsx` + `src/services/scoreCardService.ts`. Free even when the rest of the report is locked: it's the viral hook, not the product. Captured via `react-native-view-shot`, shared via `expo-sharing`, temp file deleted on return (same privacy pattern as the PDF). Never includes child name, age, or grade.
* **Retake delta** — when a user retakes a test they've taken before, the lead score tile shows `⬆️ +N points from last time` / `➡️ Same score…` / `⬇️ -N points from last time`. The richer `ScoreLiftCard` then→now comparison stays.
* **Paywall teaser overlay** — Mistakes/Plan tabs are now navigable when locked; their content renders behind a real `expo-blur` `<BlurView>` with a centred "Unlock — $2.99" CTA. The PDF stays paywalled; Share Score does not.
* **Real StoreKit 2 / Play Billing** — `paywallService.ts` rewritten on `expo-iap`. AsyncStorage demoted to a fast local mirror; platform receipts are the source of truth. Connection lifecycle wired into `app/_layout.tsx`. The `purchaseUpdatedListener` calls `finishTransaction({ isConsumable: false })` and resolves request promises via a per-SKU map. SKUs marked `// REPLACE` until the App Store Connect record exists.
* **CI** — `.github/workflows/ci.yml` runs `tsc --noEmit`, the smoke test, and `jest` on every push and PR.
* **Pinned dependencies** — every dep moved from `"latest"` to its actually-resolved version. Lockfile committed.
* **50 Jest unit tests** — `__tests__/*.test.ts` covers `computeScoreLiftScore`, `getBand`, `estimatePercentile`, seeded RNG determinism, and `createAssessmentSession` for all 9 tests.

---

## What was new in v0.7 (content review pass)

Teacher-review content fixes across templates and KG. Net: 118 → 123 templates; no template IDs renamed (existing seeds still produce valid sessions).

* **Real `explanationSteps`** in 6+ templates that previously just restated the answer (life science, mechanical leverage, system diagram, force/motion, electrical basics).
* **`dot-compare` visual** added to `SpatialVisual` and wired into `kg-compare-numbers` so KG kids see two dot groups instead of bare numerals.
* **KG content overhaul** — body-parts items replaced with beginning-letter-sound items in `kg-vocabulary-body`; common traps rewritten for the KG voice ("Look carefully" not "Read carefully", child-action language, no test-taking meta-advice).
* **Two new KG templates** — `kg-parent-observe-readiness-v7` (parent-observation prompts) and `kg-shape-identify-v7` (counting-sides phrasing variant).
* **5 new reading passages** in `rc-passage-main-idea-v6` (dogs, ocean, Gutenberg printing press, coral reefs) covering easier and harder Lexile tiers, plus a non-US human-achievement passage.
* **Two new reading templates** — `rc-passage-inference-v7` and `rc-passage-detail-v7` as additive siblings to the v6 versions, giving the assembler more pool depth.
* **Diverse `NAME_POOL`** (16 names across ethnicities/gender) plus `randomName(rng)` helper wired into the word-problem templates. Seed determinism preserved via `rng.pick`.
* **`reading-simile-v7`** — easier-tier figurative-language template at difficulty 2 (similes are noticeably easier than metaphor/personification).
* Polish: `mech-pulley-v6` units softened to "kg-force" with a newtons-equivalent note; `alg-inequality-v6` explanation expanded from 2 to 4 steps.

---

## v0.6 — the foundation

The release that introduced the metric, dark mode, illustrations, and adaptive ordering. Kept here for reference.

### 1. Headline metric: ScoreLift Score (1–100)

The old QuestionLiftIQ Index (a 70–130 IQ-style scale modeled on Wechsler) is gone — it carried unacceptable legal and positioning risk.

In its place: the **ScoreLift Score**, a grade-anchored 1–100 scale where **50 = on-grade-level expected performance** for the chosen test, age, and grade. A 5th-grader scoring 50 on the aptitude snapshot is hitting expectations; a 5th-grader scoring 50 on the Algebra Fast-Track is also hitting expectations *for that test* — even though raw percent-correct will look very different.

Implemented in `src/features/scoring/scoreLiftScore.ts`. Each of the 9 tests has a per-grade expected percent that always maps to 50; the rest of the scale is built by piecewise-linear interpolation through 7 anchors.

### 2. Directional percentiles from public norm tables

Parents need a percentile for the score to have real-world meaning. We also promise no account, no server, no third-party analytics — so we can't build our own norm distributions.

Solution: bake in publicly-published norm tables from comparable tests and interpolate. The PDF and results screen cite which benchmark each percentile is mapped against:

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

Reference distributions only. **No user data ever leaves the device.** Implemented in `src/features/scoring/externalBenchmarks.ts`.

### 3. Dark mode + Liftie + adaptive ordering

* **Dark mode** — every component and screen on the `useColors() + makeStyles(colors)` factory pattern. Light and dark palettes in `src/theme/colors.ts`. The PDF report intentionally stays light-mode only.
* **Illustrations** — `Mascot` (Liftie, 4 expressions × 3 moods), `Decoration`, `EmptyState`, `AchievementBadge` in `src/components/Illustrations.tsx`.
* **Adaptive presentation order** — same blueprint, same set of questions, but the order tunes to last-3-question accuracy. ≥80% correct steps difficulty up; ≤40% steps down. Implemented in `src/features/assessment/adaptiveSelector.ts`. Percent-correct stays meaningful.

---

## Project layout

```
.github/workflows/ci.yml           Typecheck + smoke + jest on every push/PR
__tests__/                         Jest unit tests (50 across 5 suites)
app/                               Expo Router screens
  _layout.tsx                      Stack + scheme-aware status bar + IAP lifecycle
  index.tsx                        Home (Mascot + trust row + Quick Start + catalog)
  select.tsx                       Grade + test picker
  assessment.tsx                   Question runner with adaptive ordering
  celebration.tsx                  1.7-second finish moment
  results.tsx                      ScoreLift Report (Score / Mistakes / Plan tabs)

src/
  config/brand.ts                  App brand, scale notes, caveats, privacy URLs
  theme/
    colors.ts                      light + dark palettes, useColors()
    domainColors.ts                domain & 5-band colors (light + dark)
    spacing.ts
  components/
    AppButton, Card, Screen, MetricBar, ProgressBar,
    QuestionOptionCard, LabeledPicker,
    SpatialVisual,                 theme-aware SVG illustrations
    PaywallModal,
    Illustrations.tsx              Mascot, Decoration, EmptyState, AchievementBadge
    ScoreCard.tsx                  v0.8 shareable PNG card (light-mode only)
  data/
    testCatalog, testBlueprints, practiceLibrary,
    questionTemplates              123 templates (118 v0.6 + 5 v0.7)
  features/
    assessment/
      types.ts                     ScoreLift Score, 5-band ScoreBand, benchmarkSource
      domainLabels                 5-band labels + 0.85/0.70/0.50/0.30 cuts
      assembleAssessment           blueprint → questions
      scoreAssessment              wires scoreLiftScore + externalBenchmarks
      adaptiveSelector             pickInitialQuestion / pickNextQuestion
    generation/
      seededRandom, questionTemplateTypes
    scoring/
      scoreLiftScore.ts            grade-anchored 1–100 mapping
      externalBenchmarks.ts        NWEA MAP / IAAT / DAT-5 / BRACKEN-3 / ASVAB AFQT
    reports/
      buildReportHtml              light-mode PDF, ScoreLift Score lead, benchmark cite
  services/
    historyService                 opt-in local history (qlft: prefix)
    pdfReportService               Print → Share → Delete
    paywallService                 v0.8 real expo-iap (StoreKit 2 / Play Billing)
    scoreCardService               v0.8 ScoreCard capture + share + delete
    notificationService            Day-7 retake reminder
    privacyWipeService
  utils/
    ageFromGrade, speakPrompt

scripts/
  smoke-test-content.js            content invariant checks
```

---

## Running the project

```bash
npm install
npm run typecheck                  # tsc --noEmit
npm run smoke:test-content         # node scripts/smoke-test-content.js
npm test                           # jest
npm start                          # expo start
```

CI runs the first three on every push and PR.

---

## Privacy promise

* **No account.** No sign-in, ever.
* **No server-stored results.** Everything is computed and stored on-device.
* **No third-party analytics.** No SDKs that phone home.
* **No ads.**
* **No child name required.** A grade picker is the only profile input.
* **Local-only scoring.** Even the percentile lookup is a baked-in pure function.
* **Opt-in history.** Default OFF. Stored under the `qlft:` AsyncStorage prefix. Deleted with the app.

The benchmark norm tables in `src/features/scoring/externalBenchmarks.ts` are reference distributions only. **No user data is ever sent anywhere.**

---

## Pricing

* **Single test** — $2.99 lifetime, unlocks Mistakes / Plan / PDF for one test.
* **All-Access** — $14.99 lifetime, unlocks all 9 modules forever.
* **Quick Start** — 10-question free sample, fully unlocked, no setup.

In v0.8 these go through real `expo-iap` (StoreKit 2 / Play Billing). The placeholder SKU prefix `com.example.quizlift.*` is marked with `// REPLACE` comments and will resolve once App Store Connect / Play Console product records exist.

---

## Disclaimers

QuizLift is an educational practice and screening tool. It is **not**:

* a clinical IQ test or diagnostic instrument,
* an official school placement test,
* an official military exam product,
* a normed assessment with QuizLift-specific percentile ranks.

ASVAB / military aptitude practice is unofficial. Percentile estimates are directional comparisons against published public norm tables for similar tests. The QuizLift trademark has not yet been formally cleared.
