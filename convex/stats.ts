import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";

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

    // Server-side capping to prevent abuse via direct API calls
    const clamp = (val: number, max: number) => Math.max(0, Math.min(val, max));

    const data: Record<string, unknown> = {
      totalTasksCompleted: clamp(
        args.totalTasksCompleted ?? existing?.totalTasksCompleted ?? 0,
        100000
      ),
      totalRoomsCleaned: clamp(
        args.totalRoomsCleaned ?? existing?.totalRoomsCleaned ?? 0,
        100000
      ),
      currentStreak: clamp(
        args.currentStreak ?? existing?.currentStreak ?? 0,
        3650
      ),
      longestStreak: clamp(
        args.longestStreak ?? existing?.longestStreak ?? 0,
        3650
      ),
      totalMinutesCleaned: clamp(
        args.totalMinutesCleaned ?? existing?.totalMinutesCleaned ?? 0,
        10000000
      ),
      xp: clamp(args.xp ?? existing?.xp ?? 0, 1000000),
      level: 0,
    };
    data.level = clamp(args.level ?? calculateLevel(data.xp as number), 1000);
    // Clamp streak freezes if provided
    if (args.streakFreezesAvailable !== undefined) {
      args = { ...args, streakFreezesAvailable: clamp(args.streakFreezesAvailable, 10) };
    }

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

    // Validate XP amount: must be positive and capped to prevent abuse
    if (args.amount <= 0) throw new Error("XP amount must be positive");
    if (args.amount > 500) throw new Error("XP amount exceeds maximum allowed per operation");

    const existing = await ctx.db
      .query("stats")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    // Daily XP cap to prevent abuse (bot spamming addXp)
    const MAX_DAILY_XP = 5000;
    const today = new Date().toISOString().split("T")[0];
    const xpToday =
      existing && existing.xpResetDate === today
        ? (existing.xpEarnedToday ?? 0)
        : 0;

    if (xpToday >= MAX_DAILY_XP) {
      // Silently cap — don't throw, just return existing id
      return existing?._id;
    }

    // Cap this operation to not exceed daily limit
    const allowedXp = Math.min(args.amount, MAX_DAILY_XP - xpToday);

    const currentXp = existing?.xp ?? 0;
    const newXp = currentXp + allowedXp;
    const newLevel = calculateLevel(newXp);

    if (existing) {
      await ctx.db.patch(existing._id, {
        xp: newXp,
        level: newLevel,
        xpEarnedToday: xpToday + allowedXp,
        xpResetDate: today,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("stats", {
        userId,
        ...DEFAULT_STATS,
        xp: newXp,
        level: newLevel,
        xpEarnedToday: allowedXp,
        xpResetDate: today,
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

    // Only increment streak once per day (not per task)
    const today = new Date().toISOString().split("T")[0];
    const lastActivity = existing?.lastActivityDate;
    let newStreak = currentStreak;
    if (lastActivity !== today) {
      // New day: check if consecutive or first activity
      if (!lastActivity) {
        newStreak = 1; // First ever activity
      } else {
        const lastDate = new Date(lastActivity);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        newStreak = diffDays === 1 ? currentStreak + 1 : 1;
      }
    }
    const newLongestStreak = Math.max(longestStreak, newStreak);

    // ── Daily XP cap check ──
    const MAX_DAILY_XP = 5000;
    const xpToday =
      existing && existing.xpResetDate === today
        ? (existing.xpEarnedToday ?? 0)
        : 0;

    // ── Comeback XP multiplier ──
    // Apply comeback bonus if the user recently returned after a break
    const comebackMultiplier = existing?.comebackBonusMultiplier ?? 1;
    const baseXpGain = 10;
    const rawXpGain = comebackMultiplier > 1
      ? Math.round(baseXpGain * comebackMultiplier)
      : baseXpGain;
    // Cap XP gain to not exceed daily limit
    const xpGain = xpToday >= MAX_DAILY_XP ? 0 : Math.min(rawXpGain, MAX_DAILY_XP - xpToday);
    const newXp = currentXp + xpGain;
    const newLevel = calculateLevel(newXp);

    // Reset comeback multiplier after use (only lasts for the day it was earned)
    const shouldResetMultiplier =
      comebackMultiplier > 1 &&
      existing?.lastComebackDate &&
      existing.lastComebackDate !== today;

    if (existing) {
      await ctx.db.patch(existing._id, {
        totalTasksCompleted: newTasks,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        xp: newXp,
        level: newLevel,
        lastActivityDate: today,
        xpEarnedToday: xpToday + xpGain,
        xpResetDate: today,
        ...(args.minutesCleaned
          ? { totalMinutesCleaned: (existing.totalMinutesCleaned ?? 0) + args.minutesCleaned }
          : {}),
        ...(shouldResetMultiplier ? { comebackBonusMultiplier: 1 } : {}),
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
        lastActivityDate: today,
        xpEarnedToday: xpGain,
        xpResetDate: today,
        ...(args.minutesCleaned ? { totalMinutesCleaned: args.minutesCleaned } : {}),
      });
    }

    // ── Engagement Engine: Record daily activity ──
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
      // Determine league from previous week, applying promotion/relegation
      const previousEntries = leaderboardEntries
        .filter((e) => e.weekStart < weekStart)
        .sort((a, b) => b.weekStart.localeCompare(a.weekStart));
      let league = previousEntries.length > 0
        ? previousEntries[0].league
        : ("bronze" as const);

      // Apply promotion/relegation from previous week's results
      if (previousEntries.length > 0) {
        const prevEntry = previousEntries[0];
        if (prevEntry.promoted) {
          // Promote to next league
          const LEAGUE_ORDER = ["bronze", "silver", "gold", "diamond", "champion"] as const;
          const idx = LEAGUE_ORDER.indexOf(prevEntry.league as typeof LEAGUE_ORDER[number]);
          if (idx >= 0 && idx < LEAGUE_ORDER.length - 1) {
            league = LEAGUE_ORDER[idx + 1];
          }
        } else if (prevEntry.relegated) {
          // Relegate to previous league
          const LEAGUE_ORDER = ["bronze", "silver", "gold", "diamond", "champion"] as const;
          const idx = LEAGUE_ORDER.indexOf(prevEntry.league as typeof LEAGUE_ORDER[number]);
          if (idx > 0) {
            league = LEAGUE_ORDER[idx - 1];
          }
        }
      }

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

    // ── Streak milestone push notification ──
    // Only send when crossing a milestone boundary (old < milestone, new >= milestone)
    const STREAK_MILESTONES = [3, 7, 14, 30];
    for (const milestone of STREAK_MILESTONES) {
      if (newStreak >= milestone && currentStreak < milestone) {
        await ctx.scheduler.runAfter(0, internal.notifications._sendPushNotification, {
          userId,
          title: `\u{1F525} ${milestone} day streak!`,
          body: `You're on fire! ${milestone} days of tidying in a row!`,
          data: { type: "streak", streak: milestone },
        });
        break; // Only send for the highest newly-crossed milestone
      }
    }

    // ── Badge check: unlock any newly earned badges ──
    // Schedule immediately (0ms delay) so it runs right after this mutation commits.
    // Pass the PREVIOUS lastActivityDate so longComeback badge can calculate
    // days since activity correctly (since we already updated lastActivityDate to today).
    await ctx.scheduler.runAfter(0, internal.badges._checkAndUnlockInternal, {
      userId,
      previousLastActivityDate: lastActivity,
    });

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
    // Do NOT decrement streak — streaks are daily, not per-task.
    // Un-completing a task should not break a daily streak.
    const xpLoss = 10;
    const newXp = Math.max(0, (existing.xp ?? 0) - xpLoss);
    const newLevel = calculateLevel(newXp);

    await ctx.db.patch(existing._id, {
      totalTasksCompleted: newTasks,
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
    const baseXpGain = 50;

    // Daily XP cap check
    const MAX_DAILY_XP = 5000;
    const today = new Date().toISOString().split("T")[0];
    const xpToday =
      existing && existing.xpResetDate === today
        ? (existing.xpEarnedToday ?? 0)
        : 0;
    const xpGain = xpToday >= MAX_DAILY_XP ? 0 : Math.min(baseXpGain, MAX_DAILY_XP - xpToday);

    const newXp = currentXp + xpGain;
    const newLevel = calculateLevel(newXp);

    if (existing) {
      await ctx.db.patch(existing._id, {
        totalRoomsCleaned: currentRooms + 1,
        xp: newXp,
        level: newLevel,
        xpEarnedToday: xpToday + xpGain,
        xpResetDate: today,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("stats", {
        userId,
        ...DEFAULT_STATS,
        totalRoomsCleaned: 1,
        xp: newXp,
        level: newLevel,
        xpEarnedToday: xpGain,
        xpResetDate: today,
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
 * Grant streak freezes — called weekly or on specific achievements.
 * INTERNAL: Not callable from clients to prevent free freeze farming.
 */
export const grantStreakFreezes = internalMutation({
  args: { userId: v.id("users"), count: v.number() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("stats")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
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
        userId: args.userId,
        ...DEFAULT_STATS,
        streakFreezesAvailable: newTotal,
      });
    }

    return { freezesAvailable: newTotal };
  },
});
