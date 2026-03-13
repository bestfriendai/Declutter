# Declutterly — Brutal UI/UX & Flow Critique + Improvement Plan

> Audience: People who struggle with cleaning — ADHD, executive dysfunction, depression, low motivation.
> Core loop: Photo of messy room → AI analysis → Phases & step-by-step cleanup.

---

## Overall Verdict

**The app is a $50k design project with a $500 AI implementation.** The visual design is stunning (Apple 2026 aesthetic), the engineering is solid, but the user experience is fundamentally broken for its target audience. Every screen prioritizes features over simplicity, data over action, and gamification over empathy.

**Average AI Pipeline Score: 3.3/10**

---

## Part 1: UI Design Failures

### 1.1 Home Screen — Cognitive Overload

**File:** `app/(tabs)/index.tsx`

The home screen has **7 distinct content sections** before scrolling:
1. Greeting with emoji (34pt — aggressive)
2. Streak badge (tucked after greeting, not prominent)
3. 3 stat pills (tasks, rooms, XP)
4. 4 Quick Action gradient cards (New Room, Focus Mode, Quick Win, Insights)
5. Mascot greeting card
6. Rooms grid with progress bars
7. "Today's Focus" card (buried below rooms)

**Problems:**
- 4 Quick Action buttons = **decision paralysis**. A struggling user wants ONE clear action, not four competing CTAs.
- "Today's Focus" appears LOWER than "Your Rooms" but is labeled as the priority. Broken hierarchy.
- Room cards show tiny progress bars with low percentages (8%, 12%) — constant reminders of failure.
- Empty state text ("Take a photo of any messy space") reads like homework.
- The greeting uses `displaySmall` at 34pt — top-heavy and aggressive.

**Emotions triggered:** Anxiety, overwhelm, guilt.

**Improvements:**
- [ ] Reduce home screen to ONE primary CTA: "What should I do right now?" with smart task recommendation
- [ ] Move "Today's Focus" to the TOP, before rooms
- [ ] Replace 4 Quick Action buttons with a single contextual action based on user state
- [ ] Show progress as "2 tasks done this week!" not "12% complete"
- [ ] Remove stat pills — they're vanity metrics that create cognitive distance from the goal
- [ ] Add "I have X minutes" selector at top to filter everything below it

### 1.2 Progress Screen — Data Dashboard Nobody Asked For

**File:** `app/(tabs)/progress.tsx`

- Activity Rings (Apple-inspired) crammed into a GlassCard with tiny legend text
- 6 stat cards in a 3-column grid showing vanity metrics (Badges: 2, XP: 4500)
- Weekly chart with days showing 0 tasks as tiny bars (visual noise)
- Badge section truncated to 4 (2 earned + 2 LOCKED)

**Problems:**
- Big numbers (4500 XP, 127 focus minutes) don't translate to "my room is cleaner"
- The progress screen becomes a procrastination tool — "let me check my stats" instead of cleaning
- Days with 0 tasks still render as tiny bars, creating visual noise on empty weeks

**Emotions triggered:** Detachment, analysis paralysis, irrelevance.

**Improvements:**
- [ ] Replace vanity metrics with meaningful progress: "Rooms improved", "Items moved", "Hours saved"
- [ ] Show before/after photo comparison as the star of the progress screen
- [ ] Remove or hide XP/badges from this screen — they belong in profile, not progress
- [ ] Empty days should show nothing, not tiny bars
- [ ] Add "This week vs last week" simple comparison

### 1.3 Profile Screen — Information Overload

**File:** `app/(tabs)/profile.tsx`

- Hero card packed with: avatar, level badge, XP bar, and 4 quick stats crammed horizontally
- 4 settings groups with 11 rows total — too many navigation paths
- Hero stats use emoji (checkmark, fire, trophy, star) with no text labels — indistinguishable at arm's length

**Improvements:**
- [ ] Simplify hero card to: name, level, ONE motivating stat
- [ ] Collapse settings groups from 4 to 2 (Account + Preferences)
- [ ] Add text labels to all emoji-only elements
- [ ] Remove navigation to /achievements, /insights from profile — hide behind progressive disclosure

### 1.4 Tab Bar — Subtle to a Fault

**File:** `app/(tabs)/_layout.tsx`

- Uses emoji (house, chart, person) with no label fallback
- Active indicator is nearly invisible (`rgba(255,255,255,0.12)`)
- Inactive tab opacity at 0.5 makes it hard to identify which tab is active

**Improvements:**
- [ ] Add text labels under tab icons
- [ ] Increase active indicator contrast (at least 3:1 ratio)
- [ ] Use SF Symbols or proper icons instead of emoji

### 1.5 Camera Screen — Friction Mountain

**File:** `app/camera.tsx` (1143 lines — too complex)

After capturing a photo, users must:
1. See the preview
2. Choose "Retake" or "Analyze"
3. If no active room → see room selector modal
4. Choose room type from grid (8+ options, no skip)

**That's 4 modal layers deep.** For ADHD users, this is devastating.

**Additional issues:**
- Corner guide animations pulse — may distract while framing a shot
- Gallery button is only 56x56 — small touch target while holding phone steady
- No "Auto-detect room type" option — forced manual choice
- No photo quality feedback (lighting, angle, coverage)

**Improvements:**
- [ ] Auto-detect room type from photo using AI (remove manual selection for most cases)
- [ ] Combine preview + room selection into one screen
- [ ] Add photo quality indicator: "Too dark — try with flash" / "Get more of the room in frame"
- [ ] Increase gallery button size to 64x64 minimum
- [ ] Stop pulsing guides once user holds steady for 2 seconds
- [ ] Support multi-photo analysis: "Take another angle of the closet"

### 1.6 Analysis Screen — Cinematic But Slow

**File:** `app/analysis.tsx`

- Loading spinner for 3-5 seconds with no progress indicator
- Cinematic reveal animation is fun but delays action
- No estimated wait time shown

**Improvements:**
- [ ] Add progress indicator: "Analyzing with AI... ~3 seconds"
- [ ] Show immediate placeholder tasks while AI processes (based on room type)
- [ ] Skip cinematic reveal — let users opt into it, not force it
- [ ] Add "Analyzing: Found 12 items, creating tasks..." incremental updates

### 1.7 Auth Screens — Dark and Straining

**Files:** `app/auth/login.tsx`, `app/auth/signup.tsx`

- Gradient goes from `#000000` to `#0A0A0F` — near-black causing eye strain on OLED
- Password toggle uses text ("Show"/"Hide") instead of icon — small touch target
- No "Forgot Password?" link visible
- No success feedback on login — screen just transitions
- Signup requires 3 fields (name + email + password) before any value is shown

**Improvements:**
- [ ] Lighten dark mode gradients (use `#1C1C1E` base, not pure black)
- [ ] Add password toggle icon instead of text
- [ ] Add "Forgot Password?" link
- [ ] Add loading/success animation on auth actions
- [ ] Allow anonymous/guest access to try the app before signing up
- [ ] Reduce signup to email + password only (name can come later)

### 1.8 Social Screen — ADHD-Hostile Form

**File:** `app/social.tsx`

- Creating a challenge requires **5 form inputs**: title, description, type (5 options), target, duration
- Challenge cards show: header + progress bar + avatar stack + invite code — 4 sections per card
- No discovery mechanism for finding challenges (invite code only)

**Improvements:**
- [ ] Replace 5-input form with "Quick Challenge" templates (1 tap to create)
- [ ] Simplify challenge cards to: title + progress + 1 CTA
- [ ] Add challenge discovery/browse (not just invite codes)
- [ ] Consider if social features help or harm the target audience — social pressure may be counterproductive

### 1.9 Cross-Cutting Design Issues

**Animations overuse:**
- Every screen uses FadeInDown, ZoomIn, SlideInUp
- No `prefers-reduced-motion` support
- Constant motion is distracting/triggering for neurodivergent users

**Spacing inconsistency:**
- Card padding varies: 12, 14, 16, 20 across screens
- No standardized padding token for card content

**Color contrast:**
- No WCAG AA audit done
- Some text on colored backgrounds likely < 4.5:1 ratio

**Improvements:**
- [ ] Add `prefers-reduced-motion` / `accessibilityReduceMotion` detection — disable animations when active
- [ ] Standardize card padding to one token (16pt recommended)
- [ ] Audit all text for WCAG AA contrast (4.5:1 minimum)
- [ ] Use colorblind-friendly palettes for progress indicators (not just red/green)

---

## Part 2: User Flow Failures

### 2.1 First-Time User Flow — 12-30 Minutes to First Win

| Step | Time | Decisions |
|------|------|-----------|
| Download | 1 min | 0 |
| Signup (3 fields) | 2-3 min | 3 |
| Home screen orientation | 10-30 sec | 4+ (which button?) |
| Camera + photo | 2-5 min | 2 (take/retake) |
| Room type selection | 30 sec | 1 (8 options) |
| AI analysis wait | 3-5 sec + 1 min reading | 0 |
| Task selection | 30 sec | 1 |
| **First task completion** | **3-10 min** | **1** |

**Total: 12-30 minutes before first win.** Users with executive dysfunction lose focus by minute 8.

**Improvements:**
- [ ] Allow anonymous access — skip signup entirely on first use
- [ ] Show value BEFORE asking for account creation
- [ ] Auto-detect room type to remove one decision
- [ ] Pre-populate with "Try the demo room" for instant gratification
- [ ] Target: First win in under 5 minutes

### 2.2 Drop-Off Points

**Point 1: Analysis Screen Delay**
User takes photo, sees spinner, thinks it's broken, navigates away.
→ Fix: Progress indicator + estimated time

**Point 2: First Room With All Tasks**
AI generates 6 tasks. User sees task list at 0% complete. "This is a LOT of work." Closes app.
→ Fix: Show only the first task. Reveal next task after completion. Never show total count upfront.

**Point 3: Day 2 — No Grace**
User returns, sees: no streak, same home screen, no "welcome back."
→ Fix: "Hey! You came back. That's the hardest part."

**Point 4: Achievements Screen — Shame Theater**
User sees 5/54 badges earned. Progress bars at 2%, 5%, 12%.
→ Fix: Show only EARNED badges. Hide locked ones. Celebrate what's done, not what isn't.

### 2.3 Feature Bloat Distracting From Core Mission

| Feature | Verdict | Action |
|---------|---------|--------|
| Mascot system | Distraction — feeding/mood adds guilt if mascot is "hungry" | Simplify to encouragement-only (no feeding) |
| Collectibles/AR | Pure distraction — rarity tiers, spawn events | Remove or hide behind level gate |
| Social/Challenges | Social pressure hurts overwhelmed users | Make opt-in, not prominent |
| Achievements/Badges | Mostly LOCKED = shame theater | Show earned only, hide locked |
| Focus Timer | Helpful but separate concern | Keep but deprioritize |
| Insights | Analytics for people avoiding action | Hide behind profile |
| XP System | Arbitrary numbers, no meaning | Replace with "rooms improved" metric |

### 2.4 Missing Emotional Design

**What should exist but doesn't:**

1. **Mercy/Grace States**
   - "Skipped yesterday? No judgment. Let's start fresh."
   - "Feeling overwhelmed? Pick just ONE task."
   - Streak reset without guilt

2. **Effort-Based Rewards**
   - "You spent 5 minutes cleaning" = worth celebrating
   - "You made a decision" = worth something
   - Currently: Only completion counts. Effort is invisible.

3. **Energy-Aware Sessions**
   - On app launch: "How much time do you have? How's your energy?"
   - Filter tasks accordingly (exists in types but never shown in UI)
   - "Exhausted" mode = zero-decision tasks only

4. **Hidden Motivation Content**
   - `resistanceHandler` field: "You only need to pick up obvious trash" — **NEVER DISPLAYED**
   - `whyThisMatters` field: "Clear surfaces reduce visual noise. Your brain will feel calmer." — **NEVER DISPLAYED**
   - These are GOLD for motivation but the UI hides them

5. **"Good Enough" Celebrations**
   - "You moved 3 items! That's real progress."
   - "45% visual impact cleared. Want to stop here? You've earned it."
   - Currently: Only 100% completion triggers celebration

**Improvements:**
- [ ] Display `resistanceHandler` text on every task card when expanded
- [ ] Display `whyThisMatters` as motivation banner above task details
- [ ] Add "Done for today" button at any point — celebrate partial progress
- [ ] Add energy check-in on app launch (not buried in room detail)
- [ ] Replace streak guilt with grace: "Life happens. This room is here when you're ready."

---

## Part 3: AI Pipeline Failures

### 3.1 Prompt Quality — 4/10

**File:** `services/gemini.ts`, lines 141-261

**Contradictions in the prompt:**
- Says "Break down tasks into TINY, achievable steps (2-10 minutes each)"
- Then limits to "4-6 actionable tasks (not more)"
- A bedroom with 100 items of clutter gets compressed into 6 tasks

**Missing from the prompt:**
- No detection of user capabilities (mobility, living situation)
- No mess severity scaling (messLevel 95 vs 40 get same treatment)
- No emotional context detection
- "Quick wins" are mentioned but never actually reordered by visual impact
- `quickWins` output field is just string list — not even task IDs, never consumed

**Improvements:**
- [ ] Scale task count by messLevel: low (3-4 tasks), medium (6-8), high (15-20 micro-tasks)
- [ ] Add user context to prompt: time available, energy level, physical limitations
- [ ] Remove the 4-6 task cap — let AI generate as many micro-tasks as needed
- [ ] Order tasks by visual impact (highest first for quick dopamine)
- [ ] Make `quickWins` reference actual task IDs, surface them prominently in UI

### 3.2 Task Granularity — 3/10

**The Core Problem:**

Current AI output for a bedroom:
```
Task: "Make the bed" (3 min)
Subtask: "Straighten sheets and arrange pillows"
```

What an ADHD user actually needs:
```
1. Remove 3 items from bed surface (15 sec)
2. Pull fitted sheet corner at headboard, tuck (30 sec)
3. Pull fitted sheet corner at foot, tuck (30 sec)
4. Pull top sheet up to pillow line (45 sec)
5. Fluff and place 2 pillows at headboard (60 sec)
```

**The prompt asks for 4-6 tasks when the user needs 15-60 micro-steps.**

The fallback tasks (hardcoded in `gemini.ts`, lines 435-584) are actually BETTER than AI-generated ones — because humans wrote them with more granularity. This proves the AI isn't being prompted correctly.

**Improvements:**
- [ ] Restructure prompt: generate object-level instructions, not category-level tasks
- [ ] Require 5-10 subtasks per task minimum (not 2-3)
- [ ] Add explicit instruction: "Each subtask must be completable in under 2 minutes"
- [ ] Use fallback task quality as the benchmark for AI output
- [ ] Include specific detected objects in subtask instructions ("move the blue mug to kitchen")

### 3.3 Phase System — 2/10

**Types define it, UI ignores it.**

| Feature | Schema/Types | UI Implementation |
|---------|-------------|-------------------|
| Time profiles (5/15/30/60 min) | Defined in types | **Never shown to user** |
| Energy profiles (exhausted→high) | Defined in types | **Never shown to user** |
| Task graph (critical path) | Stored in schema | **Never rendered** |
| Parallel groups | Stored in schema | **Never suggested** |
| Task dependencies | Stored in schema | **Never enforced** |
| Decision load | Defined in types | **Never filtered** |

**Improvements:**
- [ ] Add time selector to room detail: "I have 5 / 15 / 30 / 60 minutes"
- [ ] Filter visible tasks by selected time profile
- [ ] Add energy selector: "How's your energy?" → filter out high-decision tasks for exhausted users
- [ ] Grey out tasks with unmet dependencies
- [ ] Show parallel groups: "You can do these 3 at the same time"
- [ ] Use critical path to suggest optimal task order

### 3.4 Photo Analysis — 5/10 (camera good, feedback missing)

**Good:** Camera UI is polished with corner guides and countdown timer.

**Bad:**
- `photoQuality` (lighting/coverage/clarity/confidence) is computed but **never shown to user**
- If confidence < 0.6, app proceeds anyway — should suggest retake
- Only 1 photo per analysis — should support multiple angles
- No "Enable flash for indoor photos" guidance
- No "Take another photo of the closet" follow-up

**Improvements:**
- [ ] Show photo quality feedback before analysis: "Too dark — try flash" / "Get more of the room"
- [ ] If confidence < 0.6, suggest retake with specific guidance
- [ ] Support multi-photo rooms: "Add another angle for better analysis"
- [ ] Auto-enable flash suggestion in low-light conditions

### 3.5 Progress Tracking — 3/10

**Before/after comparison is the killer feature that doesn't exist in the UI.**

- `analyzeProgress()` function exists in `gemini.ts` (lines 679-790)
- Photo types support 'before' | 'progress' | 'after'
- But there's **no screen** that lets users take an "after" photo and compare
- Progress % is just completed/total tasks — no visual impact weighting
- No "good enough" AI detection: "You've cleared 60% of visible clutter"

**Improvements:**
- [ ] Add "Take Progress Photo" button in room detail
- [ ] Build side-by-side before/after comparison view
- [ ] Weight progress by visual impact, not just task count
- [ ] AI-driven "good enough" detection: celebrate 50%+ visual improvement
- [ ] Make before/after the star of the progress screen

### 3.6 Data Model — 60% Unused

| Feature | Status | Action |
|---------|--------|--------|
| DetectedObjects | Parsed, never stored in DB | Add table, enable item-level tracking |
| Task dependencies | Stored, never rendered | Grey out blocked tasks, show order |
| Zones | Metadata only | Add "focus on zone" mode |
| DecisionPoints | Parsed, never displayed | Show inline prompts during sorting tasks |
| UserCleaningProfile | Type exists, never instantiated | Build learning system from task history |
| resistanceHandler | In task data, never shown | Display on every task card |
| whyThisMatters | In task data, never shown | Show as motivation banner |

### 3.7 Personalization — 1/10

`UserCleaningProfile` type exists with:
- taskHistory, energyPatterns, preferences, motivationProfile
- preferredTaskSize, respondsToGamification, avoidsDecisionTasks

**None of this is implemented.** All users get identical prompts, identical task sizes, identical encouragement.

**Improvements:**
- [ ] Store UserCleaningProfile in Convex schema
- [ ] Track: which tasks users complete vs skip vs abandon
- [ ] Adapt task sizes based on user's actual completion patterns
- [ ] Personalize encouragement style based on what works for each user
- [ ] Calibrate time estimates from actual user performance
- [ ] After 3 sessions, stop showing tasks the user consistently skips

### 3.8 Missing Intelligence

| Missing Feature | Impact | Priority |
|----------------|--------|----------|
| Tool/supply detection | Users get derailed mid-task when they need supplies | HIGH |
| Time distribution per task | Users with 10 min don't know which tasks fit | HIGH |
| Micro-motivation per subtask | Generic encouragement vs task-specific | HIGH |
| Sensory accommodation notes | "Wear gloves, open window" for bathroom tasks | MEDIUM |
| "Skip if..." prerequisites | "Can't organize closet without hangers" | MEDIUM |
| Difficulty warnings | "This task requires many decisions" | MEDIUM |
| Item-level tracking | "Move blue mug" → mark specific item done | LOW |

---

## Part 4: Competitor Gap Analysis

| Feature | Declutterly | Tody | Unfilth Your Habitat | FlyLady |
|---------|-------------|------|----------------------|---------|
| Visual design | 10/10 | 6/10 | 3/10 | 2/10 |
| Task granularity | 3/10 | 8/10 (1000+ micro-tasks) | 9/10 (shame-free micro-steps) | 7/10 (15-min zones) |
| Time-based filtering | 1/10 (exists, unused) | 9/10 ("5 min?") | 8/10 | 10/10 (timer-core) |
| Before/after comparison | 1/10 (code exists, no UI) | 7/10 | 8/10 | 6/10 |
| Emotional scaffolding | 2/10 | 5/10 | 9/10 (empathetic micro-copy) | 8/10 (daily cheerleading) |
| Offline support | 0/10 | 10/10 | 0/10 | 8/10 (email) |
| AI-powered analysis | 8/10 (unique feature) | 0/10 | 0/10 | 0/10 |

**Declutterly's unique advantage is AI photo analysis — no competitor has it.** But the advantage is squandered by weak task generation and unused data.

---

## Part 5: Priority Improvement Roadmap

### Phase 1: Stop the Bleeding (Week 1)
*Fix what's actively hurting users.*

1. **Display `resistanceHandler` and `whyThisMatters` on task cards** — unlock hidden motivation content that already exists
2. **Add "Done for today" button** — celebrate partial progress at any point
3. **Show only EARNED badges** — hide locked achievements
4. **Simplify home screen** — ONE big CTA based on context, remove 4 Quick Action buttons
5. **Add grace messaging** — "Life happens" for missed streaks

### Phase 2: Fix the Core Loop (Week 2-3)
*Make the AI pipeline actually work for overwhelmed users.*

6. **Rewrite AI prompt** — scale tasks by messLevel, 15-20 micro-steps for high mess, object-level specificity
7. **Implement time/energy selectors** — filter tasks by "I have 5 min" and "I'm exhausted"
8. **Add photo quality feedback** — show retake guidance when confidence is low
9. **Build before/after comparison** — make progress visible and motivating
10. **Implement task dependencies** — grey out blocked tasks, suggest optimal order

### Phase 3: Personalize (Week 4-5)
*Make the app learn and adapt.*

11. **Store UserCleaningProfile** — track task completion patterns
12. **Adapt task sizes** — show more quick tasks to users who prefer them
13. **Personalize encouragement** — calibrate messaging style
14. **Add tool/supply detection** — "You'll need: trash bag, cleaning spray"
15. **Multi-photo analysis** — support multiple room angles

### Phase 4: Reduce Noise (Week 6)
*Cut features that distract from the core mission.*

16. **Simplify mascot** — remove feeding/mood, keep as encouragement-only companion
17. **Hide collectibles** — gate behind Level 5 or remove entirely
18. **Make social opt-in** — remove from home screen, add to profile
19. **Collapse settings** — 2 groups max
20. **Add reduced motion support** — detect `accessibilityReduceMotion`

---

## The Brutal Truth

> "Your app is a beautiful prison. It's polished, it has great features, and it will almost certainly fail to help the people most in need of help."

The app is built for people who are motivated and detail-oriented, not for people who struggle with motivation and overwhelm. The AI infrastructure needs a complete rewrite. The UI needs radical simplification. The emotional design needs to shift from "look at your progress" to "you showed up, and that's enough."

**The single most impactful change:** Display `resistanceHandler` and `whyThisMatters` on every task card. This content already exists in your data model — you just never show it to users. It's the difference between "Clear One Surface Completely" and "Clear One Surface Completely — *This matters because clear surfaces reduce visual noise. Your brain will feel calmer. Having trouble starting? Just move 3 items. That's it.*"

That's the app your users need.
