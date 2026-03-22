import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { sanitizeInput } from "./shared";
import { internal } from "./_generated/api";

/**
 * Expire challenges past their endDate. Called daily by cron.
 * Marks active challenges that have passed endDate as "expired" and sets isActive to false.
 */
export const expireChallenges = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Find all active challenges — use the by_isActive index
    const activeChallenges = await ctx.db
      .query("challenges")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    let expiredCount = 0;
    for (const challenge of activeChallenges) {
      if (challenge.endDate < now) {
        // Check if any participant completed
        const anyCompleted = challenge.participants?.some((p) => p.completed) ?? false;

        await ctx.db.patch(challenge._id, {
          status: anyCompleted ? "completed" : "expired",
          isActive: false,
        });
        expiredCount++;
      }
    }

    return { expiredCount };
  },
});

function generateInviteCode(): string {
  // Use crypto.randomUUID() for cryptographically secure randomness.
  // Strip hyphens and take first 8 chars, uppercased.
  return crypto.randomUUID().replace(/-/g, "").substring(0, 8).toUpperCase();
}

export const createChallenge = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    type: v.optional(
      v.union(
        v.literal("tasks_count"),
        v.literal("time_spent"),
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

    // Rate limit: max 5 active challenges per user
    const userChallenges = await ctx.db
      .query("challenges")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    if (userChallenges.length >= 5) {
      throw new Error("Challenge limit reached (max 5 active). Complete or end a challenge first.");
    }

    const sanitizedTitle = sanitizeInput(args.title, 100);
    const sanitizedDescription = sanitizeInput(args.description, 500);
    if (!sanitizedTitle) throw new Error("Challenge title cannot be empty");

    const user = await ctx.db.get(userId);
    const creatorName = user?.name?.trim() || "Declutterer";

    // Generate a unique invite code — retry if collision (extremely unlikely with UUID)
    let inviteCode = generateInviteCode();
    let codeAttempts = 0;
    while (codeAttempts < 5) {
      const existing = await ctx.db
        .query("challenges")
        .withIndex("by_inviteCode", (q) => q.eq("inviteCode", inviteCode))
        .first();
      if (!existing) break;
      inviteCode = generateInviteCode();
      codeAttempts++;
    }

    const now = Date.now();
    const durationDays = args.durationDays ?? 7;
    if (durationDays <= 0) {
      throw new Error("durationDays must be a positive number");
    }
    const startDate = args.startDate ?? now;
    const endDate =
      args.endDate ?? startDate + durationDays * 24 * 60 * 60 * 1000;

    return await ctx.db.insert("challenges", {
      creatorId: userId,
      creatorName,
      title: sanitizedTitle,
      description: sanitizedDescription,
      type: args.type ?? "tasks_count",
      target: args.target ?? 10,
      startDate,
      endDate,
      status: "in_progress",
      createdAt: now,
      inviteCode,
      isActive: true,
      participants: [
        {
          userId: userId,
          displayName: creatorName,
          progress: 0,
          joined: now,
          completed: false,
        },
      ],
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
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", args.inviteCode))
      .first();

    if (!challenge) throw new Error("Challenge not found");
    if (!challenge.isActive) throw new Error("Challenge is no longer active");

    const participants = challenge.participants ?? [];

    // Cap at 50 participants to prevent unbounded array growth
    if (participants.length >= 50) {
      throw new Error("This challenge is full (max 50 participants)");
    }

    if (participants.some((participant) => participant.userId === userId)) {
      return challenge._id;
    }

    const user = await ctx.db.get(userId);
    const displayName = user?.name?.trim() || "Declutterer";

    await ctx.db.patch(challenge._id, {
      participants: [
        ...participants,
        {
          userId: userId,
          displayName,
          progress: 0,
          joined: Date.now(),
          completed: false,
        },
      ],
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
    if (
      challenge.creatorId !== userId &&
      !participants.some((participant) => participant.userId === userId)
    ) {
      return null;
    }

    return challenge;
  },
});

export const updateChallengeProgress = mutation({
  args: {
    id: v.id("challenges"),
    progress: v.number(),
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const challenge = await ctx.db.get(args.id);
    if (!challenge) throw new Error("Challenge not found");

    const nextParticipants = (challenge.participants ?? []).map((participant) => {
      if (participant.userId !== userId) {
        return participant;
      }

      const completed = args.completed ?? participant.completed;
      return {
        ...participant,
        progress: args.progress,
        completed,
        completedAt: completed ? Date.now() : undefined,
      };
    });

    await ctx.db.patch(args.id, {
      participants: nextParticipants,
    });

    // ── Check if challenge is now complete (all participants reached target) ──
    const allCompleted = nextParticipants.length > 0 &&
      nextParticipants.every((p) => p.completed);

    if (allCompleted && challenge.status !== "completed") {
      // Mark challenge as completed
      await ctx.db.patch(args.id, {
        status: "completed",
        isActive: false,
      });

      // Send push notification to all participants
      for (const participant of nextParticipants) {
        await ctx.scheduler.runAfter(0, internal.notifications._sendPushNotification, {
          userId: participant.userId,
          title: "Challenge Complete! \u{1F389}",
          body: `Everyone finished "${challenge.title}"! Great teamwork!`,
          data: { type: "challenge", challengeId: args.id },
        });
      }
    }

    return args.id;
  },
});

export const listChallenges = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get challenges created by user (uses index)
    const created = await ctx.db
      .query("challenges")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", userId))
      .collect();

    // For challenges the user has joined but didn't create, we need to scan
    // active challenges only. This is a known limitation since participants
    // are stored as an embedded array. Use the by_isActive index to avoid
    // full table scans, then filter by creatorId in-memory.
    const activeChallenges = await ctx.db
      .query("challenges")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .filter((q) => q.neq(q.field("creatorId"), userId))
      .take(200); // Cap to prevent unbounded reads

    const joined = activeChallenges.filter(
      (c) =>
        (c.participants ?? []).some(
          (participant) => participant.userId === userId
        )
    );

    return [...created, ...joined].sort(
      (left, right) => (right.createdAt ?? 0) - (left.createdAt ?? 0)
    );
  },
});

export const incrementMyProgress = mutation({
  args: { increment: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    // Find all active challenges where user is a participant (uses index)
    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    for (const challenge of challenges) {
      const participants = challenge.participants ?? [];
      const userIdx = participants.findIndex((p) => p.userId === userId);
      if (userIdx === -1) continue;

      const updated = [...participants];
      const newProgress = Math.min(
        (updated[userIdx].progress ?? 0) + args.increment,
        challenge.target ?? 999
      );
      updated[userIdx] = {
        ...updated[userIdx],
        progress: newProgress,
        completed: newProgress >= (challenge.target ?? 999),
      };

      await ctx.db.patch(challenge._id, { participants: updated });

      // If just completed, fire notification
      if (updated[userIdx].completed && !participants[userIdx].completed) {
        try {
          await ctx.scheduler.runAfter(
            0,
            internal.notifications._sendPushNotification,
            {
              userId,
              title: "Challenge Complete! \u{1F3C6}",
              body: `You completed "${challenge.title}"!`,
              data: { type: "challenge", challengeId: challenge._id },
            }
          );
        } catch {
          // Best-effort notification
        }
      }
    }
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

export const removeConnection = mutation({
  args: { connectionId: v.id("connections") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const connection = await ctx.db.get(args.connectionId);
    if (!connection) throw new Error("Connection not found");
    if (connection.userId !== userId && connection.friendId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.connectionId);
  },
});

export const listConnections = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Query both sides of the connection using indexes
    const connectionsAsUser = await ctx.db
      .query("connections")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    const connectionsAsFriend = await ctx.db
      .query("connections")
      .withIndex("by_friendId", (q) => q.eq("friendId", userId))
      .collect();

    const allConnections = [...connectionsAsUser, ...connectionsAsFriend];

    // Join friend user data so the client has display names
    const enriched = await Promise.all(
      allConnections.map(async (conn) => {
        // The "other" user is whichever side isn't the current user
        const otherUserId =
          conn.userId === userId ? conn.friendId : conn.userId;
        const otherUser = await ctx.db.get(otherUserId);
        return {
          ...conn,
          friendName: otherUser?.name?.trim() || null,
          friendEmail: otherUser?.email || null,
          friendImage: otherUser?.image || null,
        };
      })
    );

    return enriched;
  },
});
