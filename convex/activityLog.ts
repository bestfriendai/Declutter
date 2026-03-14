import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Record daily activity — upsert today's entry
 * Increments tasksCompleted, minutesCleaned, xpEarned, sessionsCount
 */
export const recordDailyActivity = mutation({
  args: {
    tasksCompleted: v.optional(v.number()),
    minutesCleaned: v.optional(v.number()),
    xpEarned: v.optional(v.number()),
    sessionsCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const today = new Date().toISOString().split("T")[0];

    const existing = await ctx.db
      .query("activityLog")
      .withIndex("by_userId_date", (q) =>
        q.eq("userId", userId).eq("date", today)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        tasksCompleted:
          existing.tasksCompleted + (args.tasksCompleted ?? 0),
        minutesCleaned:
          existing.minutesCleaned + (args.minutesCleaned ?? 0),
        xpEarned: existing.xpEarned + (args.xpEarned ?? 0),
        sessionsCount:
          existing.sessionsCount + (args.sessionsCount ?? 0),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("activityLog", {
        userId,
        date: today,
        tasksCompleted: args.tasksCompleted ?? 0,
        minutesCleaned: args.minutesCleaned ?? 0,
        xpEarned: args.xpEarned ?? 0,
        sessionsCount: args.sessionsCount ?? 0,
      });
    }
  },
});

/**
 * Get last 90 days of activity for the streak calendar
 * Returns array of { date, tasksCompleted, xpEarned }
 */
export const getCalendarData = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Calculate date 90 days ago
    const now = new Date();
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const cutoffDate = ninetyDaysAgo.toISOString().split("T")[0];

    const entries = await ctx.db
      .query("activityLog")
      .withIndex("by_userId_date", (q) =>
        q.eq("userId", userId).gte("date", cutoffDate)
      )
      .collect();

    return entries.map((entry) => ({
      date: entry.date,
      tasksCompleted: entry.tasksCompleted,
      xpEarned: entry.xpEarned,
    }));
  },
});

/**
 * Get this week's daily breakdown
 * Returns activity for each day of the current week (Mon-Sun)
 */
export const getWeeklyActivity = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get Monday of current week
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(monday.getDate() + mondayOffset);
    const mondayStr = monday.toISOString().split("T")[0];

    // Get Sunday (end of week)
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    const sundayStr = sunday.toISOString().split("T")[0];

    const entries = await ctx.db
      .query("activityLog")
      .withIndex("by_userId_date", (q) =>
        q.eq("userId", userId).gte("date", mondayStr)
      )
      .collect();

    // Filter to only this week (lte sunday)
    return entries.filter((entry) => entry.date <= sundayStr);
  },
});
