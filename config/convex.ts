/**
 * Convex Client Configuration
 * Sets up the Convex client for use throughout the app
 */

import { ConvexReactClient } from "convex/react";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error(
    "Missing EXPO_PUBLIC_CONVEX_URL environment variable. " +
    "Check your .env.local file."
  );
}

export const convex = new ConvexReactClient(convexUrl);
