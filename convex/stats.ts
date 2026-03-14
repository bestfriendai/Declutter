import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const DEFAULT_STATS = {
  totalTasksCompleted: 0,
  totalRoomsCleaned: 0,
  currentStreak: 0,
  longestStreak: 0,
  totalMinutesCleaned: 0,
  level: 1,
  xp: 0,
};

function calculateLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const stats = await ctx.db
      .query("stats")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!stats) {
      return { ...DEFAULT_STATS, userId };
    }
    return stats;
  },
});

export const upsert = mutation({
  args: {
    totalTasksCompleted: v.optional(v.number()),
    totalRoomsCleaned: v.optional(v.number()),
    currentStreak: v.optional(v.number()),
    longestStreak: v.optional(v.number()),
    totalMinutesCleaned: v.optional(v.number()),
    level: v.optional(v.number()),
    xp: v.optional(v.number()),
    lastActivityDate: v.optional(v.string()),
    weeklyTaskGoal: v.optional(v.number()),
    weeklyTimeGoal: v.optional(v.number()),
    streakFreezesAvailable: v.optional(v.number()),
    streakFreezesUsedThisMonth: v.optional(v.number()),
    lastStreakFreezeUsed: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("stats")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const data: Record<string, unknown> = {
      totalTasksCompleted:
        args.totalTasksCompleted ?? existing?.totalTasksCompleted ?? 0,
      totalRoomsCleaned:
        args.totalRoomsCleaned ?? existing?.totalRoomsCleaned ?? 0,
      currentStreak: args.currentStreak ?? existing?.currentStreak ?? 0,
      longestStreak: args.longestStreak ?? existing?.longestStreak ?? 0,
      totalMinutesCleaned:
        args.totalMinutesCleaned ?? existing?.totalMinutesCleaned ?? 0,
      xp: args.xp ?? existing?.xp ?? 0,
      level: 0,
    };
    data.level = args.level ?? calculateLevel(data.xp as number);

    // Include optional fields if provided
    if (args.lastActivityDate !== undefined) data.lastActivityDate = args.lastActivityDate;
    if (args.weeklyTaskGoal !== undefined) data.weeklyTaskGoal = args.weeklyTaskGoal;
    if (args.weeklyTimeGoal !== undefined) data.weeklyTimeGoal = args.weeklyTimeGoal;
    if (args.streakFreezesAvailable !== undefined) data.streakFreezesAvailable = args.streakFreezesAvailable;
    if (args.streakFreezesUsedThisMonth !== undefined) data.streakFreezesUsedThisMonth = args.streakFreezesUsedThisMonth;
    if (args.lastStreakFreezeUsed !== undefined) data.lastStreakFreezeUsed = args.lastStreakFreezeUsed;

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      return await ctx.db.insert("stats", {
        userId,
        totalTasksCompleted: data.totalTasksCompleted as number,
        totalRoomsCleaned: data.totalRoomsCleaned as number,
        currentStreak: data.currentStreak as number,
        longestStreak: data.longestStreak as number,
        totalMinutesCleaned: data.totalMinutesCleaned as number,
        xp: data.xp as number,
        level: data.level as number,
        ...(args.lastActivityDate !== undefined ? { lastActivityDate: args.lastActivityDate } : {}),
        ...(args.weeklyTaskGoal !== undefined ? { weeklyTaskGoal: args.weeklyTaskGoal } : {}),
        ...(args.weeklyTimeGoal !== undefined ? { weeklyTimeGoal: args.weeklyTimeGoal } : {}),
        ...(args.streakFreezesAvailable !== undefined ? { streakFreezesAvailable: args.streakFreezesAvailable } : {}),
        ...(args.streakFreezesUsedThisMonth !== undefined ? { streakFreezesUsedThisMonth: args.streakFreezesUsedThisMonth } : {}),
        ...(args.lastStreakFreezeUsed !== undefined ? { lastStreakFreezeUsed: args.lastStreakFreezeUsed } : {}),
      });
    }
  },
});

export const addXp = mutation({
  args: { amount: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("stats")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const currentXp = existing?.xp ?? 0;
    const newXp = currentXp + args.amount;
    const newLevel = calculateLevel(newXp);

    if (existing) {
      await ctx.db.patch(existing._id, {
        xp: newXp,
        level: newLevel,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("stats", {
        userId,
        ...DEFAULT_STATS,
        xp: newXp,
        level: newLevel,
      });
    }
  },
});

export const incrementTask = mutation({
  args: {
    minutesCleaned: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("stats")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const currentTasks = existing?.totalTasksCompleted ?? 0;
    const currentStreak = existing?.currentStreak ?? 0;
    const longestStreak = existing?.longestStreak ?? 0;
    const currentXp = existing?.xp ?? 0;

    const newTasks = currentTasks + 1;
    const newStreak = currentStreak + 1;
    const newLongestStreak = Math.max(longestStreak, newStreak);
    const xpGain = 10;
    const newXp = currentXp + xpGain;
    const newLevel = calculateLevel(newXp);

    if (existing) {
      await ctx.db.patch(existing._id, {
        totalTasksCompleted: newTasks,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        xp: newXp,
        level: newLevel,
      });
    } else {
      await ctx.db.insert("stats", {
        userId,
        ...DEFAULT_STATS,
        totalTasksCompleted: newTasks,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        xp: newXp,
        level: newLevel,
      });
    }

    // ── Engagement Engine: Record daily activity ──
    const today = new Date().toISOString().split("T")[0];
    const existingLog = await ctx.db
      .query("activityLog")
      .withIndex("by_userId_date", (q) =>
        q.eq("userId", userId).eq("date", today)
      )
      .first();

    if (existingLog) {
      await ctx.db.patch(existingLog._id, {
        tasksCompleted: existingLog.tasksCompleted + 1,
        minutesCleaned:
          existingLog.minutesCleaned + (args.minutesCleaned ?? 0),
        xpEarned: existingLog.xpEarned + xpGain,
        sessionsCount: existingLog.sessionsCount + 1,
      });
    } else {
      await ctx.db.insert("activityLog", {
        userId,
        date: today,
        tasksCompleted: 1,
        minutesCleaned: args.minutesCleaned ?? 0,
        xpEarned: xpGain,
        sessionsCount: 1,
      });
    }

    // ── Engagement Engine: Update weekly leaderboard XP ──
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(monday.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    const weekStart = monday.toISOString().split("T")[0];

    const leaderboardEntries = await ctx.db
      .query("leaderboards")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const leaderboardEntry = leaderboardEntries.find(
      (e) => e.weekStart === weekStart
    );

    if (leaderboardEntry) {
      await ctx.db.patch(leaderboardEntry._id, {
        xpEarned: leaderboardEntry.xpEarned + xpGain,
        tasksCompleted: leaderboardEntry.tasksCompleted + 1,
      });
    } else {
      // Determine league from previous week
      const previousEntries = leaderboardEntries
        .filter((e) => e.weekStart < weekStart)
        .sort((a, b) => b.weekStart.localeCompare(a.weekStart));
      const league = previousEntries.length > 0
        ? previousEntries[0].league
        : ("bronze" as const);

      const user = await ctx.db.get(userId);
      const userName = user?.name ?? "Cleaner";

      const mascot = await ctx.db
        .query("mascots")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();
      const userEmoji = mascot ? "\u{2728}" : "\u{1F9F9}";

      await ctx.db.insert("leaderboards", {
        userId,
        userName,
        userEmoji,
        weekStart,
        xpEarned: xpGain,
        tasksCompleted: 1,
        league,
      });
    }

    // ── Engagement Engine: Check for variable reward ──
    let variableReward = null;
    if (newTasks % 3 === 0) {
      // Check if already rewarded for this task number
      const existingRewards = await ctx.db
        .query("variableRewards")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();

      const alreadyRewarded = existingRewards.some(
        (r) => r.taskNumber === newTasks
      );

      if (!alreadyRewarded) {
        // Weighted random reward selection
        const roll = Math.random() * 100;
        let rewardType: "bonus_xp" | "streak_shield" | "mystery_collectible" | "mascot_treat";
        let amount: number;

        if (roll < 40) {
          rewardType = "bonus_xp";
          amount = Math.floor(Math.random() * 16) + 15; // 15-30
        } else if (roll < 65) {
          rewardType = "streak_shield";
          amount = 1;
        } else if (roll < 85) {
          rewardType = "mystery_collectible";
          amount = 1;
        } else {
          rewardType = "mascot_treat";
          amount = Math.floor(Math.random() * 16) + 10; // 10-25
        }

        const rewardId = await ctx.db.insert("variableRewards", {
          userId,
          taskNumber: newTasks,
          rewardType,
          amount,
          earnedAt: Date.now(),
          claimed: false,
        });

        variableReward = {
          _id: rewardId,
          rewardType,
          amount,
          taskNumber: newTasks,
        };
      }
    }

    return {
      newTasks,
      xpGain,
      newXp,
      newLevel,
      variableReward,
    };
  },
});

export const decrementTask = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("stats")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!existing) return;

    const newTasks = Math.max(0, (existing.totalTasksCompleted ?? 0) - 1);
    const newStreak = Math.max(0, (existing.currentStreak ?? 0) - 1);
    const xpLoss = 10;
    const newXp = Math.max(0, (existing.xp ?? 0) - xpLoss);
    const newLevel = calculateLevel(newXp);

    await ctx.db.patch(existing._id, {
      totalTasksCompleted: newTasks,
      currentStreak: newStreak,
      xp: newXp,
      level: newLevel,
    });
  },
});

export const incrementRoom = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("stats")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const currentRooms = existing?.totalRoomsCleaned ?? 0;
    const currentXp = existing?.xp ?? 0;
    const xpGain = 50;
    const newXp = currentXp + xpGain;
    const newLevel = calculateLevel(newXp);

    if (existing) {
      await ctx.db.patch(existing._id, {
        totalRoomsCleaned: currentRooms + 1,
        xp: newXp,
        level: newLevel,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("stats", {
        userId,
        ...DEFAULT_STATS,
        totalRoomsCleaned: 1,
        xp: newXp,
        level: newLevel,
      });
    }
  },
});

export const reset = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("stats")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...DEFAULT_STATS,
      });
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// COMEBACK ENGINE — Shame-free re-engagement system
// ─────────────────────────────────────────────────────────────────────────────

const GRACE_PERIOD_HOURS = 48;
const COMEBACK_THRESHOLDS = {
  shortBreak: 2,    // 2-3 days: 1.25x XP
  mediumBreak: 4,   // 4-6 days: 1.5x XP
  longBreak: 7,     // 7+ days: 2x XP + badge eligibility
};

/**
 * Calculate days since last activity
 */
function getDaysSinceActivity(lastActivityDate?: string): number {
  if (!lastActivityDate) return 999; // First time user or never tracked
  const last = new Date(lastActivityDate);
  const now = new Date();
  // Reset time to start of day for accurate day counting
  last.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate comeback bonus multiplier based on days away
 */
function calculateComebackBonus(daysSinceActivity: number): number {
  if (daysSinceActivity >= COMEBACK_THRESHOLDS.longBreak) return 2.0;
  if (daysSinceActivity >= COMEBACK_THRESHOLDS.mediumBreak) return 1.5;
  if (daysSinceActivity >= COMEBACK_THRESHOLDS.shortBreak) return 1.25;
  return 1.0;
}

/**
 * Check if streak should be preserved (within grace period)
 */
function isWithinGracePeriod(gracePeriodEndsAt?: string): boolean {
  if (!gracePeriodEndsAt) return false;
  return new Date() < new Date(gracePeriodEndsAt);
}

/**
 * Check if user is "returning" (been away 2+ days)
 */
function isReturningUser(daysSinceActivity: number): boolean {
  return daysSinceActivity >= 2;
}

/**
 * Check comeback status — returns user's re-engagement state
 * Used by client to determine if welcome back UI should show
 */
export const checkComebackStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const stats = await ctx.db
      .query("stats")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!stats) {
      // New user — no comeback needed
      return {
        isReturning: false,
        daysSinceActivity: 0,
        comebackBonusXP: 1.0,
        totalSessions: 0,
        isInGracePeriod: false,
        gracePeriodEndsAt: null,
        streakSafe: true,
      };
    }

    const daysSinceActivity = getDaysSinceActivity(stats.lastActivityDate);
    const isReturning = isReturningUser(daysSinceActivity);
    const comebackBonus = calculateComebackBonus(daysSinceActivity);
    const isInGracePeriod = isWithinGracePeriod(stats.gracePeriodEndsAt);
    
    // Streak is safe if activity today, within grace period, or using streak freeze
    const streakSafe = daysSinceActivity === 0 || isInGracePeriod || (stats.streakFreezesAvailable ?? 0) > 0;

    return {
      isReturning,
      daysSinceActivity,
      comebackBonusXP: comebackBonus,
      totalSessions: stats.totalCleaningSessions ?? stats.totalTasksCompleted ?? 0,
      isInGracePeriod,
      gracePeriodEndsAt: stats.gracePeriodEndsAt ?? null,
      streakSafe,
      currentStreak: stats.currentStreak ?? 0,
      comebackCount: stats.comebackCount ?? 0,
    };
  },
});

/**
 * Record activity — updates lastActivityDate, handles streak with grace period
 * Called whenever user completes a task or starts a cleaning session
 */
export const recordActivity = mutation({
  args: {
    activityType: v.union(v.literal("task"), v.literal("session"), v.literal("room")),
  },
  handler: async (ctx, _args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("stats")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const daysSinceActivity = getDaysSinceActivity(existing?.lastActivityDate);
    const isReturning = isReturningUser(daysSinceActivity);
    const isInGracePeriod = isWithinGracePeriod(existing?.gracePeriodEndsAt);

    // Calculate new streak
    let newStreak = existing?.currentStreak ?? 0;
    let comebackBonusMultiplier = 1.0;
    let comebackCount = existing?.comebackCount ?? 0;

    if (daysSinceActivity === 0) {
      // Same day — streak unchanged
    } else if (daysSinceActivity === 1 || isInGracePeriod) {
      // Consecutive day or within grace — extend streak
      newStreak = (existing?.currentStreak ?? 0) + 1;
    } else if (isReturning) {
      // Returning after break — START fresh streak with bonus
      // Key philosophy: We celebrate the return, don't punish the absence
      newStreak = 1;
      comebackBonusMultiplier = calculateComebackBonus(daysSinceActivity);
      comebackCount += 1;
    }

    // Calculate new grace period (48 hours from now)
    const gracePeriodEnds = new Date(now.getTime() + GRACE_PERIOD_HOURS * 60 * 60 * 1000);
    
    // Increment total sessions (cumulative, never resets)
    const newTotalSessions = (existing?.totalCleaningSessions ?? existing?.totalTasksCompleted ?? 0) + 1;

    const updateData: Record<string, unknown> = {
      lastActivityDate: todayStr,
      gracePeriodEndsAt: gracePeriodEnds.toISOString(),
      currentStreak: newStreak,
      longestStreak: Math.max(existing?.longestStreak ?? 0, newStreak),
      totalCleaningSessions: newTotalSessions,
    };

    if (isReturning && comebackBonusMultiplier > 1) {
      updateData.comebackBonusMultiplier = comebackBonusMultiplier;
      updateData.lastComebackDate = todayStr;
      updateData.comebackCount = comebackCount;
    }

    if (existing) {
      await ctx.db.patch(existing._id, updateData);
    } else {
      await ctx.db.insert("stats", {
        userId,
        ...DEFAULT_STATS,
        ...updateData,
        totalCleaningSessions: 1,
      });
    }

    return {
      newStreak,
      isComeback: isReturning,
      comebackBonusMultiplier,
      totalSessions: newTotalSessions,
      gracePeriodEndsAt: gracePeriodEnds.toISOString(),
    };
  },
});

/**
 * Use a streak freeze — consume one freeze to protect streak during absence
 */
export const useStreakFreeze = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("stats")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!existing) {
      throw new Error("No stats found");
    }

    const freezesAvailable = existing.streakFreezesAvailable ?? 0;
    if (freezesAvailable <= 0) {
      return { success: false, message: "No streak freezes available" };
    }

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;
    const lastUsedMonth = existing.lastStreakFreezeUsed 
      ? `${new Date(existing.lastStreakFreezeUsed).getFullYear()}-${new Date(existing.lastStreakFreezeUsed).getMonth()}`
      : null;

    // Reset monthly count if new month
    const monthlyUsed = lastUsedMonth === currentMonth 
      ? (existing.streakFreezesUsedThisMonth ?? 0)
      : 0;

    // Extend grace period by 24 hours
    const currentGrace = existing.gracePeriodEndsAt 
      ? new Date(existing.gracePeriodEndsAt)
      : new Date();
    const newGraceEnd = new Date(Math.max(currentGrace.getTime(), now.getTime()) + 24 * 60 * 60 * 1000);

    await ctx.db.patch(existing._id, {
      streakFreezesAvailable: freezesAvailable - 1,
      streakFreezesUsedThisMonth: monthlyUsed + 1,
      lastStreakFreezeUsed: now.toISOString(),
      gracePeriodEndsAt: newGraceEnd.toISOString(),
    });

    return {
      success: true,
      freezesRemaining: freezesAvailable - 1,
      gracePeriodEndsAt: newGraceEnd.toISOString(),
      message: "Streak freeze activated! Your streak is protected for 24 more hours.",
    };
  },
});

/**
 * Get streak info with grace period applied
 * Used for UI display — emphasizes cumulative over streak
 */
export const getStreakInfo = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const stats = await ctx.db
      .query("stats")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!stats) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalSessions: 0,
        isStreakActive: false,
        isInGracePeriod: false,
        gracePeriodEndsAt: null,
        freezesAvailable: 2, // Default starting freezes
        streakMessage: "Start your journey!",
        primaryDisplay: "0 cleaning sessions",
        secondaryDisplay: null,
      };
    }

    const daysSinceActivity = getDaysSinceActivity(stats.lastActivityDate);
    const isInGracePeriod = isWithinGracePeriod(stats.gracePeriodEndsAt);
    const totalSessions = stats.totalCleaningSessions ?? stats.totalTasksCompleted ?? 0;
    const currentStreak = stats.currentStreak ?? 0;
    
    // Determine if streak is "active" (activity today or in grace)
    const isStreakActive = daysSinceActivity === 0 || isInGracePeriod;

    // Build user-friendly messages
    let streakMessage: string;
    if (daysSinceActivity === 0) {
      streakMessage = currentStreak > 1 
        ? `${currentStreak} day streak — you're on fire! 🔥`
        : "You're tidying today!";
    } else if (isInGracePeriod) {
      streakMessage = "48hr safe zone active ✨";
    } else if (daysSinceActivity >= 2) {
      streakMessage = "Welcome back! 💛"; // Never shame, always welcome
    } else {
      streakMessage = "New day, new opportunity!";
    }

    // PRIMARY: Cumulative sessions (what we celebrate most)
    // SECONDARY: Streak (smaller emphasis)
    const primaryDisplay = totalSessions === 1 
      ? "1 cleaning session total"
      : `${totalSessions} cleaning sessions total`;
    
    const secondaryDisplay = isStreakActive && currentStreak > 0
      ? `${currentStreak}-day tidy streak`
      : null;

    return {
      currentStreak,
      longestStreak: stats.longestStreak ?? 0,
      totalSessions,
      isStreakActive,
      isInGracePeriod,
      gracePeriodEndsAt: stats.gracePeriodEndsAt ?? null,
      freezesAvailable: stats.streakFreezesAvailable ?? 2,
      streakMessage,
      primaryDisplay,
      secondaryDisplay,
      daysSinceActivity,
      comebackBonusActive: (stats.comebackBonusMultiplier ?? 1) > 1,
      comebackBonusMultiplier: stats.comebackBonusMultiplier ?? 1,
    };
  },
});

/**
 * Grant streak freezes — called weekly or on specific achievements
 */
export const grantStreakFreezes = mutation({
  args: { count: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("stats")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const maxFreezes = 5; // Cap at 5 freezes
    const current = existing?.streakFreezesAvailable ?? 0;
    const newTotal = Math.min(current + args.count, maxFreezes);

    if (existing) {
      await ctx.db.patch(existing._id, {
        streakFreezesAvailable: newTotal,
      });
    } else {
      await ctx.db.insert("stats", {
        userId,
        ...DEFAULT_STATS,
        streakFreezesAvailable: newTotal,
      });
    }

    return { freezesAvailable: newTotal };
  },
});
