/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as badges from "../badges.js";
import type * as collection from "../collection.js";
import type * as gemini from "../gemini.js";
import type * as http from "../http.js";
import type * as mascots from "../mascots.js";
import type * as photos from "../photos.js";
import type * as rooms from "../rooms.js";
import type * as settings from "../settings.js";
import type * as social from "../social.js";
import type * as stats from "../stats.js";
import type * as subtasks from "../subtasks.js";
import type * as tasks from "../tasks.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  badges: typeof badges;
  collection: typeof collection;
  gemini: typeof gemini;
  http: typeof http;
  mascots: typeof mascots;
  photos: typeof photos;
  rooms: typeof rooms;
  settings: typeof settings;
  social: typeof social;
  stats: typeof stats;
  subtasks: typeof subtasks;
  tasks: typeof tasks;
  users: typeof users;
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
