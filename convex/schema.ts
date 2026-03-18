import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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
    // AI rate limiting — per-user analysis quota
    aiAnalysisCount: v.optional(v.number()),      // analyses in current window
    aiAnalysisWindowStart: v.optional(v.number()), // timestamp when window started
    // Onboarding preferences
    livingSituation: v.optional(v.union(
      v.literal("studio"),
      v.literal("apartment"),
      v.literal("house"),
      v.literal("dorm"),
      v.literal("shared")
    )),
    cleaningStruggles: v.optional(v.array(v.string())),
    energyLevel: v.optional(v.union(
      v.literal("exhausted"),
      v.literal("low"),
      v.literal("moderate"),
      v.literal("high"),
      v.literal("hyperfocused")
    )),
    timeAvailability: v.optional(v.number()),
    motivationStyle: v.optional(v.string()),
    // Subscription (RevenueCat)
    subscriptionStatus: v.optional(v.union(
      v.literal("free"),
      v.literal("trial"),
      v.literal("active"),
      v.literal("expired")
    )),
    subscriptionTier: v.optional(v.union(
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("annual")
    )),
    trialEndsAt: v.optional(v.number()),
    subscriptionExpiresAt: v.optional(v.number()),
    subscriptionId: v.optional(v.string()),
    revenuecatUserId: v.optional(v.string()),
    expoPushToken: v.optional(v.string()),
    pushTokenUpdatedAt: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("by_subscriptionStatus", ["subscriptionStatus"]),

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
    destinationRequiresSetup: v.optional(v.boolean()),
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
    // Comeback Engine fields
    totalCleaningSessions: v.optional(v.number()),           // Cumulative, never resets
    gracePeriodEndsAt: v.optional(v.string()),               // When 48hr grace ends (ISO date)
    comebackBonusMultiplier: v.optional(v.number()),         // 1.5x, 2x based on break length
    lastComebackDate: v.optional(v.string()),                // When user last "came back"
    comebackCount: v.optional(v.number()),                   // Times user has returned after breaks
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
      v.literal("time"),
      v.literal("comeback"),
      v.literal("longComeback"),
      v.literal("sessions")
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
    soundFX: v.boolean(),
    reducedMotion: v.boolean(),
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
    roomId: v.optional(v.id("rooms")),
    taskId: v.optional(v.id("tasks")),
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
        userId: v.id("users"),
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

  // ─────────────────────────────────────────────────────────────────────────────
  // ENGAGEMENT ENGINE — Duolingo-style retention features
  // ─────────────────────────────────────────────────────────────────────────────

  // GitHub-style streak calendar — daily activity log
  activityLog: defineTable({
    userId: v.id("users"),
    date: v.string(), // ISO date string YYYY-MM-DD
    tasksCompleted: v.number(),
    minutesCleaned: v.number(),
    xpEarned: v.number(),
    sessionsCount: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_date", ["userId", "date"]),

  // Weekly engagement-matched leagues
  leaderboards: defineTable({
    userId: v.id("users"),
    userName: v.string(),
    userEmoji: v.string(), // mascot emoji
    weekStart: v.string(), // ISO date of Monday
    xpEarned: v.number(), // XP earned this week
    tasksCompleted: v.number(),
    league: v.union(
      v.literal("bronze"),
      v.literal("silver"),
      v.literal("gold"),
      v.literal("diamond"),
      v.literal("champion")
    ),
    rank: v.optional(v.number()),
    promoted: v.optional(v.boolean()),
    relegated: v.optional(v.boolean()),
  })
    .index("by_weekStart", ["weekStart"])
    .index("by_userId", ["userId"])
    .index("by_league_weekStart", ["league", "weekStart"])
    .index("by_weekStart_xpEarned", ["weekStart", "xpEarned"]),

  // Accountability Partners — lightweight pairs for mutual nudging
  accountabilityPairs: defineTable({
    userId: v.id("users"),
    partnerId: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("active"), v.literal("ended")),
    createdAt: v.number(),
    inviteCode: v.string(),
    // Today's activity visible to partner
    userActiveToday: v.boolean(),
    partnerActiveToday: v.boolean(),
    // Nudge tracking
    lastNudgeSent: v.optional(v.number()),
    lastNudgeReceived: v.optional(v.number()),
    nudgeCount: v.number(),
    // Bonus tracking
    bothActiveStreak: v.number(),
    totalBothActiveDays: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_partnerId", ["partnerId"])
    .index("by_inviteCode", ["inviteCode"]),

  // Variable rewards — mystery drops every 3rd task
  variableRewards: defineTable({
    userId: v.id("users"),
    taskNumber: v.number(), // which task triggered it (every 3rd)
    rewardType: v.union(
      v.literal("bonus_xp"),
      v.literal("streak_shield"),
      v.literal("mystery_collectible"),
      v.literal("mascot_treat")
    ),
    amount: v.number(),
    earnedAt: v.number(),
    claimed: v.boolean(),
  }).index("by_userId", ["userId"]),
});
