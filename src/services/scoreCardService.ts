// src/services/scoreCardService.ts
//
// v0.8: Capture a <ScoreCard> ref to a temporary PNG, open the native share
// sheet, then delete the temp file. Same privacy pattern as the PDF flow:
// the file lives only as long as the system needs it for the share.

import { RefObject } from 'react';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export interface ShareScoreCardResult {
  success: boolean;
  shared: boolean;
  error?: string;
}

/**
 * Capture the given <ScoreCard> View ref to a PNG, then open the native
 * share sheet. Cleans the temp file after sharing returns. Errors are
 * non-fatal; we report them so the UI can show a toast.
 */
export async function shareScoreCard(ref: RefObject<View | null>): Promise<ShareScoreCardResult> {
  if (!ref.current) {
    return { success: false, shared: false, error: 'Score card not ready.' };
  }

  let tempUri: string | null = null;
  try {
    // captureRef returns a file:// URI. result: 'tmpfile' avoids base64 in
    // memory; format png keeps the export crisp.
    tempUri = await captureRef(ref, {
      format: 'png',
      quality: 1,
      result: 'tmpfile'
    });
  } catch (e) {
    return { success: false, shared: false, error: 'Could not render the score card.' };
  }

  try {
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      // Share sheet not available (e.g. simulator). Treat as non-fatal —
      // file is left for the caller to deal with, but we still try cleanup.
      await safeDelete(tempUri);
      return { success: false, shared: false, error: 'Sharing is not available on this device.' };
    }
    await Sharing.shareAsync(tempUri, {
      mimeType: 'image/png',
      dialogTitle: 'Share your ScoreLift Score'
    });
    return { success: true, shared: true };
  } catch (e) {
    return { success: false, shared: false, error: 'Sharing failed.' };
  } finally {
    if (tempUri) await safeDelete(tempUri);
  }
}

async function safeDelete(uri: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Non-fatal — the OS will clean its tmp dir eventually.
  }
}
