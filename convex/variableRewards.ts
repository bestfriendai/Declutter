import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

/**
 * Reward type definitions with probabilities and amounts
 */
const REWARD_CONFIG = {
  bonus_xp: { weight: 40, minAmount: 15, maxAmount: 30 },
  streak_shield: { weight: 25, minAmount: 1, maxAmount: 1 },
  mystery_collectible: { weight: 20, minAmount: 1, maxAmount: 1 },
  mascot_treat: { weight: 15, minAmount: 10, maxAmount: 25 },
} as const;

type RewardType = keyof typeof REWARD_CONFIG;

/**
 * Pick a random reward type based on weighted probabilities
 */
function pickRewardType(): RewardType {
  const totalWeight = Object.values(REWARD_CONFIG).reduce(
    (sum, r) => sum + r.weight,
    0
  );
  let random = Math.random() * totalWeight;

  for (const [type, config] of Object.entries(REWARD_CONFIG)) {
    random -= config.weight;
    if (random <= 0) {
      return type as RewardType;
    }
  }

  return "bonus_xp"; // fallback
}

/**
 * Generate a random amount within the reward's range
 */
function getRewardAmount(type: RewardType): number {
  const config = REWARD_CONFIG[type];
  return (
    Math.floor(Math.random() * (config.maxAmount - config.minAmount + 1)) +
    config.minAmount
  );
}

/**
 * Check if a reward should be given after task completion.
 *
 * DEPRECATED: Variable rewards are now generated inside stats.incrementTask
 * (the single source of truth). This mutation is kept for backward compatibility
 * but will return { rewarded: false } if a reward was already granted by
 * incrementTask for the same taskCount. Do NOT call both from the client —
 * incrementTask handles reward generation automatically.
 */
/**
 * DEPRECATED & INTERNAL: Variable rewards are now generated inside stats.incrementTask.
 * This is kept as an internal mutation for backward compatibility / server-side use only.
 * Not callable from clients to prevent reward farming.
 */
export const checkForReward = internalMutation({
  args: {
    userId: v.id("users"),
    taskCount: v.number(), // current total tasks completed
  },
  handler: async (ctx, args) => {
    // Only trigger on every 3rd task
    if (args.taskCount % 3 !== 0 || args.taskCount === 0) {
      return { rewarded: false };
    }

    // Check if we already gave a reward for this task number
    const existingRewards = await ctx.db
      .query("variableRewards")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const alreadyRewarded = existingRewards.some(
      (r) => r.taskNumber === args.taskCount
    );

    if (alreadyRewarded) {
      return { rewarded: false };
    }

    // Generate reward using shared config
    const rewardType = pickRewardType();
    const amount = getRewardAmount(rewardType);

    const rewardId = await ctx.db.insert("variableRewards", {
      userId: args.userId,
      taskNumber: args.taskCount,
      rewardType,
      amount,
      earnedAt: Date.now(),
      claimed: false,
    });

    return {
      rewarded: true,
      reward: {
        _id: rewardId,
        rewardType,
        amount,
        taskNumber: args.taskCount,
      },
    };
  },
});

/**
 * Claim a pending reward — mark as claimed and apply its effects
 */
export const claimReward = mutation({
  args: {
    rewardId: v.id("variableRewards"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const reward = await ctx.db.get(args.rewardId);
    if (!reward) throw new Error("Reward not found");
    if (reward.userId.toString() !== userId.toString()) {
      throw new Error("Not your reward");
    }
    if (reward.claimed) {
      return { success: false, message: "Already claimed" };
    }

    // Mark as claimed
    await ctx.db.patch(args.rewardId, { claimed: true });

    // Apply reward effects
    switch (reward.rewardType) {
      case "bonus_xp": {
        // Add bonus XP to stats
        const stats = await ctx.db
          .query("stats")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .first();
        if (stats) {
          const newXp = (stats.xp ?? 0) + reward.amount;
          await ctx.db.patch(stats._id, {
            xp: newXp,
            level: Math.floor(newXp / 100) + 1,
          });
        }
        break;
      }
      case "streak_shield": {
        // Add streak freeze
        const stats = await ctx.db
          .query("stats")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .first();
        if (stats) {
          const currentFreezes = stats.streakFreezesAvailable ?? 0;
          await ctx.db.patch(stats._id, {
            streakFreezesAvailable: Math.min(currentFreezes + 1, 5),
          });
        }
        break;
      }
      case "mystery_collectible": {
        // Collectible spawned — client handles display/collection
        break;
      }
      case "mascot_treat": {
        // Boost mascot happiness
        const mascot = await ctx.db
          .query("mascots")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .first();
        if (mascot) {
          await ctx.db.patch(mascot._id, {
            happiness: Math.min(100, (mascot.happiness ?? 0) + reward.amount),
            lastInteraction: Date.now(),
          });
        }
        break;
      }
    }

    return {
      success: true,
      rewardType: reward.rewardType,
      amount: reward.amount,
    };
  },
});

/**
 * Get all unclaimed rewards for the current user
 */
export const getUnclaimedRewards = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const rewards = await ctx.db
      .query("variableRewards")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    return rewards.filter((r) => !r.claimed);
  },
});
