import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery, mutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Save Expo push token to user record
export const savePushToken = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return; // Skip silently if not authenticated yet

    await ctx.db.patch(userId, {
      expoPushToken: args.token,
      pushTokenUpdatedAt: Date.now(),
    });
  },
});

// Remove push token (for logout)
export const removePushToken = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return; // Silently skip if not authenticated (e.g. during logout)

    await ctx.db.patch(userId, {
      expoPushToken: undefined,
      pushTokenUpdatedAt: undefined,
    });
  },
});

// Internal query to get user's push token (not exposed publicly for security)
export const getUserPushToken = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<string | null> => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    return user.expoPushToken ?? null;
  },
});

// Internal mutation to clear a stale push token when Expo reports DeviceNotRegistered
export const clearStalePushToken = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;

    await ctx.db.patch(args.userId, {
      expoPushToken: undefined,
      pushTokenUpdatedAt: undefined,
    });
  },
});

// Internal action: send push notification (callable from other server functions via scheduler)
export const _sendPushNotification = internalAction({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string; result?: unknown }> => {
    const pushToken: string | null = await ctx.runQuery(
      internal.notifications.getUserPushToken,
      { userId: args.userId }
    );

    if (!pushToken) {
      return { success: false, error: "No push token" };
    }

    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: pushToken,
          title: args.title,
          body: args.body,
          data: args.data ?? {},
          sound: "default",
          priority: "high",
          channelId: "reminders",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: String(result) };
      }

      if (result?.data?.status === "error") {
        const errorDetail = result.data.details?.error;
        if (errorDetail === "DeviceNotRegistered") {
          try {
            await ctx.runMutation(
              internal.notifications.clearStalePushToken,
              { userId: args.userId }
            );
          } catch {
            // Best-effort cleanup
          }
          return { success: false, error: "DeviceNotRegistered — token cleared" };
        }
        return { success: false, error: errorDetail || "Push send error" };
      }

      return { success: true, result };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },
});

// Send a push notification when a cleaning session completes
export const sendSessionCompleteNotification = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    await ctx.scheduler.runAfter(0, internal.notifications._sendPushNotification, {
      userId,
      title: "Session Complete!",
      body: "Great work! Every cleaning session makes a difference.",
      data: { type: "session-complete", screen: "session-complete" },
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Inactivity Nudge — Shame-free "we miss you" push notifications
// ─────────────────────────────────────────────────────────────────────────────

const COMEBACK_MESSAGES = [
  { title: "Good morning! ☀️", body: "Dusty's ready when you are. Even 60 seconds counts." },
  { title: "Hey stranger 💛", body: "No judgment here. Wanna do one tiny thing?" },
  { title: "Quick check-in 🌟", body: "Your space is waiting. No pressure, just possibilities." },
  { title: "Psst! 🤫", body: "One small task = one big win for your brain." },
  { title: "You've got this 💪", body: "Even opening the app counts as a step forward." },
  { title: "Gentle nudge 🌱", body: "Your future self will thank you for 60 seconds now." },
];

/**
 * Cron-driven: find users inactive 3+ days and send a gentle nudge.
 * - Skips users without a push token
 * - Skips users who opted out of notifications
 * - Never sends more than one nudge per 3-day window
 */
export const checkInactiveUsers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    const threeDaysAgoStr = new Date(threeDaysAgo).toISOString().split("T")[0];

    // Collect all stats (Convex mutations run in a single transaction, so we
    // can't use paginate here). Use collect() which is safe for stats table
    // sizes (one row per user). Cap nudges sent to avoid scheduler overload.
    const allStats = await ctx.db.query("stats").collect();

    let nudgesSent = 0;
    const MAX_NUDGES_PER_RUN = 50; // Cap to avoid timeout

    for (const stat of allStats) {
      if (nudgesSent >= MAX_NUDGES_PER_RUN) break;

      // Skip if no lastActivityDate or if active recently
      if (!stat.lastActivityDate) continue;
      // Quick string comparison: dates like "2026-03-17" sort lexicographically
      if (stat.lastActivityDate >= threeDaysAgoStr) continue;

      // Check if user exists and has a push token
      const user = await ctx.db.get(stat.userId);
      if (!user?.expoPushToken) continue;

      // Respect notification opt-out from settings
      const settings = await ctx.db
        .query("settings")
        .withIndex("by_userId", (q) => q.eq("userId", stat.userId))
        .unique();
      if (settings && !settings.notifications) continue;

      // Don't spam — skip if we already nudged within the last 3 days
      if (
        user.lastInactivityNudge &&
        user.lastInactivityNudge > threeDaysAgo
      ) {
        continue;
      }

      // Pick a random shame-free message
      const msg =
        COMEBACK_MESSAGES[Math.floor(Math.random() * COMEBACK_MESSAGES.length)];

      // Schedule the push notification via the existing internal action
      await ctx.scheduler.runAfter(
        0,
        internal.notifications._sendPushNotification,
        {
          userId: stat.userId,
          title: msg.title,
          body: msg.body,
          data: { type: "inactivity-nudge", screen: "index" },
        }
      );

      // Mark that we sent a nudge so we don't double-send
      await ctx.db.patch(user._id, {
        lastInactivityNudge: Date.now(),
      });

      nudgesSent++;
    }
  },
});

/**
 * INTERNAL: Send a push notification via Expo's Push API.
 * Not callable from clients — use sendSessionCompleteNotification or
 * other purpose-specific public mutations that schedule this internally.
 */
export const sendPushNotification = internalAction({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string; result?: unknown }> => {
    // Look up the user's push token via internal query (not publicly accessible)
    const pushToken: string | null = await ctx.runQuery(
      internal.notifications.getUserPushToken,
      { userId: args.userId }
    );

    if (!pushToken) {
      return { success: false, error: "No push token" };
    }

    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: pushToken,
          title: args.title,
          body: args.body,
          data: args.data ?? {},
          sound: "default",
          priority: "high",
          channelId: "reminders",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: String(result) };
      }

      // Handle Expo push API error responses (e.g., DeviceNotRegistered)
      if (result?.data?.status === "error") {
        const errorDetail = result.data.details?.error;
        if (errorDetail === "DeviceNotRegistered") {
          try {
            await ctx.runMutation(
              internal.notifications.clearStalePushToken,
              { userId: args.userId }
            );
          } catch {
            // Best-effort cleanup
          }
          return { success: false, error: "DeviceNotRegistered — token cleared" };
        }
        return { success: false, error: errorDetail || "Push send error" };
      }

      return { success: true, result };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },
});
