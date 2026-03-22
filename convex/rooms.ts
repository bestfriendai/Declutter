import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { sanitizeInput } from "./shared";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("rooms")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const room = await ctx.db.get(args.id);
    if (!room || room.userId !== userId) return null;
    return room;
  },
});

export const create = mutation({
  args: {
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
    emoji: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Rate limit: max 20 rooms per user
    const existingRooms = await ctx.db
      .query("rooms")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    if (existingRooms.length >= 20) {
      throw new Error("Room limit reached (max 20). Delete a room to create a new one.");
    }

    const sanitizedName = sanitizeInput(args.name, 100);
    if (!sanitizedName) throw new Error("Room name cannot be empty");

    return await ctx.db.insert("rooms", {
      userId,
      name: sanitizedName,
      type: args.type,
      emoji: args.emoji ?? "🏠",
      messLevel: 0,
      currentProgress: 0,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("rooms"),
    name: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("bedroom"),
        v.literal("kitchen"),
        v.literal("bathroom"),
        v.literal("livingRoom"),
        v.literal("office"),
        v.literal("garage"),
        v.literal("closet"),
        v.literal("other")
      )
    ),
    emoji: v.optional(v.string()),
    messLevel: v.optional(v.number()),
    currentProgress: v.optional(v.number()),
    lastAnalyzedAt: v.optional(v.number()),
    aiSummary: v.optional(v.string()),
    motivationalMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const room = await ctx.db.get(args.id);
    if (!room || room.userId !== userId) throw new Error("Room not found");

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) {
      const sanitizedName = sanitizeInput(args.name, 100);
      if (!sanitizedName) throw new Error("Room name cannot be empty");
      updates.name = sanitizedName;
    }
    if (args.type !== undefined) updates.type = args.type;
    if (args.emoji !== undefined) updates.emoji = args.emoji;
    if (args.messLevel !== undefined) updates.messLevel = args.messLevel;
    if (args.currentProgress !== undefined) updates.currentProgress = args.currentProgress;
    if (args.lastAnalyzedAt !== undefined) updates.lastAnalyzedAt = args.lastAnalyzedAt;
    if (args.aiSummary !== undefined) updates.aiSummary = args.aiSummary;
    if (args.motivationalMessage !== undefined) updates.motivationalMessage = args.motivationalMessage;

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const room = await ctx.db.get(args.id);
    if (!room || room.userId !== userId) throw new Error("Room not found");

    // Delete all tasks and their subtasks
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.id))
      .collect();
    for (const task of tasks) {
      const subtasks = await ctx.db
        .query("subtasks")
        .withIndex("by_taskId", (q) => q.eq("taskId", task._id))
        .collect();
      for (const subtask of subtasks) {
        await ctx.db.delete(subtask._id);
      }
      await ctx.db.delete(task._id);
    }

    // Delete all photos and their storage files
    const photos = await ctx.db
      .query("photos")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.id))
      .collect();
    for (const photo of photos) {
      if (photo.storageId) {
        try {
          await ctx.storage.delete(photo.storageId);
        } catch {
          // Storage file may already be deleted — continue cleanup
        }
      }
      await ctx.db.delete(photo._id);
    }

    // Delete the room
    await ctx.db.delete(args.id);
  },
});
