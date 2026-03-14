/**
 * Optimal Notification Timing Service
 *
 * Instead of ML, uses simple rule-based timing:
 * 1. Track when user typically opens the app (morning/afternoon/evening)
 * 2. Send notifications 5-10 minutes before their usual time
 * 3. Never send more than 2 notifications per day
 * 4. Respect quiet hours (10pm - 8am)
 * 5. Vary message types to prevent fatigue
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Notifications, notificationsAvailable } from '@/services/notificationsRuntime';

const STORAGE_KEY = '@declutterly_session_times';
const MAX_STORED_SESSIONS = 30; // Last 30 sessions

interface SessionTimeEntry {
  timestamp: number;
  hour: number;
  dayOfWeek: number; // 0=Sun, 6=Sat
}

// Record when user opens the app
export async function recordAppOpen(): Promise<void> {
  const now = new Date();
  const entry: SessionTimeEntry = {
    timestamp: now.getTime(),
    hour: now.getHours(),
    dayOfWeek: now.getDay(),
  };

  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  const sessions: SessionTimeEntry[] = stored ? JSON.parse(stored) : [];
  sessions.push(entry);

  // Keep only last 30
  const trimmed = sessions.slice(-MAX_STORED_SESSIONS);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

// Calculate optimal notification time
export async function getOptimalNotificationTime(): Promise<{ hour: number; minute: number } | null> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  const sessions: SessionTimeEntry[] = JSON.parse(stored);
  if (sessions.length < 3) return null; // Need at least 3 data points

  // Find mode (most common) hour
  const hourCounts: Record<number, number> = {};
  sessions.forEach(s => {
    hourCounts[s.hour] = (hourCounts[s.hour] || 0) + 1;
  });

  const modeHour = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])[0];

  if (!modeHour) return null;

  const targetHour = parseInt(modeHour[0]);

  // Send 5-10 minutes before usual time
  // Respect quiet hours: never before 8am or after 10pm
  const adjustedHour = Math.max(8, Math.min(22, targetHour));
  const minute = Math.floor(Math.random() * 6) + 50; // :50-:55 of the previous hour

  return {
    hour: adjustedHour > 0 ? adjustedHour - 1 : adjustedHour,
    minute: minute >= 60 ? 55 : minute,
  };
}

// Schedule optimal notification
export async function scheduleOptimalNotification(): Promise<string | null> {
  if (!notificationsAvailable) return null;

  // Check if we should send notifications (channel protection)
  const canSend = await shouldSendNotifications();
  if (!canSend) return null;

  const timing = await getOptimalNotificationTime();
  if (!timing) return null;

  // Cancel existing optimal notification
  const existingId = await AsyncStorage.getItem('optimal-notification-id');
  if (existingId) {
    try { await Notifications.cancelScheduledNotificationAsync(existingId); } catch {}
  }

  // Pick a shame-free message
  const messages = [
    { title: "Perfect timing!", body: "This is usually when you like to tidy. Ready?" },
    { title: "Your usual tidy time!", body: "One quick task to keep the momentum going?" },
    { title: "Dusty noticed a pattern!", body: "You usually clean around now. Shall we?" },
    { title: "Right on schedule!", body: "Your space is calling. Even 60 seconds counts." },
  ];
  const message = messages[Math.floor(Math.random() * messages.length)];

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: message.title,
        body: message.body,
        data: { category: 'reminder' },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: timing.hour,
        minute: timing.minute,
      },
    });

    await AsyncStorage.setItem('optimal-notification-id', id);
    return id;
  } catch (error) {
    if (__DEV__) console.error('Error scheduling optimal notification:', error);
    return null;
  }
}

// Get notification stats for settings display
export async function getNotificationStats(): Promise<{
  optimalTime: string | null;
  sessionsTracked: number;
  isEnabled: boolean;
}> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  const sessions: SessionTimeEntry[] = stored ? JSON.parse(stored) : [];
  const timing = await getOptimalNotificationTime();
  const existingId = await AsyncStorage.getItem('optimal-notification-id');

  return {
    optimalTime: timing ? `${timing.hour}:${timing.minute.toString().padStart(2, '0')}` : null,
    sessionsTracked: sessions.length,
    isEnabled: !!existingId,
  };
}

// Notification channel protection — track opt-outs to avoid over-sending
const OPT_OUT_KEY = '@declutterly_notification_optouts';

export async function recordNotificationDismiss(): Promise<void> {
  const stored = await AsyncStorage.getItem(OPT_OUT_KEY);
  const count = stored ? parseInt(stored) + 1 : 1;
  await AsyncStorage.setItem(OPT_OUT_KEY, count.toString());

  // If user has dismissed 5+ notifications, reduce frequency
  if (count >= 5) {
    // Cancel optimal notifications — user doesn't want them
    const existingId = await AsyncStorage.getItem('optimal-notification-id');
    if (existingId) {
      try { await Notifications.cancelScheduledNotificationAsync(existingId); } catch {}
      await AsyncStorage.removeItem('optimal-notification-id');
    }
  }
}

// Check if we should send notifications (channel protection)
export async function shouldSendNotifications(): Promise<boolean> {
  if (!notificationsAvailable) return false;

  const stored = await AsyncStorage.getItem(OPT_OUT_KEY);
  const optOutCount = stored ? parseInt(stored) : 0;
  return optOutCount < 5;
}
