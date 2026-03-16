/**
 * Push Notifications Service
 * Handles local and push notifications for reminders and achievements
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import type {
  EventSubscription,
  Notification,
  NotificationRequest,
  NotificationResponse,
} from 'expo-notifications';
import { Notifications, notificationsAvailable } from '@/services/notificationsRuntime';

// Configure notification behavior
if (notificationsAvailable) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// Storage key for notification token
const NOTIFICATION_TOKEN_KEY = '@declutterly_notification_token';

// Notification categories
export type NotificationCategory =
  | 'reminder'
  | 'streak'
  | 'achievement'
  | 'collectible'
  | 'mascot'
  | 'focus'
  | 'motivation';

// Notification data type - extends Record for Expo compatibility
export interface NotificationData extends Record<string, unknown> {
  category: NotificationCategory;
  roomId?: string;
  taskId?: string;
  collectibleId?: string;
  achievementId?: string;
}

// Register for push notifications
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    if (__DEV__) console.log('Push notifications require a physical device');
    return null;
  }

  try {
    // Check existing permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      if (__DEV__) console.log('Push notification permission not granted');
      return null;
    }

    // Get push token - projectId is required for Expo push notifications
    // If not configured, skip push token registration but continue with local notifications
    const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
    if (!projectId) {
      if (__DEV__) console.log('EXPO_PUBLIC_PROJECT_ID not set, skipping push token registration. Local notifications will still work.');
      // Configure Android channel even without push token
      if (Platform.OS === 'android') {
        await setupAndroidChannels();
      }
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = tokenData.data;

    // Save token locally
    await AsyncStorage.setItem(NOTIFICATION_TOKEN_KEY, token);

    // Configure Android channel
    if (Platform.OS === 'android') {
      await setupAndroidChannels();
    }

    return token;
  } catch (error) {
    if (__DEV__) console.error('Error registering for push notifications:', error);
    return null;
  }
}

// Set up Android notification channels
async function setupAndroidChannels(): Promise<void> {
  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Cleaning Reminders',
    description: 'Daily reminders to clean and declutter',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#6366F1',
    sound: 'default',
  });

  await Notifications.setNotificationChannelAsync('achievements', {
    name: 'Achievements',
    description: 'Badge unlocks and milestones',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#22C55E',
  });

  await Notifications.setNotificationChannelAsync('streaks', {
    name: 'Streak Alerts',
    description: 'Keep your cleaning streak going',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#F59E0B',
  });

  await Notifications.setNotificationChannelAsync('mascot', {
    name: 'Mascot Messages',
    description: 'Messages from your cleaning companion',
    importance: Notifications.AndroidImportance.LOW,
    lightColor: '#3B82F6',
  });
}

// Schedule a daily reminder
export async function scheduleDailyReminder(
  hour: number,
  minute: number,
  enabled: boolean = true
): Promise<string | null> {
  // Cancel existing reminder first
  await cancelScheduledReminder('daily-reminder');

  if (!enabled) return null;

  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to Declutter! ✨",
        body: getRandomReminderMessage(),
        data: { category: 'reminder' } as NotificationData,
        sound: 'default',
        categoryIdentifier: 'reminder',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    await AsyncStorage.setItem('daily-reminder-id', identifier);
    return identifier;
  } catch (error) {
    if (__DEV__) console.error('Error scheduling daily reminder:', error);
    return null;
  }
}

// Get random reminder message
function getRandomReminderMessage(): string {
  const messages = [
    "Your space misses you! Let's tackle 5 minutes of tidying.",
    "Quick win time! One small task = one step closer to calm.",
    "Your mascot is ready to cheer you on! 🎉",
    "A clutter-free space is a clutter-free mind.",
    "Just 2 minutes can make a big difference!",
    "Your future self will thank you for tidying now.",
    "Ready for a mini cleaning session?",
    "Every declutter moment counts! Let's go!",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

// Schedule streak reminder (gentle, never guilt-inducing)
// COMEBACK ENGINE: Rewritten to be shame-free
export async function scheduleStreakReminder(
  currentStreak: number,
  enabled: boolean = true
): Promise<string | null> {
  await cancelScheduledReminder('streak-reminder');

  if (!enabled || currentStreak < 2) return null;

  // Shame-free streak reminder messages
  const streakMessages = [
    { title: `${currentStreak}-day streak! ✨`, body: "Pop in for 60 seconds if you can. No pressure!" },
    { title: `You're on a roll! 🌟`, body: `${currentStreak} days of tidying. Keep the momentum going?` },
    { title: `Quick evening check-in 🌙`, body: "One tiny task before winding down?" },
    { title: `Still got time! ⏰`, body: "Even 30 seconds counts toward your streak." },
  ];
  
  const message = streakMessages[Math.floor(Math.random() * streakMessages.length)];

  try {
    // Schedule for evening if user hasn't cleaned today
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: message.title,
        body: message.body,
        data: { category: 'streak' } as NotificationData,
        sound: 'default',
        categoryIdentifier: 'streaks',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 20,
        minute: 0,
      },
    });

    await AsyncStorage.setItem('streak-reminder-id', identifier);
    return identifier;
  } catch (error) {
    if (__DEV__) console.error('Error scheduling streak reminder:', error);
    return null;
  }
}

// Show instant notification (achievements, collectibles, etc.)
export async function showNotification(
  title: string,
  body: string,
  data: NotificationData
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        categoryIdentifier: data.category === 'achievement' ? 'achievements' : 'mascot',
      },
      trigger: null, // Immediate
    });
  } catch (error) {
    if (__DEV__) console.error('Error showing notification:', error);
  }
}

// Notification helpers for common scenarios
export async function notifyBadgeUnlocked(
  badgeName: string,
  badgeEmoji: string,
  badgeId: string
): Promise<void> {
  await showNotification(
    `Badge Unlocked! ${badgeEmoji}`,
    `You earned the "${badgeName}" badge!`,
    { category: 'achievement', achievementId: badgeId }
  );
}

export async function notifyLevelUp(newLevel: number): Promise<void> {
  await showNotification(
    `Level Up! 🎉`,
    `You reached Level ${newLevel}! Keep up the amazing work!`,
    { category: 'achievement' }
  );
}

export async function notifyRareCollectible(
  collectibleName: string,
  collectibleEmoji: string,
  collectibleId: string
): Promise<void> {
  await showNotification(
    `Rare Find! ${collectibleEmoji}`,
    `You discovered: ${collectibleName}!`,
    { category: 'collectible', collectibleId }
  );
}

export async function notifyMascotMessage(mascotName: string, message: string): Promise<void> {
  await showNotification(
    `${mascotName} says:`,
    message,
    { category: 'mascot' }
  );
}

export async function notifyFocusSessionComplete(
  duration: number,
  tasksCompleted: number
): Promise<void> {
  const taskWord = tasksCompleted === 1 ? 'task' : 'tasks';
  await showNotification(
    `Focus Session Complete! ⏱️`,
    `Great job! You focused for ${duration} minutes and completed ${tasksCompleted} ${taskWord}.`,
    { category: 'focus' }
  );
}

export async function notifyRoomComplete(
  roomName: string,
  roomId: string
): Promise<void> {
  await showNotification(
    `Room Complete! 🏠✨`,
    `${roomName} is now 100% decluttered! Amazing work!`,
    { category: 'achievement', roomId }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMEBACK ENGINE NOTIFICATIONS — NEVER guilt-trip
// ─────────────────────────────────────────────────────────────────────────────

// Shame-free reminder messages for daily reminders
const SHAME_FREE_REMINDERS = [
  { title: "Good morning! ☀️", body: "Dusty's ready when you are. Even 60 seconds counts." },
  { title: "Quick check-in 🌟", body: "Your space is waiting. No pressure, just possibilities." },
  { title: "Time for a tiny win! ✨", body: "60 seconds of tidying = a clearer mind." },
  { title: "You've got this 💪", body: "Even opening the app counts as a step forward." },
  { title: "Gentle nudge 🌱", body: "Your future self will thank you for 60 seconds now." },
  { title: "Dusty says hi! 🧹", body: "Ready for a quick declutter session?" },
];

// Welcome back messages — never guilt, only warmth
const WELCOME_BACK_NOTIFICATIONS = [
  { title: "Hey stranger! 💛", body: "No judgment here. Wanna do one tiny thing?" },
  { title: "Welcome back! 🌈", body: "Life happens. You're here now. That's what matters." },
  { title: "Psst! 🤫", body: "One small task = one big win for your brain." },
  { title: "The comeback kid! 🌟", body: "Coming back is harder than starting. You did it." },
  { title: "Look who's here! 💜", body: "Your room missed you. But no pressure!" },
];

/**
 * Schedule shame-free daily reminder
 * NEVER uses: "You haven't cleaned in X days", "Your room is getting messy"
 */
export async function scheduleShameFreeReminder(
  hour: number,
  minute: number,
  enabled: boolean = true
): Promise<string | null> {
  await cancelScheduledReminder('daily-reminder');

  if (!enabled) return null;

  try {
    const message = SHAME_FREE_REMINDERS[Math.floor(Math.random() * SHAME_FREE_REMINDERS.length)];
    
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: message.title,
        body: message.body,
        data: { category: 'reminder' } as NotificationData,
        sound: 'default',
        categoryIdentifier: 'reminder',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    await AsyncStorage.setItem('daily-reminder-id', identifier);
    return identifier;
  } catch (error) {
    if (__DEV__) console.error('Error scheduling shame-free reminder:', error);
    return null;
  }
}

/**
 * Send welcome back notification
 * Called when user returns after 2+ days
 */
export async function notifyWelcomeBack(_daysSinceActivity: number): Promise<void> {
  const message = WELCOME_BACK_NOTIFICATIONS[Math.floor(Math.random() * WELCOME_BACK_NOTIFICATIONS.length)];
  
  await showNotification(
    message.title,
    message.body,
    { category: 'motivation' }
  );
}

/**
 * Notify comeback bonus earned
 */
export async function notifyComebackBonus(multiplier: number): Promise<void> {
  const bonusText = multiplier >= 2 ? '2x' : multiplier >= 1.5 ? '1.5x' : '1.25x';
  
  await showNotification(
    `Comeback Bonus Active! 🏆`,
    `You're earning ${bonusText} XP today. Coming back is harder than continuing — you deserve it!`,
    { category: 'achievement' }
  );
}

/**
 * Notify streak saved by grace period
 */
export async function notifyGracePeriodActive(hoursRemaining: number): Promise<void> {
  await showNotification(
    `Streak Protected! 🛡️`,
    `${hoursRemaining}hr safe zone active. Your streak is safe!`,
    { category: 'streak' }
  );
}

/**
 * Schedule grace period ending reminder (gentle, not scary)
 */
export async function scheduleGracePeriodReminder(gracePeriodEndsAt: string): Promise<string | null> {
  await cancelScheduledReminder('grace-reminder');

  try {
    const endTime = new Date(gracePeriodEndsAt);
    let reminderTime = new Date(endTime.getTime() - (4 * 60 * 60 * 1000)); // 4 hours before

    // If the 4-hours-before time is already past, schedule for NOW + 5 minutes instead
    const now = new Date();
    if (reminderTime <= now) {
      // Only schedule if the grace period hasn't already ended
      if (endTime <= now) return null;
      reminderTime = new Date(now.getTime() + 5 * 60 * 1000);
    }

    const hoursLeft = Math.max(1, Math.round((endTime.getTime() - reminderTime.getTime()) / (60 * 60 * 1000)));
    const bodyText = hoursLeft <= 1
      ? "Safe zone ending soon! Pop in for 60 seconds if you can!"
      : `Safe zone ends in ${hoursLeft} hours. Pop in for 60 seconds if you can!`;

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Quick heads up! 🌟",
        body: bodyText,
        data: { category: 'streak' } as NotificationData,
        sound: 'default',
        categoryIdentifier: 'streaks',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderTime,
      },
    });

    await AsyncStorage.setItem('grace-reminder-id', identifier);
    return identifier;
  } catch (error) {
    if (__DEV__) console.error('Error scheduling grace period reminder:', error);
    return null;
  }
}

// Cancel a scheduled notification
export async function cancelScheduledReminder(key: string): Promise<void> {
  try {
    const identifier = await AsyncStorage.getItem(`${key}-id`);
    if (identifier) {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      await AsyncStorage.removeItem(`${key}-id`);
    }
  } catch (error) {
    if (__DEV__) console.error('Error canceling notification:', error);
  }
}

// Cancel all scheduled notifications
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.multiRemove([
      'daily-reminder-id',
      'streak-reminder-id',
    ]);
  } catch (error) {
    if (__DEV__) console.error('Error canceling all notifications:', error);
  }
}

// Get pending notifications
export async function getPendingNotifications(): Promise<NotificationRequest[]> {
  return Notifications.getAllScheduledNotificationsAsync();
}

// Check notification permissions
export async function checkNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Subscription storage for cleanup
let notificationResponseSubscription: EventSubscription | null = null;
let notificationReceivedSubscription: EventSubscription | null = null;

// Listen for notification interactions
// Returns an unsubscribe function for cleanup
export function addNotificationResponseListener(
  callback: (response: NotificationResponse) => void
): () => void {
  // Remove existing subscription if any
  if (notificationResponseSubscription) {
    notificationResponseSubscription.remove();
  }

  notificationResponseSubscription = Notifications.addNotificationResponseReceivedListener(callback);

  // Return cleanup function
  return () => {
    if (notificationResponseSubscription) {
      notificationResponseSubscription.remove();
      notificationResponseSubscription = null;
    }
  };
}

// Listen for received notifications (when app is foregrounded)
// Returns an unsubscribe function for cleanup
export function addNotificationReceivedListener(
  callback: (notification: Notification) => void
): () => void {
  // Remove existing subscription if any
  if (notificationReceivedSubscription) {
    notificationReceivedSubscription.remove();
  }

  notificationReceivedSubscription = Notifications.addNotificationReceivedListener(callback);

  // Return cleanup function
  return () => {
    if (notificationReceivedSubscription) {
      notificationReceivedSubscription.remove();
      notificationReceivedSubscription = null;
    }
  };
}

// Remove all notification listeners (call on app unmount/cleanup)
export function removeAllNotificationListeners(): void {
  if (notificationResponseSubscription) {
    notificationResponseSubscription.remove();
    notificationResponseSubscription = null;
  }
  if (notificationReceivedSubscription) {
    notificationReceivedSubscription.remove();
    notificationReceivedSubscription = null;
  }
}

// Get the raw EventSubscription for advanced use cases (e.g., multiple listeners)
export function addNotificationResponseListenerRaw(
  callback: (response: NotificationResponse) => void
): EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

// Get the raw EventSubscription for advanced use cases (e.g., multiple listeners)
export function addNotificationReceivedListenerRaw(
  callback: (notification: Notification) => void
): EventSubscription {
  return Notifications.addNotificationReceivedListener(callback);
}

// Set badge count
export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    if (__DEV__) console.error('Error setting badge count:', error);
  }
}

// Clear badge count
export async function clearBadgeCount(): Promise<void> {
  await setBadgeCount(0);
}

// Schedule a focus mode reminder
export async function scheduleFocusModeReminder(
  minutes: number,
  enabled: boolean = true
): Promise<string | null> {
  if (!enabled) return null;

  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Focus Time! 🎯",
        body: `Time for a ${minutes}-minute cleaning session!`,
        data: { category: 'focus' } as NotificationData,
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: minutes * 60,
      },
    });
    return identifier;
  } catch (error) {
    if (__DEV__) console.error('Error scheduling focus mode reminder:', error);
    return null;
  }
}

// Motivational notification (random timing)
export async function scheduleMotivationalNotification(): Promise<string | null> {
  const motivationalMessages = [
    { title: "You've got this! 💪", body: "A tidy space is just a few tasks away." },
    { title: "Small steps, big results! 🌟", body: "Every bit of decluttering counts." },
    { title: "Cleaning is self-care! 🧘", body: "Treat yourself to a calm, organized space." },
    { title: "Your mascot believes in you! 🎉", body: "Let's make today a declutter day!" },
    { title: "Progress over perfection! ✨", body: "Even 5 minutes makes a difference." },
  ];

  const message = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

  try {
    // Schedule for a random time between 2-8 hours from now
    const randomHours = 2 + Math.random() * 6;
    const seconds = Math.floor(randomHours * 60 * 60);

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: message.title,
        body: message.body,
        data: { category: 'motivation' } as NotificationData,
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
      },
    });
  } catch (error) {
    if (__DEV__) console.error('Error scheduling motivational notification:', error);
    return null;
  }
}
