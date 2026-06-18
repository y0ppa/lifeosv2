# Google OAuth setup (Calendar + Gmail)

> **Status: explicitly deferred.** You chose to skip Google Calendar/Gmail
> for this pass rather than build against a Google Cloud project that
> doesn't exist yet. This document is the exact console + code setup for
> whenever you're ready — nothing here has been built.

## Why this needs a server route, not just client code

Google's OAuth refresh tokens must be stored server-side
(`oauth_credentials` table, RLS denies all client access — see
`SECURITY.md`) and never in browser `localStorage` or shipped to mobile, per
your explicit instruction. That means Calendar/Gmail can't be "just a
button in the web app" — it needs a minimal server route (`apps/api`,
doesn't exist yet) to handle the OAuth code exchange and hold the refresh
token.

## Google Cloud Console steps (manual, only you can do this)

1. Create a project at [console.cloud.google.com](https://console.cloud.google.com) (or reuse an existing one).
2. **APIs & Services → Library** → enable **Google Calendar API**, and
   **Gmail API** if you proceed with that integration too.
3. **APIs & Services → OAuth consent screen**:
   - User type: External (unless you have a Google Workspace org for Internal).
   - Scopes — request the **minimum** needed:
     - Calendar: `https://www.googleapis.com/auth/calendar.readonly` (read-only is enough for "reading calendar lists, reading upcoming events"; only add the read-write scope later if/when event create/update/delete actually ships, each gated by its own confirmation step).
     - Gmail: `https://www.googleapis.com/auth/gmail.metadata` for message metadata, adding `gmail.readonly` only if reading selected message bodies turns out to be necessary — never request full mailbox read/write.
   - While in "Testing" mode, add your own Google account as a test user — this avoids Google's verification review for personal use.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: Web application.
   - Authorized redirect URI: your server route, e.g. `https://your-vercel-domain.vercel.app/api/auth/google/callback`.
   - Save the **Client ID** and **Client Secret**.

## Environment variables (server-side only)

```bash
# apps/api/.env (gitignored; create apps/api/.env.example when that app exists)
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT_URI=https://your-vercel-domain.vercel.app/api/auth/google/callback
SUPABASE_SERVICE_ROLE_KEY=...   # server route uses this to write oauth_credentials; never expose to web/mobile
```

Add the same two Google values (minus the secret) to Vercel's project
environment variables when `apps/api` is deployed — the **client secret**
and **service role key** are configured only in Vercel's dashboard / env,
never committed.

## Planned flow

1. Web "Connect Google Calendar" button → redirects to Google's consent
   screen with the minimal scopes above.
2. Google redirects back to the server route with an auth code.
3. Server route exchanges the code for access + refresh tokens, writes them
   to `oauth_credentials` (service role key, bypasses RLS intentionally —
   this is the one legitimate server-side write path for that table) and
   updates `integrations` (provider = `google_calendar`, `connected = true`).
4. Subsequent calendar reads happen server-side (or via a short-lived token
   the server mints) — the refresh token itself never reaches the browser.
5. Creating, updating, or deleting an event requires the visible
   Confirm/Cancel/Edit prompt described in the main project brief before
   the server route is ever called for a write.

## Gmail-specific constraint

Per your instruction: deterministic filtering (sender domain, subject
keyword matching for things like "interview," "assignment due," application
status-update senders) runs first, entirely server-side. Only the minimal
matched snippet — not the full message, never the full mailbox — is passed
to an AI provider to classify/summarize into an `email_insights` row.

## Not built yet

No `apps/api`, no Google Cloud project, no OAuth code exists in this repo.
This document is what to follow once you decide to start this phase.
