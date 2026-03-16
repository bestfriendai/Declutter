# Expressive Visual Refresh

Date: 2026-03-14

## Goal

Keep the current app structure and Pencil-aligned information architecture, but remove the flat, grayscale, low-energy feeling from the main product surfaces.

## Design Direction

Use a "warm kinetic calm" visual system:

- Atmosphere instead of flat backgrounds
- Clearer contrast between primary, secondary, and passive surfaces
- Stronger hero moments on `Home`, `Progress`, and `Profile`
- Premium reward language instead of generic cards
- Motion that feels present but controlled

## Scope

Primary implementation targets:

- `app/(tabs)/index.tsx`
- `app/(tabs)/progress.tsx`
- `app/(tabs)/profile.tsx`
- `app/(tabs)/_layout.tsx`
- shared ambient visual primitive for layered background depth

## Key Changes

### Home

- Introduce an atmospheric layered backdrop
- Strengthen the top hero area and streak treatment
- Make the primary CTA feel intentional and premium
- Improve the empty room state so it feels inviting instead of unfinished

### Progress

- Turn the top summary into a momentum story
- Add stronger visual hierarchy to rings, stats, and the trend card
- Make active states and completion feel more rewarding

### Profile

- Increase identity in the profile header
- Make badges and upgrade surfaces feel collectible and aspirational
- Give community/accountability cards more depth and visual meaning

### Tab Chrome

- Keep the floating tab bar structure
- Add more depth, glow, and focus to the active state

## Guardrails

- Preserve route structure and screen responsibilities
- Preserve existing functionality and accessibility
- Support light and dark mode with equal intentionality
- Respect reduced motion

## Verification

- `npm run typecheck`
- `npm test -- --runInBand`
- Live simulator screenshots for the redesigned tab surfaces
