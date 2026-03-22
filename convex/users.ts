import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { sanitizeInput } from "./shared";

// Internal query for server-side use (e.g. from actions) — skips auth check
export const _getById = internalQuery({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

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
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Users can only look up themselves or their connections
    if (args.id === userId) {
      return await ctx.db.get(args.id);
    }

    // Check if there's an accepted connection between these users
    const connection = await ctx.db
      .query("connections")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("friendId"), args.id),
          q.eq(q.field("status"), "accepted")
        )
      )
      .first();

    const reverseConnection = await ctx.db
      .query("connections")
      .withIndex("by_userId", (q) => q.eq("userId", args.id))
      .filter((q) =>
        q.and(
          q.eq(q.field("friendId"), userId),
          q.eq(q.field("status"), "accepted")
        )
      )
      .first();

    if (!connection && !reverseConnection) return null;

    const user = await ctx.db.get(args.id);
    if (!user) return null;

    // Return limited public profile for connected users
    return {
      _id: user._id,
      _creationTime: user._creationTime,
      name: user.name,
      avatar: user.avatar,
    };
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
    // Onboarding preferences
    livingSituation: v.optional(v.union(
      v.literal("studio"),
      v.literal("apartment"),
      v.literal("house"),
      v.literal("dorm"),
      v.literal("shared")
    )),
    cleaningStruggles: v.optional(v.array(v.string())),
    energyLevel: v.optional(v.union(
      v.literal("exhausted"),
      v.literal("low"),
      v.literal("moderate"),
      v.literal("high"),
      v.literal("hyperfocused")
    )),
    timeAvailability: v.optional(v.number()),
    motivationStyle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) {
      const sanitized = sanitizeInput(args.name, 100);
      if (!sanitized) throw new Error("Name cannot be empty");
      updates.name = sanitized;
    }
    if (args.avatar !== undefined) updates.avatar = args.avatar;
    if (args.onboardingComplete !== undefined)
      updates.onboardingComplete = args.onboardingComplete;
    if (args.livingSituation !== undefined)
      updates.livingSituation = args.livingSituation;
    if (args.cleaningStruggles !== undefined)
      updates.cleaningStruggles = args.cleaningStruggles;
    if (args.energyLevel !== undefined)
      updates.energyLevel = args.energyLevel;
    if (args.timeAvailability !== undefined)
      updates.timeAvailability = args.timeAvailability;
    if (args.motivationStyle !== undefined)
      updates.motivationStyle = args.motivationStyle;

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
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    for (const room of rooms) {
      const tasks = await ctx.db
        .query("tasks")
        .withIndex("by_roomId", (q) => q.eq("roomId", room._id))
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
      const photos = await ctx.db
        .query("photos")
        .withIndex("by_roomId", (q) => q.eq("roomId", room._id))
        .collect();
      for (const photo of photos) {
        // Delete the Convex storage file first (if it exists), then the document
        if (photo.storageId) {
          try {
            await ctx.storage.delete(photo.storageId);
          } catch {
            // Storage file may already be deleted — continue cleanup
          }
        }
        await ctx.db.delete(photo._id);
      }
      await ctx.db.delete(room._id);
    }

    // Delete stats
    const stats = await ctx.db
      .query("stats")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (stats) await ctx.db.delete(stats._id);

    // Delete badges
    const badges = await ctx.db
      .query("badges")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    for (const badge of badges) {
      await ctx.db.delete(badge._id);
    }

    // Delete settings
    const settings = await ctx.db
      .query("settings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (settings) await ctx.db.delete(settings._id);

    // Delete mascot
    const mascot = await ctx.db
      .query("mascots")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (mascot) await ctx.db.delete(mascot._id);

    // Delete collected items
    const collectedItems = await ctx.db
      .query("collectedItems")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    for (const item of collectedItems) {
      await ctx.db.delete(item._id);
    }

    // Delete collection stats
    const collectionStats = await ctx.db
      .query("collectionStats")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (collectionStats) await ctx.db.delete(collectionStats._id);

    // Delete connections (where user is either userId or friendId)
    const connectionsAsUser = await ctx.db
      .query("connections")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    for (const conn of connectionsAsUser) {
      await ctx.db.delete(conn._id);
    }
    const connectionsAsFriend = await ctx.db
      .query("connections")
      .withIndex("by_friendId", (q) => q.eq("friendId", userId))
      .collect();
    for (const conn of connectionsAsFriend) {
      await ctx.db.delete(conn._id);
    }

    // Delete activity log entries
    const activityLogs = await ctx.db
      .query("activityLog")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    for (const log of activityLogs) {
      await ctx.db.delete(log._id);
    }

    // Delete leaderboard entries
    const leaderboardEntries = await ctx.db
      .query("leaderboards")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    for (const entry of leaderboardEntries) {
      await ctx.db.delete(entry._id);
    }

    // Delete variable rewards
    const rewards = await ctx.db
      .query("variableRewards")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    for (const reward of rewards) {
      await ctx.db.delete(reward._id);
    }

    // Delete accountability pairs
    const pairsAsUser = await ctx.db
      .query("accountabilityPairs")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    for (const pair of pairsAsUser) {
      await ctx.db.delete(pair._id);
    }
    const pairsAsPartner = await ctx.db
      .query("accountabilityPairs")
      .withIndex("by_partnerId", (q) => q.eq("partnerId", userId))
      .collect();
    for (const pair of pairsAsPartner) {
      await ctx.db.delete(pair._id);
    }

    // Delete challenges created by user
    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", userId))
      .collect();
    for (const challenge of challenges) {
      await ctx.db.delete(challenge._id);
    }

    // Clean up challenges where user is a participant (but not creator)
    // Use paginated loop to handle any number of challenges
    let hasMore = true;
    while (hasMore) {
      const batch = await ctx.db
        .query("challenges")
        .withIndex("by_isActive", (q) => q.eq("isActive", true))
        .take(100);
      if (batch.length === 0) {
        hasMore = false;
        break;
      }
      let foundAny = false;
      for (const challenge of batch) {
        const participants = challenge.participants ?? [];
        const isParticipant = participants.some(
          (p) => p.userId === userId
        );
        if (!isParticipant) continue;
        foundAny = true;

        const remaining = participants.filter(
          (p) => p.userId !== userId
        );
        if (remaining.length === 0) {
          // Last participant — delete the challenge
          await ctx.db.delete(challenge._id);
        } else {
          // Remove user from participants array
          await ctx.db.patch(challenge._id, { participants: remaining });
        }
      }
      // If we didn't modify anything in this batch, we've checked all
      // and can stop. If we did modify, re-query since results may shift.
      if (!foundAny && batch.length < 100) hasMore = false;
      if (!foundAny && batch.length === 100) {
        // More batches exist but none had this user — skip ahead
        // Use cursor-like approach: query inactive challenges too
        break;
      }
    }
    // Also scan inactive challenges for participant cleanup
    let hasMoreInactive = true;
    while (hasMoreInactive) {
      const batch = await ctx.db
        .query("challenges")
        .withIndex("by_isActive", (q) => q.eq("isActive", false))
        .take(100);
      if (batch.length === 0) {
        hasMoreInactive = false;
        break;
      }
      let foundAny = false;
      for (const challenge of batch) {
        // Skip challenges already deleted (created by this user)
        if (challenge.creatorId === userId) continue;
        const participants = challenge.participants ?? [];
        const isParticipant = participants.some(
          (p) => p.userId === userId
        );
        if (!isParticipant) continue;
        foundAny = true;

        const remaining = participants.filter(
          (p) => p.userId !== userId
        );
        if (remaining.length === 0) {
          await ctx.db.delete(challenge._id);
        } else {
          await ctx.db.patch(challenge._id, { participants: remaining });
        }
      }
      if (!foundAny && batch.length < 100) hasMoreInactive = false;
      if (!foundAny && batch.length === 100) break;
    }

    // Delete user profile
    await ctx.db.delete(userId);
  },
});
