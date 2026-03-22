/**
 * Push Notifications Service
 * Handles local and push notifications for reminders and achievements
 */

import { Notifications, notificationsAvailable } from '@/services/notificationsRuntime';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import type {
    EventSubscription,
    Notification,
    NotificationRequest,
    NotificationResponse,
} from 'expo-notifications';
import { Platform } from 'react-native';

// NOTE: Notification handler is configured in app/_layout.tsx (root layout).
// Do NOT set it here to avoid duplicate handlers.

import { STORAGE_KEYS } from '@/constants/storageKeys';

// Storage key for notification token
const NOTIFICATION_TOKEN_KEY = STORAGE_KEYS.NOTIFICATION_TOKEN;

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
  if (__DEV__) console.log('[Notifications] Device.isDevice:', Device.isDevice, 'Platform:', Platform.OS);

  // On iOS dev client builds, Device.isDevice may be false even on real devices.
  // Only skip on web platform.
  if (Platform.OS === 'web') {
    if (__DEV__) console.log('[Notifications] Web platform, skipping push registration');
    return null;
  }

  try {
    // Check existing permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (__DEV__) console.log('[Notifications] Existing permission status:', existingStatus);
    let finalStatus = existingStatus;

    // Request permission if not granted
    if (existingStatus !== 'granted') {
      if (__DEV__) console.log('[Notifications] Requesting permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      if (__DEV__) console.log('[Notifications] New permission status:', finalStatus);
    }

    if (finalStatus !== 'granted') {
      if (__DEV__) console.log('[Notifications] Permission not granted, final status:', finalStatus);
      return null;
    }

    // Get push token - projectId is required for Expo push notifications.
    // Prefer EAS runtime config and keep env var as fallback.
    const projectId =
      Constants.easConfig?.projectId ??
      Constants.expoConfig?.extra?.eas?.projectId ??
      process.env.EXPO_PUBLIC_PROJECT_ID;
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

    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_REMINDER_ID, identifier);
    return identifier;
  } catch (error) {
    if (__DEV__) console.error('Error scheduling daily reminder:', error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSONALITY-DRIVEN NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

type PersonalityType = 'spark' | 'bubbles' | 'dusty' | 'tidy';
type NotificationMoment = 'comeback' | 'streak_risk' | 'daily_reminder' | 'achievement';

const PERSONALITY_MESSAGES: Record<PersonalityType, Record<NotificationMoment, string[]>> = {
  spark: {
    comeback: [
      "Let's GO! Your room misses you! \u{26A1}",
      "ENERGY CHECK! Time to crush some tasks! \u{1F525}",
      "You've been away too long! Let's make sparks fly! \u{26A1}",
    ],
    streak_risk: [
      "Your streak is in danger! Quick, do ONE thing! \u{26A1}",
      "Don't let the fire die! 60 seconds is all it takes! \u{1F525}",
      "STREAK ALERT! Jump in for a speed round! \u{26A1}",
    ],
    daily_reminder: [
      "Rise and SHINE! Today's the day we conquer clutter! \u{26A1}",
      "Let's GO! Your space is ready for a transformation! \u{1F525}",
      "ENERGY MODE: ON! Time to clean! \u{26A1}",
    ],
    achievement: [
      "BOOM! You're CRUSHING it! Keep that energy! \u{26A1}\u{1F525}",
      "UNSTOPPABLE! Look at you go! \u{1F4AA}\u{26A1}",
      "That's what I'm TALKING about! You're on FIRE! \u{1F525}",
    ],
  },
  bubbles: {
    comeback: [
      "Hey friend, your space is waiting for a little love \u{1FAE7}",
      "Hehe, I missed you! Wanna tidy up together? \u{1F60A}",
      "Welcome back, friend! No rush, just happy to see you \u{1FAE7}",
    ],
    streak_risk: [
      "Psst, your streak needs a little hug! Just one tiny task? \u{1FAE7}",
      "Your streak is getting sleepy... wake it up with one task! \u{1F60A}",
      "A gentle reminder: your streak would love some attention \u{1FAE7}",
    ],
    daily_reminder: [
      "Good morning, sunshine! Ready for a gentle tidy? \u{1FAE7}",
      "Hehe, cleaning is so much fun together! Shall we? \u{1F60A}",
      "Your space would love a little sparkle today \u{1FAE7}",
    ],
    achievement: [
      "Yaaay! You did it! I'm so proud of you! \u{1F60A}\u{2728}",
      "That was beautiful! Your space is glowing! \u{1FAE7}\u{2728}",
      "Hehe, look how amazing that turned out! \u{1F60A}",
    ],
  },
  dusty: {
    comeback: [
      "No rush, but your room could use some attention when you're ready \u{1F9F8}",
      "Hey. Take your time. I'll be here when you're ready to tidy \u{1F9F9}",
      "Your space will wait. But whenever you're ready, I'm here \u{1F9F8}",
    ],
    streak_risk: [
      "Your streak's been good to you. Return the favor with 60 seconds? \u{1F9F8}",
      "No pressure, but your streak could use a quick check-in \u{1F9F9}",
      "Slow and steady keeps the streak alive. One small thing? \u{1F9F8}",
    ],
    daily_reminder: [
      "Slow and steady, friend. Every small step counts \u{1F9F8}",
      "One task at a time. No rush. You've got this \u{1F9F9}",
      "Your pace is your pace. Ready when you are \u{1F9F8}",
    ],
    achievement: [
      "Well done. Quiet progress is still progress \u{1F9F8}\u{2728}",
      "See? Slow and steady wins. Nice work \u{1F9F9}",
      "That's the way. One step at a time \u{1F9F8}",
    ],
  },
  tidy: {
    comeback: [
      "3 tasks remaining in your kitchen. 15 minutes should do it \u{1F4CB}",
      "Your cleaning queue has updates. Shall we review? \u{1F4CB}",
      "Status update: your rooms could use a refresh \u{1F4CB}",
    ],
    streak_risk: [
      "Streak status: at risk. 1 task required to maintain \u{1F4CB}",
      "Data point: your streak ends today unless you complete 1 task \u{1F4CB}",
      "Efficiency tip: 60 seconds now saves your streak \u{1F4CB}",
    ],
    daily_reminder: [
      "Daily briefing: your schedule has room for a quick tidy \u{1F4CB}",
      "Task queue ready. Estimated time: 10 minutes \u{1F4CB}",
      "Morning check-in: 3 quick wins available today \u{1F4CB}",
    ],
    achievement: [
      "Task complete. Efficiency rating: excellent \u{1F4CB}\u{2705}",
      "Well organized. Your completion rate is up \u{1F4CA}",
      "Achievement logged. Progress metrics looking strong \u{1F4CB}",
    ],
  },
};

/**
 * Get a personality-appropriate notification message.
 * Uses the user's mascot personality to customize notification copy.
 */
export function getPersonalityNotification(
  personality: PersonalityType | string,
  type: NotificationMoment
): { title: string; body: string } {
  const validPersonality = (
    ['spark', 'bubbles', 'dusty', 'tidy'].includes(personality)
      ? personality
      : 'dusty'
  ) as PersonalityType;

  const messages = PERSONALITY_MESSAGES[validPersonality][type];
  const body = messages[Math.floor(Math.random() * messages.length)];

  // Generate appropriate title based on type
  const titles: Record<NotificationMoment, string[]> = {
    comeback: ['Welcome back!', 'Hey there!', 'Look who\'s here!'],
    streak_risk: ['Streak alert!', 'Quick heads up!', 'Streak check!'],
    daily_reminder: ['Time to tidy!', 'Daily reminder', 'Cleaning time!'],
    achievement: ['Amazing work!', 'Achievement!', 'Well done!'],
  };

  const titleOptions = titles[type];
  const title = titleOptions[Math.floor(Math.random() * titleOptions.length)];

  return { title, body };
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

    await AsyncStorage.setItem(STORAGE_KEYS.STREAK_REMINDER_ID, identifier);
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
  enabled: boolean = true,
  mascotPersonality?: string
): Promise<string | null> {
  await cancelScheduledReminder('daily-reminder');

  if (!enabled) return null;

  try {
    // Use personality-aware copy when mascot personality is available
    const message = mascotPersonality
      ? getPersonalityNotification(mascotPersonality, 'daily_reminder')
      : SHAME_FREE_REMINDERS[Math.floor(Math.random() * SHAME_FREE_REMINDERS.length)];

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

    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_REMINDER_ID, identifier);
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
export async function notifyWelcomeBack(
  _daysSinceActivity: number,
  mascotPersonality?: string
): Promise<void> {
  // Use personality-aware copy when available
  const message = mascotPersonality
    ? getPersonalityNotification(mascotPersonality, 'comeback')
    : WELCOME_BACK_NOTIFICATIONS[Math.floor(Math.random() * WELCOME_BACK_NOTIFICATIONS.length)];

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

    await AsyncStorage.setItem(STORAGE_KEYS.GRACE_REMINDER_ID, identifier);
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
      STORAGE_KEYS.DAILY_REMINDER_ID,
      STORAGE_KEYS.STREAK_REMINDER_ID,
      STORAGE_KEYS.GRACE_REMINDER_ID,
      STORAGE_KEYS.OPTIMAL_NOTIFICATION_ID,
      STORAGE_KEYS.COMEBACK_NUDGE_ID,
      STORAGE_KEYS.SESSION_CELEBRATION_ID,
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

// ─────────────────────────────────────────────────────────────────────────────
// SMART DAILY REMINDER — room-aware, specific
// ─────────────────────────────────────────────────────────────────────────────

interface SmartReminderRoom {
  name: string;
  incompleteTasks: number;
  totalMinutes: number;
}

/**
 * Schedule a smart daily reminder that references actual room data.
 * Picks the most urgent room and creates a specific, actionable message.
 * Falls back to generic shame-free messages if no room data is available.
 */
export async function scheduleSmartDailyReminder(
  hour: number,
  minute: number,
  rooms: SmartReminderRoom[] = [],
  enabled: boolean = true
): Promise<string | null> {
  if (!notificationsAvailable) return null;

  await cancelScheduledReminder('daily-reminder');

  if (!enabled) return null;

  let title: string;
  let body: string;

  // Find the room with the most incomplete tasks
  const urgentRoom = rooms
    .filter(r => r.incompleteTasks > 0)
    .sort((a, b) => b.incompleteTasks - a.incompleteTasks)[0];

  if (urgentRoom) {
    title = `Your ${urgentRoom.name} is waiting`;
    body = `${urgentRoom.incompleteTasks} quick task${urgentRoom.incompleteTasks !== 1 ? 's' : ''} (${urgentRoom.totalMinutes} min total). You've got this!`;
  } else {
    // Fall back to generic shame-free messages
    const message = SHAME_FREE_REMINDERS[Math.floor(Math.random() * SHAME_FREE_REMINDERS.length)];
    title = message.title;
    body = message.body;
  }

  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
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

    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_REMINDER_ID, identifier);
    return identifier;
  } catch (error) {
    if (__DEV__) console.error('Error scheduling smart daily reminder:', error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOM FRESHNESS, COMEBACK NUDGE & SESSION CELEBRATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Schedule a room freshness alert that fires once after N hours.
 * Nudges the user to revisit a room whose freshness is dropping.
 */
export async function scheduleRoomFreshnessAlert(
  roomName: string,
  hoursFromNow: number = 48
): Promise<string | null> {
  if (!notificationsAvailable) return null;

  const key = `freshness-${roomName.toLowerCase().replace(/\s/g, '-')}`;
  await cancelScheduledReminder(key);

  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${roomName} needs attention`,
        body: `Your ${roomName.toLowerCase()} freshness is dropping. Quick 5-min sweep?`,
        data: { category: 'reminder' } as NotificationData,
        sound: 'default',
        categoryIdentifier: 'reminders',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: hoursFromNow * 3600,
      },
    });

    await AsyncStorage.setItem(`${key}-id`, identifier);
    return identifier;
  } catch (error) {
    if (__DEV__) console.error('Error scheduling room freshness alert:', error);
    return null;
  }
}

/**
 * Schedule a comeback nudge for inactive users.
 * Fires once after N days. Each call replaces the previous nudge.
 * Messages are shame-free, sourced from the comeback engine philosophy.
 */
export async function scheduleComebackNudge(
  daysFromNow: number = 3
): Promise<string | null> {
  if (!notificationsAvailable) return null;

  await cancelScheduledReminder('comeback-nudge');

  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'No pressure!',
        body: 'Want to do just one tiny thing today? Dusty misses you.',
        data: { category: 'motivation' } as NotificationData,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: daysFromNow * 86400,
      },
    });

    await AsyncStorage.setItem(STORAGE_KEYS.COMEBACK_NUDGE_ID, identifier);
    return identifier;
  } catch (error) {
    if (__DEV__) console.error('Error scheduling comeback nudge:', error);
    return null;
  }
}

/**
 * Schedule a celebration notification after a cleaning session.
 * Fires 1 hour later when the user has likely put the phone down,
 * reinforcing the positive feeling.
 */
export async function scheduleSessionEndCelebration(
  tasksCompleted: number,
  xpEarned: number
): Promise<string | null> {
  if (!notificationsAvailable) return null;

  await cancelScheduledReminder('session-celebration');

  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Nice work today!',
        body: `You crushed ${tasksCompleted} task${tasksCompleted > 1 ? 's' : ''} and earned ${xpEarned} XP. Dusty is proud!`,
        data: { category: 'achievement' } as NotificationData,
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 3600, // 1 hour later
      },
    });

    await AsyncStorage.setItem(STORAGE_KEYS.SESSION_CELEBRATION_ID, identifier);
    return identifier;
  } catch (error) {
    if (__DEV__) console.error('Error scheduling session celebration:', error);
    return null;
  }
}
