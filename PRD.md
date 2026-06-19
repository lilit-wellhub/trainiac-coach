# Trainiac AI Coach — Product Requirements Document

**Version:** 1.2  
**Last Updated:** 2026-06-18  
**Parent Brand:** Wellhub  
**Audience:** Engineers, PMs, and designers onboarding to this project

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Users and Context](#2-users-and-context)
3. [User Journey](#3-user-journey)
4. [Feature List](#4-feature-list)
5. [Component Architecture](#5-component-architecture)
6. [Data Model](#6-data-model)
7. [Marker Protocol](#7-marker-protocol)
8. [Coaching Rules](#8-coaching-rules)
9. [Tech Stack and Infrastructure](#9-tech-stack-and-infrastructure)
10. [Known Constraints and Limitations](#10-known-constraints-and-limitations)

---

## 1. Product Vision

Trainiac AI Coach is a standalone progressive web app (PWA) built for Wellhub gym subscribers. It delivers a personalized AI coaching experience accessible from any device — no native app install required.

The core thesis: most gym members know they should work out consistently, but don't have access to a coach who understands their schedule, equipment, injury history, and progress over time. Trainiac fills that gap with an AI coach powered by Google Gemini 2.5 Flash that maintains context across sessions and adapts the weekly program based on how the member is actually doing.

### Goals

- Give every Wellhub subscriber access to a coach-quality experience at no additional cost
- Drive gym visit frequency and session quality through personalized programming
- Surface progress in a way that motivates continued engagement
- Work without a backend — all state is local, privacy is preserved

### Non-Goals

- This is not a general-purpose fitness app. Content stays within the coaching flow.
- This is not a social or community product. No sharing, leaderboards, or group features in v1.
- This does not replace human trainers for medical or rehabilitation needs.

---

## 2. Users and Context

**Primary user:** Wellhub gym subscribers who want structured, personalized programming without hiring a personal trainer.

**Usage context:** Mobile-first. Members check the app before or during a gym session, after a workout to log results, or on rest days to review their weekly plan.

**Assumed baseline:**
- Comfortable with chat interfaces
- Some gym familiarity (knows what sets, reps, and RPE mean or can learn quickly)
- Accesses Wellhub-affiliated gyms with variable equipment availability

---

## 3. User Journey

### First Visit — Onboarding (Phase 1)

The member opens the app and lands on the Train tab. The AI coach introduces itself and begins a six-question onboarding interview, one question at a time:

| # | Question |
|---|----------|
| 1 | Name |
| 2 | Primary goal (e.g., build muscle, lose fat, improve endurance) |
| 3 | Training days per week |
| 4 | Preferred session duration |
| 5 | Training location and available equipment |
| 6 | Injuries or physical constraints |

Once all six are answered, the coach emits `[ONBOARDING_COMPLETE]`, saves the member profile to localStorage, and advances to Phase 2.

### Returning Visit — Weekly Check-in (Phase 2)

At the start of each week (or on first return after onboarding), the coach runs a brief check-in:

- Rate of Perceived Exertion (RPE) for last week
- Number of sessions completed vs. planned
- Anything to flag (soreness, life changes, skipped exercises)

When check-in is done, the coach emits `[CHECKIN_COMPLETE]` and emits a `[WEEK_PLAN:...]` marker with the updated weekly program. Phase advances to 3.

### Active Training — Session Planning (Phase 3)

The member asks for today's session. The coach:

1. Delivers 2–3 sentences of reasoning (why this session, given their check-in data)
2. Emits `[PLAN_READY:...]` — the app parses this and renders a `WorkoutCard`

The member works through the session using the interactive WorkoutCard (set tracking, rest timers, GIFs). When done, the card emits a completion event that saves the session to workout history.

### Ongoing Interactions

- **Rest day validation:** Coach acknowledges rest days briefly, names the next training day, and stops — no workout card.
- **Activity logging:** Member mentions a non-gym activity (e.g., padel, cycling). Coach offers to log it. On confirmation, emits `[LOG_ACTIVITY:...]`.
- **Rescheduling:** Member mentions a missed session. Coach offers concrete future-day options and emits `[RESCHEDULE:...]` on confirmation.
- **Profile changes:** Member updates profile in the Profile tab. Training days, equipment, and injuries are reflected in future session plans.

---

## 4. Feature List

### 4.1 Chat Interface

| Feature | Description |
|---------|-------------|
| Conversational onboarding | Six-question interview, one question per turn |
| Markdown rendering | Coach messages support bold, bullet lists |
| Quick reply pills | Contextual suggestions after each coach message (7 context types) |
| Hidden triggers | `__plan_trigger__` and `__checkin_trigger__` sent programmatically, not shown in chat |
| Phase indicator | Three-step progress bar shown during phases 1 and 2 only |

### 4.2 Workout Card

| Feature | Description |
|---------|-------------|
| Exercise list | Renders all exercises from `[PLAN_READY]` marker |
| GIF player | Per-exercise animated GIF from GymVisual.com or local `/public/videos/` |
| Equipment banner | "You'll need:" strip derived from `equipmentLookup.js` |
| Set tracking | Checkbox per set (bodyweight/cardio); per-set weight + reps rows for weighted exercises |
| Per-set weight input | Weighted exercises (barbell, dumbbell, cable, etc.) show − / + adjusters for kg and reps per set |
| Weight carry-forward | Adjusting weight/reps propagates forward to all subsequent uncompleted sets |
| Progressive overload hint | If all sets hit target reps, inline hint suggests +2.5 kg for next session |
| Superset support | Exercises grouped as A+B with "Rounds" model (one button = one set of all in group) |
| Rest timer | Countdown between sets; intra-superset and inter-superset rest durations |
| Elapsed timer | Runs from first interaction, stops when all exercises are settled |
| Drag-to-reorder | Member can reorder exercises before starting |
| Completion event | Emits `{ exercises, doneCount, skippedCount, durationSeconds, setData }` on finish |

### 4.3 Weekly Program

| Feature | Description |
|---------|-------------|
| 7-day grid | Mon–Sun with focus label per day |
| Today highlight | Magenta border on current day |
| Missed chip | Amber "Missed" chip on past non-rest days with no logged session |
| Done chip | Green "Done" chip + expandable summary for completed days |
| New session overlay | If today is done but coach planned a new session, shows "New session planned" with "Start this session →" |
| Clickable days | Non-rest days expand to show exercise list |
| Ask Coach | `onAskCoach` prop switches to Train tab and pre-fills a message |

### 4.4 Workout History

| Feature | Description |
|---------|-------------|
| List view | Paginated, 5 entries per page. Shows date, time, X/Y done, duration |
| Calendar view | Monthly grid; navigate months. Days with sessions marked. Uses same `HistoryItem` as list view for consistency |
| Expandable entries | Tap a gym session to expand; shows exercise breakdown (one entry open at a time) |
| Per-set chips | Expanded view shows `60 kg × 8` chip per set for weighted exercises |
| Gym sessions | Show exercise breakdown with sets, reps, rest |
| Activity entries | Blue styling, Activity (Lucide) icon, name and duration. Activities do not expand |

### 4.5 Profile Editor

| Feature | Description |
|---------|-------------|
| Name | Editable text field |
| Goal | Single-select |
| Training days | Circular Mon–Sun picker (multi-select) |
| Equipment groups | Multi-select grouped by type |
| Injury pills | Multi-select tags; auto-saves on toggle. Supports custom user-created tags |
| Save feedback | Check icon + "Saved!" for 2 seconds, no navigation |

### 4.6 Progress Stats

Shown as a stats bar with three values:

- **Streak** — consecutive ISO weeks with at least one gym session
- **Sessions done** — total gym sessions logged
- **Goal** — label from member profile

---

## 5. Component Architecture

```
App.jsx                         ← Top-level orchestrator
├── PhaseIndicator.jsx          ← Onboarding progress (phases 1–2 only)
├── ChatWindow.jsx              ← Message bubbles, markdown rendering
│   └── QuickReplies.jsx        ← Contextual pill suggestions
├── WorkoutCard.jsx             ← Interactive session card
│   ├── GIF player              ← GymVisual.com URLs or /public/videos/
│   ├── Set tracker             ← Checkboxes per set per exercise
│   └── Rest timer              ← Countdown between sets
└── Bottom nav (3 tabs)
    ├── Train tab
    │   └── (ChatWindow + WorkoutCard)
    ├── Progress tab
    │   ├── ProgressCard.jsx    ← Streak, sessions, goal
    │   ├── WeekProgram.jsx     ← Weekly grid
    │   └── WorkoutHistory.jsx  ← List + calendar views
    └── Profile tab
        └── ProfileEditor.jsx   ← Editable member profile
```

### App.jsx Responsibilities

App.jsx is the single source of truth. It owns:

- `messages` — full chat history
- `phase` — current coaching phase (1, 2, or 3)
- `exercises` — parsed from last `[PLAN_READY]` marker
- `showWorkoutCard` — boolean, controls WorkoutCard visibility
- `activeTab` — which bottom tab is visible
- `programVersion` — integer, bumped on every `saveProgram()` call to force `WeekProgram` remount

All marker parsing happens in App.jsx. Markers are stripped from visible chat before rendering in ChatWindow.

### Data Flow

```
Gemini response text
        ↓
App.jsx marker parser
        ↓
┌──────────────────────────────────────────┐
│ [ONBOARDING_COMPLETE] → phase = 2        │
│ [CHECKIN_COMPLETE]    → phase = 3        │
│ [WEEK_PLAN:...]       → localStorage +   │
│                         programVersion++ │
│ [PLAN_READY:...]      → exercises state +│
│                         showWorkoutCard  │
│ [LOG_ACTIVITY:...]    → workout history  │
│ [RESCHEDULE:...]      → program update + │
│                         programVersion++ │
└──────────────────────────────────────────┘
        ↓
Stripped text → ChatWindow
```

---

## 6. Data Model

### 6.1 localStorage Keys

| Key | Type | Description |
|-----|------|-------------|
| `trainiac_member_profile` | Object | Member identity and training preferences |
| `trainiac_workout_history` | Array (max 50) | Log of all gym sessions and activities |
| `trainiac_program` | Object | Current weekly program |
| `trainiac_custom_injuries` | String[] | User-created injury tags |

### 6.2 Member Profile

```json
{
  "memberName": "string",
  "goal": "string",
  "trainingDays": ["Mon", "Wed", "Fri"],
  "equipment": "string",
  "injuries": ["string"],
  "equipmentItems": ["string"]
}
```

### 6.3 Weekly Program

```json
{
  "days": [
    {
      "day": "Mon",
      "focus": "Full Body Strength",
      "exercises": ["string"]
    }
  ],
  "updatedAt": "ISO 8601 timestamp",
  "goal": "string"
}
```

### 6.4 Workout History Entry — Gym Session

```json
{
  "id": "string",
  "completedAt": "ISO 8601 timestamp",
  "exercises": [
    {
      "name": "string",
      "status": "done | skipped",
      "sets": 3,
      "reps": 8,
      "setData": [
        { "weight": 60, "repsCompleted": 8, "done": true }
      ]
    }
  ],
  "doneCount": 5,
  "skippedCount": 1,
  "durationSeconds": 3240,
  "memberName": "string"
}
```

`setData` is present only for weighted exercises (barbell, dumbbell, cable, machine, etc.). `weight` is in kg. Bodyweight and cardio exercises omit `setData` and use plain checkbox tracking.

### 6.5 Workout History Entry — Activity Log

```json
{
  "id": "string",
  "type": "activity",
  "activityName": "Padel",
  "completedAt": "ISO 8601 timestamp",
  "durationSeconds": 3600,
  "exercises": [{ "name": "Padel", "status": "done" }],
  "doneCount": 1
}
```

### 6.6 Streak Calculation Rules

- Unit: ISO week (Monday–Sunday)
- Direction: backwards from current week
- Break condition: any week with zero gym sessions
- Activity entries do NOT count toward streak
- If no sessions logged in the current week, streak extends from last week's count

---

## 7. Marker Protocol

Markers are embedded in Gemini's text response. App.jsx parses them with regex, acts on each, and strips them before passing text to ChatWindow. Multiple markers can appear in a single response.

### 7.1 Marker Definitions

#### `[ONBOARDING_COMPLETE]`

- **Trigger:** Emitted by coach after all six onboarding questions are answered
- **Effect:** `phase` → 2

#### `[CHECKIN_COMPLETE]`

- **Trigger:** Emitted by coach after check-in conversation concludes
- **Effect:** `phase` → 3

#### `[WEEK_PLAN:Mon=Full Body Strength|Wed=Upper Body|Fri=Rest]`

- **Format:** `[WEEK_PLAN:Day=FocusLabel|Day=FocusLabel|...]`
- **Effect:** Saves to `trainiac_program`, increments `programVersion` to force WeekProgram remount

#### `[PLAN_READY:ExName::3x8::90|ExA+ExB::3x12::20::90]`

- **Effect:** Populates `exercises`, sets `showWorkoutCard = true`
- **Standalone exercise format:** `ExerciseName::SetsxReps::RestSeconds`
- **Superset format:** `ExA+ExB::SetsxReps::IntraRestSeconds::InterRestSeconds`
  - `IntraRest` — rest between exercises within one round of the superset
  - `InterRest` — rest between completed rounds of the superset

#### `[LOG_ACTIVITY:ActivityName|YYYY-MM-DD|DurationMinutes]`

- **Effect:** Calls `saveActivity()`, appends to `trainiac_workout_history`
- **Multiple per message:** Supported. Each marker creates a separate history entry.
- **Never merged:** Each activity gets its own entry even if emitted in the same message.

#### `[RESCHEDULE:Mon>Sat|Full Body Strength]`

- **Format:** `[RESCHEDULE:FromDay>ToDay|FocusLabel]`
- **Effect:** Moves the workout in `trainiac_program` from `FromDay` to `ToDay`, increments `programVersion`
- **Constraint:** `ToDay` must be a future day. Never today or past.

### 7.2 Hidden Triggers (Not Shown in Chat)

| Trigger | When Sent | Effect |
|---------|-----------|--------|
| `__plan_trigger__` | App sends programmatically when member is in phase 3 and ready | Coach immediately delivers today's session plan |
| `__checkin_trigger__` | App sends at start of new week | Coach immediately starts check-in |

---

## 8. Coaching Rules

### Onboarding

- Ask exactly one question per turn
- Do not skip or combine questions
- Emit `[ONBOARDING_COMPLETE]` only after all six are answered

### Check-in

- Cover RPE, sessions completed, and flagged items
- Keep it brief — this is not a second onboarding
- Emit `[CHECKIN_COMPLETE]` and a `[WEEK_PLAN:...]` marker together

### Session Planning

- Always begin with 2–3 sentences of reasoning before the workout
- Emit `[PLAN_READY:...]` for today's session only
- Future-day requests do NOT trigger `[PLAN_READY]` — describe the plan in prose instead

### Session Naming

- Every workout plan must have a name (e.g. "Full Body Foundation", "Upper Push Day") — never just list exercises in the chat
- The session name appears in `[PLAN_READY]` and is the first thing the coach announces
- Coach never enumerates exercises in the conversational turn; the WorkoutCard does that

### Multiple Sessions Per Day

- A member may complete more than one session on the same day. This is valid and expected.
- `getTodayWorkouts()` returns an array (not a single entry); the system prompt and WeekProgram handle the multi-session case
- The coach acknowledges previous sessions for the day and asks whether the member wants to add more or recover

### Rest Days

- Validate briefly ("Good call, recovery matters")
- Name the next scheduled training day
- Stop — do not offer a workout or ask "want a light session?"
- If member says "Let's go!" on a rest day, coach asks for clarification before doing anything

### Activity Logging

- Offer to log once per activity mention
- If member changes topic, drop the offer — do not repeat
- On confirmation, emit one `[LOG_ACTIVITY:...]` per activity, never merged into one

### Rescheduling

- Offer concrete future-day options, including today (a missed session may be moved to the current day)
- Emit `[RESCHEDULE:...]` only after member explicitly confirms a day
- Do NOT emit `[PLAN_READY]` for rescheduled future-day sessions

### Quick Reply Context Priority

QuickReplies.jsx detects context from the last coach message (lowercase content scan) and shows relevant pills. Priority order:

| Priority | Context Type | Example Pills |
|----------|-------------|---------------|
| 1 | `confirm_log` | "Yes, log it", "Skip this time" |
| 2 | `confirm_reschedule` | "Move to Thursday", "Keep it as is" |
| 3 | `confirm_generic` | "Yes", "No thanks" |
| 4 | `checkin` | "RPE 7", "Completed all sessions" |
| 5 | `adjustment` | "Felt too easy", "Need shorter rest" |
| 6 | `plan_ready` | "Start session", "Show me the plan" |
| 7 | `general` | "What's today's session?", "How am I doing?" |

---

## 9. Tech Stack and Infrastructure

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | React 18 + Vite | PWA-ready with Vite plugin |
| AI backend | Google Gemini 2.5 Flash | Called via `geminiChat(systemPrompt, messages)` in `gemini.js` |
| Icons | Lucide React | No emojis anywhere in the UI |
| Persistence | localStorage only | No backend, no authentication |
| Styling | CSS custom properties | Wellhub brand tokens applied globally |
| GIF assets | GymVisual.com CDN + local `/public/videos/*.gif` | Local files take priority |
| Equipment data | `equipmentLookup.js` — `EQUIPMENT_MAP` | 80+ exercises mapped to equipment arrays |
| GIF data | `videoLibrary.js` — `GIF_LIBRARY` | 80+ exercises mapped to GymVisual.com URLs |

### Brand Tokens

```css
--wh-primary: #F2496B;       /* Wellhub magenta — CTAs, active states */
--wh-purple-dark: #1B1340;   /* Dark background — WorkoutCard, nav bar */
```

### Gemini Integration

`gemini.js` exports `geminiChat(systemPrompt, messages)`. The system prompt encodes all coaching rules, marker syntax, and member profile context. Messages array contains the full conversation history. Hidden triggers are injected as user messages before calling `geminiChat`.

### Asset Matching Logic

Both `getVideoUrl(name)` and `getEquipment(name)` use **longest-key-first partial matching**:

1. Sort all keys by length descending
2. Return the first key that the exercise name includes (case-insensitive)
3. This ensures "Barbell Back Squat" matches "Barbell Back Squat" before "Squat"

---

## 10. Known Constraints and Limitations

| Constraint | Details |
|------------|---------|
| No backend | All data is localStorage-only. Clearing browser storage erases all progress. No cross-device sync. |
| localStorage cap | History capped at 50 entries to avoid storage quota issues. Oldest entries are dropped. |
| Gemini latency | Gemini 2.5 Flash has variable latency. Long chat histories increase token count and response time. |
| No offline AI | AI coaching requires an active internet connection. WorkoutCard (once rendered) works offline. |
| Marker parsing fragility | Markers must be well-formed. A malformed `[PLAN_READY]` will silently fail to render WorkoutCard. Gemini occasionally deviates from format — the system prompt must be explicit. |
| No user authentication | Any person with access to the device can see the member's data. Not suitable for shared devices. |
| GymVisual.com dependency | GIF loading depends on an external CDN. If GymVisual is unreachable, exercises show without animation. |
| Future-day plan restriction | Requesting a plan for a non-today day will not produce a WorkoutCard by design. This is a coaching rule, not a bug. |
| Single active program | Only one weekly program is stored. Requesting a new plan overwrites the previous one. |
| Custom injuries | User-created injury tags are stored separately in `trainiac_custom_injuries` and must be merged with preset tags in ProfileEditor. |
| Streak only counts gym sessions | Logged activities (padel, cycling, etc.) do not count toward the weekly streak calculation. |
| No smartwatch/wearable sync | Fitness data from wearables (heart rate, GPS runs) is not ingested. Deferred — see Backlog. |
| Vercel auto-deploy | The Vercel ↔ GitHub integration may require periodic reconnection when the OAuth token expires. If pushes stop triggering deployments, reconnect in Vercel dashboard → Settings → Git. |

---

## 11. Backlog

Features discussed and scoped but not yet built. Each item is a candidate for the next sprint.

| Item | Priority | Notes |
|------|----------|-------|
| Smartwatch / fitness file sync | Medium | Import `.fit` / `.gpx` files (universal). Add Web Bluetooth for Android/Chrome as enhancement. iOS Apple Health requires native wrapper — longer term. |
| Goal milestone tracking | Medium | "You're 60% to your strength goal" — requires progress calculation against onboarding goal |
| Push notifications | Medium | Remind member of scheduled sessions. Needs Service Worker + Notification API. |
| Backend + user accounts | Low | Currently localStorage only. Cross-device sync requires auth + database. |
| Wellhub SSO integration | Low | Would tie Trainiac identity to the member's Wellhub account |
| Partner gym check-in feed | Low | Check-ins from partner gyms feed into coaching context (e.g. "you went to gym but didn't log a session") |

---

*This document reflects the v1.2 state of Trainiac AI Coach as of 2026-06-18. For questions about the AI coaching logic, see the system prompt in `buildSystemPrompt.js`. For component-level implementation details, see inline comments in the component files.*
