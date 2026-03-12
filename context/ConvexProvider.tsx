/**
 * Convex Provider
 * Wraps the app with ConvexProvider and ConvexAuthProvider
 */

import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ReactNode } from "react";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL!;

// Create single client instance
const convexClient = new ConvexReactClient(convexUrl);

// AsyncStorage adapter for Convex Auth (localStorage not available in RN)
const storage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthProvider client={convexClient} storage={storage}>
      {children}
    </ConvexAuthProvider>
  );
}

// Re-export the client for direct use
export { convexClient };
