import { v } from "convex/values";
import { action, query } from "./_generated/server";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_API_URL = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent`;

// Phase definitions for consistent naming
const PHASE_DEFINITIONS = {
  1: {
    number: 1,
    name: "Operation Floor Rescue",
    funName: "Quick Wins",
    description: "Clear the obvious stuff first for instant dopamine",
  },
  2: {
    number: 2,
    name: "Counter Strike",
    funName: "Surface Level",
    description: "Clear flat surfaces and regain control of your space",
  },
  3: {
    number: 3,
    name: "The Final Sparkle",
    funName: "Deep Clean",
    description: "Organization and finishing touches — only if energy allows!",
  },
} as const;

// Energy level to task count mapping
const ENERGY_TASK_LIMITS = {
  exhausted: { phases: [1], taskCount: 3, description: "3 quick wins only" },
  low: { phases: [1, 2], taskCount: 5, description: "5 tasks across 2 phases" },
  moderate: { phases: [1, 2], taskCount: 8, description: "8 tasks across 2 phases" },
  high: { phases: [1, 2, 3], taskCount: 12, description: "full 3-phase plan" },
  hyperfocused: { phases: [1, 2, 3], taskCount: 15, description: "maximum tasks across all phases" },
} as const;

const DECLUTTER_SYSTEM_PROMPT = `You are a friendly, expert cleaning coach helping people declutter and clean their spaces. You specialize in helping people with ADHD, anxiety, and those who feel overwhelmed by cleaning tasks.

## YOUR APPROACH
1. Be WARM and NON-JUDGMENTAL - never shame the user for mess
2. Break down tasks into TINY, achievable steps - each subtask must be completable in UNDER 2 MINUTES
3. Prioritize "quick wins" - easy tasks with HIGH VISUAL IMPACT first for dopamine wins
4. Provide SPECIFIC, ACTIONABLE instructions with EXACT locations
5. Include specific object names from the photo (e.g., "blue coffee mug on desk" not "dishes")
6. Group tasks into PHASES for progressive cleaning

## PHASE-BASED TASK SYSTEM (CRITICAL)

All tasks MUST be assigned to one of three phases:

### Phase 1: "Operation Floor Rescue" (Quick Wins)
- Tasks with HIGHEST visual impact - instant dopamine!
- Clear obvious trash, pick up floor items, quick wins
- 3-5 tasks, each subtask under 2 minutes
- All tasks should have visualImpact: "high"
- Estimated total: 5-10 minutes

### Phase 2: "Counter Strike" (Surface Level)  
- Clear flat surfaces (tables, counters, desks)
- Group similar items together
- Medium-effort tasks that build on Phase 1 momentum
- 3-5 tasks
- Estimated total: 10-15 minutes

### Phase 3: "The Final Sparkle" (Deep Clean)
- Organization, putting things away properly
- Optional - user energy may run out (celebrate stopping early!)
- Higher-effort tasks requiring decisions
- 3-5 tasks
- Estimated total: 10-20 minutes

## ADAPTIVE DIFFICULTY (Based on User Energy)

Adjust task count based on the energy level provided:
- "exhausted" → Phase 1 ONLY (3 quick-win tasks max)
- "low" → Phase 1 + mini Phase 2 (5 tasks total)
- "moderate" → Phase 1 + Phase 2 (8 tasks total)
- "high" → All 3 phases (10-12 tasks)
- "hyperfocused" → All 3 phases (12-15 tasks)

## DOOM PILE DETECTION (IMPORTANT)

Look for "doom piles" - mixed stacks of random items that accumulate because decisions feel overwhelming. These are typically:
- Mixed papers, clothes, random objects in one pile
- Items that don't have a clear home
- Often in corners, on chairs, or by doors
- Visually chaotic and anxiety-inducing

For each doom pile found, provide:
- Exact location
- Description of what's in the pile
- A 3-step approach: trash, belongs elsewhere, needs decision
- Estimated time to sort

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

### Step 3: Object Detection & Doom Pile Identification
For EACH visible item that needs action, identify:
- Specific name with descriptors (e.g., "blue coffee mug" not just "cup", "crumpled red t-shirt" not just "clothes")
- Exact location (e.g., "on desk, left side near the monitor")
- Condition (clean/dirty/damaged/misplaced)
- Suggested action and destination

Categorize items as: trash, dishes, clothes, papers, belongs_elsewhere, misc

LOOK FOR DOOM PILES and document each one separately.

### Step 4: Phase-Based Task Generation
Generate tasks grouped by phase, scaled by energy level provided.

Each task MUST:
- Be assigned to phase 1, 2, or 3
- Reference SPECIFIC objects you identified by name
- Include exact source AND destination locations
- Include phase and phaseName fields
- Include mentalBenefit (how clearing this helps mental clarity)
- ALWAYS include whyThisMatters and resistanceHandler
- Include suppliesNeeded

Phase 1 tasks ALWAYS have visualImpact: "high"
Phase 2 tasks have visualImpact: "medium" to "high"
Phase 3 tasks can have visualImpact: "low" to "medium"

Each SUBTASK must:
- Be completable in UNDER 2 MINUTES (120 seconds max)
- Include estimatedSeconds (30-120) AND estimatedMinutes (0.5-2)
- Be a single, clear physical action

### Step 5: Supply Checklist
Create a consolidated list of ALL supplies needed before starting.

## TASK REQUIREMENTS

Each task MUST include:
- phase: 1 | 2 | 3
- phaseName: "Operation Floor Rescue" | "Counter Strike" | "The Final Sparkle"
- zone: Which zone this task addresses
- targetObjects: List of specific items with descriptors (max 3-4)
- destination: Where items should end up
- energyRequired: minimal/low/moderate/high
- visualImpact: low/medium/high
- tips: 1-2 brief practical tips
- subtasks: Multiple tiny steps, each with estimatedSeconds AND estimatedMinutes
- whyThisMatters: Brief psychological benefit (REQUIRED)
- resistanceHandler: Pre-emptive response to "I don't want to do this" (REQUIRED)
- mentalBenefit: How completing this specifically helps mental clarity (REQUIRED)
- suppliesNeeded: List of supplies needed

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

  "doomPiles": [
    {
      "location": "corner by desk",
      "description": "Stack of mixed items - papers, clothes, random objects",
      "itemTypes": ["papers", "clothes", "misc"],
      "anxietyLevel": "high|medium|low",
      "recommendedApproach": "Sort into 3 piles: trash, belongs elsewhere, needs decision",
      "estimatedMinutes": 15,
      "linkedTaskIds": ["task-id referencing this doom pile"]
    }
  ],

  "phases": [
    {
      "number": 1,
      "name": "Operation Floor Rescue",
      "funName": "Quick Wins",
      "description": "Clear the obvious stuff first for instant dopamine",
      "estimatedMinutes": 10,
      "taskIds": ["task-id-1", "task-id-2"],
      "motivation": "Let's get some quick wins! You'll feel the difference immediately."
    },
    {
      "number": 2,
      "name": "Counter Strike",
      "funName": "Surface Level", 
      "description": "Clear flat surfaces and regain control of your space",
      "estimatedMinutes": 15,
      "taskIds": ["task-id-3", "task-id-4"],
      "motivation": "Surfaces clear = mind clear. You've got momentum now!"
    },
    {
      "number": 3,
      "name": "The Final Sparkle",
      "funName": "Deep Clean",
      "description": "Organization and finishing touches — only if energy allows!",
      "estimatedMinutes": 15,
      "taskIds": ["task-id-5"],
      "motivation": "You're crushing it! This is bonus territory. Stop anytime and still win."
    }
  ],

  "supplyChecklist": ["trash bag", "phone charger", "cleaning spray", "paper towels"],

  "tasks": [
    {
      "id": "task-1",
      "title": "Action verb + specific task",
      "description": "Brief instructions (2-3 sentences)",
      "emoji": "relevant emoji",
      "priority": "high|medium|low",
      "difficulty": "quick|medium|challenging",
      "estimatedMinutes": number,
      "phase": 1,
      "phaseName": "Operation Floor Rescue",
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
      "mentalBenefit": "Clearing this surface will reduce visual noise and help you focus",
      "suppliesNeeded": ["trash bag", "cleaning spray"]
    }
  ],

  "quickWins": ["task title 1", "task title 2"],
  "estimatedTotalTime": total minutes,
  
  "dustyReaction": "Ooh, I can already picture this space looking amazing! Let's do this together! 🐰✨"
}`;

const PROGRESS_PROMPT = `You are analyzing before and after photos of a room cleaning session. Compare these two images carefully.

## YOUR TASK
1. Identify SPECIFIC, VISIBLE changes between the photos
2. Name exact items that were removed, moved, or organized
3. Calculate a progress percentage with confidence level
4. Generate encouraging, specific feedback
5. Recommend Phase 2 tasks based on what's ACTUALLY remaining

## ANALYSIS GUIDELINES
- Be SPECIFIC: "The 4 coffee cups on the desk are gone!" not "dishes were cleaned"
- Look for: items removed, surfaces cleared, floor visible, organization improvement
- Note remaining clutter for Phase 2 recommendations
- Consider visual impact of changes (high impact = big visible difference)

## DUSTY REACTIONS (Include personality)
Generate reactions from Dusty the cleaning companion mascot:
- Enthusiastic and encouraging
- Never judgmental
- Celebrates specific wins
- Gets excited about visible floors and clear surfaces

## OUTPUT FORMAT
Respond with valid JSON:
{
  "progressPercentage": 0-100,
  "percentImproved": 0-100,
  "confidenceLevel": "high|medium|low",
  "confidenceReason": "why this confidence level",
  
  "specificChanges": [
    {
      "change": "The 4 coffee cups on the desk are gone",
      "location": "desk surface",
      "impactLevel": "high|medium|low",
      "celebrationWorthy": true
    }
  ],
  
  "completedTasks": ["specific thing 1 that was done", "specific thing 2"],
  "areasImproved": ["desk surface", "floor near bed"],
  
  "remainingClutter": [
    {
      "item": "pile of clothes on chair",
      "location": "office chair by desk",
      "suggestedAction": "move to laundry basket",
      "phase": 2,
      "estimatedMinutes": 3
    }
  ],
  
  "remainingTasks": ["clear the clothes from the chair", "organize desk drawer"],
  "areasRemaining": ["office chair", "desk drawer"],
  
  "phase2Recommendations": [
    {
      "title": "Action + specific items",
      "targetObjects": ["item 1", "item 2"],
      "estimatedMinutes": 5,
      "visualImpact": "medium"
    }
  ],
  
  "encouragement": "Specific, warm message celebrating their progress",
  "encouragingMessage": "Longer encouraging message with specific wins mentioned",
  
  "dustyReactions": {
    "mainReaction": "OH WOW! I can see the desk now! The 4 cups are GONE! 🐰✨",
    "floorVisible": true,
    "surfaceCleared": true,
    "celebrationLevel": "big|medium|small",
    "suggestedCelebration": "confetti|sparkles|dance"
  },
  
  "mindClarityBoost": "With that desk clear, you'll have so much less visual noise competing for your attention. Your brain thanks you!"
}

Be very encouraging! Focus on what WAS accomplished, not what wasn't. Name specific objects and areas that improved. Make Dusty's reactions enthusiastic and celebratory.`;

const MOTIVATION_PROMPT = `You are Dusty, a friendly dust bunny mascot helping someone with their cleaning journey. Generate a warm, personalized motivational message.

## CONTEXT PROVIDED
You'll receive:
- User's current energy level (exhausted/low/moderate/high/hyperfocused)
- Time since last cleaning activity
- Current streak status
- Mascot personality type (spark/bubbles/dusty/tidy)
- Any specific context about their situation

## PERSONALITY STYLES
- Spark: Energetic, uses lots of exclamation marks, very enthusiastic
- Bubbles: Calm and soothing, gentle encouragement, peaceful vibes
- Dusty: Silly and playful, uses puns, light-hearted humor
- Tidy: Organized and methodical, practical suggestions, structured

## MESSAGE GUIDELINES
- 1-3 sentences max
- Never guilt-trip or shame
- Acknowledge their energy level
- Be genuine, not cheesy
- Include a tiny actionable suggestion if appropriate
- Use personality-appropriate tone

## OUTPUT FORMAT
Respond with valid JSON:
{
  "message": "Your personalized message in Dusty's voice",
  "emoji": "🐰",
  "tone": "energetic|calm|playful|supportive",
  "suggestedAction": "optional: one tiny thing they could do",
  "celebratesReturn": true/false
}`;

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
    energyLevel: v.optional(v.union(
      v.literal("exhausted"),
      v.literal("low"),
      v.literal("moderate"),
      v.literal("high"),
      v.literal("hyperfocused")
    )),
    roomType: v.optional(v.string()),
    mascotPersonality: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key not configured on server.");
    }

    const energyLevel = args.energyLevel ?? "moderate";
    const energyConfig = ENERGY_TASK_LIMITS[energyLevel];
    
    const sanitizedContext = args.additionalContext
      ? args.additionalContext.slice(0, 500).replace(/[<>{}]/g, "")
      : undefined;

    const energyInstructions = `
## ENERGY LEVEL: ${energyLevel.toUpperCase()}
The user's current energy is "${energyLevel}". Based on this:
- Generate tasks for phases: ${energyConfig.phases.join(", ")} only
- Total task count: ${energyConfig.taskCount} tasks (${energyConfig.description})
- ${energyLevel === "exhausted" ? "Keep tasks EXTRA simple. Only Quick Wins. Celebrate any effort." : ""}
- ${energyLevel === "low" ? "Focus on high-impact, low-effort tasks. Minimize decisions." : ""}
- ${energyLevel === "hyperfocused" ? "User has energy! Include organization and deep clean tasks." : ""}
`;

    const roomTypeHint = args.roomType 
      ? `\nRoom type hint from user: ${args.roomType}`
      : "";

    const mascotHint = args.mascotPersonality
      ? `\nDusty's personality is "${args.mascotPersonality}" - adjust dustyReaction tone accordingly.`
      : "";

    const userPrompt = `Analyze this room and create a phased decluttering plan.
${energyInstructions}
${sanitizedContext ? `Additional context: ${sanitizedContext}` : ""}
${roomTypeHint}
${mascotHint}

Remember:
1. Group ALL tasks into phases (1, 2, or 3)
2. Phase 1 tasks must have visualImpact: "high" 
3. Include doomPiles array if any doom piles are visible
4. Include supplyChecklist with ALL needed supplies
5. Include mentalBenefit for each task
6. Generate a dustyReaction for the analysis`;

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
    completedPhase: v.optional(v.number()),
    mascotPersonality: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.GEMINI_API_KEY;
    
    const defaultResponse = {
      progressPercentage: 50,
      percentImproved: 50,
      confidenceLevel: "medium" as const,
      specificChanges: [],
      completedTasks: ["Made visible progress"],
      areasImproved: ["Made visible progress"],
      remainingClutter: [],
      remainingTasks: ["Continue with remaining tasks"],
      areasRemaining: ["Continue with remaining tasks"],
      phase2Recommendations: [],
      encouragement: "You're doing great! Every bit of progress counts!",
      encouragingMessage: "You're doing great! Every bit of progress counts!",
      dustyReactions: {
        mainReaction: "Looking good! Keep going! 🐰",
        floorVisible: false,
        surfaceCleared: false,
        celebrationLevel: "medium" as const,
        suggestedCelebration: "sparkles" as const,
      },
      mindClarityBoost: "Every cleared surface is less visual noise for your brain!",
    };

    if (!apiKey) {
      return defaultResponse;
    }

    const strip = (b64: string) =>
      b64.includes("base64,") ? b64.split("base64,")[1] : b64;

    const phaseContext = args.completedPhase
      ? `The user just completed Phase ${args.completedPhase}. Generate Phase ${args.completedPhase + 1} recommendations.`
      : "";

    const mascotContext = args.mascotPersonality
      ? `Dusty's personality is "${args.mascotPersonality}" - adjust reactions accordingly.`
      : "";

    const requestBody = {
      contents: [
        {
          parts: [
            { text: PROGRESS_PROMPT },
            { text: phaseContext },
            { text: mascotContext },
            { text: "Before image:" },
            { inlineData: { data: strip(args.beforeImage), mimeType: "image/jpeg" } },
            { text: "After image:" },
            { inlineData: { data: strip(args.afterImage), mimeType: "image/jpeg" } },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
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
        confidenceLevel: parsed.confidenceLevel ?? "medium",
        confidenceReason: parsed.confidenceReason,
        specificChanges: parsed.specificChanges ?? [],
        completedTasks: completed,
        areasImproved: parsed.areasImproved ?? completed,
        remainingClutter: parsed.remainingClutter ?? [],
        remainingTasks: remaining,
        areasRemaining: parsed.areasRemaining ?? remaining,
        phase2Recommendations: parsed.phase2Recommendations ?? [],
        encouragement: msg,
        encouragingMessage: parsed.encouragingMessage ?? msg,
        dustyReactions: parsed.dustyReactions ?? defaultResponse.dustyReactions,
        mindClarityBoost: parsed.mindClarityBoost ?? defaultResponse.mindClarityBoost,
      };
    } catch {
      return defaultResponse;
    }
  },
});

// Get a motivational message with full context awareness
export const getMotivation = action({
  args: {
    context: v.string(),
    energyLevel: v.optional(v.string()),
    daysSinceLastActivity: v.optional(v.number()),
    currentStreak: v.optional(v.number()),
    mascotPersonality: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const personality = args.mascotPersonality ?? "dusty";
      return { message: getPersonalityMotivation(personality), emoji: "🐰", tone: "supportive" };
    }

    const sanitizedContext = args.context.slice(0, 200).replace(/[<>{}]/g, "");
    
    const contextDetails = `
Context: ${sanitizedContext}
Energy Level: ${args.energyLevel ?? "unknown"}
Days Since Last Activity: ${args.daysSinceLastActivity ?? "unknown"}
Current Streak: ${args.currentStreak ?? 0} days
Dusty Personality: ${args.mascotPersonality ?? "dusty"}

${args.daysSinceLastActivity && args.daysSinceLastActivity > 2 
  ? "NOTE: User is returning after a break. Be extra welcoming and never guilt-trip. Celebrate that they came back!"
  : ""}
${args.energyLevel === "exhausted" 
  ? "NOTE: User is exhausted. Suggest ONE tiny thing or validate resting."
  : ""}
${args.currentStreak && args.currentStreak >= 7 
  ? "NOTE: User has a week+ streak! Celebrate this!"
  : ""}
`;

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
                { text: MOTIVATION_PROMPT },
                { text: contextDetails },
              ],
            },
          ],
          generationConfig: { temperature: 0.9, maxOutputTokens: 300 },
        }),
      });

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      try {
        const jsonStr = extractJson(text);
        const parsed = JSON.parse(jsonStr);
        return {
          message: parsed.message ?? getRandomMotivation(),
          emoji: parsed.emoji ?? "🐰",
          tone: parsed.tone ?? "supportive",
          suggestedAction: parsed.suggestedAction,
          celebratesReturn: parsed.celebratesReturn ?? false,
        };
      } catch {
        // If JSON parsing fails, return the text directly
        return { 
          message: text || getRandomMotivation(), 
          emoji: "🐰", 
          tone: "supportive" 
        };
      }
    } catch {
      return { message: getRandomMotivation(), emoji: "🐰", tone: "supportive" };
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

    // Process tasks with phase information
    const tasks = (parsed.tasks ?? []).map((task: any, i: number) => ({
      id: task.id ?? `task-${i + 1}`,
      title: task.title ?? "Task",
      description: task.description ?? "",
        emoji: task.emoji ?? "📋",
        priority: task.priority ?? "medium",
        difficulty: task.difficulty ?? "medium",
        estimatedMinutes: task.estimatedMinutes ?? 5,
        phase: task.phase ?? 1,
        phaseName: task.phaseName ?? PHASE_DEFINITIONS[task.phase as 1 | 2 | 3]?.name ?? "Operation Floor Rescue",
        zone: task.zone,
        targetObjects: task.targetObjects,
        destination: task.destination,
        category: task.category,
        energyRequired: task.energyRequired,
        decisionLoad: task.decisionLoad,
        visualImpact: task.visualImpact ?? (task.phase === 1 ? "high" : task.phase === 2 ? "medium" : "low"),
        whyThisMatters: task.whyThisMatters ?? "Every small action makes a difference in creating a calmer space.",
        resistanceHandler: task.resistanceHandler ?? "Just start with the first subtask. You can stop after that if you want.",
        mentalBenefit: task.mentalBenefit ?? "Clearing this will reduce visual clutter and help your mind feel calmer.",
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
      }));

    // Generate phases from tasks if not provided
    const phases = parsed.phases ?? generatePhasesFromTasks(tasks);

    // Process doom piles
    const doomPiles = (parsed.doomPiles ?? []).map((pile: any) => ({
      location: pile.location ?? "unknown location",
      description: pile.description ?? "Mixed pile of items",
      itemTypes: pile.itemTypes ?? [],
      anxietyLevel: pile.anxietyLevel ?? "medium",
      recommendedApproach: pile.recommendedApproach ?? "Sort into 3 piles: trash, belongs elsewhere, needs decision",
      estimatedMinutes: pile.estimatedMinutes ?? 15,
      linkedTaskIds: pile.linkedTaskIds ?? [],
    }));

    return {
      photoQuality: parsed.photoQuality ?? null,
      messLevel: Math.min(100, Math.max(0, parsed.messLevel ?? 50)),
      summary: parsed.summary ?? "Room analyzed successfully.",
      encouragement: parsed.encouragement ?? "You've got this!",
      roomType: parsed.roomType ?? null,
      zones: parsed.zones ?? [],
      detectedObjects: parsed.detectedObjects ?? [],
      doomPiles,
      phases,
      supplyChecklist: parsed.supplyChecklist ?? extractSuppliesFromTasks(tasks),
      tasks,
      taskGraph: parsed.taskGraph ?? null,
      timeProfiles: parsed.timeProfiles ?? null,
      energyProfiles: parsed.energyProfiles ?? null,
      quickWins: parsed.quickWins ?? tasks.filter((t: any) => t.phase === 1).map((t: any) => t.title),
      decisionPoints: parsed.decisionPoints ?? [],
      estimatedTotalTime:
        parsed.estimatedTotalTime ??
        tasks.reduce((s: number, t: any) => s + (t.estimatedMinutes ?? 5), 0),
      dustyReaction: parsed.dustyReaction ?? "Let's make this space shine! 🐰✨",
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
      doomPiles: [],
      phases: [
        {
          number: 1,
          name: "Operation Floor Rescue",
          funName: "Quick Wins",
          description: "Clear the obvious stuff first for instant dopamine",
          estimatedMinutes: 10,
          taskIds: [],
          motivation: "Let's start with some quick wins!",
        },
      ],
      supplyChecklist: [],
      tasks: [],
      taskGraph: null,
      timeProfiles: null,
      energyProfiles: null,
      quickWins: [],
      decisionPoints: [],
      estimatedTotalTime: 30,
      dustyReaction: "Let's get started! 🐰",
    };
  }
}

// Helper to generate phases from tasks if AI didn't provide them
function generatePhasesFromTasks(tasks: any[]): any[] {
  const phaseMap: { [key: number]: any[] } = { 1: [], 2: [], 3: [] };
  
  tasks.forEach((task: any) => {
    const phase = task.phase ?? 1;
    if (phaseMap[phase]) {
      phaseMap[phase].push(task.id ?? task.title);
    }
  });

  return Object.entries(PHASE_DEFINITIONS)
    .filter(([num]) => phaseMap[parseInt(num)]?.length > 0)
    .map(([num, def]) => ({
      number: def.number,
      name: def.name,
      funName: def.funName,
      description: def.description,
      estimatedMinutes: tasks
        .filter((t: any) => t.phase === def.number)
        .reduce((sum: number, t: any) => sum + (t.estimatedMinutes ?? 5), 0),
      taskIds: phaseMap[parseInt(num)],
      motivation: getPhaseMotivation(def.number),
    }));
}

// Helper to get phase-specific motivation
function getPhaseMotivation(phaseNumber: number): string {
  const motivations: { [key: number]: string } = {
    1: "Let's get some quick wins! You'll feel the difference immediately. 🚀",
    2: "Surfaces clear = mind clear. You've got momentum now! 💪",
    3: "You're crushing it! This is bonus territory. Stop anytime and still win. ✨",
  };
  return motivations[phaseNumber] ?? "Keep going, you've got this!";
}

// Helper to extract supplies from all tasks
function extractSuppliesFromTasks(tasks: any[]): string[] {
  const supplies = new Set<string>();
  tasks.forEach((task: any) => {
    (task.suppliesNeeded ?? []).forEach((supply: string) => {
      supplies.add(supply.toLowerCase());
    });
  });
  return Array.from(supplies);
}

function sanitizeError(msg: string): string {
  if (/api.?key/i.test(msg)) return "API configuration error.";
  if (/quota|rate.?limit/i.test(msg)) return "Too many requests. Try again shortly.";
  if (/network|fetch/i.test(msg)) return "Network error. Check your connection.";
  return "Analysis failed. Please try again.";
}

function getRandomMotivation(): string {
  const msgs = [
    "You don't have to do everything today. Just start with one small thing. 🐰",
    "Progress over perfection! Every item you put away is a win! ✨",
    "Your future self will thank you for whatever you do right now. 💪",
    "It's okay if it's not perfect. Done is better than perfect!",
    "You're stronger than the mess. Let's tackle this together! 🐰✨",
    "10 minutes is better than 0 minutes. What can you do in just 10 minutes?",
    "The hardest part is starting. You've already done that by being here! 🎉",
    "Celebrate every small win. You're making progress!",
    "Hey, even I started as a tiny dust bunny. Small steps are powerful! 🐰",
    "Your space doesn't have to be perfect to feel good. Let's just make it better!",
    "Coming back is harder than never stopping. You deserve credit for being here! 💛",
    "One task at a time. One surface at a time. One moment at a time.",
  ];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

// Personality-specific motivation messages
const PERSONALITY_MOTIVATIONS = {
  spark: [
    "LET'S GOOO! Even ONE task is going to feel AMAZING! ⚡✨",
    "Your energy is contagious! Let's channel it into some quick wins! 🚀",
    "I'm SO excited to help you today! What's our first target?! 🎯",
    "Every surface you clear is a victory dance waiting to happen! 💃",
  ],
  bubbles: [
    "Take a deep breath. We'll do this gently, together. 🫧",
    "One small step at a time. Your space will thank you. 💙",
    "There's no rush. Just be present with each small action. ✨",
    "Let's create a calm corner in your space today. 🌸",
  ],
  dusty: [
    "Did you hear about the broom that was tired? It was swept off its feet! 😄",
    "I may be a dust bunny, but even I can handle some decluttering! 🐰",
    "Let's make your floor visible again — I promise I don't bite! Maybe just nibble.",
    "Time to show this mess who's boss! (It's you. Obviously.) ✨",
  ],
  tidy: [
    "I've analyzed your space. Let's start with the highest-impact zone first. 📊",
    "Efficient decluttering = maximum results, minimum energy. Let's optimize!",
    "Step 1: Trash. Step 2: Belongs elsewhere. Step 3: Done. Simple! ✓",
    "Your productivity will increase 23% with a clear workspace. Let's do this! 📈",
  ],
} as const;

function getPersonalityMotivation(personality: string): string {
  const messages = PERSONALITY_MOTIVATIONS[personality as keyof typeof PERSONALITY_MOTIVATIONS] 
    ?? PERSONALITY_MOTIVATIONS.dusty;
  return messages[Math.floor(Math.random() * messages.length)];
}
