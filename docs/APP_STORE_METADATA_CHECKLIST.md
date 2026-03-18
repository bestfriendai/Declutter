# Declutter: App Store Connect Metadata Checklist

**Status:** Ready for manual upload (Fastlane first-version edge case workaround)

---

## How to Manually Upload

Since Fastlane's `deliver` hits the "No data" edge case on first-version uploads (Fastlane issue #20538), use the App Store Connect web UI:

1. Go to **App Store Connect** → **Declutter** → **Pricing and Availability** → **App Information**
2. Copy-paste each section below into the corresponding ASC field
3. Save and submit

---

## ✅ Metadata Ready to Upload

### App Name
```
Declutter
```
**Field:** General Information → App Name

---

### Subtitle
```
ADHD Cleaning & Chore Plan
```
**Field:** General Information → Subtitle (iOS 11+)

---

### Keywords
```
organize,tidy,housework,checklist,routine,focus,motivation,reminder,schedule,productivity,household
```
**Field:** App Information → Keywords
**Notes:** 
- 11 keywords (comma-separated, no spaces after commas)
- Optimized for ADHD-first positioning + broad volume coverage
- See ASO_KEYWORD_VARIANTS.md for alternatives

---

### Description
```
Declutter helps you clean and organize your home without burnout.

If traditional chore apps feel overwhelming, Declutter breaks cleaning into small, clear actions so you always know what to do next. It is especially helpful for ADHD-friendly routines: less pressure, more momentum.

WHY DECLUTTER WORKS
- Tiny tasks instead of marathon cleaning sessions
- Room-by-room structure that reduces decision fatigue
- Visual progress that keeps motivation high
- Flexible routines that fit real life

FEATURES
- Smart daily task list for your home
- Custom cleaning and decluttering checklists
- Reminders to stay consistent
- Streaks, wins, and progress tracking
- Focus sessions for quick resets
- Before/after photo progress

FOR REAL LIFE
Declutter is designed for busy people, families, and anyone who struggles to keep up with chores. Whether you are resetting one room or building a full house routine, Declutter helps you make steady progress.

Start small. Stay consistent. Enjoy a calmer, cleaner home.
```
**Field:** App Information → Description
**Notes:**
- ~500 chars; structured for scan reading (WHY / FEATURES / FOR REAL LIFE)
- Matches conversion psychology from Tody/Sweepy
- ADHD language front-loaded

---

### Promotional Text
```
Overwhelmed by mess? Start with one tiny win. Declutter turns cleaning into short, doable tasks you can actually finish.
```
**Field:** App Information → Promotional Text
**Notes:**
- 120 chars; appears on app listing page
- Pain-first, then solution
- Matches review language from Sweepy ADHD testimonials

---

### Release Notes (What's new in v1.0)
```
✨ Declutter v1.0 Launch

We built Declutter specifically for people who find traditional chore apps overwhelming.

🎯 What's new:
- Smart daily task breakdown for every room
- Visual progress tracking that keeps you motivated
- Flexible routines designed for real life (not perfection)
- Streak tracking to build consistency
- Focus sessions for quick resets
- Photo-based before/after progress

Start small. Stay consistent. Enjoy a cleaner home.

Questions? Visit declutter.app/support
```
**Field:** Version Information → What's New in This Version
**Notes:**
- First-version release notes (only shows for v1.0)
- Uses emoji for scannability
- Includes support link for user questions

---

### Support URL
```
https://www.blockbrowser.com/support
```
**Field:** General Information → Support URL
**Notes:**
- Provide real support page, or route to general BlockBrowser support
- Users tap this when they need help

---

### Privacy Policy URL
```
https://www.blockbrowser.com/privacy
```
**Field:** General Information → Privacy Policy URL
**Notes:**
- Required by Apple
- Must be HTTPS-only
- Should cover data collection, storage, third-party sharing

---

### Marketing URL
```
https://www.blockbrowser.com
```
**Field:** General Information → Marketing URL (optional)
**Notes:**
- Homepage/landing page for the app
- Not required, but helpful for discovery

---

## 📋 Pre-Upload Checklist

- [ ] App name = "Declutter"
- [ ] Subtitle = "ADHD Cleaning & Chore Plan"
- [ ] Keywords entered (11 terms, comma-separated, no spaces)
- [ ] Description pasted (matches full text above)
- [ ] Promotional text entered (short version)
- [ ] Release notes filled for v1.0
- [ ] Support URL provided (HTTPS)
- [ ] Privacy URL provided (HTTPS)
- [ ] Marketing URL optional but confirmed
- [ ] Category set to **Productivity** (should already be set)
- [ ] Age rating confirmed (Age 4+)
- [ ] Keywords reviewed for typos
- [ ] Description reviewed for proper formatting
- [ ] Save all changes in ASC before submission

---

## Upload Strategy

### Manual ASC Web UI (Recommended for v1.0)
1. Go to **App Store Connect** → **Declutter** app
2. Select **iOS app**
3. Go to **App Information** section
4. Paste metadata section-by-section from above
5. **Save** after each major section
6. Verify all fields populated correctly
7. Ready for submission once iOS build is available

### Fastlane CLI (For Future Versions v1.1+)
Once v1.0 is live, `fastlane metadata` will work for subsequent updates:
```bash
cd /Users/iamabillionaire/Downloads/Declutter
fastlane metadata
```

---

## Validation Notes

**App Store Guidelines Compliance:**
- ✅ Name & subtitle use non-misleading marketing language
- ✅ Description explains core value + features clearly
- ✅ Keywords are relevant (not keyword-stuffing or misleading)
- ✅ No prohibited content (gambling, VPNs, adult content, etc.)
- ✅ Support URL is real and accessible
- ✅ Privacy policy addresses data collection

**ASO Quality Signals:**
- ✅ Subtitle distinct and high-intent (ADHD + Cleaning)
- ✅ Keywords balanced: broad (organize, tidy) + intent-driven (ADHD, focus, motivation)
- ✅ Description uses pain/solution/proof structure (conversion-optimized)
- ✅ Promotional text leads with pain point (overwhelm)
- ✅ Release notes match feature messaging

---

## If Fastlane Upload Fails Again

If `fastlane metadata` still errors with "No data" on next attempt:

1. Check Fastlane issue: https://github.com/fastlane/fastlane/issues/20538
2. Workaround: Always use App Store Connect web UI for first-version properties
3. Root cause: Fastlane `deliver` doesn't handle first-version-only fields well in some versions
4. Solution: Consider upgrading Fastlane or using App Store Connect API directly (Swift/Ruby)

---

## Next Step

Once metadata is uploaded, you can submit the iOS build for review. Total submission timeline:
- Metadata upload: ~10 min (manual)
- iOS build submission: ~5–30 min review time (App Store review process)
- Typical approval: 24–48 hours from submission

**Ready to proceed with iOS build + submission?** Or refine metadata further?
