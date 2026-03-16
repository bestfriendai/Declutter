# Declutterly App - Comprehensive Improvement Analysis

## Multi-LLM Analysis: Gemini 3.0 Pro, Opus 4.5, and Codex Perspectives

**Document Purpose**: This document provides a detailed analysis of how to improve the Declutterly app's AI-powered room analysis and task generation system. Each section presents recommendations from the perspective of three different AI models, followed by concrete implementation strategies.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Gemini 3.0 Pro Perspective (Vision & Spatial Intelligence)](#gemini-30-pro-perspective)
4. [Opus 4.5 Perspective (Deep Reasoning & Psychology)](#opus-45-perspective)
5. [Codex Perspective (Implementation & Architecture)](#codex-perspective)
6. [Competitive Analysis](#competitive-analysis)
7. [Unified Implementation Roadmap](#unified-implementation-roadmap)
8. [Updated Prompt Engineering](#updated-prompt-engineering)
9. [New Data Structures](#new-data-structures)
10. [Priority Matrix](#priority-matrix)

---

## Executive Summary

The Declutterly app has a solid foundation but lacks the depth needed to truly help users transform messy spaces into organized environments. After analyzing the codebase and researching competitor apps (Tody, Sweepy, Clean AI), three major improvement areas emerge:

| Area | Current Gap | Impact |
|------|------------|--------|
| **Vision Analysis** | Generic room description, no object detection | Tasks are vague, not tied to specific visible items |
| **Task Intelligence** | Flat task list, no dependencies or zones | Users don't know WHERE to start or HOW tasks relate |
| **Behavioral Adaptation** | One-size-fits-all approach | Doesn't adapt to user's energy, time, or preferences |

---

## Current State Analysis

### What Works Well
- ADHD-friendly language and approach
- Subtask breakdown structure
- Quick wins prioritization
- Gamification elements (mascot, collectibles)
- Focus mode with ambient sounds

### Critical Gaps Identified

#### 1. Image Analysis Deficiencies
```
Current: "I see a messy bedroom with clothes on the floor"
Needed: "I see 3 piles of clothes (2 on floor near bed, 1 on chair), 
        5 items on nightstand (water bottle, phone charger, 2 books, tissues),
        unmade bed with 2 pillows displaced, desk with papers scattered"
```

#### 2. Task Generation Deficiencies
```
Current Task: "Pick up clothes from the floor"
Needed Task: {
  "title": "Gather clothes from floor near bed",
  "zone": "floor-left-of-bed",
  "objects": ["blue jeans", "white t-shirt", "gray sweater"],
  "destination": "Create 3 piles: hamper, closet, donate bag",
  "dependencies": ["Get hamper from closet first"],
  "decision_points": ["Check pockets before sorting"]
}
```

#### 3. Missing Contextual Intelligence
- No understanding of user's available time
- No energy level consideration
- No adaptation to cleaning history
- No room-specific cleaning knowledge

---

## Gemini 3.0 Pro Perspective

### Focus: Vision Understanding & Spatial Intelligence

### Current Gaps

1. **No Object Detection**: The current prompt asks for general analysis but doesn't instruct the AI to identify and locate specific objects.

2. **No Spatial Mapping**: Tasks like "clear the desk" don't specify WHICH desk or WHERE items should go.

3. **No Condition Assessment**: Items aren't evaluated for cleanliness state (dirty dishes vs. clean dishes that need putting away).

4. **Poor Lighting/Angle Handling**: No instructions for handling suboptimal photo conditions.

### Specific Improvements

#### A. Enhanced Object Detection Prompt Section
```markdown
## OBJECT DETECTION REQUIREMENTS

For each visible area, identify and list:

### 1. CLUTTER ITEMS (things that need action)
For each item, provide:
- name: Specific item name (e.g., "blue coffee mug" not just "cup")
- location: Precise location (e.g., "on desk, left side, near monitor")
- condition: clean | dirty | damaged | misplaced | unknown
- urgency: immediate (health/safety) | soon (visual clutter) | later (organization)
- suggested_action: specific action needed
- destination: where it should go

### 2. FIXED FEATURES (furniture, fixtures)
- Identify all surfaces that need clearing or cleaning
- Note storage options visible (shelves, drawers, closets)
- Identify "homes" for items (where things SHOULD go)

### 3. PROBLEM AREAS
- Areas with highest clutter density
- Safety hazards (tripping, fire, sanitation)
- Quick-win zones (small areas that will show big visual impact)
```

#### B. Spatial Zone Mapping
```json
{
  "zones": [
    {
      "id": "zone-floor-1",
      "name": "Floor area by bed",
      "bounds": "left side of room, between bed and wall",
      "clutter_density": "high",
      "items_count": 12,
      "estimated_clear_time": 8,
      "priority": "high",
      "reason": "Tripping hazard, first thing visible when entering"
    },
    {
      "id": "zone-desk-1", 
      "name": "Main desk surface",
      "bounds": "center of room, against window wall",
      "clutter_density": "medium",
      "items_count": 7,
      "estimated_clear_time": 5,
      "priority": "medium",
      "reason": "Work area functionality impaired"
    }
  ]
}
```

#### C. Photo Quality Handling
```markdown
## PHOTO ANALYSIS PROTOCOL

### Step 1: Assess Photo Quality
- Lighting: adequate | dim | overexposed
- Angle: good overview | partial view | obstructed
- Focus: clear | blurry | mixed
- Coverage: full room | partial room | single area

### Step 2: Adjust Analysis Accordingly
If photo quality is suboptimal:
- Note what areas are unclear and why
- Provide "probable" assessments for unclear areas
- Suggest a better photo angle if re-capture would help
- Focus detailed tasks on clearly visible areas

### Step 3: Request Additional Photos If Needed
If critical areas are not visible, include in response:
"additional_photos_suggested": [
  {"area": "closet interior", "reason": "Can't assess clothing storage options"},
  {"area": "under bed", "reason": "Possible hidden clutter affecting total time estimate"}
]
```

#### D. Visual Progress Indicators
```json
{
  "visual_markers": [
    {
      "description": "Pile of clothes on floor",
      "approximate_position": {"x": 0.2, "y": 0.7},
      "size": "medium",
      "color_hint": "mixed dark colors",
      "task_reference": "task-clothes-floor-1"
    }
  ],
  "before_after_comparison_points": [
    "Floor visibility percentage",
    "Desk surface clearance",
    "Bed made status"
  ]
}
```

### Implementation Notes (Gemini 3.0 Pro)

1. **Use Structured Output Mode**: Gemini supports JSON mode - enforce strict schema compliance.

2. **Multi-Pass Analysis**: 
   - Pass 1: Overall room assessment and zone identification
   - Pass 2: Detailed object detection per zone
   - Pass 3: Task generation with object references

3. **Confidence Scores**: Add confidence levels to object detection for unclear items.

---

## Opus 4.5 Perspective

### Focus: Deep Reasoning, Psychology & Task Logic

### Current Gaps

1. **No Task Dependencies**: Tasks are presented as independent when they often have prerequisites.

2. **No Decision Support**: Users with ADHD struggle with decisions - current app doesn't help with "keep vs. donate" choices.

3. **Missing Psychological Scaffolding**: No "why this matters" or emotional connection to tasks.

4. **Energy Blindness**: Same tasks suggested whether user has 10 minutes or 2 hours, high energy or exhausted.

### Specific Improvements

#### A. Task Dependency Graph
```json
{
  "tasks": [
    {
      "id": "task-1",
      "title": "Get trash bag from kitchen",
      "type": "setup",
      "dependencies": [],
      "enables": ["task-2", "task-5", "task-8"],
      "skip_if": "User confirms trash bag already available"
    },
    {
      "id": "task-2", 
      "title": "Quick trash sweep - visible garbage only",
      "type": "quick-win",
      "dependencies": ["task-1"],
      "enables": ["task-3"],
      "parallel_with": ["task-4"]
    },
    {
      "id": "task-3",
      "title": "Take full trash bag to bin",
      "type": "completion",
      "dependencies": ["task-2"],
      "triggers_when": "trash bag 75% full OR sweep complete"
    }
  ],
  "suggested_order": ["task-1", "task-2", "task-4", "task-3", "task-5"],
  "critical_path": ["task-1", "task-2", "task-6", "task-9"],
  "optional_tasks": ["task-11", "task-12"]
}
```

#### B. Decision Framework Integration
```json
{
  "decision_points": [
    {
      "id": "decision-clothes-1",
      "trigger": "When sorting clothes pile",
      "question": "For each item, ask: Have I worn this in the last 6 months?",
      "options": [
        {
          "answer": "Yes, and it's clean",
          "action": "Hang in closet or fold in drawer"
        },
        {
          "answer": "Yes, but it needs washing", 
          "action": "Put in hamper"
        },
        {
          "answer": "No, but I love it",
          "action": "Keep, but move to less accessible storage"
        },
        {
          "answer": "No, and I forgot I had it",
          "action": "Donate pile - don't overthink it!"
        }
      ],
      "adhd_tip": "Set a 5-second rule: if you hesitate more than 5 seconds, it goes in 'decide later' pile. You can revisit with fresh eyes.",
      "emotional_support": "Letting go of clothes isn't losing memories. The item served its purpose - thank it and release it."
    }
  ]
}
```

#### C. Energy-Adaptive Task Suggestions
```json
{
  "energy_profiles": {
    "exhausted": {
      "max_tasks": 3,
      "max_decisions": 1,
      "focus": "maintenance_only",
      "avoid": ["sorting", "organizing", "decision-heavy"],
      "suggested_tasks": [
        "Put 5 visible trash items in bag",
        "Put dishes in sink (don't wash)",
        "Make bed (just pull up covers)"
      ],
      "message": "You showed up, and that's what matters. These 3 tiny tasks will make tomorrow easier."
    },
    "low": {
      "max_tasks": 5,
      "max_decisions": 2,
      "focus": "quick_wins",
      "avoid": ["deep_cleaning", "reorganizing"],
      "time_limit": 15
    },
    "moderate": {
      "max_tasks": 10,
      "max_decisions": 5,
      "focus": "visible_impact",
      "include": ["surface_clearing", "basic_sorting"]
    },
    "high": {
      "max_tasks": "unlimited",
      "max_decisions": "unlimited", 
      "focus": "deep_work",
      "include": ["reorganizing", "deep_cleaning", "donation_sorting"],
      "challenge": "Try to complete the whole room! You've got the energy for it."
    }
  }
}
```

#### D. Psychological Scaffolding
```json
{
  "task_psychology": {
    "why_this_matters": {
      "trash_sweep": "Removing garbage is the fastest way to see progress. Your brain will register 'cleaner' even if nothing else changes.",
      "make_bed": "A made bed transforms a bedroom's energy. It's the #1 visual anchor that signals 'this is a cared-for space.'",
      "clear_surface": "Clear surfaces reduce visual noise, which reduces mental noise. Your brain will literally feel calmer."
    },
    "resistance_handlers": {
      "dont_want_to_start": "Just do the first subtask. That's it. Starting is the hardest part, and you've already done it by opening this app.",
      "overwhelmed": "Let's zoom in. Pick ONE zone - just that 2-foot square area. That's your whole world for the next 5 minutes.",
      "perfectionism": "Done is better than perfect. A 'good enough' clean room is infinitely better than a 'perfect' messy room.",
      "shame_spiral": "This mess doesn't define you. Every human's space gets messy. You're here now, and that's the only moment that matters."
    }
  }
}
```

#### E. Context Gathering Questions
```json
{
  "pre_analysis_questions": [
    {
      "question": "How much time do you have right now?",
      "options": ["5 minutes", "15 minutes", "30 minutes", "1 hour+", "Just browsing"],
      "affects": "task_count, depth_of_tasks"
    },
    {
      "question": "How's your energy level?",
      "options": ["Exhausted", "Low", "Okay", "Good", "Great!"],
      "affects": "task_difficulty, decision_load"
    },
    {
      "question": "What bothers you MOST about this space right now?",
      "type": "free_text",
      "affects": "task_priority, starting_point"
    },
    {
      "question": "Is anyone else coming over soon?",
      "options": ["Yes, within an hour", "Yes, today", "Yes, this week", "No"],
      "affects": "priority_of_visible_vs_hidden"
    }
  ]
}
```

### Implementation Notes (Opus 4.5)

1. **Build Dependency Graph**: Use directed acyclic graph (DAG) structure for tasks.

2. **Pre-Session Check-in**: Add a 30-second mood/energy check before showing tasks.

3. **Progressive Disclosure**: Don't show all tasks at once - reveal as user completes.

4. **Emotional State Tracking**: Track mood before/after sessions to learn what helps.

---

## Codex Perspective

### Focus: Implementation Architecture & Data Structures

### Current Gaps

1. **Flat Task Structure**: No relationship modeling between tasks.

2. **No Learning Loop**: App doesn't learn from user behavior.

3. **Missing Metadata**: Tasks lack zone, object, and destination data.

4. **No Offline Intelligence**: All logic server-side, no local optimization.

### Specific Improvements

#### A. Enhanced Data Structures

```typescript
// Enhanced Task Interface
interface EnhancedCleaningTask {
  // Existing fields
  id: string;
  title: string;
  description: string;
  emoji: string;
  priority: Priority;
  difficulty: TaskDifficulty;
  estimatedMinutes: number;
  completed: boolean;
  completedAt?: Date;
  tips?: string[];
  subtasks?: SubTask[];
  
  // NEW: Spatial Context
  zone?: {
    id: string;
    name: string;
    description: string;
  };
  
  // NEW: Object References
  targetObjects?: {
    name: string;
    quantity?: number;
    condition?: 'clean' | 'dirty' | 'damaged' | 'misplaced';
    visualDescription?: string;  // "blue jeans on floor"
  }[];
  
  // NEW: Destination Mapping
  destination?: {
    location: string;           // "closet", "trash", "donate box"
    instructions?: string;      // "Hang on rod, not shelf"
    requiresSetup?: string;     // "Get donate box from garage first"
  };
  
  // NEW: Dependencies
  dependencies?: string[];      // Task IDs that must complete first
  enables?: string[];           // Task IDs this unlocks
  parallelWith?: string[];      // Tasks that can run simultaneously
  
  // NEW: Decision Support
  decisionPoints?: DecisionPoint[];
  
  // NEW: Behavioral Metadata
  category: TaskCategory;
  energyRequired: 'minimal' | 'low' | 'moderate' | 'high';
  decisionLoad: 'none' | 'low' | 'medium' | 'high';
  visualImpact: 'low' | 'medium' | 'high';  // How much cleaner will it LOOK
  
  // NEW: Learning Signals
  userSkipped?: boolean;
  skipReason?: string;
  actualMinutes?: number;       // Track real time vs estimate
  difficultyFeedback?: 'easier' | 'accurate' | 'harder';
}

type TaskCategory = 
  | 'trash_removal'
  | 'surface_clearing' 
  | 'dishes'
  | 'laundry'
  | 'organization'
  | 'deep_cleaning'
  | 'maintenance'
  | 'donation_sorting'
  | 'setup';  // Getting supplies, etc.

interface DecisionPoint {
  id: string;
  question: string;
  options: {
    label: string;
    action: string;
    nextTask?: string;
  }[];
  defaultAfterSeconds?: number;  // Auto-select if user doesn't decide
  defaultOption?: string;
}

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  estimatedSeconds?: number;    // More granular timing
  isCheckpoint?: boolean;       // "Good stopping point"
  celebration?: 'none' | 'small' | 'medium';  // Trigger celebration
}
```

#### B. Room Analysis Response Schema

```typescript
interface EnhancedAnalysisResult {
  // Basic Info
  messLevel: number;
  roomType: RoomType;
  summary: string;
  encouragement: string;
  
  // NEW: Photo Quality Assessment
  photoQuality: {
    lighting: 'good' | 'dim' | 'overexposed';
    coverage: 'full' | 'partial' | 'limited';
    clarity: 'clear' | 'blurry' | 'mixed';
    confidence: number;  // 0-1, overall confidence in analysis
    suggestedRetake?: string;
  };
  
  // NEW: Spatial Analysis
  zones: Zone[];
  
  // NEW: Detected Objects
  detectedObjects: DetectedObject[];
  
  // Enhanced Tasks
  tasks: EnhancedCleaningTask[];
  
  // NEW: Task Relationships
  taskGraph: {
    criticalPath: string[];      // Most important sequence
    parallelGroups: string[][];  // Tasks that can be done together
    optionalTasks: string[];     // Nice-to-have
  };
  
  // NEW: Time Profiles
  timeProfiles: {
    minimal: {                   // 5-minute version
      tasks: string[];
      expectedImpact: number;
    };
    quick: {                     // 15-minute version
      tasks: string[];
      expectedImpact: number;
    };
    standard: {                  // 30-minute version
      tasks: string[];
      expectedImpact: number;
    };
    complete: {                  // Full clean
      tasks: string[];
      expectedImpact: number;
    };
  };
  
  // NEW: Energy Profiles
  energyProfiles: {
    exhausted: string[];         // Task IDs for exhausted state
    low: string[];
    moderate: string[];
    high: string[];
  };
  
  // Quick Wins (enhanced)
  quickWins: {
    taskId: string;
    visualImpact: 'high' | 'medium';
    timeMinutes: number;
    reason: string;              // Why this is a quick win
  }[];
  
  // NEW: Success Metrics
  successMetrics: {
    floorVisibilityTarget: number;
    surfacesClearTarget: number;
    itemsRemovedTarget: number;
  };
}

interface Zone {
  id: string;
  name: string;
  type: 'floor' | 'surface' | 'storage' | 'fixture';
  description: string;
  clutterDensity: 'low' | 'medium' | 'high' | 'extreme';
  itemCount: number;
  estimatedClearTime: number;
  priority: Priority;
  priorityReason: string;
  relatedTasks: string[];
}

interface DetectedObject {
  id: string;
  name: string;
  category: 'trash' | 'dishes' | 'clothes' | 'papers' | 'misc' | 'belongs_elsewhere';
  zone: string;
  condition: 'clean' | 'dirty' | 'damaged' | 'unknown';
  suggestedAction: string;
  suggestedDestination: string;
  relatedTask: string;
  confidence: number;
}
```

#### C. User Learning System

```typescript
interface UserCleaningProfile {
  // Task Performance History
  taskHistory: {
    category: TaskCategory;
    completionRate: number;
    averageTimeVsEstimate: number;  // 1.0 = accurate, >1 = took longer
    skipRate: number;
    preferredTimeOfDay?: string;
  }[];
  
  // Energy Patterns
  energyPatterns: {
    dayOfWeek: number;
    averageEnergy: number;
    bestCleaningTime?: string;
  }[];
  
  // Preferences (learned)
  preferences: {
    preferredTaskSize: 'tiny' | 'small' | 'medium';
    preferredSessionLength: number;
    needsMoreBreakdown: boolean;      // Struggles with medium tasks
    respondsToGameification: boolean;
    prefersQuickWinsFirst: boolean;
    avoidsDecisionTasks: boolean;
  };
  
  // Room-specific insights
  roomInsights: {
    roomType: RoomType;
    averageMessLevel: number;
    commonClutterTypes: string[];
    mostSkippedTaskTypes: TaskCategory[];
    bestPerformingTaskTypes: TaskCategory[];
  }[];
  
  // Motivational response
  motivationProfile: {
    respondsToChallenges: boolean;
    needsFrequentEncouragement: boolean;
    preferredEncouragementStyle: 'cheerful' | 'calm' | 'matter-of-fact';
    celebrationPreference: 'minimal' | 'moderate' | 'maximum';
  };
}
```

#### D. Offline Task Optimization

```typescript
// Local task optimizer that works without API calls
class LocalTaskOptimizer {
  constructor(private userProfile: UserCleaningProfile) {}
  
  optimizeTaskOrder(tasks: EnhancedCleaningTask[], context: SessionContext): EnhancedCleaningTask[] {
    // Apply user preferences
    let optimized = this.applyUserPreferences(tasks);
    
    // Respect dependencies
    optimized = this.topologicalSort(optimized);
    
    // Filter by energy level
    optimized = this.filterByEnergy(optimized, context.energyLevel);
    
    // Limit by time
    optimized = this.limitByTime(optimized, context.availableMinutes);
    
    // Prioritize quick wins if user prefers
    if (this.userProfile.preferences.prefersQuickWinsFirst) {
      optimized = this.moveQuickWinsToFront(optimized);
    }
    
    return optimized;
  }
  
  suggestNextTask(
    completedTasks: string[], 
    currentEnergy: number,
    minutesRemaining: number
  ): EnhancedCleaningTask | null {
    // Find tasks whose dependencies are satisfied
    // Match energy level
    // Fit within time remaining
    // Prioritize by visual impact
  }
  
  estimateSessionImpact(tasks: EnhancedCleaningTask[]): SessionImpactEstimate {
    // Predict visual improvement
    // Predict user satisfaction
    // Predict likelihood of completion
  }
}

interface SessionContext {
  energyLevel: 'exhausted' | 'low' | 'moderate' | 'high';
  availableMinutes: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: number;
  visitorExpected?: boolean;
  userMood?: string;
}
```

### Implementation Notes (Codex)

1. **Zod Schema Validation**: Update `types/schemas.ts` with new fields, use `.optional()` for backward compatibility.

2. **Migration Strategy**: New fields should have sensible defaults so existing data still works.

3. **Performance**: Object detection increases response size - implement pagination or lazy loading for tasks.

4. **Caching**: Cache room analysis results locally, only re-analyze on new photo.

5. **A/B Testing**: Add feature flags to test new task structures against old.

---

## Competitive Analysis

### How We Compare to Market Leaders

| Feature | Declutterly (Current) | Tody | Sweepy | Clean AI | Recommended |
|---------|----------------------|------|--------|----------|-------------|
| AI Photo Analysis | Basic | None | None | Advanced | Enhance significantly |
| Object Detection | No | No | No | Yes | Must add |
| Task Dependencies | No | No | Basic | No | Must add |
| Energy Adaptation | No | No | Effort Points | No | Must add |
| Zone Mapping | No | Yes (manual) | Yes (manual) | Partial | Must add (automatic) |
| Decision Support | No | No | No | No | Unique opportunity! |
| Learning System | No | Basic | Basic | No | Major differentiator |
| Time Profiles | No | No | Yes | No | Must add |
| Household Sharing | Basic | Yes | Yes | No | Improve |

### Unique Differentiators to Pursue

1. **AI-Powered Decision Support**: No competitor helps users decide what to keep/donate
2. **Energy-Adaptive Planning**: Tody has dirtiness, Sweepy has points, but neither adapts to user energy
3. **Automatic Zone Detection**: Others require manual room setup
4. **Learning Task Optimizer**: Personalized task ordering based on user history

---

## Unified Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
**Goal**: Enhanced object detection and zone mapping

- [ ] Update AI prompt with object detection requirements
- [ ] Add zone data structure and mapping
- [ ] Update task schema with object references
- [ ] Add photo quality assessment
- [ ] Update Zod schemas for validation

### Phase 2: Intelligence (Weeks 3-4)
**Goal**: Task dependencies and time profiles

- [ ] Implement task dependency graph
- [ ] Add critical path calculation
- [ ] Create time profiles (5/15/30/60 min versions)
- [ ] Add parallel task grouping
- [ ] Implement task ordering optimizer

### Phase 3: Adaptation (Weeks 5-6)
**Goal**: Energy and context awareness

- [ ] Add pre-session check-in (energy, time, mood)
- [ ] Implement energy-filtered task lists
- [ ] Add decision support system
- [ ] Create "overwhelm mode" with ultra-simple tasks
- [ ] Add session impact predictions

### Phase 4: Learning (Weeks 7-8)
**Goal**: Personalization based on behavior

- [ ] Track task completion patterns
- [ ] Learn user preferences (task size, timing, etc.)
- [ ] Implement feedback collection (was this helpful?)
- [ ] Build user cleaning profile
- [ ] Create personalized suggestions

### Phase 5: Polish (Weeks 9-10)
**Goal**: UX refinement and testing

- [ ] A/B test new vs old task generation
- [ ] Refine prompt based on real usage
- [ ] Optimize performance (response time, payload size)
- [ ] Add offline task optimization
- [ ] User testing with ADHD community

---

## Updated Prompt Engineering

### New System Prompt (Complete)

```
You are a friendly, expert cleaning coach helping people declutter and clean their spaces. You specialize in helping people with ADHD, anxiety, and those who feel overwhelmed by cleaning tasks.

## YOUR APPROACH
1. Be WARM and NON-JUDGMENTAL - never shame the user for mess
2. Break down tasks into TINY, achievable steps (2-10 minutes each)
3. Prioritize "quick wins" - easy tasks with HIGH VISUAL IMPACT
4. Provide SPECIFIC, ACTIONABLE instructions with EXACT locations
5. Include helpful tips about WHERE to put things and HOW to do tasks
6. Consider the user's available time and energy level

## ANALYSIS PROTOCOL

### Step 1: Photo Quality Assessment
Evaluate the image for:
- Lighting quality (good/dim/overexposed)
- Room coverage (full/partial/limited)
- Clarity (clear/blurry)
If quality is poor, note what areas are unclear and adjust confidence accordingly.

### Step 2: Zone Identification
Divide the visible space into distinct zones:
- Floor areas (by location: near bed, center, by door, etc.)
- Surfaces (desk, nightstand, dresser, counter, table)
- Storage areas (closet, drawers, shelves)
- Fixtures (bed, sink, toilet, appliances)

For each zone, assess:
- Clutter density (low/medium/high/extreme)
- Approximate item count
- Estimated clearing time
- Priority level and reason

### Step 3: Object Detection
For EACH visible item that needs action, identify:
- Specific name (e.g., "blue coffee mug" not just "cup")
- Exact location (e.g., "on desk, left side")
- Condition (clean/dirty/damaged/misplaced)
- Suggested action and destination

Categorize items as:
- TRASH: Obvious garbage, wrappers, tissues, expired items
- DISHES: Cups, plates, utensils needing kitchen return
- CLOTHES: Garments needing sorting (clean/dirty/donate)
- PAPERS: Mail, documents, magazines
- BELONGS_ELSEWHERE: Items from other rooms
- MISC: Other items needing organization

### Step 4: Task Generation
Create tasks that:
- Reference SPECIFIC objects you identified
- Include exact source AND destination locations
- Have clear dependencies (what must happen first)
- Provide decision support for sorting tasks
- Include tips for HOW to do each step

### Step 5: Time & Energy Profiles
Generate task lists for different scenarios:
- MINIMAL (5 min, exhausted): 2-3 maintenance tasks, no decisions
- QUICK (15 min, low energy): 4-5 quick wins, minimal decisions
- STANDARD (30 min, moderate energy): 8-10 tasks with some organization
- COMPLETE (60+ min, high energy): Full cleaning with deep organization

## TASK REQUIREMENTS

Each task MUST include:
- Title: Action verb + specific target (e.g., "Gather dishes from desk and nightstand")
- Description: Detailed step-by-step with WHERE items go and HOW to do it
- Zone: Which zone this task addresses
- Target Objects: List of specific items this task handles
- Destination: Where items should end up (with instructions)
- Dependencies: What tasks must complete first (if any)
- Subtasks: Break into 1-3 minute steps
- Tips: 2-3 practical tips including supplies needed
- Energy Required: minimal/low/moderate/high
- Decision Load: none/low/medium/high
- Visual Impact: how much cleaner the room will LOOK after this task

## DECISION SUPPORT

For sorting tasks (clothes, papers, misc), provide:
- Clear criteria for keep/donate/trash decisions
- The "5-second rule" for quick decisions
- "Decide later" pile option to maintain momentum
- Emotional support for letting go of items

## PSYCHOLOGICAL ELEMENTS

Include:
- "Why This Matters": Brief explanation of the psychological benefit
- Resistance Handler: Pre-emptive response to "I don't want to do this"
- Celebration Points: Natural stopping points to acknowledge progress

## OUTPUT FORMAT

Respond with valid JSON:
{
  "photoQuality": {
    "lighting": "good|dim|overexposed",
    "coverage": "full|partial|limited",
    "clarity": "clear|blurry|mixed",
    "confidence": 0.0-1.0,
    "notes": "any issues or suggestions for re-capture"
  },
  "messLevel": 0-100,
  "summary": "Detailed description of what you see, naming specific items and locations",
  "roomType": "bedroom|kitchen|bathroom|livingRoom|office|garage|closet|other",
  "encouragement": "Warm, personalized message acknowledging the specific room state",
  
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
      "zone": "zone-id reference",
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
      "zone": "zone-id this addresses",
      "targetObjects": ["list of object names this task handles"],
      "destination": {
        "location": "where items go",
        "instructions": "how to place/organize them"
      },
      "dependencies": ["task-ids that must complete first"],
      "energyRequired": "minimal|low|moderate|high",
      "decisionLoad": "none|low|medium|high",
      "visualImpact": "low|medium|high",
      "tips": ["practical tip 1", "practical tip 2"],
      "subtasks": [
        {"title": "tiny specific action", "estimatedSeconds": 60}
      ],
      "whyThisMatters": "psychological benefit of completing this",
      "resistanceHandler": "response to not wanting to do this"
    }
  ],
  
  "taskGraph": {
    "criticalPath": ["task-ids in order of importance"],
    "parallelGroups": [["tasks", "that can", "run together"]],
    "setupTasks": ["tasks that enable others"],
    "optionalTasks": ["nice-to-have tasks"]
  },
  
  "timeProfiles": {
    "minimal": {"tasks": ["task-ids"], "expectedImpact": 0-100},
    "quick": {"tasks": ["task-ids"], "expectedImpact": 0-100},
    "standard": {"tasks": ["task-ids"], "expectedImpact": 0-100},
    "complete": {"tasks": ["task-ids"], "expectedImpact": 0-100}
  },
  
  "energyProfiles": {
    "exhausted": ["task-ids for very low energy"],
    "low": ["task-ids for low energy"],
    "moderate": ["task-ids for moderate energy"],
    "high": ["task-ids for high energy"]
  },
  
  "quickWins": [
    {
      "taskId": "reference to task",
      "visualImpact": "high|medium",
      "timeMinutes": number,
      "reason": "why this is a quick win"
    }
  ],
  
  "decisionPoints": [
    {
      "trigger": "when user encounters this",
      "question": "question to ask themselves",
      "options": [
        {"answer": "option 1", "action": "what to do"},
        {"answer": "option 2", "action": "what to do"}
      ],
      "fiveSecondDefault": "what to do if user can't decide",
      "emotionalSupport": "reassuring message about this decision"
    }
  ],
  
  "estimatedTotalTime": total minutes for all tasks,
  "beforeAfterMetrics": ["specific measurable improvements to look for"]
}
```

---

## New Data Structures

### Updated Zod Schemas

```typescript
// types/schemas.ts - Enhanced version

import { z } from 'zod';

// Photo Quality Assessment
export const PhotoQualitySchema = z.object({
  lighting: z.enum(['good', 'dim', 'overexposed']),
  coverage: z.enum(['full', 'partial', 'limited']),
  clarity: z.enum(['clear', 'blurry', 'mixed']),
  confidence: z.number().min(0).max(1),
  notes: z.string().optional(),
});

// Zone Schema
export const ZoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['floor', 'surface', 'storage', 'fixture']),
  description: z.string(),
  clutterDensity: z.enum(['low', 'medium', 'high', 'extreme']),
  itemCount: z.number().min(0),
  estimatedClearTime: z.number().min(0),
  priority: z.enum(['high', 'medium', 'low']),
  priorityReason: z.string(),
});

// Detected Object Schema
export const DetectedObjectSchema = z.object({
  name: z.string(),
  category: z.enum(['trash', 'dishes', 'clothes', 'papers', 'belongs_elsewhere', 'misc']),
  zone: z.string(),
  condition: z.enum(['clean', 'dirty', 'damaged', 'misplaced', 'unknown']).optional(),
  suggestedAction: z.string(),
  suggestedDestination: z.string(),
});

// Destination Schema
export const DestinationSchema = z.object({
  location: z.string(),
  instructions: z.string().optional(),
});

// Subtask Schema (Enhanced)
export const SubtaskSchema = z.object({
  title: z.string().min(1),
  estimatedSeconds: z.number().optional(),
  isCheckpoint: z.boolean().optional(),
});

// Decision Point Schema
export const DecisionPointSchema = z.object({
  trigger: z.string(),
  question: z.string(),
  options: z.array(z.object({
    answer: z.string(),
    action: z.string(),
  })),
  fiveSecondDefault: z.string().optional(),
  emotionalSupport: z.string().optional(),
});

// Enhanced Task Schema
export const EnhancedTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  emoji: z.string().default('📋'),
  priority: z.enum(['high', 'medium', 'low']),
  difficulty: z.enum(['quick', 'medium', 'challenging']),
  estimatedMinutes: z.number().min(1).max(120),
  
  // New fields
  zone: z.string().optional(),
  targetObjects: z.array(z.string()).optional(),
  destination: DestinationSchema.optional(),
  dependencies: z.array(z.string()).optional(),
  energyRequired: z.enum(['minimal', 'low', 'moderate', 'high']).optional(),
  decisionLoad: z.enum(['none', 'low', 'medium', 'high']).optional(),
  visualImpact: z.enum(['low', 'medium', 'high']).optional(),
  
  tips: z.array(z.string()).optional(),
  subtasks: z.array(SubtaskSchema).optional(),
  
  whyThisMatters: z.string().optional(),
  resistanceHandler: z.string().optional(),
});

// Time Profile Schema
export const TimeProfileSchema = z.object({
  tasks: z.array(z.string()),
  expectedImpact: z.number().min(0).max(100),
});

// Task Graph Schema
export const TaskGraphSchema = z.object({
  criticalPath: z.array(z.string()),
  parallelGroups: z.array(z.array(z.string())),
  setupTasks: z.array(z.string()).optional(),
  optionalTasks: z.array(z.string()).optional(),
});

// Quick Win Schema
export const QuickWinSchema = z.object({
  taskId: z.string(),
  visualImpact: z.enum(['high', 'medium']),
  timeMinutes: z.number(),
  reason: z.string(),
});

// Complete Enhanced Analysis Response Schema
export const EnhancedAnalysisResponseSchema = z.object({
  photoQuality: PhotoQualitySchema.optional(),
  messLevel: z.number().min(0).max(100),
  summary: z.string(),
  roomType: z.enum([
    'bedroom', 'kitchen', 'bathroom', 'livingRoom',
    'office', 'garage', 'closet', 'other'
  ]).optional(),
  encouragement: z.string(),
  
  zones: z.array(ZoneSchema).optional(),
  detectedObjects: z.array(DetectedObjectSchema).optional(),
  tasks: z.array(EnhancedTaskSchema),
  
  taskGraph: TaskGraphSchema.optional(),
  
  timeProfiles: z.object({
    minimal: TimeProfileSchema,
    quick: TimeProfileSchema,
    standard: TimeProfileSchema,
    complete: TimeProfileSchema,
  }).optional(),
  
  energyProfiles: z.object({
    exhausted: z.array(z.string()),
    low: z.array(z.string()),
    moderate: z.array(z.string()),
    high: z.array(z.string()),
  }).optional(),
  
  quickWins: z.array(QuickWinSchema).optional(),
  decisionPoints: z.array(DecisionPointSchema).optional(),
  
  estimatedTotalTime: z.number(),
  beforeAfterMetrics: z.array(z.string()).optional(),
});
```

---

## Priority Matrix

### Impact vs. Effort Analysis

| Improvement | Impact | Effort | Priority |
|------------|--------|--------|----------|
| Object detection in prompt | HIGH | LOW | **P0 - Do First** |
| Zone mapping | HIGH | LOW | **P0 - Do First** |
| Task dependencies | HIGH | MEDIUM | **P1 - Do Soon** |
| Time profiles (5/15/30/60 min) | HIGH | LOW | **P0 - Do First** |
| Energy-adapted task lists | HIGH | MEDIUM | **P1 - Do Soon** |
| Decision support prompts | MEDIUM | LOW | **P1 - Do Soon** |
| Photo quality assessment | MEDIUM | LOW | **P1 - Do Soon** |
| User learning system | HIGH | HIGH | **P2 - Plan For** |
| Offline task optimizer | MEDIUM | HIGH | **P2 - Plan For** |
| Pre-session check-in UI | MEDIUM | MEDIUM | **P2 - Plan For** |
| Psychological scaffolding | MEDIUM | LOW | **P1 - Do Soon** |
| A/B testing framework | LOW | MEDIUM | **P3 - Nice to Have** |

### Recommended First Sprint

1. **Update AI Prompt** with object detection, zone mapping, and time profiles
2. **Update TypeScript schemas** with new fields (optional, backward compatible)
3. **Update analysis.tsx** to display zones and time profile options
4. **Update room/[id].tsx** to filter tasks by time/energy
5. **Add pre-session energy check** (simple modal before showing tasks)

---

## Summary: What Each LLM Recommends

### Gemini 3.0 Pro Says:
> "Your image analysis is too shallow. You need to SEE and NAME every object, map where it is spatially, and understand its condition. Without this, your tasks are generic. Add object detection with confidence scores, zone mapping with bounding hints, and photo quality assessment. Think of it like giving the AI 'eyes' instead of just 'glances'."

### Opus 4.5 Says:
> "You're treating cleaning as a list when it's actually a graph of dependent actions with emotional weight. Tasks have prerequisites, some can run in parallel, and the user's energy level determines what's even possible. Add task dependencies, decision support for the hard choices (keep vs. donate), and energy-adaptive filtering. The psychology matters as much as the logistics."

### Codex Says:
> "Your data structures are too flat to support intelligent behavior. You need zones, object references, destinations, dependencies, and metadata about energy/decisions/visual impact. Build a user learning system that tracks what they skip, how long tasks actually take, and what time of day they clean best. Then use that data to personalize everything."

---

## Conclusion

The Declutterly app has excellent foundations but needs deeper intelligence to truly help users with ADHD transform their spaces. The key improvements are:

1. **See Specifically**: Detect and name individual objects, not just "mess"
2. **Map Spatially**: Divide rooms into zones with clear priorities
3. **Connect Logically**: Model task dependencies and parallel opportunities
4. **Adapt Contextually**: Filter by energy, time, and user preferences
5. **Learn Continuously**: Track behavior and improve personalization

Implementing these changes will transform Declutterly from a "cleaning list generator" into an "intelligent cleaning coach" that truly understands each user's unique situation.

---

*Document generated by multi-LLM analysis (Gemini 3.0 Pro, Opus 4.5, Codex perspectives)*
*Version 1.0 - January 2026*
