// src/services/notificationService.ts
//
// Local push notification for the Day-7 Retake Sprint reminder.
//
// Privacy-respecting:
//   - Notifications are local-only (no APNs round-trip server, no analytics).
//   - We only schedule them if the user has opted in to history tracking — the
//     reminder makes no sense without the score-lift loop.
//   - We always cancel any prior reminder for the same test before scheduling,
//     so retaking 4 days in doesn't queue conflicting notifications.

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TestId } from '../features/assessment/types';
import { getSettings } from './historyService';

const SCHEDULED_KEY = 'qlq:scheduled-notifications:v1';
const DAY_7_SECONDS = 7 * 24 * 60 * 60;

interface ScheduledMap {
  // testId → notification identifier (so we can cancel/replace per test)
  [testId: string]: string;
}

// ─── Permission ──────────────────────────────────────────────────────────────

export async function ensurePermission(): Promise<boolean> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    if (existing === 'denied') return false;
    const { status: requested } = await Notifications.requestPermissionsAsync();
    return requested === 'granted';
  } catch {
    return false;
  }
}

// ─── Scheduled-map helpers ───────────────────────────────────────────────────

async function readScheduled(): Promise<ScheduledMap> {
  try {
    const raw = await AsyncStorage.getItem(SCHEDULED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

async function writeScheduled(map: ScheduledMap): Promise<void> {
  try {
    await AsyncStorage.setItem(SCHEDULED_KEY, JSON.stringify(map));
  } catch {
    // Non-fatal
  }
}

// ─── Schedule + cancel ───────────────────────────────────────────────────────

/**
 * Schedule a Day-7 retake reminder for a given test. Cancels any prior
 * reminder for the same test first. No-op if history tracking is off.
 */
export async function scheduleDay7Reminder(testId: TestId, testTitle: string): Promise<boolean> {
  try {
    const settings = await getSettings();
    if (!settings.trackHistory) return false; // Privacy: only when user opted in.

    const granted = await ensurePermission();
    if (!granted) return false;

    // Cancel any existing reminder for this test type.
    const existing = await readScheduled();
    if (existing[testId]) {
      try { await Notifications.cancelScheduledNotificationAsync(existing[testId]); } catch {}
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "It's been 7 days — time for a Retake Sprint",
        body: `Take a fresh ${testTitle} and watch your score climb.`,
        sound: 'default',
        data: { testId, kind: 'day7-retake' }
      },
      // Schedule strictly 7 days out. Time-interval triggers respect device timezone
      // by triggering relative to the moment of scheduling, not by wall-clock date.
      trigger: { seconds: DAY_7_SECONDS, repeats: false } as any
    });

    existing[testId] = identifier;
    await writeScheduled(existing);
    return true;
  } catch {
    return false;
  }
}

/**
 * Cancel Day-7 reminder for a single test (called when user retakes early).
 */
export async function cancelDay7Reminder(testId: TestId): Promise<void> {
  try {
    const existing = await readScheduled();
    const id = existing[testId];
    if (id) {
      try { await Notifications.cancelScheduledNotificationAsync(id); } catch {}
      delete existing[testId];
      await writeScheduled(existing);
    }
  } catch {
    // Non-fatal
  }
}

/**
 * Cancel all Day-7 reminders. Used by full local wipe.
 */
export async function cancelAllReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem(SCHEDULED_KEY);
  } catch {
    // Non-fatal
  }
}

// ─── Foreground behavior config ──────────────────────────────────────────────
// Call this once on app start (e.g. from _layout.tsx) to make notifications
// show even when the app is open. Optional but recommended.

export function configureForegroundDisplay(): void {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true
      } as any)
    });
  } catch {
    // Non-fatal — older expo-notifications versions accept fewer fields.
  }
}
