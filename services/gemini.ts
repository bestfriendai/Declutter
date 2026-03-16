/**
 * Declutterly - Gemini AI Service
 * Client-side stubs only. All real AI calls go through Convex actions
 * (services/ai.ts → convex.action(api.gemini.*)) where the key stays server-side.
 */

import { AIAnalysisResult } from '@/types/declutter';

// NOTE: The Gemini API key is managed server-side in Convex env vars.
// DO NOT add EXPO_PUBLIC_GEMINI_API_KEY — it would expose the key in the client bundle.

/** @deprecated — key is server-side only; this is a no-op kept for compatibility */
export function setGeminiApiKey(_key: string) {
  // intentionally empty — key lives in Convex env, not the client
}

/** @deprecated — key is server-side only; always returns empty string */
export function getGeminiApiKey(): string {
  return '';
}

/** Always returns true — Convex action handles auth; fails with a clear error if unconfigured */
export function isApiKeyConfigured(): boolean {
  return true;
}

// Main analysis function
// SECURITY: Client-side direct API calls are disabled. All AI calls go through
// the Convex action (services/ai.ts → convex.action(api.gemini.analyzeRoom))
// where the API key stays on the server and never reaches the client bundle.
export async function analyzeRoomImage(
  _base64Image: string,
  _additionalContext?: string
): Promise<AIAnalysisResult> {
  throw new Error(
    'Direct client-side Gemini calls are disabled for security. Use services/ai.ts instead.'
  );
}

// Analyze progress between two photos
// SECURITY: Client-side direct API calls are disabled. Use services/ai.ts instead.
export async function analyzeProgress(
  _beforeImage: string,
  _afterImage: string
): Promise<{
  progressPercentage: number;
  percentImproved: number;
  completedTasks: string[];
  areasImproved: string[];
  remainingTasks: string[];
  areasRemaining: string[];
  encouragement: string;
  encouragingMessage: string;
}> {
  throw new Error(
    'Direct client-side Gemini calls are disabled for security. Use services/ai.ts instead.'
  );
}

// Get a motivational message
// Client-side: returns local fallback only. Real AI motivation uses
// convex.action(api.gemini.getMotivation) via services/ai.ts.
export async function getMotivation(_context: string): Promise<string> {
  return getRandomMotivation();
}

function getRandomMotivation(): string {
  const messages = [
    "You don't have to do everything today. Just start with one small thing.",
    "Progress over perfection. Every item you put away is a win!",
    "Your future self will thank you for whatever you do right now.",
    "It's okay if it's not perfect. Done is better than perfect.",
    "You're stronger than the mess. Let's tackle this together!",
    "Remember: you don't have to feel motivated to start. Motivation often comes after starting.",
    "10 minutes is better than 0 minutes. What can you do in just 10 minutes?",
    "The hardest part is starting. You've already done that by being here!",
    "Celebrate every small win. You're making progress!",
    "Your space doesn't define you, but improving it can help you feel better.",
    "One drawer. One shelf. One corner. That's all you need right now.",
    "ADHD brains love novelty — try a room you haven't touched yet!",
    "You're not behind. You're exactly where you need to be.",
    "Cleaning isn't about willpower. It's about making the next step tiny enough to start.",
    "What if you just stood up and moved one thing? Just one.",
    "Your environment shapes your focus. Even a small improvement helps your brain.",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}
