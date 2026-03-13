import { v } from "convex/values";
import { action, query } from "./_generated/server";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_API_URL = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent`;

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
IMPORTANT: Scale the number of tasks based on the messLevel you assessed:
- messLevel < 40 (light mess): Generate 4-6 tasks, each with 3-5 subtasks
- messLevel 40-70 (moderate mess): Generate 6-10 tasks, each with 4-6 subtasks
- messLevel > 70 (heavy mess): Generate 10-15 tasks, each with 5-8 MICRO-STEPS (even tinier actions for overwhelmed users)

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
- Be a single, clear physical action

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

const PROGRESS_PROMPT = `Compare these two images of the same room. The first image is "before" and the second is "after" cleaning.

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

// Check if Gemini API key is configured (query for client to check)
export const isConfigured = query({
  args: {},
  handler: async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    return !!apiKey && apiKey.length > 0;
  },
});

// Analyze a room image using Gemini
export const analyzeRoom = action({
  args: {
    base64Image: v.string(),
    additionalContext: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key not configured on server.");
    }

    const sanitizedContext = args.additionalContext
      ? args.additionalContext.slice(0, 500).replace(/[<>{}]/g, "")
      : undefined;

    const userPrompt = sanitizedContext
      ? `Analyze this room and create a decluttering plan. Additional context: ${sanitizedContext}`
      : "Analyze this room and create a decluttering plan. Be encouraging and break tasks into small, manageable steps.";

    // Remove data URL prefix if present
    const base64Data = args.base64Image.includes("base64,")
      ? args.base64Image.split("base64,")[1]
      : args.base64Image;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: DECLUTTER_SYSTEM_PROMPT },
            { text: userPrompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: "image/jpeg",
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 16384,
      },
    };

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData.error?.message || `API error ${response.status}`;
      throw new Error(sanitizeError(msg));
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error("No response from Gemini. Please try again.");
    }

    return parseAnalysisResponse(responseText);
  },
});

// Analyze progress between before/after photos
export const analyzeProgress = action({
  args: {
    beforeImage: v.string(),
    afterImage: v.string(),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        progressPercentage: 50,
        percentImproved: 50,
        completedTasks: ["Made visible progress"],
        areasImproved: ["Made visible progress"],
        remainingTasks: ["Continue with remaining tasks"],
        areasRemaining: ["Continue with remaining tasks"],
        encouragement: "You're doing great! Every bit of progress counts!",
        encouragingMessage: "You're doing great! Every bit of progress counts!",
      };
    }

    const strip = (b64: string) =>
      b64.includes("base64,") ? b64.split("base64,")[1] : b64;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: PROGRESS_PROMPT },
            { text: "Before image:" },
            { inlineData: { data: strip(args.beforeImage), mimeType: "image/jpeg" } },
            { text: "After image:" },
            { inlineData: { data: strip(args.afterImage), mimeType: "image/jpeg" } },
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
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API error ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const jsonStr = extractJson(text);
      const parsed = JSON.parse(jsonStr);

      const progressPct = parsed.progressPercentage ?? parsed.percentImproved ?? 50;
      const completed = parsed.completedTasks ?? [];
      const remaining = parsed.remainingTasks ?? [];
      const msg = parsed.encouragement ?? parsed.encouragingMessage ?? "Great progress!";

      return {
        progressPercentage: progressPct,
        percentImproved: parsed.percentImproved ?? progressPct,
        completedTasks: completed,
        areasImproved: parsed.areasImproved ?? completed,
        remainingTasks: remaining,
        areasRemaining: parsed.areasRemaining ?? remaining,
        encouragement: msg,
        encouragingMessage: parsed.encouragingMessage ?? msg,
      };
    } catch {
      return {
        progressPercentage: 50,
        percentImproved: 50,
        completedTasks: ["Made visible progress"],
        areasImproved: ["Made visible progress"],
        remainingTasks: ["Continue with remaining tasks"],
        areasRemaining: ["Continue with remaining tasks"],
        encouragement: "You're doing great! Every bit of progress counts!",
        encouragingMessage: "You're doing great! Every bit of progress counts!",
      };
    }
  },
});

// Get a motivational message
export const getMotivation = action({
  args: {
    context: v.string(),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return getRandomMotivation();

    const sanitizedContext = args.context.slice(0, 200).replace(/[<>{}]/g, "");

    try {
      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a supportive friend helping someone clean their space. They might be feeling overwhelmed or unmotivated. Give them a short (1-2 sentences), warm, encouraging message. Context: ${sanitizedContext}. Be genuine, not cheesy.`,
                },
              ],
            },
          ],
          generationConfig: { temperature: 0.9, maxOutputTokens: 100 },
        }),
      });

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || getRandomMotivation();
    } catch {
      return getRandomMotivation();
    }
  },
});

// --- Helpers ---

function extractJson(text: string): string {
  const match = text?.match(/```(?:json)?\s*([\s\S]*?)```/);
  return match ? match[1].trim() : (text || "{}");
}

function repairJson(jsonStr: string): string {
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escapeNext = false;

  for (const char of jsonStr) {
    if (escapeNext) { escapeNext = false; continue; }
    if (char === "\\" && inString) { escapeNext = true; continue; }
    if (char === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (char === "{") openBraces++;
    else if (char === "}") openBraces--;
    else if (char === "[") openBrackets++;
    else if (char === "]") openBrackets--;
  }

  let repaired = jsonStr;
  if (inString) repaired += '"';
  repaired = repaired.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"{}[\]]*$/, "");
  repaired = repaired.replace(/,\s*$/, "");
  for (let i = 0; i < openBrackets; i++) repaired += "]";
  for (let i = 0; i < openBraces; i++) repaired += "}";
  return repaired;
}

function parseAnalysisResponse(responseText: string) {
  try {
    const jsonStr = extractJson(responseText);
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = JSON.parse(repairJson(jsonStr));
    }

    return {
      photoQuality: parsed.photoQuality ?? null,
      messLevel: Math.min(100, Math.max(0, parsed.messLevel ?? 50)),
      summary: parsed.summary ?? "Room analyzed successfully.",
      encouragement: parsed.encouragement ?? "You've got this!",
      roomType: parsed.roomType ?? null,
      zones: parsed.zones ?? [],
      detectedObjects: parsed.detectedObjects ?? [],
      tasks: (parsed.tasks ?? []).map((task: any, i: number) => ({
        title: task.title ?? "Task",
        description: task.description ?? "",
        emoji: task.emoji ?? "📋",
        priority: task.priority ?? "medium",
        difficulty: task.difficulty ?? "medium",
        estimatedMinutes: task.estimatedMinutes ?? 5,
        zone: task.zone,
        targetObjects: task.targetObjects,
        destination: task.destination,
        category: task.category,
        energyRequired: task.energyRequired,
        decisionLoad: task.decisionLoad,
        visualImpact: task.visualImpact,
        whyThisMatters: task.whyThisMatters ?? "Every small action makes a difference in creating a calmer space.",
        resistanceHandler: task.resistanceHandler ?? "Just start with the first subtask. You can stop after that if you want.",
        suppliesNeeded: task.suppliesNeeded ?? [],
        tips: task.tips ?? [],
        subtasks: (task.subtasks ?? []).map((st: any) => ({
          title: st.title,
          estimatedSeconds: st.estimatedSeconds,
          estimatedMinutes: st.estimatedMinutes ?? (st.estimatedSeconds ? Math.round((st.estimatedSeconds / 60) * 10) / 10 : undefined),
          isCheckpoint: st.isCheckpoint,
        })),
        dependencies: task.dependencies,
        enables: task.enables,
        parallelWith: task.parallelWith,
        order: i,
      })),
      taskGraph: parsed.taskGraph ?? null,
      timeProfiles: parsed.timeProfiles ?? null,
      energyProfiles: parsed.energyProfiles ?? null,
      quickWins: parsed.quickWins ?? [],
      decisionPoints: parsed.decisionPoints ?? [],
      estimatedTotalTime:
        parsed.estimatedTotalTime ??
        (parsed.tasks ?? []).reduce((s: number, t: any) => s + (t.estimatedMinutes ?? 5), 0),
    };
  } catch {
    return {
      photoQuality: null,
      messLevel: 50,
      summary: "Unable to fully analyze the image.",
      encouragement: "Let's start with some basic cleaning tasks!",
      roomType: null,
      zones: [],
      detectedObjects: [],
      tasks: [],
      taskGraph: null,
      timeProfiles: null,
      energyProfiles: null,
      quickWins: [],
      decisionPoints: [],
      estimatedTotalTime: 30,
    };
  }
}

function sanitizeError(msg: string): string {
  if (/api.?key/i.test(msg)) return "API configuration error.";
  if (/quota|rate.?limit/i.test(msg)) return "Too many requests. Try again shortly.";
  if (/network|fetch/i.test(msg)) return "Network error. Check your connection.";
  return "Analysis failed. Please try again.";
}

function getRandomMotivation(): string {
  const msgs = [
    "You don't have to do everything today. Just start with one small thing.",
    "Progress over perfection. Every item you put away is a win!",
    "Your future self will thank you for whatever you do right now.",
    "It's okay if it's not perfect. Done is better than perfect.",
    "You're stronger than the mess. Let's tackle this together!",
    "10 minutes is better than 0 minutes. What can you do in just 10 minutes?",
    "The hardest part is starting. You've already done that by being here!",
    "Celebrate every small win. You're making progress!",
  ];
  return msgs[Math.floor(Math.random() * msgs.length)];
}
