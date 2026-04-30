# QuestionLiftIQ v0.5.1 Version Notes

This release fixes the v0.5 candidate so it is safer to upload to GitHub.

## Fixed

- Fixed the compile-blocking syntax error in `src/data/questionTemplates.ts` for the elapsed-time STEM template.
- Updated `package.json`, `app.json`, and smoke-test expectations to `0.5.1`.
- Removed malformed brace-expansion directories from the package.
- Restored `.gitignore`, GitHub push instructions, and project context documents.
- Fixed ScoreLift PDF comparison so the current attempt is excluded from previous-attempt lookup.
- Restored privacy-strict behavior after PDF export by leaving the results route after the share sheet returns.
- Changed Quick Start from first-10 slicing to a balanced cross-domain sample.
- Made the assembler prefer blueprint target difficulty and skip non-age-appropriate generated items when alternatives exist.

## Still mocked / not production-ready

- StoreKit purchases are still mocked in `src/services/paywallService.ts`.
- Static percentile distributions are estimates, not nationally normed data.
- Question templates need professional QA before release.
- Trademark/name clearance and privacy/legal review are still needed before App Store submission.
