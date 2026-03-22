/**
 * Accountability Partners — Convex functions
 * Lightweight pairs system: two users see each other's daily activity
 * and send gentle, shame-free nudges.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const NUDGE_MESSAGES = [
  "Hey! Your space misses you \u{1F9F9}",
  "I just cleaned \u2014 your turn? \u{1F60A}",
  "No pressure, tomorrow works too \u2764\uFE0F",
  "Quick 60-second tidy? I believe in you! \u{1F4AA}",
  "Dusty says hi from my phone! \u{1F9F9}\u2728",
];

const MAX_NUDGES_PER_DAY = 2;
const INVITE_CODE_LENGTH = 6;
const BOTH_ACTIVE_XP_BONUS = 0.20; // 20 %

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function generateInviteCode(): string {
  // Use crypto.randomUUID() for cryptographically secure randomness.
  // Take first INVITE_CODE_LENGTH chars (uppercase hex-ish, no ambiguous chars).
  return crypto.randomUUID().replace(/-/g, "").substring(0, INVITE_CODE_LENGTH).toUpperCase();
}

function startOfDay(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a pending accountability pair and generate a 6-char invite code.
 * If the user already has a pending invite, return the existing one.
 */
export const createPair = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check for existing active partnership
    const existingActive = await ctx.db
      .query("accountabilityPairs")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    const activeAsUser = existingActive.find((p) => p.status === "active");
    if (activeAsUser) throw new Error("You already have an active partner");

    const existingActiveAsPartner = await ctx.db
      .query("accountabilityPairs")
      .withIndex("by_partnerId", (q) => q.eq("partnerId", userId))
      .collect();
    const activeAsPartner = existingActiveAsPartner.find((p) => p.status === "active");
    if (activeAsPartner) throw new Error("You already have an active partner");

    // Check for existing pending invite created by this user
    const pendingAsUser = existingActive.find((p) => p.status === "pending");
    if (pendingAsUser) {
      return { inviteCode: pendingAsUser.inviteCode, pairId: pendingAsUser._id };
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let attempts = 0;
    while (attempts < 10) {
      const dup = await ctx.db
        .query("accountabilityPairs")
        .withIndex("by_inviteCode", (q) => q.eq("inviteCode", inviteCode))
        .first();
      if (!dup) break;
      inviteCode = generateInviteCode();
      attempts++;
    }

    const pairId = await ctx.db.insert("accountabilityPairs", {
      userId,
      partnerId: userId, // placeholder — updated on join
      status: "pending",
      createdAt: Date.now(),
      inviteCode,
      nudgeCount: 0,
      bothActiveStreak: 0,
      totalBothActiveDays: 0,
    });

    return { inviteCode, pairId };
  },
});

/**
 * Join a pair using an invite code. Sets status to "active".
 */
export const joinPair = mutation({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const code = args.inviteCode.toUpperCase().trim();

    // Find the pending pair
    const pair = await ctx.db
      .query("accountabilityPairs")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", code))
      .first();

    if (!pair) throw new Error("Invite code not found");
    if (pair.status !== "pending") throw new Error("This invite is no longer available");
    if (pair.userId === userId) throw new Error("You cannot pair with yourself");

    // Check the joining user doesn't already have an active pair
    const myPairsAsUser = await ctx.db
      .query("accountabilityPairs")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    const myPairsAsPartner = await ctx.db
      .query("accountabilityPairs")
      .withIndex("by_partnerId", (q) => q.eq("partnerId", userId))
      .collect();
    const hasActive =
      myPairsAsUser.some((p) => p.status === "active") ||
      myPairsAsPartner.some((p) => p.status === "active");
    if (hasActive) throw new Error("You already have an active partner");

    await ctx.db.patch(pair._id, {
      partnerId: userId,
      status: "active",
    });

    return { pairId: pair._id };
  },
});

/**
 * Get active partner info for the current user.
 */
export const getMyPartner = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Find active pair where user is either side
    const pairsAsUser = await ctx.db
      .query("accountabilityPairs")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    const pairsAsPartner = await ctx.db
      .query("accountabilityPairs")
      .withIndex("by_partnerId", (q) => q.eq("partnerId", userId))
      .collect();

    const activePair =
      pairsAsUser.find((p) => p.status === "active") ||
      pairsAsPartner.find((p) => p.status === "active");

    if (!activePair) return null;

    // Determine which side is the partner
    const isUserSide = activePair.userId === userId;
    const partnerId = isUserSide ? activePair.partnerId : activePair.userId;

    const partnerUser = await ctx.db.get(partnerId);
    const partnerStats = await ctx.db
      .query("stats")
      .withIndex("by_userId", (q) => q.eq("userId", partnerId))
      .first();

    // Get partner's mascot for emoji
    const partnerMascot = await ctx.db
      .query("mascots")
      .withIndex("by_userId", (q) => q.eq("userId", partnerId))
      .first();

    const today = new Date().toISOString().split("T")[0];
    const partnerActiveToday = isUserSide
      ? activePair.lastPartnerActiveDate === today
      : activePair.lastUserActiveDate === today;
    const userActiveToday = isUserSide
      ? activePair.lastUserActiveDate === today
      : activePair.lastPartnerActiveDate === today;

    // Calculate nudges sent today
    const dayStart = startOfDay();
    const nudgesSentToday =
      activePair.lastNudgeSent && activePair.lastNudgeSent >= dayStart
        ? activePair.nudgeCount
        : 0;

    return {
      pairId: activePair._id,
      partnerId,
      partnerName: partnerUser?.name ?? "Partner",
      partnerEmoji: partnerMascot?.personality === "dusty" ? "\u{1F9F9}" : "\u2728",
      partnerActiveToday,
      userActiveToday,
      partnerStreak: partnerStats?.currentStreak ?? 0,
      bothActiveStreak: activePair.bothActiveStreak,
      totalBothActiveDays: activePair.totalBothActiveDays,
      nudgesSentToday,
      maxNudgesPerDay: MAX_NUDGES_PER_DAY,
      xpBonusPercent: Math.round(BOTH_ACTIVE_XP_BONUS * 100),
      bothActiveToday: partnerActiveToday && userActiveToday,
    };
  },
});

/**
 * Send a gentle, pre-written nudge. Max 2 per day.
 */
export const sendNudge = mutation({
  args: { nudgeIndex: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Find active pair
    const pairsAsUser = await ctx.db
      .query("accountabilityPairs")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    const pairsAsPartner = await ctx.db
      .query("accountabilityPairs")
      .withIndex("by_partnerId", (q) => q.eq("partnerId", userId))
      .collect();

    const activePair =
      pairsAsUser.find((p) => p.status === "active") ||
      pairsAsPartner.find((p) => p.status === "active");

    if (!activePair) throw new Error("No active partner");

    // Check daily nudge limit per sender — tracked independently per side
    const dayStart = startOfDay();
    const isUserSide = activePair.userId === userId;

    // userId-side uses nudgeCount + lastNudgeSent
    // partnerId-side uses partnerNudgeCount + lastNudgeReceived
    const senderLastNudge = isUserSide
      ? activePair.lastNudgeSent
      : activePair.lastNudgeReceived;

    const rawCount = isUserSide
      ? activePair.nudgeCount
      : (activePair.partnerNudgeCount ?? 0);

    const todayCount =
      senderLastNudge && senderLastNudge >= dayStart ? rawCount : 0;

    if (todayCount >= MAX_NUDGES_PER_DAY) {
      return {
        success: false,
        message: "You've sent your max nudges for today. Try again tomorrow!",
      };
    }

    const nudgeIdx =
      args.nudgeIndex !== undefined && args.nudgeIndex >= 0 && args.nudgeIndex < NUDGE_MESSAGES.length
        ? args.nudgeIndex
        : Math.floor(Math.random() * NUDGE_MESSAGES.length);
    const nudgeMessage = NUDGE_MESSAGES[nudgeIdx];

    const now = Date.now();

    // Persist per-side counter only — no shared field mutation
    await ctx.db.patch(activePair._id, {
      ...(isUserSide
        ? { nudgeCount: todayCount + 1, lastNudgeSent: now }
        : { partnerNudgeCount: todayCount + 1, lastNudgeReceived: now }),
    });

    // ── Send push notification to the partner ──
    const partnerId = isUserSide ? activePair.partnerId : activePair.userId;
    const senderUser = await ctx.db.get(userId);
    const senderName = senderUser?.name?.trim() || "Your partner";

    await ctx.scheduler.runAfter(0, internal.notifications._sendPushNotification, {
      userId: partnerId,
      title: `${senderName} nudged you! \u{1F49B}`,
      body: nudgeMessage,
      data: { type: "nudge" },
    });

    return {
      success: true,
      message: nudgeMessage,
      nudgesRemaining: MAX_NUDGES_PER_DAY - (todayCount + 1),
    };
  },
});

/**
 * Mark current user as active today. Called when a task is completed.
 */
export const updateActivity = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Find all active pairs
    const pairsAsUser = await ctx.db
      .query("accountabilityPairs")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    const pairsAsPartner = await ctx.db
      .query("accountabilityPairs")
      .withIndex("by_partnerId", (q) => q.eq("partnerId", userId))
      .collect();

    const activePairs = [
      ...pairsAsUser.filter((p) => p.status === "active"),
      ...pairsAsPartner.filter((p) => p.status === "active"),
    ];

    const today = new Date().toISOString().split("T")[0];

    for (const pair of activePairs) {
      const isUserSide = pair.userId === userId;

      // Check if this side was already marked active today (avoid double-counting)
      const alreadyActiveToday = isUserSide ? pair.lastUserActiveDate === today : pair.lastPartnerActiveDate === today;

      const updates: Record<string, unknown> = isUserSide
        ? { lastUserActiveDate: today }
        : { lastPartnerActiveDate: today };

      // Only increment bothActiveStreak/totalBothActiveDays if:
      // 1. The other side is already active today
      // 2. This side was NOT already active (i.e., this is the first activity today for this user)
      // 3. The lastBothActiveDate is not today (prevents double-counting if both sides re-trigger)
      const otherActive = isUserSide ? pair.lastPartnerActiveDate === today : pair.lastUserActiveDate === today;
      if (
        otherActive &&
        !alreadyActiveToday &&
        (pair as Record<string, unknown>).lastBothActiveDate !== today
      ) {
        updates.bothActiveStreak = (pair.bothActiveStreak ?? 0) + 1;
        updates.totalBothActiveDays = (pair.totalBothActiveDays ?? 0) + 1;
        updates.lastBothActiveDate = today;
      }

      await ctx.db.patch(pair._id, updates);
    }
  },
});

/**
 * Check if both partners are active today (returns XP bonus info).
 */
export const getBothActiveBonus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const pairsAsUser = await ctx.db
      .query("accountabilityPairs")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    const pairsAsPartner = await ctx.db
      .query("accountabilityPairs")
      .withIndex("by_partnerId", (q) => q.eq("partnerId", userId))
      .collect();

    const activePair =
      pairsAsUser.find((p) => p.status === "active") ||
      pairsAsPartner.find((p) => p.status === "active");

    if (!activePair) {
      return { hasPartner: false, bothActive: false, bonusPercent: 0 };
    }

    const today = new Date().toISOString().split("T")[0];
    const bothActive =
      activePair.lastUserActiveDate === today &&
      activePair.lastPartnerActiveDate === today;

    return {
      hasPartner: true,
      bothActive,
      bonusPercent: bothActive ? Math.round(BOTH_ACTIVE_XP_BONUS * 100) : 0,
      bothActiveStreak: activePair.bothActiveStreak,
      totalBothActiveDays: activePair.totalBothActiveDays,
    };
  },
});

/**
 * End partnership. Sets status to "ended".
 */
export const endPartnership = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const pairsAsUser = await ctx.db
      .query("accountabilityPairs")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    const pairsAsPartner = await ctx.db
      .query("accountabilityPairs")
      .withIndex("by_partnerId", (q) => q.eq("partnerId", userId))
      .collect();

    const activePair =
      pairsAsUser.find((p) => p.status === "active") ||
      pairsAsPartner.find((p) => p.status === "active");

    if (!activePair) throw new Error("No active partnership");

    await ctx.db.patch(activePair._id, { status: "ended" });

    return { success: true };
  },
});

/**
 * Get the user's pending invite code (if they created one).
 */
export const getInviteCode = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const pairsAsUser = await ctx.db
      .query("accountabilityPairs")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const pending = pairsAsUser.find((p) => p.status === "pending");
    if (!pending) return null;

    return { inviteCode: pending.inviteCode, pairId: pending._id };
  },
});
