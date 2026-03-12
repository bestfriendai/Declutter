import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

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
      .filter((q) => q.eq(q.field("userId"), userId))
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
      .filter((q) => q.eq(q.field("userId"), userId))
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
      .filter((q) => q.eq(q.field("userId"), userId))
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
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("stats")
      .filter((q) => q.eq(q.field("userId"), userId))
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
      return existing._id;
    } else {
      return await ctx.db.insert("stats", {
        userId,
        ...DEFAULT_STATS,
        totalTasksCompleted: newTasks,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        xp: newXp,
        level: newLevel,
      });
    }
  },
});

export const decrementTask = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("stats")
      .filter((q) => q.eq(q.field("userId"), userId))
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
      .filter((q) => q.eq(q.field("userId"), userId))
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
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...DEFAULT_STATS,
      });
    }
  },
});
