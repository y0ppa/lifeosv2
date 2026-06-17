# Brain — Command Center

A futuristic, voice-first personal dashboard for tracking workouts, nutrition, body weight, habits, work/school, and job applications — with an original AI assistant called **ARIA** (Adaptive Routine and Intelligence Assistant).

This is a static, client-only prototype: plain HTML, CSS, and JavaScript with no build step and no required backend. All data is realistic **sample data** and is persisted to your browser's `localStorage` so interactions survive a reload.

## Running it

Either works:

1. **Open directly** — double-click [index.html](index.html). Everything runs client-side.
2. **Local server** (recommended, needed for the most consistent behavior across browsers):
   ```bash
   python3 -m http.server 8080
   # then visit http://localhost:8080
   ```

No npm install, no build tools, no external services required. An internet connection is only used to load Google Fonts (Barlow Condensed, Inter, JetBrains Mono); everything still works offline with system font fallbacks.

## Pages

| File | Purpose |
|---|---|
| `index.html` | Command Center home — ARIA orb, daily briefing, progress metrics, weight trend, today's workout, habits, application pipeline, weekly analysis |
| `workouts.html` | Training split, upcoming workout, templates, history, personal records, muscle-group volume, strength trend, exercise search |
| `workout-session.html` | Active workout logger — timer, sets/reps/weight/RPE, rest timer, add exercise, complete workout |
| `nutrition.html` | Calorie/macro rings, meal timeline, food search, barcode scan demo, saved meals, recipes, grocery list generator |
| `habits.html` | Daily checklist, weekly completion grid, streaks, categories, habit detail with mood check-in |
| `work.html` | Tasks, assignments, projects, calendar events, focus timer, time tracking, completed work |
| `applications.html` | Kanban job-application pipeline (Saved → Offer/Rejected) with full application detail |
| `insights.html` | Trend charts across nutrition, training, habits, and work with 7/30/90-day and custom ranges |
| `assistant.html` | Chat interface with ARIA — suggested prompts, fact vs. suggestion labeling, data-source references, inline confirmation cards |
| `voice-console.html` | Full-screen voice mode — large AI orb, live transcript, voice controls, recent commands, text fallback |
| `integrations.html` | Connected services (Apple Health, Health Connect, Google Calendar, Gmail, USDA FDC, Open Food Facts, GitHub, Push) |
| `settings.html` | Profile, goals, training schedule, assistant/voice settings, privacy, notifications, appearance, data export/reset |

## Architecture

```
assets/
  css/
    styles.css      — design tokens, layout, navigation, shared components
    jarvis-ui.css    — AI orb, voice console, boot sequence, chat, kanban
  js/
    data.js          — sample data + localStorage-backed state (Brain.State)
    charts.js         — lightweight canvas line/bar/ring charts (no dependency)
    assistant-orb.js  — canvas-based AI orb renderer with 8 visual states
    voice-assistant.js— Web Speech API wrapper (recognition + synthesis)
    voice-commands.js — natural-language command matching + demo responses
    sound-controller.js — synthesized UI tones via Web Audio (no audio files)
    app.js            — navigation injection, modals, toasts, theme, habits
```

Every page shares the same chrome (sidebar, topbar, bottom nav, modals) injected at runtime by `app.js`, so there is a single source of truth for navigation and shared widgets. Page-specific rendering lives in a small inline `<script>` at the bottom of each HTML file and reads/writes through `Brain.State`.

## Voice assistant (ARIA)

- Activate by clicking the central orb / mic button, the floating mic button on any page, the **Alt+Shift+A** shortcut, or by opening `voice-console.html` directly.
- Uses `SpeechRecognition` / `webkitSpeechRecognition` and `SpeechSynthesis` when available, with full feature detection — unsupported browsers automatically fall back to text input with a clear notice.
- Read-only questions ("How many calories do I have left?") answer immediately. Anything that changes data — rescheduling a workout, editing an application status, changing goals, disconnecting an integration, deleting records — shows a **Confirm / Edit / Cancel** card before anything is saved.
- All microphone audio is processed locally by the browser's speech engine; nothing is uploaded. The mic only activates while listening, with a visible state indicator at all times, a one-click disable, and a full voice-history delete option in Settings.
- Interface sounds are synthesized locally with the Web Audio API (no bundled audio files), off by default, with a master toggle and volume control in Settings.

## Notes on scope

- This is a frontend prototype: there is no real backend, login, or live integration — "Connect" buttons on the Integrations page simulate a connection so the UI is fully interactive.
- Chart data and the 30-day/12-week trend series are deterministically generated sample data (seeded, so values stay consistent across reloads unless you interact with them) — clearly framed as **sample data**, not real records.
- Barcode scanning requests real camera access for the live preview but does not include a barcode-decoding library; use "Simulate scan result" to see the logging flow end to end.
