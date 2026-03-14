/**
 * Comeback Engine — Shame-free re-engagement system
 * 
 * Key Principles:
 * - NO streak reset screens. Ever.
 * - NO guilt messaging. "You haven't cleaned in X days" = NEVER
 * - Cumulative tracking: "You've cleaned 47 times!" > "Day 3 streak"
 * - Grace periods: 48-hour buffer before streak counts as broken
 * - Welcome back messages that celebrate the return
 * - One Tiny Thing: 60-second task to get back in
 * - Comeback bonus: Extra XP for returning after a gap
 */

import { CleaningTask } from '@/types/declutter';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ComebackStatus {
  isReturning: boolean;
  daysSinceActivity: number;
  comebackBonusXP: number;
  totalSessions: number;
  isInGracePeriod: boolean;
  gracePeriodEndsAt: string | null;
  streakSafe: boolean;
  currentStreak?: number;
  comebackCount?: number;
}

export interface OneTinyThingTask {
  id: string;
  title: string;
  description: string;
  emoji: string;
  estimatedSeconds: number;
  category: 'quick-win' | 'mindless' | 'visible-impact';
}

// ─────────────────────────────────────────────────────────────────────────────
// Welcome Back Messages — NEVER guilt-trip
// ─────────────────────────────────────────────────────────────────────────────

const WELCOME_BACK_MESSAGES = {
  short: [  // 2-3 days
    { message: "Hey! Your room missed you 💛", submessage: "One tiny thing to start?" },
    { message: "Welcome back, friend! ✨", submessage: "Rest is part of the process." },
    { message: "Look who's here! 🌟", submessage: "Ready for a quick win?" },
    { message: "You came back! 💜", submessage: "That's the hardest part." },
  ],
  medium: [  // 4-6 days
    { message: "We saved your spot! 💛", submessage: "Pick up whenever you're ready." },
    { message: "Hey stranger! 🌈", submessage: "No judgment here. Let's go!" },
    { message: "The comeback is real! ✨", submessage: "Even 30 seconds counts today." },
    { message: "Life happened. You're back. 💜", submessage: "That takes courage." },
  ],
  long: [  // 7+ days
    { message: "A wild cleaner appears! 🌟", submessage: "Coming back is harder than starting. Extra XP activated!" },
    { message: "The return of the legend! 👑", submessage: "You get bonus XP for showing up today." },
    { message: "Guess who remembered us? 💛", submessage: "Life gets messy. You got this." },
    { message: "Hello again, champion! 🏆", submessage: "Coming back deserves celebration." },
  ],
};

/**
 * Get welcome back message based on days since activity
 * NEVER returns guilt/shame messaging
 */
export function getWelcomeBackMessage(daysSinceActivity: number): { 
  message: string; 
  submessage: string;
  emoji: string;
  bonusActive: boolean;
} {
  let messages;
  let emoji = '💛';
  let bonusActive = false;

  if (daysSinceActivity >= 7) {
    messages = WELCOME_BACK_MESSAGES.long;
    emoji = '🏆';
    bonusActive = true;
  } else if (daysSinceActivity >= 4) {
    messages = WELCOME_BACK_MESSAGES.medium;
    emoji = '🌟';
    bonusActive = true;
  } else {
    messages = WELCOME_BACK_MESSAGES.short;
    emoji = '💛';
  }

  const selected = messages[Math.floor(Math.random() * messages.length)];
  
  return {
    message: selected.message,
    submessage: selected.submessage,
    emoji,
    bonusActive,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Comeback Bonus XP Calculation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate bonus XP for returning after a gap
 * Philosophy: Coming back is harder than continuing — you deserve more credit
 */
export function getComebackBonusXP(baseXP: number, daysSinceActivity: number): {
  totalXP: number;
  bonusXP: number;
  multiplier: number;
  message: string;
} {
  let multiplier = 1.0;
  let message = '';

  if (daysSinceActivity >= 7) {
    multiplier = 2.0;
    message = '2x XP — Comeback Champion! 🏆';
  } else if (daysSinceActivity >= 4) {
    multiplier = 1.5;
    message = '1.5x XP — Welcome back bonus! 🌟';
  } else if (daysSinceActivity >= 2) {
    multiplier = 1.25;
    message = '1.25x XP — You showed up! 💛';
  }

  const bonusXP = Math.round(baseXP * (multiplier - 1));
  const totalXP = Math.round(baseXP * multiplier);

  return {
    totalXP,
    bonusXP,
    multiplier,
    message,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// One Tiny Thing — 60-second tasks to get back in
// ─────────────────────────────────────────────────────────────────────────────

const ONE_TINY_THING_TASKS: OneTinyThingTask[] = [
  // Quick wins — visible, fast
  {
    id: 'tiny-1',
    title: 'Throw away one piece of trash',
    description: 'Just one. Look around and find something that belongs in the bin.',
    emoji: '🗑️',
    estimatedSeconds: 15,
    category: 'quick-win',
  },
  {
    id: 'tiny-2',
    title: 'Put one thing back where it belongs',
    description: 'Just one item. Pick it up, walk it home.',
    emoji: '🏠',
    estimatedSeconds: 30,
    category: 'quick-win',
  },
  {
    id: 'tiny-3',
    title: 'Clear one surface corner',
    description: 'Pick any surface. Clear one corner of it. Done.',
    emoji: '✨',
    estimatedSeconds: 45,
    category: 'visible-impact',
  },
  {
    id: 'tiny-4',
    title: 'Collect empty cups/glasses',
    description: 'Just gather them. Getting them to the sink is a bonus.',
    emoji: '🥤',
    estimatedSeconds: 30,
    category: 'quick-win',
  },
  {
    id: 'tiny-5',
    title: 'Straighten one pile',
    description: 'Papers, books, clothes — just make one pile look intentional.',
    emoji: '📚',
    estimatedSeconds: 20,
    category: 'visible-impact',
  },
  // Mindless tasks — no decisions
  {
    id: 'tiny-6',
    title: 'Wipe one surface for 20 seconds',
    description: 'Grab a cloth or paper towel. Just 20 seconds of wiping.',
    emoji: '🧽',
    estimatedSeconds: 25,
    category: 'mindless',
  },
  {
    id: 'tiny-7',
    title: 'Fluff two pillows',
    description: 'Find two pillows. Fluff them. Look at that cozy vibe.',
    emoji: '🛋️',
    estimatedSeconds: 15,
    category: 'mindless',
  },
  {
    id: 'tiny-8',
    title: 'Close one drawer or cabinet',
    description: 'Find one that\'s open or wonky. Close it properly.',
    emoji: '🚪',
    estimatedSeconds: 10,
    category: 'mindless',
  },
  // Visible impact
  {
    id: 'tiny-9',
    title: 'Make some empty space',
    description: 'On any surface, create a fist-sized clear area.',
    emoji: '👊',
    estimatedSeconds: 30,
    category: 'visible-impact',
  },
  {
    id: 'tiny-10',
    title: 'Take a photo of "the spot"',
    description: 'Document that one area bugging you. Just the photo for now.',
    emoji: '📸',
    estimatedSeconds: 15,
    category: 'quick-win',
  },
];

/**
 * Get a random "One Tiny Thing" task
 * These are 60-second-or-less tasks designed as low-friction re-entry
 */
export function getOneTinyThingTask(): OneTinyThingTask {
  return ONE_TINY_THING_TASKS[Math.floor(Math.random() * ONE_TINY_THING_TASKS.length)];
}

/**
 * Get multiple tiny tasks, optionally filtered by category
 */
export function getOneTinyThingOptions(
  count: number = 3,
  preferCategory?: 'quick-win' | 'mindless' | 'visible-impact'
): OneTinyThingTask[] {
  let pool = [...ONE_TINY_THING_TASKS];
  
  if (preferCategory) {
    // Prioritize preferred category but include others
    const preferred = pool.filter(t => t.category === preferCategory);
    const others = pool.filter(t => t.category !== preferCategory);
    pool = [...preferred, ...others];
  }

  // Shuffle using Fisher-Yates
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, count);
}

// ─────────────────────────────────────────────────────────────────────────────
// Should Show Comeback Flow
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determine if the comeback welcome flow should be shown
 */
export function shouldShowComebackFlow(stats: ComebackStatus | null): boolean {
  if (!stats) return false;
  
  // Show comeback flow if:
  // 1. User has been away 2+ days
  // 2. We haven't already shown it today (tracked by isReturning flag)
  return stats.isReturning && stats.daysSinceActivity >= 2;
}

/**
 * Get the primary stats display (cumulative-first)
 * Philosophy: "47 cleaning sessions total" > "Day 3 streak"
 */
export function getPrimaryStatsDisplay(totalSessions: number): string {
  if (totalSessions === 0) return "Ready to start!";
  if (totalSessions === 1) return "1 cleaning session total!";
  return `${totalSessions} cleaning sessions total!`;
}

/**
 * Get secondary stats display (streak, smaller emphasis)
 */
export function getSecondaryStatsDisplay(
  currentStreak: number,
  isStreakActive: boolean
): string | null {
  if (!isStreakActive || currentStreak === 0) return null;
  if (currentStreak === 1) return "1-day tidy streak";
  return `${currentStreak}-day tidy streak`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Grace Period Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get human-readable time until grace period expires
 */
export function getGracePeriodTimeRemaining(gracePeriodEndsAt: string | null): string | null {
  if (!gracePeriodEndsAt) return null;

  const endTime = new Date(gracePeriodEndsAt);
  const now = new Date();
  const diffMs = endTime.getTime() - now.getTime();

  if (diffMs <= 0) return null;

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  return `${minutes}m remaining`;
}

/**
 * Format grace period for display
 */
export function formatGracePeriodBadge(gracePeriodEndsAt: string | null): {
  text: string;
  emoji: string;
} | null {
  const remaining = getGracePeriodTimeRemaining(gracePeriodEndsAt);
  if (!remaining) return null;

  return {
    text: `48hr safe zone • ${remaining}`,
    emoji: '🛡️',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification Messages — NEVER guilt-trip
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get shame-free notification messages
 * GOOD: Encouraging, low-pressure
 * BAD (NEVER): "You haven't cleaned in X days", "Your room is getting messy"
 */
export function getComebackNotificationMessage(): { title: string; body: string } {
  const messages = [
    {
      title: "Good morning! ☀️",
      body: "Dusty's ready when you are. Even 60 seconds counts.",
    },
    {
      title: "Hey stranger 💛",
      body: "No judgment here. Wanna do one tiny thing?",
    },
    {
      title: "Quick check-in 🌟",
      body: "Your space is waiting. No pressure, just possibilities.",
    },
    {
      title: "Psst! 🤫",
      body: "One small task = one big win for your brain.",
    },
    {
      title: "You've got this 💪",
      body: "Even opening the app counts as a step forward.",
    },
    {
      title: "Gentle nudge 🌱",
      body: "Your future self will thank you for 60 seconds now.",
    },
  ];

  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Get daily reminder message (never guilt-inducing)
 */
export function getDailyReminderMessage(): { title: string; body: string } {
  const messages = [
    {
      title: "Time for a tiny win! ✨",
      body: "60 seconds of tidying = a clearer mind.",
    },
    {
      title: "Good morning! ☀️",
      body: "Your space is ready when you are.",
    },
    {
      title: "Quick tidy time? 🌟",
      body: "Even one task makes a difference.",
    },
    {
      title: "Dusty says hi! 🧹",
      body: "Ready for a quick declutter session?",
    },
  ];

  return messages[Math.floor(Math.random() * messages.length)];
}

// ─────────────────────────────────────────────────────────────────────────────
// Convert Real Tasks to "One Tiny Thing" Options
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Filter real tasks to find quick re-entry options
 * Returns tasks under 2 minutes (ideally under 60 seconds)
 */
export function findTinyTasksFromRooms(
  tasks: CleaningTask[]
): CleaningTask[] {
  return tasks
    .filter(task => !task.completed)
    .filter(task => task.estimatedMinutes <= 2)
    .filter(task => task.difficulty === 'quick' || task.energyRequired === 'minimal' || task.energyRequired === 'low')
    .sort((a, b) => {
      // Prioritize: low decision load, high visual impact, short time
      const aScore = 
        (a.decisionLoad === 'none' || a.decisionLoad === 'low' ? 0 : 1) +
        (a.visualImpact === 'high' ? 0 : 1) +
        a.estimatedMinutes;
      const bScore =
        (b.decisionLoad === 'none' || b.decisionLoad === 'low' ? 0 : 1) +
        (b.visualImpact === 'high' ? 0 : 1) +
        b.estimatedMinutes;
      return aScore - bScore;
    })
    .slice(0, 3);
}
