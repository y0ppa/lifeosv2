# apps/mobile — Brain mobile app

React Native + Expo (SDK 56, Expo Router, TypeScript). Phase 2 of the
project — the real-data connected app, no localStorage demo mode.

## Status

| Piece | Status |
|---|---|
| Auth (sign up/in/out, session persistence) | **Working** against the same Supabase project as `apps/web`. |
| Habits screen (list, create, toggle, streaks) | **Working** — reads/writes the live `habits`/`habit_logs` tables, RLS-scoped to the signed-in user. |
| Home / Settings screens | Working, minimal — placeholders until the rest of the dashboard is ported. |
| Apple HealthKit / Android Health Connect | **Not started.** See `IOS_HEALTHKIT_SETUP.md` / `ANDROID_HEALTH_CONNECT_SETUP.md` at the repo root. |
| Push notifications, background sync | **Not started.** See `SYNC_ARCHITECTURE.md`. |

## Running it

```bash
cd apps/mobile
cp .env.example .env   # paste your Supabase project URL + anon key
npm install             # or run `npm install` at the repo root (npm workspaces)
npx expo start
```

Scan the QR code with the **Expo Go** app (iOS or Android) on a physical
device on the same network, or press `a` to attempt an Android emulator if
you have Android Studio installed. No Apple Developer account or Mac is
needed for this — Expo Go runs the JS bundle directly, no native build step.

`npm run web` also works (`expo start --web`) and is useful for quick
iteration without a phone, though the real target platforms are iOS and
Android.

## Why no localStorage demo mode here

`apps/web` falls back to local sample data when Supabase isn't configured,
so the marketing/demo site keeps working without a backend. The mobile app
has no equivalent use case — it's installed by an actual user with an
actual account, so it just shows a clear "not configured" screen instead
(see `src/app/login.tsx`) if `.env` is missing.

## Architecture

```
src/
  app/
    _layout.tsx        — root layout: AuthProvider + auth gate (redirects to /login)
    login.tsx           — sign in / sign up
    (tabs)/
      _layout.tsx        — bottom tab navigator
      index.tsx           — Home placeholder
      habits.tsx           — Supabase-backed habits screen
      settings.tsx          — account info + sign out
  lib/
    supabase.ts         — Supabase client (AsyncStorage-backed session persistence)
    auth-context.tsx     — session state, signIn/signUp/signOut
  components/            — themed-text/themed-view primitives (from the Expo template)
  constants/theme.ts      — light/dark color tokens
```

Session persistence uses `@react-native-async-storage/async-storage` (the
Supabase-recommended storage adapter for React Native), not `localStorage`
— there is no `localStorage` outside a browser.

## Environment variables

`EXPO_PUBLIC_*` variables are inlined into the JS bundle at build time —
same trust model as the anon key on web (see `SECURITY.md`): the anon key
is meant to be public, real access control is Row Level Security. Never
prefix the `service_role` key with `EXPO_PUBLIC_`.
