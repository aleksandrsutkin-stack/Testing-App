// src/data/questionTemplates.ts
// v0.3 — 86 templates across all 9 test modules.
// Original 23 + Expansion 1 (28) + Expansion 2 (37) = 88 unique templates.
// Two original IDs (reading-main-idea, coding-loop-count) kept; near-duplicate
// expansion variants renamed with -v2 suffix.

import { AssessmentQuestion, DomainId, MistakeTag, PracticeLink, QuestionOption, TestId } from '../features/assessment/types';
import { QuestionGeneratorContext, QuestionTemplate } from '../features/generation/questionTemplateTypes';
import { SeededRandom, shuffleWithRng } from '../features/generation/seededRandom';
import { practiceLink } from './practiceLibrary';

// ─── Shared helpers ──────────────────────────────────────────────────────────

const OPT_IDS = ['a', 'b', 'c', 'd'];

function uniq(v: string[]): string[] {
  const s = new Set<string>(); const o: string[] = [];
  v.forEach(x => { if (!s.has(x)) { s.add(x); o.push(x); } }); return o;
}

function makeOptions(
  correct: string, distractors: string[], rng: SeededRandom,
  fb: Record<string, string> = {}
): { options: QuestionOption[]; correctOptionId: string; wrongAnswerFeedback: Record<string, string> } {
  const labels = uniq([correct, ...distractors]).slice(0, 4);
  const fillers = ['Not enough information', 'Cannot be determined', 'None of these'];
  let fi = 0;
  while (labels.length < 4) { const f = fillers[fi] ?? `Extra ${fi + 1}`; if (!labels.includes(f)) labels.push(f); fi++; }
  const shuffled = shuffleWithRng(labels, rng);
  const options = shuffled.map((label, i) => ({ id: OPT_IDS[i], label: label.trim(), score: label.trim() === correct.trim() ? 1 : 0, feedback: fb[label.trim()] }));
  const correctOpt = options.find(o => o.score === 1) ?? options[0];
  const wrongAnswerFeedback = options.reduce<Record<string, string>>((acc, o) => { if (o.score === 0 && o.feedback) acc[o.id] = o.feedback; return acc; }, {});
  return { options, correctOptionId: correctOpt.id, wrongAnswerFeedback };
}

function baseQ(
  ctx: QuestionGeneratorContext, t: QuestionTemplate,
  v: {
    prompt: string; options: QuestionOption[]; correctOptionId: string;
    correctAnswerLabel: string; explanationSteps: string[]; commonTrap?: string;
    wrongAnswerFeedback?: Record<string, string>; mistakeTags: MistakeTag[];
    practiceLinks?: PracticeLink[]; helperText?: string; ageMin?: number; ageMax?: number;
    visualType?: 'cube' | 'grid-3' | 'grid-4' | 'mirror-letter' | 'mirror-arrow' | 'shape' | 'count-stars';
    visualParams?: Record<string, string | number>;
  }
): AssessmentQuestion {
  return {
    id: `${t.id}-${ctx.variantIndex}`, templateId: t.id, testId: ctx.testId,
    domain: t.domain, skillId: t.skillId, type: 'single-choice',
    prompt: v.prompt, helperText: v.helperText, options: v.options,
    correctOptionId: v.correctOptionId, correctAnswerLabel: v.correctAnswerLabel,
    explanationSteps: v.explanationSteps, commonTrap: v.commonTrap,
    wrongAnswerFeedback: v.wrongAnswerFeedback, mistakeTags: v.mistakeTags,
    practiceLinks: v.practiceLinks ?? [practiceLink(t.skillId)],
    difficulty: t.difficulty, ageBand: { min: v.ageMin ?? 4, max: v.ageMax ?? 60 },
    visualType: v.visualType,
    visualParams: v.visualParams
  };
}

function ct(
  partial: Omit<QuestionTemplate, 'generate'>,
  gen: (ctx: QuestionGeneratorContext, t: QuestionTemplate) => AssessmentQuestion
): QuestionTemplate {
  const t = { ...partial, generate(ctx: QuestionGeneratorContext) { return gen(ctx, t); } } as QuestionTemplate;
  return t;
}

// ─── Test-ID groups ──────────────────────────────────────────────────────────

const APT: TestId[] = ['questionliftiq-aptitude-snapshot'];
const MATH: TestId[] = ['compacted-math-readiness', 'grade-math-skills-check'];
const ALG: TestId[] = ['double-compacted-algebra-readiness'];
const MATH_ALL: TestId[] = [...MATH, ...ALG];
const READ: TestId[] = ['reading-vocabulary-snapshot'];
const STEM: TestId[] = ['stem-spatial-reasoning'];
const CODE: TestId[] = ['coding-logic-sprint'];
const MIL: TestId[] = ['military-aptitude-practice'];
const KG: TestId[] = ['kindergarten-readiness'];

// ════════════════════════════════════════════════════════════════════════════
// SECTION 1 — ORIGINAL 23 TEMPLATES
// ════════════════════════════════════════════════════════════════════════════

export const questionTemplates: QuestionTemplate[] = [

  // ── 1. Multiply-next pattern ─────────────────────────────────────────────
  ct({ id: 'pattern-multiply-next', testIds: [...APT, ...MATH_ALL, ...STEM, ...CODE], domain: 'fluid-reasoning', skillId: 'pattern-reasoning', difficulty: 2 },
    (ctx, t) => {
      const m = ctx.rng.pick([2, 3]), s = ctx.rng.int(2, 6);
      const seq = [s, s*m, s*m**2, s*m**3], ans = s*m**4;
      const { options, correctOptionId, wrongAnswerFeedback } = makeOptions(String(ans), [String(ans+m), String(ans-m), String(seq[3]+seq[2])], ctx.rng, { [String(ans+m)]: 'This adds instead of continuing the multiplication rule.', [String(seq[3]+seq[2])]: 'This combines nearby terms but does not follow one consistent rule.' });
      return baseQ(ctx, t, { prompt: `Which number comes next?\n${seq.join(', ')}, ___`, helperText: 'Look for the same rule from one number to the next.', options, correctOptionId, correctAnswerLabel: String(ans), explanationSteps: [`Each number is multiplied by ${m}.`, `${seq[2]} × ${m} = ${seq[3]}.`, `${seq[3]} × ${m} = ${ans}.`], commonTrap: 'A common trap is to add once the sequence gets large, but the same operation must work every time.', wrongAnswerFeedback, mistakeTags: ['pattern-recognition'], ageMin: 6 });
    }),

  // ── 2. Verbal analogy — home ─────────────────────────────────────────────
  ct({ id: 'verbal-analogy-home', testIds: APT, domain: 'verbal', skillId: 'vocabulary', difficulty: 1 },
    (ctx, t) => {
      const pairs = [
        { left: 'Bird is to nest', right: 'bee is to', answer: 'hive', distractors: ['flower', 'wing', 'honey'] },
        { left: 'Dog is to kennel', right: 'horse is to', answer: 'stable', distractors: ['saddle', 'field', 'tail'] },
        { left: 'Book is to library', right: 'painting is to', answer: 'museum', distractors: ['brush', 'paper', 'window'] }
      ];
      const p = ctx.rng.pick(pairs);
      const { options, correctOptionId, wrongAnswerFeedback } = makeOptions(p.answer, p.distractors, ctx.rng, { [p.distractors[0]]: 'This word is related to the topic, but it does not match the relationship.', [p.distractors[1]]: 'This is a part or object, not the matching place.' });
      return baseQ(ctx, t, { prompt: `${p.left} as ${p.right} _____.`, options, correctOptionId, correctAnswerLabel: p.answer, explanationSteps: ['Find the relationship in the first pair.', `${p.left} is a place relationship.`, `The word that completes the same relationship is ${p.answer}.`], commonTrap: 'Related words can be tempting, but analogies require the same relationship.', wrongAnswerFeedback, mistakeTags: ['vocabulary-confusion'], practiceLinks: [practiceLink('vocabulary')], ageMin: 6 });
    }),

  // ── 3. Working memory — reverse code ─────────────────────────────────────
  ct({ id: 'working-memory-reverse-code', testIds: [...APT, ...CODE], domain: 'working-memory', skillId: 'pattern-reasoning', difficulty: 2 },
    (ctx, t) => {
      const code = [String(ctx.rng.int(2, 9)), ctx.rng.pick(['B', 'K', 'M', 'R']), String(ctx.rng.int(1, 8))];
      const ans = [...code].reverse().join(' - '), orig = code.join(' - ');
      const { options, correctOptionId, wrongAnswerFeedback } = makeOptions(ans, [orig, `${code[2]} - ${code[0]} - ${code[1]}`, `${code[1]} - ${code[2]} - ${code[0]}`], ctx.rng, { [orig]: 'This repeats the original order instead of reversing it.' });
      return baseQ(ctx, t, { prompt: `Remember this code: ${orig}. Which answer shows the code backward?`, options, correctOptionId, correctAnswerLabel: ans, explanationSteps: [`Start with the last item: ${code[2]}.`, `Then the middle item: ${code[1]}.`, `End with the first item: ${code[0]}.`, `The backward code is ${ans}.`], commonTrap: 'Repeating the original means the instruction "backward" was missed.', wrongAnswerFeedback, mistakeTags: ['attention-to-detail'], ageMin: 6 });
    }),

  // ── 4. Processing speed — match ──────────────────────────────────────────
  ct({ id: 'processing-speed-match', testIds: APT, domain: 'processing-speed', skillId: 'pattern-reasoning', difficulty: 2 },
    (ctx, t) => {
      const letters = ['QP', 'OP', 'QF', 'GP', 'DF'];
      const dup = `${ctx.rng.pick(letters)}${ctx.rng.int(2, 9)}`;
      const ds: string[] = [];
      while (ds.length < 2) { const c = `${ctx.rng.pick(letters)}${ctx.rng.int(2, 9)}`; if (c !== dup && !ds.includes(c)) ds.push(c); }
      const choices = [dup, ds[0], ds[1], dup];
      const { options, correctOptionId, wrongAnswerFeedback } = makeOptions('1 and 4', ['1 and 2', '2 and 3', '1 and 3'], ctx.rng, { '1 and 3': 'These may look similar, but one character is different.' });
      return baseQ(ctx, t, { prompt: `Find the exact matching pair: ${choices.join(', ')}`, helperText: 'Two items are exactly the same.', options, correctOptionId, correctAnswerLabel: '1 and 4', explanationSteps: [`Item 1 is ${choices[0]}.`, `Item 4 is also ${choices[3]}.`, 'So the exact matching pair is 1 and 4.'], commonTrap: 'Near-matches can look correct when letters are visually similar.', wrongAnswerFeedback, mistakeTags: ['attention-to-detail'], ageMin: 7 });
    }),

  // ── 5. Arithmetic word problem — multiply then subtract ──────────────────
  ct({ id: 'arithmetic-word-multiply-subtract', testIds: [...APT, ...MATH_ALL, ...MIL], domain: 'quantitative', skillId: 'arithmetic-operations', difficulty: 2 },
    (ctx, t) => {
      const g = ctx.rng.int(3, 8), pg = ctx.rng.int(4, 12), rem = ctx.rng.int(2, Math.min(10, g*pg-2));
      const ans = g*pg - rem;
      const { options, correctOptionId, wrongAnswerFeedback } = makeOptions(String(ans), [String(g+pg-rem), String(g*pg), String(ans+rem)], ctx.rng, { [String(g*pg)]: 'This finds the total before removing items.', [String(g+pg-rem)]: 'This adds the numbers instead of multiplying groups by items per group.' });
      return baseQ(ctx, t, { prompt: `A box has ${g} packs. Each pack has ${pg} cards. ${rem} cards are removed. How many cards are left?`, options, correctOptionId, correctAnswerLabel: String(ans), explanationSteps: [`Total cards: ${g} × ${pg} = ${g*pg}.`, `Subtract removed: ${g*pg} − ${rem} = ${ans}.`, `${ans} cards are left.`], commonTrap: 'Stopping after multiplication misses the final subtraction step.', wrongAnswerFeedback, mistakeTags: ['multi-step-reasoning', 'calculation-error'], ageMin: 7 });
    }),

  // ── 6. Equivalent fractions ──────────────────────────────────────────────
  ct({ id: 'fraction-equivalent', testIds: MATH_ALL, domain: 'fractions-ratios', skillId: 'fractions-ratios', difficulty: 2 },
    (ctx, t) => {
      const n = ctx.rng.int(1, 5), d = n + ctx.rng.int(2, 7), sc = ctx.rng.int(2, 5);
      const ans = `${n*sc}/${d*sc}`;
      const { options, correctOptionId, wrongAnswerFeedback } = makeOptions(ans, [`${n+sc}/${d+sc}`, `${n*sc}/${d}`, `${d*sc}/${n*sc}`], ctx.rng, { [`${n+sc}/${d+sc}`]: 'Adding the same number to top and bottom does not make an equivalent fraction.', [`${n*sc}/${d}`]: 'You must multiply both the numerator and denominator by the same factor.' });
      return baseQ(ctx, t, { prompt: `Which fraction is equivalent to ${n}/${d}?`, options, correctOptionId, correctAnswerLabel: ans, explanationSteps: ['Equivalent fractions multiply both numerator and denominator by the same number.', `${n} × ${sc} = ${n*sc}.`, `${d} × ${sc} = ${d*sc}.`, `So ${n}/${d} = ${ans}.`], commonTrap: 'Adding to both parts changes the value; multiplying keeps it equal.', wrongAnswerFeedback, mistakeTags: ['concept-gap', 'procedure-error'], ageMin: 7 });
    }),

  // ── 7. Ratio scale — recipe ──────────────────────────────────────────────
  ct({ id: 'ratio-scale-recipe', testIds: [...MATH_ALL, ...MIL], domain: 'fractions-ratios', skillId: 'fractions-ratios', difficulty: 2 },
    (ctx, t) => {
      const bi = ctx.rng.pick([6,8,10,12]), bc = ctx.rng.int(2,5), f = ctx.rng.pick([2,3]);
      const ti = bi*f, ans = bc*f;
      const { options, correctOptionId, wrongAnswerFeedback } = makeOptions(`${ans} cups`, [`${bc+f} cups`, `${ans+bc} cups`, `${bc} cups`], ctx.rng, { [`${bc} cups`]: 'This keeps the original amount even though the recipe size changed.', [`${bc+f} cups`]: 'Scaling means multiply by the factor, not add it.' });
      return baseQ(ctx, t, { prompt: `A recipe uses ${bc} cups of flour for ${bi} muffins. How many cups are needed for ${ti} muffins?`, options, correctOptionId, correctAnswerLabel: `${ans} cups`, explanationSteps: [`${ti} is ${f} times ${bi}.`, `Multiply the flour by the same factor: ${bc} × ${f} = ${ans}.`, `The recipe needs ${ans} cups.`], commonTrap: 'When the count is multiplied, the ingredient must be multiplied by the same factor.', wrongAnswerFeedback, mistakeTags: ['concept-gap', 'multi-step-reasoning'], ageMin: 8 });
    }),

  // ── 8. Rectangle area ────────────────────────────────────────────────────
  ct({ id: 'rectangle-area', testIds: [...MATH, ...STEM], domain: 'geometry', skillId: 'geometry', difficulty: 2 },
    (ctx, t) => {
      const l = ctx.rng.int(5,14), w = ctx.rng.int(2,9), ans = l*w;
      const { options, correctOptionId, wrongAnswerFeedback } = makeOptions(`${ans} square units`, [`${l+w} square units`, `${2*(l+w)} square units`, `${ans+l} square units`], ctx.rng, { [`${l+w} square units`]: 'This adds the side lengths. Area uses multiplication.', [`${2*(l+w)} square units`]: 'This is the perimeter, not the area.' });
      return baseQ(ctx, t, { prompt: `A rectangle is ${l} units long and ${w} units wide. What is its area?`, options, correctOptionId, correctAnswerLabel: `${ans} square units`, explanationSteps: [`Area = length × width.`, `${l} × ${w} = ${ans} square units.`], commonTrap: 'Perimeter and area use different formulas.', wrongAnswerFeedback, mistakeTags: ['procedure-error'], ageMin: 7 });
    }),

  // ── 9. Mean of four values ───────────────────────────────────────────────
  ct({ id: 'mean-four-values', testIds: MATH_ALL, domain: 'data-reasoning', skillId: 'data-statistics', difficulty: 3 },
    (ctx, t) => {
      const ans = ctx.rng.int(4,12), sa = ctx.rng.int(1,3), sb = ctx.rng.int(1,3);
      const vals = [ans-sa, sb !== sa ? ans-sb : ans+1, ans, ans+sa];
      vals[1] = 4*ans - vals[0] - vals[2] - vals[3];
      const total = vals.reduce((s,v)=>s+v,0);
      const { options, correctOptionId, wrongAnswerFeedback } = makeOptions(String(ans), [String(total), String(Math.max(...vals)), String(ans+1)], ctx.rng, { [String(total)]: 'This is the total, but mean also requires dividing by the count.', [String(Math.max(...vals))]: 'The largest value is not the average.' });
      return baseQ(ctx, t, { prompt: `Scores: ${vals.join(', ')}. What is the mean?`, options, correctOptionId, correctAnswerLabel: String(ans), explanationSteps: [`Add: ${vals.join(' + ')} = ${total}.`, `There are 4 scores.`, `${total} ÷ 4 = ${ans}.`], commonTrap: 'The mean is not the total — divide by the number of values.', wrongAnswerFeedback, mistakeTags: ['procedure-error', 'calculation-error'], ageMin: 9 });
    }),

  // ── 10. One-step equation ────────────────────────────────────────────────
  ct({ id: 'one-step-equation-addition', testIds: ALG, domain: 'algebra-readiness', skillId: 'equations-one-step', difficulty: 3 },
    (ctx, t) => {
      const x = ctx.rng.int(4,20), add = ctx.rng.int(3,12), total = x+add;
      const { options, correctOptionId, wrongAnswerFeedback } = makeOptions(String(x), [String(total+add), String(total-x), String(x+add)], ctx.rng, { [String(total+add)]: 'This adds again instead of undoing the addition.', [String(total-x)]: 'This gives the added number, not x itself.' });
      return baseQ(ctx, t, { prompt: `Solve for x:\nx + ${add} = ${total}`, options, correctOptionId, correctAnswerLabel: String(x), explanationSteps: [`Subtract ${add} from both sides.`, `x + ${add} − ${add} = ${total} − ${add}.`, `x = ${x}.`], commonTrap: 'The inverse of addition is subtraction.', wrongAnswerFeedback, mistakeTags: ['procedure-error'], ageMin: 9 });
    }),

  // ── 11. Expression substitution ──────────────────────────────────────────
  ct({ id: 'expression-substitution', testIds: ALG, domain: 'algebra-readiness', skillId: 'expressions-patterns', difficulty: 3 },
    (ctx, t) => {
      const x = ctx.rng.int(2,9), c = ctx.rng.int(2,6), b = ctx.rng.int(1,9), ans = c*x+b;
      const { options, correctOptionId, wrongAnswerFeedback } = makeOptions(String(ans), [String(c+x+b), String(c*(x+b)), String(ans-b)], ctx.rng, { [String(c+x+b)]: 'This adds the coefficient instead of multiplying by it.', [String(c*(x+b))]: 'The expression says multiply x first, then add.' });
      return baseQ(ctx, t, { prompt: `If x = ${x}, what is ${c}x + ${b}?`, options, correctOptionId, correctAnswerLabel: String(ans), explanationSteps: [`Replace x with ${x}: ${c}(${x}) + ${b}.`, `${c} × ${x} = ${c*x}.`, `${c*x} + ${b} = ${ans}.`], commonTrap: 'In algebra, 3x means 3 times x, not 3 plus x.', wrongAnswerFeedback, mistakeTags: ['procedure-error', 'concept-gap'], ageMin: 9 });
    }),

  // ── 12. Decimal compare ──────────────────────────────────────────────────
  ct({ id: 'decimal-compare', testIds: MATH, domain: 'number-sense', skillId: 'arithmetic-operations', difficulty: 2 },
    (ctx, t) => {
      const t2 = ctx.rng.int(5,9), correct = `0.${t2}`;
      const labels = [correct, `0.0${t2}`, `0.${t2-2}${t2}`, `0.0${t2+1}`];
      const { options, correctOptionId, wrongAnswerFeedback } = makeOptions(correct, labels.filter(l=>l!==correct), ctx.rng, { [`0.0${t2}`]: 'A zero right after the decimal makes this a hundredths value, smaller than tenths.' });
      return baseQ(ctx, t, { prompt: 'Which number is greatest?', options, correctOptionId, correctAnswerLabel: correct, explanationSteps: ['Compare decimal place values from left to right.', `${correct} has ${t2} tenths — the others are smaller.`], commonTrap: 'More digits after the decimal does not always mean a larger value.', wrongAnswerFeedback, mistakeTags: ['concept-gap'], ageMin: 8 });
    }),

  // ── 13. Reading vocab — context clue (original) ──────────────────────────
  ct({ id: 'reading-vocab-context', testIds: [...READ, ...APT, ...MIL], domain: 'vocabulary', skillId: 'vocabulary', difficulty: 2 },
    (ctx, t) => {
      const items = [
        { sentence: 'The trail was narrow, so the hikers walked in a single line.', word: 'narrow', answer: 'not wide', distractors: ['very loud', 'brightly colored', 'easy to forget'] },
        { sentence: 'The coach praised the team for their effort after the difficult game.', word: 'praised', answer: 'spoke well of', distractors: ['ignored', 'warned', 'raced against'] },
        { sentence: 'The ancient bowl was kept behind glass in the museum.', word: 'ancient', answer: 'very old', distractors: ['new', 'soft', 'dangerous'] }
      ];
      const item = ctx.rng.pick(items);
      const { options, correctOptionId, wrongAnswerFeedback } = makeOptions(item.answer, item.distractors, ctx.rng, { [item.distractors[0]]: 'Check the context around the word before choosing.' });
      return baseQ(ctx, t, { prompt: `${item.sentence}\n\nWhat does "${item.word}" most nearly mean?`, options, correctOptionId, correctAnswerLabel: item.answer, explanationSteps: ['Read the whole sentence for clues.', `"${item.word}" is used in a context that points to "${item.answer}."`], commonTrap: 'A word can feel familiar, but context determines the best meaning.', wrongAnswerFeedback, mistakeTags: ['vocabulary-confusion'], practiceLinks: [practiceLink('vocabulary')], ageMin: 6 });
    }),

  // ── 14. Reading main idea — animals (original) ───────────────────────────
  ct({ id: 'reading-main-idea', testIds: READ, domain: 'reading-comprehension', skillId: 'reading-evidence', difficulty: 2 },
    (ctx, t) => {
      const animals = ctx.rng.pick([
        { animal: 'beavers', action: 'build dams that slow water and create ponds', idea: 'Beavers can change the places where they live.' },
        { animal: 'bees', action: 'visit flowers and carry pollen from plant to plant', idea: 'Bees help many plants grow and reproduce.' },
        { animal: 'owls', action: 'hunt at night and use quiet wings to surprise prey', idea: 'Owls have features that help them hunt in the dark.' }
      ]);
      const passage = `${animals.animal[0].toUpperCase()}${animals.animal.slice(1)} ${animals.action}. This can affect many other living things nearby.`;
      const { options, correctOptionId, wrongAnswerFeedback } = makeOptions(animals.idea, ['The passage is mostly about a pet.', 'The passage explains how to cook food.', 'The passage says all animals live the same way.'], ctx.rng, { 'The passage is mostly about a pet.': 'The animal is discussed in nature, not as a household pet.' });
      return baseQ(ctx, t, { prompt: `${passage}\n\nWhat is the main idea?`, options, correctOptionId, correctAnswerLabel: animals.idea, explanationSteps: ['The main idea tells what the whole passage is mostly about.', `The passage describes what ${animals.animal} do and how it affects their environment.`, `Best main idea: ${animals.idea}`], commonTrap: 'A detail from the passage is not always the main idea.', wrongAnswerFeedback, mistakeTags: ['multi-step-reasoning'], practiceLinks: [practiceLink('reading-evidence')], ageMin: 6 });
    }),

  // ── 15. Science variable ─────────────────────────────────────────────────
  ct({ id: 'science-variable', testIds: [...STEM, ...MIL], domain: 'science-reasoning', skillId: 'science-reasoning', difficulty: 2 },
    (ctx, t) => {
      const objects = ctx.rng.pick([
        { item: 'plant', variable: 'sunlight', measure: 'height after two weeks' },
        { item: 'toy car', variable: 'ramp height', measure: 'distance the car travels' },
        { item: 'ice cube', variable: 'room temperature', measure: 'time until it melts' }
      ]);
      const ans = `Change only the ${objects.variable} and measure ${objects.measure}.`;
      const { options, correctOptionId, wrongAnswerFeedback } = makeOptions(ans, ['Change many things at once.', 'Measure without changing anything.', 'Choose the result before testing.'], ctx.rng, { 'Change many things at once.': 'Changing many things makes it hard to know what caused the result.' });
      return baseQ(ctx, t, { prompt: `A student wants to test how ${objects.variable} affects a ${objects.item}. What is the best experiment plan?`, options, correctOptionId, correctAnswerLabel: ans, explanationSteps: ['A fair test changes one variable at a time.', `Here, the variable is ${objects.variable}.`, `The result to measure is ${objects.measure}.`], commonTrap: 'Changing too many things makes the experiment unfair.', wrongAnswerFeedback, mistakeTags: ['concept-gap'], practiceLinks: [practiceLink('science-reasoning')], ageMin: 7 });
    }),

  // ── 16. Spatial cube faces ───────────────────────────────────────────────
  ct({ id: 'spatial-cube-faces', testIds: [...APT, ...STEM], domain: 'visual-spatial', skillId: 'geometry', difficulty: 2 },
    (ctx, t) => {
      const { options, correctOptionId, wrongAnswerFeedback } = makeOptions('6 square faces', ['4 triangle faces', '2 circle faces', '8 square faces'], ctx.rng, { '8 square faces': 'A cube has 8 corners, but only 6 faces.' });
      return baseQ(ctx, t, { prompt: 'Which description matches a cube?', options, correctOptionId, correctAnswerLabel: '6 square faces', explanationSteps: ['A cube has a top, bottom, front, back, left, and right face.', 'That makes 6 faces total — each one is a square.'], commonTrap: 'Corners and faces are different parts of a 3D shape.', wrongAnswerFeedback, mistakeTags: ['spatial-visualization'], practiceLinks: [practiceLink('geometry')], ageMin: 6, visualType: 'cube' });
    }),

  // ── 17. Coding loop count (original) ─────────────────────────────────────
  ct({ id: 'coding-loop-count', testIds: CODE, domain: 'coding-logic', skillId: 'coding-sequences', difficulty: 2 },
    (ctx, t) => {
      const repeat = ctx.rng.int(3,6), add = ctx.rng.int(2,5), start = ctx.rng.int(0,4);
      const ans = start + repeat*add;
      const { options, correctOptionId, wrongAnswerFeedback } = makeOptions(String(ans), [String(start+add), String(repeat+add), String(ans-add)], ctx.rng, { [String(start+add)]: 'This runs the command once, but the loop repeats it several times.' });
      return baseQ(ctx, t, { prompt: `A program starts with score = ${start}. It repeats this command ${repeat} times: add ${add}. What is the final score?`, options, correctOptionId, correctAnswerLabel: String(ans), explanationSteps: [`The command adds ${add} each time.`, `It repeats ${repeat} times, so total added = ${repeat} × ${add} = ${repeat*add}.`, `${start} + ${repeat*add} = ${ans}.`], commonTrap: 'A loop repeats the command — do not count it only once.', wrongAnswerFeedback, mistakeTags: ['multi-step-reasoning', 'procedure-error'], practiceLinks: [practiceLink('coding-sequences')], ageMin: 8 });
    }),

  // ── 18. Mechanical gears ─────────────────────────────────────────────────
  ct({ id: 'mechanical-gears', testIds: MIL, domain: 'mechanical-reasoning', skillId: 'mechanical-reasoning', difficulty: 3 },
    (ctx, t) => {
      const gearA = ctx.rng.pick(['clockwise', 'counterclockwise']), gearB = gearA === 'clockwise' ? 'counterclockwise' : 'clockwise';
      const { options, correctOptionId, wrongAnswerFeedback } = makeOptions(gearB, [gearA, 'it stops moving', 'it moves up'], ctx.rng, { [gearA]: 'Touching gears rotate in opposite directions.' });
      return baseQ(ctx, t, { prompt: `Gear A touches Gear B. If Gear A turns ${gearA}, which way does Gear B turn?`, options, correctOptionId, correctAnswerLabel: gearB, explanationSteps: ['Two touching gears push against each other.', 'Because their teeth interlock, they rotate in opposite directions.', `So Gear B turns ${gearB}.`], commonTrap: 'Gears that touch do not spin the same way unless there is an extra gear between them.', wrongAnswerFeedback, mistakeTags: ['spatial-visualization', 'concept-gap'], practiceLinks: [practiceLink('mechanical-reasoning')], ageMin: 15 });
    }),

  // ── 19. Kindergarten — counting ──────────────────────────────────────────
  ct({ id: 'kindergarten-counting', testIds: KG, domain: 'number-sense', skillId: 'early-math', difficulty: 1 },
    (ctx, t) => {
      const count = ctx.rng.int(3,9);
      const { options, correctOptionId, wrongAnswerFeedback } = makeOptions(String(count), [String(count-1), String(count+1), String(count+2)], ctx.rng, { [String(count+1)]: 'Try touching each item once as you count.' });
      return baseQ(ctx, t, { prompt: `Count the stars: ${'★'.repeat(count)}`, options, correctOptionId, correctAnswerLabel: String(count), explanationSteps: ['Touch or point to each star one time.', `Counting gives ${count}.`], commonTrap: 'Skipping or double-counting an item changes the total.', wrongAnswerFeedback, mistakeTags: ['attention-to-detail'], practiceLinks: [practiceLink('early-math')], ageMin: 4, ageMax: 6, visualType: 'count-stars', visualParams: { count } });
    }),

  // ── 20. Kindergarten — rhyme ─────────────────────────────────────────────
  ct({ id: 'kindergarten-rhyme', testIds: KG, domain: 'vocabulary', skillId: 'vocabulary', difficulty: 1 },
    (ctx, t) => {
      const item = ctx.rng.pick([
        { word: 'cat', answer: 'hat', distractors: ['dog', 'sun', 'milk'] },
        { word: 'ball', answer: 'wall', distractors: ['book', 'fish', 'tree'] },
        { word: 'cake', answer: 'snake', distractors: ['door', 'shoe', 'bird'] }
      ]);
      const { options, correctOptionId, wrongAnswerFeedback } = makeOptions(item.answer, item.distractors, ctx.rng, { [item.distractors[0]]: 'Listen for the ending sound, not just a familiar word.' });
      return baseQ(ctx, t, { prompt: `Which word rhymes with "${item.word}"?`, options, correctOptionId, correctAnswerLabel: item.answer, explanationSteps: [`"${item.word}" and "${item.answer}" have the same ending sound.`, 'Words with the same ending sound rhyme.'], commonTrap: 'A word can be familiar without rhyming.', wrongAnswerFeedback, mistakeTags: ['vocabulary-confusion'], practiceLinks: [practiceLink('vocabulary')], ageMin: 4, ageMax: 6 });
    }),

  // ── 21. Word knowledge synonym ───────────────────────────────────────────
  ct({ id: 'word-knowledge-synonym', testIds: [...APT, ...READ, ...MIL], domain: 'verbal', skillId: 'vocabulary', difficulty: 2 },
    (ctx, t) => {
      const item = ctx.rng.pick([
        { word: 'rapid', answer: 'fast', distractors: ['quiet', 'heavy', 'empty'] },
        { word: 'cautious', answer: 'careful', distractors: ['careless', 'bright', 'late'] },
        { word: 'assist', answer: 'help', distractors: ['hide', 'break', 'wait'] }
      ]);
      const { options, correctOptionId, wrongAnswerFeedback } = makeOptions(item.answer, item.distractors, ctx.rng, { [item.distractors[0]]: 'This choice does not match the meaning of the target word.' });
      return baseQ(ctx, t, { prompt: `Which word is closest in meaning to "${item.word}"?`, options, correctOptionId, correctAnswerLabel: item.answer, explanationSteps: [`"${item.word}" means "${item.answer}."`], commonTrap: 'Choose the closest meaning, not a word that only sounds related.', wrongAnswerFeedback, mistakeTags: ['vocabulary-confusion'], practiceLinks: [practiceLink('vocabulary')], ageMin: 8 });
    }),

  // ── 22. Kindergarten — follow directions ─────────────────────────────────
  ct({ id: 'kindergarten-follow-directions', testIds: KG, domain: 'executive-function', skillId: 'early-math', difficulty: 1 },
    (ctx, t) => {
      const color = ctx.rng.pick(['red', 'blue', 'green']), shape = ctx.rng.pick(['circle', 'square', 'star']);
      const ans = `${color} ${shape}`;
      const { options, correctOptionId, wrongAnswerFeedback } = makeOptions(ans, [`${color} triangle`, `yellow ${shape}`, 'all shapes'], ctx.rng, { 'all shapes': 'The direction asks for one specific color and shape.' });
      return baseQ(ctx, t, { prompt: `Follow the direction: choose the ${color} ${shape}.`, options, correctOptionId, correctAnswerLabel: ans, explanationSteps: [`The direction has two parts: ${color} and ${shape}.`, 'Find the choice that has both parts.', `The matching choice is ${ans}.`], commonTrap: 'A choice with only the right color or only the right shape is not enough.', wrongAnswerFeedback, mistakeTags: ['attention-to-detail'], practiceLinks: [practiceLink('early-math')], ageMin: 4, ageMax: 6 });
    }),

  // ── 23. Kindergarten — school readiness ──────────────────────────────────
  ct({ id: 'kindergarten-school-ready-task', testIds: KG, domain: 'school-readiness', skillId: 'early-math', difficulty: 1 },
    (ctx, t) => {
      const item = ctx.rng.pick([
        { prompt: 'Which choice shows something you do before writing your name?', answer: 'Hold the pencil carefully', distractors: ['Throw the pencil', 'Close your eyes', 'Run away'] },
        { prompt: 'Which choice helps during circle time?', answer: 'Listen and take turns', distractors: ['Talk over everyone', 'Hide the book', 'Kick the chair'] },
        { prompt: 'Which choice helps when a task feels hard?', answer: 'Ask for help or try again', distractors: ['Rip the paper', 'Quit right away', 'Blame a friend'] }
      ]);
      const { options, correctOptionId, wrongAnswerFeedback } = makeOptions(item.answer, item.distractors, ctx.rng, { [item.distractors[1]]: 'Think about the choice that helps learning continue.' });
      return baseQ(ctx, t, { prompt: item.prompt, options, correctOptionId, correctAnswerLabel: item.answer, explanationSteps: ['School readiness includes listening, trying, and using safe learning habits.', `The helpful choice is: ${item.answer}.`], commonTrap: 'Funny choices can be tempting — choose the one that helps learning.', wrongAnswerFeedback, mistakeTags: ['attention-to-detail'], practiceLinks: [practiceLink('early-math')], ageMin: 4, ageMax: 6 });
    }),

// ════════════════════════════════════════════════════════════════════════════
// SECTION 2 — EXPANSION 1 (28 templates)
// ════════════════════════════════════════════════════════════════════════════

  // ── 24-30. Reading + Vocab ───────────────────────────────────────────────
  ct({ id: 'vocab-synonym-common', testIds: [...READ, ...APT, ...MIL], domain: 'vocabulary', skillId: 'vocabulary', difficulty: 2 },
    (ctx, t) => {
      const items = [
        { word: 'Abundant', answer: 'Plentiful', distractors: ['Scarce', 'Ordinary', 'Heavy'], trap: '"Abundant" means plenty, not heavy.' },
        { word: 'Tranquil', answer: 'Peaceful', distractors: ['Loud', 'Shaky', 'Bright'], trap: 'Tranquil means calm and still, not bright or energetic.' },
        { word: 'Courageous', answer: 'Brave', distractors: ['Careless', 'Strong', 'Clever'], trap: 'Courageous means willing to face danger, not just strong or smart.' },
        { word: 'Peculiar', answer: 'Strange', distractors: ['Familiar', 'Partial', 'Pleasant'], trap: '"Peculiar" means unusual, not specific.' },
        { word: 'Exhausted', answer: 'Very tired', distractors: ['Excited', 'Confused', 'Fast'], trap: '"Exhausted" means completely drained.' },
        { word: 'Hesitant', answer: 'Unsure or slow to act', distractors: ['Eager', 'Quick', 'Rude'], trap: '"Hesitant" means pausing before acting.' },
      ];
      const item = ctx.rng.pick(items);
      const { options, correctOptionId, wrongAnswerFeedback } = makeOptions(item.answer, item.distractors, ctx.rng, { [item.distractors[0]]: item.trap });
      return baseQ(ctx, t, { prompt: `Which word is closest in meaning to "${item.word}"?`, options, correctOptionId, correctAnswerLabel: item.answer, explanationSteps: [`"${item.word}" most nearly means ${item.answer}.`, item.trap], commonTrap: item.trap, wrongAnswerFeedback, mistakeTags: ['vocabulary-confusion'], practiceLinks: [practiceLink('vocabulary')], ageMin: 8 });
    }),

  ct({ id: 'vocab-antonym-common', testIds: [...READ, ...MIL], domain: 'vocabulary', skillId: 'vocabulary', difficulty: 2 },
    (ctx, t) => {
      const items = [
        { word: 'Ancient', answer: 'Modern', distractors: ['Old', 'Dusty', 'Heavy'] },
        { word: 'Generous', answer: 'Stingy', distractors: ['Kind', 'Happy', 'Quiet'] },
        { word: 'Rigid', answer: 'Flexible', distractors: ['Hard', 'Straight', 'Tall'] },
        { word: 'Timid', answer: 'Bold', distractors: ['Slow', 'Weak', 'Silent'] },
        { word: 'Transparent', answer: 'Opaque', distractors: ['Clear', 'Thin', 'Light'] },
      ];
      const item = ctx.rng.pick(items);
      const { options, correctOptionId, wrongAnswerFeedback } = makeOptions(item.answer, item.distractors, ctx.rng, { [item.distractors[0]]: `"${item.distractors[0]}" is related to "${item.word}" but is not its opposite.` });
      return baseQ(ctx, t, { prompt: `Which word is most OPPOSITE in meaning to "${item.word}"?`, options, correctOptionId, correctAnswerLabel: item.answer, explanationSteps: [`The opposite of "${item.word}" is "${item.answer}".`, `"${item.distractors[0]}" may seem related but is not truly opposite.`], commonTrap: 'Similar-feeling words are often traps in antonym questions.', wrongAnswerFeedback, mistakeTags: ['vocabulary-confusion'], ageMin: 8 });
    }),

  ct({ id: 'vocab-context-clue', testIds: [...READ, ...APT], domain: 'vocabulary', skillId: 'vocabulary', difficulty: 3 },
    (ctx, t) => {
      const passages = [
        { sentence: 'Despite the torrential rain, the hikers remained undaunted and pressed on toward the summit.', word: 'undaunted', answer: 'not discouraged', distractors: ['very wet', 'completely lost', 'moving quickly'] },
        { sentence: 'The scientist was meticulous in her work, checking every measurement twice before recording a result.', word: 'meticulous', answer: 'very careful and precise', distractors: ['very fast', 'somewhat bored', 'not confident'] },
        { sentence: 'After the harvest, the barn was so full that it was practically bursting with provisions.', word: 'provisions', answer: 'stored food and supplies', distractors: ['empty space', 'farm tools', 'borrowed items'] },
      ];
      const p = ctx.rng.pick(passages);
      const { options, correctOptionId } = makeOptions(p.answer, p.distractors, ctx.rng);
      return baseQ(ctx, t, { prompt: `"${p.sentence}"\n\nBased on the sentence, what does "${p.word}" most likely mean?`, helperText: 'Use the rest of the sentence as a clue.', options, correctOptionId, correctAnswerLabel: p.answer, explanationSteps: ['Look at what happens in the sentence around the unknown word.', `In this context, "${p.word}" suggests ${p.answer}.`], commonTrap: 'Avoid choosing an answer that sounds related to a different meaning of the word.', mistakeTags: ['vocabulary-confusion'], ageMin: 9 });
    }),

  ct({ id: 'reading-main-idea-v2', testIds: READ, domain: 'reading-comprehension', skillId: 'reading-evidence', difficulty: 2 },
    (ctx, t) => {
      const passages = [
        { text: 'Honeybees live in large colonies and work together as a team. Each bee has a specific role: workers collect nectar, nurses care for larvae, and the queen lays eggs. Without this cooperation, the colony could not survive.', answer: 'Honeybee colonies survive through cooperation and divided roles.', distractors: ['The queen bee is the most important bee.', 'Honeybees collect nectar from flowers.', 'Bee larvae need special care to survive.'] },
        { text: 'Many cities have started replacing old streetlights with LED bulbs. LED lights use up to 75% less energy than traditional bulbs and can last more than 20 years. This change saves cities millions of dollars annually.', answer: 'LED streetlights save cities money and energy.', distractors: ['Old streetlights are dangerous.', 'LED bulbs cost more to buy.', 'Cities are spending more on electricity.'] },
        { text: 'Exercise improves more than just physical health. Studies show that regular physical activity boosts mood, sharpens memory, and reduces stress. Even a 20-minute walk can make a measurable difference.', answer: 'Exercise benefits both physical and mental health.', distractors: ['Walking is the best form of exercise.', 'Stress causes physical illness.', 'Memory problems are common in adults.'] },
      ];
      const p = ctx.rng.pick(passages);
      const { options, correctOptionId } = makeOptions(p.answer, p.distractors, ctx.rng);
      return baseQ(ctx, t, { prompt: `Read the passage:\n\n"${p.text}"\n\nWhat is the main idea?`, options, correctOptionId, correctAnswerLabel: p.answer, explanationSteps: ['The main idea is what the whole passage is mainly about.', 'Details support the main idea but are not the main idea themselves.', `Here, every sentence supports: ${p.answer}`], commonTrap: 'A specific detail mentioned in the passage is often used as a distractor.', mistakeTags: ['reading-comprehension'], ageMin: 8 });
    }),

  ct({ id: 'reading-inference', testIds: READ, domain: 'reading-comprehension', skillId: 'reading-comprehension', difficulty: 3 },
    (ctx, t) => {
      const passages = [
        { text: 'Maria checked her watch three times in the last ten minutes. She kept glancing toward the door and tapping her foot quietly under the desk.', question: 'What can you infer about Maria?', answer: 'She is waiting for someone or something.', distractors: ['She is angry at someone.', 'She wants to leave the room.', 'She lost her watch.'], explanation: 'Checking a watch repeatedly and watching the door suggests waiting.' },
        { text: 'After three years of saving every spare dollar and practising recipes every weekend, Chen finally unlocked the front door of his restaurant for the first time.', question: 'What can you infer about Chen?', answer: 'Opening the restaurant was a long-term goal that required sacrifice.', distractors: ['Chen had never cooked before.', 'Chen borrowed money from friends.', 'The restaurant was a gift.'], explanation: '3 years of saving and weekend practice shows commitment toward a planned goal.' },
      ];
      const p = ctx.rng.pick(passages);
      const { options, correctOptionId } = makeOptions(p.answer, p.distractors, ctx.rng);
      return baseQ(ctx, t, { prompt: `"${p.text}"\n\n${p.question}`, helperText: 'The answer is not stated directly — read between the lines.', options, correctOptionId, correctAnswerLabel: p.answer, explanationSteps: ['An inference is a conclusion drawn from clues in the text.', p.explanation], commonTrap: 'Inferences must be supported by the text. Avoid answers that go beyond what the clues suggest.', mistakeTags: ['reading-comprehension'], ageMin: 9 });
    }),

  ct({ id: 'reading-cause-effect', testIds: READ, domain: 'reading-comprehension', skillId: 'reading-comprehension', difficulty: 2 },
    (ctx, t) => {
      const items = [
        { cause: 'The power went out during the storm.', effect: 'All the food in the refrigerator spoiled.', decoy1: 'The storm began.', decoy2: 'People had to buy new refrigerators.', question: 'What was the EFFECT of the power outage?' },
        { cause: 'Layla forgot to water her plant for two weeks.', effect: 'The leaves turned yellow and drooped.', decoy1: 'It rained outside.', decoy2: 'The plant grew taller.', question: 'What was the EFFECT of Layla forgetting to water her plant?' },
      ];
      const item = ctx.rng.pick(items);
      const { options, correctOptionId } = makeOptions(item.effect, [item.cause, item.decoy1, item.decoy2], ctx.rng);
      return baseQ(ctx, t, { prompt: item.question, helperText: `Cause: ${item.cause}`, options, correctOptionId, correctAnswerLabel: item.effect, explanationSteps: ['A cause is what makes something happen. An effect is what happens as a result.', `Cause: ${item.cause}`, `Effect: ${item.effect}`], commonTrap: 'Students often confuse cause and effect. Ask: which event happened first and made the other happen?', mistakeTags: ['reading-comprehension'], ageMin: 7 });
    }),

  ct({ id: 'reading-author-purpose', testIds: READ, domain: 'reading-comprehension', skillId: 'reading-comprehension', difficulty: 3 },
    (ctx, t) => {
      const items = [
        { passage: 'A newspaper article listing confirmed hurricane evacuation routes and shelter locations.', answer: 'To inform readers of safety information', distractors: ['To entertain with storm stories', 'To persuade people to leave the coast', 'To describe hurricane science'] },
        { passage: 'A vivid story about a child who discovers a magical forest behind her grandmother\'s house.', answer: 'To entertain the reader with an imaginative story', distractors: ['To explain how forests grow', 'To persuade readers to go outside', 'To inform about plant species'] },
        { passage: 'An advertisement explaining why a new breakfast cereal is the healthiest choice for your family.', answer: 'To persuade readers to buy the product', distractors: ['To entertain with a funny story', 'To inform readers about nutrition science', 'To describe how cereal is made'] },
      ];
      const item = ctx.rng.pick(items);
      const { options, correctOptionId } = makeOptions(item.answer, item.distractors, ctx.rng);
      return baseQ(ctx, t, { prompt: `Consider this type of text:\n"${item.passage}"\n\nWhat is the author's most likely purpose?`, helperText: 'Authors write to inform, entertain, or persuade.', options, correctOptionId, correctAnswerLabel: item.answer, explanationSteps: ['The three main author purposes: to inform (share facts), to entertain (tell a story), to persuade (change behaviour).', `This text is most likely meant: ${item.answer}`], commonTrap: 'A text can contain facts but still be primarily persuasive if its goal is to change behaviour.', mistakeTags: ['reading-comprehension'], ageMin: 9 });
    }),

  // ── 31-35. STEM + Spatial ────────────────────────────────────────────────
  ct({ id: 'spatial-cube-rotation', testIds: [...STEM, ...APT], domain: 'visual-spatial', skillId: 'spatial-reasoning', difficulty: 3 },
    (ctx, t) => {
      const scenarios = [
        { q: 'You are looking at the front of a cube. You tip the cube away from you (backward). Which face is now on top?', answer: 'The face that was facing you', distractors: ['The face that was on the bottom', 'The face that was on top', 'The face that was on the left'] },
        { q: 'A cube has a red sticker on the front and a blue sticker on the top. You rotate it 90° to the right. What is now facing you?', answer: 'The face that was on the left', distractors: ['The blue sticker face', 'The red sticker face', 'The bottom face'] },
      ];
      const s = ctx.rng.pick(scenarios);
      const { options, correctOptionId } = makeOptions(s.answer, s.distractors, ctx.rng);
      return baseQ(ctx, t, { prompt: s.q, helperText: 'Imagine holding the cube in your hands.', options, correctOptionId, correctAnswerLabel: s.answer, explanationSteps: ['Track where each face starts.', 'Rotate step by step in your mind.', `After the rotation: ${s.answer}`], commonTrap: 'Label the 6 faces before rotating: Front, Back, Top, Bottom, Left, Right.', mistakeTags: ['spatial-reasoning'], ageMin: 9 });
    }),

  ct({ id: 'spatial-count-shapes', testIds: STEM, domain: 'visual-spatial', skillId: 'spatial-reasoning', difficulty: 2 },
    (ctx, t) => {
      const grid = ctx.rng.int(2,4), small = grid*grid, large = (grid-1)*(grid-1), total = small+large;
      const { options, correctOptionId } = makeOptions(String(total), [String(small), String(large), String(total+grid)], ctx.rng, { [String(small)]: 'This only counts the smallest squares.', [String(large)]: 'This only counts the larger squares.' });
      return baseQ(ctx, t, { prompt: `A ${grid}×${grid} grid of equal squares is drawn. How many squares of ANY size can you count in total?`, helperText: 'Count squares made of 1 cell, 4 cells, etc.', options, correctOptionId, correctAnswerLabel: String(total), explanationSteps: [`A ${grid}×${grid} grid has ${small} individual squares.`, `It also has ${large} larger (${grid-1}×${grid-1}) squares.`, `Total: ${small} + ${large} = ${total}.`], commonTrap: 'Remember to count all possible sizes, not just the smallest cells.', mistakeTags: ['spatial-reasoning'], ageMin: 8, visualType: grid <= 3 ? 'grid-3' : 'grid-4' });
    }),

  ct({ id: 'science-cause-effect', testIds: [...STEM, ...MIL], domain: 'science-reasoning', skillId: 'science-reasoning', difficulty: 2 },
    (ctx, t) => {
      const scenarios = [
        { cause: 'A metal spoon is placed in a hot cup of tea.', effect: 'The handle of the spoon becomes warm.', wrong: ['The spoon dissolves.', 'The tea becomes cooler.', 'The spoon changes color.'], principle: 'Heat transfers from the hot liquid to the spoon through conduction.' },
        { cause: 'A ball is thrown straight up in the air.', effect: 'It slows down, stops, and falls back down.', wrong: ['It keeps rising forever.', 'It flies sideways.', 'It lands exactly where it was thrown after circling.'], principle: 'Gravity pulls the ball downward, slowing it until it reverses direction.' },
        { cause: 'A plant is placed in a dark closet for two weeks.', effect: 'Its leaves turn yellow and it stops growing.', wrong: ['It grows faster without sunlight.', 'It produces more oxygen.', 'It develops deeper roots.'], principle: 'Plants need sunlight for photosynthesis to produce energy.' },
        { cause: 'Salt is added to water on a stove.', effect: 'The water takes slightly longer to boil.', wrong: ['The water boils immediately.', 'The water freezes faster.', 'The water evaporates before boiling.'], principle: 'Dissolved salt raises the boiling point of water slightly.' },
      ];
      const s = ctx.rng.pick(scenarios);
      const { options, correctOptionId } = makeOptions(s.effect, s.wrong, ctx.rng);
      return baseQ(ctx, t, { prompt: `What is the most likely result?\n\n"${s.cause}"`, options, correctOptionId, correctAnswerLabel: s.effect, explanationSteps: [s.principle, `Therefore, the result is: ${s.effect}`], commonTrap: 'Choose the result that follows directly from the cause.', mistakeTags: ['science-reasoning'], ageMin: 9 });
    }),

  ct({ id: 'science-classify', testIds: STEM, domain: 'science-reasoning', skillId: 'science-reasoning', difficulty: 2 },
    (ctx, t) => {
      const questions = [
        { question: 'Which of the following is a mammal?', answer: 'Dolphin', wrong: ['Shark', 'Eagle', 'Lizard'], fact: 'Mammals breathe air, are warm-blooded, and nurse young with milk. Dolphins do all of these.' },
        { question: 'Which of the following is NOT a form of energy?', answer: 'Water', wrong: ['Heat', 'Light', 'Sound'], fact: 'Heat, light, and sound are forms of energy. Water is a substance.' },
        { question: 'Which material is the best electrical conductor?', answer: 'Copper wire', wrong: ['Rubber glove', 'Wooden stick', 'Plastic bottle'], fact: 'Metals like copper allow electrons to flow freely. Rubber, wood, and plastic are insulators.' },
        { question: 'Which is an example of a physical change?', answer: 'Ice melting into water', wrong: ['Wood burning', 'Bread baking', 'Iron rusting'], fact: 'Melting changes state but not chemical composition. Burning, baking, and rusting create new substances.' },
      ];
      const q = ctx.rng.pick(questions);
      const { options, correctOptionId } = makeOptions(q.answer, q.wrong, ctx.rng);
      return baseQ(ctx, t, { prompt: q.question, options, correctOptionId, correctAnswerLabel: q.answer, explanationSteps: [q.fact], commonTrap: 'Read carefully whether the question asks for what IS or what is NOT in a category.', mistakeTags: ['science-reasoning'], ageMin: 9 });
    }),

  ct({ id: 'stem-pattern-visual', testIds: [...STEM, ...APT], domain: 'fluid-reasoning', skillId: 'pattern-reasoning', difficulty: 2 },
    (ctx, t) => {
      const rule = ctx.rng.pick(['add-2', 'double', 'square']), start = ctx.rng.int(1,4);
      let seq: number[];
      if (rule === 'add-2') seq = [start, start+2, start+4, start+6, start+8];
      else if (rule === 'double') seq = [start, start*2, start*4, start*8, start*16];
      else seq = [1,4,9,16,25];
      const ans = seq[4], shown = seq.slice(0,4);
      const { options, correctOptionId } = makeOptions(String(ans), [String(ans+1), String(ans-1), String(ans+shown[3])], ctx.rng);
      return baseQ(ctx, t, { prompt: `What comes next in this pattern?\n${shown.join(', ')}, ___`, helperText: 'Find the rule by looking at how each number changes.', options, correctOptionId, correctAnswerLabel: String(ans), explanationSteps: [rule === 'add-2' ? `Each number increases by ${shown[1]-shown[0]}.` : rule === 'double' ? 'Each number is doubled.' : 'These are perfect squares: 1², 2², 3², 4², 5².', `So the next number is ${ans}.`], commonTrap: 'Check that your rule works for every step, not just the first two.', mistakeTags: ['pattern-recognition'], ageMin: 7 });
    }),

  // ── 36-40. Coding logic ──────────────────────────────────────────────────
  ct({ id: 'coding-sequence-trace', testIds: CODE, domain: 'coding-logic', skillId: 'coding-logic', difficulty: 2 },
    (ctx, t) => {
      const start = ctx.rng.int(1,10), addEach = ctx.rng.int(2,5), steps = ctx.rng.int(3,5);
      let val = start; const trace = [`Start: ${val}`];
      for (let i = 0; i < steps; i++) { val += addEach; trace.push(`Add ${addEach} → ${val}`); }
      const { options, correctOptionId } = makeOptions(String(val), [String(val+addEach), String(val-addEach), String(start+addEach)], ctx.rng, { [String(start+addEach)]: 'This only ran the instruction once instead of all the way through.' });
      return baseQ(ctx, t, { prompt: `Trace these instructions:\n\nStart with ${start}.\nRepeat ${steps} times: add ${addEach}.\n\nWhat is the final value?`, options, correctOptionId, correctAnswerLabel: String(val), explanationSteps: trace.concat([`Final answer: ${val}`]), commonTrap: 'Count carefully — run the instruction exactly the stated number of times.', mistakeTags: ['attention-to-detail', 'multi-step-reasoning'], ageMin: 8 });
    }),

  ct({ id: 'coding-loop-count-v2', testIds: CODE, domain: 'coding-logic', skillId: 'coding-logic', difficulty: 2 },
    (ctx, t) => {
      const target = ctx.rng.int(3,8), step = ctx.rng.int(1,3);
      let count = 0, value = 0;
      while (value < target) { value += step; count++; }
      const { options, correctOptionId } = makeOptions(String(count), [String(count+1), String(count-1), String(target)], ctx.rng, { [String(target)]: 'This is the target number, not how many times the loop ran.' });
      return baseQ(ctx, t, { prompt: `A loop starts at 0 and adds ${step} each time.\nIt stops when the value reaches ${target} or higher.\n\nHow many times does the loop run?`, helperText: 'Trace each loop step: 0 → ...', options, correctOptionId, correctAnswerLabel: String(count), explanationSteps: (() => { const s = ['Start at 0.']; let v = 0; for (let i = 0; i < count; i++) { v += step; s.push(`Run ${i+1}: add ${step} → ${v}`); } s.push(`${v} >= ${target}, loop stops. Ran ${count} times.`); return s; })(), commonTrap: 'Loops stop as soon as the condition is met.', mistakeTags: ['multi-step-reasoning'], ageMin: 9 });
    }),

  ct({ id: 'coding-conditional-if', testIds: CODE, domain: 'coding-logic', skillId: 'coding-logic', difficulty: 2 },
    (ctx, t) => {
      const num = ctx.rng.int(1,20), threshold = ctx.rng.pick([5,10,15]);
      const action = num > threshold ? `print "Big"` : `print "Small"`;
      const { options, correctOptionId } = makeOptions(action, [num > threshold ? `print "Small"` : `print "Big"`, 'print nothing', 'print the number'], ctx.rng);
      return baseQ(ctx, t, { prompt: `This program runs:\n\nnumber = ${num}\nif number > ${threshold}:\n    print "Big"\nelse:\n    print "Small"\n\nWhat does the program print?`, options, correctOptionId, correctAnswerLabel: action, explanationSteps: [`The number is ${num}. The threshold is ${threshold}.`, `${num} > ${threshold} is ${num > threshold ? 'TRUE' : 'FALSE'}.`, `So the program ${action}.`], commonTrap: 'Only one branch of an if/else runs.', mistakeTags: ['attention-to-detail'], ageMin: 9 });
    }),

  ct({ id: 'coding-debug-rule', testIds: CODE, domain: 'coding-logic', skillId: 'coding-logic', difficulty: 3 },
    (ctx, t) => {
      const bugs = [
        { description: 'A robot is supposed to turn right, then go forward 3 steps, then turn left.\nInstead it turns left first, then goes forward, then turns right.', answer: 'The turning instructions are in the wrong order.', distractors: ['The robot goes too many steps.', 'The robot skips the forward step.', 'The robot turns twice at the start.'] },
        { description: 'A program should print numbers 1 through 5.\nInstead it prints: 2, 3, 4, 5, 6.', answer: 'The starting value is 2 instead of 1.', distractors: ['The loop runs too many times.', 'The loop skips even numbers.', 'The program prints letters instead of numbers.'] },
      ];
      const b = ctx.rng.pick(bugs);
      const { options, correctOptionId } = makeOptions(b.answer, b.distractors, ctx.rng);
      return baseQ(ctx, t, { prompt: `Find the bug:\n\n${b.description}\n\nWhat is the problem?`, options, correctOptionId, correctAnswerLabel: b.answer, explanationSteps: ['Read the intended behaviour first.', 'Compare it to what actually happened.', `The difference reveals: ${b.answer}`], commonTrap: 'Focus on the first point where actual behaviour differs from intended.', mistakeTags: ['attention-to-detail', 'pattern-recognition'], ageMin: 10 });
    }),

  ct({ id: 'coding-algorithm-order', testIds: CODE, domain: 'coding-logic', skillId: 'coding-logic', difficulty: 2 },
    (ctx, t) => {
      const tasks = [
        { goal: 'Make a peanut butter sandwich', correct: '1. Get bread 2. Open jar 3. Spread peanut butter 4. Put slices together', distractors: ['1. Spread peanut butter 2. Get bread 3. Open jar 4. Put together', '1. Get bread 2. Put together 3. Open jar 4. Spread', '1. Open jar 2. Put together 3. Get bread 4. Spread'] },
        { goal: 'Send an email', correct: '1. Open email app 2. Click compose 3. Write the message 4. Click send', distractors: ['1. Click send 2. Open app 3. Write 4. Click compose', '1. Write 2. Open app 3. Click compose 4. Click send', '1. Open app 2. Write 3. Click compose 4. Click send'] },
      ];
      const task = ctx.rng.pick(tasks);
      const { options, correctOptionId } = makeOptions(task.correct, task.distractors, ctx.rng);
      return baseQ(ctx, t, { prompt: `Which is the correct order of steps to: "${task.goal}"?`, helperText: 'Each step must be possible given what came before it.', options, correctOptionId, correctAnswerLabel: task.correct, explanationSteps: ['Algorithms require steps in a specific order.', 'You cannot do a later step if an earlier step has not happened.', `Correct order: ${task.correct}`], commonTrap: 'Check that each step is actually possible before proceeding.', mistakeTags: ['multi-step-reasoning'], ageMin: 8 });
    }),

  // ── 41-45. Military aptitude ─────────────────────────────────────────────
  ct({ id: 'military-verbal-paragraph', testIds: MIL, domain: 'verbal', skillId: 'vocabulary', difficulty: 3 },
    (ctx, t) => {
      const passages = [
        { text: 'A standard military convoy must maintain a minimum spacing of 100 meters between vehicles to reduce the risk of multiple vehicles being damaged by a single explosive device. During urban operations, this spacing may be reduced due to terrain constraints.', question: 'Why might vehicle spacing be reduced in urban areas?', answer: 'Due to the physical constraints of city terrain', distractors: ['Because city roads are safer', 'To move faster through traffic', 'Because explosives are less common in cities'] },
        { text: 'Triage is the process of sorting casualties by the severity of their injuries to ensure that medical resources are used most effectively. Those with life-threatening but survivable injuries are treated first.', question: 'According to the passage, who receives treatment first in triage?', answer: 'Those with serious injuries that can be survived with treatment', distractors: ['Those with the least serious injuries', 'Those who arrived first', 'Those who request help most urgently'] },
      ];
      const p = ctx.rng.pick(passages);
      const { options, correctOptionId } = makeOptions(p.answer, p.distractors, ctx.rng);
      return baseQ(ctx, t, { prompt: `Read the passage:\n\n"${p.text}"\n\n${p.question}`, helperText: 'Answer based only on what the passage states.', options, correctOptionId, correctAnswerLabel: p.answer, explanationSteps: ['Find the sentence that directly answers the question.', `The passage states: ${p.answer}`], commonTrap: 'Choose only what the passage says, not what you might believe is true generally.', mistakeTags: ['reading-comprehension'], ageMin: 14 });
    }),

  ct({ id: 'military-arithmetic-rate', testIds: MIL, domain: 'quantitative', skillId: 'arithmetic-operations', difficulty: 3 },
    (ctx, t) => {
      const speed = ctx.rng.pick([40,50,60,70]), hours = ctx.rng.int(2,5), distance = speed*hours;
      const { options, correctOptionId } = makeOptions(`${distance} miles`, [`${speed+hours} miles`, `${speed*(hours+1)} miles`, `${distance-speed} miles`], ctx.rng, { [`${speed+hours} miles`]: 'Distance = speed × time, not speed + time.' });
      return baseQ(ctx, t, { prompt: `A vehicle travels at ${speed} miles per hour for ${hours} hours. How far does it travel?`, options, correctOptionId, correctAnswerLabel: `${distance} miles`, explanationSteps: ['Distance = speed × time.', `${speed} mph × ${hours} hours = ${distance} miles.`], commonTrap: 'Use multiplication, not addition, for rate × time problems.', mistakeTags: ['procedure-error'], ageMin: 14 });
    }),

  ct({ id: 'military-mechanical-leverage', testIds: MIL, domain: 'mechanical-reasoning', skillId: 'mechanical-reasoning', difficulty: 3 },
    (ctx, t) => {
      const scenarios = [
        { q: 'A lever has a load on one end. To lift the same load with LESS force, you should:', answer: 'Move the fulcrum closer to the load', distractors: ['Move the fulcrum away from the load', 'Shorten the lever arm', 'Place the load at the center'] },
        { q: 'Two gears are connected. Gear A has 10 teeth and Gear B has 20 teeth. If Gear A turns once, how many times does Gear B turn?', answer: 'Half a turn (0.5 times)', distractors: ['One full turn', 'Two full turns', 'Same number of teeth'] },
        { q: 'A ramp is used to push a heavy box into a truck. If you make the ramp longer, the force needed to push the box:', answer: 'Decreases', distractors: ['Increases', 'Stays the same', 'Doubles'] },
        { q: 'Water flows through a wide pipe into a narrow pipe. The speed of the water in the narrow pipe is:', answer: 'Faster', distractors: ['Slower', 'The same', 'Stops completely'] },
      ];
      const s = ctx.rng.pick(scenarios);
      const { options, correctOptionId } = makeOptions(s.answer, s.distractors, ctx.rng);
      return baseQ(ctx, t, { prompt: s.q, options, correctOptionId, correctAnswerLabel: s.answer, explanationSteps: [s.answer], commonTrap: 'Mechanical advantage involves trade-offs: less force usually means more distance or time.', mistakeTags: ['science-reasoning'], ageMin: 14 });
    }),

  ct({ id: 'military-science-basic', testIds: [...MIL, ...STEM], domain: 'science-reasoning', skillId: 'science-reasoning', difficulty: 3 },
    (ctx, t) => {
      const questions = [
        { q: 'Which type of energy is stored in a compressed spring?', answer: 'Elastic potential energy', wrong: ['Kinetic energy', 'Chemical energy', 'Thermal energy'] },
        { q: 'A metal rod is heated at one end. The other end gradually becomes warm. This is an example of:', answer: 'Conduction', wrong: ['Convection', 'Radiation', 'Reflection'] },
        { q: 'Which circuit allows electricity to still flow if one bulb is removed?', answer: 'Parallel circuit', wrong: ['Series circuit', 'Open circuit', 'Grounded circuit'] },
        { q: 'Which of the following is an example of a chemical change?', answer: 'Iron rusting', wrong: ['Ice melting', 'Glass breaking', 'Water boiling'] },
      ];
      const q = ctx.rng.pick(questions);
      const { options, correctOptionId } = makeOptions(q.answer, q.wrong, ctx.rng);
      return baseQ(ctx, t, { prompt: q.q, options, correctOptionId, correctAnswerLabel: q.answer, explanationSteps: [`The correct answer is: ${q.answer}`], commonTrap: 'Physical changes are reversible and do not create new substances. Chemical changes create new substances.', mistakeTags: ['science-reasoning'], ageMin: 14 });
    }),

  ct({ id: 'military-math-percentage', testIds: MIL, domain: 'quantitative', skillId: 'arithmetic-operations', difficulty: 3 },
    (ctx, t) => {
      const total = ctx.rng.pick([200,400,500,1000]), pct = ctx.rng.pick([10,20,25,30,40,50]);
      const ans = (total*pct)/100;
      const { options, correctOptionId } = makeOptions(String(ans), [String(ans+pct), String(total/pct), String(ans*2)], ctx.rng, { [String(total/pct)]: 'Dividing total by the percent is not the correct method.' });
      return baseQ(ctx, t, { prompt: `What is ${pct}% of ${total}?`, options, correctOptionId, correctAnswerLabel: String(ans), explanationSteps: [`Convert: ${pct}% = ${pct/100}.`, `Multiply: ${total} × ${pct/100} = ${ans}.`], commonTrap: 'Convert the percent to a decimal before multiplying.', mistakeTags: ['procedure-error'], ageMin: 14 });
    }),

  // ── 46-50. Kindergarten expansion 1 ─────────────────────────────────────
  ct({ id: 'kg-count-objects', testIds: KG, domain: 'number-sense', skillId: 'arithmetic-operations', difficulty: 1 },
    (ctx, t) => {
      const count = ctx.rng.int(3,10);
      const { options, correctOptionId } = makeOptions(String(count), [String(count+1), String(count-1), String(count+2)], ctx.rng);
      return baseQ(ctx, t, { prompt: `There are ${count} apples in a basket.\n\nHow many apples is that?`, helperText: 'Point and count along.', options, correctOptionId, correctAnswerLabel: String(count), explanationSteps: [`Count each apple one by one.`, `There are ${count} apples.`], commonTrap: 'Make sure to count every object once.', mistakeTags: ['calculation-error'], ageMin: 4, ageMax: 7 });
    }),

  ct({ id: 'kg-number-order', testIds: KG, domain: 'number-sense', skillId: 'arithmetic-operations', difficulty: 1 },
    (ctx, t) => {
      const start = ctx.rng.int(1,7), seq = [start, start+1, start+2], ans = String(start+3);
      const { options, correctOptionId } = makeOptions(ans, [String(start+4), String(start+2), String(start)], ctx.rng);
      return baseQ(ctx, t, { prompt: `What number comes next?\n${seq.join(', ')}, ___`, helperText: 'Count up by one.', options, correctOptionId, correctAnswerLabel: ans, explanationSteps: [`We are counting up: ${seq.join(', ')}...`, `The next number is ${ans}.`], commonTrap: 'Counting means adding one each time.', mistakeTags: ['pattern-recognition'], ageMin: 4, ageMax: 7 });
    }),

  ct({ id: 'kg-shape-identify', testIds: KG, domain: 'school-readiness', skillId: 'geometry', difficulty: 1 },
    (ctx, t) => {
      const shapes = [
        { name: 'circle', sides: 0, clue: 'A circle is perfectly round with no corners.' },
        { name: 'square', sides: 4, clue: 'A square has 4 equal sides and 4 corners.' },
        { name: 'triangle', sides: 3, clue: 'A triangle has exactly 3 sides and 3 corners.' },
        { name: 'rectangle', sides: 4, clue: 'A rectangle has 4 sides and 4 corners, like a door.' },
      ];
      const shape = ctx.rng.pick(shapes);
      const others = shapes.filter(s => s.name !== shape.name).map(s => s.name);
      const { options, correctOptionId } = makeOptions(shape.name, others, ctx.rng);
      return baseQ(ctx, t, { prompt: shape.sides === 0 ? `Which shape has NO corners and is perfectly round?` : `Which shape has exactly ${shape.sides} sides?`, options, correctOptionId, correctAnswerLabel: shape.name, explanationSteps: [shape.clue], commonTrap: 'Count the sides carefully — corners and sides have the same count.', mistakeTags: ['concept-gap'], ageMin: 4, ageMax: 7, visualType: 'shape', visualParams: { shape: shape.name } });
    }),

  ct({ id: 'kg-following-directions', testIds: KG, domain: 'executive-function', skillId: 'working-memory', difficulty: 1 },
    (ctx, t) => {
      const tasks = [
        { instruction: 'Clap your hands TWICE, then touch your nose.', question: 'What do you do LAST?', answer: 'Touch your nose', distractors: ['Clap your hands', 'Jump up', 'Stomp your feet'] },
        { instruction: 'Stand up, turn around ONE time, then sit back down.', question: 'What do you do FIRST?', answer: 'Stand up', distractors: ['Turn around', 'Sit back down', 'Clap your hands'] },
        { instruction: 'Put the red block on TOP of the blue block.', question: 'Which block goes on top?', answer: 'Red block', distractors: ['Blue block', 'Green block', 'Both blocks'] },
      ];
      const task = ctx.rng.pick(tasks);
      const { options, correctOptionId } = makeOptions(task.answer, task.distractors, ctx.rng);
      return baseQ(ctx, t, { prompt: `Listen to this instruction:\n"${task.instruction}"\n\n${task.question}`, options, correctOptionId, correctAnswerLabel: task.answer, explanationSteps: [`The instruction says: "${task.instruction}"`, `Answer to "${task.question}": ${task.answer}`], commonTrap: 'Pay close attention to the order of the steps.', mistakeTags: ['attention-to-detail'], ageMin: 4, ageMax: 7 });
    }),

  ct({ id: 'kg-letter-sound', testIds: KG, domain: 'vocabulary', skillId: 'vocabulary', difficulty: 1 },
    (ctx, t) => {
      const words = [
        { letter: 'B', words: ['Ball', 'Bear', 'Boat'], wrong: ['Cat', 'Dog', 'Frog'] },
        { letter: 'S', words: ['Sun', 'Star', 'Snake'], wrong: ['Dog', 'Rabbit', 'Fish'] },
        { letter: 'M', words: ['Moon', 'Monkey', 'Mouse'], wrong: ['Dog', 'Cat', 'Flower'] },
        { letter: 'T', words: ['Tree', 'Tiger', 'Train'], wrong: ['Dog', 'Rabbit', 'Pig'] },
      ];
      const item = ctx.rng.pick(words), ans = ctx.rng.pick(item.words);
      const { options, correctOptionId } = makeOptions(ans, item.wrong, ctx.rng);
      return baseQ(ctx, t, { prompt: `Which word starts with the letter "${item.letter}"?`, helperText: 'Say each word out loud and listen to the first sound.', options, correctOptionId, correctAnswerLabel: ans, explanationSteps: [`"${ans}" starts with the letter ${item.letter}.`], commonTrap: 'Listen to the very first sound of each word.', mistakeTags: ['vocabulary-confusion'], ageMin: 4, ageMax: 7 });
    }),

// ════════════════════════════════════════════════════════════════════════════
// SECTION 3 — EXPANSION 2 (37 templates)
// ════════════════════════════════════════════════════════════════════════════

  // ── 51-58. Aptitude expansion ────────────────────────────────────────────
  ct({ id: 'fluid-odd-one-out', testIds: [...APT,...STEM], domain: 'fluid-reasoning', skillId: 'pattern-reasoning', difficulty: 2 },
    (ctx, t) => {
      const groups = [
        { items: ['Piano', 'Guitar', 'Drum', 'Paintbrush'], odd: 'Paintbrush', reason: 'Piano, Guitar, and Drum are musical instruments. A Paintbrush is an art tool.' },
        { items: ['Salmon', 'Tuna', 'Trout', 'Whale'], odd: 'Whale', reason: 'Salmon, Tuna, and Trout are fish. A Whale is a mammal.' },
        { items: ['Mars', 'Venus', 'Moon', 'Jupiter'], odd: 'Moon', reason: 'Mars, Venus, and Jupiter are planets. The Moon is a natural satellite.' },
        { items: ['Oak', 'Maple', 'Pine', 'Rose'], odd: 'Rose', reason: 'Oak, Maple, and Pine are trees. A Rose is a flowering shrub.' },
        { items: ['Hammer', 'Saw', 'Drill', 'Ladder'], odd: 'Ladder', reason: 'Hammer, Saw, and Drill are tools. A Ladder is used for climbing.' },
      ];
      const g = ctx.rng.pick(groups);
      const { options, correctOptionId } = makeOptions(g.odd, g.items.filter(i => i !== g.odd), ctx.rng);
      return baseQ(ctx, t, { prompt: `Which item does NOT belong?\n${g.items.join(' · ')}`, options, correctOptionId, correctAnswerLabel: g.odd, explanationSteps: [g.reason], commonTrap: 'Look for what category the majority share — the odd one belongs to a different category.', mistakeTags: ['pattern-recognition'], ageMin: 7 });
    }),

  ct({ id: 'fluid-next-letter', testIds: APT, domain: 'fluid-reasoning', skillId: 'pattern-reasoning', difficulty: 3 },
    (ctx, t) => {
      const offset = ctx.rng.int(0,20), step = ctx.rng.pick([2,3,4]);
      const seq = Array.from({length:4}, (_,i) => String.fromCharCode(65+((offset+i*step)%26)));
      const next = String.fromCharCode(65+((offset+4*step)%26));
      const wrong = [String.fromCharCode(65+((offset+4*step+1)%26)), String.fromCharCode(65+((offset+4*step-1)%26)), String.fromCharCode(65+((offset+5*step)%26))];
      const { options, correctOptionId } = makeOptions(next, wrong, ctx.rng);
      return baseQ(ctx, t, { prompt: `What letter comes next?\n${seq.join(', ')}, ___`, helperText: 'Find how many letters are skipped each time.', options, correctOptionId, correctAnswerLabel: next, explanationSteps: [`Each letter skips ${step-1} letter(s) in the alphabet.`, `After ${seq[seq.length-1]}, the next letter is ${next}.`], commonTrap: 'Count the gap between consecutive letters.', mistakeTags: ['pattern-recognition'], ageMin: 9 });
    }),

  ct({ id: 'verbal-analogy-function', testIds: APT, domain: 'verbal', skillId: 'vocabulary', difficulty: 2 },
    (ctx, t) => {
      const pairs = [
        { a: 'Oven', b: 'cook food', c: 'Refrigerator', d: 'keep food cold', w: ['grow food', 'clean food', 'serve food'] },
        { a: 'Pen', b: 'write', c: 'Scissors', d: 'cut', w: ['draw', 'paint', 'erase'] },
        { a: 'Telescope', b: 'see distant objects', c: 'Microscope', d: 'see tiny objects', w: ['see colours', 'measure temperature', 'see stars only'] },
        { a: 'Thermometer', b: 'measure temperature', c: 'Scale', d: 'measure weight', w: ['measure height', 'measure time', 'measure speed'] },
      ];
      const p = ctx.rng.pick(pairs);
      const { options, correctOptionId } = makeOptions(p.d, p.w, ctx.rng);
      return baseQ(ctx, t, { prompt: `${p.a} is used to ${p.b}.\n${p.c} is used to ___`, options, correctOptionId, correctAnswerLabel: p.d, explanationSteps: [`The relationship is function/purpose.`, `${p.a} → ${p.b}. By the same logic, ${p.c} → ${p.d}.`], commonTrap: 'Analogies require the same type of relationship, not just related words.', mistakeTags: ['vocabulary-confusion'], ageMin: 8 });
    }),

  ct({ id: 'verbal-part-to-whole', testIds: [...APT,...READ], domain: 'verbal', skillId: 'vocabulary', difficulty: 2 },
    (ctx, t) => {
      const items = [
        { part: 'Chapter', whole: 'Book', wrong: ['Paragraph', 'Library', 'Author'] },
        { part: 'Petal', whole: 'Flower', wrong: ['Leaf', 'Tree', 'Stem'] },
        { part: 'Inning', whole: 'Baseball game', wrong: ['Quarter', 'Period', 'Set'] },
        { part: 'Pixel', whole: 'Digital image', wrong: ['Screen', 'Camera', 'Colour'] },
        { part: 'Verse', whole: 'Song', wrong: ['Melody', 'Lyric', 'Beat'] },
      ];
      const item = ctx.rng.pick(items);
      const { options, correctOptionId } = makeOptions(item.whole, item.wrong, ctx.rng);
      return baseQ(ctx, t, { prompt: `A ${item.part} is one part of a ___.`, options, correctOptionId, correctAnswerLabel: item.whole, explanationSteps: [`A ${item.part} is a component of a larger ${item.whole}.`], commonTrap: 'Part-to-whole requires finding what the item is physically part of, not just related to.', mistakeTags: ['vocabulary-confusion'], ageMin: 8 });
    }),

  ct({ id: 'quant-percent-increase', testIds: [...APT,...MATH_ALL,...MIL], domain: 'quantitative', skillId: 'arithmetic-operations', difficulty: 3 },
    (ctx, t) => {
      const orig = ctx.rng.pick([40,50,80,100,120,200]), pct = ctx.rng.pick([10,20,25,50]);
      const increase = (orig*pct)/100, ans = orig+increase;
      const { options, correctOptionId } = makeOptions(String(ans), [String(orig+pct), String(increase), String(ans+pct)], ctx.rng, { [String(orig+pct)]: 'This adds the percent number itself, not the percent of the original.', [String(increase)]: 'This is only the increase amount, not the new total.' });
      return baseQ(ctx, t, { prompt: `A price of $${orig} increases by ${pct}%. What is the new price?`, options, correctOptionId, correctAnswerLabel: String(ans), explanationSteps: [`Find the increase: ${pct}% of ${orig} = ${increase}.`, `Add to the original: ${orig} + ${increase} = ${ans}.`], commonTrap: 'Percent increase: find the amount, then ADD it to the original.', mistakeTags: ['procedure-error', 'multi-step-reasoning'], ageMin: 10 });
    }),

  ct({ id: 'memory-track-rule', testIds: APT, domain: 'working-memory', skillId: 'working-memory', difficulty: 3 },
    (ctx, t) => {
      const num = ctx.rng.int(3,15), m = ctx.rng.int(2,5), b = ctx.rng.int(1,8), ans = num*m+b;
      const { options, correctOptionId } = makeOptions(String(ans), [String(num*m), String(num+m+b), String(ans+b)], ctx.rng, { [String(num*m)]: 'This forgets to add the second number.' });
      return baseQ(ctx, t, { prompt: `Keep this rule in mind:\nStart with ${num}. Multiply by ${m}. Then add ${b}.\n\nWhat is the final result?`, options, correctOptionId, correctAnswerLabel: String(ans), explanationSteps: [`Step 1: ${num} × ${m} = ${num*m}.`, `Step 2: ${num*m} + ${b} = ${ans}.`], commonTrap: 'Follow every step — stopping after multiplication misses the final addition.', mistakeTags: ['multi-step-reasoning', 'attention-to-detail'], ageMin: 9 });
    }),

  ct({ id: 'spatial-mirror-image', testIds: [...APT,...STEM], domain: 'visual-spatial', skillId: 'spatial-reasoning', difficulty: 2 },
    (ctx, t) => {
      const scenarios = [
        { q: 'The letter "b" is reflected horizontally (flipped left-right). What does it look like?', answer: 'd', wrong: ['p', 'q', 'b reversed'] },
        { q: 'The number "6" is reflected vertically (flipped top-to-bottom). What does it look like?', answer: '9', wrong: ['6 (unchanged)', '0', '8'] },
        { q: 'An arrow pointing RIGHT is reflected horizontally. Which direction does it now point?', answer: 'Left', wrong: ['Right', 'Up', 'Down'] },
        { q: 'The word "MOM" is reflected horizontally. What does it look like?', answer: 'MOM (unchanged)', wrong: ['WOW', 'MON', 'MOM backwards'] },
      ];
      const s = ctx.rng.pick(scenarios);
      const { options, correctOptionId } = makeOptions(s.answer, s.wrong, ctx.rng);
      // Pick a mirror visual based on which scenario was chosen
      let visualType: 'mirror-letter' | 'mirror-arrow' | undefined;
      let visualParams: Record<string, string | number> | undefined;
      if (s.q.startsWith('The letter "b"')) { visualType = 'mirror-letter'; visualParams = { letter: 'b', axis: 'horizontal' }; }
      else if (s.q.startsWith('The number "6"')) { visualType = 'mirror-letter'; visualParams = { letter: '6', axis: 'vertical' }; }
      else if (s.q.startsWith('An arrow')) { visualType = 'mirror-arrow'; visualParams = { direction: 'right' }; }
      else if (s.q.startsWith('The word')) { visualType = 'mirror-letter'; visualParams = { letter: 'M', axis: 'horizontal' }; }
      return baseQ(ctx, t, { prompt: s.q, helperText: 'Imagine holding a mirror along the axis of reflection.', options, correctOptionId, correctAnswerLabel: s.answer, explanationSteps: ['A horizontal reflection swaps left and right.', 'A vertical reflection swaps top and bottom.', `Result: ${s.answer}`], commonTrap: 'Horizontal vs. vertical reflection are opposites of what you might expect.', mistakeTags: ['spatial-reasoning'], ageMin: 9, visualType, visualParams });
    }),

  ct({ id: 'quant-ratio-simplify', testIds: [...APT,...MATH_ALL], domain: 'quantitative', skillId: 'fractions-ratios', difficulty: 3 },
    (ctx, t) => {
      const factor = ctx.rng.pick([2,3,4,5]), a = ctx.rng.int(1,6);
      let b = ctx.rng.int(1,6); while (b === a) b = (b % 6) + 1;
      const bigA = a*factor, bigB = b*factor, ans = `${a}:${b}`;
      const { options, correctOptionId } = makeOptions(ans, [`${bigA}:${bigB}`, `${a}:${bigB}`, `${bigB}:${bigA}`], ctx.rng, { [`${bigA}:${bigB}`]: 'This is the original ratio, not the simplified form.' });
      return baseQ(ctx, t, { prompt: `Simplify the ratio ${bigA}:${bigB} to its lowest terms.`, options, correctOptionId, correctAnswerLabel: ans, explanationSteps: [`GCF of ${bigA} and ${bigB} is ${factor}.`, `Divide both parts: ${bigA} ÷ ${factor} = ${a}, ${bigB} ÷ ${factor} = ${b}.`, `Simplified: ${ans}.`], commonTrap: 'Divide BOTH parts of the ratio by the same number.', mistakeTags: ['procedure-error'], ageMin: 10 });
    }),

  // ── 59-64. Math expansion ────────────────────────────────────────────────
  ct({ id: 'number-sense-place-value', testIds: MATH, domain: 'number-sense', skillId: 'arithmetic-operations', difficulty: 2 },
    (ctx, t) => {
      const th = ctx.rng.int(1,9), h = ctx.rng.int(0,9), te = ctx.rng.int(0,9), on = ctx.rng.int(0,9);
      const num = th*1000+h*100+te*10+on, place = ctx.rng.pick(['thousands','hundreds','tens','ones']);
      const map: Record<string,number> = {thousands:th,hundreds:h,tens:te,ones:on};
      const ans = String(map[place]);
      const { options, correctOptionId } = makeOptions(ans, [String((map[place]+1)%10), String(num), String(map[place]*10)], ctx.rng);
      return baseQ(ctx, t, { prompt: `In the number ${num.toLocaleString()}, what digit is in the ${place} place?`, options, correctOptionId, correctAnswerLabel: ans, explanationSteps: [`Write the number: ${num}.`, `Thousands: ${th}, Hundreds: ${h}, Tens: ${te}, Ones: ${on}.`, `The ${place} digit is ${ans}.`], commonTrap: 'The ones place is on the far right; places increase in value going left.', mistakeTags: ['concept-gap'], ageMin: 7 });
    }),

  ct({ id: 'geometry-perimeter', testIds: MATH, domain: 'geometry', skillId: 'geometry', difficulty: 2 },
    (ctx, t) => {
      const sides = ctx.rng.pick([3,4,5]), lengths = Array.from({length:sides}, () => ctx.rng.int(3,12));
      const ans = lengths.reduce((a,b)=>a+b,0);
      const wrong = [ans+ctx.rng.int(1,4), ans-ctx.rng.int(1,3), lengths[0]*sides];
      const shape = sides===3?'triangle':sides===4?'quadrilateral':'pentagon';
      const { options, correctOptionId } = makeOptions(`${ans} units`, wrong.map(w=>`${w} units`), ctx.rng, { [`${lengths[0]*sides} units`]: 'This multiplies one side, which only works for shapes with equal sides.' });
      return baseQ(ctx, t, { prompt: `A ${shape} has sides of ${lengths.join(', ')} units. What is its perimeter?`, options, correctOptionId, correctAnswerLabel: `${ans} units`, explanationSteps: [`Perimeter = sum of all sides.`, `${lengths.join(' + ')} = ${ans} units.`], commonTrap: 'Perimeter adds ALL sides. Area uses multiplication — these are different formulas.', mistakeTags: ['procedure-error'], ageMin: 7 });
    }),

  ct({ id: 'number-sense-round', testIds: MATH, domain: 'number-sense', skillId: 'arithmetic-operations', difficulty: 1 },
    (ctx, t) => {
      const num = ctx.rng.int(101,9899), place = ctx.rng.pick(['nearest ten','nearest hundred']);
      let ans: number;
      if (place==='nearest ten') ans = Math.round(num/10)*10;
      else ans = Math.round(num/100)*100;
      const offset = place==='nearest ten' ? 10 : 100;
      const { options, correctOptionId } = makeOptions(String(ans), [String(ans+offset), String(ans-offset), String(Math.floor(num/offset)*offset)].map(String), ctx.rng);
      return baseQ(ctx, t, { prompt: `Round ${num.toLocaleString()} to the ${place}.`, options, correctOptionId, correctAnswerLabel: String(ans), explanationSteps: [`Look at the digit immediately to the right of the ${place}.`, `5 or greater → round up. Less than 5 → round down.`, `${num} rounded is ${ans}.`], commonTrap: 'Look at the digit ONE place to the right of where you\'re rounding.', mistakeTags: ['procedure-error'], ageMin: 7 });
    }),

  ct({ id: 'geometry-volume-box', testIds: [...MATH,...ALG,...STEM], domain: 'geometry', skillId: 'geometry', difficulty: 3 },
    (ctx, t) => {
      const l = ctx.rng.int(3,10), w = ctx.rng.int(2,8), h = ctx.rng.int(2,6), ans = l*w*h;
      const { options, correctOptionId } = makeOptions(`${ans} cubic units`, [`${2*(l*w+l*h+w*h)} cubic units`, `${l*w} cubic units`, `${l+w+h} cubic units`], ctx.rng, { [`${2*(l*w+l*h+w*h)} cubic units`]: 'That is the surface area formula, not volume.', [`${l*w} cubic units`]: 'That is only the area of the base — also multiply by height.' });
      return baseQ(ctx, t, { prompt: `A rectangular box is ${l} units long, ${w} units wide, and ${h} units tall. What is its volume?`, options, correctOptionId, correctAnswerLabel: `${ans} cubic units`, explanationSteps: [`Volume = length × width × height.`, `${l} × ${w} × ${h} = ${ans} cubic units.`], commonTrap: 'Volume is in cubic units. Surface area is in square units — two different concepts.', mistakeTags: ['concept-gap', 'procedure-error'], ageMin: 10 });
    }),

  ct({ id: 'data-probability', testIds: [...MATH_ALL,...STEM], domain: 'data-reasoning', skillId: 'data-statistics', difficulty: 3 },
    (ctx, t) => {
      const total = ctx.rng.pick([5,8,10,12]), target = ctx.rng.int(1,total-1);
      const fraction = `${target}/${total}`, colour = ctx.rng.pick(['red','blue','green','yellow']);
      const { options, correctOptionId } = makeOptions(fraction, [`${total-target}/${total}`, `${target}/${target}`, `1/${target}`], ctx.rng, { [`${total-target}/${total}`]: 'That is the probability of the event NOT happening.' });
      return baseQ(ctx, t, { prompt: `A bag has ${total} marbles total. ${target} of them are ${colour}.\n\nIf you reach in without looking, what is the probability of picking a ${colour} marble?`, options, correctOptionId, correctAnswerLabel: fraction, explanationSteps: ['Probability = (favourable outcomes) ÷ (total outcomes).', `Favourable: ${target}. Total: ${total}.`, `Probability = ${fraction}.`], commonTrap: 'Probability is always between 0 and 1. A common mistake is using the wrong total.', mistakeTags: ['concept-gap'], ageMin: 9 });
    }),

  ct({ id: 'algebra-two-step', testIds: ALG, domain: 'algebra-readiness', skillId: 'equations-one-step', difficulty: 4 },
    (ctx, t) => {
      const x = ctx.rng.int(2,12), m = ctx.rng.int(2,5), b = ctx.rng.int(1,10), total = m*x+b;
      const { options, correctOptionId } = makeOptions(String(x), [String(total-b), String((total+b)/m), String(x+b)], ctx.rng, { [String(total-b)]: `This subtracts b but forgets to divide by ${m}.` });
      return baseQ(ctx, t, { prompt: `Solve for x:\n${m}x + ${b} = ${total}`, options, correctOptionId, correctAnswerLabel: String(x), explanationSteps: [`Subtract ${b} from both sides: ${m}x = ${total-b}.`, `Divide both sides by ${m}: x = ${total-b} ÷ ${m} = ${x}.`], commonTrap: 'Two-step equations require TWO inverse operations — undo addition first, then multiplication.', mistakeTags: ['procedure-error', 'multi-step-reasoning'], ageMin: 11 });
    }),

  // ── 65-69. Reading expansion 2 ───────────────────────────────────────────
  ct({ id: 'reading-text-structure', testIds: READ, domain: 'reading-comprehension', skillId: 'reading-comprehension', difficulty: 3 },
    (ctx, t) => {
      const structures = [
        { example: 'First, water evaporates from the ocean. Then it forms clouds. Finally, it falls as rain.', answer: 'Sequence/chronological order', wrong: ['Compare and contrast', 'Cause and effect', 'Problem and solution'] },
        { example: 'Both cats and dogs make good pets. However, cats are more independent, while dogs require more daily attention.', answer: 'Compare and contrast', wrong: ['Sequence/chronological order', 'Problem and solution', 'Description'] },
        { example: 'Many schools struggle with student absenteeism. One approach that has helped is creating mentorship programmes.', answer: 'Problem and solution', wrong: ['Cause and effect', 'Compare and contrast', 'Sequence'] },
      ];
      const s = ctx.rng.pick(structures);
      const { options, correctOptionId } = makeOptions(s.answer, s.wrong, ctx.rng);
      return baseQ(ctx, t, { prompt: `Which text structure does this passage use?\n\n"${s.example}"`, helperText: 'Look at how the ideas are organised.', options, correctOptionId, correctAnswerLabel: s.answer, explanationSteps: ['Text structures: sequence, compare/contrast, cause/effect, problem/solution.', `This passage uses: ${s.answer}.`], commonTrap: 'Signal words help: "first/then/finally" = sequence; "however/both" = compare; "as a result" = cause/effect.', mistakeTags: ['reading-comprehension'], ageMin: 10 });
    }),

  ct({ id: 'reading-figurative-language', testIds: READ, domain: 'vocabulary', skillId: 'vocabulary', difficulty: 3 },
    (ctx, t) => {
      const examples = [
        { sentence: 'The classroom was a zoo after the teacher left.', answer: 'The classroom was chaotic and noisy.', type: 'metaphor', wrong: ['The students had actual animals.', 'The teacher went to a zoo.', 'The classroom was very quiet.'] },
        { sentence: 'Her smile was as bright as the sun.', answer: 'Her smile was very bright/joyful.', type: 'simile', wrong: ['The sun was smiling.', 'She smiled exactly once.', 'The sun was very hot.'] },
        { sentence: 'The wind whispered through the trees.', answer: 'The wind made soft, quiet sounds.', type: 'personification', wrong: ['A person was hiding in the trees.', 'The wind was very strong.', 'Someone was whispering.'] },
      ];
      const e = ctx.rng.pick(examples);
      const { options, correctOptionId } = makeOptions(e.answer, e.wrong, ctx.rng);
      return baseQ(ctx, t, { prompt: `"${e.sentence}"\n\nWhat does this sentence most likely mean?`, helperText: `This sentence uses a ${e.type}.`, options, correctOptionId, correctAnswerLabel: e.answer, explanationSteps: [`A ${e.type} does not mean exactly what it says literally.`, `In context: ${e.answer}`], commonTrap: 'Figurative language uses comparisons or exaggerations. Do not interpret it literally.', mistakeTags: ['vocabulary-confusion'], ageMin: 9 });
    }),

  ct({ id: 'reading-point-of-view', testIds: READ, domain: 'reading-comprehension', skillId: 'reading-comprehension', difficulty: 3 },
    (ctx, t) => {
      const passages = [
        { excerpt: '"I felt my heart race as I stepped onto the stage."', answer: 'First person', wrong: ['Second person', 'Third person limited', 'Third person omniscient'] },
        { excerpt: 'Maya walked slowly toward the door. She did not know what waited on the other side.', answer: 'Third person limited', wrong: ['First person', 'Second person', 'Third person omniscient'] },
        { excerpt: 'You should always check both ways before crossing the street.', answer: 'Second person', wrong: ['First person', 'Third person limited', 'Third person omniscient'] },
      ];
      const p = ctx.rng.pick(passages);
      const { options, correctOptionId } = makeOptions(p.answer, p.wrong, ctx.rng);
      return baseQ(ctx, t, { prompt: `Identify the point of view:\n\n"${p.excerpt}"`, options, correctOptionId, correctAnswerLabel: p.answer, explanationSteps: ['First person uses "I/me/we." Second uses "you." Third uses "he/she/they."', `This passage uses: ${p.answer}`], commonTrap: 'Third person limited knows ONE character\'s thoughts. Third person omniscient knows ALL.', mistakeTags: ['reading-comprehension'], ageMin: 10 });
    }),

  ct({ id: 'vocab-prefix-suffix', testIds: [...READ,...APT], domain: 'vocabulary', skillId: 'vocabulary', difficulty: 2 },
    (ctx, t) => {
      const morphemes = [
        { question: 'The prefix "un-" means:', answer: 'Not or the opposite of', wrong: ['Again', 'Before', 'Across'], example: 'unhappy, undo, unusual' },
        { question: 'The suffix "-ful" means:', answer: 'Full of or having', wrong: ['Without', 'Related to', 'One who'], example: 'careful, hopeful, joyful' },
        { question: 'The prefix "re-" means:', answer: 'Again or back', wrong: ['Not', 'Before', 'Together'], example: 'rewrite, redo, return' },
        { question: 'The suffix "-less" means:', answer: 'Without', wrong: ['Full of', 'More than', 'One who'], example: 'careless, hopeless, homeless' },
        { question: 'The prefix "pre-" means:', answer: 'Before', wrong: ['After', 'Again', 'Not'], example: 'preview, predict, prepare' },
      ];
      const m = ctx.rng.pick(morphemes);
      const { options, correctOptionId } = makeOptions(m.answer, m.wrong, ctx.rng);
      return baseQ(ctx, t, { prompt: m.question, helperText: `Example words: ${m.example}`, options, correctOptionId, correctAnswerLabel: m.answer, explanationSteps: [`${m.question.replace(':','')} "${m.answer}."`, `Examples: ${m.example}`], commonTrap: 'Knowing prefixes and suffixes helps you decode unfamiliar words.', mistakeTags: ['vocabulary-confusion'], ageMin: 8 });
    }),

  ct({ id: 'reading-summary', testIds: READ, domain: 'reading-comprehension', skillId: 'reading-comprehension', difficulty: 3 },
    (ctx, t) => {
      const passages = [
        { text: 'In 1969, Neil Armstrong and Buzz Aldrin became the first humans to walk on the moon. Armstrong\'s words were broadcast to millions watching on television worldwide.', best: 'The 1969 moon landing was a historic milestone watched by millions.', wrong: ['Neil Armstrong said an important quote.', 'Television was invented in 1969.', 'The moon is very far from Earth.'] },
        { text: 'Monarch butterflies migrate up to 3,000 miles each autumn from Canada and the United States to Mexico. Scientists are still studying exactly how the butterflies navigate such long distances.', best: 'Monarch butterflies make an extraordinary long-distance migration that scientists are still working to understand.', wrong: ['Butterflies live in Mexico all year.', 'Scientists do not care about butterflies.', 'Monarch butterflies are the fastest insects.'] },
      ];
      const p = ctx.rng.pick(passages);
      const { options, correctOptionId } = makeOptions(p.best, p.wrong, ctx.rng);
      return baseQ(ctx, t, { prompt: `"${p.text}"\n\nWhich sentence BEST summarises the passage?`, options, correctOptionId, correctAnswerLabel: p.best, explanationSteps: ['A good summary captures the main idea without focusing only on one detail.', `Best summary: "${p.best}"`], commonTrap: 'A summary covers the WHOLE passage, not just an interesting detail.', mistakeTags: ['reading-comprehension'], ageMin: 9 });
    }),

  // ── 70-74. STEM expansion 2 ──────────────────────────────────────────────
  ct({ id: 'stem-elapsed-time', testIds: [...STEM,...MATH], domain: 'fluid-reasoning', skillId: 'arithmetic-operations', difficulty: 2 },
    (ctx, t) => {
      const sh = ctx.rng.int(8,14), sm = ctx.rng.pick([0,15,30,45]), dh = ctx.rng.int(1,4), dm = ctx.rng.pick([0,15,30]);
      let eh = sh+dh, em = sm+dm;
      if (em >= 60) { eh++; em -= 60; }
      const fmt = (h: number, m: number) => `${h}:${m.toString().padStart(2,'0')}`, ans = fmt(eh, em);
      const { options, correctOptionId } = makeOptions(ans, [fmt(eh+1,em), fmt(eh-1,em), fmt(sh+dh+1,sm)], ctx.rng);
      return baseQ(ctx, t, { prompt: `An experiment starts at ${fmt(sh,sm)} and takes ${dh} hour${dh>1?'s':''}${dm>0?` and ${dm} minutes`:'''}. What time does it end?`, options, correctOptionId, correctAnswerLabel: ans, explanationSteps: [`Add hours: ${sh} + ${dh} = ${sh+dh}.`, dm>0?`Add minutes: ${sm} + ${dm} = ${sm+dm} (carry if ≥60).`:'No extra minutes.', `End time: ${ans}.`], commonTrap: 'Carry over to hours when minutes reach 60 or more.', mistakeTags: ['calculation-error'], ageMin: 8 });
    }),

  ct({ id: 'stem-force-motion', testIds: [...STEM,...MIL], domain: 'science-reasoning', skillId: 'science-reasoning', difficulty: 3 },
    (ctx, t) => {
      const questions = [
        { q: 'A ball is rolling on a flat surface. It gradually slows down. What force is causing this?', answer: 'Friction', wrong: ['Gravity', 'Magnetism', 'Air pressure'] },
        { q: 'Two equally matched tug-of-war teams pull in opposite directions. The rope does not move. What is the net force?', answer: 'Zero', wrong: ['Strong to the left', 'Strong to the right', 'Doubled'] },
        { q: 'A skateboarder goes down a ramp and speeds up. Which energy conversion is occurring?', answer: 'Potential energy to kinetic energy', wrong: ['Kinetic to potential', 'Chemical to electrical', 'Thermal to kinetic'] },
        { q: 'What happens to an object\'s weight when it is moved to the moon (weaker gravity)?', answer: 'Its weight decreases but its mass stays the same', wrong: ['Both weight and mass decrease', 'Both weight and mass increase', 'Weight increases, mass decreases'] },
      ];
      const q = ctx.rng.pick(questions);
      const { options, correctOptionId } = makeOptions(q.answer, q.wrong, ctx.rng);
      return baseQ(ctx, t, { prompt: q.q, options, correctOptionId, correctAnswerLabel: q.answer, explanationSteps: [`The answer is: ${q.answer}`], commonTrap: 'Mass (amount of matter) stays constant everywhere. Weight (force of gravity) changes with gravity.', mistakeTags: ['science-reasoning'], ageMin: 10 });
    }),

  ct({ id: 'stem-data-read', testIds: STEM, domain: 'science-reasoning', skillId: 'data-statistics', difficulty: 2 },
    (ctx, t) => {
      const months = ['Jan','Feb','Mar','Apr'], sales = months.map(() => ctx.rng.int(10,90)*10);
      const maxVal = Math.max(...sales), maxMonth = months[sales.indexOf(maxVal)];
      const { options, correctOptionId } = makeOptions(maxMonth, months.filter(m=>m!==maxMonth), ctx.rng);
      return baseQ(ctx, t, { prompt: `A store's monthly sales (in dollars):\n${months.map((m,i)=>`${m}: $${sales[i].toLocaleString()}`).join(' | ')}\n\nWhich month had the highest sales?`, options, correctOptionId, correctAnswerLabel: maxMonth, explanationSteps: [`Compare all values: ${months.map((m,i)=>`${m}=$${sales[i]}`).join(', ')}.`, `The highest is $${maxVal.toLocaleString()} in ${maxMonth}.`], commonTrap: 'Read all values before concluding.', mistakeTags: ['attention-to-detail'], ageMin: 8 });
    }),

  ct({ id: 'stem-system-diagram', testIds: STEM, domain: 'visual-spatial', skillId: 'spatial-reasoning', difficulty: 3 },
    (ctx, t) => {
      const scenarios = [
        { q: 'Three gears in a row: A drives B, and B drives C. Gear A turns clockwise. Which direction does Gear C turn?', answer: 'Clockwise', wrong: ['Counter-clockwise', 'It does not move', 'It depends on speed'] },
        { q: 'Water flows from a tall tank (high) through a pipe to a low tank. If you raise the tall tank higher, what happens to the flow speed?', answer: 'It increases', wrong: ['It decreases', 'It stays the same', 'The water flows backwards'] },
        { q: 'A pulley system has 2 pulleys. Pulling the rope 10 cm lifts the load how far?', answer: '5 cm', wrong: ['10 cm', '20 cm', '2.5 cm'] },
      ];
      const s = ctx.rng.pick(scenarios);
      const { options, correctOptionId } = makeOptions(s.answer, s.wrong, ctx.rng);
      return baseQ(ctx, t, { prompt: s.q, options, correctOptionId, correctAnswerLabel: s.answer, explanationSteps: [s.answer], commonTrap: 'System diagrams require tracing the effect through each component in sequence.', mistakeTags: ['science-reasoning', 'spatial-reasoning'], ageMin: 11 });
    }),

  ct({ id: 'stem-classify-life-science', testIds: STEM, domain: 'science-reasoning', skillId: 'science-reasoning', difficulty: 2 },
    (ctx, t) => {
      const questions = [
        { q: 'Which of these organisms is a producer in a food chain?', answer: 'Grass', wrong: ['Rabbit', 'Fox', 'Worm'] },
        { q: 'Which of the following is an invertebrate?', answer: 'Jellyfish', wrong: ['Frog', 'Salmon', 'Lizard'] },
        { q: 'Which kingdom do mushrooms belong to?', answer: 'Fungi', wrong: ['Plant', 'Animal', 'Bacteria'] },
        { q: 'Which process do plants use to make their own food?', answer: 'Photosynthesis', wrong: ['Respiration', 'Digestion', 'Fermentation'] },
      ];
      const q = ctx.rng.pick(questions);
      const { options, correctOptionId } = makeOptions(q.answer, q.wrong, ctx.rng);
      return baseQ(ctx, t, { prompt: q.q, options, correctOptionId, correctAnswerLabel: q.answer, explanationSteps: [`${q.answer}`], commonTrap: 'Producers make their own energy from sunlight; consumers eat other organisms.', mistakeTags: ['science-reasoning'], ageMin: 9 });
    }),

  // ── 75-78. Coding expansion 2 ────────────────────────────────────────────
  ct({ id: 'coding-variable-update', testIds: CODE, domain: 'coding-logic', skillId: 'coding-logic', difficulty: 2 },
    (ctx, t) => {
      const a = ctx.rng.int(2,10), b = ctx.rng.int(1,8), op = ctx.rng.pick(['+','-','*']);
      const result = op==='+' ? a+b : op==='-' ? a-b : a*b;
      const { options, correctOptionId } = makeOptions(String(result), [String(a), String(b), String(result+b)], ctx.rng, { [String(a)]: 'This is the original value of x before the update.' });
      return baseQ(ctx, t, { prompt: `What is the value of x after these instructions?\n\nx = ${a}\nx = x ${op} ${b}`, options, correctOptionId, correctAnswerLabel: String(result), explanationSteps: [`x starts as ${a}.`, `x = x ${op} ${b} means: x = ${a} ${op} ${b} = ${result}.`, `Final value of x: ${result}.`], commonTrap: 'In programming, "x = x + 1" means take the current value of x and add 1.', mistakeTags: ['concept-gap'], ageMin: 9 });
    }),

  ct({ id: 'coding-nested-if', testIds: CODE, domain: 'coding-logic', skillId: 'coding-logic', difficulty: 3 },
    (ctx, t) => {
      const age = ctx.rng.int(5,20), hasTicket = ctx.rng.pick([true,false]);
      const output = age >= 13 ? (hasTicket ? '"Enter"' : '"Buy a ticket"') : '"Too young"';
      const ticketStr = hasTicket ? 'True' : 'False';
      const { options, correctOptionId } = makeOptions(output, ['"Enter"','"Buy a ticket"','"Too young"'].filter(o=>o!==output), ctx.rng);
      return baseQ(ctx, t, { prompt: `What does this program print?\n\nage = ${age}\nhas_ticket = ${ticketStr}\n\nif age >= 13:\n    if has_ticket:\n        print "Enter"\n    else:\n        print "Buy a ticket"\nelse:\n    print "Too young"`, options, correctOptionId, correctAnswerLabel: output, explanationSteps: [`First check: is ${age} >= 13? ${age>=13?'Yes.':'No → print "Too young".'}`, age>=13?`Second check: has_ticket is ${ticketStr} → print ${output}.`:'No further checks needed.'], commonTrap: 'The outer condition must be true before the inner one is even checked.', mistakeTags: ['multi-step-reasoning', 'attention-to-detail'], ageMin: 10 });
    }),

  ct({ id: 'coding-list-index', testIds: CODE, domain: 'coding-logic', skillId: 'coding-logic', difficulty: 2 },
    (ctx, t) => {
      const items = ctx.rng.pick([['apple','banana','cherry','date'],['dog','cat','bird','fish'],['red','green','blue','yellow']]);
      const idx = ctx.rng.int(0,3), ans = `"${items[idx]}"`;
      const wrong = items.filter((_,i)=>i!==idx).map(x=>`"${x}"`);
      const { options, correctOptionId } = makeOptions(ans, wrong, ctx.rng, { [`"${items[Math.min(idx+1,3)]}"`]: 'Lists in most languages start at index 0, not 1.' });
      return baseQ(ctx, t, { prompt: `A list is defined as:\nlist = ["${items.join('", "')}"]\n\nWhat is list[${idx}]?`, helperText: 'In programming, list positions start at 0.', options, correctOptionId, correctAnswerLabel: ans, explanationSteps: ['Lists are "zero-indexed" — the first item is at position 0.', `list[0]="${items[0]}", list[1]="${items[1]}", list[2]="${items[2]}", list[3]="${items[3]}".`, `list[${idx}] = ${ans}.`], commonTrap: 'In most coding languages, the first element is index 0, not index 1.', mistakeTags: ['concept-gap'], ageMin: 10 });
    }),

  ct({ id: 'coding-function-output', testIds: CODE, domain: 'coding-logic', skillId: 'coding-logic', difficulty: 3 },
    (ctx, t) => {
      const m = ctx.rng.int(2,6), b = ctx.rng.int(1,10), x = ctx.rng.int(1,8), result = m*x+b;
      const { options, correctOptionId } = makeOptions(String(result), [String(m*x), String(m+x+b), String(result+m)], ctx.rng, { [String(m*x)]: 'This forgets to add b at the end.' });
      return baseQ(ctx, t, { prompt: `What does this function return when called with f(${x})?\n\nfunction f(x):\n    return ${m} * x + ${b}`, options, correctOptionId, correctAnswerLabel: String(result), explanationSteps: [`Substitute x = ${x}.`, `${m} × ${x} + ${b} = ${m*x} + ${b} = ${result}.`], commonTrap: 'Substitute the input value for x everywhere x appears, then evaluate the full expression.', mistakeTags: ['procedure-error'], ageMin: 11 });
    }),

  // ── 79-82. Military expansion 2 ──────────────────────────────────────────
  ct({ id: 'military-time-distance', testIds: MIL, domain: 'quantitative', skillId: 'arithmetic-operations', difficulty: 3 },
    (ctx, t) => {
      const d = ctx.rng.pick([120,150,180,240]), r = ctx.rng.pick([30,40,60]), ans = d/r;
      const { options, correctOptionId } = makeOptions(`${ans} hours`, [`${d+r} hours`, `${d*r} hours`, `${d/(r*2)} hours`], ctx.rng, { [`${d*r} hours`]: 'Time = Distance ÷ Rate. Multiplying gives the wrong answer.' });
      return baseQ(ctx, t, { prompt: `A convoy must travel ${d} miles at an average speed of ${r} mph. How long will the trip take?`, options, correctOptionId, correctAnswerLabel: `${ans} hours`, explanationSteps: ['Time = Distance ÷ Rate.', `${d} ÷ ${r} = ${ans} hours.`], commonTrap: 'Time = Distance ÷ Rate. Distance = Rate × Time.', mistakeTags: ['procedure-error'], ageMin: 14 });
    }),

  ct({ id: 'military-word-knowledge', testIds: MIL, domain: 'verbal', skillId: 'vocabulary', difficulty: 3 },
    (ctx, t) => {
      const words = [
        { word: 'Adversary', answer: 'Opponent or enemy', wrong: ['Advisor', 'Supporter', 'Partner'] },
        { word: 'Fortify', answer: 'Strengthen or reinforce', wrong: ['Weaken', 'Abandon', 'Conceal'] },
        { word: 'Reconnaissance', answer: 'Gathering information about enemy territory', wrong: ['Retreat', 'Repair equipment', 'Train soldiers'] },
        { word: 'Tactical', answer: 'Relating to specific planned actions or strategy', wrong: ['Accidental', 'Historical', 'Physical'] },
        { word: 'Deploy', answer: 'Send into position or active service', wrong: ['Retire', 'Train', 'Build'] },
        { word: 'Logistics', answer: 'Organising and moving supplies and equipment', wrong: ['Combat operations', 'Medical care', 'Intelligence gathering'] },
      ];
      const w = ctx.rng.pick(words);
      const { options, correctOptionId } = makeOptions(w.answer, w.wrong, ctx.rng);
      return baseQ(ctx, t, { prompt: `"${w.word}" most nearly means:`, options, correctOptionId, correctAnswerLabel: w.answer, explanationSteps: [`"${w.word}" means: ${w.answer}.`], commonTrap: 'Military vocabulary often uses formal English words. Break them into recognisable roots.', mistakeTags: ['vocabulary-confusion'], ageMin: 14 });
    }),

  ct({ id: 'military-electrical-basic', testIds: MIL, domain: 'mechanical-reasoning', skillId: 'mechanical-reasoning', difficulty: 3 },
    (ctx, t) => {
      const questions = [
        { q: 'In a simple circuit, what happens if you add a second battery in series?', answer: 'The voltage doubles and the current increases', wrong: ['The voltage stays the same', 'The circuit breaks', 'The voltage halves'] },
        { q: 'What unit is used to measure electrical resistance?', answer: 'Ohm (Ω)', wrong: ['Volt (V)', 'Ampere (A)', 'Watt (W)'] },
        { q: 'Ohm\'s Law: V = I × R. If resistance doubles and voltage stays the same, what happens to current?', answer: 'Current halves', wrong: ['Current doubles', 'Current stays the same', 'Current goes to zero'] },
        { q: 'Which material is the best insulator?', answer: 'Rubber', wrong: ['Copper', 'Aluminium', 'Steel'] },
      ];
      const q = ctx.rng.pick(questions);
      const { options, correctOptionId } = makeOptions(q.answer, q.wrong, ctx.rng);
      return baseQ(ctx, t, { prompt: q.q, options, correctOptionId, correctAnswerLabel: q.answer, explanationSteps: [q.answer], commonTrap: 'Ohm\'s Law: V = I × R. Rearranging: I = V/R. If R doubles, I is halved (V constant).', mistakeTags: ['science-reasoning'], ageMin: 14 });
    }),

  ct({ id: 'military-map-grid', testIds: MIL, domain: 'visual-spatial', skillId: 'spatial-reasoning', difficulty: 3 },
    (ctx, t) => {
      const questions = [
        { q: 'On a map, 1 inch = 50 miles. Two cities are 3.5 inches apart. How far apart are they in miles?', answer: '175 miles', wrong: ['53.5 miles', '150 miles', '200 miles'] },
        { q: 'You are at grid reference (3, 5). You move 2 squares east and 1 square south. What is your new grid reference?', answer: '(5, 4)', wrong: ['(5, 6)', '(1, 4)', '(3, 6)'] },
      ];
      const q = ctx.rng.pick(questions);
      const { options, correctOptionId } = makeOptions(q.answer, q.wrong, ctx.rng);
      return baseQ(ctx, t, { prompt: q.q, options, correctOptionId, correctAnswerLabel: q.answer, explanationSteps: ['Map scale: actual distance = map distance × scale factor.', `Answer: ${q.answer}`], commonTrap: 'Keep track of units: convert carefully between measurement units.', mistakeTags: ['multi-step-reasoning'], ageMin: 14 });
    }),

  // ── 83-86. Kindergarten expansion 2 ─────────────────────────────────────
  ct({ id: 'kg-compare-numbers', testIds: KG, domain: 'number-sense', skillId: 'arithmetic-operations', difficulty: 1 },
    (ctx, t) => {
      const a = ctx.rng.int(1,9); let b = ctx.rng.int(1,9); while (b===a) b = (b%9)+1;
      const bigger = Math.max(a,b);
      const { options, correctOptionId } = makeOptions(String(bigger), [String(Math.min(a,b)), String(bigger+1), String(bigger-1)], ctx.rng);
      return baseQ(ctx, t, { prompt: `Which number is bigger: ${a} or ${b}?`, helperText: 'You can count on your fingers to compare.', options, correctOptionId, correctAnswerLabel: String(bigger), explanationSteps: [`Count to ${a} and to ${b}.`, `${bigger} is more than ${Math.min(a,b)}.`], commonTrap: 'The number you say LATER when counting is bigger.', mistakeTags: ['concept-gap'], ageMin: 4, ageMax: 7 });
    }),

  ct({ id: 'kg-simple-add', testIds: KG, domain: 'number-sense', skillId: 'arithmetic-operations', difficulty: 1 },
    (ctx, t) => {
      const a = ctx.rng.int(1,5), b = ctx.rng.int(1,5), ans = a+b;
      const { options, correctOptionId } = makeOptions(String(ans), [String(ans+1), String(ans-1), String(Math.abs(a-b))], ctx.rng);
      return baseQ(ctx, t, { prompt: `There are ${a} cats in a yard. Then ${b} more cats arrive. How many cats are there in total?`, helperText: 'Count all the cats together.', options, correctOptionId, correctAnswerLabel: String(ans), explanationSteps: [`Start with ${a} cats.`, `Add ${b} more: ${a} + ${b} = ${ans}.`], commonTrap: 'Adding means putting groups together to find the total.', mistakeTags: ['calculation-error'], ageMin: 4, ageMax: 7 });
    }),

  ct({ id: 'kg-color-sort', testIds: KG, domain: 'school-readiness', skillId: 'spatial-reasoning', difficulty: 1 },
    (ctx, t) => {
      const colors = ['red','blue','green','yellow','orange'], target = ctx.rng.pick(colors);
      const count = ctx.rng.int(2,5), others = ctx.rng.int(1,4);
      const { options, correctOptionId } = makeOptions(String(count), [String(count+others), String(others), String(count-1)], ctx.rng, { [String(count+others)]: `That counts ALL objects, not just the ${target} ones.` });
      return baseQ(ctx, t, { prompt: `There are ${count} ${target} circles and ${others} blue circles.\n\nHow many ${target} circles are there?`, options, correctOptionId, correctAnswerLabel: String(count), explanationSteps: [`Only count the ${target} circles.`, `There are ${count} ${target} circles.`], commonTrap: `Read carefully — only count the objects of the named colour.`, mistakeTags: ['attention-to-detail'], ageMin: 4, ageMax: 7 });
    }),

  ct({ id: 'kg-vocabulary-body', testIds: KG, domain: 'vocabulary', skillId: 'vocabulary', difficulty: 1 },
    (ctx, t) => {
      const items = [
        { q: 'Which part of your body do you use to smell things?', answer: 'Nose', wrong: ['Ears', 'Fingers', 'Eyes'] },
        { q: 'Which part of your body do you use to hear sounds?', answer: 'Ears', wrong: ['Eyes', 'Nose', 'Mouth'] },
        { q: 'Which part of your body helps you walk and run?', answer: 'Legs', wrong: ['Arms', 'Head', 'Belly'] },
        { q: 'What do you use to pick up and hold things?', answer: 'Hands', wrong: ['Feet', 'Ears', 'Eyes'] },
      ];
      const item = ctx.rng.pick(items);
      const { options, correctOptionId } = makeOptions(item.answer, item.wrong, ctx.rng);
      return baseQ(ctx, t, { prompt: item.q, options, correctOptionId, correctAnswerLabel: item.answer, explanationSteps: [`We use our ${item.answer.toLowerCase()} for that.`], commonTrap: 'Think about which body part does that specific job.', mistakeTags: ['vocabulary-confusion'], ageMin: 4, ageMax: 7 });
    }),

]; // end questionTemplates array

// ════════════════════════════════════════════════════════════════════════════
// SECTION 4 — v0.6 EXPANSION
//
// Goals for v0.6:
//   - Triple effective question variety. Each new template uses the phrase()
//     helper for 2–3 deterministic surface phrasings.
//   - Focus on weak areas surfaced by the v0.5 content review:
//     real reading-comprehension passages, multi-step word problems, spatial
//     items with visuals, science with experimental design, coding logic
//     including negative indexing, mechanical reasoning, working memory,
//     algebra, and K readiness with visuals.
// ════════════════════════════════════════════════════════════════════════════

// Pick one of N phrasings deterministically using the seeded RNG. Same seed
// always produces the same wording, so retake stays reproducible.
function phrase(rng: SeededRandom, options: string[]): string {
  if (options.length === 0) return '';
  return options[rng.int(0, options.length - 1)];
}

const v6Templates: QuestionTemplate[] = [

  // ── Reading comprehension: real passages (3 templates) ──────────────────

  ct({ id: 'rc-passage-main-idea-v6', testIds: [...READ, ...APT], domain: 'reading-comprehension', skillId: 'reading-comprehension', difficulty: 3 },
    (ctx, t) => {
      const passages = [
        { passage: 'Honeybees are some of the most important animals on the planet. They visit flowers to collect nectar, which they turn into honey. As they move from flower to flower, pollen sticks to their bodies. When the bees brush against the next flower, the pollen is transferred. This process, called pollination, helps plants make seeds and fruit. Without honeybees, many fruits and vegetables we eat every day would be much harder to grow.',
          mainIdea: 'Honeybees help plants reproduce by pollinating them.',
          wrong: ['Honeybees only make honey for humans to eat.', 'Honeybees are dangerous insects.', 'Bees prefer some flowers over others.'] },
        { passage: 'Giant sequoia trees are among the largest living things on Earth. They grow only in a small region of California, where the cool, moist air and deep soil help them thrive. Some sequoias have lived for over two thousand years. Their thick bark protects them from forest fires, and their seeds actually need fire to open and grow. This means that what looks destructive can sometimes be what gives life.',
          mainIdea: 'Giant sequoias depend on fire as part of their natural life cycle.',
          wrong: ['Sequoias grow all over North America.', 'Sequoia trees are protected by zoo keepers.', 'Sequoias produce most of California\'s lumber.'] },
        { passage: 'In December 1903, two brothers named Wilbur and Orville Wright made history. They flew the first powered airplane near Kitty Hawk, North Carolina. The flight lasted only twelve seconds and went about a hundred and twenty feet. It does not sound like much today, but at the time it was a huge breakthrough. Their invention launched a century of aviation that would change how people travel, work, and connect with each other.',
          mainIdea: 'A short flight by the Wright brothers led to an entire age of aviation.',
          wrong: ['The Wright brothers built the first hot-air balloon.', 'The first flight lasted several hours.', 'Wilbur and Orville competed against each other.'] },
      ];
      const item = ctx.rng.pick(passages);
      const lead = phrase(ctx.rng, [
        'What is the main idea of the passage?',
        'Which sentence best states the main idea?',
        'The passage is mostly about —',
      ]);
      const { options, correctOptionId } = makeOptions(item.mainIdea, item.wrong, ctx.rng);
      return baseQ(ctx, t, {
        prompt: `${item.passage}\n\n${lead}`,
        helperText: 'Read the whole passage carefully before choosing.',
        options, correctOptionId, correctAnswerLabel: item.mainIdea,
        explanationSteps: [
          'The main idea is the single biggest point the passage makes — not just one detail.',
          `In this passage, every sentence supports one larger idea.`,
          `The best summary is: "${item.mainIdea}"`,
        ],
        commonTrap: 'A true detail from the passage is not necessarily the main idea.',
        mistakeTags: ['concept-gap', 'misread-question'], ageMin: 9, ageMax: 16,
      });
    }),

  ct({ id: 'rc-passage-inference-v6', testIds: [...READ, ...APT], domain: 'reading-comprehension', skillId: 'reading-comprehension', difficulty: 4 },
    (ctx, t) => {
      const items = [
        { passage: 'Maya checked the recipe one more time. She had everything except the eggs. The grocery store closed in twenty minutes, and the rain was coming down hard. She looked out the window, then back at the half-mixed bowl of dry ingredients on the counter. With a sigh, she grabbed her raincoat and her keys.',
          inference: 'Maya decided to go to the store despite the rain.',
          wrong: ['Maya gave up on baking.', 'The grocery store had closed early.', 'Maya already had the eggs.'] },
        { passage: 'When Sam saw the dog\'s tail droop and its ears flatten, he knew something was wrong. He kneeled down slowly and held out his hand, palm up. The dog sniffed once, then took a careful step closer. Sam smiled and waited.',
          inference: 'Sam was being patient to help the dog feel safe.',
          wrong: ['Sam was scared of the dog.', 'The dog ran away.', 'Sam wanted to give the dog food right away.'] },
      ];
      const item = ctx.rng.pick(items);
      const lead = phrase(ctx.rng, [
        'Which statement is best supported by the passage?',
        'What can the reader most likely conclude?',
        'Which is most likely true based on the passage?',
      ]);
      const { options, correctOptionId } = makeOptions(item.inference, item.wrong, ctx.rng);
      return baseQ(ctx, t, {
        prompt: `${item.passage}\n\n${lead}`,
        options, correctOptionId, correctAnswerLabel: item.inference,
        explanationSteps: [
          'An inference is a conclusion supported by clues in the text — not directly stated.',
          'Look for clues in the actions and details.',
          `The clues add up to: "${item.inference}"`,
        ],
        commonTrap: 'Inferences must be supported by the passage. Avoid choices that contradict it.',
        mistakeTags: ['multi-step-reasoning', 'concept-gap'], ageMin: 10, ageMax: 16,
      });
    }),

  ct({ id: 'rc-passage-detail-v6', testIds: [...READ], domain: 'reading-comprehension', skillId: 'reading-comprehension', difficulty: 2 },
    (ctx, t) => {
      const items = [
        { passage: 'The Pacific octopus is a master of disguise. It can change both the color and the texture of its skin in less than a second. Special cells called chromatophores let it match the rocks and seaweed around it. This camouflage helps it hide from predators like sharks and seals.',
          q: 'According to the passage, what helps the Pacific octopus change its appearance?',
          answer: 'Special cells called chromatophores',
          wrong: ['Its eight arms', 'A sticky ink', 'Cold ocean water'] },
        { passage: 'Mount Everest stands at the border of Nepal and China. At about 8,849 meters tall, it is the highest point above sea level on Earth. Climbing it is dangerous because of the thin air and freezing temperatures, and very few people reach the summit each year.',
          q: 'About how tall is Mount Everest?',
          answer: '8,849 meters',
          wrong: ['Exactly 5,000 meters', 'Around 12,000 meters', 'Less than 2,000 meters'] },
      ];
      const item = ctx.rng.pick(items);
      const { options, correctOptionId } = makeOptions(item.answer, item.wrong, ctx.rng);
      return baseQ(ctx, t, {
        prompt: `${item.passage}\n\n${item.q}`,
        options, correctOptionId, correctAnswerLabel: item.answer,
        explanationSteps: [
          'Detail questions ask about something stated directly.',
          'Re-read the relevant sentence in the passage.',
          `The passage states: "${item.answer}".`,
        ],
        mistakeTags: ['attention-to-detail', 'misread-question'], ageMin: 8, ageMax: 14,
      });
    }),

  // ── Vocabulary in context ──────────────────────────────────────────────

  ct({ id: 'vocab-in-context-v6', testIds: [...READ, ...APT], domain: 'vocabulary', skillId: 'vocabulary', difficulty: 3 },
    (ctx, t) => {
      const items = [
        { sentence: 'The detective remained vigilant throughout the long night.', word: 'vigilant', meaning: 'watchful', wrong: ['sleepy', 'angry', 'cheerful'] },
        { sentence: 'Her response was concise — only two short sentences.', word: 'concise', meaning: 'brief', wrong: ['confusing', 'rude', 'detailed'] },
        { sentence: 'The crowd grew restless as the band took longer than expected to start.', word: 'restless', meaning: 'unable to stay still', wrong: ['quiet', 'asleep', 'patient'] },
        { sentence: 'The professor\'s ambiguous answer left everyone confused.', word: 'ambiguous', meaning: 'unclear', wrong: ['loud', 'simple', 'kind'] },
      ];
      const item = ctx.rng.pick(items);
      const lead = phrase(ctx.rng, [
        `In the sentence above, what does "${item.word}" mean?`,
        `Which word is closest in meaning to "${item.word}" as it is used here?`,
      ]);
      const { options, correctOptionId } = makeOptions(item.meaning, item.wrong, ctx.rng);
      return baseQ(ctx, t, {
        prompt: `${item.sentence}\n\n${lead}`,
        options, correctOptionId, correctAnswerLabel: item.meaning,
        explanationSteps: [
          'Use the rest of the sentence as context.',
          `Here, "${item.word}" makes sense as "${item.meaning}".`,
        ],
        commonTrap: 'A word can mean different things in different sentences. Use the surrounding context.',
        mistakeTags: ['vocabulary-confusion'], ageMin: 9, ageMax: 16,
      });
    }),

  // ── Multi-step word problems (5 templates) ─────────────────────────────

  ct({ id: 'word-two-step-arith-v6', testIds: [...MATH_ALL, ...APT], domain: 'quantitative', skillId: 'arithmetic-operations', difficulty: 3 },
    (ctx, t) => {
      const start = ctx.rng.int(20, 60);
      const give = ctx.rng.int(3, 9);
      const groups = ctx.rng.int(2, 4);
      const remaining = start - give * groups;
      const lead = phrase(ctx.rng, [
        `A class has ${start} pencils. The teacher gives ${give} pencils to each of ${groups} students. How many pencils are left?`,
        `Sara had ${start} stickers. She gave ${give} stickers each to ${groups} friends. How many stickers does she have now?`,
      ]);
      const { options, correctOptionId } = makeOptions(String(remaining), [
        String(start - give), String(start + give), String(give * groups)
      ], ctx.rng, {
        [String(give * groups)]: 'That counts only the pencils given away, not the ones left.',
        [String(start - give)]: 'That subtracts the gift to one student, not all students.',
      });
      return baseQ(ctx, t, {
        prompt: lead,
        options, correctOptionId, correctAnswerLabel: String(remaining),
        explanationSteps: [
          `Step 1: total given away = ${give} × ${groups} = ${give * groups}.`,
          `Step 2: pencils left = ${start} − ${give * groups} = ${remaining}.`,
        ],
        commonTrap: 'Two-step word problems need two operations in order. Don\'t stop after one.',
        mistakeTags: ['multi-step-reasoning', 'calculation-error'], ageMin: 9, ageMax: 14,
      });
    }),

  ct({ id: 'word-rate-distance-v6', testIds: [...MATH_ALL], domain: 'quantitative', skillId: 'arithmetic-operations', difficulty: 4 },
    (ctx, t) => {
      const speed = ctx.rng.pick([15, 20, 25, 30]);
      const hours = ctx.rng.int(2, 5);
      const distance = speed * hours;
      const lead = phrase(ctx.rng, [
        `A bicycle travels at ${speed} km per hour. How far will it go in ${hours} hours?`,
        `If you ride at a steady ${speed} km/h for ${hours} hours, how many kilometres do you cover?`,
      ]);
      const { options, correctOptionId } = makeOptions(`${distance} km`, [
        `${speed + hours} km`, `${distance + speed} km`, `${distance - speed} km`
      ], ctx.rng);
      return baseQ(ctx, t, {
        prompt: lead,
        options, correctOptionId, correctAnswerLabel: `${distance} km`,
        explanationSteps: [
          'Distance = speed × time.',
          `${speed} × ${hours} = ${distance} km.`,
        ],
        mistakeTags: ['multi-step-reasoning', 'concept-gap'], ageMin: 10, ageMax: 16,
      });
    }),

  ct({ id: 'word-percent-of-v6', testIds: [...MATH_ALL], domain: 'quantitative', skillId: 'fractions-ratios', difficulty: 3 },
    (ctx, t) => {
      const pcts = [10, 15, 20, 25, 50];
      const pct = ctx.rng.pick(pcts);
      const base = ctx.rng.pick([40, 60, 80, 100, 120]);
      const ans = (pct * base) / 100;
      const lead = phrase(ctx.rng, [
        `What is ${pct}% of ${base}?`,
        `A jacket costs $${base}. It is ${pct}% off. How much is the discount?`,
      ]);
      const { options, correctOptionId } = makeOptions(String(ans), [
        String(ans * 2), String(ans / 2), String(base - ans)
      ], ctx.rng);
      return baseQ(ctx, t, {
        prompt: lead,
        options, correctOptionId, correctAnswerLabel: String(ans),
        explanationSteps: [
          `${pct}% means ${pct}/100 = ${pct/100}.`,
          `${pct/100} × ${base} = ${ans}.`,
        ],
        commonTrap: 'A discount question asks for the discount itself, not the final price.',
        mistakeTags: ['concept-gap', 'calculation-error'], ageMin: 10, ageMax: 16,
      });
    }),

  ct({ id: 'word-money-change-v6', testIds: [...MATH_ALL], domain: 'quantitative', skillId: 'arithmetic-operations', difficulty: 2 },
    (ctx, t) => {
      const item1 = ctx.rng.int(2, 6);
      const item2 = ctx.rng.int(3, 7);
      const paid = 20;
      const change = paid - (item1 + item2);
      const lead = phrase(ctx.rng, [
        `Jamal bought a book for $${item1} and a snack for $${item2}. He paid with a $${paid} bill. How much change should he get back?`,
        `Two items cost $${item1} and $${item2}. If you hand the cashier $${paid}, what is your change?`,
      ]);
      const { options, correctOptionId } = makeOptions(`$${change}`, [
        `$${item1 + item2}`, `$${paid - item1}`, `$${paid - item2}`
      ], ctx.rng);
      return baseQ(ctx, t, {
        prompt: lead,
        options, correctOptionId, correctAnswerLabel: `$${change}`,
        explanationSteps: [
          `Total cost = $${item1} + $${item2} = $${item1+item2}.`,
          `Change = $${paid} − $${item1+item2} = $${change}.`,
        ],
        mistakeTags: ['multi-step-reasoning', 'calculation-error'], ageMin: 8, ageMax: 13,
      });
    }),

  ct({ id: 'word-fractions-share-v6', testIds: [...MATH_ALL], domain: 'fractions-ratios', skillId: 'fractions-ratios', difficulty: 3 },
    (ctx, t) => {
      const total = ctx.rng.pick([12, 16, 20, 24]);
      const denom = ctx.rng.pick([2, 4]);
      const frac = total / denom;
      const lead = phrase(ctx.rng, [
        `There are ${total} cookies. ${denom === 2 ? 'Half' : 'A quarter'} of them are chocolate. How many are chocolate?`,
        `${denom === 2 ? '1/2' : '1/4'} of ${total} students brought lunch. How many students is that?`,
      ]);
      const { options, correctOptionId } = makeOptions(String(frac), [
        String(total - frac), String(frac * 2), String(total / 3)
      ], ctx.rng);
      return baseQ(ctx, t, {
        prompt: lead,
        options, correctOptionId, correctAnswerLabel: String(frac),
        explanationSteps: [
          `${denom === 2 ? '1/2' : '1/4'} of ${total} = ${total} ÷ ${denom} = ${frac}.`,
        ],
        mistakeTags: ['concept-gap'], ageMin: 8, ageMax: 13,
      });
    }),

  // ── Spatial with visuals (4 templates) ─────────────────────────────────

  ct({ id: 'spatial-cube-faces-v6', testIds: [...STEM, ...APT], domain: 'visual-spatial', skillId: 'spatial-reasoning', difficulty: 2 },
    (ctx, t) => {
      const lead = phrase(ctx.rng, [
        'A solid cube sits in front of you. How many flat sides (faces) does it have?',
        'Look at the cube above. How many faces (flat surfaces) does it have in total?',
      ]);
      const { options, correctOptionId } = makeOptions('6', ['4', '8', '12'], ctx.rng);
      return baseQ(ctx, t, {
        prompt: lead,
        visualType: 'cube',
        options, correctOptionId, correctAnswerLabel: '6',
        explanationSteps: [
          'A cube is the shape of a die.',
          'Top + bottom + front + back + left + right = 6 faces.',
        ],
        commonTrap: 'Don\'t confuse faces (flat sides) with edges (lines) or corners.',
        mistakeTags: ['spatial-visualization'], ageMin: 7, ageMax: 14,
      });
    }),

  ct({ id: 'spatial-shape-symmetry-v6', testIds: [...STEM, ...APT], domain: 'visual-spatial', skillId: 'spatial-reasoning', difficulty: 3 },
    (ctx, t) => {
      const items = [
        { shape: 'square',    answer: '4', wrong: ['1', '2', '8'] },
        { shape: 'rectangle', answer: '2', wrong: ['1', '4', '0'] },
        { shape: 'circle',    answer: 'Infinitely many', wrong: ['1', '2', '4'] },
        { shape: 'triangle',  answer: '3', wrong: ['1', '0', '6'] },
      ];
      const item = ctx.rng.pick(items);
      const lead = phrase(ctx.rng, [
        `Look at the ${item.shape}. How many lines of symmetry does an equilateral version of this shape have?`,
        `How many lines of symmetry does a regular ${item.shape} have?`,
      ]);
      const isEquilateral = item.shape === 'triangle' ? ' (equilateral)' : '';
      const { options, correctOptionId } = makeOptions(item.answer, item.wrong, ctx.rng);
      return baseQ(ctx, t, {
        prompt: `${lead}${isEquilateral}`,
        visualType: 'shape',
        visualParams: { shape: item.shape },
        options, correctOptionId, correctAnswerLabel: item.answer,
        explanationSteps: [
          'A line of symmetry divides the shape so the two halves are mirror images.',
          `A regular ${item.shape} has ${item.answer.toLowerCase()} such line${item.answer === '1' ? '' : 's'}.`,
        ],
        mistakeTags: ['spatial-visualization', 'concept-gap'], ageMin: 8, ageMax: 14,
      });
    }),

  ct({ id: 'spatial-mirror-reflection-v6', testIds: [...STEM, ...APT], domain: 'visual-spatial', skillId: 'spatial-reasoning', difficulty: 3 },
    (ctx, t) => {
      const items = [
        { letter: 'b', mirror: 'd', wrong: ['p', 'q', 'b'] },
        { letter: 'p', mirror: 'q', wrong: ['b', 'd', 'p'] },
        { letter: 'E', mirror: 'Ǝ', wrong: ['F', 'W', 'E'] },
      ];
      const item = ctx.rng.pick(items);
      const lead = phrase(ctx.rng, [
        `If the letter "${item.letter}" is reflected across a vertical mirror line, what does it look like?`,
        `Which letter is the mirror image of "${item.letter}" across a vertical axis?`,
      ]);
      const { options, correctOptionId } = makeOptions(item.mirror, item.wrong, ctx.rng);
      return baseQ(ctx, t, {
        prompt: lead,
        visualType: 'mirror-letter',
        visualParams: { letter: item.letter, axis: 'horizontal' },
        options, correctOptionId, correctAnswerLabel: item.mirror,
        explanationSteps: [
          'A vertical mirror flips left and right.',
          `So "${item.letter}" becomes "${item.mirror}" — its left and right sides swap.`,
        ],
        commonTrap: 'A vertical-axis mirror does not flip top and bottom.',
        mistakeTags: ['spatial-visualization'], ageMin: 7, ageMax: 13,
      });
    }),

  ct({ id: 'spatial-rotation-quarter-v6', testIds: [...STEM, ...APT], domain: 'visual-spatial', skillId: 'spatial-reasoning', difficulty: 3 },
    (ctx, t) => {
      const lead = phrase(ctx.rng, [
        'An arrow pointing right is rotated 90 degrees clockwise. Which direction does it point now?',
        'You turn an arrow that points right by a quarter turn clockwise. Where is it pointing?',
      ]);
      const { options, correctOptionId } = makeOptions('Down', ['Up', 'Left', 'Right'], ctx.rng);
      return baseQ(ctx, t, {
        prompt: lead,
        visualType: 'mirror-arrow',
        visualParams: { direction: 'right' },
        options, correctOptionId, correctAnswerLabel: 'Down',
        explanationSteps: [
          'A 90° clockwise rotation moves: right → down → left → up → right.',
          'So a right-pointing arrow now points down.',
        ],
        mistakeTags: ['spatial-visualization'], ageMin: 8, ageMax: 14,
      });
    }),

  // ── Science reasoning (4 templates) ────────────────────────────────────

  ct({ id: 'sci-states-of-matter-v6', testIds: [...STEM, ...APT, ...MIL], domain: 'science-reasoning', skillId: 'science-reasoning', difficulty: 2 },
    (ctx, t) => {
      const items = [
        { q: 'Which of these is a gas at room temperature?', answer: 'Oxygen', wrong: ['Sand', 'Ice', 'Wood'] },
        { q: 'Which substance is a liquid at room temperature?', answer: 'Water', wrong: ['Iron', 'Salt', 'Helium'] },
        { q: 'Which is a solid at room temperature?', answer: 'Aluminum', wrong: ['Steam', 'Mercury', 'Hydrogen'] },
      ];
      const item = ctx.rng.pick(items);
      const { options, correctOptionId } = makeOptions(item.answer, item.wrong, ctx.rng);
      return baseQ(ctx, t, {
        prompt: item.q,
        options, correctOptionId, correctAnswerLabel: item.answer,
        explanationSteps: [
          'Matter has three common states: solid, liquid, and gas.',
          `${item.answer} is the right answer for this state at room temperature.`,
        ],
        mistakeTags: ['concept-gap'], ageMin: 8, ageMax: 14,
      });
    }),

  ct({ id: 'sci-life-cycle-v6', testIds: [...STEM, ...APT], domain: 'science-reasoning', skillId: 'science-reasoning', difficulty: 2 },
    (ctx, t) => {
      const items = [
        { q: 'What is the correct order of a butterfly\'s life cycle?', answer: 'Egg → caterpillar → chrysalis → butterfly', wrong: ['Caterpillar → egg → butterfly → chrysalis', 'Butterfly → egg → chrysalis → caterpillar', 'Chrysalis → egg → caterpillar → butterfly'] },
        { q: 'Which is the correct order of a frog\'s life cycle?', answer: 'Egg → tadpole → froglet → frog', wrong: ['Tadpole → egg → frog → froglet', 'Frog → egg → tadpole → froglet', 'Egg → frog → tadpole → froglet'] },
      ];
      const item = ctx.rng.pick(items);
      const { options, correctOptionId } = makeOptions(item.answer, item.wrong, ctx.rng);
      return baseQ(ctx, t, {
        prompt: item.q,
        options, correctOptionId, correctAnswerLabel: item.answer,
        explanationSteps: [
          'A life cycle starts with the earliest stage and ends with the adult.',
          `Correct order: ${item.answer}.`,
        ],
        mistakeTags: ['concept-gap', 'attention-to-detail'], ageMin: 7, ageMax: 12,
      });
    }),

  ct({ id: 'sci-forces-v6', testIds: [...STEM, ...MIL], domain: 'science-reasoning', skillId: 'science-reasoning', difficulty: 3 },
    (ctx, t) => {
      const lead = phrase(ctx.rng, [
        'A book sits still on a flat table. Which best describes the forces on the book?',
        'A pencil rests on a desk and does not move. What is true about the forces on it?',
      ]);
      const ans = 'The forces are balanced (gravity down equals support up).';
      const wrong = [
        'There are no forces on the book at all.',
        'Gravity is the only force acting on the book.',
        'The forces are unbalanced, so the book is moving slowly.',
      ];
      const { options, correctOptionId } = makeOptions(ans, wrong, ctx.rng);
      return baseQ(ctx, t, {
        prompt: lead,
        options, correctOptionId, correctAnswerLabel: ans,
        explanationSteps: [
          'An object that is not moving has balanced forces.',
          'Gravity pulls the book down; the table pushes it up with the same force.',
        ],
        commonTrap: 'No motion does NOT mean no forces — it means balanced forces.',
        mistakeTags: ['concept-gap'], ageMin: 10, ageMax: 16,
      });
    }),

  ct({ id: 'sci-experimental-variable-v6', testIds: [...STEM, ...APT], domain: 'science-reasoning', skillId: 'science-reasoning', difficulty: 4 },
    (ctx, t) => {
      const lead = phrase(ctx.rng, [
        'Maria wants to know if plants grow taller with more sunlight. She gives three plants 2, 4, and 6 hours of sunlight a day, and gives all of them the same water and soil. What is the independent variable?',
        'In an experiment testing how sunlight affects plant growth, with everything else held constant, which is the independent variable?',
      ]);
      const ans = 'The amount of sunlight';
      const wrong = ['The height of the plants', 'The amount of water', 'The type of soil'];
      const { options, correctOptionId } = makeOptions(ans, wrong, ctx.rng);
      return baseQ(ctx, t, {
        prompt: lead,
        options, correctOptionId, correctAnswerLabel: ans,
        explanationSteps: [
          'The independent variable is what the scientist deliberately changes.',
          'Here, sunlight is being changed; everything else is held constant.',
          'Plant height is the *dependent* variable — what gets measured.',
        ],
        commonTrap: 'The thing being measured is the dependent variable, not the independent one.',
        mistakeTags: ['concept-gap', 'multi-step-reasoning'], ageMin: 11, ageMax: 16,
      });
    }),

  // ── Coding logic (4 templates incl. negative indexing) ─────────────────

  ct({ id: 'code-loop-trace-v6', testIds: [...CODE, ...APT], domain: 'coding-logic', skillId: 'coding-logic', difficulty: 3 },
    (ctx, t) => {
      const start = ctx.rng.int(1, 3);
      const reps = ctx.rng.int(3, 5);
      const total = start * reps;
      const lead = phrase(ctx.rng, [
        `total = 0\nfor i in range(${reps}):\n    total = total + ${start}\nWhat is total at the end?`,
        `Trace this loop:\nlet total = 0;\nfor (let i = 0; i < ${reps}; i++) total += ${start};\nWhat is total?`,
      ]);
      const { options, correctOptionId } = makeOptions(String(total), [
        String(reps), String(start), String(total + start)
      ], ctx.rng);
      return baseQ(ctx, t, {
        prompt: lead,
        options, correctOptionId, correctAnswerLabel: String(total),
        explanationSteps: [
          `The loop body runs ${reps} times.`,
          `Each time, total increases by ${start}.`,
          `Final: ${reps} × ${start} = ${total}.`,
        ],
        mistakeTags: ['multi-step-reasoning', 'concept-gap'], ageMin: 11, ageMax: 18,
      });
    }),

  ct({ id: 'code-conditional-v6', testIds: [...CODE], domain: 'coding-logic', skillId: 'coding-logic', difficulty: 3 },
    (ctx, t) => {
      const x = ctx.rng.int(3, 9);
      const y = ctx.rng.int(3, 9);
      const result = x > y ? 'A' : x < y ? 'B' : 'C';
      const lead = `x = ${x}\ny = ${y}\nif x > y:\n    print("A")\nelif x < y:\n    print("B")\nelse:\n    print("C")\nWhat does this print?`;
      const { options, correctOptionId } = makeOptions(result, ['A', 'B', 'C'].filter(v => v !== result), ctx.rng);
      return baseQ(ctx, t, {
        prompt: lead,
        options, correctOptionId, correctAnswerLabel: result,
        explanationSteps: [
          `Compare x = ${x} and y = ${y}.`,
          x > y ? 'x is greater, so the first branch runs and prints "A".'
                : x < y ? 'x is smaller, so the elif branch runs and prints "B".'
                : 'x equals y, so the else branch runs and prints "C".',
        ],
        mistakeTags: ['concept-gap', 'attention-to-detail'], ageMin: 11, ageMax: 18,
      });
    }),

  ct({ id: 'code-list-negative-index-v6', testIds: [...CODE], domain: 'coding-logic', skillId: 'coding-logic', difficulty: 4 },
    (ctx, t) => {
      const items = ['apple', 'pear', 'lemon', 'plum'];
      const idx = ctx.rng.int(1, 3); // 1, 2, or 3
      const value = items[items.length - idx];
      const lead = phrase(ctx.rng, [
        `fruits = ["apple", "pear", "lemon", "plum"]\nWhat is fruits[-${idx}] in Python?`,
        `In Python, given the list ["apple", "pear", "lemon", "plum"], what is the value at index -${idx}?`,
      ]);
      const { options, correctOptionId } = makeOptions(value, items.filter(v => v !== value), ctx.rng);
      return baseQ(ctx, t, {
        prompt: lead,
        options, correctOptionId, correctAnswerLabel: value,
        explanationSteps: [
          'In Python, negative indices count from the end.',
          'Index -1 is the last item, -2 is second-to-last, and so on.',
          `Index -${idx} on a 4-item list points to: "${value}".`,
        ],
        commonTrap: 'Negative indices count from the END, not the start.',
        mistakeTags: ['concept-gap'], ageMin: 12, ageMax: 18,
      });
    }),

  ct({ id: 'code-debug-off-by-one-v6', testIds: [...CODE], domain: 'coding-logic', skillId: 'coding-logic', difficulty: 4 },
    (ctx, t) => {
      const lead = `A programmer wants to print the numbers 1 through 5. They write:\n\nfor i in range(1, 5):\n    print(i)\n\nWhat is wrong?`;
      const ans = 'The loop stops at 4 because range(1, 5) does not include 5.';
      const wrong = [
        'The loop will run forever.',
        'The loop prints nothing.',
        'The loop prints 1 through 6.',
      ];
      const { options, correctOptionId } = makeOptions(ans, wrong, ctx.rng);
      return baseQ(ctx, t, {
        prompt: lead,
        options, correctOptionId, correctAnswerLabel: ans,
        explanationSteps: [
          'In Python, range(a, b) goes from a up to b - 1.',
          'So range(1, 5) yields 1, 2, 3, 4 — not 5.',
          'To include 5, use range(1, 6).',
        ],
        commonTrap: 'The end value of range() is exclusive — a classic off-by-one bug.',
        mistakeTags: ['concept-gap', 'attention-to-detail'], ageMin: 12, ageMax: 18,
      });
    }),

  // ── Mechanical reasoning (3 templates) ─────────────────────────────────

  ct({ id: 'mech-pulley-v6', testIds: [...MIL, ...STEM], domain: 'mechanical-reasoning', skillId: 'mechanical-reasoning', difficulty: 3 },
    (ctx, t) => {
      const lead = phrase(ctx.rng, [
        'A simple pulley with two supporting ropes lifts a 100 kg load. About how much force is needed to lift it (ignoring friction)?',
        'You use a pulley system with 2 supporting rope segments to raise a 100 kg crate. What force do you need (ignoring friction)?',
      ]);
      const ans = 'About 50 kg of force';
      const wrong = ['About 100 kg of force', 'About 200 kg of force', 'No force at all'];
      const { options, correctOptionId } = makeOptions(ans, wrong, ctx.rng);
      return baseQ(ctx, t, {
        prompt: lead,
        options, correctOptionId, correctAnswerLabel: ans,
        explanationSteps: [
          'A pulley with N supporting ropes gives a mechanical advantage of N.',
          'With 2 supporting ropes, force needed is 100 ÷ 2 = 50 kg.',
        ],
        commonTrap: 'A pulley does not eliminate force — it reduces it.',
        mistakeTags: ['concept-gap'], ageMin: 12, ageMax: 18,
      });
    }),

  ct({ id: 'mech-lever-balance-v6', testIds: [...MIL, ...STEM], domain: 'mechanical-reasoning', skillId: 'mechanical-reasoning', difficulty: 3 },
    (ctx, t) => {
      const w1 = ctx.rng.pick([10, 20, 40]);
      const d1 = ctx.rng.pick([2, 4]);
      const d2 = ctx.rng.int(1, 4);
      const w2 = (w1 * d1) / d2;
      const lead = `On a balanced seesaw, a ${w1} kg weight sits ${d1} m from the centre. To balance, what weight is needed at ${d2} m on the other side?`;
      const { options, correctOptionId } = makeOptions(`${w2} kg`, [
        `${w1} kg`, `${w1 * 2} kg`, `${w1 / 2} kg`
      ], ctx.rng);
      return baseQ(ctx, t, {
        prompt: lead,
        options, correctOptionId, correctAnswerLabel: `${w2} kg`,
        explanationSteps: [
          'A lever balances when weight × distance is the same on both sides.',
          `Left side: ${w1} × ${d1} = ${w1*d1}.`,
          `Right side: weight × ${d2} = ${w1*d1}, so weight = ${w2} kg.`,
        ],
        mistakeTags: ['concept-gap', 'multi-step-reasoning'], ageMin: 12, ageMax: 18,
      });
    }),

  ct({ id: 'mech-gears-v6', testIds: [...MIL, ...STEM], domain: 'mechanical-reasoning', skillId: 'mechanical-reasoning', difficulty: 3 },
    (ctx, t) => {
      const lead = phrase(ctx.rng, [
        'A small gear with 10 teeth drives a large gear with 30 teeth. If the small gear turns 3 full times, how many turns does the large gear make?',
        'A 10-tooth gear is meshed with a 30-tooth gear. The small one rotates 3 times. How many rotations does the large gear make?',
      ]);
      const ans = '1 turn';
      const wrong = ['3 turns', '9 turns', '6 turns'];
      const { options, correctOptionId } = makeOptions(ans, wrong, ctx.rng);
      return baseQ(ctx, t, {
        prompt: lead,
        options, correctOptionId, correctAnswerLabel: ans,
        explanationSteps: [
          'For each tooth a small gear advances, the large gear advances one tooth too.',
          '3 turns × 10 teeth = 30 teeth advanced on the large gear.',
          '30 teeth ÷ 30 teeth per turn = 1 full turn.',
        ],
        commonTrap: 'A larger gear turns SLOWER, not faster, when driven by a smaller one.',
        mistakeTags: ['concept-gap'], ageMin: 12, ageMax: 18,
      });
    }),

  // ── Working memory (3 templates) ───────────────────────────────────────

  ct({ id: 'wm-digit-recall-v6', testIds: [...APT], domain: 'working-memory', skillId: 'working-memory', difficulty: 3 },
    (ctx, t) => {
      const digits = Array.from({ length: 5 }, () => ctx.rng.int(0, 9));
      const sequence = digits.join('-');
      const reversed = digits.slice().reverse().join('-');
      const lead = `Read this number sequence and remember it: ${sequence}\n\nNow read it BACKWARDS. Which is correct?`;
      const wrong = [
        digits.join(''),
        [...digits].sort().join('-'),
        digits.slice(1).reverse().join('-'),
      ];
      const { options, correctOptionId } = makeOptions(reversed, wrong, ctx.rng);
      return baseQ(ctx, t, {
        prompt: lead,
        options, correctOptionId, correctAnswerLabel: reversed,
        explanationSteps: [
          'Hold the sequence in mind and reverse it.',
          `${sequence} reversed is ${reversed}.`,
        ],
        commonTrap: 'Reversing a sequence is not the same as sorting it.',
        mistakeTags: ['attention-to-detail'], ageMin: 10, ageMax: 18,
      });
    }),

  ct({ id: 'wm-instruction-follow-v6', testIds: [...APT, ...KG], domain: 'working-memory', skillId: 'following-directions', difficulty: 2 },
    (ctx, t) => {
      const items = [
        { q: 'Listen carefully: First, clap once. Then stand up. Then sit down. What is the SECOND thing to do?', answer: 'Stand up', wrong: ['Clap once', 'Sit down', 'Wave'] },
        { q: 'Pretend a teacher says: "Open your book, write your name, then close the book." What is the LAST thing to do?', answer: 'Close the book', wrong: ['Open your book', 'Write your name', 'Stand up'] },
      ];
      const item = ctx.rng.pick(items);
      const { options, correctOptionId } = makeOptions(item.answer, item.wrong, ctx.rng);
      return baseQ(ctx, t, {
        prompt: item.q,
        options, correctOptionId, correctAnswerLabel: item.answer,
        explanationSteps: [
          'Hold all the steps in mind.',
          `Pick the one that matches the position asked for.`,
        ],
        mistakeTags: ['attention-to-detail'], ageMin: 5, ageMax: 12,
      });
    }),

  ct({ id: 'wm-letter-recall-v6', testIds: [...APT], domain: 'working-memory', skillId: 'working-memory', difficulty: 3 },
    (ctx, t) => {
      const letters = 'BCDFGHJKLMNPRSTV'.split('');
      const seq = ctx.rng.pickN(letters, 5);
      const fourth = seq[3];
      const lead = `Remember this sequence of letters: ${seq.join(' ')}\n\nWhat is the FOURTH letter?`;
      const wrong = [seq[0], seq[1], seq[4]];
      const { options, correctOptionId } = makeOptions(fourth, wrong, ctx.rng);
      return baseQ(ctx, t, {
        prompt: lead,
        options, correctOptionId, correctAnswerLabel: fourth,
        explanationSteps: [
          'Count the letters from the left.',
          `The 4th letter in "${seq.join(' ')}" is "${fourth}".`,
        ],
        mistakeTags: ['attention-to-detail'], ageMin: 9, ageMax: 16,
      });
    }),

  // ── Algebra readiness (3 templates) ────────────────────────────────────

  ct({ id: 'alg-solve-linear-v6', testIds: [...ALG, ...MATH], domain: 'algebra-readiness', skillId: 'algebra-readiness', difficulty: 3 },
    (ctx, t) => {
      const a = ctx.rng.pick([2, 3, 4, 5]);
      const b = ctx.rng.int(2, 10);
      const x = ctx.rng.int(2, 8);
      const c = a * x + b;
      const lead = phrase(ctx.rng, [
        `Solve for x: ${a}x + ${b} = ${c}`,
        `What value of x makes the equation ${a}x + ${b} = ${c} true?`,
      ]);
      const { options, correctOptionId } = makeOptions(String(x), [
        String(x + 1), String(x - 1), String(c - b)
      ], ctx.rng);
      return baseQ(ctx, t, {
        prompt: lead,
        options, correctOptionId, correctAnswerLabel: String(x),
        explanationSteps: [
          `Subtract ${b} from both sides: ${a}x = ${c - b}.`,
          `Divide both sides by ${a}: x = ${x}.`,
        ],
        commonTrap: 'You must do the same operation to BOTH sides of the equation.',
        mistakeTags: ['procedure-error', 'concept-gap'], ageMin: 11, ageMax: 16,
      });
    }),

  ct({ id: 'alg-evaluate-expression-v6', testIds: [...ALG, ...MATH], domain: 'algebra-readiness', skillId: 'algebra-readiness', difficulty: 2 },
    (ctx, t) => {
      const x = ctx.rng.int(2, 8);
      const a = ctx.rng.int(2, 6);
      const b = ctx.rng.int(1, 9);
      const value = a * x - b;
      const lead = `Evaluate ${a}x − ${b} when x = ${x}.`;
      const { options, correctOptionId } = makeOptions(String(value), [
        String(value + b), String(a + x - b), String(value - a)
      ], ctx.rng);
      return baseQ(ctx, t, {
        prompt: lead,
        options, correctOptionId, correctAnswerLabel: String(value),
        explanationSteps: [
          `Substitute x = ${x}: ${a}(${x}) − ${b} = ${a*x} − ${b}.`,
          `${a*x} − ${b} = ${value}.`,
        ],
        mistakeTags: ['calculation-error', 'concept-gap'], ageMin: 10, ageMax: 14,
      });
    }),

  ct({ id: 'alg-inequality-v6', testIds: [...ALG], domain: 'algebra-readiness', skillId: 'algebra-readiness', difficulty: 4 },
    (ctx, t) => {
      const lead = phrase(ctx.rng, [
        'Which value of x makes the inequality x + 5 > 12 true?',
        'For which x is x + 5 > 12?',
      ]);
      const correct = '8';
      const wrong = ['5', '7', '6'];
      const { options, correctOptionId } = makeOptions(correct, wrong, ctx.rng);
      return baseQ(ctx, t, {
        prompt: lead,
        options, correctOptionId, correctAnswerLabel: correct,
        explanationSteps: [
          'Subtract 5 from both sides: x > 7.',
          'So any value greater than 7 works. From the choices, 8 is the only one.',
        ],
        commonTrap: 'The inequality is strict (>), so 7 itself does NOT make it true.',
        mistakeTags: ['concept-gap', 'procedure-error'], ageMin: 12, ageMax: 16,
      });
    }),

  // ── Kindergarten readiness with visuals (2 templates) ──────────────────

  ct({ id: 'kg-count-stars-v6', testIds: [...KG], domain: 'school-readiness', skillId: 'counting', difficulty: 1 },
    (ctx, t) => {
      const n = ctx.rng.int(3, 7);
      const lead = phrase(ctx.rng, [
        'Count the stars. How many do you see?',
        'How many stars are shown above?',
      ]);
      const { options, correctOptionId } = makeOptions(String(n), [
        String(n - 1), String(n + 1), String(n + 2)
      ], ctx.rng);
      return baseQ(ctx, t, {
        prompt: lead,
        visualType: 'count-stars',
        visualParams: { count: n },
        options, correctOptionId, correctAnswerLabel: String(n),
        explanationSteps: [
          'Touch each star with your eyes one at a time.',
          `Count: 1, 2, 3 ... up to ${n}.`,
        ],
        mistakeTags: ['attention-to-detail', 'calculation-error'], ageMin: 4, ageMax: 7,
      });
    }),

  ct({ id: 'kg-letter-sound-v6', testIds: [...KG], domain: 'vocabulary', skillId: 'vocabulary', difficulty: 1 },
    (ctx, t) => {
      const items = [
        { q: 'Which word starts with the letter "B"?', answer: 'Ball', wrong: ['Cat', 'Dog', 'Apple'] },
        { q: 'Which word starts with the letter "S"?', answer: 'Sun', wrong: ['Tree', 'Hat', 'Egg'] },
        { q: 'Which word starts with the letter "M"?', answer: 'Moon', wrong: ['Boat', 'Pen', 'Owl'] },
      ];
      const item = ctx.rng.pick(items);
      const { options, correctOptionId } = makeOptions(item.answer, item.wrong, ctx.rng);
      return baseQ(ctx, t, {
        prompt: item.q,
        options, correctOptionId, correctAnswerLabel: item.answer,
        explanationSteps: [
          'Listen for the FIRST sound in each word.',
          `"${item.answer}" begins with that letter.`,
        ],
        mistakeTags: ['vocabulary-confusion'], ageMin: 4, ageMax: 6,
      });
    }),

];

// Merge v6 templates into the main array
questionTemplates.push(...v6Templates);

// ─── Exports ─────────────────────────────────────────────────────────────────

export function getTemplatesForTest(testId: TestId): QuestionTemplate[] {
  return questionTemplates.filter(t => t.testIds.includes(testId));
}

export function getTemplatesForDomain(testId: TestId, domain: DomainId): QuestionTemplate[] {
  return questionTemplates.filter(t => t.testIds.includes(testId) && t.domain === domain);
}
