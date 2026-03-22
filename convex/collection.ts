import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listItems = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("collectedItems")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
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
      .withIndex("by_userId", (q) => q.eq("userId", userId))
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
    roomId: v.optional(v.id("rooms")),
    taskId: v.optional(v.id("tasks")),
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

    // Check if this collectibleId is already owned by the user (for unique count)
    // We just inserted the item above, so if there's only 1 match, it's new.
    const allMatchingItems = await ctx.db
      .query("collectedItems")
      .withIndex("by_userId_collectibleId", (q) =>
        q.eq("userId", userId).eq("collectibleId", args.collectibleId)
      )
      .collect();
    const isNewUnique = allMatchingItems.length === 1; // only the one we just inserted

    // Update stats
    const stats = await ctx.db
      .query("collectionStats")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const validRarities = ["common", "uncommon", "rare", "epic", "legendary"] as const;
    const rarity = validRarities.includes(args.rarity as any)
      ? (args.rarity as (typeof validRarities)[number])
      : null;

    if (stats) {
      await ctx.db.patch(stats._id, {
        totalCollected: (stats.totalCollected ?? 0) + 1,
        // Only increment uniqueCollected and rarity counts for truly new unique items
        ...(isNewUnique ? { uniqueCollected: (stats.uniqueCollected ?? 0) + 1 } : {}),
        lastCollected: Date.now(),
        ...(isNewUnique && rarity === "common" && { commonCount: (stats.commonCount ?? 0) + 1 }),
        ...(isNewUnique && rarity === "uncommon" && { uncommonCount: (stats.uncommonCount ?? 0) + 1 }),
        ...(isNewUnique && rarity === "rare" && { rareCount: (stats.rareCount ?? 0) + 1 }),
        ...(isNewUnique && rarity === "epic" && { epicCount: (stats.epicCount ?? 0) + 1 }),
        ...(isNewUnique && rarity === "legendary" && { legendaryCount: (stats.legendaryCount ?? 0) + 1 }),
      });
    } else {
      await ctx.db.insert("collectionStats", {
        userId,
        totalCollected: 1,
        uniqueCollected: 1, // first item is always unique
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

/**
 * INTERNAL: Update collection stats. Not callable from clients to prevent
 * manipulation of collection counts. Stats are updated automatically via `collect`.
 */
export const updateStats = internalMutation({
  args: {
    userId: v.id("users"),
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
    const existing = await ctx.db
      .query("collectionStats")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
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
        userId: args.userId,
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
