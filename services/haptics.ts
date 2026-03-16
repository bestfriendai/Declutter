import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

let hapticsEnabled = true;

export function setHapticsEnabled(enabled: boolean) {
  hapticsEnabled = enabled;
}

export function isHapticsEnabled(): boolean {
  return hapticsEnabled;
}

/** Safe wrapper — swallows errors silently (haptics are never critical) */
async function safeHaptic(fn: () => Promise<void>): Promise<void> {
  if (!hapticsEnabled || Platform.OS === 'web') return;
  try {
    await fn();
  } catch {
    // Haptics can fail on simulator or unsupported hardware — never crash
  }
}

export async function impact(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
  await safeHaptic(() => Haptics.impactAsync(style));
}

export async function notification(type: Haptics.NotificationFeedbackType) {
  await safeHaptic(() => Haptics.notificationAsync(type));
}

export async function selection() {
  await safeHaptic(() => Haptics.selectionAsync());
}

// ─────────────────────────────────────────────────────────────────────────────
// Semantic haptic patterns — use these for consistent feedback across the app
// ─────────────────────────────────────────────────────────────────────────────

/** Light tap for navigation, toggle, option selection */
export async function tapLight() {
  await impact(Haptics.ImpactFeedbackStyle.Light);
}

/** Medium tap for confirming an action (start session, take photo) */
export async function tapMedium() {
  await impact(Haptics.ImpactFeedbackStyle.Medium);
}

/** Heavy tap for significant moments (room complete, level up) */
export async function tapHeavy() {
  await impact(Haptics.ImpactFeedbackStyle.Heavy);
}

/** Task completed — satisfying success */
export async function taskComplete() {
  await notification(Haptics.NotificationFeedbackType.Success);
}

/** Combo or streak continued — double tap */
export async function combo() {
  await safeHaptic(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise(r => setTimeout(r, 80));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  });
}

/** Milestone reached (25%, 50%, 75%, 100%) — escalating pattern */
export async function milestone() {
  await safeHaptic(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise(r => setTimeout(r, 60));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise(r => setTimeout(r, 60));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  });
}

/** Error or invalid action */
export async function error() {
  await notification(Haptics.NotificationFeedbackType.Error);
}

/** Warning — something to notice but not alarming */
export async function warning() {
  await notification(Haptics.NotificationFeedbackType.Warning);
}

/** Subtle selection change (scrolling a picker, toggling) */
export async function tick() {
  await selection();
}

export const ImpactStyle = Haptics.ImpactFeedbackStyle;
export const NotificationType = Haptics.NotificationFeedbackType;
