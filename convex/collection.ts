import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listItems = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("collectedItems")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const stats = await ctx.db
      .query("collectionStats")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (!stats) {
      return {
        userId,
        totalCollected: 0,
        uniqueCollected: 0,
        commonCount: 0,
        uncommonCount: 0,
        rareCount: 0,
        epicCount: 0,
        legendaryCount: 0,
      };
    }
    return stats;
  },
});

export const collect = mutation({
  args: {
    collectibleId: v.string(),
    rarity: v.string(),
    roomId: v.optional(v.string()),
    taskId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Add item
    const id = await ctx.db.insert("collectedItems", {
      userId,
      collectibleId: args.collectibleId,
      collectedAt: Date.now(),
      roomId: args.roomId,
      taskId: args.taskId,
    });

    // Update stats
    const stats = await ctx.db
      .query("collectionStats")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    const validRarities = ["common", "uncommon", "rare", "epic", "legendary"] as const;
    const rarity = validRarities.includes(args.rarity as any)
      ? (args.rarity as (typeof validRarities)[number])
      : null;

    if (stats) {
      await ctx.db.patch(stats._id, {
        totalCollected: (stats.totalCollected ?? 0) + 1,
        lastCollected: Date.now(),
        ...(rarity === "common" && { commonCount: (stats.commonCount ?? 0) + 1 }),
        ...(rarity === "uncommon" && { uncommonCount: (stats.uncommonCount ?? 0) + 1 }),
        ...(rarity === "rare" && { rareCount: (stats.rareCount ?? 0) + 1 }),
        ...(rarity === "epic" && { epicCount: (stats.epicCount ?? 0) + 1 }),
        ...(rarity === "legendary" && { legendaryCount: (stats.legendaryCount ?? 0) + 1 }),
      });
    } else {
      await ctx.db.insert("collectionStats", {
        userId,
        totalCollected: 1,
        uniqueCollected: 1,
        commonCount: rarity === "common" ? 1 : 0,
        uncommonCount: rarity === "uncommon" ? 1 : 0,
        rareCount: rarity === "rare" ? 1 : 0,
        epicCount: rarity === "epic" ? 1 : 0,
        legendaryCount: rarity === "legendary" ? 1 : 0,
        lastCollected: Date.now(),
      });
    }

    return id;
  },
});

export const updateStats = mutation({
  args: {
    totalCollected: v.optional(v.number()),
    uniqueCollected: v.optional(v.number()),
    commonCount: v.optional(v.number()),
    uncommonCount: v.optional(v.number()),
    rareCount: v.optional(v.number()),
    epicCount: v.optional(v.number()),
    legendaryCount: v.optional(v.number()),
    lastCollected: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("collectionStats")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (existing) {
      const patch: Record<string, unknown> = {};
      if (args.totalCollected !== undefined) patch.totalCollected = args.totalCollected;
      if (args.uniqueCollected !== undefined) patch.uniqueCollected = args.uniqueCollected;
      if (args.commonCount !== undefined) patch.commonCount = args.commonCount;
      if (args.uncommonCount !== undefined) patch.uncommonCount = args.uncommonCount;
      if (args.rareCount !== undefined) patch.rareCount = args.rareCount;
      if (args.epicCount !== undefined) patch.epicCount = args.epicCount;
      if (args.legendaryCount !== undefined) patch.legendaryCount = args.legendaryCount;
      if (args.lastCollected !== undefined) patch.lastCollected = args.lastCollected;
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    } else {
      return await ctx.db.insert("collectionStats", {
        userId,
        totalCollected: args.totalCollected ?? 0,
        uniqueCollected: args.uniqueCollected ?? 0,
        commonCount: args.commonCount ?? 0,
        uncommonCount: args.uncommonCount ?? 0,
        rareCount: args.rareCount ?? 0,
        epicCount: args.epicCount ?? 0,
        legendaryCount: args.legendaryCount ?? 0,
        lastCollected: args.lastCollected,
      });
    }
  },
});
