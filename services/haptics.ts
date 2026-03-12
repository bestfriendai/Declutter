import * as Haptics from 'expo-haptics';

let hapticsEnabled = true;

export function setHapticsEnabled(enabled: boolean) {
  hapticsEnabled = enabled;
}

export function isHapticsEnabled(): boolean {
  return hapticsEnabled;
}

export async function impact(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
  if (!hapticsEnabled) return;
  await Haptics.impactAsync(style);
}

export async function notification(type: Haptics.NotificationFeedbackType) {
  if (!hapticsEnabled) return;
  await Haptics.notificationAsync(type);
}

export async function selection() {
  if (!hapticsEnabled) return;
  await Haptics.selectionAsync();
}

export const ImpactStyle = Haptics.ImpactFeedbackStyle;
export const NotificationType = Haptics.NotificationFeedbackType;
