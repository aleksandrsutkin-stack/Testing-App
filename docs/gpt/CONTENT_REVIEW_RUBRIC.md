# QuizLift content review rubric

Score each dimension from 0–2.

- **0 — Fail:** production-blocking or substantially unusable.
- **1 — Revise:** directionally sound but needs a material change.
- **2 — Pass:** ready for human final review.

Any hard-stop condition overrides the numeric score.

| Dimension | 0 — Fail | 1 — Revise | 2 — Pass |
|---|---|---|---|
| Answer integrity | Wrong, missing, or multiple defensible answers | Correct but proof, rounding, unit, or boundary needs clarification | Independently verified, unique, and stable across variants |
| Skill alignment | Tests a different or undefined skill | Skill is present but contaminated by unnecessary reading/knowledge | Directly measures the declared skill |
| Grade/age fit | Inaccessible or developmentally inappropriate | Mostly suitable with vocabulary/load changes | Appropriate language, context, and interaction |
| Difficulty fit | Clearly mislabeled or driven by a trick | Roughly right but poorly calibrated | Cognitive demand matches difficulty 1–5 |
| Prompt clarity | Missing facts or materially ambiguous | Understandable after minor inference | Complete, concise, and unambiguous |
| Distractors | Random, duplicate, absurd, or accidentally correct | Some plausible options, weak misconception coverage | Distinct, plausible, and tied to common errors |
| Teaching steps | Restates the answer or teaches an error | Correct but too compressed or item-specific | 2–4 reusable, age-appropriate teaching steps |
| Feedback/trap | Shaming, misleading, or irrelevant | Generic guidance | Specific, kind, and actionable |
| Metadata/schema | Invalid IDs/types or required fields missing | Technically valid but tags/links are weak | Current types satisfied; tags and links are precise |
| Seed determinism | Uses unseeded randomness or unstable generation | Deterministic but risks collisions or shallow variants | All variation uses seeded helpers correctly |
| Accessibility/fairness | Depends on stereotypes, color alone, or niche background | Avoidable complexity or representation imbalance | Neutral, inclusive, and accessible for the target |
| Originality/safety | Copies or closely imitates protected test content; unsafe claim | Generic resemblance or positioning needs revision | Original skill-based design with safe QuizLift language |
| Batch coverage | Duplicative, patterned, or blueprint-breaking | Some imbalance or repeated structures | Varied, balanced, and blueprint-aligned |

## Hard stops

Reject the item or return it for repair when any condition is true:

- the correct answer is wrong or not unique;
- required information is absent;
- a generator can produce invalid values, duplicate options, division by zero, impossible geometry, or inconsistent units;
- it copies, paraphrases, or reconstructs a proprietary or remembered official test item;
- it presents QuizLift as diagnostic, clinically normed, official, or suitable for placement decisions;
- it contains demeaning, discriminatory, frightening, or developmentally unsafe content;
- its schema cannot be represented by the current QuizLift types;
- its explanation teaches incorrect reasoning.

## Suggested decision thresholds

- **Pass to human final review:** no hard stop, every dimension at least 1, and at least 21/26.
- **Revise:** no hard stop, but one or more dimensions score 0 or total is below 21.
- **Reject/reconceptualize:** any hard stop, or the core construct cannot be repaired without replacing the item.

A passing score is not psychometric validation and does not authorize production release.

## Required batch checks

For a batch, report:

- count by `testId`, domain, skill, and difficulty;
- repeated stem/scenario patterns;
- correct-option position distribution;
- name and context repetition;
- cosmetic variants that do not create meaningfully equivalent retakes;
- blueprint gaps or overcoverage;
- reading-load outliers;
- any factual claims that require authoritative verification.

## Repository handoff checklist

Before merging a human-approved draft:

1. Add or update templates without renaming existing IDs unless a migration is intentional.
2. Ensure test IDs, domains, mistake tags, visual types, and practice links exist in current project data.
3. Verify all variation flows through the seeded RNG.
4. Generate multiple seeds, including boundary values.
5. Confirm options are unique and one answer is correct for every generated variant.
6. Run `npm run typecheck`.
7. Run `npm run smoke:test-content`.
8. Run `npm test`.
9. Review the rendered learner experience, not only the TypeScript object.
