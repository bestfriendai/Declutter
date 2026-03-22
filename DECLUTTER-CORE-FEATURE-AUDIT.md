# DECLUTTER — CORE FEATURE DEEP AUDIT

**Date:** 2026-03-20
**Focus:** The one thing this app does: Take a photo of a messy room → get specific, detailed tasks → guided cleaning
**Standard:** If an AI cleaning robot was alive and looking at your room, how would it tell you to clean?

---

## THE VERDICT IN ONE PARAGRAPH

The Gemini prompt is genuinely excellent — it demands specific objects with colors, counts, locations, destinations, and times. The type system is rich and well-designed. But between the AI generating smart tasks and the user seeing them, **the app throws away half the intelligence.** The detection overlay is literally labeled `{/* Fake detection boxes */}` in the code. Phase assignments from the AI are overridden by a dumb 3-minute threshold. The blitz mode (primary cleaning experience) doesn't show subtasks, zones, objects, or destinations. The supply checklist is generated but never displayed. Detected objects are returned but never shown. Task dependencies exist but are never enforced. The app has a Ferrari engine connected to bicycle wheels.

---

## TABLE OF CONTENTS

1. [The AI Brain — What Gemini Actually Does](#1-the-ai-brain)
2. [The Display Gap — What Users Actually See](#2-the-display-gap)
3. [The Fake Detection Overlay](#3-the-fake-detection-overlay)
4. [Screen-by-Screen: Photo → Clean Flow](#4-screen-by-screen)
5. [What a Robot Cleaner Would Do Differently](#5-what-a-robot-cleaner-would-do)
6. [User Flow Ratings (Clarity / Actionability / ADHD-friendliness)](#6-user-flow-ratings)
7. [The 30 Most Impactful Fixes](#7-the-30-most-impactful-fixes)

---

## 1. THE AI BRAIN

### What the Gemini Prompt Gets RIGHT

The system prompt in `convex/gemini.ts` (lines 50-343) is **legitimately best-in-class**:

**Zero-tolerance task title rules** (lines 174-207):
- Required format: `[VERB] [COUNT + COLOR/MATERIAL + ITEM] [from/off/on] [EXACT LOCATION] -> [DESTINATION] . EST [TIME]`
- Valid: `"Gather 3 gray hoodies off floor near closet door -> laundry basket near bedroom door . EST 45 sec"`
- Invalid: `"Pick up clothes"` (no count, no color, no location, no destination)

**Time estimate formula** (lines 191-200):
- 10 sec/clothing item, 20 sec/dish, 8 sec/paper, 30 sec/random object
- Adds 15 sec/trip for walk time
- Subtasks must be under 2 minutes each

**Phase system:**
- Phase 1: "Operation Floor Rescue" — high visual impact, floor-level
- Phase 2: "Counter Strike" — surfaces, counters, tables
- Phase 3: "The Final Sparkle" — organization, fine-tuning

**Also requests:** Doom piles with anxiety levels, task clusters by proximity, zone detection with clutter density, detected objects with suggested actions, supply checklist, decision points with 5-second defaults, energy-adaptive task counts.

### What the Prompt Gets WRONG

| # | Issue | Impact |
|---|-------|--------|
| 1 | **No `response_mime_type: "application/json"`** in generationConfig (line 641-645). Gemini can return markdown-wrapped JSON, chatty text before/after. Forces fragile `extractJson`/`repairJson` workarounds. | Tasks may fail to parse |
| 2 | **Temperature is 0.7** (line 644). For structured analysis, 0.3-0.4 produces more consistent results. | Unreliable output |
| 3 | **No spatial coordinates requested.** The prompt asks for zones and objects but never asks for approximate bounding box coordinates (x/y percentages). The detection overlay has NO real data to work with. | Fake visual overlay |
| 4 | **No `taskGraph` requested.** The type system defines `TaskGraph` with `criticalPath`, `parallelGroups`, `setupTasks`, `optionalTasks` — but the prompt never asks for it. No dependency graph. | No task ordering intelligence |
| 5 | **No `timeProfiles` or `energyProfiles` requested.** Types define "5-min plan" / "30-min plan" / "full clean" options but prompt doesn't ask for them. | No plan flexibility |
| 6 | **Decision points only at top level.** Per-task decision points aren't requested in the task schema section. The `CleaningTask` type supports `decisionPoints` per task but they're rarely populated. | Decision support sparse |
| 7 | **No walking route optimization.** Nothing in the prompt says "minimize walking." Tasks in the same physical area should be grouped. | Inefficient task order |
| 8 | **`additionalContext` is truncated to 500 chars** (line 573-575 in gemini.ts). User profile data sent from the client gets mangled before reaching Gemini. | Learning loop broken at last mile |
| 9 | **`focusArea` is weakly prompted.** Only overrides phase assignment, doesn't generate more detailed tasks for the focus area. | Focus area underdelivers |
| 10 | **Subtask IDs not generated in parser** (line 1007-1012). `SubTask` type requires `id: string` but parser returns subtasks without IDs. | Subtask toggling unreliable |

---

## 2. THE DISPLAY GAP

The AI returns rich, specific data. Here's what the UI actually shows vs. throws away:

| Data from AI | Shown in UI? | Where | Notes |
|---|---|---|---|
| Task title with objects + destination | YES | All task views | This is the main thing that works |
| Task description | YES | Expanded task card, single-task | Must expand to see |
| Subtasks with time estimates | PARTIAL | Room detail (expanded), single-task (numbered steps) | NOT shown in blitz mode |
| Decision points with 5-sec defaults | PARTIAL | Room detail (expanded) | NOT in blitz, single-task, or task-detail |
| Zone name | PARTIAL | Text label "📍 Zone: ..." on some cards | Never shown ON the photo |
| Target objects | PARTIAL | Single-task only | NOT in blitz or room detail |
| Destination + instructions | PARTIAL | Single-task, expanded room detail | NOT in blitz |
| "Why this matters" | YES | Expanded room detail, single-task | Good ADHD motivation |
| Resistance handler | YES | Expanded room detail | "Feeling stuck?" prompt |
| Tips | YES | Blitz ("Dusty says"), expanded room detail | Good |
| Doom piles | YES | Analysis results (DoomPileCard) | NOT on the photo, NOT in room detail |
| Task clusters | YES | Analysis results (text cards) | NOT actionable, can't start a cluster |
| **Supply checklist** | **NO** | **NEVER DISPLAYED** | Generated, parsed, thrown away |
| **Detected objects** | **NO** | **NEVER DISPLAYED** | Rich object data completely wasted |
| **Zone clutter density** | **NO** | **NEVER DISPLAYED** | Priority/urgency data unused |
| **Zone estimated clear time** | **NO** | **NEVER DISPLAYED** | Per-zone time estimates unused |
| **Zone priority + reason** | **NO** | **NEVER DISPLAYED** | Why to start here — unused |
| **Object condition** | **NO** | **NEVER DISPLAYED** | "needs washing" etc — unused |
| **Object suggested action** | **NO** | **NEVER DISPLAYED** | Per-object cleaning advice unused |
| **Object suggested destination** | **NO** | **NEVER DISPLAYED** | Per-object "put it here" — unused |
| **Task dependencies/enables** | **NO** | **NEVER ENFORCED** | Can complete dependent tasks first |
| **Task graph / critical path** | **N/A** | **NEVER REQUESTED** | Not in prompt |
| **Spatial coordinates** | **N/A** | **NEVER REQUESTED** | Not in prompt = fake overlay |

### The Blitz Gap (Most Critical)

Blitz mode is the PRIMARY cleaning experience — the thing users will use most. Here's what it shows per task:

**Timer View:** Task title + time estimate. That's it.
**Focus View:** Task title + time estimate + Dusty tip. That's it.

Compare to **Single Task screen** which shows: phase, title, time, zone, target objects (up to 3), destination with instructions, numbered subtask steps, mental benefit card, Dusty tip.

**The richest task display is on the least-used screen. The thinnest display is on the most-used screen.** This is backwards.

---

## 3. THE FAKE DETECTION OVERLAY

`app/analysis.tsx` lines 450-470:

```javascript
{/* Fake detection boxes */}
{detectionAreas.slice(0, 4).map((area, i) => (
  <View
    key={i}
    style={{
      position: 'absolute',
      top: `${20 + i * 20}%`,        // Hardcoded diagonal staircase
      left: `${10 + (i % 2) * 30}%`, // Alternating left/right
      width: '45%',
      height: '25%',
      borderWidth: 2,
      borderColor: areaColors[i % areaColors.length],
      borderRadius: 8,
    }}
  />
))}
```

The boxes are placed in a **hardcoded diagonal pattern** regardless of photo content:
- Box 0: top 20%, left 10%
- Box 1: top 40%, left 40%
- Box 2: top 60%, left 10%
- Box 3: top 80%, left 40%

These have **ZERO relationship to actual detected zones or objects.** A user looking at their kitchen photo will see colored boxes floating in random positions that don't correspond to any mess area.

**Why this matters:** The detection overlay is the app's "wow moment" — where AI vision becomes tangible. Making it fake destroys trust. Users who notice the boxes don't match their room will lose confidence in the entire analysis.

**Root cause:** The `Zone` and `DetectedObject` types contain no spatial coordinates (x, y, width, height). The Gemini prompt never asks for bounding boxes. So even if the UI wanted real overlays, there's no data.

---

## 4. SCREEN-BY-SCREEN: PHOTO → CLEAN FLOW

### Camera → Analysis (12-15 taps to first task)

| Step | Taps | Friction |
|------|------|----------|
| Open app, see home screen | 0 | — |
| Tap "Scan a Room" | 1 | Clear CTA |
| Grant camera permission | 2 | One-time |
| Select room type pill | 3 | Default: bedroom (smart) |
| Take photo | 4 | Shutter button |
| Context picker: select energy | 5 | **Pre-filled but still requires confirmation** |
| Context picker: select time | 6 | **Pre-filled but still requires confirmation** |
| Tap "Analyze My Room" | 7 | — |
| Wait for scanning animation | — | 3 phases, ~800ms artificial delay |
| Wait for detection overlay | — | Fake boxes for 800ms |
| See results | — | — |
| Tap "Start with 3 easy wins" or "See all tasks" | 8 | **Decision point** |
| If "See all tasks": task-customize → "Add to Room" | 9-10 | More decisions |
| Room detail loads | — | — |
| See first task | — | Finally |

**For an ADHD user who opened the app in a moment of motivation, 8-10 taps (with decisions) is the minimum.** The camera context picker and the analysis CTAs are the biggest friction points.

### Analysis Results Screen

**What it shows:**
- Small photo thumbnail (passive, not annotated)
- "X things spotted" + "about Y min total" summary pills
- Photo quality warning (if low confidence)
- Doom pile cards (DoomPileCard component — text only, not on photo)
- Task cluster cards (text only, not actionable)
- Area cards listing tasks grouped by phase/zone

**What it should show:**
- Annotated photo with tappable zones
- "Before you start, grab: trash bag, cleaning spray, paper towels" (supply checklist — generated but never displayed)
- Detected objects list ("I can see: 3 coffee mugs, a pile of mail, 4 water bottles...")
- Zone priority explanation ("Start with the floor — it's blocking movement to other areas")

### Room Detail Screen

**Phase reclassification bug** (`lines 77-84`): The client OVERRIDES the AI's phase assignments:
```javascript
function classifyPhase(task): 'quickWins' | 'deepClean' | 'organize' {
  if (task.estimatedMinutes <= 3 || task.difficulty === 'quick') return 'quickWins';
  if (task.category === 'organization' || task.category === 'donation_sorting') return 'organize';
  return 'deepClean';
}
```

If the AI assigns a 5-minute high-visual-impact task to Phase 1 ("Operation Floor Rescue"), the client moves it to "Deep Clean" because it's over 3 minutes. **The AI's carefully designed phase progression is destroyed by a simplistic time threshold.**

**No zone-based grouping.** Tasks are grouped by phase (Quick Wins / Deep Clean / Organize), not by physical room zone. A user must mentally translate phase names to spatial locations. A robot cleaner would say: "Near the desk: [3 tasks]. Floor: [4 tasks]. Closet area: [2 tasks]."

**Task dependencies ignored.** The AI generates `dependencies`, `enables`, and `parallelWith` fields, but the UI never checks them. You can complete a task that depends on an incomplete task.

### Blitz Mode (Primary Cleaning Experience)

**Timer View shows:** Task title + time estimate. Nothing else.
**Focus View shows:** Task title + time estimate + Dusty tip. Nothing else.

Missing from blitz that exists elsewhere:
- Subtask steps (shown in single-task and expanded room detail)
- Zone/location (shown in single-task)
- Target objects (shown in single-task)
- Destination + instructions (shown in single-task and expanded room detail)
- Decision points (shown in expanded room detail)
- "Why this matters" (shown in expanded room detail and single-task)
- Resistance handler (shown in expanded room detail)

**No carry chain optimization.** If you're going to the kitchen to put away a mug, the blitz doesn't tell you to also grab the plate that goes to the kitchen. `TaskCluster` data (proximity groups, carry chains) exists but is completely ignored.

**No phase transition celebration.** When Phase 1 is complete, there's no "Phase 1 complete! Floor is clear. Ready for Counter Strike?"

### Single Task Screen (Best Display, Least Used)

Shows everything: phase, title, time, zone, target objects, destination, subtask steps, mental benefit, Dusty tip. This is what blitz mode should look like.

---

## 5. WHAT A ROBOT CLEANER WOULD DO DIFFERENTLY

### Before Cleaning Starts
1. **Show a supply checklist:** "Before you start, grab: trash bag, all-purpose spray, paper towels" — data exists but is never displayed
2. **Show detected objects:** "I can see: 3 coffee mugs on the desk, a pile of mail near the keyboard, 4 water bottles on the floor, clothes draped over the chair" — data exists but is never displayed
3. **Show zones with priority:** "I've identified 4 zones. Starting with the floor — it's the most cluttered and clearing it gives you room to move" — data exists but is never displayed
4. **Show the room photo with annotated zones:** Tap a zone to see its tasks — requires spatial coordinates (not currently in the data)

### During Cleaning
5. **Group tasks by physical zone:** "DESK AREA (3 tasks, 4 min): 1) Grab mugs → kitchen sink, 2) Stack papers → inbox tray, 3) Wipe surface" — instead of phase-based grouping
6. **Show carry chains:** "You're going to the kitchen anyway — also grab the plate from the nightstand" — TaskCluster data exists but is unused
7. **Enforce dependencies:** "Before you can organize the desk, clear the surface first" — dependency data exists but is unenforced
8. **Show zone progress:** "Desk area: 2/3 tasks done! One more and this zone is clear" — zone data exists but isn't tracked
9. **Explain the sequence:** "We're starting with the floor because it has the highest visual impact and clears space to reach other areas" — `whyThisMatters` exists per task but no sequence-level explanation

### After Cleaning
10. **Zone-by-zone completion:** "Floor: ✅ Complete! Desk: ✅ Complete! Closet area: 1 task remaining" — instead of flat task list
11. **Before/after with zone annotations:** Show which areas changed — instead of tiny side-by-side thumbnails
12. **Suggest recurring tasks:** "Your kitchen gets messy every 2-3 days. Want me to remind you?" — RecurringTask type exists but is never implemented

---

## 6. USER FLOW RATINGS

| Screen | Clarity | Actionability | ADHD-Friendly | Notes |
|--------|---------|---------------|---------------|-------|
| Home (empty) | 9 | 9 | 8 | Single CTA, mascot, tip. Near-perfect. |
| Home (populated) | 7 | 8 | 6 | **Too many sections.** 7+ cards competing for attention. |
| Camera | 7 | 7 | 5 | Context picker interrupts momentum with 2 decisions. |
| Analysis (scanning) | 8 | N/A | 7 | "No judgment" messaging is excellent. |
| Analysis (detection) | 5 | N/A | 5 | **Fake boxes damage trust.** |
| Analysis (results) | 7 | 6 | 6 | Multiple CTAs = decision point. Supply list missing. |
| Task Customize | 6 | 7 | 5 | Too many decisions. "Easy wins" should be primary. |
| Room Detail | 7 | 8 | 7 | Good expandable detail. Phase reclassification is wrong. |
| **Blitz (focus view)** | **8** | **9** | **9** | **Best ADHD screen.** But missing subtasks/zone/destination. |
| Single Task | 8 | 9 | 9 | Best task display. Least used screen. |
| Task Detail | 8 | 7 | 7 | Alert-based subtask display is ugly. |
| Focus/Timer | 8 | 7 | 7 | **Pro-only gating is wrong** for ADHD users. |
| Session Complete | 9 | 8 | 9 | Celebrates without pressure. "I'm done for now" is perfect. |
| Room Complete | 9 | 7 | 9 | Confetti, before/after, XP counter. Great celebration. |
| Today's Tasks | 8 | 8 | 7 | Cross-room daily curation. "One Tiny Thing" is brilliant. |
| Insights | 6 | 5 | 5 | Some data was fabricated (now fixed). Passive viewing. |
| Achievements | 7 | 5 | 6 | Viewing only. Badge progress is motivating but passive. |

**Overall ADHD-friendliness: 7/10** — The philosophy is excellent (shame-free, one-task-at-a-time, grace periods). The execution leaks intelligence between the AI and the display layer.

---

## 7. THE 30 MOST IMPACTFUL FIXES

### Tier 1: Make the AI Intelligence Visible (Critical)

| # | Fix | Impact | Effort |
|---|-----|--------|--------|
| 1 | **Remove fake detection boxes OR request spatial coordinates from Gemini** — Add `approximate_bounding_boxes` to the prompt asking for zone x/y percentages relative to image. Use them for real overlays. If not possible, remove the detection phase entirely — honest > fake. | Trust, wow factor | High |
| 2 | **Stop reclassifying phases client-side.** Delete the `classifyPhase` function. Use the AI's `phase` field directly for tab grouping. Map phase 1→"Quick Wins", 2→"Deep Clean", 3→"Organize". | Correct task ordering | Low |
| 3 | **Show subtasks, zone, target objects, destination in blitz focus view.** Port the rich display from `single-task.tsx` into blitz mode. This is the primary cleaning experience. | Task specificity in the screen that matters most | Medium |
| 4 | **Display the supply checklist** on analysis results screen. "Before you start, grab: ..." — data already generated and parsed, just needs a UI section. | Preparation, fewer interruptions | Low |
| 5 | **Display detected objects** on analysis results. "I can see: 3 coffee mugs, pile of mail, 4 water bottles..." — data already generated, just needs rendering. | AI feels smarter, builds trust | Low |
| 6 | **Add `response_mime_type: "application/json"`** to Gemini generationConfig. Eliminates fragile JSON extraction/repair. | Reliability | Low |
| 7 | **Lower Gemini temperature to 0.4.** More consistent structured output. | Reliability | Low |

### Tier 2: Make Tasks Smarter (High)

| # | Fix | Impact | Effort |
|---|-----|--------|--------|
| 8 | **Group tasks by zone in room detail** — Add a "By Zone" tab alongside phase tabs. Group tasks by their `zone` field: "Near the desk: [tasks]. Floor: [tasks]. Closet area: [tasks]." | Spatial understanding | Medium |
| 9 | **Enforce task dependencies** — When a user tries to complete a task with unfinished dependencies, show a brief warning: "Complete 'Clear desk surface' first." | Correct sequence | Medium |
| 10 | **Add carry chain awareness to blitz** — When presenting the next task, check TaskCluster data for carry_chain type. If the next task goes to the same destination, surface it: "You're heading to the kitchen — also grab the plate from the nightstand." | Efficiency | Medium |
| 11 | **Show zone progress** — Per-zone completion tracking: "Desk area: 2/3 tasks ✓" as a collapsible section. | Progress visibility | Medium |
| 12 | **Explain task sequence** — When showing the first task, add a one-liner: "Starting with the floor — clearing it first gives you room to move." Use the zone's `priorityReason` field. | Understanding | Low |
| 13 | **Generate subtask IDs** in `parseAnalysisResponse`. Use `subtask-{taskIndex}-{subtaskIndex}` pattern and set `completed: false`. | Subtask toggling works | Low |
| 14 | **Remove `additionalContext` 500-char truncation** in `convex/gemini.ts`. The user profile data is getting mangled. Increase to 2000 or pass as a separate structured field. | Learning loop works | Low |

### Tier 3: Reduce Friction (High)

| # | Fix | Impact | Effort |
|---|-----|--------|--------|
| 15 | **Auto-confirm camera context picker when pre-filled.** Show a collapsed summary "Energy: Moderate · Time: 30 min" with a small "Change" link. Don't force the full picker every time. | 2 fewer decisions | Medium |
| 16 | **Make "Start with easy wins" the PRIMARY CTA** on task-customize, not secondary. For ADHD, fewer tasks = less overwhelm = more likely to start. | Conversion | Low |
| 17 | **Add phase transition celebrations in blitz** — When all Phase 1 tasks are done: "Phase 1 complete! Floor is clear. Ready for Counter Strike?" with a brief animation. | Dopamine, progress sense | Medium |
| 18 | **Add undo toast after task completion** — 5-second "Undo" snackbar that appears after checking a task. Especially important in blitz where you can't go back. | Error recovery | Medium |
| 19 | **Fix "One Tiny Thing" navigation** — Currently taps to `/camera` instead of completing the tiny task. Should mark the tiny task as done directly, or navigate to a relevant room. | Core promise kept | Low |
| 20 | **Simplify home screen for returning users** — Collapse to: (1) One prominent CTA, (2) Today's Tasks, (3) Your Spaces. Move streak/consistency/comeback into a collapsible header. | Cognitive load | Medium |

### Tier 4: Visual & Polish (Medium)

| # | Fix | Impact | Effort |
|---|-----|--------|--------|
| 21 | **Show before photo reference during blitz/session** — Small thumbnail in corner so users remember what they're working on. | Spatial orientation | Low |
| 22 | **Add zone-based task transitions in blitz** — When moving to a task in a different zone, briefly show "Moving to: Desk Area" with the zone name. | Spatial guidance | Low |
| 23 | **Before/after comparison slider on room-complete** — Replace tiny side-by-side thumbnails with an interactive slider. | Wow factor, shareability | Medium |
| 24 | **Camera photo guidance** — Replace faint "Hold steady" hint with visual examples or tips: "Capture the full room · Good lighting · Include the messiest area." | Photo quality | Low |
| 25 | **Softer freshness labels** — Replace "Overdue" with "Ready for a refresh" to match no-guilt philosophy. | ADHD anxiety | Low |
| 26 | **Specific notifications** — Replace "Dusty's ready when you are" with "Your kitchen has 2 quick tasks (4 min total)." Reference actual rooms and task counts. | Re-engagement | Medium |
| 27 | **Add "Continue where you left off" banner** — If activeRoomId has incomplete tasks, show a prominent resume button at the top of home screen. | Returning user flow | Low |
| 28 | **Task transition animation in blitz** — Brief crossfade or slide between tasks instead of instant swap. | Polish, intentionality | Low |
| 29 | **Make doom pile "Start" button filter to pile tasks only** — Currently creates room with ALL tasks. Should use `linkedTaskIds` to show only doom pile tasks. | Focused cleaning | Medium |
| 30 | **Unfree Focus Mode** — Pomodoro timers are essential ADHD tools, not premium features. Gate something else behind Pro. | ADHD users not punished | Low |

---

## BOTTOM LINE

**The AI is smart. The display is dumb.**

Gemini returns zones with clutter density, detected objects with conditions and suggested destinations, doom piles with anxiety levels, task clusters with carry chains, supply checklists, decision points with 5-second defaults, and per-task dependencies. The app throws most of it away and shows text lists grouped by a broken phase classification.

The fix is not to make the AI smarter — it's to **make the UI worthy of the AI.** Show the supply checklist. Show the detected objects. Use the AI's phases instead of overriding them. Put subtask steps in blitz mode. Group tasks by zone. Enforce dependencies. Show zone progress. And either get real spatial coordinates from Gemini for the detection overlay, or remove the fake boxes entirely.

The core user promise — "a robot that tells you exactly what to pick up, where to put it, and in what order" — is delivered by the AI and betrayed by the UI.
