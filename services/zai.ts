/**
 * Declutterly - Z.AI GLM-4.6V Service
 * Handles image/video analysis for room decluttering using Z.AI's vision model
 * 
 * GLM-4.6V Features:
 * - Native multimodal tool calling
 * - Full object detection with bounding boxes
 * - 128K context window
 * - Thinking mode for transparent reasoning
 */

import { AIAnalysisResult, CleaningTask, Priority, TaskDifficulty, RoomType } from '@/types/declutter';
import { AIAnalysisResponseSchema, ProgressAnalysisResponseSchema } from '@/types/schemas';
import { apiRateLimiter } from '@/services/secureStorage';
import NetInfo from '@react-native-community/netinfo';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
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
    return true;
  }
}

/**
 * Optimize image for API upload - resize to max 1920px and compress
 */
const MAX_IMAGE_DIMENSION = 1920;
const IMAGE_COMPRESSION_QUALITY = 0.8;

async function optimizeImage(base64Image: string): Promise<string> {
  try {
    const base64Data = base64Image.includes('base64,')
      ? base64Image.split('base64,')[1]
      : base64Image;

    if (!cacheDirectory) {
      if (__DEV__) {
        console.warn('FileSystem cacheDirectory not available, skipping optimization');
      }
      return base64Data;
    }

    const tempUri = `${cacheDirectory}temp_image_${Date.now()}.jpg`;
    await FileSystem.writeAsStringAsync(tempUri, base64Data, {
      encoding: 'base64' as const,
    });

    const manipResult = await manipulateAsync(
      tempUri,
      [{ resize: { width: MAX_IMAGE_DIMENSION } }],
      {
        compress: IMAGE_COMPRESSION_QUALITY,
        format: SaveFormat.JPEG,
        base64: true,
      }
    );

    await FileSystem.deleteAsync(tempUri, { idempotent: true }).catch(() => {});

    return manipResult.base64 || base64Data;
  } catch (error) {
    if (__DEV__) {
      console.warn('Image optimization failed, using original:', error);
    }
    return base64Image.includes('base64,')
      ? base64Image.split('base64,')[1]
      : base64Image;
  }
}

// Z.AI API configuration - Using GLM-4.6V (flagship vision model)
const ZAI_MODEL = 'glm-4.6v';
const ZAI_MODEL_FREE = 'glm-4.6v-flash';

// Endpoint configuration
// Coding Plan: https://api.z.ai/api/coding/paas/v4 (subscription users)
// Standard:    https://api.z.ai/api/paas/v4 (pay-as-you-go)
const ZAI_API_BASE_STANDARD = 'https://api.z.ai/api/paas/v4';
const ZAI_API_BASE_CODING = 'https://api.z.ai/api/coding/paas/v4';

const ENV_USE_CODING_PLAN = process.env.EXPO_PUBLIC_ZAI_CODING_PLAN === 'true';
let useCodingPlan = ENV_USE_CODING_PLAN;

export function setZaiCodingPlan(enabled: boolean) {
  useCodingPlan = enabled;
}

export function isUsingCodingPlan(): boolean {
  return useCodingPlan;
}

function getApiBaseUrl(): string {
  return useCodingPlan ? ZAI_API_BASE_CODING : ZAI_API_BASE_STANDARD;
}

function getApiUrl(): string {
  return `${getApiBaseUrl()}/chat/completions`;
}

/**
 * Sanitizes error messages to prevent leaking sensitive information
 */
function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('api key') || message.includes('apikey') || message.includes('authorization')) {
      return 'API configuration error. Please check your Z.AI API key in Settings.';
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
    if (!__DEV__) {
      return 'An error occurred. Please try again.';
    }
    return error.message.replace(/key=[^&\s]+/gi, 'key=[REDACTED]');
  }
  return 'An unexpected error occurred.';
}

// API Key from environment variable or runtime override
const ENV_API_KEY = process.env.EXPO_PUBLIC_ZAI_API_KEY || '';
let runtimeApiKey = '';
let useFreeTier = false;

export function setZaiApiKey(key: string) {
  runtimeApiKey = key;
}

export function getZaiApiKey(): string {
  return runtimeApiKey || ENV_API_KEY;
}

export function isZaiApiKeyConfigured(): boolean {
  return !!(runtimeApiKey || ENV_API_KEY);
}

export function setZaiFreeTier(free: boolean) {
  useFreeTier = free;
}

export function isUsingFreeTier(): boolean {
  return useFreeTier;
}

function getActiveApiKey(): string {
  return runtimeApiKey || ENV_API_KEY;
}

function getActiveModel(): string {
  return useFreeTier ? ZAI_MODEL_FREE : ZAI_MODEL;
}

// System prompt for declutter analysis - Enhanced for GLM-4.6V capabilities
const DECLUTTER_SYSTEM_PROMPT = `You are a friendly, expert cleaning coach helping people declutter and clean their spaces. You specialize in helping people with ADHD, anxiety, and those who feel overwhelmed by cleaning tasks.

## Your Capabilities (GLM-4.6V):
- Full object detection with precise location identification
- Multi-image understanding for before/after comparisons
- Native visual reasoning for clutter assessment

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
IMPORTANT: Scale the number of tasks based on the messLevel you assessed:
- messLevel < 40 (light mess): Generate 4-6 tasks, each with 3-5 subtasks
- messLevel 40-70 (moderate mess): Generate 6-10 tasks, each with 4-6 subtasks
- messLevel > 70 (heavy mess): Generate 10-15 tasks, each with 5-8 MICRO-STEPS (even tinier actions for overwhelmed users)

Each task MUST:
- Reference SPECIFIC objects you identified by name
- Include exact source AND destination locations
- Be ordered by VISUAL IMPACT (highest first for quick dopamine wins)
- Have clear dependencies (what must happen first)
- Provide decision support for sorting tasks
- Include tips for HOW to do each step
- ALWAYS include whyThisMatters (psychological benefit) and resistanceHandler (pre-emptive response to "I don't want to do this")
- Include suppliesNeeded (e.g., ["trash bag", "cleaning spray", "paper towels"])

Each SUBTASK must:
- Be completable in UNDER 2 MINUTES (120 seconds max)
- Include estimatedSeconds (30-120) AND estimatedMinutes (0.5-2)
- Be a single, clear physical action (not "organize the shelf" but "pick up the 3 books from the shelf")

### Step 5: Time & Energy Profiles
Generate task lists for different scenarios:
- MINIMAL (5 min, exhausted): 2-3 maintenance tasks, no decisions
- QUICK (15 min, low energy): 4-5 quick wins, minimal decisions
- STANDARD (30 min, moderate energy): 8-10 tasks with some organization
- COMPLETE (60+ min, high energy): Full cleaning with deep organization

## TASK REQUIREMENTS

Each task MUST include:
- zone: Which zone this task addresses
- targetObjects: List of specific items with descriptors this task handles
- destination: Where items should end up
- dependencies: What tasks must complete first (if any)
- energyRequired: minimal/low/moderate/high
- decisionLoad: none/low/medium/high (how many choices user must make)
- visualImpact: low/medium/high (how much cleaner room will LOOK)
- whyThisMatters: Brief psychological benefit (REQUIRED - never omit)
- resistanceHandler: Pre-emptive response to "I don't want to do this" (REQUIRED - never omit)
- suppliesNeeded: List of supplies needed (e.g., ["trash bag"], ["damp cloth", "spray cleaner"])
- subtasks: Multiple tiny steps, each with estimatedSeconds AND estimatedMinutes

## DECISION SUPPORT

For sorting tasks (clothes, papers, misc), provide decisionPoints with:
- Clear criteria for keep/donate/trash decisions
- The "5-second rule": if hesitating >5 seconds, use default action
- Emotional support for letting go of items

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
      "description": "Detailed instructions with locations and methods",
      "emoji": "relevant emoji",
      "priority": "high|medium|low",
      "difficulty": "quick|medium|challenging",
      "estimatedMinutes": number,
      "zone": "zone-id",
      "targetObjects": ["specific object name 1", "specific object name 2"],
      "destination": {"location": "where", "instructions": "how"},
      "dependencies": ["task-ids that must complete first"],
      "category": "trash_removal|surface_clearing|dishes|laundry|organization|deep_cleaning|maintenance|donation_sorting|setup",
      "energyRequired": "minimal|low|moderate|high",
      "decisionLoad": "none|low|medium|high",
      "visualImpact": "low|medium|high",
      "tips": ["practical tip 1", "practical tip 2"],
      "subtasks": [{"title": "tiny action under 2 min", "estimatedSeconds": 60, "estimatedMinutes": 1}],
      "whyThisMatters": "psychological benefit of completing this task",
      "resistanceHandler": "what to tell yourself if you don't want to start",
      "suppliesNeeded": ["trash bag", "cleaning spray"]
    }
  ],

  "taskGraph": {
    "criticalPath": ["task-ids in importance order"],
    "parallelGroups": [["tasks", "that", "can run together"]],
    "setupTasks": ["enabling tasks"],
    "optionalTasks": ["nice-to-have"]
  },

  "timeProfiles": {
    "minimal": {"tasks": ["task-ids"], "expectedImpact": 0-100},
    "quick": {"tasks": ["task-ids"], "expectedImpact": 0-100},
    "standard": {"tasks": ["task-ids"], "expectedImpact": 0-100},
    "complete": {"tasks": ["task-ids"], "expectedImpact": 0-100}
  },

  "energyProfiles": {
    "exhausted": ["task-ids"],
    "low": ["task-ids"],
    "moderate": ["task-ids"],
    "high": ["task-ids"]
  },

  "quickWins": [
    {"taskId": "ref", "visualImpact": "high|medium", "timeMinutes": number, "reason": "why quick win"}
  ],

  "decisionPoints": [
    {
      "trigger": "when sorting clothes",
      "question": "Have I worn this in 6 months?",
      "options": [
        {"answer": "Yes, clean", "action": "Hang in closet"},
        {"answer": "Yes, dirty", "action": "Put in hamper"},
        {"answer": "No", "action": "Donate pile"}
      ],
      "fiveSecondDefault": "Keep for now, decide later",
      "emotionalSupport": "Letting go creates space for what matters"
    }
  ],

  "estimatedTotalTime": total minutes,
  "beforeAfterMetrics": ["Floor visibility", "Surfaces cleared", "Items removed"]
}`;

// Generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function extractJsonFromResponse(responseText: string): string {
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  return jsonMatch ? jsonMatch[1].trim() : responseText;
}

function parseAIResponse(responseText: string): AIAnalysisResult {
  try {
    const jsonStr = extractJsonFromResponse(responseText);
    const rawParsed = JSON.parse(jsonStr);
    
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

// Default tasks when AI analysis fails
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

/**
 * Main analysis function using Z.AI GLM-4.6V
 */
export async function analyzeRoomImageWithZai(
  base64Image: string,
  additionalContext?: string
): Promise<AIAnalysisResult> {
  // Check network connectivity
  const online = await isOnline();
  if (!online) {
    throw new Error('No internet connection. Please check your network and try again.');
  }

  const apiKey = getActiveApiKey();
  if (!apiKey) {
    throw new Error('Z.AI API key not configured. Please add your API key in Settings.');
  }

  // Check rate limit
  if (!apiRateLimiter.canMakeRequest()) {
    const waitTime = Math.ceil(apiRateLimiter.getTimeUntilReset() / 1000);
    throw new Error(`Too many requests. Please wait ${waitTime} seconds before trying again.`);
  }

  // Sanitize additional context
  const sanitizedContext = additionalContext
    ? additionalContext.slice(0, 500).replace(/[<>{}]/g, '')
    : undefined;

  const userPrompt = sanitizedContext
    ? `Analyze this room and create a decluttering plan. Additional context: ${sanitizedContext}`
    : 'Analyze this room and create a decluttering plan. Be encouraging and break tasks into small, manageable steps.';

  // Optimize image before sending
  const optimizedImage = await optimizeImage(base64Image);

  const requestBody = {
    model: getActiveModel(),
    messages: [
      {
        role: 'system',
        content: DECLUTTER_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${optimizedImage}`,
            },
          },
          {
            type: 'text',
            text: userPrompt,
          },
        ],
      },
    ],
    thinking: {
      type: 'enabled', // Enable thinking mode for better reasoning
    },
    temperature: 0.7,
    max_tokens: 8192,
  };

  try {
    const response = await fetch(getApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const rawMessage = errorData.error?.message || `API request failed with status ${response.status}`;
      throw new Error(sanitizeErrorMessage(new Error(rawMessage)));
    }

    const data = await response.json();
    
    const responseText = data.choices?.[0]?.message?.content;

    if (!responseText) {
      throw new Error('No response from AI. Please try again.');
    }

    if (__DEV__ && data.choices?.[0]?.message?.reasoning_content) {
      console.log('GLM-4.6V Thinking:', data.choices[0].message.reasoning_content);
    }

    return parseAIResponse(responseText);
  } catch (error) {
    if (__DEV__) {
      console.error('Z.AI API error:', sanitizeErrorMessage(error));
    }
    throw new Error(sanitizeErrorMessage(error));
  }
}

/**
 * Analyze progress between two photos using GLM-4.6V
 */
export async function analyzeProgressWithZai(
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
  const online = await isOnline();
  if (!online) {
    return {
      progressPercentage: 0,
      percentImproved: 0,
      completedTasks: [],
      areasImproved: [],
      remainingTasks: ['Unable to analyze - no internet connection'],
      areasRemaining: ['Unable to analyze - no internet connection'],
      encouragement: "We couldn't check your progress without internet. Keep up the great work!",
      encouragingMessage: "We couldn't check your progress without internet. Keep up the great work!",
    };
  }

  const apiKey = getActiveApiKey();
  if (!apiKey) {
    throw new Error('Z.AI API key not configured. Please add your API key in Settings.');
  }

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

  const [optimizedBefore, optimizedAfter] = await Promise.all([
    optimizeImage(beforeImage),
    optimizeImage(afterImage),
  ]);

  const requestBody = {
    model: getActiveModel(),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: progressPrompt,
          },
          {
            type: 'text',
            text: 'Before image:',
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${optimizedBefore}`,
            },
          },
          {
            type: 'text',
            text: 'After image:',
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${optimizedAfter}`,
            },
          },
        ],
      },
    ],
    thinking: {
      type: 'enabled',
    },
    temperature: 0.7,
    max_tokens: 2048,
  };

  try {
    const response = await fetch(getApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(sanitizeErrorMessage(new Error(`API request failed with status ${response.status}`)));
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content;

    const jsonStr = extractJsonFromResponse(responseText);
    const rawParsed = JSON.parse(jsonStr);
    
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

/**
 * Get object detection with bounding boxes using GLM-4.6V
 * This is a specialized feature of GLM-4.6V for precise object location
 */
export async function detectObjectsInRoom(
  base64Image: string
): Promise<Array<{
  label: string;
  bbox_2d: [number, number, number, number];
  condition: string;
  priority: string;
}>> {
  const apiKey = getActiveApiKey();
  if (!apiKey) {
    throw new Error('Z.AI API key not configured.');
  }

  const optimizedImage = await optimizeImage(base64Image);

  const detectionPrompt = `Identify ALL objects in this room that need attention for cleaning/organizing. 

Return results in valid JSON format as a list where each element is:
{
  "label": "object name with number if multiple (e.g., clothes-pile-1)",
  "bbox_2d": [xmin, ymin, xmax, ymax],
  "condition": "clean|dirty|damaged|misplaced",
  "priority": "high|medium|low|keep"
}

Focus on:
- Clutter and items out of place
- Dirty dishes, cups
- Clothes on floor/furniture
- Papers and documents
- Trash
- Items that need organizing

Example:
[
  {"label": "clothes-pile-1", "bbox_2d": [100, 200, 300, 400], "condition": "misplaced", "priority": "high"},
  {"label": "coffee-mug-1", "bbox_2d": [450, 150, 520, 220], "condition": "dirty", "priority": "medium"}
]`;

  const requestBody = {
    model: getActiveModel(),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${optimizedImage}`,
            },
          },
          {
            type: 'text',
            text: detectionPrompt,
          },
        ],
      },
    ],
    thinking: {
      type: 'enabled',
    },
    temperature: 0.5, // Lower temperature for more precise detection
    max_tokens: 4096,
  };

  try {
    const response = await fetch(getApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content;
    const jsonStr = extractJsonFromResponse(responseText);
    
    return JSON.parse(jsonStr);
  } catch (error) {
    if (__DEV__) {
      console.error('Object detection error:', error);
    }
    return [];
  }
}

/**
 * Get a motivational message using GLM-4.6V
 */
export async function getMotivationWithZai(context: string): Promise<string> {
  const apiKey = getActiveApiKey();
  if (!apiKey) {
    return getRandomMotivation();
  }

  if (!apiRateLimiter.canMakeRequest()) {
    return getRandomMotivation();
  }

  const sanitizedContext = context.slice(0, 200).replace(/[<>{}]/g, '');

  try {
    const requestBody = {
      model: getActiveModel(),
      messages: [
        {
          role: 'user',
          content: `You are a supportive friend helping someone clean their space. They might be feeling overwhelmed or unmotivated. Give them a short (1-2 sentences), warm, encouraging message. Context: ${sanitizedContext}. Be genuine, not cheesy.`,
        },
      ],
      temperature: 0.9,
      max_tokens: 100,
    };

    const response = await fetch(getApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || getRandomMotivation();
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
