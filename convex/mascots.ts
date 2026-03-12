import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("mascots")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    personality: v.union(
      v.literal("spark"),
      v.literal("bubbles"),
      v.literal("dusty"),
      v.literal("tidy")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if mascot already exists
    const existing = await ctx.db
      .query("mascots")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
    if (existing) return existing._id;

    return await ctx.db.insert("mascots", {
      userId,
      name: args.name,
      personality: args.personality,
      mood: "happy",
      activity: "idle",
      level: 1,
      xp: 0,
      hunger: 100,
      energy: 100,
      happiness: 100,
      lastFed: Date.now(),
      lastInteraction: Date.now(),
      createdAt: Date.now(),
      accessories: [],
    });
  },
});

export const update = mutation({
  args: {
    name: v.optional(v.string()),
    personality: v.optional(
      v.union(
        v.literal("spark"),
        v.literal("bubbles"),
        v.literal("dusty"),
        v.literal("tidy")
      )
    ),
    mood: v.optional(v.string()),
    activity: v.optional(v.string()),
    level: v.optional(v.number()),
    xp: v.optional(v.number()),
    hunger: v.optional(v.number()),
    energy: v.optional(v.number()),
    happiness: v.optional(v.number()),
    accessories: v.optional(v.array(v.string())),
    currentAccessory: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const mascot = await ctx.db
      .query("mascots")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
    if (!mascot) throw new Error("Mascot not found");

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.personality !== undefined) updates.personality = args.personality;
    if (args.mood !== undefined) updates.mood = args.mood;
    if (args.activity !== undefined) updates.activity = args.activity;
    if (args.level !== undefined) updates.level = args.level;
    if (args.xp !== undefined) updates.xp = args.xp;
    if (args.hunger !== undefined) updates.hunger = args.hunger;
    if (args.energy !== undefined) updates.energy = args.energy;
    if (args.happiness !== undefined) updates.happiness = args.happiness;
    if (args.accessories !== undefined) updates.accessories = args.accessories;
    if (args.currentAccessory !== undefined) updates.currentAccessory = args.currentAccessory;

    await ctx.db.patch(mascot._id, updates);
    return mascot._id;
  },
});

export const feed = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const mascot = await ctx.db
      .query("mascots")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
    if (!mascot) throw new Error("Mascot not found");

    const newHunger = Math.min(100, (mascot.hunger ?? 0) + 20);
    const newHappiness = Math.min(100, (mascot.happiness ?? 0) + 10);
    const newXp = (mascot.xp ?? 0) + 5;
    const newLevel = Math.floor(newXp / 100) + 1;

    await ctx.db.patch(mascot._id, {
      hunger: newHunger,
      happiness: newHappiness,
      xp: newXp,
      level: newLevel,
      lastFed: Date.now(),
    });

    return { hunger: newHunger, happiness: newHappiness, xp: newXp, level: newLevel };
  },
});

export const interact = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const mascot = await ctx.db
      .query("mascots")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
    if (!mascot) throw new Error("Mascot not found");

    const newHappiness = Math.min(100, (mascot.happiness ?? 0) + 15);

    await ctx.db.patch(mascot._id, {
      happiness: newHappiness,
      lastInteraction: Date.now(),
    });

    return { happiness: newHappiness };
  },
});
