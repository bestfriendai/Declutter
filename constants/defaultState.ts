import {
  AppSettings,
  CollectionStats,
  DEFAULT_FOCUS_SETTINGS,
  UserStats,
} from '@/types/declutter';

export const defaultStats: UserStats = {
  totalTasksCompleted: 0,
  totalRoomsCleaned: 0,
  currentStreak: 0,
  longestStreak: 0,
  totalMinutesCleaned: 0,
  level: 1,
  xp: 0,
  badges: [],
};

export const defaultSettings: AppSettings = {
  notifications: true,
  theme: 'auto',
  hapticFeedback: true,
  soundFX: true,
  reducedMotion: false,
  encouragementLevel: 'moderate',
  taskBreakdownLevel: 'detailed',
  focusMode: DEFAULT_FOCUS_SETTINGS,
  arCollectionEnabled: true,
  collectibleNotifications: true,
};

export const defaultCollectionStats: CollectionStats = {
  totalCollected: 0,
  uniqueCollected: 0,
  commonCount: 0,
  uncommonCount: 0,
  rareCount: 0,
  epicCount: 0,
  legendaryCount: 0,
};
