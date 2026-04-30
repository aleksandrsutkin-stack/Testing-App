// src/features/reports/buildReportHtml.ts
//
// v0.6 — major migration:
//   - Cover lead metric is now the ScoreLift Score (1–100), not the old IQ-style
//     QuestionLiftIQ Index (70–130). The pill below it shows the readiness band.
//   - Percentile section cites the benchmark source (e.g. "vs. NWEA MAP grade
//     norms") and uses the per-test caveat from result.percentileEstimate.
//   - PdfScoreLift uses previousScore / liftScore (was: previousIndex / liftIndex).
//   - PDF is intentionally light-mode only — keeps the print/share artefact
//     readable everywhere.
//
// Sections:
//   Cover → Score Lift (if provided) → Score Summary → Domain Profile →
//   Strengths & Growth → Mistake Map → 7-Day Plan → Footer

import { BRAND } from '../../config/brand';
import { AssessmentResult, MissedQuestionReview, PracticeAssignment } from '../assessment/types';
import { scoreBandLabels } from '../assessment/domainLabels';
import { DOMAIN_COLORS, BAND_COLORS } from '../../theme/domainColors';

function esc(v: string): string {
  return String(v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function gradeLabel(g: number): string {
  if (g < 0) return 'Pre-K';
  if (g === 0) return 'Kindergarten';
  if (g <= 12) return `Grade ${g}`;
  return 'Adult / Post-secondary';
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function domainColor(domain: string): string {
  return (DOMAIN_COLORS as Record<string, string>)[domain] ?? '#4F46E5';
}

function bandStyle(band: string) {
  return (BAND_COLORS as Record<string, typeof BAND_COLORS['on-grade']>)[band] ?? BAND_COLORS['on-grade'];
}

// Short-name a verbose benchmark source for the cover badge.
function benchmarkShortName(source: string | undefined): string {
  if (!source) return 'Public norm';
  if (source.includes('NWEA MAP')) return 'NWEA MAP';
  if (source.includes('IAAT') || source.includes('Iowa Algebra')) return 'IAAT';
  if (source.includes('DAT-5') || source.includes('Differential Aptitude')) return 'DAT-5';
  if (source.includes('BRACKEN')) return 'BRACKEN-3';
  if (source.includes('AFQT') || source.includes('ASVAB')) return 'ASVAB AFQT';
  return source.split(' ').slice(0, 3).join(' ');
}

// ─── Optional ScoreLift type for PDF (mirrors historyService) ────────────────

export interface PdfScoreLift {
  hasPrevious: boolean;
  previousPercent?: number;
  // v0.6: ScoreLift Score (1–100). Was: previousIndex (70–130).
  previousScore?: number;
  previousDate?: string;
  liftPercent?: number;
  // v0.6: Delta in ScoreLift Score. Was: liftIndex.
  liftScore?: number;
}

// ─── Domain rows ─────────────────────────────────────────────────────────────

function domainRows(result: AssessmentResult): string {
  return result.domainScores.map(score => {
    const pct = Math.round(score.percent * 100);
    const color = domainColor(score.domain);
    const bs = bandStyle(score.band);
    return `
      <tr>
        <td style="vertical-align:middle;padding:10px 12px;">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:6px;vertical-align:middle;"></span>
          <strong style="font-size:13px;">${esc(score.label)}</strong>
        </td>
        <td style="vertical-align:middle;padding:10px 8px;text-align:center;font-size:13px;color:#374151;">${score.rawScore}/${score.maxScore}</td>
        <td style="vertical-align:middle;padding:10px 12px;width:40%;">
          <div style="height:10px;border-radius:999px;background:#E5E7EB;overflow:hidden;">
            <div style="width:${pct}%;height:100%;background:${color};border-radius:999px;"></div>
          </div>
        </td>
        <td style="vertical-align:middle;padding:10px 8px;text-align:center;font-size:14px;font-weight:600;color:${color};">${pct}%</td>
        <td style="vertical-align:middle;padding:10px 8px;">
          <span style="display:inline-block;font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px;background:${bs.bg};color:${bs.text};border:1px solid ${bs.border};">${esc(scoreBandLabels[score.band])}</span>
        </td>
      </tr>`;
  }).join('');
}

// ─── Missed question cards ───────────────────────────────────────────────────

function missedCard(miss: MissedQuestionReview, index: number): string {
  const steps = miss.explanationSteps.map((step, i) => `
    <div style="display:flex;gap:12px;margin-bottom:10px;align-items:flex-start;">
      <div style="min-width:24px;height:24px;border-radius:50%;background:${domainColor(miss.domain)};color:#fff;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;">${i + 1}</div>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#374151;">${esc(step)}</p>
    </div>`).join('');

  const khanLinks = miss.practiceLinks.map(link => `
    <a href="${esc(link.url)}" style="display:inline-block;margin:4px 4px 4px 0;padding:6px 14px;border-radius:8px;border:1px solid #C7D2FE;background:#EEF2FF;color:#3730A3;font-size:12px;font-weight:600;text-decoration:none;">
      ${esc(link.label)} →
    </a>`).join('');

  const color = domainColor(miss.domain);

  return `
    <div style="border:1px solid #E5E7EB;border-radius:16px;padding:20px;margin-bottom:16px;page-break-inside:avoid;break-inside:avoid;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
        <span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:${color};">
          Missed #${index + 1} &nbsp;·&nbsp; ${esc(miss.domainLabel)} &nbsp;·&nbsp; ${esc(miss.mistakeTypeLabel)}
        </span>
      </div>
      <p style="font-size:15px;font-weight:600;color:#111827;margin:0 0 14px;line-height:1.5;">${esc(miss.prompt)}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
        <div style="padding:10px 14px;border-radius:10px;background:#FEF2F2;border:1px solid #FECACA;">
          <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#9B1C1C;margin-bottom:4px;">Your answer</div>
          <div style="font-size:13px;color:#7F1D1D;font-weight:600;">${esc(miss.selectedAnswerLabel)}</div>
        </div>
        <div style="padding:10px 14px;border-radius:10px;background:#F0FDF4;border:1px solid #86EFAC;">
          <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#14532D;margin-bottom:4px;">Correct answer</div>
          <div style="font-size:13px;color:#166534;font-weight:600;">${esc(miss.correctAnswerLabel)}</div>
        </div>
      </div>
      ${miss.commonTrap ? `
        <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:10px 14px;margin-bottom:14px;">
          <span style="font-size:11px;font-weight:600;color:#92400E;text-transform:uppercase;letter-spacing:0.04em;">Common trap: </span>
          <span style="font-size:13px;color:#78350F;">${esc(miss.commonTrap)}</span>
        </div>` : ''}
      <div style="background:#F8FAFC;border-radius:10px;padding:14px;margin-bottom:14px;">
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#6B7280;margin-bottom:12px;">Step-by-step solution</div>
        ${steps}
      </div>
      <div>
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#6B7280;margin-bottom:8px;">Practice this skill</div>
        ${khanLinks}
      </div>
    </div>`;
}

// ─── 7-day plan rows ─────────────────────────────────────────────────────────

function planRows(assignments: PracticeAssignment[]): string {
  const dayLabels = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6'];
  const timeLabels = ['10–15 min', '10–15 min', '10–15 min', '10–15 min', '10–15 min', '15–20 min'];
  return assignments.slice(0, 6).map((a, i) => `
    <tr style="background:${i % 2 === 0 ? '#F9FAFB' : '#FFFFFF'};">
      <td style="padding:10px 12px;font-size:12px;font-weight:600;color:#374151;white-space:nowrap;">${dayLabels[i]}</td>
      <td style="padding:10px 12px;font-size:11px;color:#6B7280;white-space:nowrap;">${timeLabels[i]}</td>
      <td style="padding:10px 12px;">
        <strong style="font-size:13px;color:#111827;">${esc(a.title)}</strong><br />
        <span style="font-size:12px;color:#6B7280;">${esc(a.reason)}</span>
      </td>
      <td style="padding:10px 12px;">
        <a href="${esc(a.url)}" style="font-size:12px;color:#4F46E5;font-weight:600;">${esc(a.url.replace('https://www.khanacademy.org', 'khanacademy.org').replace('https://khanacademy.org', 'khanacademy.org'))}</a>
      </td>
    </tr>`).join('');
}

// ─── Score-lift section (v0.6 — uses scoreLiftScore) ─────────────────────────

function scoreLiftSection(lift: PdfScoreLift | undefined, currentPercent: number, currentScore: number): string {
  if (!lift || !lift.hasPrevious) return '';

  const liftPct = lift.liftPercent ?? 0;
  const liftScoreDelta = lift.liftScore ?? 0;
  const direction = liftPct > 0 ? 'up' : liftPct < 0 ? 'down' : 'flat';
  const tone = direction === 'up'
    ? { bg: '#ECFDF5', border: '#6EE7B7', text: '#065F46', accent: '#10B981', label: 'Score lift!' }
    : direction === 'down'
    ? { bg: '#FEF2F2', border: '#FCA5A5', text: '#991B1B', accent: '#EF4444', label: 'Down from last attempt' }
    : { bg: '#F1F5F9', border: '#CBD5E1', text: '#475569', accent: '#64748B', label: 'Same as last attempt' };

  const sign = liftPct > 0 ? '+' : '';
  const scoreSign = liftScoreDelta > 0 ? '+' : '';
  const prevPct = Math.round((lift.previousPercent ?? 0) * 100);
  const currentPctRounded = Math.round(currentPercent * 100);
  const prevDate = lift.previousDate ? new Date(lift.previousDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

  return `
    <div class="section">
      <h2>Your progress</h2>
      <div style="background:${tone.bg};border:1px solid ${tone.border};border-radius:14px;padding:18px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
          <div>
            <div style="font-size:14px;font-weight:700;color:${tone.text};">${tone.label}</div>
            <div style="font-size:12px;color:${tone.text};opacity:0.8;margin-top:2px;">Last attempt ${esc(prevDate)} · ${prevPct}%</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:24px;font-weight:700;color:${tone.text};">${sign}${liftPct}%</div>
            <div style="font-size:11px;color:${tone.text};opacity:0.8;">${scoreSign}${liftScoreDelta} ScoreLift Score</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:14px;border-top:1px solid ${tone.border};padding-top:12px;">
          <div style="flex:1;text-align:center;">
            <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:${tone.text};opacity:0.7;">Then</div>
            <div style="font-size:22px;font-weight:700;color:${tone.text};margin-top:2px;">${prevPct}%</div>
          </div>
          <div style="font-size:22px;color:${tone.accent};font-weight:700;">→</div>
          <div style="flex:1;text-align:center;">
            <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:${tone.text};opacity:0.7;">Now</div>
            <div style="font-size:22px;font-weight:700;color:${tone.text};margin-top:2px;">${currentPctRounded}%</div>
          </div>
        </div>
      </div>
    </div>`;
}

// ─── Main HTML builder ───────────────────────────────────────────────────────

export function buildReportHtml(result: AssessmentResult, lift?: PdfScoreLift): string {
  const pct = Math.round(result.percent * 100);
  const bs = bandStyle(result.readinessBand);
  const benchShort = benchmarkShortName(result.percentileEstimate.benchmarkSource);

  const missedSection = result.missedQuestions.length === 0
    ? `<div style="background:#F0FDF4;border:1px solid #86EFAC;border-radius:12px;padding:16px 20px;text-align:center;">
         <p style="margin:0;color:#166534;font-size:14px;font-weight:600;">No missed questions this session.</p>
         <p style="margin:6px 0 0;color:#166534;font-size:13px;">Use the 7-day plan below to keep skills sharp.</p>
       </div>`
    : result.missedQuestions.map((miss, i) => missedCard(miss, i)).join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${esc(result.testTitle)} — ${esc(BRAND.scoreReportName)}</title>
  <style>
    @page { margin: 28px 32px; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif; color: #111827; background: #FFFFFF; line-height: 1.5; margin: 0; padding: 0; font-size: 14px; }
    a { color: #4F46E5; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; }
    h2 { font-size: 18px; font-weight: 700; color: #111827; margin: 28px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #E5E7EB; }
    h3 { font-size: 15px; font-weight: 600; margin: 0 0 8px; }
    p { margin: 0 0 10px; }
    ul { margin: 0; padding-left: 20px; }
    li { margin-bottom: 6px; font-size: 13px; color: #374151; }
    .section { margin-bottom: 28px; }
    .muted { color: #6B7280; }
  </style>
</head>
<body>

<!-- ── COVER ────────────────────────────────────────────────────────────── -->
<div style="background:linear-gradient(135deg,#1E1B4B 0%,#312E81 60%,#4338CA 100%);border-radius:20px;padding:32px;margin-bottom:28px;color:#fff;">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;">
    <div>
      <div style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#A5B4FC;margin-bottom:6px;">
        ${esc(BRAND.appName)} &nbsp;·&nbsp; ${esc(BRAND.scoreReportName)}
      </div>
      <div style="font-size:26px;font-weight:700;line-height:1.2;margin-bottom:6px;">${esc(result.testTitle)}</div>
      <div style="font-size:13px;color:#C7D2FE;">Age ${result.age} &nbsp;·&nbsp; ${esc(gradeLabel(result.grade))} &nbsp;·&nbsp; ${esc(formatDate(result.completedAtIso))}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:#A5B4FC;margin-bottom:4px;">${esc(BRAND.productScoreName)}</div>
      <div style="font-size:52px;font-weight:700;line-height:1;color:#fff;">${result.scoreLiftScore}</div>
      <div style="font-size:11px;color:#C7D2FE;margin-top:2px;">${esc(result.scoreLiftScoreLabel)} &nbsp;·&nbsp; 1–100, 50 = on grade</div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:24px;">
    <div style="background:rgba(255,255,255,0.12);border-radius:14px;padding:14px;">
      <div style="font-size:10px;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;color:#A5B4FC;margin-bottom:6px;">Percent correct</div>
      <div style="font-size:32px;font-weight:700;color:#fff;">${pct}%</div>
      <div style="font-size:12px;color:#C7D2FE;">${result.rawScore}/${result.maxScore} questions</div>
    </div>
    <div style="background:rgba(255,255,255,0.12);border-radius:14px;padding:14px;">
      <div style="font-size:10px;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;color:#A5B4FC;margin-bottom:6px;">Estimated percentile</div>
      <div style="font-size:32px;font-weight:700;color:#fff;">${esc(result.percentileEstimate.rangeLabel)}</div>
      <div style="font-size:12px;color:#C7D2FE;">vs. ${esc(benchShort)}</div>
    </div>
    <div style="background:rgba(255,255,255,0.12);border-radius:14px;padding:14px;">
      <div style="font-size:10px;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;color:#A5B4FC;margin-bottom:6px;">Readiness band</div>
      <div style="font-size:22px;font-weight:700;color:#fff;margin-top:4px;">${esc(result.readinessLabel)}</div>
      <div style="font-size:12px;color:#C7D2FE;">See domain detail below</div>
    </div>
  </div>
</div>

${scoreLiftSection(lift, result.percent, result.scoreLiftScore)}

<!-- ── SCORE SUMMARY ─────────────────────────────────────────────────────── -->
<div class="section">
  <h2>Score summary</h2>
  <div style="background:${bs.bg};border:1px solid ${bs.border};border-radius:12px;padding:16px 20px;margin-bottom:12px;">
    <p style="margin:0;font-size:14px;color:${bs.text};">${esc(result.summary)}</p>
  </div>
  <div style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:10px;padding:12px 14px;margin-bottom:8px;">
    <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#6B7280;margin-bottom:4px;">Percentile benchmark</div>
    <p style="margin:0;font-size:12px;color:#374151;line-height:1.55;">
      Compared against: <strong>${esc(result.percentileEstimate.benchmarkSource ?? 'Public norm table')}</strong>.
    </p>
  </div>
  <p style="font-size:12px;color:#9CA3AF;margin:0;">${esc(result.percentileEstimate.caveat)}</p>
</div>

<!-- ── DOMAIN RATINGS ────────────────────────────────────────────────────── -->
<div class="section">
  <h2>Domain ratings</h2>
  <table style="border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
    <thead>
      <tr style="background:#F9FAFB;">
        <th style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#6B7280;">Domain</th>
        <th style="padding:10px 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#6B7280;text-align:center;">Score</th>
        <th style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#6B7280;">Progress</th>
        <th style="padding:10px 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#6B7280;text-align:center;">%</th>
        <th style="padding:10px 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#6B7280;">Rating</th>
      </tr>
    </thead>
    <tbody>${domainRows(result)}</tbody>
  </table>
</div>

<!-- ── STRENGTHS AND GROWTH ──────────────────────────────────────────────── -->
<div class="section">
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
    <div style="background:#F0FDF4;border:1px solid #86EFAC;border-radius:14px;padding:16px 20px;">
      <h3 style="color:#166534;">Strengths</h3>
      <ul>${result.strengths.map(s => `<li style="color:#166534;">${esc(s)}</li>`).join('')}</ul>
    </div>
    <div style="background:#FFF7ED;border:1px solid #FDBA74;border-radius:14px;padding:16px 20px;">
      <h3 style="color:#9A3412;">Growth areas</h3>
      <ul>${result.growthAreas.map(s => `<li style="color:#9A3412;">${esc(s)}</li>`).join('')}</ul>
    </div>
  </div>
</div>

<!-- ── MISTAKE MAP ────────────────────────────────────────────────────────── -->
<div class="section">
  <h2>Mistake map &amp; step-by-step solutions</h2>
  ${result.missedQuestions.length > 0
    ? `<p class="muted" style="font-size:13px;margin-bottom:16px;">
        ${result.missedQuestions.length} missed question${result.missedQuestions.length > 1 ? 's' : ''} reviewed below.
        Each card shows your answer, the correct answer, the common trap, and a step-by-step solution.
       </p>`
    : ''}
  ${missedSection}
</div>

<!-- ── 7-DAY SCORELIFT PLAN ──────────────────────────────────────────────── -->
<div class="section" style="page-break-inside:avoid;break-inside:avoid;">
  <h2>7-day ScoreLift plan</h2>
  <p style="font-size:13px;color:#6B7280;margin-bottom:12px;">${esc(result.retakeRecommendation)}</p>
  <table style="border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
    <thead>
      <tr style="background:#F9FAFB;">
        <th style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#6B7280;white-space:nowrap;">Day</th>
        <th style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#6B7280;white-space:nowrap;">Time</th>
        <th style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#6B7280;">Practice focus</th>
        <th style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#6B7280;">Resource</th>
      </tr>
    </thead>
    <tbody>
      ${planRows(result.practicePlan)}
      <tr style="background:#EEF2FF;">
        <td style="padding:10px 12px;font-size:12px;font-weight:600;color:#374151;white-space:nowrap;">Day 7</td>
        <td style="padding:10px 12px;font-size:11px;color:#6B7280;white-space:nowrap;">15–20 min</td>
        <td style="padding:10px 12px;">
          <strong style="font-size:13px;color:#3730A3;">Retake Sprint</strong><br/>
          <span style="font-size:12px;color:#4F46E5;">New randomised version — same skills, fresh numbers and question variants.</span>
        </td>
        <td style="padding:10px 12px;font-size:12px;color:#4F46E5;">Open app → Retake</td>
      </tr>
    </tbody>
  </table>
</div>

<!-- ── FOOTER ─────────────────────────────────────────────────────────────── -->
<div style="margin-top:28px;padding-top:16px;border-top:1px solid #E5E7EB;">
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
    <div style="background:#F0F9FF;border:1px solid #BAE6FD;border-radius:10px;padding:12px 16px;">
      <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#0369A1;margin-bottom:4px;">Privacy note</div>
      <p style="font-size:12px;color:#075985;margin:0;line-height:1.6;">${esc(BRAND.privacyPromise)}</p>
    </div>
    <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:12px 16px;">
      <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#92400E;margin-bottom:4px;">Disclaimer</div>
      <p style="font-size:12px;color:#78350F;margin:0;line-height:1.6;">${esc(result.disclaimer)}</p>
    </div>
  </div>
  <p style="text-align:center;font-size:11px;color:#D1D5DB;margin-top:14px;">${esc(BRAND.appName)} &nbsp;·&nbsp; ${esc(BRAND.scoreReportName)} &nbsp;·&nbsp; Generated on-device &nbsp;·&nbsp; Not a clinical assessment</p>
</div>

</body>
</html>`;
}
