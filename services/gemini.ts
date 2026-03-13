/**
 * Declutterly - Gemini AI Service
 * Handles image/video analysis for room decluttering
 */

import { AIAnalysisResult, CleaningTask, Priority, TaskDifficulty, RoomType } from '@/types/declutter';
import { AIAnalysisResponseSchema, ProgressAnalysisResponseSchema } from '@/types/schemas';
import { apiRateLimiter } from '@/services/secureStorage';
import NetInfo from '@react-native-community/netinfo';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

const { cacheDirectory } = FileSystem;

/**
 * Check if device is connected to the internet
 */
async function isOnline(): Promise<boolean> {
  try {
    const networkState = await NetInfo.fetch();
    return networkState.isConnected === true && networkState.isInternetReachable !== false;
  } catch {
    // If we can't check, assume online and let the request fail naturally
    return true;
  }
}

/**
 * Optimize image for API upload - resize to max 1920px and compress
 * This reduces memory usage, API payload size, and improves upload speed
 */
const MAX_IMAGE_DIMENSION = 1920;
const IMAGE_COMPRESSION_QUALITY = 0.8;

async function optimizeImage(base64Image: string): Promise<string> {
  try {
    // Remove data URL prefix if present to get pure base64
    const base64Data = base64Image.includes('base64,')
      ? base64Image.split('base64,')[1]
      : base64Image;

    // Check if cacheDirectory is available
    if (!cacheDirectory) {
      if (__DEV__) {
        console.warn('FileSystem cacheDirectory not available, skipping optimization');
      }
      return base64Data;
    }

    // Create a temporary file URI from the base64 data
    const tempUri = `${cacheDirectory}temp_image_${Date.now()}.jpg`;
    await FileSystem.writeAsStringAsync(tempUri, base64Data, {
      encoding: 'base64' as const,
    });

    // Manipulate the image - resize if needed and compress
    const context = ImageManipulator.manipulate(tempUri);
    context.resize({ width: MAX_IMAGE_DIMENSION });
    const renderedImage = await context.renderAsync();
    const savedImage = await renderedImage.saveAsync({
      compress: IMAGE_COMPRESSION_QUALITY,
      format: SaveFormat.JPEG,
      base64: true,
    });

    // Clean up temp file
    await FileSystem.deleteAsync(tempUri, { idempotent: true }).catch(() => {
      // Ignore cleanup errors
    });

    // Return the optimized base64 (without data URL prefix)
    return (savedImage as { base64?: string }).base64 || base64Data;
  } catch (error) {
    if (__DEV__) {
      console.warn('Image optimization failed, using original:', error);
    }
    // Fallback to original image if optimization fails
    return base64Image.includes('base64,')
      ? base64Image.split('base64,')[1]
      : base64Image;
  }
}

// Using Gemini 2.5 Flash - production-ready with excellent multimodal capabilities
// Alternative: 'gemini-3-flash-preview' for cutting-edge (preview) performance
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_API_URL = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent`;

/**
 * Sanitizes error messages to prevent leaking sensitive information
 */
function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // Check for common API error patterns and return generic messages
    if (message.includes('api key') || message.includes('apikey')) {
      return 'API configuration error. Please check your settings.';
    }
    if (message.includes('quota') || message.includes('rate limit')) {
      return 'Too many requests. Please try again in a moment.';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network error. Please check your connection.';
    }
    if (message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    // For other errors, return a generic message in production
    if (!__DEV__) {
      return 'An error occurred. Please try again.';
    }
    // In dev, return the actual message but without sensitive data
    return error.message.replace(/key=[^&\s]+/gi, 'key=[REDACTED]');
  }
  return 'An unexpected error occurred.';
}

// API Key from environment variable (preferred) or runtime override
const ENV_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
let runtimeApiKey = '';

export function setGeminiApiKey(key: string) {
  runtimeApiKey = key;
}

export function getGeminiApiKey(): string {
  return runtimeApiKey || ENV_API_KEY;
}

// Check if API key is configured
export function isApiKeyConfigured(): boolean {
  return !!(runtimeApiKey || ENV_API_KEY);
}

// Get the active API key (prefers runtime override, then env)
function getActiveApiKey(): string {
  return runtimeApiKey || ENV_API_KEY;
}

const DECLUTTER_SYSTEM_PROMPT = `You are a friendly, expert cleaning coach helping people declutter and clean their spaces. You specialize in helping people with ADHD, anxiety, and those who feel overwhelmed by cleaning tasks.

## YOUR APPROACH
1. Be WARM and NON-JUDGMENTAL - never shame the user for mess
2. Break down tasks into TINY, achievable steps - each subtask must be completable in UNDER 2 MINUTES
3. Prioritize "quick wins" - easy tasks with HIGH VISUAL IMPACT first for dopamine wins
4. Provide SPECIFIC, ACTIONABLE instructions with EXACT locations
5. Include specific object names from the photo (e.g., "blue coffee mug on desk" not "dishes")
6. Order tasks by VISUAL IMPACT - highest impact first so users see progress immediately

## ANALYSIS PROTOCOL

### Step 1: Photo Quality Assessment
Evaluate the image for lighting (good/dim/overexposed), coverage (full/partial/limited), and clarity (clear/blurry). Note any issues.

### Step 2: Zone Identification
Divide the visible space into distinct zones:
- Floor areas (by location: near bed, center, by door, etc.)
- Surfaces (desk, nightstand, dresser, counter, table)
- Storage areas (closet, drawers, shelves)
- Fixtures (bed, sink, toilet, appliances)

For each zone, assess clutter density, item count, and priority.

### Step 3: Object Detection
For EACH visible item that needs action, identify:
- Specific name with descriptors (e.g., "blue coffee mug" not just "cup", "crumpled red t-shirt" not just "clothes")
- Exact location (e.g., "on desk, left side near the monitor")
- Condition (clean/dirty/damaged/misplaced)
- Suggested action and destination

Categorize items as: trash, dishes, clothes, papers, belongs_elsewhere, misc

### Step 4: Task Generation - SCALED BY MESS LEVEL
CRITICAL — You MUST generate the MINIMUM number of tasks specified below. Do NOT generate fewer:
- messLevel < 40 (light mess): Generate EXACTLY 4-6 tasks, each with 3-5 subtasks
- messLevel 40-70 (moderate mess): Generate EXACTLY 8-10 tasks, each with 4-6 subtasks
- messLevel > 70 (heavy mess): Generate EXACTLY 12-15 tasks, each with 5-8 MICRO-STEPS (even tinier actions for overwhelmed users)

If messLevel is above 70, you MUST generate at least 12 tasks. Break large actions into multiple separate tasks rather than combining them. For example, "Gather clothes" should be split into "Gather clothes from the floor near the bed", "Gather clothes from the desk chair", "Gather clothes from the floor by the door" etc.

Each task MUST:
- Reference SPECIFIC objects you identified by name
- Include exact source AND destination locations
- Be ordered by VISUAL IMPACT (highest first for quick dopamine wins)
- Include 1-2 practical tips per task
- ALWAYS include whyThisMatters (psychological benefit) and resistanceHandler (pre-emptive response to "I don't want to do this")
- Include suppliesNeeded (e.g., ["trash bag", "cleaning spray", "paper towels"])

Each SUBTASK must:
- Be completable in UNDER 2 MINUTES (120 seconds max)
- Include estimatedSeconds (30-120) AND estimatedMinutes (0.5-2)
- Be a single, clear physical action (not "organize the shelf" but "pick up the 3 books from the shelf")

### Step 5: Time & Energy Profiles
Generate task lists for different scenarios (use task references, not full details):
- MINIMAL (5 min): 2-3 quick tasks for exhausted users
- QUICK (15 min): 4-5 tasks, minimal decisions
- STANDARD (30 min): 6-8 tasks with some organization
- COMPLETE (60+ min): All tasks

## TASK REQUIREMENTS

Each task MUST include:
- zone: Which zone this task addresses
- targetObjects: List of specific items with descriptors (max 3-4)
- destination: Where items should end up
- energyRequired: minimal/low/moderate/high
- visualImpact: low/medium/high
- tips: 1-2 brief practical tips
- subtasks: Multiple tiny steps, each with estimatedSeconds AND estimatedMinutes
- whyThisMatters: Brief psychological benefit (REQUIRED - never omit)
- resistanceHandler: Pre-emptive response to "I don't want to do this" (REQUIRED - never omit)
- suppliesNeeded: List of supplies needed (e.g., ["trash bag"], ["damp cloth", "spray cleaner"])

## OUTPUT FORMAT

Respond with valid JSON:
{
  "photoQuality": {
    "lighting": "good|dim|overexposed",
    "coverage": "full|partial|limited",
    "clarity": "clear|blurry|mixed",
    "confidence": 0.0-1.0,
    "notes": "any issues"
  },
  "messLevel": 0-100,
  "summary": "Detailed description naming specific items and locations",
  "roomType": "bedroom|kitchen|bathroom|livingRoom|office|garage|closet|other",
  "encouragement": "Warm, personalized message",

  "zones": [
    {
      "id": "zone-1",
      "name": "descriptive name",
      "type": "floor|surface|storage|fixture",
      "description": "specific location and contents",
      "clutterDensity": "low|medium|high|extreme",
      "itemCount": number,
      "estimatedClearTime": minutes,
      "priority": "high|medium|low",
      "priorityReason": "why this zone matters"
    }
  ],

  "detectedObjects": [
    {
      "name": "specific item name with descriptors",
      "category": "trash|dishes|clothes|papers|belongs_elsewhere|misc",
      "zone": "zone-id",
      "condition": "clean|dirty|damaged|misplaced",
      "suggestedAction": "specific action",
      "suggestedDestination": "where it should go"
    }
  ],

  "tasks": [
    {
      "title": "Action verb + specific task",
      "description": "Brief instructions (2-3 sentences)",
      "emoji": "relevant emoji",
      "priority": "high|medium|low",
      "difficulty": "quick|medium|challenging",
      "estimatedMinutes": number,
      "zone": "zone-id",
      "targetObjects": ["specific object name 1", "specific object name 2"],
      "destination": {"location": "where", "instructions": "how"},
      "category": "trash_removal|surface_clearing|dishes|laundry|organization|maintenance",
      "energyRequired": "minimal|low|moderate|high",
      "visualImpact": "low|medium|high",
      "tips": ["1-2 brief tips"],
      "subtasks": [{"title": "tiny action under 2 min", "estimatedSeconds": 60, "estimatedMinutes": 1}],
      "whyThisMatters": "psychological benefit of completing this task",
      "resistanceHandler": "what to tell yourself if you don't want to start",
      "suppliesNeeded": ["trash bag", "cleaning spray"]
    }
  ],

  "quickWins": ["task title 1", "task title 2"],
  "estimatedTotalTime": total minutes
}`;

// Helper to convert base64 image for API
function createImagePart(base64Image: string, mimeType: string = 'image/jpeg') {
  // Remove data URL prefix if present
  const base64Data = base64Image.includes('base64,')
    ? base64Image.split('base64,')[1]
    : base64Image;

  return {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };
}

// Generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function extractJsonFromResponse(responseText: string): string {
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  return jsonMatch ? jsonMatch[1].trim() : responseText;
}

/**
 * Attempt to repair truncated JSON by closing open brackets/braces
 */
function repairTruncatedJson(jsonStr: string): string {
  // Count open brackets and braces
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escapeNext = false;

  for (const char of jsonStr) {
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (char === '\\' && inString) {
      escapeNext = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === '{') openBraces++;
    else if (char === '}') openBraces--;
    else if (char === '[') openBrackets++;
    else if (char === ']') openBrackets--;
  }

  // If we're in a string, close it
  let repaired = jsonStr;
  if (inString) {
    repaired += '"';
  }

  // Remove any trailing incomplete key-value pairs
  repaired = repaired.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"{}[\]]*$/, '');
  repaired = repaired.replace(/,\s*$/, '');

  // Close open brackets and braces
  for (let i = 0; i < openBrackets; i++) {
    repaired += ']';
  }
  for (let i = 0; i < openBraces; i++) {
    repaired += '}';
  }

  return repaired;
}

function parseAIResponse(responseText: string): AIAnalysisResult {
  try {
    let jsonStr = extractJsonFromResponse(responseText);
    let rawParsed: any;

    try {
      rawParsed = JSON.parse(jsonStr);
    } catch (parseError) {
      // Try to repair truncated JSON
      if (__DEV__) {
        console.log('Initial JSON parse failed, attempting repair...');
      }
      const repairedJson = repairTruncatedJson(jsonStr);
      rawParsed = JSON.parse(repairedJson);
      if (__DEV__) {
        console.log('JSON repair successful');
      }
    }
    
    const validationResult = AIAnalysisResponseSchema.safeParse(rawParsed);
    
    if (!validationResult.success) {
      if (__DEV__) {
        console.warn('AI response validation errors:', validationResult.error.issues);
      }
    }
    
    const validated = validationResult.success ? validationResult.data : rawParsed;

    const tasks: CleaningTask[] = (validated.tasks || []).map((task: any) => ({
      id: generateId(),
      title: task.title || 'Task',
      description: task.description || '',
      emoji: task.emoji || '📋',
      priority: (task.priority || 'medium') as Priority,
      difficulty: (task.difficulty || 'medium') as TaskDifficulty,
      estimatedMinutes: task.estimatedMinutes || 5,
      completed: false,
      tips: task.tips || [],
      subtasks: (task.subtasks || []).map((st: any) => ({
        id: generateId(),
        title: st.title,
        completed: false,
        estimatedSeconds: st.estimatedSeconds,
        estimatedMinutes: st.estimatedMinutes ?? (st.estimatedSeconds ? Math.round((st.estimatedSeconds / 60) * 10) / 10 : undefined),
        isCheckpoint: st.isCheckpoint,
      })),
      zone: task.zone,
      targetObjects: task.targetObjects,
      destination: task.destination,
      dependencies: task.dependencies,
      enables: task.enables,
      parallelWith: task.parallelWith,
      category: task.category,
      energyRequired: task.energyRequired,
      decisionLoad: task.decisionLoad,
      visualImpact: task.visualImpact,
      whyThisMatters: task.whyThisMatters || 'Every small action makes a difference in creating a calmer space.',
      resistanceHandler: task.resistanceHandler || 'Just start with the first subtask. You can stop after that if you want.',
      suppliesNeeded: task.suppliesNeeded || [],
      decisionPoints: task.decisionPoints,
    }));

    // Sort tasks by visual impact: high first, then medium, then low
    const impactOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    tasks.sort((a, b) => (impactOrder[a.visualImpact || 'medium'] ?? 1) - (impactOrder[b.visualImpact || 'medium'] ?? 1));

    return {
      photoQuality: validated.photoQuality,
      messLevel: Math.min(100, Math.max(0, validated.messLevel || 50)),
      summary: validated.summary || 'Room analyzed successfully.',
      encouragement: validated.encouragement || "You've got this! Every small step counts.",
      roomType: validated.roomType as RoomType,
      zones: validated.zones,
      detectedObjects: validated.detectedObjects,
      tasks,
      taskGraph: validated.taskGraph,
      timeProfiles: validated.timeProfiles,
      energyProfiles: validated.energyProfiles,
      quickWins: validated.quickWins || [],
      decisionPoints: validated.decisionPoints,
      estimatedTotalTime: validated.estimatedTotalTime || tasks.reduce((acc, t) => acc + t.estimatedMinutes, 0),
      beforeAfterMetrics: validated.beforeAfterMetrics,
    };
  } catch (error) {
    if (__DEV__) {
      console.error('Failed to parse AI response:', error);
      console.log('Raw response:', responseText);
    }

    return {
      messLevel: 50,
      summary: 'Unable to fully analyze the image. Here are some general cleaning tasks.',
      encouragement: "Let's start with some basic cleaning tasks!",
      tasks: getDefaultTasks(),
      quickWins: ['Pick up any trash you can see', 'Put one item back in its place'],
      estimatedTotalTime: 30,
    };
  }
}

function getDefaultTasks(): CleaningTask[] {
  return [
    {
      id: generateId(),
      title: 'Quick Trash Sweep',
      description: 'Grab a trash bag and walk around the room. Pick up anything that is obviously garbage: wrappers, tissues, empty containers, junk mail. Toss it all in the bag. This is the fastest way to make a visible difference!',
      emoji: '🗑️',
      priority: 'high',
      difficulty: 'quick',
      estimatedMinutes: 3,
      completed: false,
      tips: [
        'Grab a bag BEFORE you start walking around',
        "Don't read anything - if it looks like trash, toss it!",
        'Check under furniture and in corners',
      ],
      subtasks: [
        { id: generateId(), title: 'Grab a trash bag or use a small bin', completed: false, estimatedSeconds: 30, estimatedMinutes: 0.5 },
        { id: generateId(), title: 'Walk clockwise around the room', completed: false, estimatedSeconds: 90, estimatedMinutes: 1.5 },
        { id: generateId(), title: 'Toss any obvious garbage', completed: false, estimatedSeconds: 60, estimatedMinutes: 1 },
      ],
      category: 'trash_removal',
      energyRequired: 'minimal',
      decisionLoad: 'none',
      visualImpact: 'high',
      whyThisMatters: 'Removing garbage is the fastest way to see progress. Your brain registers cleaner even if nothing else changes.',
      resistanceHandler: 'You only need to pick up obvious trash. No sorting, no decisions. Just grab and toss.',
      suppliesNeeded: ['trash bag'],
    },
    {
      id: generateId(),
      title: 'Clear One Surface Completely',
      description: 'Pick the most visible surface in the room (table, counter, desk, nightstand). Remove EVERYTHING from it. Sort items into 3 piles: (1) Trash - throw away, (2) Belongs elsewhere - relocate now, (3) Stays here - put back neatly.',
      emoji: '✨',
      priority: 'high',
      difficulty: 'medium',
      estimatedMinutes: 10,
      completed: false,
      tips: [
        'Start with the first surface you see when entering the room',
        'Take a before photo to appreciate your progress!',
        'Only put back items you actually USE on that surface',
      ],
      subtasks: [
        { id: generateId(), title: 'Remove everything from the surface', completed: false, estimatedSeconds: 60, estimatedMinutes: 1 },
        { id: generateId(), title: 'Wipe the surface clean', completed: false, estimatedSeconds: 60, estimatedMinutes: 1 },
        { id: generateId(), title: 'Throw away trash items', completed: false, estimatedSeconds: 30, estimatedMinutes: 0.5 },
        { id: generateId(), title: 'Put items that belong elsewhere in their homes', completed: false, estimatedSeconds: 120, estimatedMinutes: 2 },
        { id: generateId(), title: 'Return only essentials to the surface', completed: false, estimatedSeconds: 60, estimatedMinutes: 1, isCheckpoint: true },
      ],
      category: 'surface_clearing',
      energyRequired: 'low',
      decisionLoad: 'medium',
      visualImpact: 'high',
      whyThisMatters: 'Clear surfaces reduce visual noise, which reduces mental noise. Your brain will literally feel calmer.',
      resistanceHandler: 'Pick the smallest surface first. Even clearing one nightstand creates momentum.',
      suppliesNeeded: ['damp cloth', 'trash bag'],
    },
    {
      id: generateId(),
      title: 'Gather All Dishes',
      description: 'Walk through the room and collect ALL dishes, cups, mugs, glasses, and utensils. Stack them carefully and bring them to the kitchen sink. Run hot water over them if they have dried food.',
      emoji: '🍽️',
      priority: 'medium',
      difficulty: 'quick',
      estimatedMinutes: 5,
      completed: false,
      tips: [
        'Use a tray or large bowl to carry multiple items at once',
        'Check nightstands, desks, and coffee tables',
        "Don't wash them now - just gather and stack by the sink",
      ],
      subtasks: [
        { id: generateId(), title: 'Check all surfaces for dishes and cups', completed: false, estimatedSeconds: 90, estimatedMinutes: 1.5 },
        { id: generateId(), title: 'Stack dishes carefully', completed: false, estimatedSeconds: 60, estimatedMinutes: 1 },
        { id: generateId(), title: 'Bring everything to the kitchen sink', completed: false, estimatedSeconds: 60, estimatedMinutes: 1 },
      ],
      category: 'dishes',
      energyRequired: 'minimal',
      decisionLoad: 'none',
      visualImpact: 'medium',
      destination: { location: 'Kitchen sink', instructions: 'Stack by the sink, rinse if dried food' },
      whyThisMatters: 'Dishes attract bugs and create odors. Getting them to the kitchen is a health win.',
      resistanceHandler: "You don't have to wash them now. Just relocate. That's the whole task.",
      suppliesNeeded: [],
    },
    {
      id: generateId(),
      title: 'Collect Clothes Into 3 Piles',
      description: 'Gather all clothing items from the floor, chairs, and bed. Sort into three piles: (1) Clean - can be worn again, put away or on a chair, (2) Dirty - goes in the hamper, (3) Donate - doesn\'t fit or never wear, put in a bag.',
      emoji: '👕',
      priority: 'medium',
      difficulty: 'medium',
      estimatedMinutes: 10,
      completed: false,
      tips: [
        "Don't fold anything now - just sort into piles!",
        'The sniff test works: if it smells fine and has no stains, it\'s clean',
        "Be honest about donate pile - if you haven't worn it in 6 months...",
      ],
      subtasks: [
        { id: generateId(), title: 'Gather all clothes from floor and furniture', completed: false, estimatedSeconds: 120, estimatedMinutes: 2 },
        { id: generateId(), title: 'Create 3 piles: clean, dirty, donate', completed: false, estimatedSeconds: 120, estimatedMinutes: 2 },
        { id: generateId(), title: 'Put dirty clothes in hamper', completed: false, estimatedSeconds: 60, estimatedMinutes: 1, isCheckpoint: true },
        { id: generateId(), title: 'Hang or fold clean clothes', completed: false, estimatedSeconds: 120, estimatedMinutes: 2 },
        { id: generateId(), title: 'Bag up donate pile', completed: false, estimatedSeconds: 60, estimatedMinutes: 1 },
      ],
      category: 'laundry',
      energyRequired: 'low',
      decisionLoad: 'medium',
      visualImpact: 'high',
      whyThisMatters: 'Clothes on the floor make any room feel chaotic. Sorting them creates instant calm.',
      resistanceHandler: 'Skip the donate pile if it feels hard today. Just separate clean from dirty.',
      suppliesNeeded: ['laundry hamper', 'donate bag'],
      decisionPoints: [{
        trigger: 'When sorting each clothing item',
        question: 'Have I worn this in the last 6 months?',
        options: [
          { answer: 'Yes, and it looks/smells clean', action: 'Clean pile - hang or fold' },
          { answer: 'Yes, but needs washing', action: 'Dirty pile - into hamper' },
          { answer: 'No', action: 'Donate pile - bag it up' },
        ],
        fiveSecondDefault: 'If you hesitate, keep it for now. Revisit later.',
        emotionalSupport: 'Letting go of clothes creates space for pieces you actually love wearing.',
      }],
    },
    {
      id: generateId(),
      title: 'Make the Bed',
      description: 'A made bed makes the whole room look 50% cleaner instantly! Pull up the sheets, straighten the blanket, fluff and arrange pillows. Keep it simple - it doesn\'t have to be hotel-perfect.',
      emoji: '🛏️',
      priority: 'medium',
      difficulty: 'quick',
      estimatedMinutes: 3,
      completed: false,
      tips: [
        'Stand on one side and do the whole bed from there',
        'Good enough is good enough - no need for hospital corners',
        'This one task makes the biggest visual impact',
      ],
      subtasks: [
        { id: generateId(), title: 'Straighten the fitted sheet', completed: false, estimatedSeconds: 30, estimatedMinutes: 0.5 },
        { id: generateId(), title: 'Pull up the top sheet and blanket', completed: false, estimatedSeconds: 30, estimatedMinutes: 0.5 },
        { id: generateId(), title: 'Arrange pillows at the head', completed: false, estimatedSeconds: 30, estimatedMinutes: 0.5 },
      ],
      category: 'maintenance',
      energyRequired: 'minimal',
      decisionLoad: 'none',
      visualImpact: 'high',
      whyThisMatters: 'A made bed is the #1 visual anchor that signals "this is a cared-for space."',
      resistanceHandler: 'It takes 90 seconds and transforms the whole room. Just pull up the covers.',
      suppliesNeeded: [],
    },
  ];
}

// Main analysis function - analyzes an image of a room
export async function analyzeRoomImage(
  base64Image: string,
  additionalContext?: string
): Promise<AIAnalysisResult> {
  // Check network connectivity first
  const online = await isOnline();
  if (!online) {
    throw new Error('No internet connection. Please check your network and try again.');
  }

  const apiKey = getActiveApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Please add your API key in Settings.');
  }

  if (__DEV__) {
    console.log('Gemini API key configured:', apiKey.length, 'chars, starts with:', apiKey.substring(0, 6));
  }

  // Check rate limit
  if (!apiRateLimiter.canMakeRequest()) {
    const waitTime = Math.ceil(apiRateLimiter.getTimeUntilReset() / 1000);
    throw new Error(`Too many requests. Please wait ${waitTime} seconds before trying again.`);
  }

  // Sanitize additional context to prevent injection
  const sanitizedContext = additionalContext
    ? additionalContext.slice(0, 500).replace(/[<>{}]/g, '')
    : undefined;

  const userPrompt = sanitizedContext
    ? `Analyze this room and create a decluttering plan. Additional context: ${sanitizedContext}`
    : 'Analyze this room and create a decluttering plan. Be encouraging and break tasks into small, manageable steps.';

  // Optimize image before sending to API
  const optimizedImage = await optimizeImage(base64Image);

  const requestBody = {
    contents: [
      {
        parts: [
          { text: DECLUTTER_SYSTEM_PROMPT },
          { text: userPrompt },
          createImagePart(optimizedImage),
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 16384,
    },
  };

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const rawMessage = errorData.error?.message || `API request failed with status ${response.status}`;
      if (__DEV__) {
        console.error('Gemini API raw error:', response.status, rawMessage);
      }
      throw new Error(sanitizeErrorMessage(new Error(rawMessage)));
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error('No response from AI. Please try again.');
    }

    return parseAIResponse(responseText);
  } catch (error) {
    // Log sanitized error in dev only
    if (__DEV__) {
      console.error('Gemini API error:', sanitizeErrorMessage(error));
    }
    // Re-throw with sanitized message
    throw new Error(sanitizeErrorMessage(error));
  }
}

// Analyze progress between two photos
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
  const defaultResult = {
    progressPercentage: 0,
    percentImproved: 0,
    completedTasks: [] as string[],
    areasImproved: [] as string[],
    remainingTasks: ['Unable to analyze'] as string[],
    areasRemaining: ['Unable to analyze'] as string[],
    encouragement: '',
    encouragingMessage: '',
  };

  // Check network connectivity first
  const online = await isOnline();
  if (!online) {
    return {
      ...defaultResult,
      remainingTasks: ['Unable to analyze - no internet connection'],
      areasRemaining: ['Unable to analyze - no internet connection'],
      encouragement: "We couldn't check your progress without internet. Keep up the great work!",
      encouragingMessage: "We couldn't check your progress without internet. Keep up the great work!",
    };
  }

  const apiKey = getActiveApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Please add your API key in Settings.');
  }

  // Check rate limit
  if (!apiRateLimiter.canMakeRequest()) {
    return {
      progressPercentage: 50,
      percentImproved: 50,
      completedTasks: ['Made visible progress'],
      areasImproved: ['Made visible progress'],
      remainingTasks: ['Continue with remaining tasks'],
      areasRemaining: ['Continue with remaining tasks'],
      encouragement: "You're doing great! Every bit of progress counts!",
      encouragingMessage: "You're doing great! Every bit of progress counts!",
    };
  }

  const progressPrompt = `Compare these two images of the same room. The first image is "before" and the second is "after" cleaning.

Analyze the progress made and respond with JSON:
{
  "progressPercentage": <0-100>,
  "percentImproved": <0-100>,
  "completedTasks": ["<what was cleaned/organized>"],
  "areasImproved": ["<specific areas that look better>"],
  "remainingTasks": ["<what still needs work>"],
  "areasRemaining": ["<specific areas still needing attention>"],
  "encouragement": "<celebrate their progress!>",
  "encouragingMessage": "<warm, specific message about what they accomplished>"
}

Be very encouraging! Focus on what WAS accomplished, not what wasn't. Name specific objects and areas that improved.`;

  // Optimize both images before sending to API
  const [optimizedBefore, optimizedAfter] = await Promise.all([
    optimizeImage(beforeImage),
    optimizeImage(afterImage),
  ]);

  const requestBody = {
    contents: [
      {
        parts: [
          { text: progressPrompt },
          { text: 'Before image:' },
          createImagePart(optimizedBefore),
          { text: 'After image:' },
          createImagePart(optimizedAfter),
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(sanitizeErrorMessage(new Error(`API request failed with status ${response.status}`)));
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    const jsonStr = extractJsonFromResponse(responseText);
    let rawParsed: any;
    try {
      rawParsed = JSON.parse(jsonStr);
    } catch {
      const repairedJson = repairTruncatedJson(jsonStr);
      rawParsed = JSON.parse(repairedJson);
    }

    const validationResult = ProgressAnalysisResponseSchema.safeParse(rawParsed);
    const validated = validationResult.success ? validationResult.data : rawParsed;

    const progressPct = validated.progressPercentage || validated.percentImproved || 50;
    const completed = validated.completedTasks || [];
    const remaining = validated.remainingTasks || [];
    const msg = validated.encouragement || validated.encouragingMessage || 'Great progress! Keep going!';

    return {
      progressPercentage: progressPct,
      percentImproved: validated.percentImproved || progressPct,
      completedTasks: completed,
      areasImproved: validated.areasImproved || completed,
      remainingTasks: remaining,
      areasRemaining: validated.areasRemaining || remaining,
      encouragement: msg,
      encouragingMessage: validated.encouragingMessage || msg,
    };
  } catch (error) {
    if (__DEV__) {
      console.error('Progress analysis error:', sanitizeErrorMessage(error));
    }
    return {
      progressPercentage: 50,
      percentImproved: 50,
      completedTasks: ['Made visible progress'],
      areasImproved: ['Made visible progress'],
      remainingTasks: ['Continue with remaining tasks'],
      areasRemaining: ['Continue with remaining tasks'],
      encouragement: "You're doing great! Every bit of progress counts!",
      encouragingMessage: "You're doing great! Every bit of progress counts!",
    };
  }
}

// Get a motivational message
export async function getMotivation(context: string): Promise<string> {
  const apiKey = getActiveApiKey();
  if (!apiKey) {
    return getRandomMotivation();
  }

  // Check rate limit - use fallback if limited
  if (!apiRateLimiter.canMakeRequest()) {
    return getRandomMotivation();
  }

  // Sanitize context to prevent injection
  const sanitizedContext = context.slice(0, 200).replace(/[<>{}]/g, '');

  try {
    const requestBody = {
      contents: [
        {
          parts: [
            { text: `You are a supportive friend helping someone clean their space. They might be feeling overwhelmed or unmotivated. Give them a short (1-2 sentences), warm, encouraging message. Context: ${sanitizedContext}. Be genuine, not cheesy.` },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 100,
      },
    };

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || getRandomMotivation();
  } catch {
    return getRandomMotivation();
  }
}

// Fallback motivational messages
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
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}
