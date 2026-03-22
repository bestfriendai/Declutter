import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listByRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const room = await ctx.db.get(args.roomId);
    if (!room || room.userId !== userId) return [];

    return await ctx.db
      .query("photos")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .collect();
  },
});

export const create = mutation({
  args: {
    roomId: v.id("rooms"),
    uri: v.string(),
    type: v.union(v.literal("before"), v.literal("progress"), v.literal("after")),
    storageId: v.optional(v.id("_storage")),
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const room = await ctx.db.get(args.roomId);
    if (!room || room.userId !== userId) throw new Error("Room not found");

    // Validate file size (max 10MB) if a storage file was uploaded
    if (args.storageId) {
      const metadata = await ctx.storage.getMetadata(args.storageId);
      if (metadata && metadata.size > 10 * 1024 * 1024) {
        await ctx.storage.delete(args.storageId);
        throw new Error("Photo exceeds maximum size of 10MB");
      }
    }

    const uploadedUrl = args.storageId
      ? await ctx.storage.getUrl(args.storageId)
      : null;

    return await ctx.db.insert("photos", {
      roomId: args.roomId,
      userId,
      uri: uploadedUrl ?? args.uri,
      type: args.type,
      storageId: args.storageId,
      timestamp: args.timestamp ?? Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("photos") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const photo = await ctx.db.get(args.id);
    if (!photo || photo.userId !== userId) throw new Error("Photo not found");

    // If there's a storage ID, delete the stored file too
    if (photo.storageId) {
      await ctx.storage.delete(photo.storageId);
    }

    await ctx.db.delete(args.id);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Rate limit: max 50 photo uploads per day
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentPhotos = await ctx.db
      .query("photos")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("timestamp"), dayAgo))
      .collect();
    if (recentPhotos.length >= 50) {
      throw new Error("Photo upload limit reached (max 50 per day). Try again tomorrow.");
    }

    return await ctx.storage.generateUploadUrl();
  },
});
