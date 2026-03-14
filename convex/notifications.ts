import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";

// Save Expo push token to user record
export const savePushToken = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

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
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(userId, {
      expoPushToken: undefined,
      pushTokenUpdatedAt: undefined,
    });
  },
});

// Query to get user's push token
export const getUserPushToken = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<string | null> => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    return user.expoPushToken ?? null;
  },
});

// Send a push notification via Expo's Push API
export const sendPushNotification = action({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string; result?: unknown }> => {
    // Look up the user's push token
    const pushToken: string | null = await ctx.runQuery(
      api.notifications.getUserPushToken,
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
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Expo push API error:", result);
        return { success: false, error: String(result) };
      }

      return { success: true, result };
    } catch (error) {
      console.error("Failed to send push notification:", error);
      return { success: false, error: String(error) };
    }
  },
});

import { api } from "./_generated/api";
