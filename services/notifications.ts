/**
 * Push Notifications Service
 * Handles local and push notifications for reminders and achievements
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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
    console.log('Push notifications require a physical device');
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
      console.log('Push notification permission not granted');
      return null;
    }

    // Get push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
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
    console.error('Error registering for push notifications:', error);
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
    console.error('Error scheduling daily reminder:', error);
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

// Schedule streak reminder (warns before streak breaks)
export async function scheduleStreakReminder(
  currentStreak: number,
  enabled: boolean = true
): Promise<string | null> {
  await cancelScheduledReminder('streak-reminder');

  if (!enabled || currentStreak < 2) return null;

  try {
    // Schedule for evening if user hasn't cleaned today
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Don't Break Your ${currentStreak}-Day Streak! 🔥`,
        body: "Complete just one quick task to keep it going!",
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
    console.error('Error scheduling streak reminder:', error);
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
    console.error('Error showing notification:', error);
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

// Cancel a scheduled notification
export async function cancelScheduledReminder(key: string): Promise<void> {
  try {
    const identifier = await AsyncStorage.getItem(`${key}-id`);
    if (identifier) {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      await AsyncStorage.removeItem(`${key}-id`);
    }
  } catch (error) {
    console.error('Error canceling notification:', error);
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
    console.error('Error canceling all notifications:', error);
  }
}

// Get pending notifications
export async function getPendingNotifications(): Promise<Notifications.NotificationRequest[]> {
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

// Listen for notification interactions
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

// Listen for received notifications (when app is foregrounded)
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(callback);
}

// Set badge count
export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error setting badge count:', error);
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
    console.error('Error scheduling focus mode reminder:', error);
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
    console.error('Error scheduling motivational notification:', error);
    return null;
  }
}
