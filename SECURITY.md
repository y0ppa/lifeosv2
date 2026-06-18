# Security

## Key handling

| Key | Where it lives | Safe to expose client-side? |
|---|---|---|
| Supabase **anon/public** key | `apps/web/assets/js/supabase-config.js`, committed | Yes — by design. Security comes from RLS, not key secrecy. |
| Supabase **service role** key | Never in this repo. Only in a server environment's env vars (future `apps/api`), never `apps/web` or `apps/mobile`. | **No.** Bypasses RLS entirely. |
| Google OAuth client secret | Future server env var only | No |
| `oauth_credentials.access_token` / `refresh_token` | Postgres, RLS denies all client roles | No — server (service role) only, and should be encrypted at rest via [Supabase Vault](https://supabase.com/docs/guides/database/vault) before production use. Phase 1 stores them as plain `text` columns with RLS as the only safeguard; encrypting them is a tracked follow-up before any real OAuth tokens are stored. |

Rule of thumb used throughout this repo: if a value lets you bypass Row Level
Security or act as another user, it is a secret and stays server-side. If it
only works within what RLS already allows, it's fine in client code.

## Row Level Security

Every user-owned table created in `packages/database/supabase/migrations/0001_init_schema.sql`:

- Has RLS **enabled**.
- Has `select` / `insert` / `update` / `delete` policies scoped to `auth.uid() = user_id` (or `= id` for `profiles`) — never an unrestricted `anon` policy.
- Two intentional exceptions:
  - `oauth_credentials` has RLS enabled but **no policies at all**, so every client role is denied by default. Only the service role (which bypasses RLS) can touch it — and only a trusted server route should hold that key.
  - `audit_logs` allows `select`/`insert` of your own rows but has no `update`/`delete` policy, making it append-only from the client.

Verify this yourself any time: Supabase Dashboard → Authentication → Policies, or `select * from pg_policies where schemaname = 'public';` in the SQL editor.

## Secrets in git

- `.env*` is git-ignored (`.env.example` is the only tracked variant).
- `supabase-config.js` is **not** secret (see table above) and is committed; `supabase-config.example.js` is the template.
- Before any commit that touches OAuth/server code, double-check no `service_role` key, OAuth client secret, or raw access/refresh token is in the diff.

## Microphone / voice privacy

- The mic is only ever active during an explicit listening session the user started (tap, click, or shortcut) — never silently.
- A visible state indicator (the orb + state label) is shown whenever the mic is on, on every page that exposes voice.
- Settings → Privacy & Voice History lets a user fully disable voice, and delete stored conversation history.
- All speech-to-text/text-to-speech happens via the browser's own Web Speech API today — no audio is sent to a third-party server by this app. (Phase 2 native HealthKit/Health Connect work does not change this.)

## What's NOT implemented yet (be honest about it)

- Token encryption at rest (Vault) for `oauth_credentials` — schema/RLS is ready, encryption isn't wired up yet since no OAuth integration writes to this table yet.
- Rate limiting / abuse protection on any future server routes (`apps/api` doesn't exist yet).
- Dependency/secret scanning in CI — there is no CI configured yet.
