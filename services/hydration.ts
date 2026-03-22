import {
  AppSettings,
  Badge,
  CleaningTask,
  CollectedItem,
  EnergyLevel,
  CollectionStats,
  Mascot,
  MascotPersonality,
  OnboardingEnergyLevel,
  Room,
  UserProfile,
  UserStats,
} from '@/types/declutter';
import {
  defaultCollectionStats,
  defaultSettings,
  defaultStats,
} from '@/constants/defaultState';

type JsonRecord = Record<string, unknown>;

export interface HydratedCloudState {
  user: UserProfile | null;
  rooms: Room[];
  stats: UserStats;
  settings: AppSettings;
  mascot: Mascot | null;
  collection: CollectedItem[];
  collectionStats: CollectionStats;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
}

function asOptionalString(value: unknown): string | undefined {
  const nextValue = asString(value);
  return nextValue.length > 0 ? nextValue : undefined;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value
    .map((item) => asString(item))
    .filter((item) => item.length > 0);
}

function asDate(value: unknown, fallback = new Date()): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'number' || typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return fallback;
}

function asOptionalDate(value: unknown): Date | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  return asDate(value);
}

function asEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  return typeof value === 'string' && allowed.includes(value as T)
    ? (value as T)
    : fallback;
}

function asOptionalEnum<T extends string>(
  value: unknown,
  allowed: readonly T[]
): T | undefined {
  return typeof value === 'string' && allowed.includes(value as T)
    ? (value as T)
    : undefined;
}

function hydrateBadge(badge: unknown): Badge | null {
  if (!isRecord(badge)) {
    return null;
  }

  return {
    id: asString(badge.id),
    name: asString(badge.name, 'Badge'),
    description: asString(badge.description),
    emoji: asString(badge.emoji, '🏆'),
    unlockedAt: asOptionalDate(badge.unlockedAt),
    requirement: asNumber(badge.requirement, 1),
    type: asEnum(
      badge.type,
      ['tasks', 'rooms', 'streak', 'time', 'comeback', 'longComeback', 'sessions'],
      'tasks'
    ),
  };
}

function hydrateSubTask(subtask: unknown): NonNullable<CleaningTask['subtasks']>[number] {
  const subtaskData = isRecord(subtask) ? subtask : {};
  return {
    id: asString(subtaskData.id),
    title: asString(subtaskData.title, 'Step'),
    completed: asBoolean(subtaskData.completed),
    estimatedSeconds: subtaskData.estimatedSeconds === undefined
      ? undefined
      : asNumber(subtaskData.estimatedSeconds),
    estimatedMinutes: subtaskData.estimatedMinutes === undefined
      ? undefined
      : asNumber(subtaskData.estimatedMinutes),
    isCheckpoint: subtaskData.isCheckpoint === undefined
      ? undefined
      : asBoolean(subtaskData.isCheckpoint),
  };
}

function hydrateDestination(value: unknown): CleaningTask['destination'] {
  if (!isRecord(value)) {
    return undefined;
  }

  const location = asOptionalString(value.location);
  if (!location) {
    return undefined;
  }

  return {
    location,
    instructions: asOptionalString(value.instructions),
    requiresSetup: asOptionalString(value.requiresSetup),
  };
}

export function hydrateTask(task: unknown): CleaningTask {
  const taskData = isRecord(task) ? task : {};

  return {
    id: asString(taskData.id),
    title: asString(taskData.title, 'Task'),
    description: asString(taskData.description),
    emoji: asString(taskData.emoji, '📋'),
    priority: asEnum(taskData.priority, ['high', 'medium', 'low'], 'medium'),
    difficulty: asEnum(
      taskData.difficulty,
      ['quick', 'medium', 'challenging'],
      'quick'
    ),
    estimatedMinutes: asNumber(taskData.estimatedMinutes, 5),
    completed: asBoolean(taskData.completed),
    completedAt: asOptionalDate(taskData.completedAt),
    tips: asStringArray(taskData.tips),
    subtasks: Array.isArray(taskData.subtasks)
      ? taskData.subtasks.map(hydrateSubTask)
      : undefined,
    zone: asOptionalString(taskData.zone),
    targetObjects: asStringArray(taskData.targetObjects),
    destination: hydrateDestination(taskData.destination),
    dependencies: asStringArray(taskData.dependencies),
    enables: asStringArray(taskData.enables),
    parallelWith: asStringArray(taskData.parallelWith),
    category: asOptionalEnum(
      taskData.category,
      [
        'trash_removal',
        'surface_clearing',
        'dishes',
        'laundry',
        'organization',
        'deep_cleaning',
        'maintenance',
        'donation_sorting',
        'setup',
      ]
    ),
    energyRequired: (() => {
      const raw = asOptionalEnum(taskData.energyRequired, ['exhausted', 'minimal', 'low', 'moderate', 'high']);
      return raw === 'minimal' ? 'exhausted' as const : raw as EnergyLevel | undefined;
    })(),
    decisionLoad: asOptionalEnum(
      taskData.decisionLoad,
      ['none', 'low', 'medium', 'high']
    ),
    visualImpact: asOptionalEnum(taskData.visualImpact, ['low', 'medium', 'high']),
    whyThisMatters: asOptionalString(taskData.whyThisMatters),
    resistanceHandler: asOptionalString(taskData.resistanceHandler),
    suppliesNeeded: asStringArray(taskData.suppliesNeeded),
    actualMinutes: taskData.actualMinutes === undefined
      ? undefined
      : asNumber(taskData.actualMinutes),
    difficultyFeedback: asOptionalEnum(
      taskData.difficultyFeedback,
      ['easier', 'accurate', 'harder']
    ),
    userSkipped: taskData.userSkipped === undefined
      ? undefined
      : asBoolean(taskData.userSkipped),
    skipReason: asOptionalString(taskData.skipReason),
    decisionPoints: taskData.decisionPoints as CleaningTask['decisionPoints'] ?? undefined,
  };
}

function hydratePhoto(photo: unknown): Room['photos'][number] {
  const photoData = isRecord(photo) ? photo : {};
  return {
    id: asString(photoData.id),
    uri: asString(photoData.uri),
    timestamp: asDate(photoData.timestamp),
    type: asEnum(photoData.type, ['before', 'progress', 'after'], 'before'),
  };
}

export function hydrateRoom(room: unknown): Room {
  const roomData = isRecord(room) ? room : {};
  return {
    id: asString(roomData.id),
    name: asString(roomData.name, 'Untitled room'),
    type: asEnum(
      roomData.type,
      ['bedroom', 'kitchen', 'bathroom', 'livingRoom', 'office', 'garage', 'closet', 'other'],
      'other'
    ),
    emoji: asString(roomData.emoji, '🏠'),
    createdAt: asDate(roomData.createdAt),
    photos: Array.isArray(roomData.photos)
      ? roomData.photos.map(hydratePhoto)
      : [],
    tasks: Array.isArray(roomData.tasks)
      ? roomData.tasks.map(hydrateTask)
      : [],
    messLevel: asNumber(roomData.messLevel, 0),
    currentProgress: asNumber(roomData.currentProgress, 0),
    lastAnalyzedAt: asOptionalDate(roomData.lastAnalyzedAt),
    aiSummary: asOptionalString(roomData.aiSummary),
    motivationalMessage: asOptionalString(roomData.motivationalMessage),
  };
}

export function hydrateRooms(rooms: unknown): Room[] {
  return Array.isArray(rooms) ? rooms.map(hydrateRoom) : [];
}

export function hydrateUserProfile(profile: unknown): UserProfile | null {
  if (!isRecord(profile)) {
    return null;
  }

  return {
    id: asString(profile.id),
    name: asString(profile.name, 'Declutterer'),
    avatar: asOptionalString(profile.avatar),
    createdAt: asDate(profile.createdAt),
    onboardingComplete: asBoolean(profile.onboardingComplete),
    livingSituation: asOptionalEnum(
      profile.livingSituation,
      ['studio', 'apartment', 'house', 'dorm', 'shared']
    ),
    cleaningStruggles: asStringArray(profile.cleaningStruggles),
    energyLevel: asOptionalEnum(
      profile.energyLevel,
      ['exhausted', 'low', 'moderate', 'high', 'hyperfocused']
    ) as OnboardingEnergyLevel | undefined,
    timeAvailability: profile.timeAvailability === undefined
      ? undefined
      : asNumber(profile.timeAvailability),
    motivationStyle: asOptionalString(profile.motivationStyle),
    guidePersonality: asOptionalEnum(
      profile.guidePersonality,
      ['spark', 'bubbles', 'dusty', 'tidy']
    ) as MascotPersonality | undefined,
  };
}

export function hydrateStats(stats: unknown): UserStats {
  if (!isRecord(stats)) {
    return defaultStats;
  }

  return {
    ...defaultStats,
    ...stats,
    totalTasksCompleted: asNumber(stats.totalTasksCompleted, 0),
    totalRoomsCleaned: asNumber(stats.totalRoomsCleaned, 0),
    currentStreak: asNumber(stats.currentStreak, 0),
    longestStreak: asNumber(stats.longestStreak, 0),
    totalMinutesCleaned: asNumber(stats.totalMinutesCleaned, 0),
    level: asNumber(stats.level, 1),
    xp: asNumber(stats.xp, 0),
    badges: Array.isArray(stats.badges)
      ? stats.badges.map(hydrateBadge).filter((badge): badge is Badge => badge !== null)
      : [],
    lastActivityDate: asOptionalString(stats.lastActivityDate),
    weeklyTaskGoal: stats.weeklyTaskGoal === undefined
      ? undefined
      : asNumber(stats.weeklyTaskGoal),
    weeklyTimeGoal: stats.weeklyTimeGoal === undefined
      ? undefined
      : asNumber(stats.weeklyTimeGoal),
    streakFreezesAvailable: stats.streakFreezesAvailable === undefined
      ? undefined
      : asNumber(stats.streakFreezesAvailable),
    streakFreezesUsedThisMonth: stats.streakFreezesUsedThisMonth === undefined
      ? undefined
      : asNumber(stats.streakFreezesUsedThisMonth),
    lastStreakFreezeUsed: asOptionalString(stats.lastStreakFreezeUsed),
    totalCleaningSessions: stats.totalCleaningSessions === undefined
      ? undefined
      : asNumber(stats.totalCleaningSessions),
    gracePeriodEndsAt: asOptionalString(stats.gracePeriodEndsAt),
    comebackBonusMultiplier: stats.comebackBonusMultiplier === undefined
      ? undefined
      : asNumber(stats.comebackBonusMultiplier),
    lastComebackDate: asOptionalString(stats.lastComebackDate),
    comebackCount: stats.comebackCount === undefined
      ? undefined
      : asNumber(stats.comebackCount),
  };
}

export function hydrateSettings(settings: unknown): AppSettings {
  if (!isRecord(settings)) {
    return defaultSettings;
  }

  const focusMode = isRecord(settings.focusMode) ? settings.focusMode : {};

  return {
    notifications: asBoolean(settings.notifications, defaultSettings.notifications),
    reminderTime: asOptionalString(settings.reminderTime),
    theme: asEnum(settings.theme, ['light', 'dark', 'auto'], defaultSettings.theme),
    hapticFeedback: asBoolean(
      settings.hapticFeedback,
      defaultSettings.hapticFeedback
    ),
    soundFX: asBoolean(settings.soundFX, defaultSettings.soundFX),
    reducedMotion: asBoolean(
      settings.reducedMotion,
      defaultSettings.reducedMotion
    ),
    encouragementLevel: asEnum(
      settings.encouragementLevel,
      ['minimal', 'moderate', 'maximum'],
      defaultSettings.encouragementLevel
    ),
    taskBreakdownLevel: asEnum(
      settings.taskBreakdownLevel,
      ['normal', 'detailed', 'ultra'],
      defaultSettings.taskBreakdownLevel
    ),
    focusMode: {
      defaultDuration: asNumber(
        focusMode.defaultDuration,
        defaultSettings.focusMode.defaultDuration
      ),
      breakDuration: asNumber(
        focusMode.breakDuration,
        defaultSettings.focusMode.breakDuration
      ),
      autoStartBreak: asBoolean(
        focusMode.autoStartBreak,
        defaultSettings.focusMode.autoStartBreak
      ),
      blockNotifications: asBoolean(
        focusMode.blockNotifications,
        defaultSettings.focusMode.blockNotifications
      ),
      playWhiteNoise: asBoolean(
        focusMode.playWhiteNoise,
        defaultSettings.focusMode.playWhiteNoise
      ),
      whiteNoiseType: asEnum(
        focusMode.whiteNoiseType,
        ['rain', 'ocean', 'forest', 'cafe', 'none'],
        defaultSettings.focusMode.whiteNoiseType
      ),
      showMotivationalQuotes: asBoolean(
        focusMode.showMotivationalQuotes,
        defaultSettings.focusMode.showMotivationalQuotes
      ),
      strictMode: asBoolean(
        focusMode.strictMode,
        defaultSettings.focusMode.strictMode
      ),
    },
    arCollectionEnabled: asBoolean(
      settings.arCollectionEnabled,
      defaultSettings.arCollectionEnabled
    ),
    collectibleNotifications: asBoolean(
      settings.collectibleNotifications,
      defaultSettings.collectibleNotifications
    ),
  };
}

export function hydrateMascot(mascot: unknown): Mascot | null {
  if (!isRecord(mascot)) {
    return null;
  }

  return {
    name: asString(mascot.name, 'Buddy'),
    personality: asEnum(mascot.personality, ['spark', 'bubbles', 'dusty', 'tidy'], 'spark'),
    mood: asEnum(
      mascot.mood,
      ['ecstatic', 'happy', 'content', 'neutral', 'sad', 'sleepy', 'excited'],
      'happy'
    ),
    activity: asEnum(
      mascot.activity,
      ['idle', 'cheering', 'sleeping', 'dancing', 'cleaning', 'celebrating'],
      'idle'
    ),
    level: asNumber(mascot.level, 1),
    xp: asNumber(mascot.xp, 0),
    hunger: asNumber(mascot.hunger, 100),
    energy: asNumber(mascot.energy, 100),
    happiness: asNumber(mascot.happiness, 100),
    lastFed: asDate(mascot.lastFed),
    lastInteraction: asDate(mascot.lastInteraction),
    createdAt: asDate(mascot.createdAt),
    accessories: asStringArray(mascot.accessories) ?? [],
    currentAccessory: asOptionalString(mascot.currentAccessory),
  };
}

export function hydrateCollection(collection: unknown): CollectedItem[] {
  if (!Array.isArray(collection)) {
    return [];
  }

  const hydratedItems: CollectedItem[] = [];

  for (const item of collection) {
    if (!isRecord(item)) {
      continue;
    }

    hydratedItems.push({
      collectibleId: asString(item.collectibleId),
      collectedAt: asDate(item.collectedAt),
      roomId: asOptionalString(item.roomId),
      taskId: asOptionalString(item.taskId),
    });
  }

  return hydratedItems;
}

export function hydrateCollectionStats(
  stats: unknown
): CollectionStats {
  if (!isRecord(stats)) {
    return defaultCollectionStats;
  }

  return {
    totalCollected: asNumber(stats.totalCollected, 0),
    uniqueCollected: asNumber(stats.uniqueCollected, 0),
    commonCount: asNumber(stats.commonCount, 0),
    uncommonCount: asNumber(stats.uncommonCount, 0),
    rareCount: asNumber(stats.rareCount, 0),
    epicCount: asNumber(stats.epicCount, 0),
    legendaryCount: asNumber(stats.legendaryCount, 0),
    lastCollected: typeof stats.lastCollected === 'number' ? stats.lastCollected : undefined,
  };
}

export function hydrateCloudState(cloudData: unknown): HydratedCloudState {
  const data = isRecord(cloudData) ? cloudData : {};

  return {
    user: hydrateUserProfile(data.profile),
    rooms: hydrateRooms(data.rooms),
    stats: hydrateStats(data.stats),
    settings: hydrateSettings(data.settings),
    mascot: hydrateMascot(data.mascot),
    collection: hydrateCollection(data.collection),
    collectionStats: hydrateCollectionStats(data.collectionStats),
  };
}
