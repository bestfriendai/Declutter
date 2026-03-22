# DECLUTTER APP — BRUTAL COMPREHENSIVE AUDIT

**Date:** 2026-03-20
**Verdict:** This app has a legitimately novel core idea (AI photo → specific cleaning tasks) and some impressive infrastructure (the Gemini prompt, the comeback engine, the badge system). But it's buried under ADHD-hostile UX, disconnected intelligence systems, missing retention loops, and half-implemented features. A paying user would feel cheated. Here's everything that's wrong and exactly how to fix it.

---

## TABLE OF CONTENTS

1. [The Core Problem](#1-the-core-problem)
2. [Competitive Reality Check](#2-competitive-reality-check)
3. [Screen-by-Screen Teardown](#3-screen-by-screen-teardown)
4. [AI Intelligence Failures](#4-ai-intelligence-failures)
5. [The Retention Crisis](#5-the-retention-crisis)
6. [Gamification That Actually Works](#6-gamification-that-actually-works)
7. [Social & Accountability](#7-social--accountability)
8. [Pricing & Monetization](#8-pricing--monetization)
9. [The Complete Fix: Full User Flow](#9-the-complete-fix-full-user-flow)
10. [Priority Implementation Roadmap](#10-priority-implementation-roadmap)

---

## 1. THE CORE PROBLEM

The app requires **18 interactions before a user completes their first task:**

> Open app → 5 onboarding screens → Notification permission → Paywall → Home screen with 8 competing elements → Navigate to camera → Choose room type → Take photo → Choose energy and time (again) → Wait 4+ seconds of fake scanning → See results you can't interact with → Wait 2 more seconds of detection overlay → See task list → Create room → Navigate to room detail → Figure out phase tabs → Tap a task → It toggles without detail

For an app targeting people who **literally struggle to start things**, this is a catastrophic design failure.

The ideal path should be: **Open → See one clear action → Do it → Feel good → Come back tomorrow.**

And even worse: once a user completes all tasks in a room, **there is zero reason to reopen the app**. No recurring tasks, no freshness decay, no daily engagement loop. The app is built as a project (scan, clean, done) instead of a habit.

---

## 2. COMPETITIVE REALITY CHECK

### What's Beating You

| App | Revenue | Key Insight | What Declutter Lacks |
|-----|---------|-------------|---------------------|
| **Sweepy** | $40K/mo | Cleanliness meter that degrades over time — rooms get "dirty" again automatically | Room freshness decay, recurring tasks |
| **Tody** | ~$30/yr sub, 1M+ users | Condition-based tracking with color-coded urgency (green→red) | Visual urgency system, time-based decay |
| **Finch** | ~$2M/mo | Virtual pet that GROWS as you complete tasks, sends unprompted encouragement | Proactive mascot, cosmetic economy |
| **Habitica** | $5.2M/yr, 40%+ 6-mo retention | Full RPG with health damage for missed tasks, party system | Deep gamification, social pressure |
| **Goblin Tools** | 5M+ users, $2 one-time | "Spiciness slider" for task granularity — user controls breakdown level | Task breakdown control |
| **Unfilth Your Habitat** | One-time purchase | One task at a time, zero decisions, pre-created task lists | Default single-task view |

### What You Have That They Don't

**Declutter's AI room scanning is genuinely novel.** No other cleaning app generates personalized tasks from a photo with energy-level awareness, doom pile detection, and phased cleaning plans. The comeback engine's shame-free philosophy is best-in-class. The Gemini prompt is one of the best AI cleaning prompts written.

**The problem isn't the idea — it's the execution.**

---

## 3. SCREEN-BY-SCREEN TEARDOWN

### 3.1 ONBOARDING (`app/onboarding.tsx`)

**Current:** 5 steps (Welcome → QuickSetup → Mascot → Scan → Ready) → Notification Permission → Paywall → App. That's 7-8 screens before the user sees the home screen.

**Problems:**
- `QuickSetupStep` asks THREE questions on one screen (energy, living situation, time). All required. Classic ADHD decision paralysis.
- `MascotStep` asks user to name a pet and choose a personality — 15 minutes of deliberation for someone who can't decide what to have for lunch.
- `ScanStep` is educational ("you'll scan later") not actionable — a tease that kills motivation.
- `ReadyStep` says "You're all set!" but 2 more friction walls remain (notifications, paywall).
- Dead components still in repo: `ProblemStep.tsx`, `EnergyStep.tsx`, `LivingStep.tsx`, `StruggleStep.tsx`, `TimeStep.tsx`, `MotivationStep.tsx`, `CommitmentStep.tsx`, `PreviewStep.tsx`.

**Fix — 2 screens max, then straight to camera:**

```typescript
// app/onboarding.tsx — rebuilt
const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    component: () => (
      <View style={styles.step}>
        <MascotAvatar size={120} mood="excited" />
        <Text style={styles.title}>Hi! I'm Dusty.</Text>
        <Text style={styles.subtitle}>
          I help you clean when you don't know where to start.
        </Text>
        <Text style={styles.subtitle}>
          Point your camera at any messy space and I'll tell you exactly what to do.
        </Text>
      </View>
    ),
  },
  {
    id: 'energy',
    component: ({ onSelect }) => (
      <View style={styles.step}>
        <Text style={styles.title}>How's your energy right now?</Text>
        <Text style={styles.subtitle}>This helps me pick the right tasks for you.</Text>
        {/* Just ONE question. That's it. */}
        <EnergyPicker onSelect={onSelect} />
        <Text style={styles.hint}>You can always change this later.</Text>
      </View>
    ),
  },
];

// After step 2, navigate DIRECTLY to camera
const handleComplete = () => {
  // Auto-assign mascot with defaults (customize later in settings)
  dispatch({ type: 'SET_MASCOT', payload: { name: 'Dusty', personality: 'spark' } });
  // Skip notification permission — ask AFTER first task completion
  // Skip paywall — ask AFTER first room completion
  router.replace('/camera');
};
```

### 3.2 CAMERA (`app/camera.tsx`)

**Problems:**
- Room type defaults to `'bedroom'` — AI should detect room type from the photo
- Context picker asks energy + time AGAIN (already answered in onboarding)
- Context picker is always dark mode (hardcoded `V1.dark.card`)
- Permission denied screen: primary CTA is "Choose from Gallery" instead of "Enable Camera"
- No photo preview before context picker
- `Dimensions.get('window')` at module scope won't update on rotation

**Fix — Pre-fill from context, auto-detect room type:**

```typescript
// app/camera.tsx — context picker should pre-fill
const { user } = useDeclutter();

// Pre-fill from user's onboarding answers
const [selectedEnergy, setSelectedEnergy] = useState<string>(
  user?.energyLevel || 'moderate'
);
const [selectedTime, setSelectedTime] = useState<number>(
  user?.timeAvailability || 30
);

// Remove room type pills entirely — let AI detect it
// Or make it optional with "Auto-detect" as default
const [selectedType, setSelectedType] = useState<RoomType | 'auto'>('auto');
```

```typescript
// Fix permission screen — camera permission should be primary CTA
{!hasPermission && (
  <View style={styles.permissionContainer}>
    <Ionicons name="camera-outline" size={64} color={colors.primary} />
    <Text style={styles.permTitle}>Camera Access Needed</Text>
    <Text style={styles.permText}>
      Scan any messy space and I'll create your personalized cleaning plan.
    </Text>
    {/* PRIMARY action = enable camera */}
    <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
      <Text style={styles.primaryButtonText}>Enable Camera</Text>
    </TouchableOpacity>
    {/* SECONDARY action = gallery */}
    <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
      <Text style={styles.secondaryButtonText}>Choose from Gallery Instead</Text>
    </TouchableOpacity>
  </View>
)}
```

### 3.3 ANALYSIS (`app/analysis.tsx`) — THE CORE FEATURE

**Problems:**
- **4+ seconds of FAKE delays** on top of real AI time:
  - `await new Promise(r => setTimeout(r, 1200))` for step 1
  - `await new Promise(r => setTimeout(r, 800))` for step 3
  - `await new Promise(r => setTimeout(r, 2000))` for detection overlay
- Detection overlay shows for exactly 2 seconds with no interaction — purely decorative friction
- Littered with `(analysisData as any)` — 6+ unsafe casts
- Fallback tasks are generic garbage and user doesn't know AI failed
- No "retake" option on results
- **Room limit checked AFTER analysis completes** — imagine the ADHD rage of waiting for analysis, reviewing results, then hitting "Upgrade to Pro"

**Fix — Remove fake delays, check limits first, add retake:**

```typescript
// app/analysis.tsx — remove all artificial delays
const analyzeImage = async () => {
  // CHECK ROOM LIMIT BEFORE DOING ANYTHING
  if (!isPro && rooms.length >= FREE_ROOM_LIMIT) {
    Alert.alert(
      'Room Limit Reached',
      'Upgrade to Pro for unlimited room scans.',
      [
        { text: 'Maybe Later', style: 'cancel', onPress: () => router.back() },
        { text: 'See Plans', onPress: () => router.push('/paywall') },
      ]
    );
    return;
  }

  setPhase('scanning');

  try {
    // Real analysis — NO artificial delays
    const result = await analyzeRoomImage(
      base64,
      buildContextString(), // Rich context, not just "Room type: bedroom"
      selectedEnergy,
      selectedTime,
    );

    // Go straight to results
    setAnalysisData(result);
    setPhase('results');
  } catch (error) {
    // TELL THE USER the AI failed
    setPhase('error');
    setErrorMessage('AI analysis failed. You can retake or try with a different angle.');
  }
};

// Add retake button to results
<TouchableOpacity onPress={() => router.replace('/camera')} style={styles.retakeButton}>
  <Ionicons name="camera-outline" size={20} />
  <Text>Retake Photo</Text>
</TouchableOpacity>
```

### 3.4 HOME SCREEN (`app/(tabs)/index.tsx`)

**Problems:**
- **Wall of information:** Header → Quote → Quick Blitz CTA → Streak Card → Streak Nudge → Comeback Card → Hero Mission Card → Rooms list. That's 6-8 elements before actual rooms.
- Quick Blitz CTA and Hero Mission Card are **redundant** — both point to the same room
- Comeback card is too big — giant emotional card when returning users just need ONE action button
- `todayTasksDone` caps at 10 arbitrarily (`Math.min(total, 10)`) — fabricated daily target
- Only 5 quotes rotating every 6 hours — repeats within 30 hours

**Fix — Single clear CTA, today's tasks front and center:**

```typescript
// app/(tabs)/index.tsx — simplified home screen
const HomeScreen = () => {
  const { rooms, stats, activeRoomId } = useDeclutter();
  const todaysTasks = useTodaysTasks(); // New hook: recurring + due + maintenance
  const urgentRoom = getMostUrgentRoom(rooms); // Room with lowest freshness

  return (
    <ScrollView>
      {/* 1. Greeting + consistency score (not streak) */}
      <GreetingHeader
        consistency={getConsistencyScore(stats.activityDates)}
      />

      {/* 2. ONE primary CTA — the most important thing to do right now */}
      {urgentRoom ? (
        <PrimaryCTA
          title={`${urgentRoom.name} needs attention`}
          subtitle={`${urgentRoom.incompleteTasks} tasks · ~${urgentRoom.estimatedMinutes} min`}
          freshness={urgentRoom.freshness}
          onPress={() => router.push(`/room/${urgentRoom.id}`)}
        />
      ) : (
        <PrimaryCTA
          title="Scan a new room"
          subtitle="Point your camera at any messy space"
          onPress={() => router.push('/camera')}
        />
      )}

      {/* 3. Today's tasks — the daily engagement anchor */}
      <TodaysTasks tasks={todaysTasks} />

      {/* 4. Your rooms with freshness indicators */}
      <RoomsList rooms={rooms} />
    </ScrollView>
  );
};
```

### 3.5 ROOM DETAIL (`app/room/[id].tsx`)

**Problems:**
- Default view hides most tasks (`showAllPhases = false`) — users only see Quick Wins, may never find Deep Clean/Organize phases
- Task classification ignores AI's `phase` field — uses simplistic local logic instead
- **No task detail on tap** — tapping toggles completion immediately. Tips, subtasks, decision points, "why this matters" — all generated by AI, none shown
- Room completion triggers navigation inside the toggle handler — accidental completion yanks you to celebration with no undo
- No "progress photo" flow — camera icon starts a NEW analysis
- Combo timer (30 seconds) too tight for physical tasks

**Fix — Single-task default view, tap for detail:**

```typescript
// app/room/[id].tsx — default to focused single-task view
const [viewMode, setViewMode] = useState<'focus' | 'list'>('focus');

// Focus mode: show ONE task with full detail
{viewMode === 'focus' && currentTask && (
  <View style={styles.focusCard}>
    <Text style={styles.taskPhase}>{currentTask.phaseName}</Text>
    <Text style={styles.taskTitle}>{currentTask.title}</Text>

    {/* Show the AI-generated details that currently go unused */}
    {currentTask.description && (
      <Text style={styles.taskDescription}>{currentTask.description}</Text>
    )}

    {/* Subtasks — the AI generates these! */}
    {currentTask.subTasks?.map(sub => (
      <View key={sub.id} style={styles.subtask}>
        <Checkbox checked={sub.completed} onToggle={() => toggleSubtask(sub.id)} />
        <Text>{sub.title}</Text>
        <Text style={styles.subtaskTime}>{sub.estimatedSeconds}s</Text>
      </View>
    ))}

    {/* Decision points with 5-second defaults — brilliant ADHD feature, currently unused */}
    {currentTask.decisionPoints?.map(dp => (
      <View key={dp.id} style={styles.decisionPoint}>
        <Text style={styles.dpQuestion}>{dp.question}</Text>
        <Text style={styles.dpDefault}>
          Quick answer: {dp.fiveSecondDefault}
        </Text>
      </View>
    ))}

    {/* Tips from AI, not hardcoded */}
    {currentTask.tips && (
      <View style={styles.tipBubble}>
        <MascotAvatar size={24} mood="helpful" />
        <Text>{currentTask.tips}</Text>
      </View>
    )}

    {/* Resistance handler — for when ADHD brain says "I don't want to" */}
    {currentTask.resistanceHandler && (
      <TouchableOpacity style={styles.resistanceButton}>
        <Text>Feeling stuck?</Text>
      </TouchableOpacity>
    )}

    <View style={styles.actions}>
      <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
        <Text>Skip</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleComplete} style={styles.doneButton}>
        <Text>Done!</Text>
      </TouchableOpacity>
    </View>
  </View>
)}

// Toggle to list view
<TouchableOpacity onPress={() => setViewMode(viewMode === 'focus' ? 'list' : 'focus')}>
  <Text>{viewMode === 'focus' ? 'See all tasks' : 'Focus mode'}</Text>
</TouchableOpacity>
```

```typescript
// Fix room completion — add confirmation, not auto-navigate
const handleComplete = async () => {
  await toggleTask(roomId, currentTask.id);

  // Check if that was the last task
  const remaining = tasks.filter(t => !t.completed && t.id !== currentTask.id);
  if (remaining.length === 0) {
    // Don't auto-navigate. Show inline celebration with option to continue
    setShowCompletionPrompt(true);
  } else {
    // Advance to next task with micro-celebration
    triggerCelebration(); // haptic + sound + XP popup
    setCurrentTaskIndex(prev => prev + 1);
  }
};
```

### 3.6 BLITZ MODE (`app/blitz.tsx`)

**Problems:**
- Timer fixed at 15 minutes — ignores user's stated time availability
- "Dusty says" tips are **8 hardcoded generic strings** — AI generates task-specific tips that are never used
- XP calculation hardcoded (`completed * 10`) — ignores comeback multiplier
- Shows on rooms with zero incomplete tasks

**Fix:**

```typescript
// app/blitz.tsx — configurable duration, real tips
const route = useLocalSearchParams<{ roomId: string; duration?: string }>();
const BLITZ_DURATION = parseInt(route.duration || '15', 10) * 60;

// Use AI-generated tips instead of hardcoded ones
const getCurrentTip = () => {
  const task = tasks[currentTaskIndex];
  if (task?.tips) return task.tips;
  if (task?.resistanceHandler) return task.resistanceHandler;
  if (task?.whyThisMatters) return task.whyThisMatters;
  return DUSTY_TIPS[currentTaskIndex % DUSTY_TIPS.length]; // fallback only
};

// Use real XP with multipliers
const xpEarned = Math.round(
  completed * 10 * (comebackMultiplier || 1)
);
```

### 3.7 FOCUS MODE (`app/focus.tsx`)

**Problems:**
- **Gated behind Pro** — a simple Pomodoro timer, one of the most useful ADHD features, is paywalled. Users can use their phone's built-in timer for free.
- No integration with tasks or rooms — it's just a clock
- Timer pauses on app background — the user who puts their phone down to clean (THE WHOLE POINT) comes back to a paused timer
- Break reminder math is convoluted

**Fix — Free the timer, track background time:**

```typescript
// app/focus.tsx — handle background time properly
const backgroundTimestamp = useRef<number | null>(null);

useEffect(() => {
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'background') {
      backgroundTimestamp.current = Date.now();
    } else if (state === 'active' && backgroundTimestamp.current && isRunning) {
      // Calculate elapsed time while in background
      const elapsed = Math.floor((Date.now() - backgroundTimestamp.current) / 1000);
      setTimeLeft(prev => Math.max(0, prev - elapsed));
      backgroundTimestamp.current = null;
    }
  });
  return () => sub.remove();
}, [isRunning]);
```

### 3.8 SETTINGS (`app/settings.tsx`)

**Problems:**
- "Privacy & Data" is an `Alert.alert()` dialog — not App Store compliant
- No ADHD-specific settings exposed: `taskBreakdownLevel`, `encouragementLevel`, `focusMode` settings all exist in types but have no UI
- "Help & FAQ" opens a `mailto:` link — no in-app help
- Rate app URL is broken — missing app ID: `itms-apps://...id?action=write-review`
- Theme toggle is binary (light/dark) but types define `'auto'` option

**Fix — Add ADHD settings section:**

```typescript
// app/settings.tsx — new ADHD-specific settings section
<SettingsSection title="How I Clean">
  <SettingsRow
    label="Task Detail Level"
    subtitle="How broken down should tasks be?"
    right={
      <SegmentedControl
        values={['Normal', 'Detailed', 'Ultra']}
        selectedIndex={['normal', 'detailed', 'ultra'].indexOf(
          settings.taskBreakdownLevel || 'normal'
        )}
        onChange={(index) => updateSetting(
          'taskBreakdownLevel',
          ['normal', 'detailed', 'ultra'][index]
        )}
      />
    }
  />

  <SettingsRow
    label="Encouragement"
    subtitle="How much should Dusty cheer you on?"
    right={
      <SegmentedControl
        values={['Chill', 'Moderate', 'Maximum']}
        selectedIndex={['minimal', 'moderate', 'maximum'].indexOf(
          settings.encouragementLevel || 'moderate'
        )}
        onChange={(index) => updateSetting(
          'encouragementLevel',
          ['minimal', 'moderate', 'maximum'][index]
        )}
      />
    }
  />

  <SettingsRow
    label="Default Session Length"
    subtitle="Your go-to cleaning time"
    right={
      <Picker
        selectedValue={settings.defaultSessionMinutes || 15}
        onValueChange={(v) => updateSetting('defaultSessionMinutes', v)}
      >
        <Picker.Item label="5 min" value={5} />
        <Picker.Item label="10 min" value={10} />
        <Picker.Item label="15 min" value={15} />
        <Picker.Item label="25 min" value={25} />
        <Picker.Item label="45 min" value={45} />
      </Picker>
    }
  />
</SettingsSection>
```

### 3.9 PAYWALL (`app/paywall.tsx`)

**Problems:**
- Appears BEFORE user has experienced ANY value
- Only 3 vague features listed
- $6.99/week ($363/year) is aggressive and will trigger negative reviews
- Promo code flow opens a `mailto:` link — email-based redemption in 2026

**Fix:** See [Section 8 — Pricing & Monetization](#8-pricing--monetization)

---

## 4. AI INTELLIGENCE FAILURES

### 4.1 THE FEEDBACK LOOP IS COMPLETELY BROKEN

This is the #1 systemic problem. The AI never learns from user behavior.

**Current flow:**
1. Gemini generates tasks based solely on photo + energy level
2. User completes/skips tasks → data goes to local `taskOptimizer.ts`
3. Task optimizer learns preferences in AsyncStorage
4. Next photo scan → Gemini gets a fresh image with **zero context** about what worked before

The `additionalContext` parameter exists on the Gemini action, but the analysis screen passes only this:

```typescript
// app/analysis.tsx line 169 — THIS IS ALL THE CONTEXT
analysisData = await analyzeRoomImage(
  base64,
  `Room type: ${roomType || 'bedroom'}`,  // <-- pathetic
  energyLevel || 'moderate',
  timeAvailable ? parseInt(timeAvailable, 10) : 30,
);
```

**Fix — Send user profile to AI:**

```typescript
// services/ai.ts — build rich context for Gemini
export async function analyzeRoomImage(
  base64Image: string,
  roomType: string,
  energyLevel: EnergyLevel,
  timeAvailable: number,
  userProfile?: UserCleaningProfile, // NEW
  settings?: AppSettings, // NEW
): Promise<AIAnalysisResult> {

  // Build rich context string
  const contextParts: string[] = [`Room type: ${roomType}`];

  if (userProfile) {
    const { categoryRates, preferences } = userProfile;

    // Tell AI what the user actually completes vs skips
    const topCategories = Object.entries(categoryRates)
      .sort(([,a], [,b]) => b.completionRate - a.completionRate)
      .slice(0, 3)
      .map(([cat]) => cat);

    const skippedCategories = Object.entries(categoryRates)
      .filter(([,v]) => v.skipRate > 0.5)
      .map(([cat]) => cat);

    contextParts.push(
      `User excels at: ${topCategories.join(', ')}`,
      `User tends to skip: ${skippedCategories.join(', ') || 'nothing consistently'}`,
      `Preferred task size: ${preferences.preferredTaskSize}`,
      `Avoids decision-heavy tasks: ${preferences.avoidsDecisionTasks}`,
      `Prefers quick wins first: ${preferences.prefersQuickWinsFirst}`,
      `Preferred session: ${preferences.preferredSessionLength} minutes`,
    );
  }

  if (settings?.taskBreakdownLevel) {
    const breakdownHint = {
      normal: 'Standard task breakdown, 2-5 minutes per task.',
      detailed: 'Detailed sub-steps for each task, roughly 1-2 minutes each.',
      ultra: 'Break every task into sub-steps of 30 seconds or less. Maximum granularity.',
    }[settings.taskBreakdownLevel];
    contextParts.push(`Task breakdown preference: ${breakdownHint}`);
  }

  const additionalContext = contextParts.join('\n');

  return fetchWithRetry(/* ... */);
}
```

### 4.2 FALLBACK ANALYSIS IS GENERIC GARBAGE

When AI fails, `services/ai.ts` returns 3 hardcoded tasks that have NOTHING to do with the room:

```typescript
// Current — useless fallback
function getFallbackAnalysis(_context?: string): AIAnalysisResult {
  return {
    tasks: [
      { title: 'Collect any visible trash from the nearest surface -> trash bag . EST 2 min' },
      { title: 'Clear one flat surface completely -> move items to a temporary pile . EST 3 min' },
      // ... generic garbage regardless of kitchen vs garage
    ]
  };
}
```

**Fix — Room-type-aware fallbacks + tell the user:**

```typescript
// services/ai.ts — honest, room-aware fallback
function getFallbackAnalysis(roomType: string): AIAnalysisResult {
  const fallbacks: Record<string, CleaningTask[]> = {
    kitchen: [
      {
        title: 'Clear all dishes from the counter -> dishwasher or sink . EST 3 min',
        description: 'Start with the counter closest to the sink',
        category: 'surface_clearing',
        estimatedMinutes: 3,
        phase: 'quick-wins',
      },
      {
        title: 'Wipe down all counter surfaces -> spray and wipe . EST 5 min',
        category: 'cleaning',
        estimatedMinutes: 5,
        phase: 'quick-wins',
      },
      {
        title: 'Take out trash and recycling -> bins outside . EST 2 min',
        category: 'trash',
        estimatedMinutes: 2,
        phase: 'quick-wins',
      },
    ],
    bedroom: [
      {
        title: 'Gather all clothes from the floor -> laundry hamper . EST 3 min',
        category: 'surface_clearing',
        estimatedMinutes: 3,
        phase: 'quick-wins',
      },
      // ... bedroom-specific fallbacks
    ],
    bathroom: [/* ... */],
    // ... each room type
  };

  return {
    tasks: fallbacks[roomType] || fallbacks.bedroom,
    // IMPORTANT: Flag this as a fallback so UI can show a notice
    isFallback: true,
    fallbackReason: 'AI analysis unavailable. Here are common tasks for this room type.',
  };
}
```

### 4.3 TASK OPTIMIZER LEARNS BUT NEVER SYNCS

All learning data lives in AsyncStorage (`@declutterly_task_history`, `@declutterly_user_cleaning_profile`). It's never synced to Convex. New device = all learning lost. The `convex/sync.ts` mutation syncs rooms, stats, badges, settings — but NOT the task optimizer profile.

**Fix — Sync profile to Convex:**

```typescript
// convex/schema.ts — add user profile table
userProfiles: defineTable({
  userId: v.string(),
  categoryRates: v.any(), // { [category]: { completed, skipped, total, completionRate, skipRate } }
  preferences: v.object({
    preferredTaskSize: v.string(),
    avoidsDecisionTasks: v.boolean(),
    prefersQuickWinsFirst: v.boolean(),
    preferredSessionLength: v.number(),
  }),
  energyPatterns: v.any(),
  updatedAt: v.number(),
}).index('by_user', ['userId']),
```

```typescript
// convex/sync.ts — include profile in sync
export const replaceUserState = mutation({
  args: {
    // ... existing args
    userProfile: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // ... existing sync logic

    // Sync user cleaning profile
    if (args.userProfile) {
      const existing = await ctx.db
        .query('userProfiles')
        .withIndex('by_user', q => q.eq('userId', userId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...args.userProfile,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert('userProfiles', {
          userId,
          ...args.userProfile,
          updatedAt: Date.now(),
        });
      }
    }
  },
});
```

### 4.4 NO TASK TITLE VALIDATION

The Gemini prompt demands a specific title format: `[VERB] [COUNT + DESCRIPTOR + ITEM] [from] [LOCATION] -> [DESTINATION] . EST [TIME]`. But `parseAnalysisResponse` never validates this:

```typescript
// Current — no validation
title: task.title ?? "Task",  // "Clean the desk" sails right through
```

**Fix:**

```typescript
// convex/gemini.ts — validate task title format
function validateTaskTitle(title: string): boolean {
  // Must contain a verb, a destination arrow, and time estimate
  const hasArrow = title.includes('->') || title.includes('→');
  const hasTimeEstimate = /EST\s+\d+\s*(min|sec)/i.test(title) ||
                          /\d+\s*(min|sec)/i.test(title);
  const startsWithVerb = /^(Pick up|Gather|Move|Wipe|Clear|Sort|Fold|Hang|Stack|Place|Remove|Take|Put|Organize|Sweep|Vacuum|Dust|Scrub|Empty|Fill|Arrange)/i.test(title);

  return hasArrow && hasTimeEstimate && startsWithVerb;
}

// In parseAnalysisResponse:
const validatedTasks = tasks.map(task => {
  if (!validateTaskTitle(task.title)) {
    // Attempt to reformat, or flag for regeneration
    console.warn(`Task title doesn't match format: "${task.title}"`);
    // At minimum, ensure it's not generic
    if (task.title.length < 20) {
      task.title = `${task.title} -> appropriate location . EST ${task.estimatedMinutes || 3} min`;
    }
  }
  return task;
});
```

### 4.5 `recordTaskCompletion` IS NEVER CALLED

The task optimizer's learning function accepts `actualMinutes` but is never called from the main task completion flow. `toggleTask` in DeclutterContext calls `stats.incrementTask` on Convex but never calls `recordTaskCompletion` from `taskOptimizer.ts`.

**Fix — Wire it in:**

```typescript
// context/DeclutterContext.tsx — in toggleTask handler
const toggleTask = async (roomId: string, taskId: string) => {
  const room = rooms.find(r => r.id === roomId);
  const task = room?.tasks.find(t => t.id === taskId);

  if (task && !task.completed) {
    // Record completion for learning
    await recordTaskCompletion({
      taskId: task.id,
      category: task.category,
      estimatedMinutes: task.estimatedMinutes,
      // TODO: track actual elapsed time from when task was displayed
      actualMinutes: task.estimatedMinutes, // placeholder until real tracking
      completed: true,
      skipped: false,
    });
  }

  // ... existing toggle logic
};
```

### 4.6 MASCOT IS STATIC

No automatic mood changes, no stat decay, no behavioral triggers. Hunger/energy stay at their set values forever.

**Fix — Add cron for mascot decay + behavioral triggers:**

```typescript
// convex/crons.ts — add mascot decay
crons.interval("decay mascot stats", { hours: 12 }, internal.mascots.decayStats);

// convex/mascots.ts — decay function
export const decayStats = internalMutation({
  handler: async (ctx) => {
    const allMascots = await ctx.db.query('mascots').collect();
    for (const mascot of allMascots) {
      await ctx.db.patch(mascot._id, {
        hunger: Math.min(100, (mascot.hunger ?? 50) + 10), // Gets hungrier
        energy: Math.max(0, (mascot.energy ?? 100) - 8),    // Gets tired
        happiness: Math.max(0, (mascot.happiness ?? 100) - 5), // Gets sad
        mood: calculateMood(mascot), // Derive from stats
      });
    }
  },
});

function calculateMood(mascot: Mascot): string {
  const avg = ((100 - mascot.hunger) + mascot.energy + mascot.happiness) / 3;
  if (avg > 80) return 'ecstatic';
  if (avg > 60) return 'happy';
  if (avg > 40) return 'neutral';
  if (avg > 20) return 'sad';
  return 'miserable';
}
```

---

## 5. THE RETENTION CRISIS

### 5.1 THE "NOTHING TO DO" PROBLEM

After a user scans a room, completes all tasks, and reaches 100% — **the app becomes a dead zone.** No recurring tasks, no freshness decay, no daily engagement loop. Sweepy generates a fresh daily checklist every morning. Tody shows degrading condition bars. Declutter shows... nothing.

### 5.2 ROOM FRESHNESS DECAY (CRITICAL MISSING FEATURE)

Rooms should get "dirty" again over time, creating natural pull to re-engage.

```typescript
// types/declutter.ts — add to Room type
export interface Room {
  // ... existing fields
  lastCleanedAt?: number;        // Timestamp of last task completion
  freshnessDecayRate?: number;   // Per-day decay (kitchen=15, garage=2)
  currentFreshness?: number;     // 0-100, calculated
}

// New utility function
export function calculateRoomFreshness(room: Room): number {
  if (!room.lastCleanedAt) return 100;

  const daysSinceClean = (Date.now() - room.lastCleanedAt) / (1000 * 60 * 60 * 24);

  const decayRates: Record<string, number> = {
    kitchen: 15,
    bathroom: 12,
    bedroom: 8,
    livingRoom: 10,
    office: 7,
    closet: 3,
    garage: 2,
    other: 5,
  };

  const rate = decayRates[room.type] || 5;
  const decay = rate * daysSinceClean;
  return Math.max(0, Math.round(100 - decay));
}
```

### 5.3 RECURRING TASKS (CRITICAL MISSING FEATURE)

```typescript
// types/declutter.ts — new type
export interface RecurringTask {
  id: string;
  title: string;
  emoji: string;
  roomId: string;
  frequencyDays: number;       // How often this should be done
  lastCompletedAt?: number;
  freshnessDecayRate: number;  // 0-1 per day
  currentFreshness: number;    // 0-100
  category: TaskCategory;
  estimatedMinutes: number;
  isAutoGenerated: boolean;    // AI suggested vs user created
}
```

After completing a room, the AI should suggest recurring tasks:

```typescript
// Add to Gemini prompt
`After generating tasks, also suggest 3-5 RECURRING MAINTENANCE TASKS for this room.
These are tasks the user should do regularly to maintain cleanliness.
Format: { title, frequencyDays, estimatedMinutes, category }
Examples:
- "Wipe kitchen counters" every 2 days, 3 min
- "Vacuum bedroom floor" every 5 days, 8 min
- "Sort mail and papers" every 3 days, 5 min`
```

### 5.4 "TODAY'S TASKS" VIEW (CRITICAL MISSING FEATURE)

The daily engagement anchor — what the user sees every time they open the app:

```typescript
// hooks/useTodaysTasks.ts
export function useTodaysTasks(): TodayTask[] {
  const { rooms, stats } = useDeclutter();
  const tasks: TodayTask[] = [];

  // 1. Recurring tasks that are due
  const recurringTasks = getRecurringTasksDue();
  tasks.push(...recurringTasks.map(t => ({ ...t, source: 'recurring' })));

  // 2. Rooms with low freshness — pick top task from each
  const urgentRooms = rooms
    .map(r => ({ ...r, freshness: calculateRoomFreshness(r) }))
    .filter(r => r.freshness < 60)
    .sort((a, b) => a.freshness - b.freshness);

  for (const room of urgentRooms.slice(0, 3)) {
    const topTask = room.tasks.find(t => !t.completed);
    if (topTask) {
      tasks.push({ ...topTask, source: 'maintenance', roomName: room.name });
    }
  }

  // 3. "One Tiny Thing" — always include one micro-task
  const tinyTask = generateTinyTask();
  tasks.push({ ...tinyTask, source: 'tiny' });

  // 4. Cap at 5-7 tasks to prevent overwhelm
  return tasks.slice(0, 7);
}
```

### 5.5 STREAKS ARE PUNITIVE FOR ADHD

Research from Klarity Health specifically shows streaks **FAIL ADHD users** because they trigger perfectionism anxiety. When a 30-day streak breaks, ADHD users often abandon the app entirely.

**Fix — Replace streak counter with consistency score:**

```typescript
// Replace the primary metric on home screen
function getConsistencyScore(
  activityDates: string[],
  windowDays: number = 7
): ConsistencyScore {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
  const activeDays = activityDates.filter(d => new Date(d) >= windowStart).length;
  const percentage = Math.round((activeDays / windowDays) * 100);

  let label = 'Building momentum';
  if (percentage >= 85) label = 'On fire!';
  else if (percentage >= 60) label = 'Solid consistency';
  else if (percentage >= 40) label = 'Getting there';

  return { activeDays, windowDays, percentage, label };
}

// Display: "You cleaned 5 of the last 7 days" instead of "Day 5 streak"
// Keep streak as a smaller secondary stat for those who want it
```

### 5.6 PUSH NOTIFICATIONS ARE MISSING

The comeback engine has notification message functions (`getComebackNotificationMessage`, `getDailyReminderMessage`) but there's no evidence of actual push notification scheduling. The messages exist but are never triggered on a schedule.

**Critical for daily engagement.** Dusty should send:
- Morning: "Your kitchen freshness dropped to 65%. Quick 5-min sweep?"
- After 2 days inactive: "No pressure! Want to do just one tiny thing today?"
- After task completion: "Nice! Your bedroom is 80% fresh now."

---

## 6. GAMIFICATION THAT ACTUALLY WORKS

### 6.1 COLLECTIBLE DROPS ARE SCAFFOLDED BUT NEVER WIRED

The `COLLECTIBLES` array in `types/declutter.ts` has 20+ items with rarity tiers and spawn chances. The `spawnCollectible()` function exists. But collectibles never spawn during task completion or Blitz sessions.

**Fix — Wire collectibles into task completion:**

```typescript
// context/DeclutterContext.tsx — in task completion handler
const handleTaskComplete = async (roomId: string, taskId: string) => {
  await toggleTask(roomId, taskId);

  // Variable reward: check for collectible spawn
  const spawnChance = 0.3; // 30% chance per task
  if (Math.random() < spawnChance) {
    const collectible = spawnCollectible();
    if (collectible) {
      // Show spawn animation
      setActiveCollectible(collectible);
      setShowCollectibleModal(true);

      // Haptic + sound
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }
};
```

### 6.2 XP SYSTEM IS FLAT AND BORING

Every task gives 10 XP. 100 XP per level. No variety.

**Fix — Variable XP with room completion bonuses:**

```typescript
// services/xp.ts — richer XP calculation
export function calculateTaskXP(task: CleaningTask, context: {
  comboCount: number;
  comebackMultiplier: number;
  isFirstTaskToday: boolean;
  roomProgress: number; // 0-1
}): number {
  let baseXP = Math.max(5, Math.ceil(task.estimatedMinutes * 3)); // Scale with effort

  // Combo bonus
  if (context.comboCount > 1) {
    baseXP *= 1 + (context.comboCount * 0.1); // 10% per combo
  }

  // First task of the day bonus
  if (context.isFirstTaskToday) {
    baseXP *= 1.5;
  }

  // Comeback multiplier
  baseXP *= context.comebackMultiplier;

  // Room completion approaching — ramp up excitement
  if (context.roomProgress > 0.8) {
    baseXP *= 1.25; // "So close!" bonus
  }

  return Math.round(baseXP);
}
```

### 6.3 BADGES NEED MORE SMALL WINS

Current badges require huge commitments (30-day streak, 100 rooms). ADHD users need frequent small dopamine hits.

**Add these badges:**

```typescript
const ADDITIONAL_BADGES: Badge[] = [
  // Micro-achievements
  { id: 'first-scan', title: 'First Scan', requirement: 'Scan your first room', threshold: 1 },
  { id: 'two-day', title: 'Back Again', requirement: 'Clean 2 days in a row', threshold: 2 },
  { id: 'five-day', title: 'Building Habits', requirement: 'Clean 5 days in a row', threshold: 5 },
  { id: 'consistency-60', title: 'Consistent', requirement: 'Clean 4+ days in a week', threshold: 4 },

  // Behavioral badges
  { id: 'early-bird', title: 'Early Bird', requirement: 'Complete a task before 9am', threshold: 1 },
  { id: 'night-owl', title: 'Night Owl', requirement: 'Complete a task after 10pm', threshold: 1 },
  { id: 'doom-slayer', title: 'Doom Pile Slayer', requirement: 'Clear a doom pile', threshold: 1 },
  { id: 'speed-demon', title: 'Speed Demon', requirement: 'Finish a task in under 30 seconds', threshold: 1 },
  { id: 'five-rooms', title: 'Five Room Club', requirement: 'Scan 5 different rooms', threshold: 5 },
  { id: 'comeback-kid', title: 'Comeback Kid', requirement: 'Return after 3+ days away', threshold: 1 },

  // Social badges
  { id: 'team-player', title: 'Team Player', requirement: 'Complete a challenge with a partner', threshold: 1 },
  { id: 'motivator', title: 'Motivator', requirement: 'Send 5 nudges to your partner', threshold: 5 },
];
```

### 6.4 MAKE DUSTY PROACTIVE

Dusty should drive engagement, not sit passively.

```typescript
// services/dustyBehavior.ts
export function getDustyReaction(event: string, mascot: Mascot): DustyMessage {
  const personality = MASCOT_PERSONALITIES[mascot.personality];

  const reactions: Record<string, Record<string, string>> = {
    taskComplete: {
      spark: "Zap! Another one down! You're electric today!",
      bubbles: "Yay yay yay! That was so satisfying to watch!",
      dusty: "*brushes off dust* Nice. One less thing to worry about.",
      tidy: "Excellent execution. Efficiency is beautiful.",
    },
    comboStreak: {
      spark: "COMBO x3! You're on FIRE! Don't stop now!",
      bubbles: "Wheeeee! You're unstoppable! Keep going keep going!",
      dusty: "Huh. You're actually pretty fast when you get going.",
      tidy: "Three in a row. Optimal workflow achieved.",
    },
    returnAfterBreak: {
      spark: "Hey hey! You're back! I missed having someone to cheer for!",
      bubbles: "OHMYGOSH you're here!! I was just thinking about you!",
      dusty: "Oh. You're back. ...I may have missed you. A little.",
      tidy: "Welcome back. I've been monitoring the dust levels. They've increased.",
    },
    roomComplete: {
      spark: "YESSS! That room is GLEAMING! Victory dance time!",
      bubbles: "It's... it's beautiful! *happy tears*",
      dusty: "*looks around* I... I can see the floor. This is new.",
      tidy: "Room status: Immaculate. Well done, partner.",
    },
  };

  return {
    text: reactions[event]?.[mascot.personality] || reactions[event]?.dusty || '',
    mood: event === 'taskComplete' ? 'happy' : 'excited',
  };
}
```

---

## 7. SOCIAL & ACCOUNTABILITY

### 7.1 ACCOUNTABILITY XP BONUS IS DEFINED BUT NEVER APPLIED

`convex/accountability.ts` defines `BOTH_ACTIVE_XP_BONUS = 0.20` (20% XP bonus when both partners are active). But `stats.incrementTask` never references this. The data is tracked but the reward is decorative.

**Fix:**

```typescript
// convex/stats.ts — in incrementTask, after existing XP calculation
// Check for accountability partner bonus
const partnership = await ctx.db
  .query('accountabilityPartners')
  .withIndex('by_user', q => q.eq('userId', userId))
  .first();

if (partnership) {
  const partnerActivity = await ctx.db
    .query('accountabilityPartners')
    .withIndex('by_user', q => q.eq('userId', partnership.partnerId))
    .first();

  const bothActiveToday = partnerActivity &&
    isToday(partnerActivity.lastActivityAt);

  if (bothActiveToday) {
    xpGained = Math.round(xpGained * 1.20); // Apply the bonus that already exists
  }
}
```

### 7.2 BODY DOUBLING (CATEGORY-DEFINING FEATURE)

No cleaning app has integrated virtual body doubling. This would be unique.

```typescript
// Concept: "Clean Together" mode
// Two users start simultaneous Blitz sessions
// See each other's task progress in real-time (no video)
// Shared timer, shared celebration when both finish

// convex/bodyDoubling.ts
export const createSession = mutation({
  args: {
    partnerId: v.string(),
    duration: v.number(),
    roomId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    return await ctx.db.insert('bodyDoublingSessions', {
      participants: [userId, args.partnerId],
      duration: args.duration,
      startedAt: Date.now(),
      status: 'waiting', // waiting -> active -> completed
      progress: {
        [userId]: { tasksCompleted: 0, currentTask: null },
        [args.partnerId]: { tasksCompleted: 0, currentTask: null },
      },
    });
  },
});
```

### 7.3 CHALLENGE AUTO-PROGRESS IS INCOMPLETE

`social.ts` auto-increments progress only for `tasks_count` challenges. For `time_spent`, `room_complete`, `streak`, and `collectibles` types — no automatic tracking.

**Fix — Wire all challenge types:**

```typescript
// convex/stats.ts — after incrementTask
// Auto-update ALL challenge types
const activeChallenges = await ctx.db
  .query('challenges')
  .filter(q => q.gt(q.field('endDate'), Date.now()))
  .collect();

for (const challenge of activeChallenges) {
  const participant = challenge.participants?.find(p => p.id === userId);
  if (!participant) continue;

  let increment = 0;
  switch (challenge.type) {
    case 'tasks_count':
      increment = 1;
      break;
    case 'time_spent':
      increment = args.minutesCleaned || 0;
      break;
    case 'room_complete':
      // Check if this task completion finished a room
      if (isRoomComplete) increment = 1;
      break;
    case 'streak':
      increment = newStreakValue;
      break;
    case 'collectibles':
      // Handled separately in collectible spawn
      break;
  }

  if (increment > 0) {
    await incrementChallengeProgress(ctx, challenge._id, userId, increment);
  }
}
```

---

## 8. PRICING & MONETIZATION

### 8.1 CURRENT PRICING IS TOO HIGH

| Your Price | Competitor | Their Price |
|------------|-----------|-------------|
| $6.99/week ($363/yr) | — | Insane. Will get negative reviews. |
| $6.99/month ($84/yr) | Habitica | $4.99/mo ($48/yr) with 10x content depth |
| $39.99/year | Sweepy | $12.99-$19.99/yr |
| $39.99/year | Finch | $14.99/yr |
| $39.99/year | Tody | ~$30/yr |

### 8.2 RECOMMENDED PRICING

- **Kill the weekly plan entirely**
- Monthly: **$4.99/month**
- Annual: **$29.99/year** (Save 50%)
- Consider: Lifetime option at **$79.99** (one-time purchase crowd loves this)

### 8.3 WHAT SHOULD BE FREE vs PRO

**Current gates are wrong.** Room scans and Blitz (the core ADHD-helping features) are limited in free tier. Users who need the app most hit the paywall fastest.

**Better split:**

| Free | Pro |
|------|-----|
| Unlimited room scans (up to 5 rooms) | Unlimited rooms |
| Basic Blitz mode | Advanced AI insights + progress tracking |
| Basic achievements | All mascot personalities + cosmetics |
| 1 mascot personality | Recurring task system |
| Standard task breakdown | Ultra task breakdown level |
| Basic stats | Advanced analytics + before/after exports |
| — | Accountability partner features |
| — | Streak freezes (earned weekly) |
| — | Exclusive collectibles |

### 8.4 ADD A COSMETIC ECONOMY

Finch and Habitica both monetize through cosmetics. Declutter already has the `accessories` field on the Mascot type — there are no accessories defined.

```typescript
// types/declutter.ts — mascot cosmetics
export interface MascotAccessory {
  id: string;
  name: string;
  category: 'hat' | 'outfit' | 'background' | 'effect';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlockMethod: 'badge' | 'purchase' | 'collectible' | 'streak' | 'event';
  previewImage: string;
}

// Free users earn common cosmetics through gameplay
// Pro users get exclusive cosmetics
// Special event cosmetics drive FOMO and engagement
```

### 8.5 PAYWALL TIMING

Move paywall to AFTER first room completion. The user needs to experience the magic before paying.

```typescript
// app/onboarding.tsx — after completing onboarding
const handleComplete = () => {
  // Go straight to camera, NO paywall
  router.replace('/camera');
};

// app/room-complete.tsx — after first room is 100%
const handleRoomComplete = () => {
  if (!isPro && !hasSeenPaywall) {
    // NOW show the paywall — user has experienced the value
    router.push('/paywall');
    setHasSeenPaywall(true);
  } else {
    router.push('/(tabs)');
  }
};
```

---

## 9. THE COMPLETE FIX: FULL USER FLOW

### Day 1 — First Open

```
1. WELCOME (1 screen)
   - Dusty waves: "I help you clean when you don't know where to start."
   - "Let's go" button

2. ENERGY CHECK (1 screen)
   - "How's your energy right now?" (one tap)
   - Auto-assigns mascot defaults

3. CAMERA (immediate)
   - "Point at your messiest space"
   - Pre-filled energy from step 2
   - Auto-detect room type

4. ANALYSIS (real-time, no fake delays)
   - Show AI processing with real progress
   - Display results immediately

5. FIRST TASK (single-task focus view)
   - ONE task at a time with full detail
   - Subtasks, tips, resistance handler
   - "Done!" or "Skip" — that's it

6. CELEBRATION
   - Haptic + sound + XP popup + Dusty reaction
   - First collectible drops (guaranteed on first task)
   - "Keep going?" or "That's enough for now"

7. AFTER 3-5 TASKS: Notification Permission
   - "Want Dusty to remind you tomorrow?"
   - Now the user understands WHY they'd want notifications

8. AFTER ROOM COMPLETE: Paywall
   - "You just cleaned your [room]! Unlock more with Pro."
   - Now they've experienced the value
```

### Daily Loop (Day 2+)

```
MORNING:
  Push notification from Dusty → links to Today's Tasks

OPEN APP:
  1. Greeting + consistency score ("4 of 7 days!")
  2. Today's Tasks (3-5 curated items)
     - Recurring tasks due
     - Rooms needing attention (freshness decay)
     - One Tiny Thing
  3. One primary CTA

DO TASKS:
  Each completion →
    - Haptic + sound + XP popup
    - 30% chance: collectible drop
    - Combo counter for streaks
    - Dusty reacts with personality

SESSION COMPLETE:
  - Before/after photo prompt
  - Dusty celebration
  - Collectible reveal
  - Shareable summary card
  - "Want me to remind you at the same time tomorrow?"

EVENING:
  Push: "You did 3 tasks today! Dusty is happy."
```

### Weekly Loop

```
MONDAY: Fresh weekly challenge appears
DAILY: Challenge progress visible on home screen
FRIDAY: Challenge approaching deadline → urgency notification
SUNDAY: Challenge results → rewards → new challenge preview
```

### Re-engagement (after 3+ days away)

```
1. Push notification (shame-free): "No pressure! One tiny thing?"
2. Open app → Comeback card with bonus XP multiplier
3. "One Tiny Thing" task ready immediately
4. Lower energy default (assume returning user is low energy)
5. After completing tiny task → full celebration
6. "That was great! Want to do one more?" (never pressure)
```

---

## 10. PRIORITY IMPLEMENTATION ROADMAP

### TIER 1 — Do This Week (Retention-Critical)

| # | Fix | Impact | Effort |
|---|-----|--------|--------|
| 1 | **Slash onboarding to 2 screens + straight to camera** | Massive — 5x more users reach first task | Medium |
| 2 | **Move paywall after first room completion** | Massive — users experience value before paying | Low |
| 3 | **Remove fake scanning delays** | High — respect ADHD attention spans | Low |
| 4 | **Pre-fill camera context from onboarding** | Medium — reduce decision fatigue | Low |
| 5 | **Show task detail on tap (subtasks, tips, decision points)** | High — surface AI intelligence that's already generated | Medium |
| 6 | **Wire `recordTaskCompletion` into task flow** | High — enable the learning system | Low |

### TIER 2 — Do This Month (Intelligence)

| # | Fix | Impact | Effort |
|---|-----|--------|--------|
| 7 | **Send user profile to Gemini context** | Critical — close the feedback loop | Medium |
| 8 | **Room freshness decay system** | Critical — creates daily pull | Medium |
| 9 | **"Today's Tasks" daily curated view** | Critical — the engagement anchor | High |
| 10 | **Recurring tasks from AI suggestions** | Critical — without this, app dies after first use | High |
| 11 | **Sync task optimizer profile to Convex** | High — learning survives device changes | Medium |
| 12 | **Push notification scheduling** | Critical — #1 driver of daily engagement | Medium |

### TIER 3 — Do This Quarter (Engagement)

| # | Fix | Impact | Effort |
|---|-----|--------|--------|
| 13 | **Wire collectible drops into task completion** | High — already scaffolded, just needs wiring | Low |
| 14 | **Consistency score replacing streak as primary metric** | High — ADHD-friendly alternative | Medium |
| 15 | **Mascot proactivity (reactions, notifications, decay)** | High — drives emotional engagement | Medium |
| 16 | **Task granularity slider (Goblin Tools style)** | Medium — expose `taskBreakdownLevel` to AI | Medium |
| 17 | **ADHD settings section** | Medium — personalization drives retention | Low |
| 18 | **Re-scan room comparison (before/after slider)** | High — viral/shareable "wow" feature | High |
| 19 | **Price reduction + restructured free/pro split** | High — competitive positioning | Low |

### TIER 4 — Future (Differentiation)

| # | Fix | Impact | Effort |
|---|-----|--------|--------|
| 20 | **Body doubling / shared sessions** | Very High — category differentiator | Very High |
| 21 | **Cosmetic economy for mascot** | Medium — monetization diversification | High |
| 22 | **Fix all challenge types auto-progress** | Medium — social features need to work | Medium |
| 23 | **Apply accountability XP bonus** | Low — promised feature not delivered | Low |
| 24 | **Dark/light mode consistency** | Medium — camera + blitz always dark | Low |
| 25 | **Fix broken rate app URL** | Low — but will crash on tap | Low |

---

## BOTTOM LINE

The Gemini prompt is best-in-class. The comeback engine is thoughtfully designed. The badge system is properly server-validated. The collectible/mascot scaffolding shows strong product thinking.

But the app collects learning data and stores it locally, then throws it away at the moment it matters most (the AI call). The onboarding asks ADHD users to make 8+ decisions before they can clean. The paywall appears before value is demonstrated. And once a room is done, there's zero reason to come back.

**Fix the feedback loop, slash the onboarding, add freshness decay + recurring tasks + Today's Tasks, and move the paywall.** Do those four things and this goes from a fancy camera-to-todo-list converter to an app people actually pay for and use daily.

The core idea is genuinely novel. The execution needs to catch up.
