/**
 * Optimal Notification Timing Service
 *
 * ADHD-aware notification scheduling:
 * 1. Track when user typically opens the app (morning/afternoon/evening)
 * 2. Send notifications 5-10 minutes before their usual time
 * 3. Never send more than 2 notifications per day
 * 4. Respect quiet hours (10pm - 8am by default)
 * 5. Vary message types to prevent fatigue / habituation
 * 6. Weight recent sessions more heavily (recency bias)
 * 7. Weekend vs weekday pattern detection
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Notifications, notificationsAvailable } from '@/services/notificationsRuntime';

const STORAGE_KEY = '@declutterly_session_times';
const LAST_SENT_KEY = '@declutterly_last_notification_sent';
const MAX_STORED_SESSIONS = 50; // Last 50 sessions for better pattern detection
const QUIET_HOURS_START = 22; // 10 PM
const QUIET_HOURS_END = 8;   // 8 AM
const MIN_HOURS_BETWEEN_NOTIFICATIONS = 4; // At least 4h between notifications

interface SessionTimeEntry {
  timestamp: number;
  hour: number;
  dayOfWeek: number; // 0=Sun, 6=Sat
}

// Record when user opens the app
export async function recordAppOpen(): Promise<void> {
  try {
    const now = new Date();
    const entry: SessionTimeEntry = {
      timestamp: now.getTime(),
      hour: now.getHours(),
      dayOfWeek: now.getDay(),
    };

    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const sessions: SessionTimeEntry[] = stored ? JSON.parse(stored) : [];
    sessions.push(entry);

    // Keep only last N
    const trimmed = sessions.slice(-MAX_STORED_SESSIONS);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Non-critical — don't let tracking failure affect app startup
  }
}

/**
 * Calculate optimal notification time using weighted recency.
 * Recent sessions count more than old ones, and we distinguish
 * weekdays from weekends since ADHD routines differ.
 */
export async function getOptimalNotificationTime(): Promise<{ hour: number; minute: number } | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const sessions: SessionTimeEntry[] = JSON.parse(stored);
    if (sessions.length < 3) return null; // Need at least 3 data points

    const now = new Date();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    // Filter to matching day type (weekday/weekend) if enough data
    const matchingDayType = sessions.filter(s => {
      const sIsWeekend = s.dayOfWeek === 0 || s.dayOfWeek === 6;
      return sIsWeekend === isWeekend;
    });
    const pool = matchingDayType.length >= 3 ? matchingDayType : sessions;

    // Weight recent sessions more heavily (recency bias)
    const hourWeights: Record<number, number> = {};
    const totalSessions = pool.length;
    pool.forEach((s, i) => {
      // Linear weight: most recent session gets weight = totalSessions, oldest gets 1
      const weight = (i + 1) / totalSessions;
      hourWeights[s.hour] = (hourWeights[s.hour] || 0) + weight;
    });

    // Find the hour with the highest weighted score
    const bestHourEntry = Object.entries(hourWeights)
      .sort((a, b) => b[1] - a[1])[0];

    if (!bestHourEntry) return null;

    const targetHour = parseInt(bestHourEntry[0]);

    // Respect quiet hours: never before 8am or after 10pm
    const adjustedHour = Math.max(QUIET_HOURS_END, Math.min(QUIET_HOURS_START, targetHour));

    // Send 5-15 minutes before usual time so the nudge arrives *before* the habit window
    const minutesBefore = 5 + Math.floor(Math.random() * 11); // 5-15 min before
    let notifHour = adjustedHour;
    let notifMinute = 60 - minutesBefore;
    if (notifMinute >= 60) {
      notifMinute = 55;
    } else {
      notifHour = Math.max(QUIET_HOURS_END, notifHour - 1);
    }

    return { hour: notifHour, minute: notifMinute };
  } catch {
    return null;
  }
}

// Shame-free, ADHD-aware messages that rotate to prevent habituation
const OPTIMAL_MESSAGES = [
  { title: "Perfect timing!", body: "This is usually when you like to tidy. Ready?" },
  { title: "Your usual tidy time!", body: "One quick task to keep the momentum going?" },
  { title: "Dusty noticed a pattern!", body: "You usually clean around now. Shall we?" },
  { title: "Right on schedule!", body: "Your space is calling. Even 60 seconds counts." },
  { title: "Hey, it's your time!", body: "Your brain works best with routine. One tiny thing?" },
  { title: "Creature of habit!", body: "You usually open the app now. Wanna ride that wave?" },
  { title: "Tiny nudge!", body: "Just open the app and pick ONE thing. That's it." },
  { title: "Your rhythm says...", body: "Now's a good time. Even looking at the room counts." },
];

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

  // Pick a message based on day-of-year so it rotates daily
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const message = OPTIMAL_MESSAGES[dayOfYear % OPTIMAL_MESSAGES.length];

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
    await AsyncStorage.setItem(LAST_SENT_KEY, Date.now().toString());
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

  // Also check that we haven't sent one too recently
  const lastSent = await AsyncStorage.getItem(LAST_SENT_KEY);
  if (lastSent) {
    const hoursSinceLastSent = (Date.now() - parseInt(lastSent)) / (1000 * 60 * 60);
    if (hoursSinceLastSent < MIN_HOURS_BETWEEN_NOTIFICATIONS) return false;
  }

  return optOutCount < 5;
}

/**
 * Reset opt-out count — useful if user re-enables notifications in settings.
 */
export async function resetOptOutCount(): Promise<void> {
  await AsyncStorage.removeItem(OPT_OUT_KEY);
}
