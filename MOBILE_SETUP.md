# Mobile setup

> **Status: Phase 2, shell working.** `apps/mobile` exists and runs: sign
> up/in/out and a live Supabase-backed Habits screen, verified end-to-end.
> It currently uses only JS/React Native APIs (no custom native modules
> yet), so it runs in plain **Expo Go** — no development build, no Android
> Studio, no EAS account needed for any of this. That changes once
> HealthKit/Health Connect are added (see the callout below).

## Prerequisites

| Requirement | Needed for |
|---|---|
| Node.js >= 20, npm | Everything |
| [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npx expo`, no global install needed) | Mobile app |
| A phone with the **Expo Go** app installed (iOS or Android) | Running the app today — this is all you need right now |
| **Android**: Android Studio + an emulator | Only needed later for native dev builds (HealthKit/Health Connect) or if you don't have a physical device |
| **iOS**: a Mac (or [EAS cloud builds](https://docs.expo.dev/build/introduction/)) + an Apple Developer Program membership ($99/yr) | Only needed once native iOS dev/production builds start — **cannot be fully done on Windows**, see callout below. Not needed for Expo Go. |
| Supabase project (already set up, schema applied) | Auth + data for both platforms |
| Expo account (free) | EAS builds only (not needed for Expo Go) |

### Windows-specific limitation (read this first)

This machine is Windows. That means:

- **Android development works fully on Windows** — Android Studio, the
  emulator, and `expo run:android` all run natively here.
- **iOS does not.** Compiling and running an actual iOS app requires Xcode,
  which only runs on macOS. On Windows you can still: write all the
  HealthKit integration code, configure `app.json`/`eas.json` for iOS, and
  trigger an iOS build — but the actual build executes on Expo's macOS
  cloud build infrastructure (EAS Build), not this machine. You will still
  need an Apple Developer account to sign that build, and a physical iPhone
  (or TestFlight) to install and test it, since the iOS Simulator only runs
  on a Mac too.

## Install dependencies

```bash
# from the repo root
npm install
```

(npm workspaces means one install at the root covers `apps/web`,
`apps/mobile`, and every `packages/*`.)

## Run the web dashboard locally

```bash
# from the repo root
npx serve apps/web
# or, with no dependency at all:
cd apps/web && python3 -m http.server 8080
```

## Run the mobile app today (Expo Go — no native build needed)

```bash
cd apps/mobile
cp .env.example .env    # paste your Supabase project URL + anon key
npm install              # if you didn't already run it at the repo root
npx expo start
```

Scan the printed QR code with the **Expo Go** app on a physical iPhone or
Android phone — that's the whole setup, no Mac, no Android Studio, no
Apple/Google developer account. Press `w` in the terminal to instead open
it in a browser (useful for quick iteration, not a real test of native
behavior).

## Once HealthKit / Health Connect are added (not yet — see below)

Native HealthKit/Health Connect modules will require a **development
build** instead of plain Expo Go, since Expo Go can't load custom native
modules:

```bash
cd apps/mobile
npx expo install                      # installs Expo-managed native deps
eas build --profile development --platform android   # or: npx expo run:android (local, faster iteration)
```

Once installed on a device/emulator:

```bash
npx expo start --dev-client
```

## Build for Android

```bash
cd apps/mobile
eas build --platform android --profile preview     # internal testing APK/AAB
eas build --platform android --profile production   # Play Store release
```

## Build for iOS (requires Apple Developer account + EAS cloud, even from Windows)

```bash
cd apps/mobile
eas build --platform ios --profile preview
```

EAS will prompt for Apple credentials the first time (or use
`eas credentials` to manage them ahead of time) and run the actual compile
on Expo's macOS infrastructure. You cannot run this build's output in a
simulator from Windows — install it on a physical iPhone via the link EAS
prints, or distribute through TestFlight.

## Configure Supabase (same project as web — see also `packages/database/README.md`)

```bash
# one-time, from repo root
npx supabase login
npx supabase link --project-ref <your-project-ref>
npm run gen-types --workspace packages/database
```

Then add the project URL + anon key to `apps/mobile`'s env (Expo uses
`EXPO_PUBLIC_`-prefixed vars, readable at build time):

```bash
cp apps/mobile/.env.example apps/mobile/.env
# apps/mobile/.env (gitignored)
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

## Configure Google OAuth

See `GOOGLE_OAUTH_SETUP.md` — not started in this repo (explicitly deferred
in Phase 1 at your request).

## Testing on a physical phone

- **Android**: enable Developer Options → USB debugging, connect via USB,
  `npx expo run:android --device`. Or install the EAS `preview` build's APK
  directly.
- **iOS**: requires the device's UDID registered to the Apple Developer
  account (`eas device:create`) before an ad-hoc/preview build will install,
  or use TestFlight for a smoother flow.

## Deploying updated server routes to Vercel

There is no `apps/api` yet (Phase 2+, needed once Google Calendar/Gmail
OAuth server routes are built). Once it exists:

```bash
npx vercel link        # one-time, links this directory to the Vercel project
npx vercel deploy --prod
```

The web dashboard (`apps/web`) already deploys today via the existing
linked Vercel project (see root `vercel.json`'s `outputDirectory`) — no
mobile-specific deploy step is needed for it.
