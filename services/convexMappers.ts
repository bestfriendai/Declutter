import {
  AppSettings,
  Badge,
  CleaningTask,
  DEFAULT_FOCUS_SETTINGS,
  PhotoCapture,
  Room,
  SubTask,
  UserStats,
} from '@/types/declutter';

type ConvexSettings = {
  notifications?: boolean;
  reminderTime?: string;
  theme?: 'light' | 'dark' | 'auto';
  hapticFeedback?: boolean;
  soundFX?: boolean;
  reducedMotion?: boolean;
  encouragementLevel?: 'minimal' | 'moderate' | 'maximum';
  taskBreakdownLevel?: 'normal' | 'detailed' | 'ultra';
  focusDefaultDuration?: number;
  focusBreakDuration?: number;
  focusAutoStartBreak?: boolean;
  focusBlockNotifications?: boolean;
  focusPlayWhiteNoise?: boolean;
  focusWhiteNoiseType?: 'rain' | 'ocean' | 'forest' | 'cafe' | 'none';
  focusShowMotivationalQuotes?: boolean;
  focusStrictMode?: boolean;
  arCollectionEnabled?: boolean;
  collectibleNotifications?: boolean;
};

type ConvexBadge = {
  badgeId: string;
  name: string;
  description: string;
  emoji: string;
  unlockedAt?: number;
  requirement: number;
  type: 'tasks' | 'rooms' | 'streak' | 'time';
};

type ConvexStats = {
  totalTasksCompleted?: number;
  totalRoomsCleaned?: number;
  currentStreak?: number;
  longestStreak?: number;
  totalMinutesCleaned?: number;
  level?: number;
  xp?: number;
  lastActivityDate?: string;
  weeklyTaskGoal?: number;
  weeklyTimeGoal?: number;
  streakFreezesAvailable?: number;
  streakFreezesUsedThisMonth?: number;
  lastStreakFreezeUsed?: string;
};

type ConvexRoom = {
  _id: string;
  name: Room['name'];
  type: Room['type'];
  emoji: string;
  createdAt: number;
  messLevel: number;
  currentProgress: number;
  lastAnalyzedAt?: number;
  aiSummary?: string;
  motivationalMessage?: string;
};

type ConvexPhoto = {
  _id: string;
  roomId?: string;
  uri: string;
  timestamp: number;
  type: PhotoCapture['type'];
};

type ConvexTask = {
  _id: string;
  roomId?: string;
  title: string;
  description: string;
  emoji: string;
  priority: CleaningTask['priority'];
  difficulty: CleaningTask['difficulty'];
  estimatedMinutes: number;
  completed: boolean;
  completedAt?: number;
  tips?: string[];
  zone?: string;
  targetObjects?: string[];
  destinationLocation?: string;
  destinationInstructions?: string;
  destinationRequiresSetup?: string;
  category?: string;
  energyRequired?: string;
  decisionLoad?: string;
  visualImpact?: string;
  whyThisMatters?: string;
  resistanceHandler?: string;
  dependencies?: string[];
  enables?: string[];
  parallelWith?: string[];
  order?: number;
};

type ConvexSubTask = {
  _id: string;
  taskId?: string;
  title: string;
  completed: boolean;
  estimatedSeconds?: number;
  isCheckpoint?: boolean;
  order?: number;
};

function asDate(timestamp?: number): Date | undefined {
  return timestamp === undefined ? undefined : new Date(timestamp);
}

export function mapConvexSettingsToAppSettings(
  settings: ConvexSettings | null | undefined
): AppSettings {
  return {
    notifications: settings?.notifications ?? true,
    reminderTime: settings?.reminderTime,
    theme: settings?.theme ?? 'auto',
    hapticFeedback: settings?.hapticFeedback ?? true,
    soundFX: settings?.soundFX ?? true,
    reducedMotion: settings?.reducedMotion ?? false,
    encouragementLevel: settings?.encouragementLevel ?? 'moderate',
    taskBreakdownLevel: settings?.taskBreakdownLevel ?? 'detailed',
    focusMode: {
      defaultDuration:
        settings?.focusDefaultDuration ?? DEFAULT_FOCUS_SETTINGS.defaultDuration,
      breakDuration:
        settings?.focusBreakDuration ?? DEFAULT_FOCUS_SETTINGS.breakDuration,
      autoStartBreak:
        settings?.focusAutoStartBreak ?? DEFAULT_FOCUS_SETTINGS.autoStartBreak,
      blockNotifications:
        settings?.focusBlockNotifications ??
        DEFAULT_FOCUS_SETTINGS.blockNotifications,
      playWhiteNoise:
        settings?.focusPlayWhiteNoise ?? DEFAULT_FOCUS_SETTINGS.playWhiteNoise,
      whiteNoiseType:
        settings?.focusWhiteNoiseType ??
        DEFAULT_FOCUS_SETTINGS.whiteNoiseType,
      showMotivationalQuotes:
        settings?.focusShowMotivationalQuotes ??
        DEFAULT_FOCUS_SETTINGS.showMotivationalQuotes,
      strictMode:
        settings?.focusStrictMode ?? DEFAULT_FOCUS_SETTINGS.strictMode,
    },
    arCollectionEnabled: settings?.arCollectionEnabled ?? true,
    collectibleNotifications: settings?.collectibleNotifications ?? true,
  };
}

export function mapConvexBadgeToBadge(badge: ConvexBadge): Badge {
  return {
    id: badge.badgeId,
    name: badge.name,
    description: badge.description,
    emoji: badge.emoji,
    unlockedAt: asDate(badge.unlockedAt),
    requirement: badge.requirement,
    type: badge.type,
  };
}

export function mapConvexStatsToUserStats(
  stats: ConvexStats | null | undefined,
  badges: ConvexBadge[] = []
): UserStats {
  return {
    totalTasksCompleted: stats?.totalTasksCompleted ?? 0,
    totalRoomsCleaned: stats?.totalRoomsCleaned ?? 0,
    currentStreak: stats?.currentStreak ?? 0,
    longestStreak: stats?.longestStreak ?? 0,
    totalMinutesCleaned: stats?.totalMinutesCleaned ?? 0,
    level: stats?.level ?? 1,
    xp: stats?.xp ?? 0,
    badges: badges.map(mapConvexBadgeToBadge),
    lastActivityDate: stats?.lastActivityDate,
    weeklyTaskGoal: stats?.weeklyTaskGoal,
    weeklyTimeGoal: stats?.weeklyTimeGoal,
    streakFreezesAvailable: stats?.streakFreezesAvailable,
    streakFreezesUsedThisMonth: stats?.streakFreezesUsedThisMonth,
    lastStreakFreezeUsed: stats?.lastStreakFreezeUsed,
  };
}

export function mapConvexPhotoToPhoto(photo: ConvexPhoto): PhotoCapture {
  return {
    id: photo._id,
    uri: photo.uri,
    timestamp: new Date(photo.timestamp),
    type: photo.type,
  };
}

export function mapConvexSubTaskToSubTask(subtask: ConvexSubTask): SubTask {
  return {
    id: subtask._id,
    title: subtask.title,
    completed: subtask.completed,
    estimatedSeconds: subtask.estimatedSeconds,
    isCheckpoint: subtask.isCheckpoint,
  };
}

export function mapConvexTaskToTask(
  task: ConvexTask,
  subtasks: ConvexSubTask[] = []
): CleaningTask {
  return {
    id: task._id,
    title: task.title,
    description: task.description,
    emoji: task.emoji,
    priority: task.priority,
    difficulty: task.difficulty,
    estimatedMinutes: task.estimatedMinutes,
    completed: task.completed,
    completedAt: asDate(task.completedAt),
    tips: task.tips,
    zone: task.zone,
    targetObjects: task.targetObjects,
    destination: task.destinationLocation
      ? {
          location: task.destinationLocation,
          instructions: task.destinationInstructions,
          requiresSetup: task.destinationRequiresSetup,
        }
      : undefined,
    category: task.category as CleaningTask['category'],
    energyRequired: task.energyRequired as CleaningTask['energyRequired'],
    decisionLoad: task.decisionLoad as CleaningTask['decisionLoad'],
    visualImpact: task.visualImpact as CleaningTask['visualImpact'],
    whyThisMatters: task.whyThisMatters,
    resistanceHandler: task.resistanceHandler,
    dependencies: task.dependencies,
    enables: task.enables,
    parallelWith: task.parallelWith,
    subtasks: subtasks
      .slice()
      .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
      .map(mapConvexSubTaskToSubTask),
  };
}

export function mapConvexRoomToRoom(
  room: ConvexRoom,
  photos: ConvexPhoto[] = [],
  tasks: ConvexTask[] = [],
  subtasksByTaskId: Record<string, ConvexSubTask[]> = {}
): Room {
  return {
    id: room._id,
    name: room.name,
    type: room.type,
    emoji: room.emoji,
    createdAt: new Date(room.createdAt),
    photos: photos.map(mapConvexPhotoToPhoto),
    tasks: tasks
      .slice()
      .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
      .map((task) =>
        mapConvexTaskToTask(task, subtasksByTaskId[task._id] ?? [])
      ),
    messLevel: room.messLevel,
    currentProgress: room.currentProgress,
    lastAnalyzedAt: asDate(room.lastAnalyzedAt),
    aiSummary: room.aiSummary,
    motivationalMessage: room.motivationalMessage,
  };
}
