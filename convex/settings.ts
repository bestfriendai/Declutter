import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const DEFAULT_SETTINGS = {
  notifications: true,
  theme: "auto" as const,
  hapticFeedback: true,
  encouragementLevel: "moderate" as const,
  taskBreakdownLevel: "detailed" as const,
  focusDefaultDuration: 25,
  focusBreakDuration: 5,
  focusAutoStartBreak: true,
  focusBlockNotifications: true,
  focusPlayWhiteNoise: false,
  focusWhiteNoiseType: "none" as const,
  focusShowMotivationalQuotes: true,
  focusStrictMode: false,
  arCollectionEnabled: true,
  collectibleNotifications: true,
};

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const settings = await ctx.db
      .query("settings")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (!settings) {
      return { ...DEFAULT_SETTINGS, userId };
    }
    return settings;
  },
});

export const upsert = mutation({
  args: {
    notifications: v.optional(v.boolean()),
    reminderTime: v.optional(v.string()),
    theme: v.optional(
      v.union(v.literal("light"), v.literal("dark"), v.literal("auto"))
    ),
    hapticFeedback: v.optional(v.boolean()),
    encouragementLevel: v.optional(
      v.union(
        v.literal("minimal"),
        v.literal("moderate"),
        v.literal("maximum")
      )
    ),
    taskBreakdownLevel: v.optional(
      v.union(
        v.literal("normal"),
        v.literal("detailed"),
        v.literal("ultra")
      )
    ),
    focusDefaultDuration: v.optional(v.number()),
    focusBreakDuration: v.optional(v.number()),
    focusAutoStartBreak: v.optional(v.boolean()),
    focusBlockNotifications: v.optional(v.boolean()),
    focusPlayWhiteNoise: v.optional(v.boolean()),
    focusWhiteNoiseType: v.optional(
      v.union(
        v.literal("rain"),
        v.literal("ocean"),
        v.literal("forest"),
        v.literal("cafe"),
        v.literal("none")
      )
    ),
    focusShowMotivationalQuotes: v.optional(v.boolean()),
    focusStrictMode: v.optional(v.boolean()),
    arCollectionEnabled: v.optional(v.boolean()),
    collectibleNotifications: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("settings")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    const data = {
      notifications: args.notifications ?? existing?.notifications ?? DEFAULT_SETTINGS.notifications,
      theme: args.theme ?? existing?.theme ?? DEFAULT_SETTINGS.theme,
      hapticFeedback: args.hapticFeedback ?? existing?.hapticFeedback ?? DEFAULT_SETTINGS.hapticFeedback,
      encouragementLevel: args.encouragementLevel ?? existing?.encouragementLevel ?? DEFAULT_SETTINGS.encouragementLevel,
      taskBreakdownLevel: args.taskBreakdownLevel ?? existing?.taskBreakdownLevel ?? DEFAULT_SETTINGS.taskBreakdownLevel,
      focusDefaultDuration: args.focusDefaultDuration ?? existing?.focusDefaultDuration ?? DEFAULT_SETTINGS.focusDefaultDuration,
      focusBreakDuration: args.focusBreakDuration ?? existing?.focusBreakDuration ?? DEFAULT_SETTINGS.focusBreakDuration,
      focusAutoStartBreak: args.focusAutoStartBreak ?? existing?.focusAutoStartBreak ?? DEFAULT_SETTINGS.focusAutoStartBreak,
      focusBlockNotifications: args.focusBlockNotifications ?? existing?.focusBlockNotifications ?? DEFAULT_SETTINGS.focusBlockNotifications,
      focusPlayWhiteNoise: args.focusPlayWhiteNoise ?? existing?.focusPlayWhiteNoise ?? DEFAULT_SETTINGS.focusPlayWhiteNoise,
      focusWhiteNoiseType: args.focusWhiteNoiseType ?? existing?.focusWhiteNoiseType ?? DEFAULT_SETTINGS.focusWhiteNoiseType,
      focusShowMotivationalQuotes: args.focusShowMotivationalQuotes ?? existing?.focusShowMotivationalQuotes ?? DEFAULT_SETTINGS.focusShowMotivationalQuotes,
      focusStrictMode: args.focusStrictMode ?? existing?.focusStrictMode ?? DEFAULT_SETTINGS.focusStrictMode,
      arCollectionEnabled: args.arCollectionEnabled ?? existing?.arCollectionEnabled ?? DEFAULT_SETTINGS.arCollectionEnabled,
      collectibleNotifications: args.collectibleNotifications ?? existing?.collectibleNotifications ?? DEFAULT_SETTINGS.collectibleNotifications,
    };

    // Include reminderTime if provided
    const fullData: Record<string, unknown> = { ...data };
    if (args.reminderTime !== undefined) fullData.reminderTime = args.reminderTime;

    if (existing) {
      await ctx.db.patch(existing._id, fullData);
      return existing._id;
    } else {
      return await ctx.db.insert("settings", {
        userId,
        ...data,
        ...(args.reminderTime !== undefined ? { reminderTime: args.reminderTime } : {}),
      });
    }
  },
});
