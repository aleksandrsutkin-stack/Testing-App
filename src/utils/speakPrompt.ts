// src/utils/speakPrompt.ts
// Wraps expo-speech for read-aloud support in the Kindergarten Readiness module.
// Safe-fail: if speech isn't available on the platform, the function is a no-op.

import * as Speech from 'expo-speech';

export function speakPrompt(text: string, options: { rate?: number; pitch?: number } = {}): void {
  try {
    // Stop anything currently being spoken so prompts don't queue up.
    Speech.stop();
    Speech.speak(text, {
      language: 'en-US',
      rate: options.rate ?? 0.9,
      pitch: options.pitch ?? 1.0
    });
  } catch {
    // Non-fatal — module still usable without audio.
  }
}

export function stopSpeech(): void {
  try {
    Speech.stop();
  } catch {
    // Non-fatal
  }
}

export async function isSpeechAvailable(): Promise<boolean> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    return Array.isArray(voices) && voices.length > 0;
  } catch {
    return false;
  }
}
