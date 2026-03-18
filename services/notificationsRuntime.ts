import { Platform } from 'react-native';
import type * as ExpoNotifications from 'expo-notifications';

const noopSubscription = {
  remove() {},
} as ExpoNotifications.EventSubscription;

const notificationsStub = {
  AndroidImportance: {
    HIGH: 5,
    DEFAULT: 3,
    LOW: 2,
  },
  SchedulableTriggerInputTypes: {
    DAILY: 'daily',
    DATE: 'date',
    TIME_INTERVAL: 'timeInterval',
  },
  setNotificationHandler() {},
  getPermissionsAsync: async () => ({ status: 'denied' }),
  requestPermissionsAsync: async () => ({ status: 'denied' }),
  getExpoPushTokenAsync: async () => ({ data: '' }),
  setNotificationChannelAsync: async () => {},
  scheduleNotificationAsync: async () => '',
  cancelScheduledNotificationAsync: async () => {},
  cancelAllScheduledNotificationsAsync: async () => {},
  getAllScheduledNotificationsAsync: async () => [],
  addNotificationResponseReceivedListener: () => noopSubscription,
  addNotificationReceivedListener: () => noopSubscription,
  setBadgeCountAsync: async () => {},
} as unknown as typeof ExpoNotifications;

export const notificationsAvailable = Platform.OS !== 'web';

export const Notifications: typeof ExpoNotifications = notificationsAvailable
  ? (require('expo-notifications') as typeof ExpoNotifications)
  : notificationsStub;
