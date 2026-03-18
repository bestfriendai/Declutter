import { convex } from '@/config/convex';
import { api } from '@/convex/_generated/api';
import { FALLBACK_MOTIVATIONS } from '@/constants/copy';
import { Time } from '@/constants/time';
import {
  AIAnalysisError,
  AIMotivationError,
  AIProgressError,
  toError,
} from '@/services/errors';
import { logger } from '@/services/logger';
import { AIAnalysisResult, CleaningTask, EnergyLevel, PhotoQuality, PhotoQualityFeedback, ProgressAnalysisResult } from '@/types/declutter';
import { retryWithTimeout, isNetworkError, isServerError } from '@/utils/retry';
import { sanitizeAiContext } from '@/utils/sanitize';

/** Timeout for AI analysis calls (30s) — generous for image analysis */
const AI_ANALYSIS_TIMEOUT_MS = Time.AI_ANALYSIS_TIMEOUT_MS;
/** Timeout for lightweight AI calls like motivation (10s) */
const AI_LIGHT_TIMEOUT_MS = Time.AI_LIGHT_TIMEOUT_MS;

type RetryableError = Error & { status?: number; statusCode?: number };

function isRetryableAiError(error: unknown): boolean {
  const resolvedError = toError(error);
  return isNetworkError(resolvedError) || isServerError(resolvedError as RetryableError);
}

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
  const sanitizedContext = sanitizeAiContext(additionalContext);

  try {
    return await retryWithTimeout(
      async () => {
        return convex.action(api.gemini.analyzeRoom, {
          base64Image,
          additionalContext: sanitizedContext,
        });
      },
      AI_ANALYSIS_TIMEOUT_MS,
      {
        maxAttempts: 2,
        initialDelayMs: 2000,
        isRetryable: isRetryableAiError,
        onRetry: (attempt, error) => {
          logger.warn(`AI analysis retry ${attempt}: ${error.message}`);
        },
      }
    );
  } catch (error) {
    const resolvedError = toError(error);
    logger.error(
      'AI analysis failed after retries:',
      new AIAnalysisError(resolvedError.message, {
        retryable: isRetryableAiError(resolvedError),
        cause: error,
      })
    );
    return getFallbackAnalysis(sanitizedContext);
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
        isRetryable: isRetryableAiError,
        onRetry: (attempt, error) => {
          logger.warn(`Progress analysis retry ${attempt}: ${error.message}`);
        },
      }
    );
  } catch (error) {
    const resolvedError = toError(error);
    logger.error(
      'Progress analysis failed after retries:',
      new AIProgressError(resolvedError.message, {
        retryable: isRetryableAiError(resolvedError),
        cause: error,
      })
    );
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
  const sanitizedContext = sanitizeAiContext(context);

  try {
    return await retryWithTimeout(
      async () => {
        const result = await convex.action(api.gemini.getMotivation, {
          context: sanitizedContext ?? '',
        });
        return result as MotivationResponse;
      },
      AI_LIGHT_TIMEOUT_MS,
      {
        maxAttempts: 2,
        initialDelayMs: 1000,
        isRetryable: isRetryableAiError,
      }
    );
  } catch (error) {
    const resolvedError = toError(error);
    logger.warn(
      'Falling back to local motivation:',
      new AIMotivationError(resolvedError.message, {
        retryable: isRetryableAiError(resolvedError),
        cause: error,
      })
    );
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
    messLevel: 50,
    estimatedTotalTime: 10,
    summary: 'Quick starter tasks to get you moving',
    quickWins: ['Pick up visible trash', 'Clear one surface'],
    encouragement: "We couldn't analyze the photo right now, but here are some quick wins to get started!",
    photoQuality: { lighting: 'good', coverage: 'full', clarity: 'clear', confidence: 0.5 },
  };
}
