import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
  // Comeback Engine badges — celebrate returns, not punish absence
  { id: "comeback-1", name: "Comeback Kid", description: "Return after 3+ days away", emoji: "💛", requirement: 1, type: "comeback" as const },
  { id: "comeback-3", name: "Resilient Cleaner", description: "Come back 3 times", emoji: "🌈", requirement: 3, type: "comeback" as const },
  { id: "comeback-champion", name: "Comeback Champion", description: "Return after 7+ days away", emoji: "🏆", requirement: 7, type: "longComeback" as const },
  // Cumulative session badges — emphasize total over streaks
  { id: "sessions-10", name: "Getting Started", description: "10 cleaning sessions total", emoji: "🌱", requirement: 10, type: "sessions" as const },
  { id: "sessions-25", name: "Building Habits", description: "25 cleaning sessions total", emoji: "🌿", requirement: 25, type: "sessions" as const },
  { id: "sessions-50", name: "Persistent Cleaner", description: "50 cleaning sessions total", emoji: "🌳", requirement: 50, type: "sessions" as const },
  { id: "sessions-100", name: "Century Club", description: "100 cleaning sessions total", emoji: "💯", requirement: 100, type: "sessions" as const },
  { id: "sessions-250", name: "Declutter Legend", description: "250 cleaning sessions total", emoji: "⭐", requirement: 250, type: "sessions" as const },
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
    type: v.union(
      v.literal("tasks"),
      v.literal("rooms"),
      v.literal("streak"),
      v.literal("time"),
      v.literal("comeback"),
      v.literal("longComeback"),
      v.literal("sessions")
    ),
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
    // Comeback Engine stats
    const comebackCount = stats?.comebackCount ?? 0;
    const totalSessions = stats?.totalCleaningSessions ?? tasks;
    // Calculate days since last activity for long comeback badge
    let daysSinceActivity = 0;
    if (stats?.lastActivityDate) {
      const lastDate = new Date(stats.lastActivityDate);
      const now = new Date();
      lastDate.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      daysSinceActivity = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    }

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
        case "comeback":
          // Number of times user has come back after 3+ days
          value = comebackCount;
          break;
        case "longComeback":
          // Awarded when returning after 7+ days (check daysSinceActivity at comeback time)
          // This is checked during recordActivity, so we track via comebackCount with long breaks
          // For simplicity, this badge is unlocked when the comebackCount is 1+ and a recent comeback was 7+ days
          // We'll use a special flag in stats to track long comebacks
          value = daysSinceActivity >= 7 && comebackCount > 0 ? 7 : 0;
          break;
        case "sessions":
          // Total cumulative cleaning sessions (never resets)
          value = totalSessions;
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
