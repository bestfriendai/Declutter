/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accountability from "../accountability.js";
import type * as activityLog from "../activityLog.js";
import type * as auth from "../auth.js";
import type * as badges from "../badges.js";
import type * as collection from "../collection.js";
import type * as crons from "../crons.js";
import type * as gemini from "../gemini.js";
import type * as http from "../http.js";
import type * as leaderboard from "../leaderboard.js";
import type * as mascots from "../mascots.js";
import type * as notifications from "../notifications.js";
import type * as photos from "../photos.js";
import type * as rooms from "../rooms.js";
import type * as settings from "../settings.js";
import type * as shared from "../shared.js";
import type * as social from "../social.js";
import type * as stats from "../stats.js";
import type * as subtasks from "../subtasks.js";
import type * as sync from "../sync.js";
import type * as tasks from "../tasks.js";
import type * as users from "../users.js";
import type * as variableRewards from "../variableRewards.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accountability: typeof accountability;
  activityLog: typeof activityLog;
  auth: typeof auth;
  badges: typeof badges;
  collection: typeof collection;
  crons: typeof crons;
  gemini: typeof gemini;
  http: typeof http;
  leaderboard: typeof leaderboard;
  mascots: typeof mascots;
  notifications: typeof notifications;
  photos: typeof photos;
  rooms: typeof rooms;
  settings: typeof settings;
  shared: typeof shared;
  social: typeof social;
  stats: typeof stats;
  subtasks: typeof subtasks;
  sync: typeof sync;
  tasks: typeof tasks;
  users: typeof users;
  variableRewards: typeof variableRewards;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
