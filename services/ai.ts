import { convex } from '@/config/convex';
import { FALLBACK_MOTIVATIONS } from '@/constants/copy';
import { Time } from '@/constants/time';
import { api } from '@/convex/_generated/api';
import {
    AIAnalysisError,
    AIMotivationError,
    AIProgressError,
    toError,
} from '@/services/errors';
import { logger } from '@/services/logger';
import { AIAnalysisResult, CleaningTask, EnergyLevel, PhotoQuality, PhotoQualityFeedback, ProgressAnalysisResult, RoomType } from '@/types/declutter';
import { isNetworkError, isServerError, retryWithTimeout } from '@/utils/retry';
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
    model: 'Gemini 2.5 Flash Lite',
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
  additionalContext?: string,
  energyLevel?: string,
  timeAvailable?: number,
  focusArea?: string,
  userProfile?: { taskHistory: string; preferences: string; energyPatterns: string; taskBreakdownLevel?: string },
): Promise<AIAnalysisResult & { isFallback?: boolean }> {
  // Build rich context string that includes user profile data for personalization
  let enrichedContext = additionalContext || '';
  if (userProfile) {
    const profileLines: string[] = [];
    if (userProfile.taskHistory) profileLines.push(`Task history: ${userProfile.taskHistory}`);
    if (userProfile.preferences) profileLines.push(`User preferences: ${userProfile.preferences}`);
    if (userProfile.energyPatterns) profileLines.push(`Energy patterns: ${userProfile.energyPatterns}`);
    if (userProfile.taskBreakdownLevel) profileLines.push(`Task breakdown level: ${userProfile.taskBreakdownLevel}`);
    if (profileLines.length > 0) {
      enrichedContext = enrichedContext
        ? `${enrichedContext}\n\nUser cleaning profile (personalize tasks to this user):\n${profileLines.join('\n')}`
        : `User cleaning profile (personalize tasks to this user):\n${profileLines.join('\n')}`;
    }
  }

  const sanitizedContext = sanitizeAiContext(enrichedContext);

  try {
    return await retryWithTimeout(
      async () => {
        return convex.action(api.gemini.analyzeRoom, {
          base64Image,
          additionalContext: sanitizedContext,
          energyLevel: energyLevel as "exhausted" | "low" | "moderate" | "high" | "hyperfocused" | undefined,
          timeAvailable,
          focusArea,
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
    exhausted: ['exhausted'],
    low: ['exhausted', 'low'],
    moderate: ['exhausted', 'low', 'moderate'],
    high: ['exhausted', 'low', 'moderate', 'high'],
    hyperfocused: ['exhausted', 'low', 'moderate', 'high', 'hyperfocused'],
  };

  const allowedEnergies = energyAllowMap[energyLevel] || ['exhausted', 'low', 'moderate', 'high'];
  const isExhausted = energyLevel === 'exhausted';

  let filtered = tasks.filter((task) => {
    // Normalize legacy 'minimal' value to 'exhausted' for backward compatibility
    const rawEnergy = task.energyRequired || 'low';
    const taskEnergy: EnergyLevel = (rawEnergy as string) === 'minimal' ? 'exhausted' : rawEnergy;
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

function getFallbackAnalysis(context?: string): AIAnalysisResult & { isFallback: boolean } {
  // Detect room type from context string (e.g. "Room type: kitchen")
  const roomMatch = context?.match(/Room type:\s*(\w+)/i);
  const roomType = roomMatch?.[1]?.toLowerCase() || 'other';

  const fallbackTaskSets: Record<string, { tasks: CleaningTask[]; quickWins: string[] }> = {
    kitchen: {
      tasks: [
        { id: 'fallback-1', title: 'Wipe down the main counter surface with a paper towel · EST 4 min', description: 'Clear crumbs and spills from the primary counter', estimatedMinutes: 4, difficulty: 'quick', category: 'surface_clearing', priority: 'high', visualImpact: 'high', completed: false, phase: 1, phaseName: 'Operation Floor Rescue', emoji: '🧽' },
        { id: 'fallback-2', title: 'Load dirty dishes from the sink → dishwasher or drying rack · EST 5 min', description: 'Biggest visual impact in the kitchen', estimatedMinutes: 5, difficulty: 'medium', category: 'organization', priority: 'high', visualImpact: 'high', completed: false, phase: 1, phaseName: 'Operation Floor Rescue', emoji: '🍽️' },
        { id: 'fallback-3', title: 'Tie up the trash bag and carry to bin outside · EST 3 min', description: 'Grab the bag, tie it, walk it out', estimatedMinutes: 3, difficulty: 'quick', category: 'trash_removal', priority: 'high', visualImpact: 'high', completed: false, phase: 1, phaseName: 'Operation Floor Rescue', emoji: '🗑️' },
        { id: 'fallback-4', title: 'Wipe down the stovetop surface with cleaning spray · EST 3 min', description: 'Spray, wait 10 seconds, wipe', estimatedMinutes: 3, difficulty: 'quick', category: 'surface_clearing', priority: 'medium', visualImpact: 'medium', completed: false, phase: 2, phaseName: 'Counter Strike', emoji: '✨' },
      ] as CleaningTask[],
      quickWins: ['Wipe counter', 'Take out trash'],
    },
    bedroom: {
      tasks: [
        { id: 'fallback-1', title: 'Grab any visible clothing off the floor near the bed → laundry basket · EST 3 min', description: 'Scoop up everything within arm\'s reach', estimatedMinutes: 3, difficulty: 'quick', category: 'organization', priority: 'high', visualImpact: 'high', completed: false, phase: 1, phaseName: 'Operation Floor Rescue', emoji: '👕' },
        { id: 'fallback-2', title: 'Straighten the sheets and pillows on the bed · EST 2 min', description: 'Pull the duvet up, fluff the pillows — instant room transformation', estimatedMinutes: 2, difficulty: 'quick', category: 'surface_clearing', priority: 'high', visualImpact: 'high', completed: false, phase: 1, phaseName: 'Operation Floor Rescue', emoji: '🛏️' },
        { id: 'fallback-3', title: 'Clear items from the nightstand surface → where they belong · EST 5 min', description: 'Cups to kitchen, books to shelf, trash to bin', estimatedMinutes: 5, difficulty: 'medium', category: 'organization', priority: 'medium', visualImpact: 'medium', completed: false, phase: 2, phaseName: 'Counter Strike', emoji: '📦' },
      ] as CleaningTask[],
      quickWins: ['Floor pickup', 'Make the bed'],
    },
    bathroom: {
      tasks: [
        { id: 'fallback-1', title: 'Wipe the bathroom mirror with a damp cloth · EST 2 min', description: 'Instant sparkle', estimatedMinutes: 2, difficulty: 'quick', category: 'surface_clearing', priority: 'high', visualImpact: 'high', completed: false, phase: 1, phaseName: 'Operation Floor Rescue', emoji: '🪞' },
        { id: 'fallback-2', title: 'Scrub the sink basin with soap and water · EST 3 min', description: 'Quick scrub, rinse, done', estimatedMinutes: 3, difficulty: 'quick', category: 'surface_clearing', priority: 'high', visualImpact: 'high', completed: false, phase: 1, phaseName: 'Operation Floor Rescue', emoji: '🧼' },
        { id: 'fallback-3', title: 'Clear items from the bathroom counter → cabinet or basket · EST 3 min', description: 'Put products back where they go', estimatedMinutes: 3, difficulty: 'quick', category: 'organization', priority: 'medium', visualImpact: 'medium', completed: false, phase: 2, phaseName: 'Counter Strike', emoji: '🧴' },
        { id: 'fallback-4', title: 'Hang up towels neatly on the towel rack · EST 2 min', description: 'Straighten and fold over rack', estimatedMinutes: 2, difficulty: 'quick', category: 'organization', priority: 'medium', visualImpact: 'medium', completed: false, phase: 1, phaseName: 'Operation Floor Rescue', emoji: '🛁' },
      ] as CleaningTask[],
      quickWins: ['Wipe mirror', 'Scrub sink'],
    },
    livingRoom: {
      tasks: [
        { id: 'fallback-1', title: 'Gather remote controls, cups, and plates from the couch area → their spots · EST 3 min', description: 'Collect everything on and around the couch', estimatedMinutes: 3, difficulty: 'quick', category: 'organization', priority: 'high', visualImpact: 'high', completed: false, phase: 1, phaseName: 'Operation Floor Rescue', emoji: '🛋️' },
        { id: 'fallback-2', title: 'Fluff and straighten couch cushions and throw pillows · EST 2 min', description: 'Quick fluff — instant living room glow-up', estimatedMinutes: 2, difficulty: 'quick', category: 'surface_clearing', priority: 'high', visualImpact: 'high', completed: false, phase: 1, phaseName: 'Operation Floor Rescue', emoji: '✨' },
        { id: 'fallback-3', title: 'Clear the coffee table completely → items to where they belong · EST 5 min', description: 'One surface, total reset', estimatedMinutes: 5, difficulty: 'medium', category: 'surface_clearing', priority: 'medium', visualImpact: 'high', completed: false, phase: 2, phaseName: 'Counter Strike', emoji: '🧹' },
      ] as CleaningTask[],
      quickWins: ['Couch area cleanup', 'Fluff cushions'],
    },
    office: {
      tasks: [
        { id: 'fallback-1', title: 'Stack loose papers on the desk into one pile → don\'t sort yet · EST 3 min', description: 'Just gather into a single stack for now', estimatedMinutes: 3, difficulty: 'quick', category: 'organization', priority: 'high', visualImpact: 'high', completed: false, phase: 1, phaseName: 'Operation Floor Rescue', emoji: '📄' },
        { id: 'fallback-2', title: 'Clear cups, plates, and snack wrappers from the desk → kitchen/trash · EST 2 min', description: 'Food items off the workspace', estimatedMinutes: 2, difficulty: 'quick', category: 'trash_removal', priority: 'high', visualImpact: 'high', completed: false, phase: 1, phaseName: 'Operation Floor Rescue', emoji: '🗑️' },
        { id: 'fallback-3', title: 'Gather stray pens, cables, and small items → a desk organizer or drawer · EST 4 min', description: 'Corral the small clutter', estimatedMinutes: 4, difficulty: 'quick', category: 'organization', priority: 'medium', visualImpact: 'medium', completed: false, phase: 2, phaseName: 'Counter Strike', emoji: '🖊️' },
      ] as CleaningTask[],
      quickWins: ['Stack papers', 'Clear food items'],
    },
    closet: {
      tasks: [
        { id: 'fallback-1', title: 'Pick up any clothes that have fallen off hangers → re-hang or basket · EST 3 min', description: 'Floor items first', estimatedMinutes: 3, difficulty: 'quick', category: 'organization', priority: 'high', visualImpact: 'high', completed: false, phase: 1, phaseName: 'Operation Floor Rescue', emoji: '👕' },
        { id: 'fallback-2', title: 'Straighten shoes into a line along the closet floor · EST 2 min', description: 'Pairs together, line them up', estimatedMinutes: 2, difficulty: 'quick', category: 'organization', priority: 'high', visualImpact: 'high', completed: false, phase: 1, phaseName: 'Operation Floor Rescue', emoji: '👟' },
        { id: 'fallback-3', title: 'Fold and stack items on shelves that have toppled over · EST 5 min', description: 'Reset the stacks', estimatedMinutes: 5, difficulty: 'medium', category: 'organization', priority: 'medium', visualImpact: 'medium', completed: false, phase: 2, phaseName: 'Counter Strike', emoji: '📦' },
      ] as CleaningTask[],
      quickWins: ['Re-hang clothes', 'Line up shoes'],
    },
    garage: {
      tasks: [
        { id: 'fallback-1', title: 'Sweep visible debris from the garage floor into a pile · EST 5 min', description: 'One sweep across the main area', estimatedMinutes: 5, difficulty: 'quick', category: 'surface_clearing', priority: 'high', visualImpact: 'high', completed: false, phase: 1, phaseName: 'Operation Floor Rescue', emoji: '🧹' },
        { id: 'fallback-2', title: 'Collect any trash bags, boxes, and recyclables → trash area · EST 4 min', description: 'Visible trash out first', estimatedMinutes: 4, difficulty: 'quick', category: 'trash_removal', priority: 'high', visualImpact: 'high', completed: false, phase: 1, phaseName: 'Operation Floor Rescue', emoji: '🗑️' },
        { id: 'fallback-3', title: 'Group scattered tools back onto the workbench or pegboard · EST 5 min', description: 'Tools to their home', estimatedMinutes: 5, difficulty: 'medium', category: 'organization', priority: 'medium', visualImpact: 'medium', completed: false, phase: 2, phaseName: 'Counter Strike', emoji: '🔧' },
      ] as CleaningTask[],
      quickWins: ['Sweep floor', 'Remove trash'],
    },
  };

  const defaultFallback = {
    tasks: [
      { id: 'fallback-1', title: 'Collect any visible trash from the nearest surface → trash bag · EST 2 min', description: 'Grab anything that is obviously garbage and toss it.', estimatedMinutes: 2, difficulty: 'quick' as const, category: 'trash_removal' as const, priority: 'high' as const, visualImpact: 'high' as const, completed: false, phase: 1, phaseName: 'Operation Floor Rescue', emoji: '🗑️' },
      { id: 'fallback-2', title: 'Clear one flat surface completely → move items to a temporary pile · EST 3 min', description: 'Pick any flat surface and move everything off it to a temporary pile.', estimatedMinutes: 3, difficulty: 'quick' as const, category: 'surface_clearing' as const, priority: 'high' as const, visualImpact: 'high' as const, completed: false, phase: 1, phaseName: 'Operation Floor Rescue', emoji: '✨' },
      { id: 'fallback-3', title: 'Walk 5 items to where they belong → their home spot · EST 5 min', description: 'Just 5 items. Walk each one home.', estimatedMinutes: 5, difficulty: 'quick' as const, category: 'organization' as const, priority: 'medium' as const, visualImpact: 'medium' as const, completed: false, phase: 2, phaseName: 'Counter Strike', emoji: '📦' },
    ] as CleaningTask[],
    quickWins: ['Collect visible trash', 'Clear one surface'],
  };

  const selected = fallbackTaskSets[roomType] || defaultFallback;
  const totalTime = selected.tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);

  return {
    tasks: selected.tasks,
    roomType: roomType as RoomType,
    messLevel: 50,
    estimatedTotalTime: totalTime,
    summary: 'Quick starter tasks to get you moving',
    quickWins: selected.quickWins,
    encouragement: "We couldn't analyze the photo right now, but here are some quick wins to get started!",
    photoQuality: { lighting: 'good', coverage: 'full', clarity: 'clear', confidence: 0.5 },
    isFallback: true,
  };
}
