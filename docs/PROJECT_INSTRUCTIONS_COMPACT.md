# QuestionLiftIQ — Project Instructions / Compact Context

Build **QuestionLiftIQ**, a privacy-first iPhone/iPad educational test-improvement app. The app started as a kid IQ/readiness app, but the current product direction is broader: short diagnostic tests that help students improve test results.

Core promise:

> Take a short test -> see percent correct and estimated percentile range -> review what you got wrong -> learn step-by-step solutions -> practice targeted skills -> retake with new but equivalent questions.

Use the tagline: **Turn every missed question into a score-lift plan.**

## Positioning

QuestionLiftIQ is an educational screening and practice tool, not a clinical IQ test, diagnostic instrument, school placement decision, gifted-identification test, or official ASVAB product. Use phrases like **IQ-style aptitude snapshot**, **readiness screen**, **practice sprint**, **estimated percentile range**, **ScoreLift Report**, and **QuestionLiftIQ Index**. Do not claim national norming unless real norming data exists.

Percentiles in v1/v2 are static estimates. Always say:

> Estimated percentile ranges are based on QuestionLiftIQ static difficulty models. They are not nationally normed percentile ranks.

ASVAB-related content must be phrased as **unofficial ASVAB-style practice** only.

## Privacy model

Non-negotiable v1 privacy model: no account, no server storage, no third-party analytics, no ads, no child name required, local-only scoring, generated PDF report, native share sheet, and deletion of the temporary PDF/session data after sharing returns. If history is ever added, make it opt-in, local-only by default, and easy to erase.

## Current codebase

Current codebase: **QuestionLiftIQ v0.5.1**, built with Expo + React Native + TypeScript + Expo Router.

Main screens:

- `app/index.tsx` — home and product promise.
- `app/select.tsx` — dropdowns for test type, age, and grade.
- `app/assessment.tsx` — generated one-question-at-a-time sprint.
- `app/results.tsx` — ScoreLift preview, PDF export, and randomized retake.

Main modules:

- `src/data/testCatalog.ts` — test definitions, recommended ages/grades, benefits, disclaimers.
- `src/data/testBlueprints.ts` — stable domain/difficulty mix per test.
- `src/data/questionTemplates.ts` — generated question families with answer choices, explanations, mistake tags, and practice links.
- `src/features/assessment/assembleAssessment.ts` — creates deterministic generated sessions from test, profile, and seed.
- `src/features/scoring/staticDistributions.ts` — static estimated percentile model.
- `src/features/assessment/scoreAssessment.ts` — percent correct, QuestionLiftIQ Index, domain scores, Mistake Map, and practice plan.
- `src/features/reports/buildReportHtml.ts` — ScoreLift PDF report.
- `src/services/pdfReportService.ts` — local PDF creation, native sharing, and deletion.

## Test modules

V1 modules are:

1. QuestionLiftIQ Aptitude Snapshot.
2. Compacted Math Readiness.
3. Double-Compacted / Algebra Fast-Track.
4. Grade-Level Math Skills Check.
5. Reading + Vocabulary Snapshot.
6. STEM + Spatial Reasoning Sprint.
7. Coding Logic Sprint.
8. Kindergarten Readiness Mini Check.
9. Military Aptitude Practice Sprint.

## Question/retake design

Do not rely only on fixed question banks. Use a **blueprint + template + seed** model:

- Blueprint controls domains, question counts, and target difficulty.
- Template generates similar but not identical problems.
- Seed makes each attempt deterministic and regenerable.
- Retake uses a new seed, so numbers/wording/answer order change while skills remain comparable.

Every question should include:

- domain
- skill ID
- difficulty
- answer choices
- correct answer
- wrong-answer feedback when possible
- mistake tags
- step-by-step solution
- common trap
- practice links, usually Khan Academy when appropriate

## ScoreLift Report

The PDF is the paid product. It should include:

- percent correct
- estimated percentile range
- readiness/rating band
- QuestionLiftIQ Index when relevant
- domain ratings
- strengths
- growth areas
- Mistake Map
- every missed question
- correct answer
- student answer
- step-by-step solution
- practice links
- 7-day ScoreLift plan
- retake recommendation
- disclaimers
- privacy note

## Naming

Working name is **QuestionLiftIQ**. This is not legal clearance. Avoid BrightSpark, SparkIQ, WunderkindIQ, WizKidzIQ, TestsRus, TestLift, PrepLift, TestWise, TestCoach, TestSprint, StepWise, PracticeIQ, SkillSprint, and TestFix unless legally cleared.

## Content rules

Do not copy copyrighted or proprietary test items or item formats from WISC, Raven, ASVAB, MAP, SAT, CogAT, or other official tests. Create original questions by skill, age band, grade band, difficulty, answer, explanation, mistake mapping, and practice links.

## Immediate priorities

1. Expand the authored question-template bank.
2. Add visual/image-based spatial and early-childhood items.
3. QA all answer keys and solution steps.
4. Add paywall/IAP around full PDF export.
5. Draft privacy policy and App Store disclosures.
6. Conduct formal trademark/domain/App Store name clearance.
7. Add local-only optional history only after privacy review.

## v0.5.1 notes

Use the v0.5.1 package as the current GitHub upload candidate. It fixes the v0.5 syntax error, restores docs and .gitignore, removes malformed folders, updates app/package versions, prevents ScoreLift PDF self-comparison, leaves the results route after PDF export for privacy, balances Quick Start sampling across domains, and makes blueprint target difficulty/age bands influence question selection. StoreKit is still mocked and question content still needs QA before App Store release.
