import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action, internalMutation, internalQuery, mutation } from "./_generated/server";
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

// Send a push notification via Expo's Push API
export const sendPushNotification = action({
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
          // Token is stale — clear it so we don't keep sending to a dead token
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
