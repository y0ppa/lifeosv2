# Sync architecture

Status: **design + schema are real and in place; the actual sync engine
(Phase 2, mobile) is not built yet.** This document describes how the
pieces that exist (`packages/database`'s schema) are meant to be driven by
code that doesn't exist yet, so Phase 2 has a concrete target instead of a
blank page.

## Why normalized tables instead of one JSON blob

The original prototype kept everything in a single `app_state` JSON object
in `localStorage`. That doesn't survive contact with: multiple data sources
per metric (HealthKit *and* manual entry *and* a future nutrition API all
reporting "calories"), idempotent re-imports, per-record source attribution,
or row-level security. Phase 1 replaced it with the tables in
`packages/database/supabase/migrations/0001_init_schema.sql`. The two
load-bearing ones for sync specifically:

- **`health_records`** — every individual imported reading, with full
  attribution (`provider`, `source_app`, `external_id`, `record_type`,
  `start_time`/`end_time`, `time_zone`, `unit`, `value`, `data_origin`,
  `imported_at`, `source_modified_at`, `raw`). This table is never
  overwritten by a rollup — it's the permanent record of "what did the
  source actually say."
- **`daily_health_summaries`** — cheap-to-query per-day rollups the Today
  screen actually reads, derived from `health_records` (derivation job is
  Phase 2 work).
- **`health_sync_jobs`** — one row per sync run (initial/incremental/manual),
  what the Sync Status screen reads: status, records imported/skipped,
  error, and a `cursor` jsonb column for resuming incremental sync per data
  type.
- **`health_connections`** / **`health_permissions`** — connection state and
  per-data-type grant state, independent of whether any sync has run yet.

## Idempotency (the actual mechanism, not just a promise)

`health_records` has `unique (user_id, provider, external_id)`. Every
HealthKit/Health Connect record adapter must supply a stable `external_id`
(both platforms provide one — HealthKit's `HKObject.uuid`, Health Connect's
`Record.metadata.id`). Re-running an import then becomes a plain
`upsert(..., { onConflict: 'user_id,provider,external_id' })` — re-importing
the same week never creates duplicates, by construction, not by convention.
`workouts`, `body_measurements`, `sleep_sessions`, and `nutrition_entries`
follow the identical pattern with their own `unique (user_id, source/provider, external_id)`
constraints.

## Planned sync job lifecycle (Phase 2)

1. **Initial historical import** — on first connecting a provider, request
   the platform's full available history per granted data type, paginated,
   writing a `health_sync_jobs` row with `job_type = 'initial_import'`.
2. **Incremental sync** — subsequent runs use each data type's last
   successful `cursor` (stored as jsonb on the job row, or simply "max
   `start_time` synced so far" per type) to request only new/changed
   records since then.
3. **Manual "Sync Now"** — same incremental code path, triggered by the
   user instead of a scheduler; the Sync Status screen shows live progress
   by polling (or subscribing to, via Supabase Realtime) the in-progress
   `health_sync_jobs` row.
4. **Retry with backoff** — a failed page/request retries with exponential
   backoff (e.g. 1s, 2s, 4s, 8s, capped, capped attempts); the job is marked
   `partial` if some data types succeeded and others didn't, `failed` only
   if nothing did, with `error` populated either way.
5. **Offline queue** — writes made while offline (e.g. a manually logged
   set in `workout-session`) queue locally (Expo's `AsyncStorage` or
   SQLite) and flush in order when connectivity returns; conflict handling
   on flush is "last write wins per field" for manual edits, but imported
   provider data always wins over a manual entry for the *same*
   `external_id` (manual entries don't have one, so this only applies to
   genuine re-imports).
6. **Revoked permission handling** — before each sync, re-check
   `health_permissions.granted` (refreshed from the OS permission state);
   skip and mark the job `partial` with a clear `error` per data type whose
   permission was revoked, rather than failing the whole job silently.
7. **Time zone handling** — `health_records.time_zone` and
   `sleep_sessions.time_zone` are stored per-record (not assumed from the
   user's current device), since a record imported from a trip shouldn't be
   reinterpreted in the user's current zone later.

## Background sync — what's actually possible (read this before assuming "real-time")

- **iOS**: `HKObserverQuery` + `enableBackgroundDelivery` can wake the app
  for new HealthKit data, but iOS still decides *when* to actually run that
  background execution — it is not real-time and is not guaranteed at any
  particular interval. Expo's background task APIs add another layer of
  OS scheduling on top of that.
- **Android**: Health Connect has no continuous background listener API for
  third-party apps; periodic sync must use `WorkManager`-style scheduled
  background work (via an Expo/Android background task), typically no more
  often than every 15 minutes, and the OS can defer or batch it further
  under battery optimization.
- **Both platforms**: background execution is suspended or heavily throttled
  under low battery, Low Power Mode / Battery Saver, or if the user has
  force-quit the app (iOS) / restricted background activity for the app
  (Android).
- **What this means concretely**: "Sync Now" (foreground, user-initiated) is
  the only sync path with a real guarantee. Background sync is a
  best-effort freshness improvement, not a substitute for it. The Sync
  Status screen must always show "last successful sync" so the user can see
  staleness rather than assuming silent real-time freshness.

## Not built yet

The entire sync engine described above is a design against the existing
schema — no mobile app, no HealthKit/Health Connect adapter, and no actual
job runner exist in this repo yet. Phase 2 implements this against
`apps/mobile` once it exists.
