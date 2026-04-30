# QuestionLiftIQ — Project Context Document

**Recommended use:** Load this document into the ChatGPT Project as the main project knowledge/context file. Use `QuestionLiftIQ_Project_Instructions_Compact.md` as the always-on Project Instructions if there is a separate instructions field.

**Current working name:** QuestionLiftIQ  
**Tagline:** Turn every missed question into a score-lift plan.  
**Current app version:** v0.5.1 GitHub-ready candidate  
**Platform:** iPhone/iPad first, using Expo + React Native + TypeScript + Expo Router.

---

## 1. What we are building

QuestionLiftIQ is a privacy-first educational test-improvement app. The product started as a kid IQ/readiness idea, but the current direction is broader and stronger:

> A short-test diagnostic app that helps students improve test results by turning every missed question into a step-by-step practice plan.

The user flow is:

1. Select a test type, age, and grade.
2. Take a short generated diagnostic.
3. See percent correct, estimated percentile range, readiness/rating band, and domain ratings.
4. Review what was missed.
5. Learn each missed question through step-by-step solutions.
6. Follow links to Khan Academy or other free practice resources.
7. Export a polished PDF report.
8. Retake a new randomized but equivalent test sprint.

The app should be useful to parents, students, tutors, and older teens/adults preparing for practical tests. The PDF is the paid product.

---

## 2. Strategic shift

### Previous direction

The earlier app concept was named BrightWit IQ and focused on a broad IQ-style cognitive aptitude snapshot plus kid readiness tests.

### Current direction

The app is now **QuestionLiftIQ**, a broader test-improvement product. The IQ-style module remains, but it is one test module inside a broader diagnostic/practice platform.

This is a better business direction because:

- It creates repeat usage: students can practice, retake, and improve.
- It reduces risk around clinical IQ claims.
- It supports more markets: math readiness, reading, STEM, coding, school readiness, ASVAB-style practice, and future SAT/ACT/state-test-style practice.
- It makes the PDF report more valuable because it becomes a mini tutoring report, not just a score.

---

## 3. Product guardrails

QuestionLiftIQ is an educational screening and practice tool. It must not be positioned as:

- a clinical IQ test
- a diagnostic instrument
- a gifted-identification test
- an official school placement decision
- an official ASVAB product
- an official SAT/ACT/MAP/CogAT/WISC/Raven replacement

Use careful language:

- IQ-style aptitude snapshot
- readiness screen
- practice sprint
- estimated percentile range
- QuestionLiftIQ Index
- ScoreLift Report
- practice plan

Do not say:

- real IQ score
- clinical IQ
- nationally normed percentile
- official placement score
- guaranteed test improvement
- official ASVAB/SAT/ACT practice

The standard percentile disclaimer is:

> Estimated percentile ranges are based on QuestionLiftIQ static difficulty models. They are not nationally normed percentile ranks.

For ASVAB-related content:

> This module is unofficial ASVAB-style practice. It is not affiliated with, endorsed by, or equivalent to the official ASVAB.

---

## 4. Privacy model

The privacy model is a key differentiator.

V1/v2 privacy promises:

- no account
- no server storage
- no third-party analytics
- no ads
- no child name required
- local-only scoring
- generated PDF report
- native share sheet
- temporary PDF deletion after sharing returns
- session route replacement after export/erase

If history is added later, it should be:

- opt-in
- local-only by default
- easy to erase
- not required for basic use

This privacy model is reflected in `src/services/pdfReportService.ts` and `src/services/privacyWipeService.ts`.

---

## 5. Current codebase summary

The current deliverable is a full Expo/React Native TypeScript app named `questionliftiq-mobile-app`, now packaged as v0.5.1 for GitHub upload.

### Main screens

- `app/index.tsx` — Home screen, product promise, catalog, privacy model.
- `app/select.tsx` — Test type / age / grade dropdown setup.
- `app/assessment.tsx` — One-question-at-a-time generated assessment flow.
- `app/results.tsx` — ScoreLift preview, Mistake Map preview, practice plan, PDF export, randomized retake.
- `app/_layout.tsx` — Expo Router stack and header config.

### Main data modules

- `src/data/testCatalog.ts` — test definitions, recommended ages/grades, benefits, report promises, disclaimers.
- `src/data/testBlueprints.ts` — stable domain/difficulty mix per test module.
- `src/data/questionTemplates.ts` — generated question families with answer choices, solution steps, mistake tags, and practice links.
- `src/data/practiceLibrary.ts` — reusable practice links, mostly Khan Academy.
- `src/data/questionBank.ts` — backward-compatible helper; v0.2 uses templates rather than a fixed bank.

### Main scoring/generation modules

- `src/features/assessment/types.ts` — shared TypeScript models.
- `src/features/assessment/domainLabels.ts` — labels and score-band names.
- `src/features/assessment/assembleAssessment.ts` — creates a generated session using test, age, grade, and seed.
- `src/features/generation/seededRandom.ts` — deterministic seeded random generation and shuffling.
- `src/features/generation/questionTemplateTypes.ts` — template interfaces.
- `src/features/scoring/staticDistributions.ts` — static distribution model and estimated percentile ranges.
- `src/features/assessment/scoreAssessment.ts` — scoring, domain ratings, strengths/growth areas, missed-question review, and practice plan.

### Main report modules

- `src/features/reports/buildReportHtml.ts` — ScoreLift PDF HTML.
- `src/services/pdfReportService.ts` — print-to-PDF, native sharing, and deletion.
- `src/services/privacyWipeService.ts` — wipe/checklist helpers.

---

## 6. Current test modules

V0.2 supports these test modules:

1. **QuestionLiftIQ Aptitude Snapshot** — broad IQ-style aptitude screen with improvement steps.
2. **Compacted Math Readiness** — accelerated math readiness.
3. **Double-Compacted / Algebra Fast-Track** — aggressive math acceleration readiness.
4. **Grade-Level Math Skills Check** — current-grade math gap diagnostic.
5. **Reading + Vocabulary Snapshot** — vocabulary and comprehension.
6. **STEM + Spatial Reasoning Sprint** — spatial, science, and pattern reasoning.
7. **Coding Logic Sprint** — sequence, loop, and algorithmic-thinking readiness.
8. **Kindergarten Readiness Mini Check** — early numeracy, vocabulary, following directions, and learning behaviors.
9. **Military Aptitude Practice Sprint** — unofficial ASVAB-style verbal, math, science, and mechanical practice.

---

## 7. Scoring model

The app now shows three key score concepts:

1. **Percent correct** — the most transparent score.
2. **Estimated percentile range** — calculated from a static starter distribution by test and audience band.
3. **Readiness/rating band** — practical interpretation for next steps.

The code lives in:

- `src/features/scoring/staticDistributions.ts`
- `src/features/assessment/scoreAssessment.ts`

The static distribution is intentionally a starter model. It should be described as a projected or estimated reference range, not a nationally normed percentile.

Later improvement path:

- Add opt-in anonymous calibration data only after privacy/legal review.
- Build real reference distributions by test, age, grade, difficulty, and version.
- Replace static assumptions with calibrated item-response or norm-table models.

---

## 8. Randomized retake model

The app should not simply repeat the same exact questions. A student who retakes the same test should solve similar skills, but not memorize the exact answers.

The current system uses:

- **Test catalog** — what the module is.
- **Test blueprint** — what domains and difficulty mix must appear.
- **Question templates** — generated question families.
- **Session seed** — deterministic per attempt so the same attempt can be regenerated for scoring/PDF.

Example:

- Blueprint says: ask 4 fraction/ratio questions.
- Template says: generate a ratio scaling recipe problem.
- Seed decides: numbers, wording variant, answer order, and distractors.
- Retake uses a new seed, so the student gets equivalent practice with different numbers.

This design is critical to the product.

---

## 9. ScoreLift PDF report spec

The PDF report should become the main paid deliverable.

It should answer:

1. How did I do?
2. What did I miss?
3. Why did I miss it?
4. How do I solve it correctly?
5. What should I practice next?

Current PDF sections:

- Cover summary.
- Percent correct.
- Estimated percentile range.
- Readiness band.
- QuestionLiftIQ Index.
- Domain ratings.
- Strengths.
- Growth areas.
- Mistake Map.
- Step-by-step solution for every missed question.
- Practice links.
- 7-day ScoreLift plan.
- Retake recommendation.
- Disclaimers and privacy note.

Feature names:

- ScoreLift Report
- Mistake Map
- Step Solutions
- Practice Links
- Retake Sprint
- Estimated Percentile Range
- QuestionLiftIQ Index

---

## 10. Naming notes

Current working name: **QuestionLiftIQ**.

This is a working name only, not legal clearance. The name was preferred over QuestionLift because it preserves the aptitude/IQ signal while supporting broader test-improvement positioning.

Names previously considered or screened as risky/crowded:

- BrightSpark
- SparkIQ
- WunderkindIQ
- WizKidzIQ
- TestsRus / Tests R Us
- QuestionLift
- TestLift
- PrepLift
- TestWise / ScoreWise
- TestCoach
- TestSprint
- StepWise
- PracticeIQ
- SkillSprint
- TestFix

Recommendation: keep QuestionLiftIQ as working name while preparing formal trademark/domain/App Store clearance.

---

## 11. Source and search log

This project has involved quick web/name/product screens and reference checks. This list is not legal clearance and not a substitute for professional review.

### Naming and competitor screens

- `brightspark.org` — BrightSpark name conflict / early-learning organization.
- `apps.apple.com` — searched/checked existing kid IQ, learning, SparkIQ, WunderKind, Wizkidz, TestCoach, StepWise, PracticeIQ, and related app-name conflicts.
- `testlift.app` — TestLift naming conflict.
- `preplift.com` — PrepLift naming conflict.
- `testsprint.io` — similar diagnostic readiness product / naming conflict.
- `rubriciq.com.au` — nearby IQ/assessment naming screen.
- `ipv4.bgp.he.net` — DNS-related check for testsrus.com.
- `businessprofiles.com` — Tests R Us business-name screen.
- `search.sunbiz.org` — Drug Tests R Us entity-name screen.
- `trademarkelite.com` — Toys R Us trademark-pattern concern.
- `trademarkia.com` — SkillSprint trademark/app presence screen.
- `pypi.org/project/testfix` — TestFix name/use screen.

### Product/legal/assessment guardrails

- `pearsonassessments.com` — WISC-V reference for clinical/standardized IQ-test guardrails.
- `officialasvab.com` — ASVAB subtest/domain reference and unofficial ASVAB-style language guardrail.
- `developer.apple.com/kids` — Apple child/Kids Category design and privacy expectations.
- Apple privacy/data-use pages — privacy-label and data-collection framing.

### Technical implementation references

- `docs.expo.dev/router/introduction` — Expo Router file-based routing.
- `docs.expo.dev/guides/typescript` — Expo TypeScript setup.
- `docs.expo.dev/versions/latest/sdk/print` — local PDF generation using Expo Print.
- `docs.expo.dev/versions/latest/sdk/sharing` — native share sheet using Expo Sharing.
- `docs.expo.dev/versions/latest/sdk/filesystem` — local temporary file deletion / FileSystem use.

### Practice-resource references

- `khanacademy.org/math` — math practice links.
- `khanacademy.org/ela` — reading and language arts practice.
- `khanacademy.org/science` — science practice.
- `khanacademy.org/computing/computer-programming` — coding/programming practice.
- `khanacademy.org/digital-sat` — example of test-prep practice and skill-aligned practice model.
- `support.khanacademy.org` — MAP Recommended Practice / personalized practice model reference.

### Claude-reported market context from the pasted conversation

The pasted Claude chat mentioned sources such as Business Research Insights and Archive Market Research for market-size/trend claims. Those claims should be treated as Claude-reported context unless independently rechecked before being used in investor materials.

---

## 12. What has already been created

Created earlier:

- BrightSpark/BrightWit v0.1 business plan.
- BrightWit IQ v0.2 business plan.
- Initial Expo/React Native starter app.
- Previous BrightWit project context docs.

Created in the current update:

- Full rebranded **QuestionLiftIQ** codebase.
- Broader test-improvement positioning.
- ScoreLift Report concept.
- Static distribution/estimated percentile scoring system.
- Blueprint-driven test assembly.
- Template-generated question variants.
- Randomized retake sprint flow.
- Missed-question review and step-by-step solution model.
- Khan Academy practice-link mapping.
- Updated context docs and code appendix package.

---

## 13. Immediate backlog

### Product

1. Decide whether QuestionLiftIQ remains the working name after formal clearance.
2. Choose exact V1 target audience: parents of grades 3-8, tutors, homeschoolers, or older test-prep users.
3. Decide which module is the V1 wedge: Compacted Math, Algebra Fast-Track, grade math gaps, or aptitude snapshot.
4. Define pricing: free test preview, paid PDF, subscription, bundle, or tutor-facing SKU.

### Content

1. Expand each module to at least 80-150 reviewed generated question templates.
2. Add visual/image-based spatial questions.
3. Add early-childhood audio/parent-guided support if targeting ages 4-6.
4. Build a question QA checklist.
5. Add skill IDs that map cleanly to practice resources.

### Scoring

1. Improve the static distributions.
2. Add difficulty-weighted scoring.
3. Add confidence language for short tests.
4. Add versioning for test blueprints.
5. Eventually calibrate with opt-in anonymized data, if privacy/legal strategy allows.

### App

1. Improve visual polish.
2. Add paywall/IAP around full PDF export.
3. Add local-only optional history.
4. Add PDF preview before export.
5. Add unit tests for scoring and generation.
6. Add accessibility and iPad layout polish.

### Legal/privacy

1. Name/trademark clearance.
2. Privacy policy.
3. App Store privacy disclosures.
4. COPPA/Kids Category review if targeting children directly.
5. Disclaimer review for IQ, placement, and ASVAB-style language.

---

## 14. Development rules for future work

- Keep the app modular.
- Do not hard-code product claims into multiple places; use `src/config/brand.ts` and test definitions.
- New tests must have catalog entry, blueprint, templates, static distribution, and report disclaimer.
- Every new question template must generate correct answer, distractors, explanation steps, common trap, mistake tags, and practice links.
- Avoid live AI-generated answer keys in v1. Prefer authored or deterministic template-generated solutions.
- Never copy proprietary/official test questions.
- Keep scoring transparent and honest.
- Keep privacy local-first.
- Treat the PDF report as the paid product.

---

## v0.5.1 GitHub-ready package notes

The v0.5.1 package fixes the v0.5 candidate and should be the preferred codebase for the first GitHub upload. It includes:

- Syntax fix for the elapsed-time STEM question template.
- Version alignment across `package.json`, `app.json`, and the smoke test.
- Cleaned ZIP contents with malformed brace-expansion folders removed.
- Restored `.gitignore`, GitHub push instructions, and project context docs.
- Privacy-strict PDF export flow: after sharing returns and the temp PDF is deleted, the app leaves the scored results route.
- ScoreLift PDF comparison fix so the current attempt is not compared against itself after local history append.
- Balanced Quick Start sampling across domains rather than first-10 slicing.
- Question assembler improvements so blueprint target difficulty and generated age bands influence selection.

Known non-production pieces remain: StoreKit purchases are mocked, static percentile ranges are not nationally normed, question templates need QA, and legal/privacy/name clearance is still required before App Store submission.
