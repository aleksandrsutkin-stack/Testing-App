// scripts/smoke-test-content.js
// Run: node scripts/smoke-test-content.js
//
// v0.6 checks: everything from v0.5 plus migration to ScoreLift Score
// (1–100), external benchmarks (NWEA MAP, IAAT, DAT-5, BRACKEN-3, ASVAB
// AFQT), full dark-mode factory pattern across all components and screens,
// illustration system (Liftie mascot + decorations + EmptyState +
// AchievementBadge), adaptive presentation order, and 110+ templates.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FAIL = '\x1b[31m  FAIL\x1b[0m';
const PASS = '\x1b[32m  OK\x1b[0m';

let allPassed = true;
function check(label, pass, note = '') {
  console.log(`${pass ? PASS : FAIL}: ${label}${note ? `  (${note})` : ''}`);
  if (!pass) allPassed = false;
}

console.log('\nQuizLift v0.6 smoke test\n');

// ── Brand ────────────────────────────────────────────────────────────────────
const brandFile = fs.readFileSync(path.join(ROOT, 'src/config/brand.ts'), 'utf8');
const brandStripped = stripComments(brandFile);
check('Brand name is QuizLift.', brandFile.includes("appName: 'QuizLift'"));
check('No legacy BrightWit/BrightSpark in brand.', !brandFile.includes('BrightWit') && !brandFile.includes('BrightSpark'));
check('v0.6 brand uses productScoreName (not productIndexName).',
  brandStripped.includes('productScoreName') && !brandStripped.includes('productIndexName'));
check('v0.6 brand declares 1–100 ScoreLift Score scale.', brandFile.includes('1–100') && brandFile.includes('on-grade-level'));
check('v0.6 percentileCaveat references public norm tables.', /norm tables/.test(brandFile) && /NWEA MAP/.test(brandFile));
check('v0.6 scoreBandCopy has 5 v0.6 band keys.',
  ['well-above','above','on-grade','approaching','below'].every(k => brandFile.includes(`'${k}':`)));

// ── Test IDs ─────────────────────────────────────────────────────────────────
const typesFile = fs.readFileSync(path.join(ROOT, 'src/features/assessment/types.ts'), 'utf8');
const typesStripped = stripComments(typesFile);
const ALL_TEST_IDS = [
  'quizlift-aptitude-snapshot', 'compacted-math-readiness',
  'double-compacted-algebra-readiness', 'grade-math-skills-check',
  'reading-vocabulary-snapshot', 'stem-spatial-reasoning',
  'coding-logic-sprint', 'kindergarten-readiness', 'military-aptitude-practice'
];
ALL_TEST_IDS.forEach(id => check(`TestId includes ${id}.`, typesFile.includes(`'${id}'`)));

check('AssessmentResult has scoreLiftScore field.', typesFile.includes('scoreLiftScore: number'));
check('AssessmentResult has scoreLiftScoreLabel field.', typesFile.includes('scoreLiftScoreLabel: string'));
check('AssessmentResult NO LONGER references questionLiftIndex.', !/questionLiftIndex\s*:/.test(typesStripped));
check('PercentileEstimate has benchmarkSource field.', typesFile.includes('benchmarkSource'));
check('ScoreBand uses 5 v0.6 names.', /'well-above'/.test(typesFile) && /'on-grade'/.test(typesFile) && /'approaching'/.test(typesFile));
check('ScoreBand does NOT include legacy "needs-practice".', !/'needs-practice'/.test(typesStripped));

// ── Blueprints (unchanged) ──────────────────────────────────────────────────
const blueprintsFile = fs.readFileSync(path.join(ROOT, 'src/data/testBlueprints.ts'), 'utf8');
ALL_TEST_IDS.forEach(id => check(`Blueprint exists for ${id}.`, blueprintsFile.includes(`'${id}'`)));
const totalQMatches = [...blueprintsFile.matchAll(/totalQuestions:\s*(\d+)/g)];
check('All blueprints target 20+ questions per session.',
  totalQMatches.every(m => Number(m[1]) >= 20),
  `Found targets: ${totalQMatches.map(m => m[1]).join(', ')}`);

// ── Templates (v0.6 — should be 110+) ───────────────────────────────────────
const templatesFile = fs.readFileSync(path.join(ROOT, 'src/data/questionTemplates.ts'), 'utf8');
const templateCount = (templatesFile.match(/ct\(\{/g) || []).length;
check('110+ question templates in combined file.', templateCount >= 110, `${templateCount} templates`);
// v0.7 content review pass: 5 new templates merged via v7Templates.
check('At least 122 templates exist (118 + new v7 additions).', templateCount >= 122, `${templateCount} templates`);
const templateIds = [...templatesFile.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]);
const uniqueIds = new Set(templateIds);
check('All template IDs are unique.', uniqueIds.size === templateIds.length, `${uniqueIds.size} unique`);
check('v0.6 templates: includes -v6 IDs.', templateIds.some(id => /-v6$/.test(id)));
check('v0.6 templates: includes a reading-passage template.', templateIds.some(id => /^rc-passage/.test(id)));
check('v0.6 templates: includes a word-problem template.', templateIds.some(id => /^word-/.test(id)));
check('v0.6 templates: includes a science experimental template.', templateIds.some(id => /^sci-experimental/.test(id)));
check('v0.6 templates: includes a code negative-index template.', templateIds.some(id => /negative-index/.test(id)));
check('v0.6 phrase() helper is defined.', /function phrase\(/.test(templatesFile));
check('v0.6 phrase() helper is used somewhere.', /\bphrase\(ctx\.rng/.test(templatesFile));

// ── External benchmarks (NEW in v0.6) ───────────────────────────────────────
const benchPath = path.join(ROOT, 'src/features/scoring/externalBenchmarks.ts');
check('externalBenchmarks.ts exists.', fs.existsSync(benchPath));
const benchFile = fs.readFileSync(benchPath, 'utf8');
['NWEA_MAP_MATH', 'NWEA_MAP_READING', 'IAAT_ALGEBRA', 'DAT_5_SPATIAL', 'BRACKEN_3_KG', 'ASVAB_AFQT']
  .forEach(name => check(`externalBenchmarks references ${name}.`, benchFile.includes(name)));
ALL_TEST_IDS.forEach(id => check(`Benchmark mapping exists for ${id}.`, benchFile.includes(`'${id}'`)));
check('externalBenchmarks exports estimatePercentile().', /export function estimatePercentile/.test(benchFile));
check('Old staticDistributions.ts is REMOVED.', !fs.existsSync(path.join(ROOT, 'src/features/scoring/staticDistributions.ts')));

// ── ScoreLift Score (NEW in v0.6) ───────────────────────────────────────────
const scoreLiftPath = path.join(ROOT, 'src/features/scoring/scoreLiftScore.ts');
check('scoreLiftScore.ts exists.', fs.existsSync(scoreLiftPath));
const scoreLiftFile = fs.readFileSync(scoreLiftPath, 'utf8');
check('scoreLiftScore exports computeScoreLiftScore.', /export function computeScoreLiftScore/.test(scoreLiftFile));
check('scoreLiftScore exports scoreLiftScoreLabel.', /export function scoreLiftScoreLabel/.test(scoreLiftFile));
check('scoreLiftScore has TEST_EXPECTATIONS for all 9 tests.',
  ALL_TEST_IDS.every(id => scoreLiftFile.includes(`'${id}'`)));

// ── Adaptive selector (NEW in v0.6) ─────────────────────────────────────────
const adaptivePath = path.join(ROOT, 'src/features/assessment/adaptiveSelector.ts');
check('adaptiveSelector.ts exists.', fs.existsSync(adaptivePath));
const adaptiveFile = fs.readFileSync(adaptivePath, 'utf8');
check('adaptiveSelector exports pickInitialQuestion.', /export function pickInitialQuestion/.test(adaptiveFile));
check('adaptiveSelector exports pickNextQuestion.', /export function pickNextQuestion/.test(adaptiveFile));
check('adaptiveSelector exports computeTargetDifficulty.', /export function computeTargetDifficulty/.test(adaptiveFile));

// ── Theme: dark mode (NEW in v0.6) ──────────────────────────────────────────
const colorsFile = fs.readFileSync(path.join(ROOT, 'src/theme/colors.ts'), 'utf8');
check('colors.ts exports lightColors palette.', /export const lightColors/.test(colorsFile));
check('colors.ts exports darkColors palette.', /export const darkColors/.test(colorsFile));
check('colors.ts exports useColors() hook.', /export function useColors/.test(colorsFile));
check('colors.ts exports ColorPalette type.', /export interface ColorPalette/.test(colorsFile));
check('colors.ts keeps backwards-compat static colors export.', /export const colors:/.test(colorsFile));

const domainColorsFile = fs.readFileSync(path.join(ROOT, 'src/theme/domainColors.ts'), 'utf8');
check('domainColors has DOMAIN_COLORS_DARK.', /DOMAIN_COLORS_DARK/.test(domainColorsFile));
check('domainColors exports useDomainColor() hook.', /export function useDomainColor/.test(domainColorsFile));
check('domainColors exports useBandStyle() hook.', /export function useBandStyle/.test(domainColorsFile));
check('domainColors keeps static domainColor()/bandStyle() for PDF.',
  /export function domainColor/.test(domainColorsFile) && /export function bandStyle/.test(domainColorsFile));
['well-above','above','on-grade','approaching','below'].forEach(b => {
  check(`domainColors has v0.6 band "${b}".`, domainColorsFile.includes(`'${b}':`));
});

// ── Illustrations (NEW in v0.6) ─────────────────────────────────────────────
const illustrationsPath = path.join(ROOT, 'src/components/Illustrations.tsx');
check('Illustrations.tsx exists.', fs.existsSync(illustrationsPath));
const illFile = fs.readFileSync(illustrationsPath, 'utf8');
['Mascot', 'Decoration', 'EmptyState', 'AchievementBadge'].forEach(c => {
  check(`Illustrations exports ${c}.`, new RegExp(`export function ${c}`).test(illFile));
});
['idle', 'thinking', 'happy', 'celebrating'].forEach(e => {
  check(`Mascot supports "${e}" expression.`, illFile.includes(`'${e}'`));
});

// ── Components: dark-mode factory pattern ───────────────────────────────────
const COMPONENTS = [
  'AppButton.tsx', 'Card.tsx', 'Screen.tsx', 'MetricBar.tsx',
  'ProgressBar.tsx', 'QuestionOptionCard.tsx', 'LabeledPicker.tsx',
  'SpatialVisual.tsx', 'PaywallModal.tsx'
];
COMPONENTS.forEach(c => {
  const f = fs.readFileSync(path.join(ROOT, 'src/components', c), 'utf8');
  check(`Component ${c} uses useColors().`, /\buseColors\(\)/.test(f));
  check(`Component ${c} uses makeStyles(colors) factory.`, /makeStyles\(colors\)/.test(f) || /makeStyles\(\s*colors\s*\)/.test(f));
});

// ── Screens: dark mode ──────────────────────────────────────────────────────
const SCREENS = ['_layout.tsx', 'index.tsx', 'select.tsx', 'assessment.tsx', 'results.tsx'];
SCREENS.forEach(s => {
  const f = fs.readFileSync(path.join(ROOT, 'app', s), 'utf8');
  check(`Screen ${s} uses useColors().`, /\buseColors\(\)/.test(f));
});
const layoutFile = fs.readFileSync(path.join(ROOT, 'app/_layout.tsx'), 'utf8');
check('_layout.tsx is scheme-aware (StatusBar style toggles).', /useColorScheme|isDark/.test(layoutFile));

// ── Scoring assessment migration ────────────────────────────────────────────
const scoreAssessmentFile = fs.readFileSync(path.join(ROOT, 'src/features/assessment/scoreAssessment.ts'), 'utf8');
check('scoreAssessment imports computeScoreLiftScore.', /computeScoreLiftScore/.test(scoreAssessmentFile));
check('scoreAssessment imports estimatePercentile from externalBenchmarks.',
  /from '\.\.\/scoring\/externalBenchmarks'/.test(scoreAssessmentFile));
check('scoreAssessment NO LONGER imports staticDistributions.',
  !/staticDistributions/.test(scoreAssessmentFile));
check('scoreAssessment writes scoreLiftScore on result.', /scoreLiftScore[,:]/.test(scoreAssessmentFile));
check('scoreAssessment writes benchmarkSource on percentileEstimate.',
  /benchmarkSource/.test(scoreAssessmentFile));

// ── domainLabels: 5 v0.6 bands ──────────────────────────────────────────────
const domainLabelsFile = fs.readFileSync(path.join(ROOT, 'src/features/assessment/domainLabels.ts'), 'utf8');
check('domainLabels uses 5 v0.6 score bands.',
  ['well-above','above','on-grade','approaching','below'].every(b => domainLabelsFile.includes(`'${b}'`)));
check('domainLabels uses parent-friendly "Building foundations" (not "Needs Practice").',
  /Building foundations/.test(domainLabelsFile) && !/'Needs Practice'/.test(domainLabelsFile));

// ── PDF report ──────────────────────────────────────────────────────────────
const reportFile = fs.readFileSync(path.join(ROOT, 'src/features/reports/buildReportHtml.ts'), 'utf8');
check('PDF imports shared DOMAIN_COLORS from theme.', reportFile.includes("from '../../theme/domainColors'"));
check('PDF report uses gradient cover.', reportFile.includes('linear-gradient'));
check('PDF report references scoreLiftScore (not questionLiftIndex).',
  reportFile.includes('result.scoreLiftScore') && !/result\.questionLiftIndex/.test(reportFile));
check('PDF report references benchmarkSource for percentile callout.',
  reportFile.includes('benchmarkSource'));
check('PDF report has Mistake Map cards.', reportFile.includes('missedCard') || reportFile.includes('Mistake map'));
check('PDF report has 7-day plan section.', reportFile.includes('7-day') || reportFile.includes('Day 7'));
check('PDF report supports score lift section.', reportFile.includes('scoreLiftSection'));

// ── History service (v0.6 migration) ────────────────────────────────────────
const historyFile = fs.readFileSync(path.join(ROOT, 'src/services/historyService.ts'), 'utf8');
const historyStripped = stripComments(historyFile);
check('History defaults to OFF.', historyFile.includes('trackHistory: false'));
check('History uses scoreLiftScore (not questionLiftIndex).',
  /scoreLiftScore: number/.test(historyStripped) && !/questionLiftIndex/.test(historyStripped));
check('History ScoreLift uses previousScore/liftScore (not previousIndex/liftIndex).',
  /previousScore\?: number/.test(historyStripped) && /liftScore\?: number/.test(historyStripped)
  && !/previousIndex/.test(historyStripped) && !/liftIndex/.test(historyStripped));
check('History service exports computeScoreLift.', /export async function computeScoreLift/.test(historyFile));

// ── PDF service ─────────────────────────────────────────────────────────────
const pdfServiceFile = fs.readFileSync(path.join(ROOT, 'src/services/pdfReportService.ts'), 'utf8');
check('pdfReportService passes scoreLiftScore (not questionLiftIndex).',
  /result\.scoreLiftScore/.test(pdfServiceFile) && !/result\.questionLiftIndex/.test(pdfServiceFile));

// ── Speech util ─────────────────────────────────────────────────────────────
check('Speech util exists for KG module.', fs.existsSync(path.join(ROOT, 'src/utils/speakPrompt.ts')));
check('ageFromGrade utility exists.', fs.existsSync(path.join(ROOT, 'src/utils/ageFromGrade.ts')));

// ── Paywall (carries forward from v0.5 unchanged) ───────────────────────────
const paywallFile = fs.readFileSync(path.join(ROOT, 'src/services/paywallService.ts'), 'utf8');
check('Paywall service exports purchaseSingleTest.', paywallFile.includes('export async function purchaseSingleTest'));
check('Paywall service exports purchaseAllAccess.', paywallFile.includes('export async function purchaseAllAccess'));
check('Paywall service exports restorePurchases.', paywallFile.includes('export async function restorePurchases'));
check('Paywall service exports isUnlocked.', paywallFile.includes('export async function isUnlocked'));
check('Paywall has $2.99 single-test price.', paywallFile.includes("priceLabel: '$2.99'"));
check('Paywall has $14.99 all-access price.', paywallFile.includes("priceLabel: '$14.99'"));

const paywallModalFile = fs.readFileSync(path.join(ROOT, 'src/components/PaywallModal.tsx'), 'utf8');
check('PaywallModal has Restore Purchases.', paywallModalFile.includes('Restore purchases'));
check('PaywallModal has BEST VALUE badge.', paywallModalFile.includes('BEST VALUE'));

// ── Notifications ───────────────────────────────────────────────────────────
const notificationFile = fs.readFileSync(path.join(ROOT, 'src/services/notificationService.ts'), 'utf8');
check('Notification service exports scheduleDay7Reminder.', notificationFile.includes('export async function scheduleDay7Reminder'));
check('Notification service exports cancelDay7Reminder.', notificationFile.includes('export async function cancelDay7Reminder'));
check('Notification service is privacy-respecting.', notificationFile.includes('settings.trackHistory'));

// ── SpatialVisual (v0.6 dark-mode adaptation) ───────────────────────────────
const spatialFile = fs.readFileSync(path.join(ROOT, 'src/components/SpatialVisual.tsx'), 'utf8');
['cube', 'grid-3', 'mirror-letter', 'mirror-arrow', 'shape', 'count-stars'].forEach(t => {
  const isValidIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(t);
  const found = spatialFile.includes(`'${t}':`) || (isValidIdentifier && new RegExp(`(?:^|\\s|,|{)${t}\\s*:`).test(spatialFile));
  check(`SpatialVisual supports "${t}" type.`, found);
});
check('SpatialVisual has dark-mode VisualColors variant.', /darkVisual/.test(spatialFile) && /lightVisual/.test(spatialFile));

const visualTypeMatches = (templatesFile.match(/visualType:\s*'/g) || []).length;
check('At least 6 templates have visualType set.', visualTypeMatches >= 6, `${visualTypeMatches} found`);
check('AssessmentQuestion type supports visualType.', typesFile.includes('visualType?:'));

// ── Celebration screen ──────────────────────────────────────────────────────
check('Celebration screen exists.', fs.existsSync(path.join(ROOT, 'app/celebration.tsx')));
const celebFile = fs.readFileSync(path.join(ROOT, 'app/celebration.tsx'), 'utf8');
check('Celebration counts up percent.', celebFile.includes('displayPercent'));
check('Celebration forwards to /results.', celebFile.includes("pathname: '/results'"));
check('Celebration is registered in stack.', layoutFile.includes('"celebration"') || layoutFile.includes("'celebration'") || layoutFile.includes('name="celebration"'));

// ── Assessment integration: adaptive ───────────────────────────────────────
const assessmentFile = fs.readFileSync(path.join(ROOT, 'app/assessment.tsx'), 'utf8');
check('Assessment imports SpatialVisual.', assessmentFile.includes('SpatialVisual'));
check('Assessment supports sampleSize param.', assessmentFile.includes('sampleSize'));
check('Assessment routes to /celebration after final question.', assessmentFile.includes("pathname: '/celebration'"));
check('Assessment imports adaptiveSelector.',
  /pickInitialQuestion/.test(assessmentFile) && /pickNextQuestion/.test(assessmentFile));
check('Assessment tracks AdaptiveAnswerHistory.', /AdaptiveAnswerHistory/.test(assessmentFile));
check('Assessment uses presentationOrder for adaptive routing.', /presentationOrder/.test(assessmentFile));

// ── Results integration ─────────────────────────────────────────────────────
const resultsFile = fs.readFileSync(path.join(ROOT, 'app/results.tsx'), 'utf8');
check('Results imports PaywallModal.', resultsFile.includes('PaywallModal'));
check('Results imports isUnlocked from paywall service.', resultsFile.includes('isUnlocked'));
check('Results schedules Day 7 reminder.', resultsFile.includes('scheduleDay7Reminder'));
check('Results cancels Day 7 reminder on early retake.', resultsFile.includes('cancelDay7Reminder'));
// v0.8: Mistakes/Plan tabs now render a TeaserOverlay when locked (blurred
// preview + unlock CTA) instead of forcing the paywall on tab tap.
check('Results gates Mistakes/Plan tabs behind unlock.',
  resultsFile.includes('TeaserOverlay') &&
  /locked=\{!unlocked\}/.test(resultsFile));
check('Results gates PDF export behind unlock.', resultsFile.includes('!unlocked) { setPaywallVisible(true)'));
check('Results shows inline upsell card on Score tab when locked.', resultsFile.includes('upsellCard'));
check('Quick Start (sampleSize) skips paywall.', resultsFile.includes('isQuickStart'));
check('Results uses scoreLiftScore (not questionLiftIndex).',
  /result\.scoreLiftScore/.test(resultsFile) && !/result\.questionLiftIndex/.test(resultsFile));
check('Results has lead score tile (36px font).',
  /leadValue/.test(resultsFile) && /fontSize: 36/.test(resultsFile));
check('Results percentile tile cites benchmark source.',
  /benchmarkShort/.test(resultsFile) && /vs\.\s*\{benchmarkShort\}/.test(resultsFile));
check('Results uses useDomainColor and useBandStyle hooks.',
  /useDomainColor\(\)/.test(resultsFile) && /useBandStyle\(\)/.test(resultsFile));

// ── Home Quick Start uses sampleSize=10 ─────────────────────────────────────
const homeFile = fs.readFileSync(path.join(ROOT, 'app/index.tsx'), 'utf8');
check("Home Quick Start passes sampleSize: '10'.", homeFile.includes("sampleSize: '10'"));
check('Home uses Mascot component.', /Mascot/.test(homeFile));
check('Home uses Decoration component.', /Decoration/.test(homeFile));

// ── No legacy questionLiftIndex anywhere in src/ or app/ (in non-comment code) ──
function walkTs(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    fs.readdirSync(cur, { withFileTypes: true }).forEach(d => {
      const p = path.join(cur, d.name);
      if (d.isDirectory()) stack.push(p);
      else if (/\.(ts|tsx)$/.test(d.name)) out.push(p);
    });
  }
  return out;
}
function stripComments(src) {
  // Remove block comments
  src = src.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove line comments
  src = src.replace(/^[^\n]*\/\/[^\n]*$/gm, m => m.replace(/\/\/[^\n]*$/, ''));
  return src;
}
let lingeringIndex = [];
[...walkTs(path.join(ROOT, 'src')), ...walkTs(path.join(ROOT, 'app'))].forEach(p => {
  const src = fs.readFileSync(p, 'utf8');
  const stripped = stripComments(src);
  if (/questionLiftIndex/.test(stripped)) lingeringIndex.push(path.relative(ROOT, p));
});
check('No non-comment questionLiftIndex anywhere in src/ or app/.',
  lingeringIndex.length === 0,
  lingeringIndex.length > 0 ? lingeringIndex.join(', ') : 'clean');

// ── No "Needs Practice" copy in app/screens (replaced with parent-friendly) ──
let needsPracticeHits = [];
[...walkTs(path.join(ROOT, 'src')), ...walkTs(path.join(ROOT, 'app'))].forEach(p => {
  const src = fs.readFileSync(p, 'utf8');
  if (/'Needs Practice'/.test(src)) needsPracticeHits.push(path.relative(ROOT, p));
});
check('No "Needs Practice" stigma copy in src/ or app/.',
  needsPracticeHits.length === 0,
  needsPracticeHits.length > 0 ? needsPracticeHits.join(', ') : 'clean');

// ── Typography pass complete ────────────────────────────────────────────────
let badWeightCount = 0;
['app', 'src/components'].forEach(dir => {
  fs.readdirSync(path.join(ROOT, dir)).forEach(f => {
    if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      const c = fs.readFileSync(path.join(ROOT, dir, f), 'utf8');
      const matches900 = (c.match(/fontWeight: '900'/g) || []).length;
      const matches800 = (c.match(/fontWeight: '800'/g) || []).length;
      badWeightCount += matches900 + matches800;
    }
  });
});
check('Typography pass complete: no fontWeight 800/900 anywhere.',
  badWeightCount === 0,
  badWeightCount > 0 ? `${badWeightCount} occurrences` : 'all 600/700');

// ── Files exist ─────────────────────────────────────────────────────────────
['pdfReportService.ts', 'privacyWipeService.ts', 'historyService.ts', 'paywallService.ts', 'notificationService.ts'].forEach(s => {
  check(`src/services/${s} exists.`, fs.existsSync(path.join(ROOT, 'src/services', s)));
});
['_layout.tsx', 'index.tsx', 'select.tsx', 'assessment.tsx', 'celebration.tsx', 'results.tsx'].forEach(screen => {
  check(`app/${screen} exists.`, fs.existsSync(path.join(ROOT, 'app', screen)));
});

// ── No legacy brands ────────────────────────────────────────────────────────
['BrightWit', 'BrightSpark', 'SparkIQ', 'MindSpark'].forEach(brand => {
  check(`No legacy brand "${brand}".`, !templatesFile.includes(brand) && !blueprintsFile.includes(brand));
});

// ── Package version ─────────────────────────────────────────────────────────
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
check('package.json version is 0.6.0.', pkg.version === '0.6.0', pkg.version);
check('package.json includes expo-notifications.', !!pkg.dependencies['expo-notifications']);
check('package.json includes react-native-svg.', !!pkg.dependencies['react-native-svg']);
check('package.json includes async-storage.', !!pkg.dependencies['@react-native-async-storage/async-storage']);

// ── v0.7 content review checks ──────────────────────────────────────────────
check('SpatialVisual supports "dot-compare" type.', spatialFile.includes("'dot-compare'"));
check('NAME_POOL exists in questionTemplates.', templatesFile.includes('NAME_POOL'));
check('randomName helper exists.', templatesFile.includes('function randomName'));
check('rc-passage-inference-v7 template exists.', templatesFile.includes("'rc-passage-inference-v7'"));
check('rc-passage-detail-v7 template exists.', templatesFile.includes("'rc-passage-detail-v7'"));
check('kg-parent-observe-readiness-v7 template exists.', templatesFile.includes("'kg-parent-observe-readiness-v7'"));
check('kg-shape-identify-v7 template exists.', templatesFile.includes("'kg-shape-identify-v7'"));
check('reading-simile-v7 template exists.', templatesFile.includes("'reading-simile-v7'"));
check('stem-classify-life-science no longer restates the answer.',
  !/(explanationSteps:\s*\[\s*`?\$\{q\.answer\}`?\s*\])/.test(templatesFile));
check('military-mechanical-leverage no longer restates the answer.',
  !/(explanationSteps:\s*\[\s*s\.answer\s*\])/.test(templatesFile));
check('kg-compare-numbers uses dot-compare visual.',
  /id:\s*'kg-compare-numbers'[\s\S]{0,1500}visualType:\s*'dot-compare'/.test(templatesFile));
check('kg-vocabulary-body now teaches beginning letter sounds.',
  /id:\s*'kg-vocabulary-body'[\s\S]{0,800}Which letter does the word/.test(templatesFile));

// ── Summary ─────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(50));
if (allPassed) {
  console.log('\x1b[32m\nALL CHECKS PASSED — v0.7 content pass is ready.\x1b[0m\n');
} else {
  console.log('\x1b[31m\nSOME CHECKS FAILED — fix errors above before shipping.\x1b[0m\n');
  process.exit(1);
}
