import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

// League definitions with visuals
const LEAGUES = {
  bronze: { name: "Bronze", emoji: "\u{1F949}", color: "#CD7F32", minXP: 0 },
  silver: { name: "Silver", emoji: "\u{1F948}", color: "#C0C0C0", minXP: 0 },
  gold: { name: "Gold", emoji: "\u{1F947}", color: "#FFD700", minXP: 0 },
  diamond: { name: "Diamond", emoji: "\u{1F48E}", color: "#B9F2FF", minXP: 0 },
  champion: { name: "Champion", emoji: "\u{1F451}", color: "#FF6B6B", minXP: 0 },
} as const;

type LeagueKey = keyof typeof LEAGUES;

const LEAGUE_ORDER: LeagueKey[] = [
  "bronze",
  "silver",
  "gold",
  "diamond",
  "champion",
];

/**
 * Get the Monday (start of week) as ISO date string
 */
function getCurrentWeekStart(): string {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(monday.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split("T")[0];
}

/**
 * Get next league in progression
 */
function getNextLeague(current: LeagueKey): LeagueKey | null {
  const idx = LEAGUE_ORDER.indexOf(current);
  if (idx === -1 || idx >= LEAGUE_ORDER.length - 1) return null;
  return LEAGUE_ORDER[idx + 1];
}

/**
 * Get previous league in progression
 */
function getPreviousLeague(current: LeagueKey): LeagueKey | null {
  const idx = LEAGUE_ORDER.indexOf(current);
  if (idx <= 0) return null;
  return LEAGUE_ORDER[idx - 1];
}

/**
 * Get current week's leaderboard for the user's league (top 30 by XP)
 * If user has no entry, creates one in bronze league
 */
export const getWeeklyLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const weekStart = getCurrentWeekStart();

    // Find user's current leaderboard entry
    const userEntries = await ctx.db
      .query("leaderboards")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const userEntry = userEntries.find((e) => e.weekStart === weekStart);
    const userLeague: LeagueKey = userEntry?.league ?? "bronze";

    // Get all entries for this league and week
    const leagueEntries = await ctx.db
      .query("leaderboards")
      .withIndex("by_league_weekStart", (q) =>
        q.eq("league", userLeague).eq("weekStart", weekStart)
      )
      .collect();

    // Sort by XP descending and take top 30
    const sorted = leagueEntries
      .sort((a, b) => b.xpEarned - a.xpEarned)
      .slice(0, 30);

    // Add rank to each entry
    const ranked = sorted.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    // Find user's position
    const userRank = ranked.findIndex(
      (e) => e.userId.toString() === userId.toString()
    );

    return {
      league: userLeague,
      leagueInfo: LEAGUES[userLeague],
      weekStart,
      entries: ranked,
      userRank: userRank >= 0 ? userRank + 1 : null,
      userEntry: userEntry ?? null,
      totalParticipants: leagueEntries.length,
    };
  },
});

/**
 * Add XP to user's weekly leaderboard entry.
 * INTERNAL: Not callable from clients to prevent XP manipulation.
 * Called from stats.incrementTask which already handles XP tracking.
 */
export const updateWeeklyXP = internalMutation({
  args: {
    userId: v.id("users"),
    xpAmount: v.number(),
    tasksCompleted: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Cap XP amount at reasonable maximum (matches addXp cap in stats.ts)
    const xpAmount = Math.max(0, Math.min(args.xpAmount, 500));
    const tasksCompleted = Math.max(0, Math.min(args.tasksCompleted ?? 0, 50));

    const weekStart = getCurrentWeekStart();

    // Find existing entry for this week
    const userEntries = await ctx.db
      .query("leaderboards")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const existingEntry = userEntries.find(
      (e) => e.weekStart === weekStart
    );

    if (existingEntry) {
      await ctx.db.patch(existingEntry._id, {
        xpEarned: existingEntry.xpEarned + xpAmount,
        tasksCompleted:
          existingEntry.tasksCompleted + tasksCompleted,
      });
      return existingEntry._id;
    } else {
      // Determine league from most recent entry, applying promotion/relegation
      const previousEntries = userEntries
        .filter((e) => e.weekStart < weekStart)
        .sort((a, b) => b.weekStart.localeCompare(a.weekStart));

      let league: LeagueKey =
        previousEntries.length > 0 ? previousEntries[0].league : "bronze";

      // Task 10: Apply promotion/relegation from previous week
      if (previousEntries.length > 0) {
        const prevEntry = previousEntries[0];
        if (prevEntry.promoted) {
          const nextLeague = getNextLeague(prevEntry.league);
          if (nextLeague) league = nextLeague;
        } else if (prevEntry.relegated) {
          const prevLeague = getPreviousLeague(prevEntry.league);
          if (prevLeague) league = prevLeague;
        }
      }

      // Get user info for display
      const user = await ctx.db.get(args.userId);
      const userName = user?.name ?? "Cleaner";

      // Get mascot emoji
      const mascot = await ctx.db
        .query("mascots")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .first();
      const userEmoji = mascot
        ? getMascotEmoji(mascot.personality)
        : "\u{1F9F9}"; // default broom emoji

      return await ctx.db.insert("leaderboards", {
        userId: args.userId,
        userName,
        userEmoji,
        weekStart,
        xpEarned: xpAmount,
        tasksCompleted: tasksCompleted,
        league,
      });
    }
  },
});

/**
 * Process weekly results — promote top 10%, relegate bottom 10%
 * SECURITY: This is an internal mutation — not callable from clients.
 * Should be triggered by a cron job or admin action.
 */
export const processWeeklyResults = internalMutation({
  args: {
    weekStart: v.string(), // ISO date of the week to process
  },
  handler: async (ctx, args) => {

    // Process each league
    for (const league of LEAGUE_ORDER) {
      const entries = await ctx.db
        .query("leaderboards")
        .withIndex("by_league_weekStart", (q) =>
          q.eq("league", league).eq("weekStart", args.weekStart)
        )
        .collect();

      if (entries.length === 0) continue;

      // Sort by XP descending
      const sorted = entries.sort((a, b) => b.xpEarned - a.xpEarned);

      // Calculate promotion/relegation thresholds
      const promoteCount = Math.max(1, Math.floor(sorted.length * 0.1));
      const relegateCount = Math.max(1, Math.floor(sorted.length * 0.1));

      for (let i = 0; i < sorted.length; i++) {
        const entry = sorted[i];
        const rank = i + 1;
        const isPromoted =
          i < promoteCount && getNextLeague(league) !== null;
        const isRelegated =
          i >= sorted.length - relegateCount &&
          getPreviousLeague(league) !== null;

        await ctx.db.patch(entry._id, {
          rank,
          promoted: isPromoted,
          relegated: isRelegated,
        });
      }
    }

    return { success: true, weekProcessed: args.weekStart };
  },
});

/**
 * Get user's current league and rank
 */
export const getUserLeague = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const weekStart = getCurrentWeekStart();

    // Find user's current week entry
    const userEntries = await ctx.db
      .query("leaderboards")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const currentEntry = userEntries.find(
      (e) => e.weekStart === weekStart
    );

    if (!currentEntry) {
      // Check last known league from previous weeks, applying promotion/relegation
      const previousEntries = userEntries
        .filter((e) => e.weekStart < weekStart)
        .sort((a, b) => b.weekStart.localeCompare(a.weekStart));

      let league: LeagueKey =
        previousEntries.length > 0 ? previousEntries[0].league : "bronze";

      // Apply promotion/relegation from previous week
      if (previousEntries.length > 0) {
        const prevEntry = previousEntries[0];
        if (prevEntry.promoted) {
          const next = getNextLeague(prevEntry.league);
          if (next) league = next;
        } else if (prevEntry.relegated) {
          const prev = getPreviousLeague(prevEntry.league);
          if (prev) league = prev;
        }
      }

      return {
        league,
        leagueInfo: LEAGUES[league],
        rank: null,
        xpEarned: 0,
        tasksCompleted: 0,
        weekStart,
      };
    }

    // Calculate rank within league
    const leagueEntries = await ctx.db
      .query("leaderboards")
      .withIndex("by_league_weekStart", (q) =>
        q
          .eq("league", currentEntry.league)
          .eq("weekStart", weekStart)
      )
      .collect();

    const sorted = leagueEntries.sort(
      (a, b) => b.xpEarned - a.xpEarned
    );
    const rank =
      sorted.findIndex(
        (e) => e._id.toString() === currentEntry._id.toString()
      ) + 1;

    return {
      league: currentEntry.league,
      leagueInfo: LEAGUES[currentEntry.league],
      rank: rank > 0 ? rank : null,
      xpEarned: currentEntry.xpEarned,
      tasksCompleted: currentEntry.tasksCompleted,
      weekStart,
      promoted: currentEntry.promoted,
      relegated: currentEntry.relegated,
    };
  },
});

/**
 * Get league info — name, color, emoji, and next league details
 */
export const getLeagueInfo = query({
  args: {
    league: v.optional(
      v.union(
        v.literal("bronze"),
        v.literal("silver"),
        v.literal("gold"),
        v.literal("diamond"),
        v.literal("champion")
      )
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const leagueKey: LeagueKey = args.league ?? "bronze";
    const nextLeague = getNextLeague(leagueKey);

    return {
      current: {
        key: leagueKey,
        ...LEAGUES[leagueKey],
      },
      next: nextLeague
        ? {
            key: nextLeague,
            ...LEAGUES[nextLeague],
          }
        : null,
      allLeagues: LEAGUE_ORDER.map((key) => ({
        key,
        ...LEAGUES[key],
      })),
    };
  },
});

/**
 * Cron-friendly wrapper: compute the previous week's start date and
 * delegate to processWeeklyResults. Scheduled by crons.ts every Monday 00:00 UTC.
 */
export const processWeeklyResultsCron = internalMutation({
  args: {},
  handler: async (ctx) => {
    // "Previous week" = the Monday 7 days ago
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon, ...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const thisMonday = new Date(now);
    thisMonday.setUTCDate(thisMonday.getUTCDate() + mondayOffset);
    thisMonday.setUTCHours(0, 0, 0, 0);

    // Go back 7 days to get last week's Monday
    const lastMonday = new Date(thisMonday);
    lastMonday.setUTCDate(lastMonday.getUTCDate() - 7);
    const weekStart = lastMonday.toISOString().split("T")[0];

    // Process each league (inline rather than calling self to avoid scheduler overhead)
    for (const league of LEAGUE_ORDER) {
      const entries = await ctx.db
        .query("leaderboards")
        .withIndex("by_league_weekStart", (q) =>
          q.eq("league", league).eq("weekStart", weekStart)
        )
        .collect();

      if (entries.length === 0) continue;

      const sorted = entries.sort((a, b) => b.xpEarned - a.xpEarned);
      const promoteCount = Math.max(1, Math.floor(sorted.length * 0.1));
      const relegateCount = Math.max(1, Math.floor(sorted.length * 0.1));

      for (let i = 0; i < sorted.length; i++) {
        const entry = sorted[i];
        const rank = i + 1;
        const isPromoted =
          i < promoteCount && getNextLeague(league) !== null;
        const isRelegated =
          i >= sorted.length - relegateCount &&
          getPreviousLeague(league) !== null;

        await ctx.db.patch(entry._id, {
          rank,
          promoted: isPromoted,
          relegated: isRelegated,
        });
      }
    }

    return { success: true, weekProcessed: weekStart };
  },
});

/**
 * Helper: get emoji for mascot personality
 */
function getMascotEmoji(
  personality: "spark" | "bubbles" | "dusty" | "tidy"
): string {
  const emojis = {
    spark: "\u{2728}", // sparkles
    bubbles: "\u{1FAE7}", // bubbles
    dusty: "\u{1F9F9}", // broom
    tidy: "\u{2705}", // check mark
  };
  return emojis[personality] ?? "\u{1F9F9}";
}
