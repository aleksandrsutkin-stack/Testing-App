// src/config/brand.ts
// v0.6: ScoreLift Score (1–100) replaces the old QuestionLiftIQ Index (70–130).
// Percentile language is now directional and references public norm tables.

export const BRAND = {
  appName: 'QuizLift',
  scoreReportName: 'ScoreLift Report',
  // v0.6: NEW name. Was: productIndexName (QuestionLiftIQ Index).
  productScoreName: 'ScoreLift Score',
  scoreScaleNote: '1–100, 50 = on-grade-level expected performance',
  tagline: 'Every miss becomes a lesson.',
  shortPromise: 'Short diagnostics with percent scores, estimated percentile ranges, mistake maps, step-by-step solutions, and targeted practice links.',
  supportEmail: 'support@quizlift.app',
  privacyPromise: 'No account. No ads. No server-stored results. Export a PDF, then erase the session.',
  // v0.8: App Store Connect requires a public privacy policy and a support
  // URL. These point at static pages on the marketing site. REPLACE the host
  // if your final domain differs.
  privacyPolicyUrl: 'https://quizlift.app/privacy',
  termsOfServiceUrl: 'https://quizlift.app/terms',
  supportUrl: 'https://quizlift.app/support',
  legalName: 'Your Company LLC',
  // v0.6: now references public norm tables (NWEA MAP, ASVAB AFQT, etc.)
  percentileCaveat: 'Estimated percentile ranges are directional comparisons against published norm tables (such as NWEA MAP and ASVAB AFQT). They are not nationally normed scores for QuizLift.',
  // v0.6: 5-band labels (parent-friendly, no "Needs Practice" stigma).
  scoreBandCopy: {
    'well-above': 'Well above grade',
    'above': 'Above grade',
    'on-grade': 'On grade level',
    'approaching': 'Approaching grade',
    'below': 'Building foundations'
  }
} as const;
