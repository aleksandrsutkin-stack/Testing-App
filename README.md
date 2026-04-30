# QuestionLiftIQ — v0.5.1

> Turn every missed question into a score-lift plan.

Privacy-first iOS/iPad educational test-improvement app. Short diagnostics → percent score + estimated percentile → Mistake Map with step-by-step solutions → 7-day practice plan → Retake Sprint that **shows the lift**.

---

## What's fixed in v0.5.1

This package keeps the v0.5 feature set and adds these fixes:

- Fixed a TypeScript syntax error in the elapsed-time question template.
- Updated package/app versions and smoke-test expectations to `0.5.1`.
- Restored GitHub-ready docs, `.gitignore`, and push instructions.
- Removed malformed brace-expansion folders from the previous ZIP.
- Prevented PDF score-lift from comparing a result against itself after local history append.
- Restored privacy-strict behavior: after PDF sharing returns and the temp file is deleted, the app leaves the results route.
- Made Quick Start sample questions balanced across domains instead of slicing the first section-heavy questions.
- Made blueprint target difficulty and age-band checks influence generated question selection.

## What's new in v0.5

Four major additions on top of v0.4:

| # | Feature | Where it lives |
|---|---------|----------------|
| 1 | **Paywall** between Score tab (free) and Mistakes/Plan/PDF (paid) | `src/services/paywallService.ts` + `src/components/PaywallModal.tsx` |
| 2 | **Day 7 retake reminder** via local push notifications | `src/services/notificationService.ts` |
| 3 | **SVG visuals for spatial questions** (cube, grid, mirror reflections, shapes, counting) | `src/components/SpatialVisual.tsx` |
| 4 | **Finish-the-test celebration** — animated check + counting score | `app/celebration.tsx` |

Plus the Quick Start now runs a 10-question sample (always free, fully unlocked) so users can experience the full product before being asked to pay for the real test.

---

## The paywall

**Pricing model:** lifetime, not subscription. Two SKUs:

- `$2.99` — single test pack. Unlocks Mistakes / Plan / PDF for one test type, lifetime.
- `$14.99` — All-Access. All 9 modules, lifetime, on this device.

**Where it lives:** between the Score tab (free) and the Mistakes / Plan tabs (paid). The PDF export button also routes through the paywall when locked. The paywall **never** appears during the test, before the test, or on the Score tab — by the time it shows up, the user has already seen their percent correct, percentile range, domain ratings, and Score Lift card.

**Quick Start exception:** `sampleSize=10` sessions are always fully unlocked. This is the demo path — users get to see the full Mistakes/Plan experience on a 10-question sample before deciding whether to pay for the full 25-question test.

**App Store compliance:**
- "Restore Purchases" button is always visible in the modal
- One-time payments (no auto-renewing subscription)
- No deceptive pricing, no countdown timers, no free-trial-that-converts

**Mock IAP for v0.5:** the actual purchase is mocked (`AsyncStorage`-backed) so the flow can be exercised end-to-end during development. Three TODOs in `paywallService.ts` mark exactly where StoreKit 2 calls go in v0.6 — replace those bodies and ship.

```typescript
// In paywallService.ts:
export async function purchaseSingleTest(testId: TestId) { /* TODO: StoreKit 2 */ }
export async function purchaseAllAccess()                { /* TODO: StoreKit 2 */ }
export async function restorePurchases()                 { /* TODO: StoreKit 2 */ }
```

---

## Day 7 retake reminder

Local notification scheduled when a test completes. Privacy-respecting:

- Only fires if the user has opted in to history tracking (the lift loop)
- Local-only — no APNs/FCM round-trip, no analytics server
- Cancels prior reminders for the same test before scheduling a new one
- Permission requested via standard iOS prompt
- Cancelled automatically when user retakes early

Schedule, cancel, and the foreground display config all live in `notificationService.ts`. The schedule call happens at the bottom of the results screen's load effect, after the history entry is appended.

---

## SVG visuals for spatial questions

Six visual types covering the most-impacted spatial templates:

- `cube` — isometric 3D cube (used by `spatial-cube-faces`)
- `grid-3` / `grid-4` — N×N grid of squares (used by `spatial-count-shapes`)
- `mirror-letter` — original letter/symbol + axis + reflection placeholder
- `mirror-arrow` — same as above but for arrow direction
- `shape` — basic 2D shapes for the KG module (circle, square, triangle, rectangle)
- `count-stars` — N stars for the KG counting question

Question templates set `visualType` and optional `visualParams` on the result of `baseQ()`. The assessment screen renders `<SpatialVisual />` above the prompt when present. Templates without a `visualType` render unchanged.

To add a new visual type:

1. Add the renderer to `RENDERERS` in `src/components/SpatialVisual.tsx`
2. Add the new key to the `visualType` union in `src/features/assessment/types.ts`
3. Pass `visualType` from any template's `baseQ()` call

---

## Finish-the-test celebration

A 1.7-second interstitial route that scores the responses, animates a check from scale 0 → 1, counts the percent up from 0 → final, then navigates to `/results`.

Why it matters: previously, tapping "See ScoreLift Report" instantly replaced the screen. The user got their result but didn't *feel* the moment. Adding even a brief celebration is table-stakes for educational apps. Built with `Animated` + `setInterval` — no third-party animation library.

Lives at `app/celebration.tsx`. Registered in `_layout.tsx` with `headerShown: false` and `gestureEnabled: false` so the user can't swipe back into a half-finished test.

---

## Project structure

```
questionliftiq/
├── app/
│   ├── _layout.tsx              Stack + foreground notification config
│   ├── index.tsx                Home — Quick Start (10q), icons, history toggle
│   ├── select.tsx               Setup — grade picker only
│   ├── assessment.tsx           Test — SVG visuals + Read aloud + sampleSize
│   ├── celebration.tsx          🆕 Finish-the-test moment
│   └── results.tsx              Tabbed: Score (free) / Mistakes (paid) / Plan (paid)
│
├── src/
│   ├── components/
│   │   ├── AppButton.tsx
│   │   ├── Card.tsx
│   │   ├── LabeledPicker.tsx
│   │   ├── MetricBar.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── QuestionOptionCard.tsx
│   │   ├── Screen.tsx
│   │   ├── PaywallModal.tsx     🆕 Unlock modal w/ Restore Purchases
│   │   └── SpatialVisual.tsx    🆕 SVG renderer for spatial questions
│   ├── config/brand.ts
│   ├── data/
│   │   ├── practiceLibrary.ts
│   │   ├── questionBank.ts
│   │   ├── questionTemplates.ts (86 templates, 4+ now have visualType)
│   │   ├── testBlueprints.ts
│   │   └── testCatalog.ts
│   ├── features/
│   │   ├── assessment/          types (now with visualType), assembler, scorer, labels
│   │   ├── generation/          questionTemplateTypes, seededRandom
│   │   ├── reports/             buildReportHtml (PDF w/ optional score-lift)
│   │   └── scoring/             staticDistributions
│   ├── services/
│   │   ├── pdfReportService.ts
│   │   ├── privacyWipeService.ts (now also wipes notifications)
│   │   ├── historyService.ts
│   │   ├── paywallService.ts    🆕 Mock IAP w/ StoreKit 2 TODOs
│   │   └── notificationService.ts 🆕 Day 7 reminder
│   ├── theme/
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   └── domainColors.ts      Shared by app + PDF
│   └── utils/
│       ├── speakPrompt.ts       expo-speech wrapper
│       └── ageFromGrade.ts
│
└── scripts/
    └── smoke-test-content.js    100+ checks
```

---

## Quick start

```bash
npx create-expo-app@latest questionliftiq --template blank-typescript
cd questionliftiq

# v0.5.1 dependencies
npx expo install \
  expo-router expo-print expo-sharing expo-file-system \
  expo-speech expo-notifications \
  @react-native-async-storage/async-storage \
  @react-native-picker/picker \
  lucide-react-native react-native-svg

# Drop the v0.5.1 zip contents into the project root
node scripts/smoke-test-content.js   # → ALL CHECKS PASSED
npx expo start --ios
```

---

## What didn't ship in v0.5 (week-2 backlog)

- **Real StoreKit 2 IAP** — three function bodies in `paywallService.ts` to replace
- **App Store Connect product setup** — create the two product IDs (`com.example.questionliftiq.single_test`, `com.example.questionliftiq.all_access`) and price tiers
- **Hint button mid-question** for practice modules
- **Family pass / multi-profile** support
- **More SVG visual types** for harder spatial questions (3D rotation, gear systems)
- **Subscription tier** (deferred — discussed in PM convo)
- **App Store metadata, screenshots, privacy disclosures**
- **Trademark clearance** for "QuestionLiftIQ"

---

## Pricing rationale (recap)

`$14.99 lifetime All-Access` is anchored against a single $50–$200 tutoring session. Stays below the comparison-shopping threshold ($20) where parents start asking "is this better than buying a tutoring book?" Above that, conversion drops. Below that, it feels like an obvious yes.

`$2.99 single test` exists for users who only care about one specific module (e.g. ASVAB only, or Algebra Fast-Track only) and want impulse-purchase territory. About 70% of buyers will probably skip this and grab All-Access — that's the upsell working as intended.

No subscriptions in v1. Lifetime-per-device fits the privacy-first / no-account architecture; subscriptions can come later via a Pro tier (cloud sync, family profiles, advanced analytics) without breaking promises to v1 buyers.
