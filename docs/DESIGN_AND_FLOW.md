# QuestionLiftIQ v0.2 design and user flow

## Product position

QuestionLiftIQ is a short-test diagnostic app focused on score improvement. The app should feel useful after every attempt, because the value is not only the score; it is the explanation of what went wrong and what to practice next.

Core promise:

> Short diagnostic tests with percent scores, estimated percentile ranges, mistake maps, step-by-step solutions, targeted practice links, and randomized retake sprints.

## Core user flow

1. Home
   - Explains the test-improvement promise.
   - Lists the test catalog.
   - Reinforces the local-only privacy model.
   - CTA: Choose a test.

2. Test setup
   - Dropdown 1: test type.
   - Dropdown 2: age.
   - Dropdown 3: grade.
   - Shows whether the module is recommended for the selected profile.
   - Shows question count, duration, and report promise.
   - Creates a unique session seed for generated variants.

3. Assessment
   - One question per screen.
   - Shows domain and skill tag.
   - Multiple-choice cards.
   - Progress bar.
   - Keeps the same generated session by passing seed through navigation.

4. Results preview
   - Percent correct.
   - Estimated percentile range.
   - Readiness band.
   - QuestionLiftIQ Index.
   - Domain ratings.
   - Strengths and growth areas.
   - Mistake Map preview.
   - Practice plan preview.

5. PDF export and erase
   - Generate ScoreLift Report on-device.
   - Open native share sheet.
   - Delete temporary PDF after sharing returns.
   - Replace route so answers are not retained in navigation history.

6. Retake Sprint
   - User can retake with a new seed.
   - Blueprint remains stable: same domains, skill targets, and difficulty mix.
   - Question templates regenerate numbers and answer choices.

## ScoreLift PDF report

The PDF should answer five questions:

1. How did I do?
2. What did I miss?
3. Why did I miss it?
4. How do I solve it correctly?
5. What should I practice next?

Sections:

- Cover summary.
- Percent correct.
- Estimated percentile range.
- Readiness band.
- QuestionLiftIQ Index.
- Domain ratings.
- Strengths and growth areas.
- Mistake Map.
- Step-by-step solutions for every missed question.
- Khan Academy or other practice links.
- 7-day ScoreLift plan.
- Retake recommendation.
- Disclaimers and privacy note.

## Static distribution model

V0.2 includes expert-authored static distributions in `src/features/scoring/staticDistributions.ts`. These calculate estimated percentile ranges from percent-correct scores using a simple normal-curve model by test and audience band.

Use careful language everywhere:

> Estimated percentile ranges are based on QuestionLiftIQ static difficulty models. They are not nationally normed percentile ranks.

Later, if the product adds opt-in anonymous telemetry, static distributions can be improved with real calibration data. Until then, avoid claims like national percentile, official placement probability, or real IQ percentile.

## Randomized retake model

The app uses:

- Test catalog: what the module is.
- Test blueprint: what skills/difficulty mix must appear.
- Question templates: generated question families.
- Session seed: deterministic per attempt so results can be regenerated.

This means a retake can ask similar skills without repeating the exact same numbers.

Example: a ratio template can generate `3 cups for 12 muffins -> 6 cups for 24 muffins` on one attempt and `4 cups for 8 muffins -> 12 cups for 24 muffins` on another attempt.

## Module map

- `src/data/testCatalog.ts`: Add/edit tests, recommended ages, grades, domains, benefits, and practice links.
- `src/data/testBlueprints.ts`: Define domain counts and target difficulty for each module.
- `src/data/questionTemplates.ts`: Generate variant questions, answer choices, explanations, mistake tags, and practice links.
- `src/features/assessment/types.ts`: Shared data models.
- `src/features/assessment/assembleAssessment.ts`: Turns a blueprint and seed into a generated question session.
- `src/features/scoring/staticDistributions.ts`: Static percentile-estimate distributions.
- `src/features/assessment/scoreAssessment.ts`: Percent correct, index, domain scores, mistake map, and practice plan.
- `src/features/reports/buildReportHtml.ts`: PDF report layout.
- `src/services/pdfReportService.ts`: On-device PDF creation, share, and delete.
- `src/services/privacyWipeService.ts`: Privacy checklist and file deletion helpers.
- `app/select.tsx`: Dropdown-driven setup.
- `app/assessment.tsx`: Generated question flow.
- `app/results.tsx`: Results, PDF export, erase, and retake.

## Next build milestones

1. Replace starter templates with a reviewed proprietary question-template bank.
2. Add more templates per domain so repeated retakes feel varied.
3. Add image-based items for spatial and early-childhood modules.
4. Add an authored explanation QA process.
5. Add paywall/IAP around full PDF export.
6. Draft privacy policy, App Store disclosure copy, and legal disclaimers.
7. Conduct name clearance for QuestionLiftIQ before launch.
