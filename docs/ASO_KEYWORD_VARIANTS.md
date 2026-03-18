# Declutter: ASO Keyword Strategy Variants

## Current Keywords (ADHD-First)
**Currently deployed in fastlane/metadata:**
```
organize,tidy,housework,checklist,routine,focus,motivation,reminder,schedule,productivity,household
```
**Positioning:** Leads with relatability terms (ADHD, routine) + action (tidy, organize) + motivation (focus). Targets ADHD-aware seekers + people who know they need help.

**Why:** Sweepy's top reviews are ADHD-first ("This app will change your life!"). Subtitle says "ADHD Cleaning & Chore Plan." Matched to user intent.

---

## Variant A: Volume-First (Capture Broader Intent)
```
cleaning,organize,chore schedule,declutter,home,tidy,housework,rooms,tasks,family,motivation
```
**Positioning:** Leads with highest-volume base terms (cleaning, organize, chore schedule) then layers intent (declutter, family, motivation).

**Trade-off:** Casts wider net; may attract less committed users; higher impression volume but potentially lower conversion if ADHD angle is weak.

**When to use:** If you want maximum download volume initially, then filter via onboarding for committed users.

---

## Variant B: Family + Gamification (Leverage Sweepy's Leaderboard Edge)
```
family chores,household schedule,chore tracker,organize home,motivation,gamification,kids tasks,house cleaning,habits,leaderboard,shared responsibility
```
**Positioning:** Emphasizes family coordination, accountability, and gamified progress. Targets households (not just individuals) and parents.

**Why:** Sweepy's highest-rated reviews mention "family involvement," "leaderboard," "kids competing." This lane is underexploited vs. single-user cleaning apps.

**When to use:** Once you have family/household sharing features fully built out. High loyalty and lifetime value if positioned right.

---

## Variant C: Micro-Habits + ADHD (Deepest Niche)
```
adhd friendly,tiny habits,task breakdown,low pressure,overwhelm,motivation,routine builder,focus,mental load,executive function,habit tracking
```
**Positioning:** Ultra-specific to ADHD neurotype + mental load reduction. Targets people who explicitly know ADHD is their blocker.

**Why:** Sweepy review: "broken tasks down into smaller...more achievable...feeling a sense of accomplishment." Review language is hyper-specific: "mental load," "overwhelmed," "sense of accomplishment."

**When to use:** If your app messaging leans deeper into neuroscience/ADHD validation. Smaller audience but higher conversion rate and retention.

---

## Testing Strategy

### Phase 1 (Current)
Deploy **Current ADHD-First** keywords (already in fastlane/metadata). Monitor ASC for:
- Impressions (visibility in search)
- Conversion rate (impressions → downloads)
- User reviews (confirm ADHD/overwhelm language resonates)

### Phase 2 (Post-Build, Week 3-4)
Once iOS app is live on App Store, run 2-week keyword test:
- **Day 1–7:** Current ADHD-First (control)
- **Day 8–14:** Variant B (Family) to test household angle
- Measure conversion rate, user type mix, and new user quality

### Phase 3 (Ongoing Optimization)
- If ADHD-First is working: stick with it; rotate subtitle copy instead
- If Family variant outperforms: pivot; rebuild onboarding around family features
- Variant C reserved for paid search / editorial features only (too niche for organic visibility)

---

## Metadata Alignment

**Current Subtitle:** ADHD Cleaning & Chore Plan (matched to ADHD-First keywords)

**Promotional Text:** Overwhelmed by mess? Start with one tiny win. (matched to micro-habits language)

**Description:** Emphasizes tiny tasks, reduced decision fatigue, visual progress.

All three keyword variants work with current subtitle/description; only swap the keywords field, re-upload via `fastlane metadata`, and track ASC Analytics for performance.

---

## ASC Entry Points

To switch keywords on next upload:
1. Edit `/Users/iamabillionaire/Downloads/Declutter/fastlane/metadata/en-US/keywords.txt` with chosen variant
2. Run `fastlane metadata` (or use App Store Connect web UI on first version)
3. Monitor ASC Analytics > Search Results > Top Keywords for 2 weeks
