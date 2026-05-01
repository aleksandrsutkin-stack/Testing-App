// src/services/pdfReportService.ts
//
// v0.6: Passes scoreLiftScore (was: questionLiftIndex) to computeScoreLift.

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
 * temp file. If history tracking is on, the PDF will include a "Your progress"
 * section comparing this attempt to the previous one for the same test.
 */
export async function createShareAndDeletePdf(result: AssessmentResult): Promise<PdfExportResult> {
  let lift: PdfScoreLift | undefined;
  try {
    const settings = await getSettings();
    if (settings.trackHistory) {
      // v0.6: scoreLiftScore replaces questionLiftIndex.
      lift = await computeScoreLift(result.testId, result.percent, result.scoreLiftScore);
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
      // v0.9: framing the action as "Send" turns the abstract artifact into a
      // concrete deliverable (the parent typically forwards this to a tutor
      // or teacher). "Send" reads as more action-oriented than "Share."
      dialogTitle: 'Send your ScoreLift Report'
    });
  } finally {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }

  return { shared: true, deletedAfterShare: true };
}
