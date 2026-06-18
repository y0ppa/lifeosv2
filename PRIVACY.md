# Privacy

This document describes what Brain actually does today, and what's planned
for Phase 2 (mobile + health data sync) so the gap is never ambiguous.

## What exists today (web, Phase 1)

- **Account**: email + password via Supabase Auth. You can sign up, sign in,
  sign out, reset your password, and delete your locally-stored demo data
  from Settings.
- **Data storage**: once you sign in, the Habits page reads/writes real rows
  in your own Supabase project, protected by Row Level Security — no other
  user (or LifeOS/Brain's no-RLS `anon` role) can read or write your rows.
  Every other page still runs on a local, sample-data demo mode until they're
  migrated in a follow-up pass (see `SYNC_ARCHITECTURE.md`).
- **Voice**: speech recognition/synthesis runs through your browser's own
  Web Speech API. Audio is not uploaded to Brain's servers — there's no
  server in the loop for voice at all today.
- **No health data is read yet.** There is no HealthKit or Health Connect
  integration running — that's Phase 2, mobile-only, and requires your
  explicit per-data-type permission grant before anything is read (see
  `IOS_HEALTHKIT_SETUP.md` / `ANDROID_HEALTH_CONNECT_SETUP.md`).
- **No calendar or email is read yet.** Google Calendar/Gmail integration is
  designed (schema exists: `calendar_events`, `email_insights`,
  `oauth_credentials`) but not built — see `GOOGLE_OAUTH_SETUP.md`.

## Principles that apply once Phase 2 features ship

- **Explicit, per-type consent.** Health permissions are requested one data
  type at a time (steps, sleep, heart rate, etc.), never as a single
  blanket "allow everything." A revoked permission is checked before every
  sync, not just at connect time.
- **Minimal AI exposure.** For Gmail, deterministic filtering (sender/subject
  pattern matching) runs first; only the minimal relevant snippet of a
  matched email is ever sent to an AI provider — never the full mailbox,
  never full message bodies by default.
- **Confirm before acting.** The assistant never deletes records, changes
  goals, reschedules events, sends/replies/archives/deletes email,
  disconnects an integration, or edits an application status without a
  visible Confirm / Cancel / Edit prompt first.
- **You can leave.** Every connected integration will expose Disconnect and
  "delete imported data" actions (already true today for the demo
  Integrations screen; will operate on real imported rows once a provider
  is actually connected).
- **Audit trail.** The `audit_logs` table (append-only, RLS-protected, your
  rows only) is the intended home for a record of consent grants, syncs,
  and data-changing actions, once those flows are built.

## Data export & deletion

- **Export**: Settings → "Export my data" downloads a JSON snapshot (today:
  of local demo state; once more pages migrate to Supabase, this will query
  your real rows across every table instead).
- **Delete**: Settings → "Delete account" clears local demo data today.
  Once Supabase Auth is the only path (no demo mode), this will need a
  server-side route using the service role key to actually delete the
  `auth.users` row (a user cannot delete their own `auth.users` row with
  only the anon key) — tracked as a Phase 2 item, not yet implemented.

## Questions this raises that only you can answer

- Whether/when to drop the localStorage demo-mode fallback entirely once
  Supabase becomes the only backend (affects the account-deletion flow above).
- Data retention period for `audit_logs` and `health_sync_jobs` once real
  data is flowing — not yet decided.
