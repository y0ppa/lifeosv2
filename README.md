# Brain

A personal health and productivity command center — web dashboard + (planned)
mobile app that syncs your phone's existing health, fitness, calendar, and
email data instead of asking you to re-enter it.

## Status: Phase 1 of a multi-phase build

This repo is mid-migration from a pure frontend prototype into a real
multi-platform product. Be precise about what that means right now:

| Piece | Status |
|---|---|
| Web dashboard (`apps/web`) | **Working.** Deployed on Vercel. Most pages still run on `localStorage` sample data; `habits.html` is the first page actually wired to Supabase, as a proven migration pattern. |
| Supabase auth (sign up/in/out, session, password reset) | **Working**, once you've connected a real Supabase project (see below). |
| Database schema (20+ tables, RLS) | **Written and ready to apply** — `packages/database/supabase/migrations/0001_init_schema.sql`. Not yet applied to a live project until you run it (see `packages/database/README.md`). |
| Mobile app (`apps/mobile`) | **Not started.** Phase 2. |
| Apple HealthKit / Android Health Connect | **Not started.** Designed in `IOS_HEALTHKIT_SETUP.md` / `ANDROID_HEALTH_CONNECT_SETUP.md`, no code yet. |
| Google Calendar / Gmail OAuth | **Not started — explicitly deferred** at your request. Designed in `GOOGLE_OAUTH_SETUP.md`. |
| Background sync engine | **Not started.** Designed in `SYNC_ARCHITECTURE.md` against the schema that does exist. |

If a section below sounds like it's describing something finished, check
this table again — several pieces here are "ready to build against," not
"built."

## Repo layout

```
apps/
  web/          — the dashboard (plain HTML/CSS/JS, ships today)
  mobile/       — React Native + Expo app (Phase 2, doesn't exist yet)
  api/          — server-side OAuth routes (Phase 2+, doesn't exist yet)
packages/
  shared/       — TypeScript types + constants used by mobile/api
  database/     — Supabase schema migrations + generated types
  integrations/ — HealthKit/Health Connect provider adapters (Phase 2, doesn't exist yet)
  assistant-tools/ — shared assistant tool-call contracts (Phase 2, doesn't exist yet)
```

`packages/integrations` and `packages/assistant-tools` are listed in the
target structure but intentionally not created yet — there's no value in
an empty package before the mobile app that would consume it exists.

## Quick start

```bash
npm install   # workspaces: apps/*, packages/*

# run the web dashboard
cd apps/web && python3 -m http.server 8080
```

To connect the web app to a real Supabase backend instead of local demo
data, see [`packages/database/README.md`](packages/database/README.md)
(apply the schema) and copy
[`apps/web/assets/js/supabase-config.example.js`](apps/web/assets/js/supabase-config.example.js)
to `supabase-config.js` with your project's URL + anon key.

Full command reference (mobile builds, EAS, Supabase CLI, Vercel deploy):
[`MOBILE_SETUP.md`](MOBILE_SETUP.md).

## Documentation index

- [`apps/web/README.md`](apps/web/README.md) — web dashboard pages, architecture, voice assistant
- [`packages/database/README.md`](packages/database/README.md) — applying the schema, generating types
- [`SYNC_ARCHITECTURE.md`](SYNC_ARCHITECTURE.md) — how health data sync is designed to work, and its real platform limitations
- [`SECURITY.md`](SECURITY.md) — key handling, RLS, what's not encrypted yet
- [`PRIVACY.md`](PRIVACY.md) — consent model, what's actually implemented vs. planned
- [`MOBILE_SETUP.md`](MOBILE_SETUP.md) — exact commands for installing, running, and building the mobile app
- [`IOS_HEALTHKIT_SETUP.md`](IOS_HEALTHKIT_SETUP.md) — HealthKit plan, Windows/Mac/Apple-account constraints
- [`ANDROID_HEALTH_CONNECT_SETUP.md`](ANDROID_HEALTH_CONNECT_SETUP.md) — Health Connect plan (buildable on Windows)
- [`GOOGLE_OAUTH_SETUP.md`](GOOGLE_OAUTH_SETUP.md) — Calendar/Gmail OAuth plan (deferred, not started)

## Why a monorepo for what's currently one static site

Because the mobile app and web app need to share the same Supabase project,
the same auth, and the same data types — `packages/shared` and
`packages/database` exist so that sharing happens through one source of
truth instead of copy-pasted constants drifting apart between platforms
later.
