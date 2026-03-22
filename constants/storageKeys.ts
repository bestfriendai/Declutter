/**
 * Centralized AsyncStorage key registry for the entire app.
 * Every AsyncStorage key MUST be defined here to prevent collisions
 * and enable easy auditing.
 *
 * Naming convention: @declutterly_<feature>_<purpose>
 */

export const STORAGE_KEYS = {
  // ── Core State (DeclutterContext) ──────────────────────────────────────────
  ROOMS: '@declutterly_rooms',
  STATS: '@declutterly_stats',
  SETTINGS: '@declutterly_settings',
  API_KEY: '@declutterly_api_key', // Legacy — migrated to server-side
  MASCOT: '@declutterly_mascot',
  COLLECTION: '@declutterly_collection',
  COLLECTION_STATS: '@declutterly_collection_stats',

  // ── Audio / Ambient Sound ─────────────────────────────────────────────────
  AMBIENT_SOUND: '@declutterly_ambient_sound',

  // ── Onboarding ────────────────────────────────────────────────────────────
  ONBOARDING_PROGRESS: '@declutterly_onboarding_progress',
  SEEN_TOOLTIPS: '@declutterly_seen_tooltips',

  // ── Notifications ─────────────────────────────────────────────────────────
  NOTIFICATION_TOKEN: '@declutterly_notification_token',
  DAILY_REMINDER_ID: 'daily-reminder-id',
  STREAK_REMINDER_ID: 'streak-reminder-id',
  GRACE_REMINDER_ID: 'grace-reminder-id',
  OPTIMAL_NOTIFICATION_ID: 'optimal-notification-id',
  COMEBACK_NUDGE_ID: 'comeback-nudge-id',
  SESSION_CELEBRATION_ID: 'session-celebration-id',

  // ── Notification Timing ───────────────────────────────────────────────────
  SESSION_TIMES: '@declutterly_session_times',
  LAST_NOTIFICATION_SENT: '@declutterly_last_notification_sent',
  NOTIFICATION_OPTOUTS: '@declutterly_notification_optouts',

  // ── Task Optimizer ────────────────────────────────────────────────────────
  USER_CLEANING_PROFILE: '@declutterly_user_cleaning_profile',
  TASK_HISTORY: '@declutterly_task_history',

  // ── Mascot Adventure ──────────────────────────────────────────────────────
  ADVENTURE_END: '@declutterly_adventure_end',

  // ── Analysis / Guest Mode ─────────────────────────────────────────────────
  GUEST_SCAN_COUNT: '@declutterly_guest_scan_count',

  // ── Wardrobe / Accessories ────────────────────────────────────────────────
  EQUIPPED_ACCESSORIES: '@declutterly_equipped_accessories',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
