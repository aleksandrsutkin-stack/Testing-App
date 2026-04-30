import * as FileSystem from 'expo-file-system/legacy';
import { ResponseMap } from '../features/assessment/types';
import { eraseEverything } from './historyService';
import { cancelAllReminders } from './notificationService';

export async function deleteTempFiles(fileUris: string[]): Promise<void> {
  await Promise.all(
    fileUris.map(uri => uri ? FileSystem.deleteAsync(uri, { idempotent: true }) : Promise.resolve())
  );
}

export function wipeResponses(): ResponseMap {
  return {};
}

/**
 * Full local wipe — temp files + history + scheduled notifications.
 *
 * NOTE: Purchase state is intentionally NOT cleared here. App Store policy
 * requires that paid unlocks be recoverable via the Restore Purchases flow.
 * If a user wants to actually destroy local proof of purchase too, that's a
 * separate, more destructive action.
 */
export async function fullLocalWipe(tempFiles: string[] = []): Promise<void> {
  await deleteTempFiles(tempFiles);
  await eraseEverything();
  await cancelAllReminders();
}

export function privacyWipeChecklist(): string[] {
  return [
    'Assessment responses are held in memory only for the current session.',
    'Generated PDF is created as a temporary local file.',
    'After the native share sheet returns, the temporary PDF is deleted.',
    'The route is replaced after export so answers are not kept in navigation history.',
    'Score history is opt-in, stored on this device only, and never synced.',
    'Day-7 reminders are local notifications scheduled by the OS, not via any server.',
    'No account, analytics, server upload, cloud sync, or ad SDK is included.'
  ];
}
