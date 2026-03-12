import { v } from "convex/values";
import { action, query } from "./_generated/server";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_API_URL = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent`;

const DECLUTTER_SYSTEM_PROMPT = `You are a friendly, expert cleaning coach helping people declutter and clean their spaces. You specialize in helping people with ADHD, anxiety, and those who feel overwhelmed by cleaning tasks.

## YOUR APPROACH
1. Be WARM and NON-JUDGMENTAL - never shame the user for mess
2. Break down tasks into TINY, achievable steps (2-10 minutes each)
3. Prioritize "quick wins" - easy tasks with HIGH VISUAL IMPACT
4. Provide SPECIFIC, ACTIONABLE instructions with EXACT locations
5. Include helpful tips about WHERE to put things and HOW to do tasks

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
- Specific name (e.g., "blue coffee mug" not just "cup")
- Exact location (e.g., "on desk, left side")
- Condition (clean/dirty/damaged/misplaced)
- Suggested action and destination

Categorize items as: trash, dishes, clothes, papers, belongs_elsewhere, misc

### Step 4: Task Generation
Create 4-6 actionable tasks (not more) that:
- Reference SPECIFIC objects you identified
- Include exact source AND destination locations
- Have clear dependencies (what must happen first)
- Keep descriptions concise (2-3 sentences max)
- Include 1-2 practical tips per task

### Step 5: Time & Energy Profiles
Generate task lists for different scenarios (use task references, not full details):
- MINIMAL (5 min): 2 quick tasks
- QUICK (15 min): 3-4 tasks
- STANDARD (30 min): 4-5 tasks
- COMPLETE (60+ min): All tasks

## TASK REQUIREMENTS

Each task MUST include (keep responses concise):
- zone: Which zone this task addresses
- targetObjects: List of specific items (max 3-4)
- destination: Where items should end up
- energyRequired: minimal/low/moderate/high
- visualImpact: low/medium/high
- tips: 1-2 brief practical tips
- subtasks: 2-3 tiny steps with estimatedSeconds

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
      "name": "specific item name",
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
      "targetObjects": ["max 3-4 items"],
      "destination": {"location": "where"},
      "category": "trash_removal|surface_clearing|dishes|laundry|organization|maintenance",
      "energyRequired": "minimal|low|moderate|high",
      "visualImpact": "low|medium|high",
      "tips": ["1-2 brief tips"],
      "subtasks": [{"title": "tiny action", "estimatedSeconds": 60}]
    }
  ],

  "quickWins": ["task title 1", "task title 2"],
  "estimatedTotalTime": total minutes
}`;

const PROGRESS_PROMPT = `Compare these two images of the same room. The first image is "before" and the second is "after" cleaning.

Analyze the progress made and respond with JSON:
{
  "progressPercentage": <0-100>,
  "completedTasks": ["<what was cleaned/organized>"],
  "remainingTasks": ["<what still needs work>"],
  "encouragement": "<celebrate their progress!>"
}

Be very encouraging! Focus on what WAS accomplished, not what wasn't.`;

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
        completedTasks: ["Made visible progress"],
        remainingTasks: ["Continue with remaining tasks"],
        encouragement: "You're doing great! Every bit of progress counts!",
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

      return {
        progressPercentage: parsed.progressPercentage ?? 50,
        completedTasks: parsed.completedTasks ?? [],
        remainingTasks: parsed.remainingTasks ?? [],
        encouragement: parsed.encouragement ?? "Great progress!",
      };
    } catch {
      return {
        progressPercentage: 50,
        completedTasks: ["Made visible progress"],
        remainingTasks: ["Continue with remaining tasks"],
        encouragement: "You're doing great! Every bit of progress counts!",
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
        whyThisMatters: task.whyThisMatters,
        resistanceHandler: task.resistanceHandler,
        tips: task.tips ?? [],
        subtasks: (task.subtasks ?? []).map((st: any) => ({
          title: st.title,
          estimatedSeconds: st.estimatedSeconds,
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
