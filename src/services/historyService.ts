// src/services/historyService.ts
//
// v0.6: HistoryEntry stores scoreLiftScore (1–100). ScoreLift uses
// previousScore / liftScore. Was: questionLiftIndex / previousIndex / liftIndex.
//
// Opt-in local-only score history. Stays on device. Never synced.
// Default: OFF. User toggles ON from home screen if they want score-lift tracking.
//
// Storage layout:
//   qlq:settings:v1   { trackHistory: boolean }
//   qlq:history:v1    HistoryEntry[]   (most recent first, capped at 50)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { TestId, ScoreBand } from '../features/assessment/types';

const SETTINGS_KEY = 'qlq:settings:v1';
const HISTORY_KEY = 'qlq:history:v1';
const MAX_HISTORY = 50;

export interface HistoryEntry {
  testId: TestId;
  testTitle: string;
  percent: number;
  rawScore: number;
  maxScore: number;
  // v0.6: ScoreLift Score (1–100). Was: questionLiftIndex (70–130).
  scoreLiftScore: number;
  readinessBand: ScoreBand;
  completedAtIso: string;
}

export interface AppSettings {
  trackHistory: boolean;
}

const DEFAULT_SETTINGS: AppSettings = { trackHistory: false };

// ─── Settings ───────────────────────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function setSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Storage failure is non-fatal — feature simply stays off.
  }
}

export async function setTrackHistory(enabled: boolean): Promise<void> {
  const current = await getSettings();
  await setSettings({ ...current, trackHistory: enabled });
}

// ─── History writes ──────────────────────────────────────────────────────────

export async function appendHistory(entry: HistoryEntry): Promise<void> {
  const settings = await getSettings();
  if (!settings.trackHistory) return;

  try {
    const existing = await readHistory();
    const updated = [entry, ...existing].slice(0, MAX_HISTORY);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // Non-fatal — history simply doesn't get appended.
  }
}

// ─── History reads ───────────────────────────────────────────────────────────

async function readHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getHistoryForTest(testId: TestId): Promise<HistoryEntry[]> {
  const all = await readHistory();
  return all.filter(e => e.testId === testId);
}

export async function getMostRecentForTest(testId: TestId): Promise<HistoryEntry | null> {
  const forTest = await getHistoryForTest(testId);
  return forTest.length > 0 ? forTest[0] : null;
}

export async function getAllHistory(): Promise<HistoryEntry[]> {
  return readHistory();
}

// ─── History wipe ────────────────────────────────────────────────────────────

export async function eraseAllHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch { /* Non-fatal */ }
}

export async function eraseEverything(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([HISTORY_KEY, SETTINGS_KEY]);
  } catch { /* Non-fatal */ }
}

// ─── Score-lift helper ───────────────────────────────────────────────────────

export interface ScoreLift {
  hasPrevious: boolean;
  previousPercent?: number;
  // v0.6: ScoreLift Score on the 1–100 scale. Was: previousIndex (70–130).
  previousScore?: number;
  previousDate?: string;
  liftPercent?: number;
  // v0.6: Delta in ScoreLift Score. Was: liftIndex.
  liftScore?: number;
}

/**
 * Compare the current attempt to the most recent prior attempt for the same
 * test. Returns hasPrevious=false on first attempt or if history is off.
 */
export async function computeScoreLift(testId: TestId, currentPercent: number, currentScore: number): Promise<ScoreLift> {
  const previous = await getMostRecentForTest(testId);
  if (!previous) {
    return { hasPrevious: false };
  }
  return {
    hasPrevious: true,
    previousPercent: previous.percent,
    previousScore: previous.scoreLiftScore,
    previousDate: previous.completedAtIso,
    liftPercent: Math.round((currentPercent - previous.percent) * 100),
    liftScore: currentScore - previous.scoreLiftScore
  };
}
