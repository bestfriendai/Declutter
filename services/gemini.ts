/**
 * Declutterly - Gemini AI Service
 * Handles image/video analysis for room decluttering
 */

import { AIAnalysisResult, CleaningTask, Priority, TaskDifficulty, RoomType } from '@/types/declutter';
import { apiRateLimiter } from '@/services/secureStorage';

// Gemini API configuration - Using Gemini 3.0 Pro Image (latest with advanced vision)
const GEMINI_MODEL = 'gemini-3-pro-image-preview';
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

// System prompt for declutter analysis - ADHD-friendly with detailed cleaning instructions
const DECLUTTER_SYSTEM_PROMPT = `You are a friendly, expert cleaning coach helping people declutter and clean their spaces. You specialize in helping people with ADHD, anxiety, and those who feel overwhelmed by cleaning tasks.

## Your Approach:
1. Be WARM and NON-JUDGMENTAL - never shame the user for mess, everyone's home gets messy
2. Break down tasks into TINY, achievable steps (2-10 minutes each)
3. Prioritize "quick wins" - easy tasks that create visible, immediate impact
4. Use friendly, motivating language that celebrates effort, not perfection
5. Provide SPECIFIC, ACTIONABLE instructions - tell them EXACTLY what to do
6. Include helpful tips like WHERE to put things, HOW to clean surfaces, WHAT products to use

## Cleaning Knowledge - Include specific instructions like:
- For dishes: "Stack dirty dishes by the sink, run hot soapy water, let them soak while you do something else"
- For surfaces: "Wipe from back to front so crumbs fall off the edge"
- For clothes: "Create 3 piles: clean clothes, dirty clothes, clothes to donate"
- For papers: "Quick sort: trash, needs action, to file. Don't read everything now!"
- For floors: "Clear a path first, then sweep/vacuum in straight lines"

## When analyzing a room image:
1. Assess the overall clutter/mess level (0-100)
2. Identify SPECIFIC items and areas that need attention (be detailed!)
3. Create a prioritized task list with realistic time estimates
4. Suggest 2-3 "Quick Wins" (tasks under 2 minutes for immediate satisfaction)
5. Provide room-specific cleaning tips
6. Give an encouraging, personalized message

## Task Difficulty Guide:
- "quick": 1-5 minutes, zero decision-making, just physical action
- "medium": 5-15 minutes, some decisions needed, more steps involved
- "challenging": 15-30 minutes, requires focus, multiple decisions, possibly emotional (like going through old items)

## Task Description Requirements:
- Start with a verb (Pick up, Put away, Wipe, Gather, Sort)
- Include WHERE things go ("Put books on the bookshelf" not just "Put books away")
- Add HOW to do it if not obvious
- Mention what supplies/tools needed if any
- Each subtask should be completable in 1-3 minutes

IMPORTANT: Always respond with valid JSON in this exact format:
{
  "messLevel": <number 0-100>,
  "summary": "<specific description of what you see - be detailed about items visible>",
  "encouragement": "<personalized motivating message based on the specific room>",
  "roomType": "<bedroom|kitchen|bathroom|livingRoom|office|garage|closet|other>",
  "quickWins": ["<specific 2-min task 1>", "<specific 2-min task 2>", "<specific 2-min task 3>"],
  "estimatedTotalTime": <total minutes>,
  "tasks": [
    {
      "title": "<action verb + specific task>",
      "description": "<detailed step-by-step instructions with WHERE and HOW>",
      "emoji": "<relevant emoji>",
      "priority": "<high|medium|low>",
      "difficulty": "<quick|medium|challenging>",
      "estimatedMinutes": <number>,
      "tips": ["<helpful practical tip 1>", "<helpful practical tip 2>"],
      "subtasks": [
        {"title": "<tiny specific action 1>"},
        {"title": "<tiny specific action 2>"},
        {"title": "<tiny specific action 3>"}
      ]
    }
  ]
}

Example task with proper detail:
{
  "title": "Clear the desk surface",
  "description": "Remove everything from your desk and sort into 4 piles: (1) trash, (2) belongs elsewhere, (3) needs action, (4) stays on desk. Put trash in bin, relocate items to their homes, and only return essential items to desk.",
  "emoji": "📝",
  "priority": "high",
  "difficulty": "medium",
  "estimatedMinutes": 12,
  "tips": ["Take a before photo to see your progress later!", "If you haven't used something in 6 months, it probably doesn't need to be on your desk"],
  "subtasks": [
    {"title": "Clear everything off the desk onto the floor or bed"},
    {"title": "Throw away obvious trash (wrappers, old papers)"},
    {"title": "Put dishes in the kitchen"},
    {"title": "Return books to bookshelf"},
    {"title": "Only put back: computer, one plant, lamp, and current project"}
  ]
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
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Parse AI response into structured data
function parseAIResponse(responseText: string): AIAnalysisResult {
  try {
    // Try to extract JSON from the response
    let jsonStr = responseText;

    // Handle markdown code blocks
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);

    // Transform tasks to include IDs
    const tasks: CleaningTask[] = (parsed.tasks || []).map((task: any) => ({
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
      })),
    }));

    return {
      messLevel: Math.min(100, Math.max(0, parsed.messLevel || 50)),
      summary: parsed.summary || 'Room analyzed successfully.',
      encouragement: parsed.encouragement || "You've got this! Every small step counts.",
      tasks,
      quickWins: parsed.quickWins || [],
      estimatedTotalTime: parsed.estimatedTotalTime || tasks.reduce((acc, t) => acc + t.estimatedMinutes, 0),
      roomType: parsed.roomType as RoomType,
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    console.log('Raw response:', responseText);

    // Return a fallback response
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

// Default tasks when AI analysis fails - with detailed instructions
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
        { id: generateId(), title: 'Grab a trash bag or use a small bin', completed: false },
        { id: generateId(), title: 'Walk clockwise around the room', completed: false },
        { id: generateId(), title: 'Toss any obvious garbage', completed: false },
      ],
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
        { id: generateId(), title: 'Remove everything from the surface', completed: false },
        { id: generateId(), title: 'Wipe the surface clean', completed: false },
        { id: generateId(), title: 'Throw away trash items', completed: false },
        { id: generateId(), title: 'Put items that belong elsewhere in their homes', completed: false },
        { id: generateId(), title: 'Return only essentials to the surface', completed: false },
      ],
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
        { id: generateId(), title: 'Check all surfaces for dishes and cups', completed: false },
        { id: generateId(), title: 'Stack dishes carefully', completed: false },
        { id: generateId(), title: 'Bring everything to the kitchen sink', completed: false },
      ],
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
        { id: generateId(), title: 'Gather all clothes from floor and furniture', completed: false },
        { id: generateId(), title: 'Create 3 piles: clean, dirty, donate', completed: false },
        { id: generateId(), title: 'Put dirty clothes in hamper', completed: false },
        { id: generateId(), title: 'Hang or fold clean clothes', completed: false },
        { id: generateId(), title: 'Bag up donate pile', completed: false },
      ],
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
        { id: generateId(), title: 'Straighten the fitted sheet', completed: false },
        { id: generateId(), title: 'Pull up the top sheet and blanket', completed: false },
        { id: generateId(), title: 'Arrange pillows at the head', completed: false },
      ],
    },
  ];
}

// Main analysis function - analyzes an image of a room
export async function analyzeRoomImage(
  base64Image: string,
  additionalContext?: string
): Promise<AIAnalysisResult> {
  const apiKey = getActiveApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Please add your API key in Settings.');
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

  const requestBody = {
    contents: [
      {
        parts: [
          { text: DECLUTTER_SYSTEM_PROMPT },
          { text: userPrompt },
          createImagePart(base64Image),
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 8192, // Gemini 3 Pro supports up to 32K output
    },
  };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const rawMessage = errorData.error?.message || `API request failed with status ${response.status}`;
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
  completedTasks: string[];
  remainingTasks: string[];
  encouragement: string;
}> {
  const apiKey = getActiveApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Please add your API key in Settings.');
  }

  // Check rate limit
  if (!apiRateLimiter.canMakeRequest()) {
    return {
      progressPercentage: 50,
      completedTasks: ['Made visible progress'],
      remainingTasks: ['Continue with remaining tasks'],
      encouragement: "You're doing great! Every bit of progress counts!",
    };
  }

  const progressPrompt = `Compare these two images of the same room. The first image is "before" and the second is "after" cleaning.

Analyze the progress made and respond with JSON:
{
  "progressPercentage": <0-100>,
  "completedTasks": ["<what was cleaned/organized>"],
  "remainingTasks": ["<what still needs work>"],
  "encouragement": "<celebrate their progress!>"
}

Be very encouraging! Focus on what WAS accomplished, not what wasn't.`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: progressPrompt },
          { text: 'Before image:' },
          createImagePart(beforeImage),
          { text: 'After image:' },
          createImagePart(afterImage),
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(sanitizeErrorMessage(new Error(`API request failed with status ${response.status}`)));
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    // Parse JSON from response
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);

    return {
      progressPercentage: parsed.progressPercentage || 50,
      completedTasks: parsed.completedTasks || [],
      remainingTasks: parsed.remainingTasks || [],
      encouragement: parsed.encouragement || 'Great progress! Keep going!',
    };
  } catch (error) {
    if (__DEV__) {
      console.error('Progress analysis error:', sanitizeErrorMessage(error));
    }
    return {
      progressPercentage: 50,
      completedTasks: ['Made visible progress'],
      remainingTasks: ['Continue with remaining tasks'],
      encouragement: "You're doing great! Every bit of progress counts!",
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

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
