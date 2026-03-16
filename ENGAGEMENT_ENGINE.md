# Declutterly Retention Playbook
> Research-backed tactics from Duolingo, Reforge, and Nir Eyal's Hooked

---

## The One Metric That Matters: CURR

**Current User Retention Rate** = chance a user comes back today if they came back each of the past 2 days.

Duolingo discovered CURR has **5x the impact** of any other retention metric on DAU growth. Why? CURR compounds — retained users stay in the "current" bucket and keep coming back.

**Our North Star:** Move CURR from current baseline to +21% (Duolingo's result over 4 years).

---

## The 5 High-Impact Tactics (Proven)

Based on what actually worked at Duolingo (4.5x DAU growth), not theory.

### 1. Streak System (Highest Impact)

**What Duolingo Found:** Users who reach 10-day streaks have dramatically lower churn. Streaks increase user motivation over time — the longer the streak, the greater the impetus to return.

**Implementation:**
```
STREAK_FEATURES = [
  'streak_counter',           // Show current streak prominently
  'streak_saver_notification', // "Your 12-day streak ends in 3 hours!"
  'streak_freeze',            // 1 free/week, buy more with XP
  'streak_calendar',          // Visual history (GitHub-style)
  'streak_milestones',        // Celebrate 7, 30, 100, 365 days
  'streak_recovery',          // ADHD-friendly: "Start a new streak" vs shame
]
```

**Key Notification (single highest-impact change):**
> "⚠️ Your 12-day streak ends in 3 hours! One quick task keeps it alive."

**Why It Works:**
- Loss aversion: Pain of losing streak is 2x the pleasure of gaining XP
- Escalating commitment: Each day makes tomorrow's return more valuable
- Visible progress: Calendar shows investment at a glance

**Effort:** Low (2-3 days)
**Impact:** High (Duolingo's #1 retention driver)

---

### 2. Leaderboards (Engagement-Matched, Not Friends)

**What Duolingo Found:** Leaderboards competing with friends didn't work well because friends go inactive. Leaderboards matched by **engagement level** work dramatically better.

**Implementation:**
```
LEADERBOARD_RULES = {
  matchBy: 'xp_earned_last_week',  // NOT friends
  leagueSize: 30,
  duration: 'weekly',
  promotion: 'top_10_percent',
  relegation: 'bottom_10_percent',
  leagues: ['Bronze', 'Silver', 'Gold', 'Diamond', 'Champion']
}
```

**User Experience:**
1. User is auto-placed in a league of ~30 people with similar activity
2. Weekly XP competition
3. Top 10% promote, bottom 10% relegate
4. Creates "must play to stay" urgency without friend dependency

**Why It Works:**
- Competitors are always active (unlike friends who churned)
- Achievable competition (matched by level)
- Progression system adds long-term goal
- Weekly reset creates recurring engagement loop

**Effort:** Medium (1-2 weeks)
**Impact:** High (+17% learning time at Duolingo)

---

### 3. Push Notifications (Optimized, Not Abusive)

**Cautionary Tale:** Groupon tested sending more emails. Metrics went up. They kept adding more. Then, overnight, their email channel died. Users had opted out permanently.

**Rule #1: Protect the channel.**

**What Actually Works:**

| Notification Type | Trigger | Example |
|-------------------|---------|---------|
| Streak Saver | 3 hours before streak loss | "Your 12-day streak ends soon!" |
| Loss-Framed | About to lose progress | "Don't lose your Gold League spot" |
| Optimal Time | ML-predicted best time | Send 5 min before usual session |
| Social Proof | Friend activity | "Sarah just cleaned her kitchen" |
| Achievement Near | 90%+ to milestone | "2 more tasks for 'Week Warrior' badge" |

**What Doesn't Work:**
- Generic reminders ("Time to clean!")
- Multiple notifications per day
- Notifications without clear value

**ML Timing (simple version):**
```python
def get_notification_time(user):
    # Send 5-10 min before their usual app open time
    usual_time = mode(user.session_start_times[-30:])
    return usual_time - timedelta(minutes=random.randint(5, 10))
```

**Effort:** Low-Medium
**Impact:** High (Duolingo's #2 retention driver after streaks)

---

### 4. The Hook Model (Trigger → Action → Reward → Investment)

From Nir Eyal's research on habit-forming products:

**For Declutterly:**

| Stage | Implementation |
|-------|----------------|
| **Trigger** | Notification: "Quick 5-min clean?" or internal: "I feel anxious about my room" |
| **Action** | Complete 1-3 Phase 1 tasks (minimal friction) |
| **Variable Reward** | XP (known) + mystery drop (variable) + mascot reaction (social) |
| **Investment** | XP toward streak/level, before/after photo saved, room history grows |

**Variable Rewards (slot machine psychology):**
```
REWARD_DROPS = {
  every_task: 'fixed_xp',           // Predictable base
  every_3rd_task: 'mystery_bonus',   // Variable: 2x XP, streak shield, or mascot treat
  room_complete: 'celebration',      // Confetti, mascot dance, shareable card
}
```

**Investment = Future Commitment:**
- Streak length (don't want to lose it)
- Before/after photo history (sunk cost)
- Mascot evolution progress
- League position

**Effort:** Low (mostly UX polish)
**Impact:** High (core engagement loop)

---

### 5. Shame-Free Comeback System

Most apps punish breaks. We celebrate returns.

**When User Returns After Absence:**
```
COMEBACK_EXPERIENCE = {
  '1_day': 'Welcome back! Your streak is safe.',
  '3_days': 'Hey! Dusty missed you. One quick task to get back on track?',
  '7_days': 'Life happens! Let\'s start fresh with just ONE thing.',
  '14_days': 'Your room remembers you. Ready for a 2-minute win?',
  '30_days': 'A lot can change in a month. Let\'s see your space with fresh eyes.',
}
```

**Key Principles:**
- Never mention what they "lost"
- Offer the smallest possible first step
- Celebrate the return, not the absence
- Reset expectations (new streak, not "broken" streak)

**Effort:** Low (copy + logic)
**Impact:** High (recovers churned users)

---

## The 3 Medium-Effort Multipliers

### 1. Achievement System (Visible Progress)

```
ACHIEVEMENT_CATEGORIES = {
  streaks: ['7_day', '30_day', '100_day', '365_day'],
  rooms: ['first_room', '10_rooms', '50_rooms', '100_rooms'],
  speed: ['under_time_10x', 'speedster_badge'],
  social: ['first_share', 'helped_friend'],
  hidden: ['night_owl', 'early_bird', 'marathon_2hr'],  // Surprise dopamine
}
```

**Key Feature:** "Almost there!" notifications at 90%+ progress.
> "2 more tasks for 'Week Warrior' badge!"

**Effort:** Medium (1 week)
**Impact:** Medium-High

---

### 2. Before/After Gallery

**What Users Actually Share:**
- Side-by-side room transformations
- Time elapsed (shows speed)
- "Cleaned by Declutterly" watermark (virality)

**Features:**
- Auto-captured before photo (camera screen)
- Prompted after photo (task completion)
- Shareable cards to Instagram/TikTok
- Personal gallery as progress journal

**Effort:** Medium
**Impact:** Medium (retention + acquisition)

---

### 3. Accountability Partner (Lightweight Social)

**Not guilds. Not crews. Just pairs.**

```
ACCOUNTABILITY_PAIR = {
  can_see: 'daily_activity_status',  // Just did they clean today Y/N
  can_send: 'nudge',                 // Pre-written gentle message
  bonus: 'both_complete_daily',      // +20% XP if both hit goal
}
```

**Pre-written Nudges (shame-free):**
- "Hey! Your space misses you 🧹"
- "I just cleaned — your turn?"
- "No pressure, tomorrow works too ❤️"

**Effort:** Low-Medium
**Impact:** Medium (D7 retention boost)

---

## What NOT to Build (Low ROI)

Based on Duolingo's failures:

| Feature | Why It Failed |
|---------|---------------|
| **Referral programs** | Their best users already subscribed, couldn't refer |
| **Complex mini-games** | Gardenscapes mechanics didn't translate (no strategy in cleaning) |
| **Friend leaderboards** | Friends churn; leaderboards become ghost towns |
| **Excessive notifications** | Destroys channel permanently |
| **Premium currency** | Adds complexity, distracts from core loop |
| **Battle passes** | Works for games, overkill for utility apps |

**Lesson:** Don't blindly copy features. Ask: "Why did this work THERE? Will it translate HERE?"

---

## Implementation Priority

### Week 1-2: Foundation (Low Effort, High Impact)
- [x] Streak counter + calendar view
- [x] Streak-saver notification (3 hours before midnight)
- [ ] Comeback messages (shame-free)
- [ ] Achievement unlocks at milestones
- [ ] "Almost there" progress notifications

### Week 3-4: Engagement (Medium Effort, High Impact)
- [ ] Weekly leaderboards (engagement-matched)
- [ ] Variable reward drops (every 3rd task)
- [ ] Before/after shareable cards
- [ ] Optimal notification timing (ML or rule-based)

### Month 2: Social (Medium Effort, Medium Impact)
- [ ] Accountability partners
- [ ] Friend activity feed (simple)
- [ ] League promotion/relegation
- [ ] Shareable achievement cards

### Ongoing: Optimization
- [ ] A/B test notification copy (loss-framed vs gain-framed)
- [ ] A/B test streak forgiveness (1 miss allowed vs none)
- [ ] Track CURR weekly, optimize toward it

---

## Metrics to Track

**Primary (track daily):**
| Metric | Definition | Target |
|--------|------------|--------|
| CURR | % of users active today who were active both yesterday and day before | +21% |
| Streak Distribution | % of DAU with 7+ day streak | 50%+ |

**Secondary (track weekly):**
| Metric | Current | Target |
|--------|---------|--------|
| D1 Retention | ~40% | 55% |
| D7 Retention | ~20% | 35% |
| D30 Retention | ~10% | 20% |
| Notification Open Rate | — | 15%+ |
| Streak Length (median) | — | 14 days |

---

## Key Insight

From Reforge:

> "Retention is the silent killer. Companies with 85% monthly retention crush companies with 65% monthly retention — even if the latter has 2x the acquisition."

From Duolingo:

> "CURR had 5x the impact of any other metric. When people talk about their Duolingo experience, they often bring up their streak."

From Nir Eyal:

> "Variable rewards keep users engaged. Investment stores value in the product, making it harder to leave."

**The formula:**
1. **Streaks** create loss aversion
2. **Leaderboards** create competition
3. **Variable rewards** create anticipation
4. **Investment** creates switching cost
5. **Notifications** bring users back (carefully)

---

*Document Version: 2.0*
*Based on: Duolingo growth story (Lenny's Newsletter), Reforge retention research, Nir Eyal's Hooked*
*Focus: Low effort, high impact, research-backed*
