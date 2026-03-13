import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  // User profiles (linked to auth identity)
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    avatar: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    onboardingComplete: v.optional(v.boolean()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  // Rooms being tracked
  rooms: defineTable({
    userId: v.id("users"),
    name: v.string(),
    type: v.union(
      v.literal("bedroom"),
      v.literal("kitchen"),
      v.literal("bathroom"),
      v.literal("livingRoom"),
      v.literal("office"),
      v.literal("garage"),
      v.literal("closet"),
      v.literal("other")
    ),
    emoji: v.string(),
    createdAt: v.number(),
    messLevel: v.number(),
    currentProgress: v.number(),
    lastAnalyzedAt: v.optional(v.number()),
    aiSummary: v.optional(v.string()),
    motivationalMessage: v.optional(v.string()),
  }).index("by_userId", ["userId"]),

  // Room photos
  photos: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    uri: v.string(),
    storageId: v.optional(v.id("_storage")),
    timestamp: v.number(),
    type: v.union(
      v.literal("before"),
      v.literal("progress"),
      v.literal("after")
    ),
  })
    .index("by_roomId", ["roomId"])
    .index("by_userId", ["userId"]),

  // Cleaning tasks
  tasks: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    title: v.string(),
    description: v.string(),
    emoji: v.string(),
    priority: v.union(
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    difficulty: v.union(
      v.literal("quick"),
      v.literal("medium"),
      v.literal("challenging")
    ),
    estimatedMinutes: v.number(),
    completed: v.boolean(),
    completedAt: v.optional(v.number()),
    tips: v.optional(v.array(v.string())),
    zone: v.optional(v.string()),
    targetObjects: v.optional(v.array(v.string())),
    destinationLocation: v.optional(v.string()),
    destinationInstructions: v.optional(v.string()),
    destinationRequiresSetup: v.optional(v.string()),
    category: v.optional(v.string()),
    energyRequired: v.optional(v.string()),
    decisionLoad: v.optional(v.string()),
    visualImpact: v.optional(v.string()),
    whyThisMatters: v.optional(v.string()),
    resistanceHandler: v.optional(v.string()),
    suppliesNeeded: v.optional(v.array(v.string())),
    dependencies: v.optional(v.array(v.string())),
    enables: v.optional(v.array(v.string())),
    parallelWith: v.optional(v.array(v.string())),
    order: v.number(),
  })
    .index("by_roomId", ["roomId"])
    .index("by_userId", ["userId"]),

  // Sub-tasks of cleaning tasks
  subtasks: defineTable({
    taskId: v.id("tasks"),
    userId: v.id("users"),
    title: v.string(),
    completed: v.boolean(),
    estimatedSeconds: v.optional(v.number()),
    estimatedMinutes: v.optional(v.number()),
    isCheckpoint: v.optional(v.boolean()),
    order: v.number(),
  }).index("by_taskId", ["taskId"]),

  // User statistics (one per user)
  stats: defineTable({
    userId: v.id("users"),
    totalTasksCompleted: v.number(),
    totalRoomsCleaned: v.number(),
    currentStreak: v.number(),
    longestStreak: v.number(),
    totalMinutesCleaned: v.number(),
    level: v.number(),
    xp: v.number(),
    lastActivityDate: v.optional(v.string()),
    weeklyTaskGoal: v.optional(v.number()),
    weeklyTimeGoal: v.optional(v.number()),
    streakFreezesAvailable: v.optional(v.number()),
    streakFreezesUsedThisMonth: v.optional(v.number()),
    lastStreakFreezeUsed: v.optional(v.string()),
  }).index("by_userId", ["userId"]),

  // Unlocked badges
  badges: defineTable({
    userId: v.id("users"),
    badgeId: v.string(),
    name: v.string(),
    description: v.string(),
    emoji: v.string(),
    unlockedAt: v.number(),
    requirement: v.number(),
    type: v.union(
      v.literal("tasks"),
      v.literal("rooms"),
      v.literal("streak"),
      v.literal("time")
    ),
  }).index("by_userId", ["userId"]),

  // App settings per user (one per user)
  settings: defineTable({
    userId: v.id("users"),
    notifications: v.boolean(),
    reminderTime: v.optional(v.string()),
    theme: v.union(
      v.literal("light"),
      v.literal("dark"),
      v.literal("auto")
    ),
    hapticFeedback: v.boolean(),
    encouragementLevel: v.union(
      v.literal("minimal"),
      v.literal("moderate"),
      v.literal("maximum")
    ),
    taskBreakdownLevel: v.union(
      v.literal("normal"),
      v.literal("detailed"),
      v.literal("ultra")
    ),
    focusDefaultDuration: v.number(),
    focusBreakDuration: v.number(),
    focusAutoStartBreak: v.boolean(),
    focusBlockNotifications: v.boolean(),
    focusPlayWhiteNoise: v.boolean(),
    focusWhiteNoiseType: v.union(
      v.literal("rain"),
      v.literal("ocean"),
      v.literal("forest"),
      v.literal("cafe"),
      v.literal("none")
    ),
    focusShowMotivationalQuotes: v.boolean(),
    focusStrictMode: v.boolean(),
    arCollectionEnabled: v.boolean(),
    collectibleNotifications: v.boolean(),
  }).index("by_userId", ["userId"]),

  // Virtual pet mascot per user (one per user)
  mascots: defineTable({
    userId: v.id("users"),
    name: v.string(),
    personality: v.union(
      v.literal("spark"),
      v.literal("bubbles"),
      v.literal("dusty"),
      v.literal("tidy")
    ),
    mood: v.string(),
    activity: v.string(),
    level: v.number(),
    xp: v.number(),
    hunger: v.number(),
    energy: v.number(),
    happiness: v.number(),
    lastFed: v.number(),
    lastInteraction: v.number(),
    createdAt: v.number(),
    accessories: v.array(v.string()),
    currentAccessory: v.optional(v.string()),
  }).index("by_userId", ["userId"]),

  // Collected items
  collectedItems: defineTable({
    userId: v.id("users"),
    collectibleId: v.string(),
    collectedAt: v.number(),
    roomId: v.optional(v.string()),
    taskId: v.optional(v.string()),
  }).index("by_userId", ["userId"]),

  // Collection statistics per user (one per user)
  collectionStats: defineTable({
    userId: v.id("users"),
    totalCollected: v.number(),
    uniqueCollected: v.number(),
    commonCount: v.number(),
    uncommonCount: v.number(),
    rareCount: v.number(),
    epicCount: v.number(),
    legendaryCount: v.number(),
    lastCollected: v.optional(v.number()),
  }).index("by_userId", ["userId"]),

  // Social challenges
  challenges: defineTable({
    creatorId: v.id("users"),
    creatorName: v.string(),
    title: v.string(),
    description: v.string(),
    type: v.union(
      v.literal("tasks_count"),
      v.literal("time_spent"),
      v.literal("room_complete"),
      v.literal("streak"),
      v.literal("collectibles")
    ),
    target: v.number(),
    startDate: v.number(),
    endDate: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("expired")
    ),
    createdAt: v.number(),
    inviteCode: v.string(),
    isActive: v.boolean(),
    participants: v.array(
      v.object({
        userId: v.string(),
        displayName: v.string(),
        progress: v.number(),
        joined: v.number(),
        completed: v.boolean(),
        completedAt: v.optional(v.number()),
      })
    ),
  })
    .index("by_creatorId", ["creatorId"])
    .index("by_inviteCode", ["inviteCode"]),

  // User friendships / connections
  connections: defineTable({
    userId: v.id("users"),
    friendId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("blocked")
    ),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_friendId", ["friendId"]),
});
