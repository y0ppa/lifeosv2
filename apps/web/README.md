# apps/web — Brain dashboard

A voice-first personal dashboard for tracking workouts, nutrition, body
weight, habits, work/school, and job applications — with an original AI
assistant called **ARIA**. Plain HTML/CSS/JS, no build step.

## Running it

```bash
cd apps/web
python3 -m http.server 8080
# then visit http://localhost:8080
```

Or just open `index.html` directly — everything except auth/Supabase-backed
pages works without a server.

## Connecting Supabase (optional — runs in local demo mode without it)

```bash
cp assets/js/supabase-config.example.js assets/js/supabase-config.js
# edit supabase-config.js: paste your project URL + anon key
```

Without this file (or with the placeholder values still in it), every page
falls back to a local, sample-data demo mode backed by `localStorage` — you
can still click through the whole app, just nothing is saved server-side
and there's no real login. See the root `README.md` for what's actually
wired to Supabase today vs. still on localStorage.

## Pages

| File | Purpose | Backend |
|---|---|---|
| `login.html` / `reset-password.html` | Sign up, sign in, password reset | Supabase Auth |
| `index.html` | Command Center home — ARIA orb, daily briefing, progress metrics, weight trend, today's workout, habits, application pipeline, weekly analysis | localStorage demo |
| `workouts.html` | Training split, upcoming workout, templates, history, personal records, muscle-group volume, strength trend, exercise search | localStorage demo |
| `workout-session.html` | Active workout logger — timer, sets/reps/weight/RPE, rest timer, add exercise, complete workout | localStorage demo |
| `nutrition.html` | Calorie/macro rings, meal timeline, food search, barcode scan demo, saved meals, recipes, grocery list generator | localStorage demo |
| `habits.html` | Daily checklist, weekly completion grid, streaks, categories, habit detail with mood check-in | **Supabase** (`habits`, `habit_logs`) when signed in |
| `work.html` | Tasks, assignments, projects, calendar events, focus timer, time tracking, completed work | localStorage demo |
| `applications.html` | Kanban job-application pipeline (Saved → Offer/Rejected) with full application detail | localStorage demo |
| `insights.html` | Trend charts across nutrition, training, habits, and work with 7/30/90-day and custom ranges | localStorage demo |
| `assistant.html` | Chat interface with ARIA — suggested prompts, fact vs. suggestion labeling, data-source references, inline confirmation cards | localStorage demo |
| `voice-console.html` | Full-screen voice mode — large AI orb, live transcript, voice controls, recent commands, text fallback | localStorage demo |
| `integrations.html` | Connected services (Apple Health, Health Connect, Google Calendar, Gmail, USDA FDC, Open Food Facts, GitHub, Push) | localStorage demo |
| `settings.html` | Profile, goals, training schedule, assistant/voice settings, privacy, notifications, appearance, data export/reset, **sign out** | mixed |

## Architecture

```
assets/
  css/
    styles.css       — design tokens, layout, navigation, shared components
    jarvis-ui.css     — AI orb, voice console, boot sequence, chat, kanban
  js/
    supabase-config.js   — your project URL + anon key (gitignored; copy from .example)
    supabase-client.js   — creates the Supabase client, exposes Brain.Supabase
    auth.js               — sign up/in/out, session restore, password reset, page guard
    data.js               — sample data + localStorage-backed state (Brain.State) for pages not yet migrated
    charts.js              — lightweight canvas line/bar/ring charts (no dependency)
    assistant-orb.js       — canvas-based AI orb renderer with 8 visual states
    voice-assistant.js     — Web Speech API wrapper (recognition + synthesis)
    voice-commands.js      — natural-language command matching + demo responses
    sound-controller.js    — synthesized UI tones via Web Audio (no audio files)
    app.js                 — navigation injection, modals, toasts, theme, auth guard, habits
```

Every page (except `login.html`/`reset-password.html`) shares the same
chrome (sidebar, topbar, bottom nav, modals) injected at runtime by
`app.js`, which also runs the Supabase auth guard before rendering anything
— if Supabase is configured and there's no session, you're redirected to
`login.html`.

## Voice assistant (ARIA)

- Activate by clicking the central orb / mic button, the floating mic button on any page, the **Alt+Shift+A** shortcut, or by opening `voice-console.html` directly.
- Uses `SpeechRecognition` / `webkitSpeechRecognition` and `SpeechSynthesis` when available, with full feature detection — unsupported browsers automatically fall back to text input with a clear notice.
- Read-only questions ("How many calories do I have left?") answer immediately. Anything that changes data shows a **Confirm / Edit / Cancel** card before anything is saved.
- All microphone audio is processed locally by the browser's speech engine; nothing is uploaded.
