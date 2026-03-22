import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Check for inactive users daily at 10am UTC (morning in most US timezones)
// Sends shame-free, gentle nudge push notifications to users who haven't
// opened the app in 3+ days. Never sends more than one nudge per 3 days.
crons.daily(
  "check-inactive-users",
  { hourUTC: 10, minuteUTC: 0 },
  internal.notifications.checkInactiveUsers,
);

// Process weekly leaderboard results every Monday at 00:00 UTC
// Calculates promotions/relegations for the previous week
crons.weekly(
  "process-weekly-leaderboard",
  { dayOfWeek: "monday", hourUTC: 0, minuteUTC: 0 },
  internal.leaderboard.processWeeklyResultsCron,
);

// Expire challenges past their endDate daily at 01:00 UTC
crons.daily(
  "expire-challenges",
  { hourUTC: 1, minuteUTC: 0 },
  internal.social.expireChallenges,
);

export default crons;
