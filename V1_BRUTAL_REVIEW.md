# Declutter V1 Designs -- Brutal Review Round 2
**Date:** March 18, 2026
**Scope:** V1 Pencil Designs -- All Onboarding, Core, Profile/Progress screens in dark + light mode
**Compared Against:** Original designs, BRUTAL_REVIEW.md recommendations, Calm/Headspace/Finch quality bar

---

## Executive Summary

**V1 Grade: B- (up from C+)**

The V1 redesign fixed some of the most egregious problems from the original -- the mascot exists now, the home screen has ONE clear CTA, light mode is no longer invisible, and the monochrome wall-of-glass is broken up. Good. But this is still not a shipping product. The V1 feels like a **competent wireframe with nice photos pasted on top**, not a premium ADHD wellness app. It is missing at least 8-10 critical screens, the onboarding is now too SHORT (the opposite problem), the paywall is a dramatic downgrade from the old one, the mascot images have consistency problems, and half the screens still feel sparse and unfinished.

**The honest truth:** If you put this next to Finch, Calm, or even Tiimo in the App Store, users would choose any of them over this in under 3 seconds. The visual sophistication gap is still massive.

---

## Part 1: Did V1 Fix What BRUTAL_REVIEW.md Called Out?

### 1. Monochromatic Everything -- PARTIALLY FIXED (5/10)

The old designs were a wall of identical frosted-glass cards on black. V1 adds the salmon/coral CTA buttons and green accents for "Fresh" status. The room photos bring real color to the home and room screens. The progress screen has colored stat cards.

**But:** The palette is still extremely limited. There are exactly TWO accent colors in the entire app: coral/salmon (#FF6B6B-ish) and green. Every CTA button is the same coral. Every positive state is the same green. Compare to Finch which uses 15+ colors across its UI, or Tiimo with its full rainbow palette. The V1 color system is "monochrome + one accent" -- which is better than "pure monochrome" but still nowhere near the emotional richness the BRUTAL_REVIEW demanded.

The dark mode backgrounds are still near-black everywhere. There are no gradient backgrounds, no warm tones, no cool blues, no amber "needs attention" states that were specifically recommended.

### 2. ONE Clear CTA Per Screen -- FIXED (8/10)

This was the biggest win. The home screen now has a single hero card with "Start 15-Min Blitz" -- exactly what was recommended. The analysis results have "Start with 3 easy wins" as the primary action. The onboarding steps each have one button. Good.

**Minor issue:** The room detail screen (gRNd7/bSDRz) has a floating "15-Min Blitz" button at the bottom that competes with the task checkboxes. The user's eye has to choose between "do I check a task or start the blitz?" This is a mild conflict, not a crisis.

### 3. Tap Targets 44px+ -- APPEARS IMPROVED (7/10)

The task checkboxes on the room detail screen look larger than the old 22px ones. The CTA buttons are full-width and tall. Energy level options in onboarding are large, well-spaced cards.

**But:** I cannot verify exact pixel sizes from screenshots alone. The progress screen's day-of-week circles (M T W T F S S) look small. The tab bar icons and labels still appear small.

### 4. Mascot Actually Designed -- PARTIALLY FIXED (6/10)

The gray circle placeholder is gone. Dusty now exists as an actual illustrated character -- a round, fluffy gray creature with big eyes and a broom. This is a MASSIVE improvement from "literally nothing."

**But there are serious problems:**
- **Checkered transparency backgrounds are visible** on the mascot images in both the splash screen (DQ8lf, q2KNR) and the "Meet Dusty" screen (he85Z, fI252). This is a PNG transparency artifact that screams "unfinished asset." The mascot images are placed on circular frames but the PNG backgrounds aren't properly masked or the images themselves still have transparency grid patterns.
- **Inconsistent mascot art across screens.** The splash screen shows Dusty in a different art style (more detailed, holding a broom, blue/gray tones) than the "Meet Dusty" onboarding screen (simpler, pinker, different pose). The profile screen (qscRN, v5MmJ) shows yet ANOTHER version of Dusty -- a realistic-looking hamster-like creature sitting in a tiny bucket, completely different art style from both onboarding versions. These look like three different AI image generations with no style guide. Finch's bird looks the same everywhere. Dusty looks like three different characters.
- **Dusty is absent from most screens.** The home screen has a tiny mascot avatar in the top-right corner, but Dusty is NOT present on the progress screen, the room detail screen, the analysis screen, the camera screen, or the focus timer. The BRUTAL_REVIEW specifically said "Present everywhere -- home screen, during sessions, celebrations, push notifications." V1 has Dusty on 3 out of ~15 screens.

### 5. Varied Card Styles -- IMPROVED (7/10)

The old design had one glass-morphism card for everything. V1 has:
- Hero photo card (home screen)
- Compact room cards with icons (home screen "Your Spaces")
- Task list items with checkboxes (room detail)
- Stat number cards (progress screen)
- Streak card with progress bar (progress screen)
- Category grouping cards (analysis results)

This is genuinely better. Different content types look different now. The analysis results screen (30nGD) is particularly well-structured with grouped categories.

### 6. Light Mode Actually Designed -- IMPROVED (7/10)

Light mode is no longer invisible. Cards have visible borders/shadows, backgrounds are warm off-white, the coral buttons pop nicely against the light background. The progress screen in light mode (RLHTy) reads cleanly.

**But:** Light mode is still clearly a mechanical derivative of dark mode, not independently designed. The room detail light mode (bSDRz) has the dark room photo bleeding into the light interface in a jarring way. The focus timer light mode (MZhKY) feels washed out -- the red timer ring against white doesn't have the same visual weight as against black.

### 7. Celebration/Empty/Error States -- NOT FIXED (1/10)

**This is the single biggest remaining failure.** The BRUTAL_REVIEW called this out explicitly and V1 has ZERO celebration states, ZERO empty states, ZERO error states designed. Not a single one.

- What happens when you complete all tasks in a room? No screen for that.
- What happens when you open the app with 0 rooms scanned? No screen for that.
- What happens when the AI scan fails? No screen for that.
- What happens when you hit a streak milestone? No screen for that.
- What happens when your streak breaks? No screen for that.
- What happens after your first completed session? No screen for that.

This is CRITICAL for an ADHD app. The dopamine hit of completing something is the entire retention mechanism. Right now, you finish a room and... nothing happens. The app has no emotional payoff designed anywhere.

### 8. Typography Consistency -- IMPROVED (7/10)

Headlines appear to use a consistent bold sans-serif (looks like Bricolage Grotesque or similar). Body text appears larger than the old 12px minimums. The hierarchy is clearer -- "Your Progress," "Bedroom," "Settings" all read as strong headers.

**But:** The onboarding "Step 1 of 5" text is quite small. The "Your best this month" subtitle on the streak card is small. The focus timer's "remaining" label under the clock is hard to read.

---

## Part 2: Screen-by-Screen Review

### ONBOARDING -- DARK MODE

#### Splash/Welcome (DQ8lf) -- Rating: 5/10
**What works:** Dusty is front and center. "Your ADHD-friendly cleaning companion" is clear positioning. The coral "Get Started" button pops. Page dots indicate there's a flow.
**What doesn't work:**
- The checkered transparency pattern behind Dusty's circular frame is a glaring unfinished-asset problem. This would never ship.
- "I already have an account" is in very low contrast gray. Easy to miss.
- The page dots at the bottom suggest you can swipe through screens, but if this is a splash/welcome, those dots are confusing -- what are the other dot pages?
- Compared to the old splash, this is better (Dusty exists now), but compared to Calm's lush landscape or Finch's egg-hatching animation, this is still static and flat.
- No tagline that creates urgency or emotion. "Your ADHD-friendly cleaning companion" is descriptive but not motivating. Compare to Headspace: "Be kind to your mind."
**What's missing:** An emotional hook. A reason to care. An animation or visual moment that makes you FEEL something.

#### Empathy Screen (0vlrV) -- Rating: 7/10
**What works:** "Cleaning feels impossible sometimes" is emotionally resonant copy. "You're not lazy -- your brain just works differently" is excellent. The heart icon adds warmth. "That's me" as the CTA is psychologically smart -- it's an affirmation, not a command.
**What doesn't work:**
- The screen is visually sparse. A heart icon, a headline, body copy, and a button. That's it. The entire upper half of the screen is empty black space. Compare to Fabulous or Calm onboarding which fill the screen with atmospheric art.
- This is a text-only screen in an app that's supposed to be visually rich and emotionally engaging. Where's Dusty? Where's an illustration of the feeling? Show, don't tell.
**What's missing:** Visual illustration of the emotion. Dusty could be shown looking overwhelmed by clutter, creating empathy through character, not just words.

#### Energy Check (benVE) -- Rating: 8/10
**What works:** The four energy levels are smart ADHD-first design. Each option has an icon, a title, AND a subtitle explaining what it means ("Just basics today," "Small wins only"). The cards are well-spaced with clear tap targets. This is genuinely good UX.
**What doesn't work:**
- Icons are generic line-art (lightning bolt, battery, etc.). Custom illustrated icons showing Dusty at different energy levels would be more emotionally engaging and on-brand.
- No visual indication of which option is selected. If the user taps "Low Energy," does the card highlight? The design doesn't show selected state.
- The "Next" button is always visible -- should it be disabled until a selection is made?
**What's missing:** Selected state design. Dusty reacting to your choice.

#### Camera Prompt (ziWlG) -- Rating: 6/10
**What works:** The camera icon is clear. "No judgment, just a gentle starting point" is great ADHD-safe copy. "Skip for now" respects user autonomy.
**What doesn't work:**
- Another screen that's 60% empty black space with a small icon in the center. This is the moment you're asking the user to do something significant (photograph their messy room). It needs to feel SAFE and EXCITING, not empty and clinical.
- The camera icon is a generic outlined circle. Nothing about this screen makes you WANT to take a photo.
- Where's Dusty? This is the perfect moment for "Dusty peeks out from behind the camera" to make photo-taking feel playful instead of anxiety-inducing.
**What's missing:** Dusty. Emotional safety reinforcement. Maybe a preview of what the result will look like to motivate the action.

#### Meet Dusty (he85Z) -- Rating: 6/10
**What works:** "Meet Dusty! Your cleaning companion" clearly establishes the relationship. The name field with "You can always change this later" reduces commitment anxiety. "Let's clean together!" is a warm, partnership-framing CTA.
**What doesn't work:**
- CHECKERED TRANSPARENCY BACKGROUND on Dusty's image again. Unacceptable for the character's debut screen.
- Dusty looks different here than on the splash screen. Different pose, different coloring (pinker/warmer here vs bluer/cooler on splash). Which is the real Dusty?
- The screen doesn't explain what the mascot DOES. Why should I care about naming it? What does it do for me? Finch's onboarding shows the bird growing and gaining accessories. This just says "here's a thing, name it."
- No personality preview. Dusty should be doing something -- waving, dancing, holding cleaning supplies -- not just sitting there.
**What's missing:** Mascot animation/personality preview. Explanation of what the companion does. Consistent art style.

#### Paywall (PQtOl) -- Rating: 4/10
**What works:** The Monthly/Annual toggle with "Save 40%" is standard and fine. The gold gradient "Start My Free Week" CTA button is eye-catching. "Continue with free plan" and "7-day free trial. Cancel anytime." build trust. The feature list is clear with green checkmarks.
**What doesn't work:**
- **This is a MASSIVE downgrade from the old paywall (zry8j).** The old paywall had:
  - "Editor's Choice - App Store Featured" badge (social proof)
  - 5-star rating with "4.9 - 165K+ ratings" (social proof)
  - An actual user review quote (social proof)
  - "Have a promo code? Redeem" option
  - "7-day money-back guarantee" (trust)
  - 6 feature benefit lines with leaf icons
  - More compelling copy per feature

  The V1 paywall has NONE of that social proof. No ratings, no reviews, no Editor's Choice badge, no money-back guarantee. The old paywall was called "the best-designed screen in the app" and the V1 threw all its best elements away.
- The feature list is only 4 items and they're generic: "Unlimited room scans & AI tasks," "15-Minute Blitz with smart task picks," "Mascot growth & customization," "Full progress tracking & streaks." These describe features, not BENEFITS. The old paywall had "Feel proud of your clean space" and "Routines that fit your ADHD brain" -- benefit-oriented copy.
- The "DECLUTTER PRO" badge at the top is small and gets lost.
- $49.99/year pricing is shown but the monthly price for comparison is hidden behind the toggle. Price anchoring works best when both prices are visible simultaneously. The old design showed "$4.99/mo" next to "$39.99/yr" side by side.
- The overall visual impact is flat. No premium feel. No imagery. Just a list and a button on a dark background.
**What's missing:** ALL social proof (ratings, reviews, badges). Money-back guarantee. Benefit-oriented copy. Visual richness. Before/after imagery. The old paywall's best elements.

### ONBOARDING -- LIGHT MODE

#### Splash Light (q2KNR) -- Rating: 5/10
Same issues as dark splash. Transparency checkering visible. Dusty has a slightly different appearance (bluer eyes, different expression) than the dark version. The light background works fine but is unremarkable.

#### Empathy Light (Z3UV5) -- Rating: 7/10
The coral heart and button pop nicely against white. Clean and readable. Same "too much empty space" problem as dark version.

#### Energy Check Light (KYQ8r) -- Rating: 7/10
Cards have subtle borders that define them well against white. Reads cleanly. Same issues as dark version re: missing selected state.

#### Camera Prompt Light (RdUBT) -- Rating: 6/10
The camera icon in a subtle circle reads fine. Same emptiness problems.

#### Meet Dusty Light (fI252) -- Rating: 6/10
Transparency checkering is EVEN MORE visible against the light background. Dusty's image here shows a different art style again -- holding a blue cloth, more muted colors. Three screens with Dusty, three different-looking Dustys.

#### Paywall Light (VfgR5) -- Rating: 4/10
Same problems as dark paywall. The gold CTA button works in both modes. Missing all social proof.

### CORE SCREENS -- DARK MODE

#### Home Screen (rSSHH) -- Rating: 7/10
**What works:**
- ONE hero card with room photo, "Today's Mission" label, clear "Start 15-Min Blitz" CTA. This is exactly what the BRUTAL_REVIEW asked for. Best improvement in the entire V1.
- "3 easy tasks - ~15 min" sets expectations perfectly for ADHD users.
- "Your Spaces" section below with compact room cards shows Bedroom (Fresh) and Kitchen (Needs love) with appropriate color coding.
- Mascot avatar in top-right corner is a nice touch.
- The room photo adds real color and warmth to the screen.

**What doesn't work:**
- "Hey, Alex" greeting takes up a line but adds nothing. The old design had "Breathe in, Alex / Your quiet space / Friday / Evening ritual" which was too much, but "Hey, Alex" is too little -- no personality.
- The "Your Spaces" section only shows 2 rooms and then the screen ends. Below the two room cards there's just... the tab bar. The screen feels SHORT. It needs more content density or a scrollable section.
- Mascot avatar in the top-right is so tiny it's barely recognizable as Dusty. It could be any circular image.
- The room cards in "Your Spaces" use emoji icons (bed emoji, utensils emoji). These are fine but not custom. Tiimo uses beautiful custom icons for every category.
- "Fresh" and "Needs love" status labels are good, but "Needs love" is the ONLY amber/warm indicator in the entire app. Everything else is red or green.
- No streak indicator on the home screen. The old design had a "Mindful Streak 3/5" card. V1 moves streak to progress tab, but users need to see it daily for motivation.
- No motivational micro-copy. The old design's motivational quote was too hidden (12px, 56% opacity), but V1 overcorrected by removing motivation entirely.

**What's missing:** Streak display. More content below the fold. Mascot presence beyond a tiny avatar. Daily motivation. A "Quick Add Room" action.

#### Camera/Scan (KzTY3) -- Rating: 7/10
**What works:** Full-screen camera viewfinder with corner brackets. Room type pills (Bedroom, Kitchen, Bathroom, Living) at the bottom. Shutter button is prominent. "Hold steady -- capture the full room" instruction is helpful.
**What doesn't work:**
- The selected room type pill ("Bedroom" in red) doesn't contrast enough with the others. In the light version (KaGUR), the unselected pills are especially hard to read against the photo background.
- The "Scan Room" title text and back arrow at the top could get lost against light-colored room photos.
- The instruction text "Hold steady" overlaps with the room photo and may be unreadable depending on what's behind it. Needs a semi-transparent backdrop.
- No flash toggle, no gallery option to upload an existing photo.
**What's missing:** Flash toggle. Photo gallery import option. Better text legibility against variable photo backgrounds.

#### Analysis Loading (7iGXL) -- Rating: 7/10
**What works:** The room photo with scanning corner brackets is a nice visual metaphor. "Taking a calm look..." is perfectly ADHD-safe language. "No judgment -- just finding where to start" reinforces safety. The three-step progress indicator (Scanning your space -> Spotting areas to tidy -> Building your task list) sets expectations.
**What doesn't work:**
- The scanning animation (red corners around the photo) is static in the design. It MUST animate smoothly in implementation or it'll feel broken.
- "Taking a calm look..." with the ellipsis could feel slow/frustrating if the actual loading takes more than 5-10 seconds. ADHD users have extremely low tolerance for waiting.
- The three progress steps are small and at the bottom of the screen. The visual hierarchy puts the photo first (which you've already seen) and the actual status update second.
**What's missing:** Estimated time remaining. Dusty doing something cute while you wait (huge missed opportunity). A tip or fun fact about the room to pass time.

#### Analysis Results (30nGD) -- Rating: 8/10
**What works:** This is one of the BEST screens in V1. The room photo at top provides context. "8 things spotted" and "~25 min total" set clear expectations. Tasks are GROUPED BY CATEGORY (Clothes on floor, Desk clutter, Bedside table) -- this is smart, it breaks the work into meaningful chunks instead of one overwhelming flat list. "Start with 3 easy wins" as the primary CTA is psychologically excellent for ADHD -- it's a low-commitment entry point. "See all 8 tasks" is there for users who want the full picture.
**What doesn't work:**
- The category cards all look identical -- white-bordered rectangles with text. The "3 tasks" badges help differentiate but the cards themselves have no visual variety. Color-coding by difficulty or area would help.
- The room photo is very small at the top. It's more of a thumbnail. Could be removed or made into a full-width header.
- There's no indication of which tasks are the "3 easy wins." The user taps the button and then... what? How are the 3 chosen? This needs to be visible.
**What's missing:** Difficulty/effort indicators per category. A preview of which tasks are "easy wins." Estimated time per category.

#### Room Detail (gRNd7) -- Rating: 7/10
**What works:** Room photo header with progress bar overlay is visually effective. "Quick Wins / Deep Clean / Organize" tab filter is excellent for ADHD -- it lets users self-select their effort level. Task list with checkboxes, task names, and time estimates is clear and functional. The green checkmark on completed task ("Clear bedside table") provides visual feedback. Floating "15-Min Blitz" button is prominently positioned.
**What doesn't work:**
- The room photo at the top is dark and hard to see. The "Getting Fresh" badge in the top-right corner is nearly invisible -- coral text on a dark photo with no background.
- The progress bar under the room name is thin and easy to miss. A percentage number would help.
- Task checkboxes are color-coded on the left border (different colors per task) but the meaning of the colors isn't explained. Are these difficulty levels? Categories? Random?
- ALL tasks show the same visual treatment. "Pick up clothes from floor (3 min)" looks identical to "Put away clean laundry (5 min)" -- no differentiation by priority, difficulty, or impact.
- The space between the photo header and the task list feels tight. No breathing room.
- "Getting Fresh" as a status label makes no grammatical sense. "Getting Fresher" or just "In Progress" would be clearer.
**What's missing:** Completion percentage number. Legend for task color codes. Priority/impact indicators. What happens when all tasks are done? No completion state designed.

#### Focus Timer (0mb7F) -- Rating: 6/10
**What works:** Large 12:34 countdown is readable. The pie-chart-style timer ring is visually distinctive -- it fills as time passes, giving a visual sense of progress. "NOW" current task card and "UP NEXT" queued task create a clear flow. "2 of 5 done" with progress dots is helpful. Transport controls (stop, pause, skip) are clear.
**What doesn't work:**
- "You're doing amazing" at the bottom is tiny and low-contrast. If you're going to give encouragement, COMMIT to it. Make it big, make it warm, make it feel real.
- The screen is very RED. The timer ring is coral/red, the "NOW" badge is red, the pause button is red. Red typically signals danger/urgency/stop. For an ADHD-calming app, should the dominant timer color be calming (blue, green, warm amber) instead of alarming?
- The current task says "Wipe kitchen counters" but the header says "Bedroom Refresh." These don't match -- is it pulling tasks from multiple rooms? If so, that needs to be clearer.
- No mascot presence during the active cleaning session. This is when Dusty should be most present -- cheering you on, reacting to task completions.
- No audio/sound indicators in the design. White noise options were in the schema. Even if not V1, the interface should hint at audio controls.
- The "remaining" label under the timer is so small it's nearly invisible.
**What's missing:** Mascot encouragement during cleaning. Sound/music controls. Task completion micro-celebration. Clearer labeling of which room tasks belong to. What happens when the timer ends? No completion state.

### CORE SCREENS -- LIGHT MODE

#### Home Light (oDOBX) -- Rating: 7/10
Same strengths and weaknesses as dark. The room photo hero card translates well to light mode. Room cards in "Your Spaces" have subtle shadows that define them nicely.

#### Camera Light (KaGUR) -- Rating: 6/10
The room type pills are harder to read in light mode. The "Scan Room" title and back arrow in black work against most photos but could fail against dark areas.

#### Analysis Loading Light (hWBVs) -- Rating: 7/10
Works well in light. The scanning corners and progress steps are visible. Same structural issues.

#### Analysis Results Light (oHsuc) -- Rating: 7/10
Cards have subtle borders that define them against white. Reads cleanly. Category structure works in both modes.

#### Room Detail Light (bSDRz) -- Rating: 6/10
The dark room photo clashes with the light UI below it. The transition from photo to white background is abrupt. "Getting Fresh" label is more visible here (coral on light) but the overall visual coherence suffers from the photo/UI contrast mismatch.

#### Focus Timer Light (MZhKY) -- Rating: 5/10
The red timer ring against white looks washed out compared to the dark version. The visual weight and focus-drawing power of the timer is significantly reduced. The light gray timer ring outline is barely visible. This screen NEEDS the dark background to work -- it should probably force dark mode during focus sessions.

### PROFILE/PROGRESS -- DARK MODE

#### Progress Screen (jWOvn) -- Rating: 7/10
**What works:** Day-of-week streak tracker at the top with check/fire/dot indicators is scannable. "5 Day Streak!" card with "Your best this month" and a progress bar is motivating. Four stat cards (4 Rooms, 47 Tasks Done, 12h Time Cleaned, 89% Completion) give a clear overview. The motivational message at the bottom ("Small progress is still progress. You cleaned 3 more tasks than last week!") is warm and encouraging.
**What doesn't work:**
- The stat cards are all the same style again. Four identical rectangles with a number and label. The numbers (4, 47, 12h, 89%) are different data types but presented identically. "89% Completion" should look DIFFERENT from "4 Rooms" -- maybe the completion stat gets a ring visualization.
- The week streak indicators (M T W T F S S) -- Sunday and Saturday appear as empty gray circles. Is that "not yet" or "missed"? The visual language for future vs. missed days isn't clear. For ADHD users, seeing "missed" days needs to be handled with extreme care.
- No graph or trend visualization. The old design had a weekly bar chart (which was bad), but V1 removed it entirely instead of fixing it. A simple "tasks per week" sparkline or "this week vs last week" comparison would add context.
- The motivational message card at the bottom is one of the best elements but it's in a low-contrast yellowish card that doesn't stand out enough.
- No mascot anywhere on this screen.
**What's missing:** Trend visualization. Room-by-room breakdown. Mascot reaction to progress. What does 0% / new user progress look like?

#### Profile Screen (qscRN) -- Rating: 6/10
**What works:** User card with name, level ("Level 7 - Tidy Explorer"), and XP progress bar is clean. "Your Companion" section showing Dusty with mood bars (Happiness, Energy, Hunger) is a nice Tamagotchi-style mechanic. Three stat circles (5 Streak, 4 Rooms, 47 Tasks) provide quick reference. "Upgrade to Pro" upsell card.
**What doesn't work:**
- Dusty's image here is COMPLETELY different from every other screen. It's a realistic-style hamster/chinchilla sitting in a small blue bucket/cup. This looks like a different character entirely from the cartoon Dusty on the splash and onboarding screens. This is a critical consistency failure -- the mascot must look the same everywhere.
- The user avatar (small circular image in the top-left of the user card) shows a realistic hamster face, not a human avatar or placeholder. Is the user avatar also the mascot? This is confusing.
- The Happiness/Energy/Hunger bars are a nice concept but raise questions: How do I feed Dusty? What happens when Hunger is low? These mechanics are introduced visually but not explained, and there's no screen showing how to interact with them.
- The "Upgrade to Pro" card is generic -- just a star icon and "Unlock all features." No compelling reason to tap it.
- The settings gear icon in the top-right is very small.
- The overall layout feels like three sections stacked vertically with no visual flow between them.
**What's missing:** How to interact with Dusty's needs. Mascot customization/outfits. Achievement highlights. A more compelling pro upsell.

#### Settings Screen (SQBKW) -- Rating: 6/10
**What works:** Clean, organized sections (General, Appearance, Support & About). Standard iOS-style list with chevrons. Dark Mode toggle. Theme Color option with a coral dot. Version number at the bottom.
**What doesn't work:**
- This is the most GENERIC screen in the app. It could be from literally any app. Zero personality, zero brand identity. The old settings screen (8kS1c) was called "the most polished, cleanest screen in the app" and it had Sound FX, Haptic Feedback, Rate Declutter, and actual icon styling. V1 settings is plainer than the old one.
- "Cleaning Preferences" is vague. What preferences? This is the ADHD app's chance to let users customize their experience (energy defaults, task limits, notification style, overwhelm sensitivity) and it's hidden behind one generic label.
- No profile management (logout, delete account, manage subscription) visible. These are App Store requirements.
- No "Manage Subscription" or "Restore Purchases" options which are REQUIRED by Apple for apps with subscriptions.
- "Theme Color" shows a single coral dot. Is this a color picker? A single-option display? The interaction is unclear.
- Missing: Sound FX toggle, Haptic Feedback toggle (both were in old design), Rate Declutter, Privacy Policy, Terms of Service (legally required for App Store).
**What's missing:** Logout/Delete Account. Manage Subscription. Restore Purchases. Privacy Policy. Terms of Service. Sound/Haptic toggles. More granular cleaning preferences.

### PROFILE/PROGRESS -- LIGHT MODE

#### Progress Light (RLHTy) -- Rating: 7/10
Translates well to light mode. Stat cards have subtle backgrounds. The streak indicators read clearly. The motivational card at the bottom has a warm peach/yellow tone that's pleasant.

#### Profile Light (v5MmJ) -- Rating: 6/10
Same issues as dark. Dusty's inconsistent art style is slightly less jarring in the warm light-mode rendering. The stat circles have coral borders that look nice.

#### Settings Light (kHQIP) -- Rating: 6/10
Clean and readable. Same content problems as dark version.

---

## Part 3: Comparison to Old Design Best-Of

### Old Paywall (zry8j) vs V1 Paywall (PQtOl/VfgR5)

**The old paywall is significantly better.** Here's what V1 lost:

| Element | Old Paywall | V1 Paywall |
|---------|------------|------------|
| Editor's Choice badge | Yes, prominent | Gone |
| Star rating (4.9, 165K+) | Yes, prominent | Gone |
| User review quote | Yes, "Finally an app that gets how my ADHD brain works with cleaning!" | Gone |
| Number of feature benefits | 6 | 4 |
| Benefit-oriented copy | "Feel proud of your clean space" | "Unlimited room scans & AI tasks" (feature, not benefit) |
| Promo code option | Yes | Gone |
| Money-back guarantee | Yes, "7-day money-back guarantee" | Gone |
| Side-by-side pricing | Both visible | Hidden behind toggle |
| Visual richness | Gold gradient accents, leaf icons, layered | Flat, minimal |

**Verdict:** The V1 paywall would convert at maybe 40-60% the rate of the old one. Social proof is the #1 paywall conversion driver and V1 removed ALL of it. Bring back every element from the old paywall.

### Old Onboarding V2 (gAJsC) vs V1 Onboarding

The old V2 had 12 screens and was "the strongest part of the design" per BRUTAL_REVIEW. It included:
- Multiple quiz questions (living situation, cleaning struggles, energy, time availability, motivation style)
- Mascot selection
- Plan preview/loading
- Commitment screen
- Paywall

V1 onboarding has 5 screens (splash -> empathy -> energy check -> camera prompt -> meet Dusty -> paywall). The BRUTAL_REVIEW said cut to "6 steps max" and V1 delivered 5+paywall, which technically meets the recommendation.

**But the user said "it should be a bit longer like the old designs" and they're right.** The V1 onboarding moves too fast. You go from "cleaning feels impossible" to "open your camera" in two taps. There's no:
- Living situation question (apartment vs house matters for cleaning scope)
- Biggest cleaning struggle question (helps AI personalization)
- Time availability question (determines session length recommendations)
- Motivation style question (determines notification/reward approach)

These aren't bloat -- they're PERSONALIZATION that makes the AI recommendations better and makes the user feel understood. The old flow asked too many questions (6). The V1 asks too few (1 -- energy only). The right number is 3-4 quiz questions, delivered quickly with engaging visuals.

### Old Home (EaNi8) vs V1 Home (rSSHH)

**V1 wins.** The old home was cluttered with greeting + date + ritual + quote + streak card + hero card + room list + "Start Your Flow" button. V1's "Today's Mission" hero card with one CTA is dramatically better. The room photo makes it warm and inviting. The old home was trying to be a dashboard; V1's home is trying to be a launchpad. The launchpad approach is correct.

**But V1 lost some useful density.** The old home showed room percentages (Bedroom 42%, Kitchen 25%) which gave you a sense of progress without tapping in. V1's room cards show "Fresh" and "Needs love" which are friendlier but less informative. Consider adding a small progress bar to the room cards.

### Old Settings (8kS1c) vs V1 Settings (SQBKW)

**The old settings was better.** It had Sound FX, Haptic Feedback, Rate Declutter, Privacy Policy, Terms of Service, Edit Profile with description. V1 settings stripped out legally required elements and personality features. This is a regression.

---

## Part 4: What's MISSING from V1

This is the most critical section. V1 has 15 screen designs (onboarding 6 + core 6 + profile/progress 3, each in dark and light). A shipping app needs at minimum ~25-30 distinct screen states. Here is what V1 is missing:

### Screens That MUST Exist Before Shipping

1. **Sign In Screen** -- Users who tapped "I already have an account" on the splash need somewhere to go. Email + password form, social auth buttons, forgot password link. Not designed.

2. **Sign Up Screen** -- New users need to create an account at some point. When? Where? Not designed.

3. **Notification Permission Screen** -- iOS requires an explicit permission prompt, and best practice is a custom pre-prompt screen explaining WHY you want notifications. "Dusty wants to cheer you on!" with a custom illustration. Not designed.

4. **Empty State: Home (0 rooms)** -- What does a brand new user see after onboarding if they skipped the camera step? The home screen assumes a room exists. Not designed.

5. **Empty State: Progress (new user)** -- What does the progress screen look like with 0 tasks, 0 streak, 0 rooms? Showing "0" everywhere is demoralizing. Not designed.

6. **Empty State: Rooms tab** -- What does the rooms tab look like before any rooms are scanned? Not designed.

7. **Task Completion Celebration** -- When you check off a task, what happens? This needs a designed micro-interaction (confetti, Dusty reacting, satisfying animation).

8. **Room Completion Celebration** -- When ALL tasks in a room are done, there should be a full-screen celebration moment. Before/after photo comparison. Dusty dancing. XP animation. This is the dopamine payoff. Not designed.

9. **Session Complete Screen** -- When the 15-minute blitz timer ends, what shows? "You did it! Here's what you accomplished." Summary of tasks done, time spent, Dusty celebrating. Not designed.

10. **Streak Milestone Screen** -- Hitting 7 days, 30 days, 100 days should be a BIG moment. Not designed.

11. **Welcome Back (After Absence) Screen** -- User hasn't opened the app in a week. "Welcome back! Dusty missed you. No pressure -- pick up where you left off." The BRUTAL_REVIEW specifically called this out as critical for ADHD emotional safety. Not designed.

12. **AI Scan Error State** -- Photo was blurry, AI failed, no internet. "Oops, we couldn't analyze that. Try again with better lighting." Not designed.

13. **Rooms Tab / Rooms List** -- The tab bar shows "ROOMS" but there's no standalone rooms list screen -- only the room detail. What does the rooms tab look like with multiple rooms? Not designed as a standalone screen (only shown as part of room detail).

14. **Add New Room Flow** -- After onboarding, how does the user add a second, third room? Is it just the camera again? Needs a clear entry point and possibly room type selection. Not designed.

### Screens That SHOULD Exist for a Premium Feel

15. **Mascot Interaction Screen** -- How do you "feed" Dusty, change outfits, play with it? The profile shows Happiness/Energy/Hunger bars but there's no screen to interact with the mascot. Not designed.

16. **Achievements/Badges Screen** -- The old design had one. V1 removed it entirely. Some form of achievement tracking adds long-term motivation. Not designed.

17. **Before/After Comparison** -- Show the original cluttered photo next to the clean room after completion. This is incredibly satisfying and shareable. Not designed.

18. **Onboarding: Additional Quiz Screens (2-3 more)** -- Living situation, biggest struggle, time availability. These improve personalization and make the user feel understood.

19. **Loading/Plan Preview** -- After the quiz, show "Building your personalized plan..." with Dusty working, then reveal the customized recommendation. Creates anticipation.

20. **First-Time Room Scan Tutorial** -- Overlay hints on the camera screen for first use: "Point at the whole room," "Include the floor," "Good lighting helps!"

---

## Part 5: Overall Ratings Summary

| Screen | Dark | Light | Notes |
|--------|------|-------|-------|
| Splash/Welcome | 5/10 | 5/10 | Transparency artifacts, no emotional hook |
| Empathy | 7/10 | 7/10 | Great copy, too visually sparse |
| Energy Check | 8/10 | 7/10 | Best onboarding screen, needs selected state |
| Camera Prompt | 6/10 | 6/10 | Empty, needs Dusty, needs motivation |
| Meet Dusty | 6/10 | 6/10 | Transparency artifacts, inconsistent art, no personality preview |
| Paywall | 4/10 | 4/10 | Massive downgrade from old paywall, zero social proof |
| Home | 7/10 | 7/10 | Best V1 improvement, but sparse below hero card |
| Camera/Scan | 7/10 | 6/10 | Functional, text legibility issues in light mode |
| Analysis Loading | 7/10 | 7/10 | Good copy, needs Dusty, needs time estimate |
| Analysis Results | 8/10 | 7/10 | Best screen in V1, category grouping is excellent |
| Room Detail | 7/10 | 6/10 | Good structure, needs completion state, color code legend |
| Focus Timer | 6/10 | 5/10 | Too red, no mascot, light mode fails |
| Progress | 7/10 | 7/10 | Clean stats, needs trends, needs mascot |
| Profile | 6/10 | 6/10 | Mascot art inconsistency is glaring |
| Settings | 6/10 | 6/10 | Missing legally required elements, too generic |

**Average: 6.3/10 dark, 6.0/10 light**

---

## Part 6: Priority Action Items

### P0 -- MUST FIX BEFORE ANYTHING ELSE

1. **Fix mascot art consistency.** Generate or commission ONE Dusty design and use it EVERYWHERE. The current state (3+ different art styles) breaks the emotional bond that's supposed to be the app's core retention driver.

2. **Fix transparency artifacts.** The checkered PNG backgrounds on mascot images are amateur hour. Every mascot image needs proper alpha channel on appropriate backgrounds.

3. **Rebuild the paywall.** Bring back ALL social proof elements from old paywall (zry8j): Editor's Choice badge, star ratings, user review quote, money-back guarantee, promo code option. Add benefit-oriented copy. This screen directly drives revenue.

4. **Design the missing critical screens** (sign in, sign up, notification permission, empty states, room completion celebration, session complete, welcome back after absence, AI error state). You cannot ship without these.

5. **Add Manage Subscription and Restore Purchases to Settings.** These are App Store REQUIREMENTS for subscription apps. Also add Privacy Policy and Terms of Service links.

### P1 -- SHOULD FIX BEFORE SHIPPING

6. **Add 2-3 more onboarding quiz screens** (living situation, biggest struggle, time availability). Keep each one as clean as the energy check screen. Total onboarding: 8 screens including splash and paywall.

7. **Design celebration states.** Task completion micro-animation, room completion full-screen celebration, streak milestone, first session complete. These are the dopamine system. Without them, there's no reason to keep opening the app.

8. **Add Dusty to more screens.** Minimum: home screen (bigger presence), focus timer (cheering during session), progress (reacting to stats), analysis loading (working while you wait), celebrations (dancing/confetti).

9. **Fix the focus timer color palette.** Replace alarm-red with a calming color (warm amber, soft blue, or the app's coral at reduced intensity). Add mascot encouragement that's actually visible.

10. **Make progress screen more dynamic.** Add a simple trend line or "this week vs last week" comparison. Add room-by-room breakdown.

### P2 -- SHOULD DO FOR PREMIUM FEEL

11. **Design the rooms list/tab screen.** Users with 3+ rooms need a browsable list with room photos, progress bars, and status.

12. **Design mascot interaction screen.** If Dusty has Happiness/Energy/Hunger stats, there needs to be a way to interact with them. This is a potential engagement goldmine.

13. **Add more color.** The current palette is essentially black/white + coral + green. Add warm amber for "needs attention" states, soft blue for calm/focus states, gold for achievements/celebrations. Every screen should have at least 2 color moments.

14. **Design the before/after comparison feature.** Auto-capture "before" on first scan, "after" when room is complete. Side-by-side display. This is inherently shareable content and one of the most satisfying possible features.

15. **Upgrade settings with personality.** Add Sound FX, Haptic Feedback, and cleaning preference details. Make it feel like YOUR app, not a template.

---

## Final Verdict

V1 is a real improvement over the original designs. The home screen redesign is the standout win -- one hero card, one CTA, real photography. The analysis results screen with category grouping is smart UX. The onboarding copy is emotionally intelligent. Light mode actually works now.

But V1 is still **roughly 60% of a shipping app.** It is missing too many critical screens (auth, empty states, celebrations, error states), the paywall is a dramatic downgrade, the mascot art is inconsistent across screens, and the visual palette is still too narrow for a "premium wellness" positioning. The app has no emotional payoff designed anywhere -- you complete tasks and... nothing visible happens.

**If the original designs were a C+ trying to be everything, V1 is a B- trying to be minimal.** The answer is in between: a focused app with enough screens to feel complete, enough visual richness to feel premium, and enough emotional payoff to keep ADHD users coming back.

The bones are good. The muscle isn't there yet.
