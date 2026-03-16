import { convex } from '@/config/convex';
import { api } from '@/convex/_generated/api';
import { AIAnalysisResult, CleaningTask, EnergyLevel, PhotoQuality, PhotoQualityFeedback, ProgressAnalysisResult } from '@/types/declutter';
import { retryWithTimeout, isNetworkError, isServerError } from '@/utils/retry';

/** Timeout for AI analysis calls (30s) — generous for image analysis */
const AI_ANALYSIS_TIMEOUT_MS = 30_000;
/** Timeout for lightweight AI calls like motivation (10s) */
const AI_LIGHT_TIMEOUT_MS = 10_000;

// =====================
// AI PROVIDER: Gemini via Convex server actions (API key stays server-side)
// =====================

export function getProviderInfo(): {
  name: string;
  model: string;
  features: string[];
} {
  return {
    name: 'Google',
    model: 'Gemini 2.5 Flash',
    features: [
      'Fast multimodal analysis',
      'ADHD-friendly task breakdown',
      'Progress comparison',
    ],
  };
}

// =====================
// ROOM IMAGE ANALYSIS
// =====================

export async function analyzeRoomImage(
  base64Image: string,
  additionalContext?: string
): Promise<AIAnalysisResult> {
  try {
    return await retryWithTimeout(
      async () => {
        return convex.action(api.gemini.analyzeRoom, {
          base64Image,
          additionalContext,
        });
      },
      AI_ANALYSIS_TIMEOUT_MS,
      {
        maxAttempts: 2,
        initialDelayMs: 2000,
        isRetryable: (error) => isNetworkError(error) || isServerError(error as any),
        onRetry: (attempt, error) => {
          if (__DEV__) console.log(`AI analysis retry ${attempt}: ${error.message}`);
        },
      }
    );
  } catch (error) {
    if (__DEV__) console.error('AI analysis failed after retries:', error);
    return getFallbackAnalysis(additionalContext);
  }
}

// =====================
// PROGRESS ANALYSIS
// =====================

export async function analyzeProgress(
  beforeImage: string,
  afterImage: string
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
  try {
    return await retryWithTimeout(
      async () => {
        return convex.action(api.gemini.analyzeProgress, {
          beforeImage,
          afterImage,
        });
      },
      AI_ANALYSIS_TIMEOUT_MS,
      {
        maxAttempts: 2,
        initialDelayMs: 2000,
        isRetryable: (error) => isNetworkError(error) || isServerError(error as any),
        onRetry: (attempt, error) => {
          if (__DEV__) console.log(`Progress analysis retry ${attempt}: ${error.message}`);
        },
      }
    );
  } catch (error) {
    if (__DEV__) console.error('Progress analysis failed after retries:', error);
    return {
      progressPercentage: 0,
      percentImproved: 0,
      completedTasks: [],
      areasImproved: [],
      remainingTasks: ['Unable to analyze right now — try again in a moment'],
      areasRemaining: [],
      encouragement: "We couldn't analyze the photo, but you're clearly making progress. Keep going!",
      encouragingMessage: "We couldn't analyze the photo, but you're clearly making progress. Keep going!",
    };
  }
}

// =====================
// MOTIVATION
// =====================

export interface MotivationResponse {
  message: string;
  emoji: string;
  tone: string;
  suggestedAction?: string;
  celebratesReturn?: boolean;
}

export async function getMotivation(context: string): Promise<MotivationResponse> {
  try {
    return await retryWithTimeout(
      async () => {
        const result = await convex.action(api.gemini.getMotivation, {
          context,
        });
        return result as MotivationResponse;
      },
      AI_LIGHT_TIMEOUT_MS,
      {
        maxAttempts: 2,
        initialDelayMs: 1000,
        isRetryable: (error) => isNetworkError(error) || isServerError(error as any),
      }
    );
  } catch {
    return getLocalMotivationFallback();
  }
}

/**
 * Simple motivation message getter (returns just the string)
 */
export async function getMotivationMessage(context: string): Promise<string> {
  const response = await getMotivation(context);
  return response.message;
}

// =====================
// PHASE SYSTEM: Filter tasks by time + energy
// =====================

/**
 * Filters tasks based on available time and energy level.
 */
export function getFilteredTasks(
  tasks: CleaningTask[],
  timeMinutes: number,
  energyLevel: EnergyLevel
): CleaningTask[] {
  const energyAllowMap: Record<EnergyLevel, EnergyLevel[]> = {
    minimal: ['minimal'],
    low: ['minimal', 'low'],
    moderate: ['minimal', 'low', 'moderate'],
    high: ['minimal', 'low', 'moderate', 'high'],
  };

  const allowedEnergies = energyAllowMap[energyLevel] || ['minimal', 'low', 'moderate', 'high'];
  const isExhausted = energyLevel === 'minimal';

  let filtered = tasks.filter((task) => {
    const taskEnergy = task.energyRequired || 'low';
    if (!allowedEnergies.includes(taskEnergy)) return false;
    if (isExhausted && task.decisionLoad && task.decisionLoad !== 'none') return false;
    if (energyLevel === 'low' && task.difficulty === 'challenging') return false;
    return true;
  });

  const impactOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  filtered.sort((a, b) => {
    const aImpact = impactOrder[a.visualImpact || 'medium'] ?? 1;
    const bImpact = impactOrder[b.visualImpact || 'medium'] ?? 1;
    return aImpact - bImpact;
  });

  const result: CleaningTask[] = [];
  let remainingTime = timeMinutes;

  for (const task of filtered) {
    if (task.estimatedMinutes <= remainingTime) {
      result.push(task);
      remainingTime -= task.estimatedMinutes;
    }
    if (remainingTime <= 0) break;
  }

  return result;
}

// =====================
// PHOTO QUALITY FEEDBACK
// =====================

export function getPhotoQualityFeedback(photoQuality: PhotoQuality): PhotoQualityFeedback {
  const suggestions: string[] = [];
  let isAcceptable = true;

  if (photoQuality.lighting === 'dim') {
    suggestions.push('Try turning on more lights or using flash for a brighter photo.');
    isAcceptable = photoQuality.confidence >= 0.5;
  }

  if (photoQuality.lighting === 'overexposed') {
    suggestions.push('The photo is too bright. Try moving away from direct light or turning off flash.');
    isAcceptable = photoQuality.confidence >= 0.5;
  }

  const coverageScore = photoQuality.coverage === 'full' ? 1.0 : photoQuality.coverage === 'partial' ? 0.5 : 0.25;
  if (coverageScore < 0.5) {
    suggestions.push('Try to get more of the room in the frame. Step back or use a wider angle.');
    isAcceptable = false;
  }

  const clarityScore = photoQuality.clarity === 'clear' ? 1.0 : photoQuality.clarity === 'mixed' ? 0.6 : 0.3;
  if (clarityScore < 0.5) {
    suggestions.push('Hold your phone steady for a clearer photo. Try bracing against a surface.');
    isAcceptable = false;
  }

  if (photoQuality.confidence < 0.6) {
    suggestions.push('Consider retaking from a different angle for better results.');
    isAcceptable = false;
  }

  let overallMessage: string;
  if (suggestions.length === 0) {
    overallMessage = 'Great photo! We can clearly see the room and provide accurate suggestions.';
  } else if (isAcceptable) {
    overallMessage = 'Photo is usable, but could be improved for better results.';
  } else {
    overallMessage = 'We can still work with this, but a better photo would give you more accurate tasks.';
  }

  return { isAcceptable, suggestions, overallMessage };
}

// =====================
// BEFORE/AFTER PROGRESS (structured result)
// =====================

export async function analyzeProgressStructured(
  beforeImage: string,
  afterImage: string
): Promise<ProgressAnalysisResult> {
  const result = await analyzeProgress(beforeImage, afterImage);
  return {
    percentImproved: result.percentImproved,
    areasImproved: result.areasImproved,
    areasRemaining: result.areasRemaining,
    encouragingMessage: result.encouragingMessage,
  };
}

// =====================
// FALLBACKS — used when AI is unavailable so the app stays usable
// =====================

const FALLBACK_MOTIVATIONS: MotivationResponse[] = [
  { message: "You don't have to do everything today. Just start with one small thing.", emoji: "💛", tone: "supportive" },
  { message: "Progress over perfection. Every item you put away is a win!", emoji: "🌟", tone: "cheerful" },
  { message: "Your future self will thank you for whatever you do right now.", emoji: "💪", tone: "encouraging" },
  { message: "It's okay if it's not perfect. Done is better than perfect.", emoji: "✨", tone: "calm" },
  { message: "10 minutes is better than 0 minutes. What can you do in just 10 minutes?", emoji: "⏰", tone: "supportive" },
  { message: "The hardest part is starting. You've already done that by being here!", emoji: "🎉", tone: "cheerful" },
  { message: "Celebrate every small win. You're making progress!", emoji: "🏆", tone: "cheerful" },
  { message: "Remember: you don't have to feel motivated to start. Motivation often follows action.", emoji: "🧠", tone: "calm" },
];

function getLocalMotivationFallback(): MotivationResponse {
  return FALLBACK_MOTIVATIONS[Math.floor(Math.random() * FALLBACK_MOTIVATIONS.length)];
}

function getFallbackAnalysis(_context?: string): AIAnalysisResult {
  return {
    tasks: [
      {
        id: 'fallback-1',
        title: 'Pick up any visible trash',
        description: 'Grab anything that is obviously garbage and toss it.',
        estimatedMinutes: 2,
        difficulty: 'quick',
        category: 'trash_removal',
        priority: 'high',
        visualImpact: 'high',
        completed: false,
      },
      {
        id: 'fallback-2',
        title: 'Clear one surface',
        description: 'Pick any flat surface and move everything off it to a temporary pile.',
        estimatedMinutes: 3,
        difficulty: 'quick',
        category: 'surface_clearing',
        priority: 'high',
        visualImpact: 'high',
        completed: false,
      },
      {
        id: 'fallback-3',
        title: 'Put 5 things where they belong',
        description: 'Just 5 items. Walk each one home.',
        estimatedMinutes: 5,
        difficulty: 'quick',
        category: 'organization',
        priority: 'medium',
        visualImpact: 'medium',
        completed: false,
      },
    ] as CleaningTask[],
    roomType: 'other',
    messLevel: 'moderate' as any,
    estimatedTotalTime: 10,
    summary: 'Quick starter tasks to get you moving',
    quickWins: ['Pick up visible trash', 'Clear one surface'],
    encouragement: "We couldn't analyze the photo right now, but here are some quick wins to get started!",
    photoQuality: { lighting: 'good', coverage: 'full', clarity: 'clear', confidence: 0.5 },
  };
}
