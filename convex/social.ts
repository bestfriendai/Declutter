import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const createChallenge = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    type: v.optional(
      v.union(
        v.literal("task_count"),
        v.literal("time_based"),
        v.literal("room_complete"),
        v.literal("streak"),
        v.literal("collectibles")
      )
    ),
    target: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    durationDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const inviteCode = generateInviteCode();
    const now = Date.now();
    const durationDays = args.durationDays ?? 7;
    const startDate = args.startDate ?? now;
    const endDate = args.endDate ?? (startDate + durationDays * 24 * 60 * 60 * 1000);

    return await ctx.db.insert("challenges", {
      creatorId: userId,
      title: args.title,
      description: args.description,
      type: args.type ?? "task_count",
      target: args.target ?? 10,
      startDate,
      endDate,
      inviteCode,
      isActive: true,
      participants: [userId as string],
    });
  },
});

export const joinChallenge = mutation({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const challenge = await ctx.db
      .query("challenges")
      .filter((q) => q.eq(q.field("inviteCode"), args.inviteCode))
      .first();

    if (!challenge) throw new Error("Challenge not found");
    if (!challenge.isActive) throw new Error("Challenge is no longer active");

    const participants = challenge.participants ?? [];
    if (participants.includes(userId as string)) {
      return challenge._id;
    }

    await ctx.db.patch(challenge._id, {
      participants: [...participants, userId as string],
    });

    return challenge._id;
  },
});

export const getChallenge = query({
  args: { id: v.id("challenges") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const challenge = await ctx.db.get(args.id);
    if (!challenge) return null;

    // Only return if user is a participant or creator
    const participants = challenge.participants ?? [];
    if (challenge.creatorId !== userId && !participants.includes(userId as string)) {
      return null;
    }

    return challenge;
  },
});

export const listChallenges = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get challenges created by user
    const created = await ctx.db
      .query("challenges")
      .filter((q) => q.eq(q.field("creatorId"), userId))
      .collect();

    // Get all challenges to find ones user has joined
    const allChallenges = await ctx.db.query("challenges").collect();
    const joined = allChallenges.filter(
      (c) =>
        c.creatorId !== userId &&
        (c.participants ?? []).includes(userId as string)
    );

    return [...created, ...joined];
  },
});

export const addConnection = mutation({
  args: {
    friendId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if connection already exists
    const existing = await ctx.db
      .query("connections")
      .filter((q) =>
        q.or(
          q.and(
            q.eq(q.field("userId"), userId),
            q.eq(q.field("friendId"), args.friendId)
          ),
          q.and(
            q.eq(q.field("userId"), args.friendId),
            q.eq(q.field("friendId"), userId)
          )
        )
      )
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("connections", {
      userId,
      friendId: args.friendId,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const updateConnection = mutation({
  args: {
    id: v.id("connections"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("blocked")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const connection = await ctx.db.get(args.id);
    if (!connection) throw new Error("Connection not found");

    // Only the recipient (friendId) can accept/block
    if (connection.friendId !== userId) {
      throw new Error("Only the recipient can update this connection");
    }

    await ctx.db.patch(args.id, {
      status: args.status,
    });

    return args.id;
  },
});

export const listConnections = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const connections = await ctx.db
      .query("connections")
      .filter((q) =>
        q.or(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("friendId"), userId)
        )
      )
      .collect();

    return connections;
  },
});
