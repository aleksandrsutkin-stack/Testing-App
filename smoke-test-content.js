// scripts/smoke-test-content.js
// Run: node scripts/smoke-test-content.js
//
// v0.5 checks: everything from v0.4 plus paywall service, notifications,
// SpatialVisual component, celebration screen, Quick Start sampleSize wiring,
// and visualType set on at least 4 spatial templates.

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

console.log('\nQuestionLiftIQ v0.5 smoke test\n');

// ── Brand ────────────────────────────────────────────────────────────────────
const brandFile = fs.readFileSync(path.join(ROOT, 'src/config/brand.ts'), 'utf8');
check('Brand name is QuestionLiftIQ.', brandFile.includes("appName: 'QuestionLiftIQ'"));
check('No legacy BrightWit/BrightSpark references in brand.', !brandFile.includes('BrightWit') && !brandFile.includes('BrightSpark'));

// ── Test IDs ─────────────────────────────────────────────────────────────────
const typesFile = fs.readFileSync(path.join(ROOT, 'src/features/assessment/types.ts'), 'utf8');
const ALL_TEST_IDS = [
  'questionliftiq-aptitude-snapshot', 'compacted-math-readiness',
  'double-compacted-algebra-readiness', 'grade-math-skills-check',
  'reading-vocabulary-snapshot', 'stem-spatial-reasoning',
  'coding-logic-sprint', 'kindergarten-readiness', 'military-aptitude-practice'
];
ALL_TEST_IDS.forEach(id => check(`TestId includes ${id}.`, typesFile.includes(`'${id}'`)));

// ── Blueprints ───────────────────────────────────────────────────────────────
const blueprintsFile = fs.readFileSync(path.join(ROOT, 'src/data/testBlueprints.ts'), 'utf8');
ALL_TEST_IDS.forEach(id => check(`Blueprint exists for ${id}.`, blueprintsFile.includes(`'${id}'`)));
const totalQMatches = [...blueprintsFile.matchAll(/totalQuestions:\s*(\d+)/g)];
check('All blueprints target 20+ questions per session.',
  totalQMatches.every(m => Number(m[1]) >= 20),
  `Found targets: ${totalQMatches.map(m => m[1]).join(', ')}`);

// ── Templates ────────────────────────────────────────────────────────────────
const templatesFile = fs.readFileSync(path.join(ROOT, 'src/data/questionTemplates.ts'), 'utf8');
const templateCount = (templatesFile.match(/ct\(\{/g) || []).length;
check('80+ question templates in combined file.', templateCount >= 80, `${templateCount} templates`);
const templateIds = [...templatesFile.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]);
const uniqueIds = new Set(templateIds);
check('All template IDs are unique.', uniqueIds.size === templateIds.length, `${uniqueIds.size} unique`);

// ── Static distributions ─────────────────────────────────────────────────────
const distFile = fs.readFileSync(path.join(ROOT, 'src/features/scoring/staticDistributions.ts'), 'utf8');
ALL_TEST_IDS.forEach(id => check(`Static distribution exists for ${id}.`, distFile.includes(`'${id}'`)));

// ── PDF report ───────────────────────────────────────────────────────────────
const reportFile = fs.readFileSync(path.join(ROOT, 'src/features/reports/buildReportHtml.ts'), 'utf8');
check('PDF imports shared DOMAIN_COLORS from theme.', reportFile.includes("from '../../theme/domainColors'"));
check('PDF report uses gradient cover.', reportFile.includes('linear-gradient'));
check('PDF report has Mistake Map cards.', reportFile.includes('missedCard') || reportFile.includes('Mistake map'));
check('PDF report has 7-day plan section.', reportFile.includes('7-day') || reportFile.includes('Day 7'));
check('PDF report supports score lift section.', reportFile.includes('scoreLiftSection'));

// ── Shared theme ─────────────────────────────────────────────────────────────
check('Shared domain colors theme exists.', fs.existsSync(path.join(ROOT, 'src/theme/domainColors.ts')));

// ── History service (from v0.4) ──────────────────────────────────────────────
const historyFile = fs.readFileSync(path.join(ROOT, 'src/services/historyService.ts'), 'utf8');
check('History defaults to OFF.', historyFile.includes('trackHistory: false'));
check('History service exports computeScoreLift.', historyFile.includes('export async function computeScoreLift'));

// ── Speech util ──────────────────────────────────────────────────────────────
check('Speech util exists for KG module.', fs.existsSync(path.join(ROOT, 'src/utils/speakPrompt.ts')));

// ── ageFromGrade ─────────────────────────────────────────────────────────────
check('ageFromGrade utility exists.', fs.existsSync(path.join(ROOT, 'src/utils/ageFromGrade.ts')));

// ── v0.5: Paywall ────────────────────────────────────────────────────────────
check('Paywall service exists.', fs.existsSync(path.join(ROOT, 'src/services/paywallService.ts')));
const paywallFile = fs.readFileSync(path.join(ROOT, 'src/services/paywallService.ts'), 'utf8');
check('Paywall service exports purchaseSingleTest.', paywallFile.includes('export async function purchaseSingleTest'));
check('Paywall service exports purchaseAllAccess.', paywallFile.includes('export async function purchaseAllAccess'));
check('Paywall service exports restorePurchases.', paywallFile.includes('export async function restorePurchases'));
check('Paywall service exports isUnlocked.', paywallFile.includes('export async function isUnlocked'));
check('Paywall has $2.99 single-test price.', paywallFile.includes("priceLabel: '$2.99'"));
check('Paywall has $14.99 all-access price.', paywallFile.includes("priceLabel: '$14.99'"));

check('PaywallModal component exists.', fs.existsSync(path.join(ROOT, 'src/components/PaywallModal.tsx')));
const paywallModalFile = fs.readFileSync(path.join(ROOT, 'src/components/PaywallModal.tsx'), 'utf8');
check('PaywallModal has Restore Purchases.', paywallModalFile.includes('Restore purchases'));
check('PaywallModal has BEST VALUE badge.', paywallModalFile.includes('BEST VALUE'));

// ── v0.5: Notifications ──────────────────────────────────────────────────────
check('Notification service exists.', fs.existsSync(path.join(ROOT, 'src/services/notificationService.ts')));
const notificationFile = fs.readFileSync(path.join(ROOT, 'src/services/notificationService.ts'), 'utf8');
check('Notification service exports scheduleDay7Reminder.', notificationFile.includes('export async function scheduleDay7Reminder'));
check('Notification service exports cancelDay7Reminder.', notificationFile.includes('export async function cancelDay7Reminder'));
check('Notification service is privacy-respecting.', notificationFile.includes('settings.trackHistory'));

// ── v0.5: SpatialVisual ──────────────────────────────────────────────────────
check('SpatialVisual component exists.', fs.existsSync(path.join(ROOT, 'src/components/SpatialVisual.tsx')));
const spatialFile = fs.readFileSync(path.join(ROOT, 'src/components/SpatialVisual.tsx'), 'utf8');
['cube', 'grid-3', 'mirror-letter', 'mirror-arrow', 'shape', 'count-stars'].forEach(t => {
  // Object keys in JS can be quoted or unquoted (when valid identifiers).
  // 'cube' and 'shape' are unquoted; 'grid-3', 'mirror-letter' etc. must be quoted.
  const isValidIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(t);
  const found = spatialFile.includes(`'${t}':`) || (isValidIdentifier && new RegExp(`(?:^|\\s|,|{)${t}\\s*:`).test(spatialFile));
  check(`SpatialVisual supports "${t}" type.`, found);
});

const visualTypeMatches = (templatesFile.match(/visualType:\s*'/g) || []).length;
check(`At least 4 templates have visualType set.`, visualTypeMatches >= 4, `${visualTypeMatches} found`);
check('AssessmentQuestion type supports visualType.', typesFile.includes("visualType?:"));

// ── v0.5: Celebration screen ─────────────────────────────────────────────────
check('Celebration screen exists.', fs.existsSync(path.join(ROOT, 'app/celebration.tsx')));
const celebFile = fs.readFileSync(path.join(ROOT, 'app/celebration.tsx'), 'utf8');
check('Celebration counts up percent.', celebFile.includes('displayPercent'));
check('Celebration forwards to /results.', celebFile.includes("pathname: '/results'"));
const layoutFile = fs.readFileSync(path.join(ROOT, 'app/_layout.tsx'), 'utf8');
check('Celebration is registered in stack.', layoutFile.includes('"celebration"') || layoutFile.includes("'celebration'") || layoutFile.includes('name="celebration"'));

// ── v0.5: Assessment integration ─────────────────────────────────────────────
const assessmentFile = fs.readFileSync(path.join(ROOT, 'app/assessment.tsx'), 'utf8');
check('Assessment imports SpatialVisual.', assessmentFile.includes('SpatialVisual'));
check('Assessment supports sampleSize param.', assessmentFile.includes('sampleSize'));
check('Assessment routes to /celebration after final question.', assessmentFile.includes("pathname: '/celebration'"));

// ── v0.5: Results integration ────────────────────────────────────────────────
const resultsFile = fs.readFileSync(path.join(ROOT, 'app/results.tsx'), 'utf8');
check('Results imports PaywallModal.', resultsFile.includes('PaywallModal'));
check('Results imports isUnlocked from paywall service.', resultsFile.includes('isUnlocked'));
check('Results schedules Day 7 reminder.', resultsFile.includes('scheduleDay7Reminder'));
check('Results cancels Day 7 reminder on early retake.', resultsFile.includes('cancelDay7Reminder'));
check('Results gates Mistakes/Plan tabs behind unlock.', resultsFile.includes('!unlocked') && resultsFile.includes("tab === 'mistakes' || tab === 'plan'"));
check('Results gates PDF export behind unlock.', resultsFile.includes('!unlocked) { setPaywallVisible(true)'));
check('Results shows inline upsell card on Score tab when locked.', resultsFile.includes('upsellCard'));
check('Quick Start (sampleSize) skips paywall.', resultsFile.includes('isQuickStart'));

// ── v0.5: Home Quick Start uses sampleSize=10 ────────────────────────────────
const homeFile = fs.readFileSync(path.join(ROOT, 'app/index.tsx'), 'utf8');
check("Home Quick Start passes sampleSize: '10'.", homeFile.includes("sampleSize: '10'"));

// ── Typography pass complete ─────────────────────────────────────────────────
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

// ── Files exist ──────────────────────────────────────────────────────────────
['pdfReportService.ts', 'privacyWipeService.ts', 'historyService.ts', 'paywallService.ts', 'notificationService.ts'].forEach(s => {
  check(`src/services/${s} exists.`, fs.existsSync(path.join(ROOT, 'src/services', s)));
});
['_layout.tsx', 'index.tsx', 'select.tsx', 'assessment.tsx', 'celebration.tsx', 'results.tsx'].forEach(screen => {
  check(`app/${screen} exists.`, fs.existsSync(path.join(ROOT, 'app', screen)));
});

// ── No legacy brands ─────────────────────────────────────────────────────────
['BrightWit', 'BrightSpark', 'SparkIQ', 'MindSpark'].forEach(brand => {
  check(`No legacy brand "${brand}".`, !templatesFile.includes(brand) && !blueprintsFile.includes(brand));
});

// ── Package version ──────────────────────────────────────────────────────────
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
check('package.json version is 0.5.0.', pkg.version === '0.5.0', pkg.version);
check('package.json includes expo-notifications.', !!pkg.dependencies['expo-notifications']);
check('package.json includes react-native-svg.', !!pkg.dependencies['react-native-svg']);
check('package.json includes async-storage.', !!pkg.dependencies['@react-native-async-storage/async-storage']);

// ── Summary ──────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(50));
if (allPassed) {
  console.log('\x1b[32m\nALL CHECKS PASSED — v0.5 is ready.\x1b[0m\n');
} else {
  console.log('\x1b[31m\nSOME CHECKS FAILED — fix errors above before shipping.\x1b[0m\n');
  process.exit(1);
}
