import { convex } from '@/config/convex';
import { api } from '@/convex/_generated/api';
import { AIAnalysisResult, CleaningTask, EnergyLevel, PhotoQuality, PhotoQualityFeedback, ProgressAnalysisResult } from '@/types/declutter';
import {
    getGeminiApiKey,
    setGeminiApiKey,
} from './gemini';
import {
    analyzeProgressWithZai,
    analyzeRoomImageWithZai,
    detectObjectsInRoom,
    getMotivationWithZai,
    getZaiApiKey,
    isZaiApiKeyConfigured,
    setZaiApiKey,
    setZaiCodingPlan,
    setZaiFreeTier,
} from './zai';

export type AIProvider = 'gemini' | 'zai';

const ENV_PROVIDER = (process.env.EXPO_PUBLIC_AI_PROVIDER as AIProvider) || 'gemini';
const ENV_ZAI_FREE = process.env.EXPO_PUBLIC_ZAI_FREE_TIER === 'true';
const ENV_ZAI_CODING_PLAN = process.env.EXPO_PUBLIC_ZAI_CODING_PLAN === 'true';

let currentProvider: AIProvider = ENV_PROVIDER;

export function setAIProvider(provider: AIProvider) {
  currentProvider = provider;
}

export function getAIProvider(): AIProvider {
  return currentProvider;
}

export function isCurrentProviderConfigured(): boolean {
  if (currentProvider === 'zai') {
    return isZaiApiKeyConfigured();
  }
  return true;
}

export function setApiKey(key: string, provider?: AIProvider) {
  const target = provider || currentProvider;
  if (target === 'zai') {
    setZaiApiKey(key);
  } else {
    setGeminiApiKey(key);
  }
}

export function getApiKey(provider?: AIProvider): string {
  const target = provider || currentProvider;
  if (target === 'zai') {
    return getZaiApiKey();
  }
  return getGeminiApiKey();
}

export function setFreeTier(enabled: boolean) {
  setZaiFreeTier(enabled);
}

export function setCodingPlan(enabled: boolean) {
  setZaiCodingPlan(enabled);
}

export async function analyzeRoomImage(
  base64Image: string,
  additionalContext?: string
): Promise<AIAnalysisResult> {
  if (currentProvider === 'zai') {
    setZaiFreeTier(ENV_ZAI_FREE);
    setZaiCodingPlan(ENV_ZAI_CODING_PLAN);
    return analyzeRoomImageWithZai(base64Image, additionalContext);
  }
  return convex.action(api.gemini.analyzeRoom, {
    base64Image,
    additionalContext,
  });
}

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
  if (currentProvider === 'zai') {
    setZaiFreeTier(ENV_ZAI_FREE);
    setZaiCodingPlan(ENV_ZAI_CODING_PLAN);
    return analyzeProgressWithZai(beforeImage, afterImage);
  }
  return convex.action(api.gemini.analyzeProgress, {
    beforeImage,
    afterImage,
  });
}

export interface MotivationResponse {
  message: string;
  emoji: string;
  tone: string;
  suggestedAction?: string;
  celebratesReturn?: boolean;
}

export async function getMotivation(context: string): Promise<MotivationResponse> {
  if (currentProvider === 'zai') {
    setZaiFreeTier(ENV_ZAI_FREE);
    setZaiCodingPlan(ENV_ZAI_CODING_PLAN);
    const message = await getMotivationWithZai(context);
    return { message, emoji: "🐰", tone: "supportive" };
  }
  const result = await convex.action(api.gemini.getMotivation, {
    context,
  });
  return result as MotivationResponse;
}

/**
 * Simple motivation message getter (returns just the string)
 * For backward compatibility with existing code
 */
export async function getMotivationMessage(context: string): Promise<string> {
  const response = await getMotivation(context);
  return response.message;
}

export { detectObjectsInRoom };

// =====================
// PHASE SYSTEM: Filter tasks by time + energy
// =====================

/**
 * Filters tasks based on available time and energy level.
 * - Time: only returns tasks whose estimatedMinutes fit within the budget
 * - Energy: filters by energyRequired based on user's current energy
 *   - 'exhausted': only zero-decision, minimal-energy tasks
 *   - 'low': exclude challenging tasks and high-energy tasks
 *   - 'moderate': all except high-energy tasks
 *   - 'high': everything
 */
export function getFilteredTasks(
  tasks: CleaningTask[],
  timeMinutes: number,
  energyLevel: EnergyLevel
): CleaningTask[] {
  // Define which energy levels are allowed at each user energy state
  const energyAllowMap: Record<EnergyLevel, EnergyLevel[]> = {
    minimal: ['minimal'], // "exhausted" maps to minimal
    low: ['minimal', 'low'],
    moderate: ['minimal', 'low', 'moderate'],
    high: ['minimal', 'low', 'moderate', 'high'],
  };

  // Map the user-facing energy level name to filter key
  const allowedEnergies = energyAllowMap[energyLevel] || ['minimal', 'low', 'moderate', 'high'];

  // For exhausted users, also filter out tasks with decision load
  const isExhausted = energyLevel === 'minimal';

  // Filter by energy first
  let filtered = tasks.filter((task) => {
    const taskEnergy = task.energyRequired || 'low';
    if (!allowedEnergies.includes(taskEnergy)) return false;

    // For exhausted users, exclude tasks with decision-making
    if (isExhausted && task.decisionLoad && task.decisionLoad !== 'none') {
      return false;
    }

    // For low energy, exclude challenging tasks
    if (energyLevel === 'low' && task.difficulty === 'challenging') {
      return false;
    }

    return true;
  });

  // Sort by visual impact (high first for dopamine wins)
  const impactOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  filtered.sort((a, b) => {
    const aImpact = impactOrder[a.visualImpact || 'medium'] ?? 1;
    const bImpact = impactOrder[b.visualImpact || 'medium'] ?? 1;
    return aImpact - bImpact;
  });

  // Fit within time budget
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

/**
 * Returns user-friendly guidance based on photo quality assessment.
 * Helps users take better photos for more accurate AI analysis.
 */
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

  // Coverage check - use string comparison since coverage is 'full' | 'partial' | 'limited'
  const coverageScore = photoQuality.coverage === 'full' ? 1.0 : photoQuality.coverage === 'partial' ? 0.5 : 0.25;
  if (coverageScore < 0.5) {
    suggestions.push('Try to get more of the room in the frame. Step back or use a wider angle.');
    isAcceptable = false;
  }

  // Clarity check
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

  return {
    isAcceptable,
    suggestions,
    overallMessage,
  };
}

// =====================
// BEFORE/AFTER PROGRESS (structured result)
// =====================

/**
 * Analyzes progress between before and after photos and returns a structured result.
 * Wraps the existing analyzeProgress to provide the ProgressAnalysisResult shape.
 */
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

export function getProviderInfo(provider?: AIProvider): {
  name: string;
  model: string;
  features: string[];
} {
  const target = provider || currentProvider;
  
  if (target === 'zai') {
    return {
      name: 'Z.AI',
      model: ENV_ZAI_FREE ? 'GLM-4.6V-Flash (Free)' : 'GLM-4.6V',
      features: [
        'Object detection with bounding boxes',
        'Thinking mode for reasoning',
        '128K context window',
        'Native multimodal tool calling',
      ],
    };
  }
  
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
