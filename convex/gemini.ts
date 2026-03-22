import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, query } from "./_generated/server";

// ─────────────────────────────────────────────────────────────────────────────
// Rate limiting constants
// ─────────────────────────────────────────────────────────────────────────────
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const FREE_ANALYSIS_LIMIT = 10;
const PREMIUM_ANALYSIS_LIMIT = 50;
const ANONYMOUS_ANALYSIS_LIMIT = 2; // Strict limit for unauthenticated onboarding scans
const ANONYMOUS_WINDOW_MS = 60 * 60 * 1000; // 1 hour window for anonymous

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3-flash-preview";
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

const DECLUTTER_SYSTEM_PROMPT = `You are a cleaning coach. Scan this room photo and find EVERYTHING that needs attention.

## HOW MANY TASKS?
Scale with how messy the room is:
- Clean room (messLevel 0-20): 2-4 tasks (maintenance stuff)
- Slightly messy (20-40): 5-8 tasks
- Messy (40-60): 8-15 tasks
- Very messy (60-80): 15-25 tasks — find EVERY item, pile, and surface
- Disaster (80-100): 25+ tasks — scan every corner, every surface, every pile. Miss NOTHING.

The messier the room, the more granular you should be. In a disaster room, "clothes on floor" is NOT one task — it's "pick up the shirts by the door and put them in the hamper", "grab the jeans near the bed and toss them in the hamper", "collect the socks under the desk and put them in the hamper" etc.

## BOUNDING BOXES (CRITICAL)
EVERY task MUST have a boundingBox showing WHERE in the photo that item is.
Coordinates are percentages of the image (0-100):
- x, y: top-left corner of the box
- width, height: size of the box

Be PRECISE with positions. Actually look at the photo layout:
- Items on the LEFT side of the photo → low x values (0-40)
- Items on the RIGHT side → high x values (60-100)
- Items near the TOP → low y values (0-30)
- Items near the BOTTOM/floor → high y values (60-100)
- Small items → small width/height (10-20)
- Large areas (like a messy desk) → larger width/height (25-45)

DON'T stack all boxes in the same spot. Spread them across the actual locations.

## TASK FORMAT
Write task titles in plain simple English. No arrows (→), no jargon.
- BAD: "Toss 3 water bottles → recycling"
- GOOD: "Pick up the water bottles and put them in recycling"
- BAD: "Collect crumpled papers from desk → trash"
- GOOD: "Throw away the papers on the desk"
- BAD: "Relocate displaced garments → hamper"
- GOOD: "Put the clothes on the floor into the hamper"

Use simple verbs: pick up, put away, throw away, wipe, stack, fold, hang up.
Name colors/materials when visible: "the red hoodie", "the blue mug".
Keep titles under 10 words when possible.

## OUTPUT — valid JSON only:
{
  "summary": "One sentence about the room",
  "encouragement": "Short warm message (never judgmental)",
  "messLevel": 0-100,
  "estimatedTotalTime": total_minutes,
  "tasks": [
    {
      "id": "task-1",
      "title": "Pick up the water bottles and put them in recycling",
      "description": "Plastic bottles by the nightstand",
      "emoji": "🗑️",
      "priority": "high|medium|low",
      "difficulty": "quick|medium|challenging",
      "estimatedMinutes": 2,
      "phase": 1,
      "phaseName": "Quick Wins",
      "visualImpact": "high|medium|low",
      "category": "trash_removal|surface_clearing|dishes|laundry|organization",
      "boundingBox": {"x": 10, "y": 60, "width": 20, "height": 15}
    }
  ]
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

// Internal mutation to update rate limit counters atomically
export const _updateRateLimitCounter = internalMutation({
  args: {
    userId: v.id("users"),
    newCount: v.number(),
    windowStart: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      aiAnalysisCount: args.newCount,
      aiAnalysisWindowStart: args.windowStart,
    });
  },
});

/**
 * Atomic rate limit check + increment. Reads current counter, checks limit,
 * increments if under limit, throws if over. This prevents the TOCTOU race
 * condition where the check and increment were separate non-atomic operations.
 */
export const _checkAndIncrementRateLimit = internalMutation({
  args: {
    userId: v.id("users"),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const now = Date.now();
    const windowStart = user.aiAnalysisWindowStart ?? 0;
    const count = user.aiAnalysisCount ?? 0;
    const windowExpired = now - windowStart >= RATE_LIMIT_WINDOW_MS;
    const currentCount = windowExpired ? 0 : count;

    if (currentCount >= args.limit) {
      const resetAt = new Date(windowStart + RATE_LIMIT_WINDOW_MS);
      const hours = resetAt.getUTCHours();
      const mins = String(resetAt.getUTCMinutes()).padStart(2, '0');
      throw new Error(
        `You've reached your daily scan limit (${args.limit} scans). Try again after ${hours}:${mins} UTC.`
      );
    }

    // Atomically increment
    await ctx.db.patch(args.userId, {
      aiAnalysisCount: currentCount + 1,
      aiAnalysisWindowStart: windowExpired ? now : windowStart,
    });

    return { currentCount: currentCount + 1 };
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
    timeAvailable: v.optional(v.number()),   // minutes user has
    focusArea: v.optional(v.string()),        // specific area user wants tackled first
  },
  handler: async (ctx, args) => {
    // ── Authentication ──────────────────────────────────────────────────────
    const userId = await getAuthUserId(ctx);

    // ── Image size limit (Task 4) ───────────────────────────────────────────
    // 10MB in base64 chars (~7.5MB actual image). Reject oversized payloads.
    const MAX_BASE64_LENGTH = 10 * 1024 * 1024;
    if (args.base64Image.length > MAX_BASE64_LENGTH) {
      throw new Error(
        "Image is too large. Please use a smaller image (max ~7.5 MB)."
      );
    }

    // ── Rate limiting (atomic check + increment) ────────────────────────────
    if (userId) {
      const user = await ctx.runQuery(internal.users._getById, { id: userId });
      if (user) {
        const isPremium = user.subscriptionStatus === "active" || user.subscriptionStatus === "trial";
        const limit = isPremium ? PREMIUM_ANALYSIS_LIMIT : FREE_ANALYSIS_LIMIT;

        // Atomic: read counter, check limit, increment — all in one mutation
        await ctx.runMutation(internal.gemini._checkAndIncrementRateLimit, {
          userId,
          limit,
        });
      }
    }

    // ── API key ─────────────────────────────────────────────────────────────
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key not configured on server.");
    }

    const sanitizedContext = args.additionalContext
      ? args.additionalContext.slice(0, 2000).replace(/[<>{}]/g, "")
      : undefined;

    const userPrompt = `Look at this room photo and tell me what to clean. Give me 5-8 simple tasks, easiest first.${args.roomType ? ` Room type: ${args.roomType}.` : ""}${sanitizedContext ? ` ${sanitizedContext}` : ""}`;

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
        temperature: 0.4,
        topP: 0.95,
        maxOutputTokens: 4096,
        response_mime_type: "application/json",
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
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthenticated");
    }

    // ── Rate limiting (shares same counter as analyzeRoom) ──────────────
    const user = await ctx.runQuery(internal.users._getById, { id: userId });
    if (user) {
      const isPremium = user.subscriptionStatus === "active" || user.subscriptionStatus === "trial";
      const limit = isPremium ? PREMIUM_ANALYSIS_LIMIT : FREE_ANALYSIS_LIMIT;
      await ctx.runMutation(internal.gemini._checkAndIncrementRateLimit, {
        userId,
        limit,
      });
    }

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
        temperature: 0.5,
        maxOutputTokens: 4096,
        response_mime_type: "application/json",
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
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthenticated");
    }

    // ── Rate limiting (shares same counter as analyzeRoom) ──────────────
    const user = await ctx.runQuery(internal.users._getById, { id: userId });
    if (user) {
      const isPremium = user.subscriptionStatus === "active" || user.subscriptionStatus === "trial";
      const limit = isPremium ? PREMIUM_ANALYSIS_LIMIT : FREE_ANALYSIS_LIMIT;
      await ctx.runMutation(internal.gemini._checkAndIncrementRateLimit, {
        userId,
        limit,
      });
    }

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
          generationConfig: { temperature: 0.9, maxOutputTokens: 2048 },
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
  if (!text) return "{}";

  // Try markdown first
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) return match[1].trim();

  // Fallback: find first { and last } — helps if model is chatty outside blocks
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.substring(firstBrace, lastBrace + 1);
  }

  return text.trim() || "{}";
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

const VALID_VISUAL_IMPACTS = ['high', 'medium', 'low'] as const;
const VALID_ENERGY_LEVELS = ['minimal', 'low', 'moderate', 'high'] as const;
const VALID_DECISION_LOADS = ['none', 'low', 'medium', 'high'] as const;
const VALID_PRIORITIES = ['high', 'medium', 'low'] as const;
const VALID_DIFFICULTIES = ['quick', 'medium', 'challenging'] as const;

function validateTask(task: any): any {
  return {
    ...task,
    phase: typeof task.phase === 'number' ? Math.max(1, Math.min(task.phase, 3)) : 1,
    estimatedMinutes: typeof task.estimatedMinutes === 'number' ? Math.max(1, Math.min(task.estimatedMinutes, 480)) : 5,
    priority: (VALID_PRIORITIES as readonly string[]).includes(task.priority) ? task.priority : 'medium',
    difficulty: (VALID_DIFFICULTIES as readonly string[]).includes(task.difficulty) ? task.difficulty : 'medium',
    visualImpact: (VALID_VISUAL_IMPACTS as readonly string[]).includes(task.visualImpact) ? task.visualImpact : (task.phase === 1 ? 'high' : task.phase === 2 ? 'medium' : 'low'),
    energyRequired: (VALID_ENERGY_LEVELS as readonly string[]).includes(task.energyRequired) ? task.energyRequired : 'moderate',
    decisionLoad: (VALID_DECISION_LOADS as readonly string[]).includes(task.decisionLoad) ? task.decisionLoad : 'medium',
    subtasks: (task.subtasks ?? []).map((st: any) => ({
      ...st,
      estimatedSeconds: typeof st.estimatedSeconds === 'number' ? Math.max(5, Math.min(st.estimatedSeconds, 3600)) : 60,
    })),
  };
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

    // Process tasks with phase information and validate AI output
    const tasks = (parsed.tasks ?? []).map((task: any, i: number) => {
      const raw = {
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
        subtasks: (task.subtasks ?? []).map((st: any, subtaskIndex: number) => ({
          id: st.id ?? `subtask-${i}-${subtaskIndex}`,
          title: st.title,
          completed: false,
          estimatedSeconds: st.estimatedSeconds,
          estimatedMinutes: st.estimatedMinutes ?? (st.estimatedSeconds ? Math.round((st.estimatedSeconds / 60) * 10) / 10 : undefined),
          isCheckpoint: st.isCheckpoint,
        })),
        dependencies: task.dependencies,
        enables: task.enables,
        parallelWith: task.parallelWith,
        order: i,
      };
      // Validate and clamp AI-generated fields to safe ranges
      return validateTask(raw);
    });

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
      estimatedTotalTime: Math.max(1, Math.min(
        parsed.estimatedTotalTime ??
        tasks.reduce((s: number, t: any) => s + (t.estimatedMinutes ?? 5), 0),
        1440 // Cap at 24 hours
      )),
      taskClusters: parsed.taskClusters ?? [],
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
