/**
 * Declutterly - Core Types
 * Types for rooms, tasks, progress tracking, and AI analysis
 */

// Room types for categorization
export type RoomType =
  | 'bedroom'
  | 'kitchen'
  | 'bathroom'
  | 'livingRoom'
  | 'office'
  | 'garage'
  | 'closet'
  | 'other';

// Task priority levels (ADHD-friendly - not too many options)
export type Priority = 'high' | 'medium' | 'low';

// Task difficulty for breaking down work
export type TaskDifficulty = 'quick' | 'medium' | 'challenging';

// =====================
// MASCOT TYPES
// =====================

// Mascot mood states
export type MascotMood = 'ecstatic' | 'happy' | 'content' | 'neutral' | 'sad' | 'sleepy' | 'excited';

// Mascot activity states
export type MascotActivity = 'idle' | 'cheering' | 'sleeping' | 'dancing' | 'cleaning' | 'celebrating';

// Mascot personality types
export type MascotPersonality = 'spark' | 'bubbles' | 'dusty' | 'tidy';
export type LivingSituation = 'studio' | 'apartment' | 'house' | 'dorm' | 'shared';
export type OnboardingEnergyLevel = 'exhausted' | 'low' | 'moderate' | 'high' | 'hyperfocused';

// Mascot data
export interface Mascot {
  name: string;
  personality: MascotPersonality;
  mood: MascotMood;
  activity: MascotActivity;
  level: number;
  xp: number;
  hunger: number; // 0-100 (fed by completing tasks)
  energy: number; // 0-100 (recovers over time)
  happiness: number; // 0-100 (based on user activity)
  lastFed: Date;
  lastInteraction: Date;
  createdAt: Date;
  accessories: string[]; // Unlocked accessories
  currentAccessory?: string;
}

// Mascot personality info
export const MASCOT_PERSONALITIES: Record<MascotPersonality, { emoji: string; name: string; description: string; color: string }> = {
  spark: { emoji: '⚡', name: 'Spark', description: 'Energetic and motivating!', color: '#FFD700' },
  bubbles: { emoji: '🫧', name: 'Bubbles', description: 'Cheerful and bubbly!', color: '#87CEEB' },
  dusty: { emoji: '🧹', name: 'Dusty', description: 'Wise and encouraging!', color: '#DEB887' },
  tidy: { emoji: '✨', name: 'Tidy', description: 'Calm and organized!', color: '#98FB98' },
};

// =====================
// FOCUS MODE TYPES
// =====================

// Focus mode session
export interface FocusSession {
  id: string;
  roomId?: string;
  startedAt: Date;
  duration: number; // Total duration in minutes
  remainingSeconds: number;
  isActive: boolean;
  isPaused: boolean;
  pausedAt?: Date;
  completedAt?: Date;
  tasksCompletedDuringSession: number;
  blockedApps: string[];
  distractionAttempts: number; // Times user tried to leave
}

// Focus mode settings
export interface FocusModeSettings {
  defaultDuration: number; // Default focus time in minutes
  breakDuration: number; // Break time in minutes
  autoStartBreak: boolean;
  blockNotifications: boolean;
  playWhiteNoise: boolean;
  whiteNoiseType: 'rain' | 'ocean' | 'forest' | 'cafe' | 'none';
  showMotivationalQuotes: boolean;
  strictMode: boolean; // Prevents exiting focus mode early
}

// =====================
// AR COLLECTIBLES TYPES
// =====================

// Collectible rarity
export type CollectibleRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// Collectible category
export type CollectibleCategory = 'sparkles' | 'tools' | 'creatures' | 'treasures' | 'special';

// A collectible item
export interface Collectible {
  id: string;
  name: string;
  description: string;
  emoji: string;
  rarity: CollectibleRarity;
  category: CollectibleCategory;
  xpValue: number;
  spawnChance: number; // 0-1 probability
  requiredTasks: number; // Min tasks to unlock spawn
  isSpecial: boolean; // Limited time or achievement based
}

// A collected item instance
export interface CollectedItem {
  collectibleId: string;
  collectedAt: Date;
  roomId?: string; // Where it was found
  taskId?: string; // What task spawned it
}

// Player collection stats
export interface CollectionStats {
  totalCollected: number;
  uniqueCollected: number;
  commonCount: number;
  uncommonCount: number;
  rareCount: number;
  epicCount: number;
  legendaryCount: number;
  lastCollected?: Date;
}

// Spawn event (when an item appears during cleaning)
export interface SpawnEvent {
  collectible: Collectible;
  position: { x: number; y: number }; // Screen position
  expiresAt: Date;
  collected: boolean;
}

// =====================
// TASK CATEGORY TYPES
// =====================

export type TaskCategory =
  | 'trash_removal'
  | 'surface_clearing'
  | 'dishes'
  | 'laundry'
  | 'organization'
  | 'deep_cleaning'
  | 'maintenance'
  | 'donation_sorting'
  | 'setup';

export type EnergyLevel = 'minimal' | 'low' | 'moderate' | 'high';
export type DecisionLoad = 'none' | 'low' | 'medium' | 'high';
export type VisualImpact = 'low' | 'medium' | 'high';
export type ClutterDensity = 'low' | 'medium' | 'high' | 'extreme';
export type ZoneType = 'floor' | 'surface' | 'storage' | 'fixture';
export type ObjectCategory = 'trash' | 'dishes' | 'clothes' | 'papers' | 'belongs_elsewhere' | 'misc';
export type ObjectCondition = 'clean' | 'dirty' | 'damaged' | 'misplaced' | 'unknown';

// =====================
// ZONE & OBJECT TYPES
// =====================

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  description: string;
  clutterDensity: ClutterDensity;
  itemCount: number;
  estimatedClearTime: number;
  priority: Priority;
  priorityReason: string;
}

export interface DetectedObject {
  id?: string;
  name: string;
  category?: ObjectCategory;
  zone?: string;
  location?: string;
  condition?: ObjectCondition;
  suggestedAction?: string;
  suggestedDestination?: string;
  confidence?: number;
}

export interface TaskDestination {
  location: string;
  instructions?: string;
  requiresSetup?: string;
}

// =====================
// DECISION SUPPORT TYPES
// =====================

export interface DecisionOption {
  answer: string;
  action: string;
  nextTask?: string;
}

export interface DecisionPoint {
  id?: string;
  trigger: string;
  question: string;
  options: DecisionOption[];
  fiveSecondDefault?: string;
  emotionalSupport?: string;
  adhd_tip?: string;
}

// =====================
// EXISTING TYPES (UPDATED)
// =====================

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  estimatedSeconds?: number;
  estimatedMinutes?: number;
  isCheckpoint?: boolean;
}

export interface CleaningTask {
  id: string;
  title: string;
  description: string;
  emoji: string;
  priority: Priority;
  difficulty: TaskDifficulty;
  estimatedMinutes: number;
  completed: boolean;
  completedAt?: Date;
  tips?: string[];
  subtasks?: SubTask[];
  
  zone?: string;
  targetObjects?: string[];
  destination?: TaskDestination;
  
  dependencies?: string[];
  enables?: string[];
  parallelWith?: string[];
  
  category?: TaskCategory;
  energyRequired?: EnergyLevel;
  decisionLoad?: DecisionLoad;
  visualImpact?: VisualImpact;
  
  whyThisMatters?: string;
  resistanceHandler?: string;
  suppliesNeeded?: string[];
  decisionPoints?: DecisionPoint[];

  userSkipped?: boolean;
  skipReason?: string;
  actualMinutes?: number;
  difficultyFeedback?: 'easier' | 'accurate' | 'harder';
}

// A photo capture session
export interface PhotoCapture {
  id: string;
  uri: string;
  timestamp: Date;
  type: 'before' | 'progress' | 'after';
}

// A room being tracked
export interface Room {
  id: string;
  name: string;
  type: RoomType;
  emoji: string;
  createdAt: Date;
  photos: PhotoCapture[];
  tasks: CleaningTask[];
  messLevel: number; // 0-100, from AI analysis
  currentProgress: number; // 0-100 percentage complete
  lastAnalyzedAt?: Date;
  aiSummary?: string; // AI's description of the room state
  motivationalMessage?: string; // Encouraging message from AI
}

// Subscription types
export type SubscriptionStatus = 'free' | 'trial' | 'active' | 'expired';
export type SubscriptionTier = 'weekly' | 'monthly' | 'annual' | null;

// User profile
export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  onboardingComplete: boolean;
  livingSituation?: LivingSituation;
  cleaningStruggles?: string[];
  energyLevel?: OnboardingEnergyLevel;
  timeAvailability?: number;
  motivationStyle?: string;
  guidePersonality?: MascotPersonality;
  // Subscription
  subscriptionStatus?: SubscriptionStatus;
  subscriptionTier?: SubscriptionTier;
  trialEndsAt?: Date;
  subscriptionExpiresAt?: Date;
  subscriptionId?: string;
}

// User stats for gamification
export interface UserStats {
  totalTasksCompleted: number;
  totalRoomsCleaned: number;
  currentStreak: number;
  longestStreak: number;
  totalMinutesCleaned: number;
  level: number;
  xp: number;
  badges: Badge[];
  lastActivityDate?: string;
  // Goal tracking
  weeklyTaskGoal?: number;
  weeklyTimeGoal?: number; // in minutes
  // Streak protection
  streakFreezesAvailable?: number;
  streakFreezesUsedThisMonth?: number;
  lastStreakFreezeUsed?: string;
  // Comeback Engine (matches Convex stats schema)
  totalCleaningSessions?: number;
  gracePeriodEndsAt?: string;
  comebackBonusMultiplier?: number;
  lastComebackDate?: string;
  comebackCount?: number;
}

// Achievement badges
export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  unlockedAt?: Date;
  requirement: number; // Number needed to unlock
  type: 'tasks' | 'rooms' | 'streak' | 'time' | 'comeback' | 'longComeback' | 'sessions';
}

export interface PhotoQuality {
  lighting: 'good' | 'dim' | 'overexposed';
  coverage: 'full' | 'partial' | 'limited';
  clarity: 'clear' | 'blurry' | 'mixed';
  confidence: number;
  notes?: string;
  suggestedRetake?: string;
}

export interface TaskGraph {
  criticalPath: string[];
  parallelGroups: string[][];
  setupTasks?: string[];
  optionalTasks?: string[];
}

export interface TimeProfile {
  tasks: string[];
  expectedImpact: number;
  estimatedMinutes?: number;
}

export interface TimeProfiles {
  minimal: TimeProfile;
  quick: TimeProfile;
  standard: TimeProfile;
  complete: TimeProfile;
}

export interface EnergyProfiles {
  exhausted: string[];
  low: string[];
  moderate: string[];
  high: string[];
}

export interface QuickWin {
  taskId?: string;
  task?: string;
  visualImpact?: VisualImpact;
  timeMinutes?: number;
  reason?: string;
}

export interface AIAnalysisResult {
  photoQuality?: PhotoQuality;
  messLevel: number;
  summary: string;
  encouragement: string;
  roomType?: RoomType;
  
  zones?: Zone[];
  detectedObjects?: DetectedObject[];
  
  tasks: CleaningTask[];
  taskGraph?: TaskGraph;
  
  timeProfiles?: TimeProfiles;
  energyProfiles?: EnergyProfiles;
  
  quickWins: (string | QuickWin)[];
  decisionPoints?: DecisionPoint[];
  
  estimatedTotalTime: number;
  beforeAfterMetrics?: string[];
}

export interface PhotoQualityFeedback {
  isAcceptable: boolean;
  suggestions: string[];
  overallMessage: string;
}

export interface ProgressAnalysisResult {
  percentImproved: number;
  areasImproved: string[];
  areasRemaining: string[];
  encouragingMessage: string;
}

export interface TaskPerformanceHistory {
  category: TaskCategory;
  completionRate: number;
  averageTimeVsEstimate: number;
  skipRate: number;
  preferredTimeOfDay?: string;
}

export interface UserCleaningProfile {
  taskHistory: TaskPerformanceHistory[];
  
  energyPatterns: {
    dayOfWeek: number;
    averageEnergy: number;
    bestCleaningTime?: string;
  }[];
  
  preferences: {
    preferredTaskSize: 'tiny' | 'small' | 'medium';
    preferredSessionLength: number;
    needsMoreBreakdown: boolean;
    respondsToGamification: boolean;
    prefersQuickWinsFirst: boolean;
    avoidsDecisionTasks: boolean;
  };
  
  roomInsights: {
    roomType: RoomType;
    averageMessLevel: number;
    commonClutterTypes: string[];
    mostSkippedTaskTypes: TaskCategory[];
    bestPerformingTaskTypes: TaskCategory[];
  }[];
  
  motivationProfile: {
    respondsToChallenges: boolean;
    needsFrequentEncouragement: boolean;
    preferredEncouragementStyle: 'cheerful' | 'calm' | 'matter-of-fact';
    celebrationPreference: 'minimal' | 'moderate' | 'maximum';
  };
}

export interface AppSettings {
  notifications: boolean;
  reminderTime?: string; // Time for daily reminders
  theme: 'light' | 'dark' | 'auto';
  hapticFeedback: boolean;
  encouragementLevel: 'minimal' | 'moderate' | 'maximum'; // How much positive reinforcement
  taskBreakdownLevel: 'normal' | 'detailed' | 'ultra'; // How small to break tasks
  // Focus mode settings
  focusMode: FocusModeSettings;
  // AR collection settings
  arCollectionEnabled: boolean;
  collectibleNotifications: boolean;
}

// Session for a cleaning session (body doubling concept)
export interface CleaningSession {
  id: string;
  roomId: string;
  startedAt: Date;
  endedAt?: Date;
  tasksCompletedIds: string[];
  focusMode: boolean; // Timer-based cleaning
}

// App state
export interface DeclutterState {
  // User
  isLoaded: boolean;
  user: UserProfile | null;
  stats: UserStats;

  // Rooms
  rooms: Room[];
  activeRoomId: string | null;

  // Current session
  currentSession: CleaningSession | null;

  // Settings
  settings: AppSettings;

  // Mascot
  mascot: Mascot | null;

  // Focus Mode
  focusSession: FocusSession | null;

  // AR Collection
  collection: CollectedItem[];
  collectionStats: CollectionStats;
  activeSpawn: SpawnEvent | null;

  // UI State
  isAnalyzing: boolean;
  analysisError: string | null;
  syncError: string | null;

  // Celebration State
  pendingCelebration: Badge[];

  // Actions
  setUser: (user: UserProfile) => void;
  addRoom: (room: Omit<Room, 'id' | 'createdAt' | 'photos' | 'tasks' | 'currentProgress'>) => Promise<Room>;
  updateRoom: (roomId: string, updates: Partial<Room>) => void;
  deleteRoom: (roomId: string) => void;
  addPhotoToRoom: (roomId: string, photo: Omit<PhotoCapture, 'id'>) => Promise<void>;
  deletePhotoFromRoom: (roomId: string, photoId: string) => void;
  setTasksForRoom: (roomId: string, tasks: CleaningTask[]) => void;
  addTaskToRoom: (roomId: string, task: Omit<CleaningTask, 'id'>) => void;
  toggleTask: (roomId: string, taskId: string) => void;
  toggleSubTask: (roomId: string, taskId: string, subTaskId: string) => void;
  deleteTask: (roomId: string, taskId: string) => void;
  restoreTask: (roomId: string, task: CleaningTask, originalIndex?: number) => void;
  updateTask: (roomId: string, taskId: string, updates: Partial<CleaningTask>) => void;
  setActiveRoom: (roomId: string | null) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateStats: (updates: Partial<UserStats>) => void;
  startSession: (roomId: string, focusMode: boolean) => void;
  endSession: () => void;
  setAnalyzing: (analyzing: boolean) => void;
  setAnalysisError: (error: string | null) => void;
  completeOnboarding: () => void;

  // Mascot Actions
  createMascot: (name: string, personality: MascotPersonality) => void;
  updateMascot: (updates: Partial<Mascot>) => void;
  feedMascot: () => void;
  interactWithMascot: () => void;

  // Focus Mode Actions
  startFocusSession: (duration: number, roomId?: string) => void;
  pauseFocusSession: () => void;
  resumeFocusSession: () => void;
  endFocusSession: () => void;
  updateFocusSession: (updates: Partial<FocusSession>) => void;

  // Collection Actions
  collectItem: (collectibleId: string, roomId?: string, taskId?: string) => void;
  spawnCollectible: () => SpawnEvent | null;
  dismissSpawn: () => void;

  // Data Management
  clearAllData: () => Promise<void>;
  resetStats: () => void;

  // Celebration Actions
  clearCelebration: () => void;

  // Sync Actions
  clearSyncError: () => void;
}

// Predefined badges
export const BADGES: Badge[] = [
  { id: 'first-task', name: 'First Step', description: 'Complete your first task', emoji: '🌱', requirement: 1, type: 'tasks' },
  { id: 'task-10', name: 'Getting Going', description: 'Complete 10 tasks', emoji: '🚀', requirement: 10, type: 'tasks' },
  { id: 'task-50', name: 'Cleaning Machine', description: 'Complete 50 tasks', emoji: '⚡', requirement: 50, type: 'tasks' },
  { id: 'task-100', name: 'Declutter Master', description: 'Complete 100 tasks', emoji: '👑', requirement: 100, type: 'tasks' },
  { id: 'first-room', name: 'Room Conquered', description: 'Fully clean a room', emoji: '🏠', requirement: 1, type: 'rooms' },
  { id: 'rooms-5', name: 'Home Hero', description: 'Clean 5 rooms', emoji: '🦸', requirement: 5, type: 'rooms' },
  { id: 'streak-3', name: 'Consistent', description: '3 day streak', emoji: '🔥', requirement: 3, type: 'streak' },
  { id: 'streak-7', name: 'Week Warrior', description: '7 day streak', emoji: '💪', requirement: 7, type: 'streak' },
  { id: 'streak-30', name: 'Monthly Master', description: '30 day streak', emoji: '🏆', requirement: 30, type: 'streak' },
  { id: 'time-60', name: 'Hour Power', description: 'Clean for 60 minutes total', emoji: '⏰', requirement: 60, type: 'time' },
  { id: 'time-300', name: 'Time Investor', description: 'Clean for 5 hours total', emoji: '📈', requirement: 300, type: 'time' },
  // Comeback Engine badges — celebrate returns, not punish absence
  { id: 'comeback-1', name: 'Comeback Kid', description: 'Return after 3+ days away', emoji: '💛', requirement: 1, type: 'comeback' },
  { id: 'comeback-3', name: 'Resilient Cleaner', description: 'Come back 3 times', emoji: '🌈', requirement: 3, type: 'comeback' },
  { id: 'comeback-champion', name: 'Comeback Champion', description: 'Return after 7+ days away', emoji: '🏆', requirement: 7, type: 'longComeback' },
  // Cumulative session badges — emphasize total over streaks
  { id: 'sessions-10', name: 'Getting Started', description: '10 cleaning sessions total', emoji: '🌱', requirement: 10, type: 'sessions' },
  { id: 'sessions-25', name: 'Building Habits', description: '25 cleaning sessions total', emoji: '🌿', requirement: 25, type: 'sessions' },
  { id: 'sessions-50', name: 'Persistent Cleaner', description: '50 cleaning sessions total', emoji: '🌳', requirement: 50, type: 'sessions' },
  { id: 'sessions-100', name: 'Century Club', description: '100 cleaning sessions total', emoji: '💯', requirement: 100, type: 'sessions' },
  { id: 'sessions-250', name: 'Declutter Legend', description: '250 cleaning sessions total', emoji: '⭐', requirement: 250, type: 'sessions' },
];

// Room type info
export const ROOM_TYPE_INFO: Record<RoomType, { emoji: string; label: string }> = {
  bedroom: { emoji: '🛏️', label: 'Bedroom' },
  kitchen: { emoji: '🍳', label: 'Kitchen' },
  bathroom: { emoji: '🚿', label: 'Bathroom' },
  livingRoom: { emoji: '🛋️', label: 'Living Room' },
  office: { emoji: '💼', label: 'Office' },
  garage: { emoji: '🚗', label: 'Garage' },
  closet: { emoji: '👔', label: 'Closet' },
  other: { emoji: '📦', label: 'Other' },
};

// Default focus mode settings
export const DEFAULT_FOCUS_SETTINGS: FocusModeSettings = {
  defaultDuration: 25, // Pomodoro style
  breakDuration: 5,
  autoStartBreak: true,
  blockNotifications: true,
  playWhiteNoise: false,
  whiteNoiseType: 'none',
  showMotivationalQuotes: true,
  strictMode: false,
};

// Collectible rarity colors
export const RARITY_COLORS: Record<CollectibleRarity, string> = {
  common: '#9CA3AF',
  uncommon: '#22C55E',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
};

// Predefined collectibles
export const COLLECTIBLES: Collectible[] = [
  // Sparkles (Common drops while cleaning)
  { id: 'sparkle-small', name: 'Tiny Sparkle', description: 'A small glimmer of cleanliness', emoji: '✨', rarity: 'common', category: 'sparkles', xpValue: 5, spawnChance: 0.4, requiredTasks: 0, isSpecial: false },
  { id: 'sparkle-medium', name: 'Bright Sparkle', description: 'Things are getting cleaner!', emoji: '💫', rarity: 'common', category: 'sparkles', xpValue: 10, spawnChance: 0.3, requiredTasks: 0, isSpecial: false },
  { id: 'sparkle-large', name: 'Mega Sparkle', description: 'That surface is gleaming!', emoji: '🌟', rarity: 'uncommon', category: 'sparkles', xpValue: 20, spawnChance: 0.15, requiredTasks: 5, isSpecial: false },
  { id: 'sparkle-rainbow', name: 'Rainbow Sparkle', description: 'Pure cleaning energy!', emoji: '🌈', rarity: 'rare', category: 'sparkles', xpValue: 50, spawnChance: 0.05, requiredTasks: 20, isSpecial: false },

  // Cleaning Tools (Uncommon to Rare)
  { id: 'tool-sponge', name: 'Magic Sponge', description: 'Absorbs all the mess!', emoji: '🧽', rarity: 'uncommon', category: 'tools', xpValue: 25, spawnChance: 0.12, requiredTasks: 3, isSpecial: false },
  { id: 'tool-broom', name: 'Sweepy Broom', description: 'Whisks away the dust', emoji: '🧹', rarity: 'uncommon', category: 'tools', xpValue: 25, spawnChance: 0.12, requiredTasks: 3, isSpecial: false },
  { id: 'tool-spray', name: 'Super Spray', description: 'Blasts away grime!', emoji: '🧴', rarity: 'rare', category: 'tools', xpValue: 40, spawnChance: 0.06, requiredTasks: 10, isSpecial: false },
  { id: 'tool-vacuum', name: 'Turbo Vacuum', description: 'Sucks up everything!', emoji: '🔌', rarity: 'rare', category: 'tools', xpValue: 45, spawnChance: 0.05, requiredTasks: 15, isSpecial: false },
  { id: 'tool-golden-gloves', name: 'Golden Gloves', description: 'The hands of a pro cleaner', emoji: '🧤', rarity: 'epic', category: 'tools', xpValue: 100, spawnChance: 0.02, requiredTasks: 30, isSpecial: false },

  // Cute Creatures (Rare helpers)
  { id: 'creature-dustbunny', name: 'Friendly Dustbunny', description: 'Reformed from the dark corners', emoji: '🐰', rarity: 'rare', category: 'creatures', xpValue: 60, spawnChance: 0.04, requiredTasks: 10, isSpecial: false },
  { id: 'creature-soap-sprite', name: 'Soap Sprite', description: 'Bubbles with joy!', emoji: '🫧', rarity: 'rare', category: 'creatures', xpValue: 65, spawnChance: 0.04, requiredTasks: 15, isSpecial: false },
  { id: 'creature-tidy-fairy', name: 'Tidy Fairy', description: 'Grants organizing wishes', emoji: '🧚', rarity: 'epic', category: 'creatures', xpValue: 120, spawnChance: 0.015, requiredTasks: 25, isSpecial: false },
  { id: 'creature-clean-dragon', name: 'Clean Dragon', description: 'Breathes fresh air!', emoji: '🐉', rarity: 'legendary', category: 'creatures', xpValue: 250, spawnChance: 0.005, requiredTasks: 50, isSpecial: false },

  // Treasures (Found in messy areas)
  { id: 'treasure-coin', name: 'Lost Coin', description: 'Found under the couch!', emoji: '🪙', rarity: 'common', category: 'treasures', xpValue: 15, spawnChance: 0.2, requiredTasks: 0, isSpecial: false },
  { id: 'treasure-gem', name: 'Hidden Gem', description: 'Was behind the bookshelf', emoji: '💎', rarity: 'rare', category: 'treasures', xpValue: 75, spawnChance: 0.03, requiredTasks: 15, isSpecial: false },
  { id: 'treasure-crown', name: 'Cleaning Crown', description: 'Royalty of tidiness', emoji: '👑', rarity: 'legendary', category: 'treasures', xpValue: 300, spawnChance: 0.003, requiredTasks: 75, isSpecial: false },

  // Special (Achievement/Event based)
  { id: 'special-first-clean', name: 'First Timer Trophy', description: 'Completed your first room!', emoji: '🏆', rarity: 'epic', category: 'special', xpValue: 150, spawnChance: 0, requiredTasks: 0, isSpecial: true },
  { id: 'special-streak-master', name: 'Streak Flame', description: '7-day cleaning streak!', emoji: '🔥', rarity: 'epic', category: 'special', xpValue: 200, spawnChance: 0, requiredTasks: 0, isSpecial: true },
  { id: 'special-speed-demon', name: 'Speed Demon', description: 'Finished 5 tasks in one session', emoji: '⚡', rarity: 'legendary', category: 'special', xpValue: 350, spawnChance: 0, requiredTasks: 0, isSpecial: true },
  { id: 'special-perfectionist', name: 'Perfectionist Star', description: '100% room completion', emoji: '⭐', rarity: 'legendary', category: 'special', xpValue: 400, spawnChance: 0, requiredTasks: 0, isSpecial: true },
];
