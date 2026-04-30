import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { AssessmentResult } from '../features/assessment/types';
import { buildReportHtml, PdfScoreLift } from '../features/reports/buildReportHtml';
import { computeScoreLift, getSettings } from './historyService';

export interface PdfExportResult {
  shared: boolean;
  deletedAfterShare: boolean;
  uri?: string;
}

/**
 * Generate the PDF, share it via the native share sheet, then delete the
 * temp file. If history tracking is on, the PDF can include a "Your progress"
 * section comparing this attempt to the previous one for the same test.
 *
 * v0.5.1 accepts a precomputed lift from ResultsScreen because Results computes
 * progress before appending the current attempt to local history. If a caller does
 * not pass one, this service excludes the current attempt timestamp when looking
 * up prior attempts so the PDF never compares the session against itself.
 */
export async function createShareAndDeletePdf(result: AssessmentResult, precomputedLift?: PdfScoreLift): Promise<PdfExportResult> {
  let lift: PdfScoreLift | undefined = precomputedLift;
  try {
    const settings = await getSettings();
    if (!settings.trackHistory) {
      lift = undefined;
    } else if (!lift) {
      lift = await computeScoreLift(result.testId, result.percent, result.questionLiftIndex, result.completedAtIso);
    }
  } catch {
    // History lookup failure is non-fatal — PDF just won't include the lift section.
  }

  const html = buildReportHtml(result, lift);
  const { uri } = await Print.printToFileAsync({ html });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    await FileSystem.deleteAsync(uri, { idempotent: true });
    return { shared: false, deletedAfterShare: true };
  }

  try {
    await Sharing.shareAsync(uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: 'Share ScoreLift Report'
    });
  } finally {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }

  return { shared: true, deletedAfterShare: true };
}
