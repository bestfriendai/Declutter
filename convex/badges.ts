import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const BADGE_DEFS = [
  { id: "first-task", name: "First Step", description: "Complete your first task", emoji: "🌱", requirement: 1, type: "tasks" as const },
  { id: "task-10", name: "Getting Going", description: "Complete 10 tasks", emoji: "🚀", requirement: 10, type: "tasks" as const },
  { id: "task-50", name: "Cleaning Machine", description: "Complete 50 tasks", emoji: "⚡", requirement: 50, type: "tasks" as const },
  { id: "task-100", name: "Declutter Master", description: "Complete 100 tasks", emoji: "👑", requirement: 100, type: "tasks" as const },
  { id: "first-room", name: "Room Conquered", description: "Fully clean a room", emoji: "🏠", requirement: 1, type: "rooms" as const },
  { id: "rooms-5", name: "Home Hero", description: "Clean 5 rooms", emoji: "🦸", requirement: 5, type: "rooms" as const },
  { id: "streak-3", name: "Consistent", description: "3 day streak", emoji: "🔥", requirement: 3, type: "streak" as const },
  { id: "streak-7", name: "Week Warrior", description: "7 day streak", emoji: "💪", requirement: 7, type: "streak" as const },
  { id: "streak-30", name: "Monthly Master", description: "30 day streak", emoji: "🏆", requirement: 30, type: "streak" as const },
  { id: "time-60", name: "Hour Power", description: "Clean for 60 minutes total", emoji: "⏰", requirement: 60, type: "time" as const },
  { id: "time-300", name: "Time Investor", description: "Clean for 5 hours total", emoji: "📈", requirement: 300, type: "time" as const },
];

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("badges")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
  },
});

export const unlock = mutation({
  args: {
    badgeId: v.string(),
    name: v.string(),
    description: v.string(),
    emoji: v.string(),
    requirement: v.number(),
    type: v.union(v.literal("tasks"), v.literal("rooms"), v.literal("streak"), v.literal("time")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if already unlocked
    const existing = await ctx.db
      .query("badges")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("badgeId"), args.badgeId)
        )
      )
      .first();
    if (existing) return existing._id;

    return await ctx.db.insert("badges", {
      userId,
      badgeId: args.badgeId,
      name: args.name,
      description: args.description,
      emoji: args.emoji,
      unlockedAt: Date.now(),
      requirement: args.requirement,
      type: args.type,
    });
  },
});

export const checkAndUnlock = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get current stats
    const stats = await ctx.db
      .query("stats")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    const tasks = stats?.totalTasksCompleted ?? 0;
    const rooms = stats?.totalRoomsCleaned ?? 0;
    const streak = stats?.currentStreak ?? 0;
    const minutes = stats?.totalMinutesCleaned ?? 0;

    // Get already unlocked badges
    const unlockedBadges = await ctx.db
      .query("badges")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
    const unlockedIds = new Set(unlockedBadges.map((b) => b.badgeId));

    const newlyUnlocked: string[] = [];

    for (const badge of BADGE_DEFS) {
      if (unlockedIds.has(badge.id)) continue;

      let value = 0;
      switch (badge.type) {
        case "tasks":
          value = tasks;
          break;
        case "rooms":
          value = rooms;
          break;
        case "streak":
          value = streak;
          break;
        case "time":
          value = minutes;
          break;
      }

      if (value >= badge.requirement) {
        await ctx.db.insert("badges", {
          userId,
          badgeId: badge.id,
          name: badge.name,
          description: badge.description,
          emoji: badge.emoji,
          unlockedAt: Date.now(),
          requirement: badge.requirement,
          type: badge.type,
        });
        newlyUnlocked.push(badge.id);
      }
    }

    return newlyUnlocked;
  },
});
