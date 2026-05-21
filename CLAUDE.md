# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Gen Hoot** is a real-time Kahoot-style quiz experience built with React + Firebase. A host projects questions on screen and controls the pace; players join by scanning a QR code, register with name + email, and answer questions on their phones. Scoring is Kahoot-style: correct + fast = more points. UI is in Spanish.

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # Production build
npm run lint      # ESLint check
npm run preview   # Preview production build
```

No test suite is configured. Copy `.env.example` → `.env` and fill in Firebase credentials before running.

## Architecture

### URL Structure (two separate flows)

| Path | View |
|------|------|
| `/` | Landing — QR code + navigation |
| `/host` | Admin/projected screen — create session, control quiz |
| `/join` | Player screen — register, wait, answer questions |
| `/join?code=XXXXX` | Player screen with session code pre-filled |

Each of `/host` and `/join` gets its own `SessionProvider` instance so host and player contexts don't interfere.

### Data Flow

```
Firebase Realtime DB ── src/firebase.js (all DB operations)
                              │
                    src/SessionContext.jsx (React Context + subscriptions + derived state)
                              │
                    src/App.jsx (BrowserRouter → HostRouter / PlayerRouter)
                              │
                   Host or Player screen components (one per game phase)
```

- **`src/firebase.js`** — all Firebase reads/writes. Credentials via `VITE_*` env vars. Contains quiz lifecycle logic: session creation, answer scoring, phase transitions.
- **`src/SessionContext.jsx`** — `SessionProvider` wraps each route subtree, subscribes to Firebase, computes all derived state. `useSession()` is the only way components access session data.
- **`src/App.jsx`** — two phase-driven routers. `HostRouter` switches on `phase` (or `!sessionCode` for setup). `PlayerRouter` switches on `phase` (or `!playerId` for registration).

### Game Phases → Components

**Host** (`src/components/host/`):

| Phase | Component |
|-------|-----------|
| no session | `HostSetupScreen` — create session, edit questions |
| `lobby` | `HostLobbyScreen` — QR code, player list, start button |
| `showing-question` | `HostQuestionScreen` — projected question + timer + live count |
| `question-results` | `HostAnswerResultScreen` — correct answer reveal + bar chart |
| `leaderboard` / `finished` | `HostLeaderboardScreen` — ranking + podium |

**Player** (`src/components/player/`):

| Phase | Component |
|-------|-----------|
| no player ID | `RegistrationScreen` — name + email + session code |
| `lobby` | `WaitingScreen` — waiting room |
| `showing-question` | `QuestionScreen` — A/B/C/D buttons + timer |
| `question-results` | `AnswerResultScreen` — correct/wrong feedback + mini-leaderboard |
| `leaderboard` / `finished` | `LeaderboardScreen` — full ranking |

### Firebase Data Structure

```
sessions/{code}/
  code, hostId, hostName, phase, currentQuestionIndex, questionStartedAt, createdAt
  questions/
    "0": { text, options[4], correctIndex, timeLimit, points }
    "1": ...  (string-keyed object, not array)
  players/
    {playerId}: { name, email, score, connected, joinedAt }
  answers/
    "{questionIndex}"/
      {playerId}: { answerIndex, answeredAt, isCorrect, pointsEarned }
```

**Phases:** `lobby → showing-question → question-results → leaderboard → [next or finished]`

### Key Conventions

- All Firebase writes go through functions in `src/firebase.js` — never write to Firebase from components.
- `useSession()` is the only way to access session state from components.
- `questionStartedAt` is stored as `Date.now()` (not `serverTimestamp()`); the scoring formula relies on client-side arithmetic.
- Questions are stored as string-keyed objects (`{ "0": q, "1": q }`) to avoid Firebase array conversion behavior.
- `submitAnswer` is idempotent — checks for existing answer before writing to prevent double-submission.
- Session state is persisted in `sessionStorage` (keys: `quiz-code`, `quiz-playerId`, `quiz-isHost`, `quiz-hostId`) so page refreshes don't lose context.

### Scoring Formula

```js
// Correct + fast = more points. Wrong or timed out = 0.
const elapsedSeconds = (Date.now() - questionStartedAt) / 1000;
const pointsEarned = isCorrect
  ? Math.round(points * (0.5 + 0.5 * Math.max(0, timeLimit - elapsedSeconds) / timeLimit))
  : 0;
// Min if correct (last second): points * 0.5
// Max if correct (immediately): points
```

### Default Questions

`src/defaultQuestions.js` exports a 7-question preset loaded into `HostSetupScreen`. Questions can be edited/added/reordered in the host UI before creating a session.

## Styling

Tailwind CSS 4 via Vite plugin. Custom tokens and reusable classes defined in `src/index.css`:

- **Core classes**: `.glass-card`, `.glass-card-glow`, `.btn-primary`, `.btn-secondary`, `.input-field`, `.badge`, `.player-avatar`, `.timer-ring`
- **Kahoot answer buttons**: `.answer-btn-a` (red) `.answer-btn-b` (blue) `.answer-btn-c` (amber) `.answer-btn-d` (green) — `.answer-btn-selected`, `.answer-btn-correct`, `.answer-btn-wrong`
- **Leaderboard**: `.rank-gold`, `.rank-silver`, `.rank-bronze`
- **Misc**: `.qr-container`, `.answer-bar`, `.timer-urgent`
- **Animations**: `float`, `pulse-glow`, `slide-up`, `confetti-fall`, `timer-urgent`
- **Color palette**: Purple primary (`#7c3aed`), Amber secondary (`#f59e0b`), Pink accent (`#ec4899`)

## Tech Stack

- React 19 + Vite 8
- Firebase Realtime Database (not Firestore) — project `gen-experiencias`
- Framer Motion 12 (page transitions, timer ring, staggered lists)
- React Router DOM 7
- Tailwind CSS 4
- react-qr-code (QR generation)
- ESLint 9 flat config — `varsIgnorePattern: '^[A-Z_]|^motion$|^AnimatePresence$'`
