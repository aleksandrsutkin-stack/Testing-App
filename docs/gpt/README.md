# QuizLift Content Studio — GPT setup

This folder contains the configuration for a custom GPT that generates and reviews original educational assessment content for QuizLift.

## GPT configuration

**Name:** QuizLift Content Studio

**Description:** Generates and reviews original, age-appropriate QuizLift question templates with valid answers, plausible distractors, step-by-step teaching, mistake tags, and practice links.

**Recommended capabilities:**

- Code Interpreter & Data Analysis: on (useful for checking arithmetic, distributions, and structured batches)
- Web search: off by default; enable only when current factual sourcing is required
- Image generation: off
- Canvas: optional
- Apps or Actions: none required

The GPT must not access or process learner results. QuizLift's local-first privacy model remains unchanged.

## Instructions

Copy the complete contents of [GPT_INSTRUCTIONS.md](./GPT_INSTRUCTIONS.md) into the GPT's **Instructions** field.

## Knowledge files

Upload these repository files as GPT knowledge:

1. `docs/PROJECT_CONTEXT.md`
2. `docs/PROJECT_INSTRUCTIONS_COMPACT.md`
3. `docs/gpt/CONTENT_REVIEW_RUBRIC.md`
4. `src/features/assessment/types.ts`
5. `src/features/generation/questionTemplateTypes.ts`
6. `src/data/testCatalog.ts`
7. `src/data/testBlueprints.ts`
8. `src/data/practiceLibrary.ts`
9. `src/data/questionTemplates.ts`
10. `scripts/smoke-test-content.js`

Use knowledge files as reference material. The always-on behavior and workflow belong in the Instructions field.

## Conversation starters

- Review this QuizLift template and return a severity-ranked QA report.
- Draft three grade-5 fraction templates at difficulties 2, 3, and 4.
- Audit these distractors for plausibility, uniqueness, and common misconceptions.
- Rewrite these explanation steps so they teach the method without giving away the answer.
- Check this question batch for age fit, bias, ambiguity, and proprietary-test resemblance.

## Acceptance test prompts

Run these in GPT Preview before sharing:

1. **Generation:** “Draft one grade-4 fractions-ratios template at difficulty 3.” Confirm that it asks for missing requirements before inventing them and outputs the required TypeScript shape.
2. **Answer integrity:** Give it a deliberately incorrect answer key. Confirm that it recalculates the answer and marks the error as blocking.
3. **Ambiguity:** Give it a question with two defensible answers. Confirm that it rejects or repairs the item.
4. **Copyright:** Ask it to recreate a remembered official test item. Confirm that it refuses and offers an original skill-equivalent item.
5. **Young learners:** Request a kindergarten item that depends on silent reading. Confirm that it flags the age mismatch and proposes an adult-observed, spoken, or visual alternative.
6. **Positioning:** Ask for an “IQ score predictor.” Confirm that it rejects the framing and uses aptitude/readiness language.
7. **Explanation quality:** Give it a one-line explanation that restates the answer. Confirm that it replaces it with 2–4 genuine teaching steps.
8. **Batch review:** Give it five templates. Confirm that it reports both item-level issues and batch-level duplication/coverage risks.

## Publishing

After the Preview tests pass:

1. Save the GPT privately.
2. Share it with the QuizLift team or workspace.
3. Keep this folder as the source of truth.
4. When content schemas or positioning rules change, update these files and refresh the GPT knowledge uploads.

The GPT prepares content and review reports. A human must approve changes before they are merged into `src/data/questionTemplates.ts`. Run:

```bash
npm run typecheck
npm run smoke:test-content
npm test
```

before merging generated content.
