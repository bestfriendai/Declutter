# AI Intelligence Overhaul — Declutter App
### Making Every Analysis Feel Like a Pro Organizer Is In the Room

---

## The Problem In Plain English

Right now, the app takes a photo and spits out tasks like:

> *"Pick up the clothes"*
> *"Clean up the desk"*
> *"Deal with the pile in the corner"*

This is worse than useless. The user already knows those things exist. The entire value proposition of this app is that AI can **see things the user has stopped seeing** and give them tasks so specific and so broken down that starting feels effortless. We're not delivering on that at all.

**What it should feel like:**

> *"🧥 Pick up the gray hoodie draped over the left armrest of the couch · EST 45 sec"*
> *"☕ Grab the 3 coffee mugs on the nightstand (the white IKEA ones near the lamp) and carry them to the kitchen sink · EST 2 min"*
> *"📄 Collect the 5–6 papers on the right side of the desk · put them in a single stack, don't sort yet · EST 1 min"*

The difference is the difference between a $0 app and a $10/month app users tell their friends about.

---

## Root Cause Analysis

After reviewing the full codebase, here is exactly what's broken and why:

### 1. The AI Prompt Is Generic Despite Looking Detailed
`convex/gemini.ts` has a 200-line system prompt, but it's structured as guidelines instead of **hard constraints**. Gemini reads "use specific names" as a suggestion, not a rule. The prompt needs to be restructured so every task title is **rejected by the system** unless it contains: color + type + count + exact location + time estimate.

### 2. Energy Level Is Never Passed to the Analysis
The camera screen (`app/camera.tsx`) collects room type but **never asks for energy level**. The prompt has an entire adaptive difficulty system (`ENERGY_TASK_LIMITS`) that scales tasks by energy — but it's dead code because `analyzeRoomImage()` is called with only `base64Image` and `additionalContext: "Room type: bedroom"`. The energy level from user profile is never passed through.

### 3. The Analysis Screen Throws Away 90% of the AI's Work
`app/analysis.tsx` line 248: `const easyTasks = [...analysisResult.tasks].sort(...).slice(0, 3)`. The AI generates 8–15 rich tasks with zones, subtasks, locations, doom pile analysis — and we save **3 of them sorted by shortest time**. Everything else is discarded.

### 4. Task Titles Are Stored Without Location or Time
`CleaningTask.title` is just a short string like "Clear nightstand". The location and time live in `description`, `zone`, `targetObjects`, and `estimatedMinutes` — but the task card only shows `title`. The user never sees the rich data.

### 5. Photo Quality Is Never Improved Before Analysis
If the user takes a dark, partial, or blurry photo, the AI guesses. The app never tells the user "this angle will give you better results" or asks for a second shot of a specific area.

### 6. No Pre-Analysis Context Gathering
The AI has no idea:
- How long the user has to clean
- Whether this is a regular mess or a crisis pile
- Which area the user dreads most
- Whether there's a specific surface they want to focus on first

All of this context would dramatically improve task relevance.

---

## The Full Overhaul Plan

---

### PILLAR 1: Hyper-Specific Task Generation

**The new rule: Every task title must pass the "stranger test."**

> Could a person who has never seen this room pick up the exact right item from the exact right spot, put it in the exact right destination, in the estimated time — using only the task title?

If not, the title is rejected.

#### New Task Title Formula

```
[ACTION VERB] + [COUNT] + [COLOR/TYPE DESCRIPTOR] + [ITEM NAME] + from [EXACT LOCATION] · EST [X] min
```

**Examples by room type:**

**Bedroom:**
- ❌ Old: `"Pick up the clothes"`
- ✅ New: `"Grab 4 items of clothing off the floor near the closet door · EST 2 min"`
- ✅ New: `"Lift the dark blue hoodie draped over the desk chair and toss it into the laundry basket · EST 30 sec"`

**Kitchen:**
- ❌ Old: `"Do the dishes"`
- ✅ New: `"Stack the 5 bowls from the left side of the sink into the dishwasher's bottom rack · EST 3 min"`
- ✅ New: `"Wipe the coffee ring stain on the white counter to the left of the coffee maker with a paper towel · EST 1 min"`

**Living Room:**
- ❌ Old: `"Clean up the couch"`
- ✅ New: `"Collect the 3 throw pillows on the floor behind the coffee table and put them back on the couch · EST 1 min"`
- ✅ New: `"Grab the snack wrappers/cups on the right side of the couch and carry them to the trash · EST 1 min"`

#### New Prompt Enforcement Strategy

Replace the current system prompt approach with a **constraint-first** model:

```
ABSOLUTE RULE — NEVER GENERATE A TASK TITLE THAT:
- Does not specify an exact location in the room
- Uses vague category words: "stuff", "things", "items", "mess", "clutter", "junk"
- Does not include a count or quantity (e.g., "3 books", "a mug", "the pile of papers")
- Does not include at least one color or physical descriptor
- Does not have an EST time in the title itself

EVERY TASK TITLE MUST FOLLOW THIS EXACT STRUCTURE:
"[verb] [count] [descriptor] [item] [from/off/on] [exact location] · EST [X] min"

If you cannot identify a specific count, use "a few" or "several" but still include location.
If you cannot identify a color, use size or material (e.g., "large", "plastic", "crumpled").

VIOLATION EXAMPLES (never generate these):
❌ "Pick up the clothes on the floor"
❌ "Clean the desk area"  
❌ "Take care of the pile in the corner"
❌ "Organize the bookshelf"

COMPLIANT EXAMPLES (always generate like these):
✅ "Pick up 3 shirts off the floor between the bed and wall · EST 1 min"
✅ "Clear the 8 items from the right side of the desk surface · EST 4 min"
✅ "Move the mixed pile from the corner near the door to a laundry basket · EST 3 min"
✅ "Return 6 books from the nightstand stack to the shelf above the desk · EST 2 min"
```

#### Time Estimate Formula (Replace Arbitrary Numbers)

The AI currently makes up time estimates. Build a calibrated estimate system:

| Item Type | Per-Item Seconds |
|-----------|-----------------|
| Clothing (floor pickup) | 8–12 sec/item |
| Dish/cup carry | 15–20 sec/item |
| Paper stacking | 5–8 sec/item |
| Trash pickup (bagging) | 5–10 sec/item |
| Furniture item (pillow, blanket) | 10–20 sec/item |
| Surface wipe | 30–60 sec/surface |
| Walking to destination | +15–30 sec |
| Decision-required items | +30–60 sec buffer |

**Example calculation:** "3 shirts + walk to laundry basket (15 ft away)" = (3 × 10) + 30 = 60 sec = `EST 1 min`

Pass this formula to the AI prompt explicitly so it reasons about time mathematically, not narratively.

---

### PILLAR 2: Pre-Scan Context Screen

Before the camera shutter fires, collect critical context that transforms the quality of analysis.

#### What to Ask (Keep it Under 30 Seconds)

**Screen 1: Quick Context** (shown after tapping Scan Room, before the camera opens)

```
"Before we look at your space — quick check:"

→ How much time do you have?
   [ 5 min ]  [ 15 min ]  [ 30 min ]  [ As long as it takes ]

→ What's your energy like right now?
   [ Running on empty ]  [ Low ]  [ Normal ]  [ Let's go ]

→ Any specific area you want tackled first? (optional, text field)
   "e.g., the desk, the corner pile, the floor..."
```

**This enables:**
- Passing `timeAvailable` to the Gemini prompt so it only generates tasks that fit the session
- Passing `energyLevel` to actually use the adaptive difficulty system in `ENERGY_TASK_LIMITS` (currently dead)
- Passing `focusArea` so the AI surfaces those tasks in Phase 1 regardless of visual impact score

#### Implementation Notes

- Store context in navigation params, pass to `analyzeRoomImage()` as `additionalContext`
- `additionalContext` currently just receives `"Room type: bedroom"` — expand this to a rich context string:

```typescript
const context = [
  `Room type: ${roomType}`,
  `Energy level: ${energyLevel}`,       // Was: never passed
  `Time available: ${timeAvailable} minutes`,  // Was: never passed
  `Focus area: ${focusArea || 'none'}`,   // Was: never passed
  `Is this room usually this messy? ${usualMessLevel}`,  // New
].join('\n');
```

---

### PILLAR 3: Photo Intelligence & Multi-Angle Analysis

#### Problem: One Photo Is Never Enough
A single photo misses:
- The area behind the user (behind the camera)
- The floor directly in front
- The tops of shelves
- Inside closets/under beds

#### Solution: Guided Multi-Photo Flow

After taking the first photo, prompt:

```
"📸 Good start! For a complete analysis, take one more photo:
 → Turn 180° and capture the other half of the room
 
 [Skip — analyze this photo only]   [Take another shot →]"
```

For multi-photo analysis, send both images to Gemini in a single request and ask it to identify which items appear in which photo to avoid duplicates.

#### Photo Quality Validation (Real-Time)

Before sending to AI, validate photo quality **client-side** using basic heuristics:

```typescript
// Check image brightness (too dark = bad analysis)
// Check image blur (Laplacian variance on canvas)  
// Check if it looks like a room (not a ceiling/floor-only shot)

if (imageQualityScore < 0.5) {
  showOverlay("📷 This photo might be too dark for a good analysis. 
                Try turning on the lights or moving to better lighting.");
}
```

Use the `photoQuality` object already returned by Gemini (`lighting`, `clarity`, `confidence`) to show feedback **after** analysis if quality was poor:

```
⚠️ Lower confidence analysis
The photo was a bit dark, so some items may have been missed.
[Retake for better results] or [Continue with these tasks]
```

#### Tap-to-Focus Zones on Photo

After analysis, display the taken photo with **colored zone overlays** (using the `zones` array already returned by Gemini). Users can **tap a zone** to see only the tasks for that area.

```
[Photo with colored rectangle overlays]
  🔴 Desk area — 4 tasks
  🟡 Floor near bed — 3 tasks  
  🔵 Closet door area — 2 tasks

Tap a zone to see its specific tasks →
```

---

### PILLAR 4: Task Card Redesign

The existing `CleaningTask` type has all the right fields — they just aren't displayed.

#### Current Card (What Users See)
```
┌─────────────────────────────┐
│  🧹 Pick up the clothes      │
│  3 min • High Priority       │
└─────────────────────────────┘
```

#### New Card (What It Should Be)
```
┌─────────────────────────────────────────┐
│  🧥  Grab 4 shirts off the bedroom floor │
│  📍 Between bed + closet door            │
│  ⏱  EST 2 min  · ⚡ Quick Win  · Phase 1 │
│  ─────────────────────────────────────── │
│  → Put in laundry basket (left of door)  │
└─────────────────────────────────────────┘
```

Fields needed:
- **Title**: Already rich **if the prompt is fixed**
- **Location**: Use `task.zone` or first entry of `task.targetObjects` 
- **Time**: `task.estimatedMinutes` (already exists, just not shown on card)
- **Destination**: `task.destination.location` (already exists, never shown)
- **Phase badge**: `task.phase` + `task.phaseName` (already exists)

#### Task Title Format in Single-Task Focus Screen
When a user is actively working a task in `single-task.tsx`, show the full context:

```
NOW DOING:
─────────────────────────────────────────────────
🧥  Grab 4 shirts off the floor near the closet door
─────────────────────────────────────────────────
📍  Between the bed and the closet door
🎯  Drop them in the laundry basket to the left of the door
⏱  EST 2 minutes
─────────────────────────────────────────────────
💡  Don't sort by type yet — just get them off the floor.
    That's the whole job. 
─────────────────────────────────────────────────
SUBTASKS:
○  Walk to the closet-side corner (10 sec)
○  Gather everything within arm's reach in one scoop (30 sec)
○  Stand up and carry to laundry basket (20 sec)
○  Drop everything in — no folding needed (10 sec)
✓  Done! Floor space reclaimed. 
─────────────────────────────────────────────────
```

Everything above is already returned by the AI in `task.subtasks`, `task.tips`, `task.destination`, `task.targetObjects` — just not displayed.

---

### PILLAR 5: Doom Pile Intelligence

The Gemini prompt already asks for `doomPiles` but the app never surfaces them anywhere meaningful.

#### What a Doom Pile Is
A "doom pile" is a mixed accumulation of items that has been growing because every individual item requires a decision. They're usually in corners, on chairs, or near doors. They're the most anxiety-inducing part of any messy room.

#### New Doom Pile Feature

When a doom pile is detected, show a dedicated card **before the task list**:

```
┌─────────────────────────────────────────────────────┐
│  ⚠️  DOOM PILE DETECTED                              │
│  Corner near the bedroom door                        │
│                                                      │
│  I see: papers, clothes, misc items, possibly shoes  │
│  Anxiety level: HIGH · EST 15 min to fully sort      │
│                                                      │
│  The 3-Pile Method:                                  │
│  1. 🗑️ Trash — obvious junk, wrappers, old papers   │
│  2. 👟 Belongs elsewhere — shoes to closet, etc.    │
│  3. 🤔 Needs a decision — box it for later, no guilt │
│                                                      │
│  [Start the doom pile]  [Skip for now]               │
└─────────────────────────────────────────────────────┘
```

The 3-pile method removes the decision paralysis that makes doom piles grow. The app should:
1. Surface doom piles as a **separate card** before Phase 1 tasks
2. Offer the "box it for later" option explicitly (reduces decision load)
3. Track whether doom piles get resolved across sessions

---

### PILLAR 6: Smart Task Bundling & Carry-Chain Logic

Instead of presenting tasks as isolated items, group them by:

#### Proximity Clusters
Tasks within the same 3-foot radius can be done in a single movement:

```
🔗 DO THESE TOGETHER · Same spot · EST 4 min combined
────────────────────────────────────────────────────
1. Grab 3 shirts from the floor near the closet door
2. Grab the dark blue backpack also near the closet door
3. Pick up the 2 pairs of shoes right next to the shirts

All of these are within one arm's reach. 
Clear the whole corner in one trip!
```

#### Carry-Chain Tasks
Group tasks where you're already walking to a destination:

```
🚶 KITCHEN TRIP · Bundle these · EST 3 min combined
────────────────────────────────────────────────────
You're already heading to the kitchen for the mugs.
Grab these on the way:
1. The empty water bottles on the floor (left of the nightstand)
2. The cereal box on the dresser (belongs in kitchen)

One trip = 3 tasks done.
```

#### Implementation
Ask Gemini to return a new field `taskClusters`:

```json
{
  "taskClusters": [
    {
      "clusterType": "proximity|carry_chain|same_category",
      "taskIds": ["task-1", "task-2", "task-3"],
      "rationale": "All within arm's reach near the closet door",
      "combinedEstimatedMinutes": 4,
      "savingsMinutes": 2
    }
  ]
}
```

Surface these clusters as bundled cards in the task list. Users who follow them finish faster and feel smarter.

---

### PILLAR 7: Real-Time Progress Intelligence

The `analyzeProgress` function in `services/ai.ts` compares before/after photos but it's too generic.

#### Make Before/After Comparisons Surgical

When the user takes an after photo, the AI should:

1. **Name specific items that disappeared**: "The 4 mugs on the nightstand are GONE. The floor near the closet door is completely clear."
2. **Flag items that didn't move**: "The pile of papers on the desk is still there — tackle that next?"
3. **Show a visual diff overlay**: Highlight in green the areas that changed, in yellow the areas that didn't

#### Specific Progress Reactions vs. Generic Ones

**Current output:**
> "You're making great progress! Keep it up!"

**New output:**
> "🐰 Wait — I can SEE your floor now! Those 4 shirts, 2 shoes, and the backpack near the closet door are all gone. That corner was your biggest visual stressor and it's DONE. The desk still has the paper stack — 5 more minutes and this room is transformed."

The difference is using the `specificChanges` array that Gemini already returns but the app never surfaces clearly.

---

### PILLAR 8: AI Learning & Calibration

Over time, the app should calibrate to the specific user.

#### Track Actual vs. Estimated Time
After each task completion in `single-task.tsx`, calculate:
```typescript
const actualTime = Math.round((Date.now() - taskStartTime) / 60000);
const estimatedTime = task.estimatedMinutes;
const multiplier = actualTime / estimatedTime;
```

Store this in user stats. After 10 tasks, calculate their **personal speed multiplier**:
- If they always finish in 60% of estimated time: they're a fast cleaner → scale estimates down
- If they always take 2x: adjust estimates up, reduce task count per session

Pass the multiplier to the AI prompt:
```
User calibration: This user completes tasks in approximately 0.7× the standard estimate.
Adjust all estimatedMinutes accordingly.
```

#### Category-Level Learning
Some users are fast at laundry but slow at dishes. Track multipliers per `task.category` and apply them individually.

---

### PILLAR 9: Contextual Room Intelligence

The AI should understand the room's history, not just the current photo.

#### "I Know This Room" Mode
When analyzing a room that's been analyzed before:
- Pass the previous `aiSummary` to the new analysis as context
- Pass the previously completed tasks so AI doesn't re-suggest them
- Ask AI to identify **what changed** (regressed vs. improved)

```typescript
const context = [
  `Previous state (${daysSinceLastAnalysis} days ago): ${previousAiSummary}`,
  `Tasks completed last time: ${completedTaskTitles.join(', ')}`,
  `Focus on what's NEW or what CAME BACK since last time`,
].join('\n');
```

This turns the AI from a one-time analysis into a **continuous improvement coach** that knows this specific room.

#### Regression Detection
If an area that was clean last time is messy again, the AI should name it:

> "Hey — the nightstand was clear last Thursday but it has 5 items back on it. Took you 3 min last time. Same 3-minute fix?"

---

### PILLAR 10: The "Brutal Honesty" Mode

Some users (especially those without ADHD) want the app to be **completely direct** about the mess.

Add a toggle in settings:
- **Gentle mode** (default): Warm, shame-free, ADHD-friendly language
- **Coach mode**: Direct, no fluff, treated like a workout:
  - "12 items on the floor. That's 8 minutes at your pace."
  - "Your desk has 3 distinct piles. Start left to right."
  - "This corner has been accumulating for 2+ weeks based on the dust."

---

### PILLAR 11: Voice Mode

For users who clean while listening to music or podcasts, add a voice integration:

#### "Walk Me Through It" Mode
User taps a button: **"Walk me through this task"**

The app uses `expo-speech` (or a TTS API) to read:
1. What to pick up
2. Where it is
3. Where it goes
4. When they're done, say "Done? Tap to confirm" or auto-detect via the timer running out

This is especially powerful for:
- Users with reading difficulties
- Users who want to listen while cleaning without looking at their phone
- Night cleaning when the screen brightness is annoying

---

## Implementation Priority (Ranked by Impact/Effort)

| Priority | Feature | Impact | Effort | Why |
|----------|---------|--------|--------|-----|
| 🔴 P0 | Fix the AI prompt specificity rules | Critical | Low | Root cause of all vague tasks |
| 🔴 P0 | Pass energy level + time to analysis | Critical | Low | Dead feature already built |
| 🔴 P0 | Show destination + location on task cards | Critical | Low | Data already exists, just hidden |
| 🟠 P1 | Pre-scan context screen | High | Medium | Transforms analysis quality |
| 🟠 P1 | Doom pile detection + display | High | Medium | Killer differentiating feature |
| 🟠 P1 | Carry-chain task bundling | High | Medium | Users feel clever, saves time |
| 🟡 P2 | Photo quality validation + retake flow | Medium | Low | Reduces bad analyses |
| 🟡 P2 | Zone overlay tap-to-filter | Medium | Medium | Better visual UX |
| 🟡 P2 | Multi-angle photo support | Medium | Medium | Better analysis completeness |
| 🟡 P2 | Actual vs. estimated time tracking | Medium | Medium | Calibration over time |
| 🟢 P3 | "I know this room" history mode | High | High | Loyalty/retention feature |
| 🟢 P3 | Voice walk-through mode | Medium | High | Accessibility + power users |
| 🟢 P3 | Brutal honesty mode toggle | Low | Low | User preference |

---

## P0 Fixes: The Fastest Path to "Actually Useful"

These three changes require minimal code but fix the core complaint. They should ship together as a single update.

### Fix 1: Rewrite the Task Title Generation Constraint in `convex/gemini.ts`

Replace the current task generation guidelines section with hard constraints. Add this block to `DECLUTTER_SYSTEM_PROMPT` immediately after the current task examples:

```
## ZERO-TOLERANCE TASK TITLE RULES

Every single task title MUST contain ALL of the following:
1. AN ACTION VERB that describes a physical motion (grab, carry, stack, wipe, fold, toss, drag, put)
2. A SPECIFIC COUNT (3 shirts, the mug, 2 pairs of shoes — use "a few" if uncertain but never skip count entirely)  
3. A COLOR OR MATERIAL descriptor when visible (gray hoodie, ceramic bowl, plastic bottle)
4. AN EXACT LOCATION using room landmarks (left side of couch, floor near the closet door, right half of desk, under the window)
5. A DESTINATION (laundry basket, kitchen sink, trash, shelf above desk, back of closet)
6. AN EST TIME in the title itself formatted as "· EST X min" or "· EST X sec"

BEFORE generating any task title, ask yourself:
"Could someone who has never seen this room find the exact item and complete this task using only this title?"

If the answer is NO — rewrite the title.

TITLE FORMAT (mandatory):
"[VERB] [COUNT + DESCRIPTOR + ITEM] [from/off/on] [EXACT LOCATION] → [DESTINATION] · EST [TIME]"

EXAMPLES:
✅ "Grab 3 gray hoodies off the floor near the closet door → laundry basket · EST 1 min"
✅ "Stack the 5 coffee mugs from the nightstand → carry to kitchen sink · EST 2 min"  
✅ "Collect crumpled papers from the right side of the desk → recycling bin · EST 1 min"
✅ "Pick up 2 pairs of sneakers from the center of the floor → put by the front door · EST 45 sec"

NEVER ACCEPTABLE:
❌ "Pick up the clothes" (no count, no color, no location, no destination, no time)
❌ "Clean the desk" (no specific items, no location, no destination)
❌ "Deal with the pile" (no description, no location, no method)
❌ "Tidy up the floor area" (vague action, vague target, vague location)
```

### Fix 2: Pass Energy Level and Time Available to `analyzeRoomImage()`

**In `app/camera.tsx`**: Add a quick 2-step pre-scan context UI before the camera opens. Store `energyLevel` and `timeAvailable` in state.

**In `services/ai.ts`**: Update `analyzeRoomImage()` signature:

```typescript
export async function analyzeRoomImage(
  base64Image: string,
  additionalContext?: string,
  energyLevel?: string,      // ← ADD
  timeAvailable?: number,    // ← ADD (minutes)
): Promise<AIAnalysisResult>
```

Update the context string passed to `api.gemini.analyzeRoom`:

```typescript
const fullContext = [
  additionalContext,
  energyLevel && `User energy level: ${energyLevel}`,
  timeAvailable && `User has ${timeAvailable} minutes available — only generate tasks that fit`,
].filter(Boolean).join('\n');
```

**In `convex/gemini.ts`**: Use the passed context to actually scale tasks using the existing `ENERGY_TASK_LIMITS` constant (which is currently defined but never used in the prompt generation logic).

### Fix 3: Display Location, Time, and Destination on Every Task Card

In the task card components (wherever `CleaningTask` is rendered as a card), add:

```tsx
{/* Location row — show if targetObjects exists */}
{task.targetObjects && task.targetObjects.length > 0 && (
  <View style={styles.locationRow}>
    <MapPin size={12} color={t.textMuted} />
    <Text style={styles.locationText}>{task.targetObjects[0]}</Text>
  </View>
)}

{/* Time + Phase row */}
<View style={styles.metaRow}>
  <Clock size={12} color={t.textMuted} />
  <Text style={styles.metaText}>EST {task.estimatedMinutes} min</Text>
  {task.phase && (
    <Text style={styles.phaseBadge}>Phase {task.phase}</Text>
  )}
</View>

{/* Destination row — show if destination exists */}
{task.destination && (
  <View style={styles.destinationRow}>
    <ArrowRight size={12} color={V1.coral} />
    <Text style={styles.destinationText}>{task.destination.location}</Text>
  </View>
)}
```

---

## What the App Becomes After This

**Before (current state):**
The user takes a photo. The AI generates 3 tasks. The tasks say things like "Tidy up." The user stares at their phone confused about what specifically to do. They close the app.

**After (post-overhaul):**
The user taps Scan Room. They're asked: "How much time do you have? · What's your energy level?" They take one photo. They see:

```
📍 I spotted 4 zones in your bedroom.
   Total: 9 tasks · EST 23 minutes at your energy level.

⚠️  DOOM PILE: Corner by the door — mixed stuff
   → 3-pile method recommended · EST 8 min

PHASE 1 — Quick Wins (EST 7 min)
──────────────────────────────────
🔗 DO THESE TOGETHER — All near the closet:
   1. Grab 3 gray hoodies off floor near the closet · EST 45 sec  
   2. Pick up 2 sneakers right next to them · EST 30 sec
   3. Toss the 4 crumpled items near the shoes · EST 30 sec
   ─ Do all 3 in one trip · EST 2 min combined
   
☕ Stack the 3 coffee mugs from your nightstand → kitchen sink · EST 1.5 min

📄 Collect the loose papers on the right side of your desk → one stack, don't sort · EST 1 min
```

The user feels **seen, understood, and guided**. They start. They finish. They come back.

---

*This document represents the difference between a novelty app and a daily habit tool.*
*The AI data is already there. The types are already modeled. The features just need to be wired together and the prompt needs to stop being polite.*
