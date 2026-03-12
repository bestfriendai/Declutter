import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // The auth library already created the user doc; patch it with profile fields
    const existing = await ctx.db.get(userId);
    if (!existing) throw new Error("User document not found");

    // If already has name set, consider it already created
    if (existing.name) return userId;

    await ctx.db.patch(userId, {
      name: args.name,
      avatar: args.avatar,
      onboardingComplete: false,
      createdAt: Date.now(),
    });

    return userId;
  },
});

export const update = mutation({
  args: {
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
    onboardingComplete: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.avatar !== undefined) updates.avatar = args.avatar;
    if (args.onboardingComplete !== undefined)
      updates.onboardingComplete = args.onboardingComplete;

    await ctx.db.patch(userId, updates);
    return userId;
  },
});

export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Delete all rooms and their associated tasks, subtasks, photos
    const rooms = await ctx.db
      .query("rooms")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
    for (const room of rooms) {
      const tasks = await ctx.db
        .query("tasks")
        .filter((q) => q.eq(q.field("roomId"), room._id))
        .collect();
      for (const task of tasks) {
        const subtasks = await ctx.db
          .query("subtasks")
          .filter((q) => q.eq(q.field("taskId"), task._id))
          .collect();
        for (const subtask of subtasks) {
          await ctx.db.delete(subtask._id);
        }
        await ctx.db.delete(task._id);
      }
      const photos = await ctx.db
        .query("photos")
        .filter((q) => q.eq(q.field("roomId"), room._id))
        .collect();
      for (const photo of photos) {
        await ctx.db.delete(photo._id);
      }
      await ctx.db.delete(room._id);
    }

    // Delete stats
    const stats = await ctx.db
      .query("stats")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
    if (stats) await ctx.db.delete(stats._id);

    // Delete badges
    const badges = await ctx.db
      .query("badges")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
    for (const badge of badges) {
      await ctx.db.delete(badge._id);
    }

    // Delete settings
    const settings = await ctx.db
      .query("settings")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
    if (settings) await ctx.db.delete(settings._id);

    // Delete mascot
    const mascot = await ctx.db
      .query("mascots")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
    if (mascot) await ctx.db.delete(mascot._id);

    // Delete collected items
    const collectedItems = await ctx.db
      .query("collectedItems")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
    for (const item of collectedItems) {
      await ctx.db.delete(item._id);
    }

    // Delete collection stats
    const collectionStats = await ctx.db
      .query("collectionStats")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
    if (collectionStats) await ctx.db.delete(collectionStats._id);

    // Delete connections (where user is either userId or friendId)
    const connections = await ctx.db
      .query("connections")
      .filter((q) =>
        q.or(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("friendId"), userId)
        )
      )
      .collect();
    for (const conn of connections) {
      await ctx.db.delete(conn._id);
    }

    // Delete challenges created by user
    const challenges = await ctx.db
      .query("challenges")
      .filter((q) => q.eq(q.field("creatorId"), userId))
      .collect();
    for (const challenge of challenges) {
      await ctx.db.delete(challenge._id);
    }

    // Delete user profile
    await ctx.db.delete(userId);
  },
});
