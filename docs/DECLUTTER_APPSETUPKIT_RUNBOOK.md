# Declutter App Setup Runbook (AppSetUpKit + Expo + App Store Connect)

## 1) Current project identity

- App name: `Declutter`
- iOS bundle ID: `com.declutter.app`
- Android package: `com.declutter.app`

These values are now configured in app.json.

## 2) Prerequisites

Run:

```bash
bash AppSetUpKit/check-prerequisites.sh
```

If missing, install:

```bash
brew install fastlane
npm i -g eas-cli
```

## 3) App Store Connect CLI setup (Fastlane)

Files now exist:

- `fastlane/Appfile`
- `fastlane/Fastfile`
- `fastlane/metadata/en-US/*`

Before running lanes:

1. Edit `fastlane/Appfile` and set your real Apple ID email.
2. Confirm `AppSetUpKit/appsetupkit.p8` is valid for your Apple team.

Run from repo root:

```bash
fastlane create_app
fastlane setup_capabilities
fastlane metadata
```

If API permissions do not allow app creation, create the app manually in App Store Connect, then re-run:

```bash
fastlane setup_capabilities
fastlane metadata
```

## 4) EAS submit configuration

Set `eas.json` submit values:

- `appleId`: your Apple ID email
- `ascAppId`: App Store Connect numeric app ID

Then build and submit:

```bash
npm run build:ios:prod
npm run submit:ios
```

## 5) Push notifications setup

The notifications service now resolves project ID in this order:

1. `Constants.easConfig.projectId`
2. `Constants.expoConfig.extra.eas.projectId`
3. `EXPO_PUBLIC_PROJECT_ID`

This means EAS builds should work without extra env setup, but for local/dev fallback add in `.env`:

```bash
EXPO_PUBLIC_PROJECT_ID=your-eas-project-id
```

Get your project ID:

```bash
eas project:info
```

## 6) Validate push end-to-end

1. Install dev build on physical device.
2. Grant notifications permission in app.
3. Confirm token registration logs no projectId warning.
4. Trigger a local notification from app flow.
5. Trigger remote push via Expo push API with returned token.

## 7) NPM shortcuts added

```bash
npm run setup:asc:create
npm run setup:asc:capabilities
npm run setup:fastlane:metadata
npm run build:ios:prod
npm run submit:ios
```
