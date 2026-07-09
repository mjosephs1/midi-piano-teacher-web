# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a MIDI Piano Teacher web application built with React 19, TypeScript, and Create React App. The project aims to provide interactive piano instruction using MIDI input.

The app is hosted on GitHub Pages (frontend only). An optional local API server backed by PostgreSQL provides persistent storage. When the API server is not reachable, the app falls back to localStorage automatically.

## Development Commands

### Frontend (repo root)
```bash
npm install   # install dependencies
npm start     # dev server at http://localhost:3000
npm test      # test runner in interactive watch mode
npm run build # production build in build/
```

### API Server (`server/` directory)
```bash
npm install      # install dependencies
npm run dev      # start dev server at http://localhost:3001 (tsx watch, hot reload)
npm run build    # compile TypeScript to dist/
npm run start    # run compiled server
npm run db:generate  # generate a new Drizzle migration after editing schema.ts
```

### Database (Docker)
```bash
docker compose up -d    # start Postgres in background
docker compose down     # stop Postgres (data persists in Docker volume)
docker compose down -v  # stop Postgres and wipe all data (triggers fresh migration on next server start)
docker compose ps       # check container status
```

## Project Structure

```
src/
  ├── App.tsx                # Main router, layout, numKeys/showNotes state, error banner
  ├── App.css                # App styling
  ├── index.tsx              # React root entry point (wraps app in StorageProvider, BrowserRouter, MidiProvider)
  ├── App.test.tsx           # Tests for App component
  ├── setupTests.ts          # Jest configuration for tests
  ├── reportWebVitals.ts     # Web vitals reporting
  ├── context/
  │   └── StorageContext.tsx # StorageProvider and useStorage() hook — health check + all storage operations
  ├── pages/                 # Route-level page components
  │   ├── Home.tsx           # Home page route with piano display
  │   ├── Settings.tsx       # KEYBOARD_SIZES/KEYBOARD_OFFSETS exports + Settings component rendered inside VirtualPiano's gear-icon modal
  │   ├── Settings.css       # Settings styling
  │   ├── ChordExplorer.tsx      # Chord Explorer page with interactive chord button grid
  │   ├── ChordExplorer.css      # Styling for the Chord Explorer page
  │   ├── PracticeMode.tsx   # Practice Mode page — displays target chord and advancing queue
  │   ├── PracticeMode.css   # Styling for the Practice Mode page
  │   ├── TimedMode.tsx      # Timed Mode page — state machine: CONFIGURE → COUNTDOWN → STARTED → RESULTS
  │   ├── TimedMode.css      # Styling for the Timed Mode page
  │   ├── HighScores.tsx     # High Scores page — displays top 10 results for a config
  │   ├── HighScores.css     # Styling for the High Scores page
  │   ├── Progress.tsx       # Progress page — line chart of daily average scores, filterable by config
  │   └── Progress.css       # Styling for the Progress page
  ├── components/            # Reusable UI components
  │   ├── ChordQueue.tsx     # Component displaying 5 advancing chord cards
  │   ├── ChordQueue.css     # Styling for the chord queue component
  │   ├── PianoIcon.tsx      # Piano SVG icon component (interactive hover effect)
  │   ├── PracticeConfiguration.tsx  # Controlled component for selecting practice chord groups
  │   └── PracticeConfiguration.css  # Styling for practice configuration component
  └── midi/
      ├── MidiContext.tsx    # MidiProvider and useMidi() hook
      ├── AudioPlayer.ts     # Tone.js PolySynth singleton — playNote/stopNote/startAudio exports
      ├── VirtualPiano.tsx   # Visual piano component that displays and animates pressed keys
      ├── VirtualPiano.css   # Styling for the piano component
      └── noteUtils.ts       # Utilities: note number to name conversion and chord detection
server/
  ├── src/
  │   ├── index.ts           # Fastify server entry point — runs migrations, seeds user 0, registers routes
  │   ├── db.ts              # pg Pool + Drizzle instance
  │   ├── schema.ts          # Drizzle table definitions (single source of truth for DB schema)
  │   └── routes/
  │       ├── settings.ts    # GET/PATCH /api/settings
  │       └── timedResults.ts # GET/POST /api/timed-results
  ├── drizzle/               # Auto-generated SQL migration files (committed to git)
  ├── drizzle.config.ts      # Drizzle Kit config (points at schema.ts and drizzle/ folder)
  ├── package.json
  └── tsconfig.json
public/
  ├── index.html             # HTML entry point (served by dev server)
  └── [other static assets]
docker-compose.yml           # Postgres 17 service (port 5432, named volume for data)
package.json                 # Frontend dependencies and scripts
tsconfig.json               # TypeScript configuration
```

## Architecture Notes

- **Language**: Project uses TypeScript with strict mode enabled (`noUnusedLocals`, `noUnusedParameters`)
- **Component Structure**: Uses functional components typed with `React.FC`. Example: `const App: FC = () => { ... }`
- **Styling**: Uses CSS files alongside components. Consider establishing a consistent styling approach as the project grows (CSS modules, Tailwind, etc.).
- **Testing**: Uses React Testing Library and Jest. Tests should focus on user behavior rather than implementation details.
- **Build Tool**: Create React App handles webpack, Babel, ESLint, and TypeScript compilation. The configuration is abstracted away unless you `eject` (one-way operation).
- **Routing**: Uses React Router (`react-router-dom`) for client-side routing. Routes are defined in `App.tsx` using `Routes` and `Route` components. Navigation links use React Router's `Link` component to enable browser history and bookmarkable URLs.

## ESLint & Code Standards

- ESLint is configured with `react-app` preset
- Configuration is in `package.json` under `eslintConfig`
- The preset includes React best practices and Jest rules

## TypeScript Setup

- Type definitions installed: `@types/react`, `@types/react-dom`, `@types/node`
- `tsconfig.json` configured with strict mode and React 19 JSX support
- All source files use `.tsx` (for components) or `.ts` (for utilities) extensions

## Persistence Architecture

### Overview

Storage is abstracted behind `StorageContext` (`src/context/StorageContext.tsx`). On app load it performs a health check against `http://localhost:3001/health`. If successful, it uses the API server + PostgreSQL for all reads and writes. If the check fails (or times out after 3 seconds), it falls back to localStorage. Components never call localStorage directly — they always use `useStorage()`.

The app renders nothing while the health check is in flight (`StorageProvider` returns `null` during `'checking'` state). In practice this is ~50ms for localhost; up to 3 seconds if the server is unavailable.

### `useStorage()` hook

```tsx
const { mode, error, loadSettings, saveSettings, loadTimedResults, saveTimedResult } = useStorage();
```

- `mode: 'checking' | 'api' | 'local'` — current storage backend (never `'checking'` by the time components render)
- `error: string | null` — set if an API call fails mid-session; displayed as a red banner in `App.tsx`
- `loadSettings(): Promise<AllSettings>` — loads all persisted settings for user 0
- `saveSettings(patch: Partial<AllSettings>): Promise<void>` — updates a subset of settings
- `loadTimedResults(config: PracticeConfig): Promise<TimedResult[]>` — fetches all results matching the given config
- `saveTimedResult(score, mistakes, config): Promise<void>` — persists one timed result

### `AllSettings` shape

```ts
interface AllSettings {
  numKeys: number;           // keyboard size (25/37/49/61/76/88)
  showNotes: boolean;        // whether to show note labels on piano keys
  selectedGroups: string[];  // chord groups selected for practice
  sharpsFilter: SharpsFilter;
  handsMode: HandsMode;
  octaveOffsetRight: number;
  octaveOffsetLeft: number;
}
```

### Component loading pattern

All components that need persisted state follow the same pattern:

```tsx
const { loadSettings, saveSettings } = useStorage();
const [config, setConfig] = useState<PracticeConfig>(new PracticeConfig()); // default while loading
const settingsLoadedRef = useRef(false); // guards against saving before load completes

useEffect(() => {
  loadSettings().then(settings => {
    setConfig(new PracticeConfig(...));
    settingsLoadedRef.current = true;
  });
}, [loadSettings]);

useEffect(() => {
  if (!settingsLoadedRef.current) return; // skip save on initial default state
  saveSettings({ selectedGroups: [...config.selectedGroups], ... });
}, [config, saveSettings]);
```

The `settingsLoadedRef` guard prevents overwriting stored data with defaults on the initial render before the async load completes.

### API Server

Built with **Fastify** + **Drizzle ORM** + **pg** (PostgreSQL). Runs on port 3001.

**Endpoints:**
- `GET /health` — connectivity check; also exercises the DB connection
- `GET /api/settings` — returns the `user_settings` row for `user_id = 0`
- `PATCH /api/settings` — partial update of any settings fields
- `GET /api/timed-results?selected_groups=Major&sharps_filter=with-sharps&hands_mode=right` — returns matching results
- `POST /api/timed-results` — inserts a new result row

**On startup**, the server runs `migrate()` (applies any pending Drizzle migrations) then seeds `user_id = 0` into `user_settings` if not present.

### Database Schema

Two tables, both with a `user_id INTEGER DEFAULT 0` column. Currently only user 0 is used. When a real auth system is added, set `user_id` to the authenticated user's ID and add a `FOREIGN KEY` constraint pointing to a `users` table.

```sql
CREATE TABLE user_settings (
  user_id             INTEGER  PRIMARY KEY DEFAULT 0,
  num_keys            INTEGER  NOT NULL DEFAULT 88,
  show_notes          BOOLEAN  NOT NULL DEFAULT false,
  selected_groups     TEXT[]   NOT NULL DEFAULT '{Major}',
  sharps_filter       TEXT     NOT NULL DEFAULT 'with-sharps',
  hands_mode          TEXT     NOT NULL DEFAULT 'right',
  octave_offset_right INTEGER  NOT NULL DEFAULT 0,
  octave_offset_left  INTEGER  NOT NULL DEFAULT 0
);

CREATE TABLE timed_results (
  id              SERIAL      PRIMARY KEY,
  user_id         INTEGER     NOT NULL DEFAULT 0,
  score           INTEGER     NOT NULL,
  mistakes        INTEGER     NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  selected_groups TEXT[]      NOT NULL,
  sharps_filter   TEXT        NOT NULL,
  hands_mode      TEXT        NOT NULL
);
```

### Schema migrations

`server/src/schema.ts` is the single source of truth. To make a schema change:

1. Edit `server/src/schema.ts`
2. Run `cd server && npm run db:generate` — Drizzle diffs the schema and writes a new `.sql` file to `server/drizzle/`
3. Commit both files
4. Restart the server — `migrate()` picks up and applies the new migration automatically

Migration history is tracked in a `__drizzle_migrations` table so migrations are never applied twice.

## MIDI Architecture

The MIDI detection system uses React Context to share MIDI state across the entire app, avoiding prop drilling and duplicated setup.

### How it works
1. **`MidiProvider`** (in `src/midi/MidiContext.tsx`) wraps the component tree at the root (`index.tsx`). It:
   - Calls `navigator.requestMIDIAccess()` on mount to access connected MIDI devices
   - Listens to `midimessage` events from all inputs
   - Tracks currently-pressed notes as a `Set<number>` (MIDI note numbers 0–127)
   - Stores a status string: `'listening'` (ready), `'denied'` (permission denied), or `'unavailable'` (API not supported)

2. **`useMidi()` hook** — any component can call this to get:
   ```tsx
   const { pressedNotes, status, pressedChord, soundEnabled, setSoundEnabled } = useMidi();
   ```
   - `pressedNotes`: `Set<number>` of MIDI note numbers currently pressed
   - `status`: One of `'listening' | 'denied' | 'unavailable'`
   - `pressedChord`: `Chord | null` — the detected chord (a `Chord` instance), or `null` if no valid chord is pressed. Use `pressedChord?.name()` to get the display string (e.g., `"C Major"`).
   - `soundEnabled`: `boolean` — whether MIDI note-on/off events trigger audio playback. Defaults to `true`.
   - `setSoundEnabled`: `(enabled: boolean) => void` — toggles audio on/off. The MIDI message handler reads this via a `useRef` to avoid stale closure issues.

3. **`noteNumberToName()`** (in `src/midi/noteUtils.ts`) converts MIDI note numbers to names:
   - `noteNumberToName(60)` → `"C"`
   - `noteNumberToName(61)` → `"C#"`
   - Uses modulo 12 to get the note class, ignoring octave

4. **Exported chord data** (in `src/midi/noteUtils.ts`):
   - `NOTE_NAMES: string[]` — array of pitch class names: `['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']`
   - `ChordPattern` type — interface with `name: string` and `intervals: number[]`
   - `CHORD_PATTERNS: ChordPattern[]` — array of 11 chord patterns: Major 7, Dominant 7, Minor 7, Diminished 7, Half-dim 7, Major, Minor, Diminished, Augmented, Sus2, Sus4
   - `SharpsFilter` type — union type `'no-sharps' | 'with-sharps' | 'sharps-only'` used to control which root notes are available for chord generation in practice mode
   - `HandsMode` type — union type `'left' | 'both' | 'right'` used to control how many octaves of each note must be pressed simultaneously during chord matching
   - `PracticeConfig` class — encapsulates practice session settings (`selectedGroups: Set<string>`, `sharpsFilter: SharpsFilter`, `handsMode: HandsMode`) in a single object for cleaner prop passing. Constructor accepts optional parameters with sensible defaults: `new PracticeConfig(new Set(['Major']), 'with-sharps', 'right')`. Provides:
     - Static constant `STORAGE_KEY = 'midiPianoPracticeConfig'` — localStorage key used by the StorageContext local fallback
     - `toJson()`: Returns a plain object with serializable fields
     - `toString()`: Returns a deterministic string key (e.g., `"Major,Minor|with-sharps|right"`) used as a localStorage history key in the local fallback. Sorts `selectedGroups` to ensure consistent keys regardless of selection order.
     - `fromJson(data)`: Static method that validates and deserializes from a plain object; returns `PracticeConfig | null`
   - `TIMED_HISTORY_KEY` constant: `'midiPianoTimedHistory'` — localStorage key used by the StorageContext local fallback for timed results
   - `OCTAVE_OFFSET_STORAGE_KEY` constant: `'midiPianoOctaveOffset'` — localStorage key used by the StorageContext local fallback for octave offsets. Stored as `{ left: number, right: number }`. "Both" mode shares the `'right'` slot.
   - `TimedResult` type: Object with `score: number`, `mistakes: number`, and `timestamp: string` (ISO 8601 format)
   - `TimedHistory` type: Object with config string keys mapping to arrays of `TimedResult` entries (used only in the localStorage fallback path of StorageContext)
   - `Chord` class — represents a chord with `rootNote: string` and `patternName: string`. Constructed as `new Chord('C', 'Major')`. Methods:
     - `name()`: returns the chord name string, e.g. `"C Major"`
     - `shorthand()`: returns the pattern shorthand, e.g. `"maj"`, `"m7"`
     - `getNoteIndices(baseNote?: number)`: returns `Set<number>` of MIDI note numbers (default baseNote 60). This is the canonical way to convert a chord to playable notes.
     - `matches(pressedNotes: Set<number>)`: returns `true` if the pitch classes of `pressedNotes` exactly equal this chord's pitch classes. Used for chord matching in ChordQueue — avoids name-comparison bugs where enharmonically equivalent chords (e.g. Asus2 and Esus4 share the same 3 pitch classes) would fail a name match.
   - All exported from `src/midi/noteUtils.ts`. Used by `PracticeConfiguration`, `ChordQueue`, and both practice mode components to pass configuration consistently.

5. **`detectChord()`** (in `src/midi/noteUtils.ts`) detects chord names from pressed MIDI notes:
   - Takes a `Set<number>` of MIDI note numbers and returns a `Chord | null`
   - Returns `null` if fewer than 3 unique pitch classes are pressed
   - Normalizes notes to pitch classes (modulo 12) and tries each as a potential root
   - Matches intervals against known chord patterns: Major, Minor, Diminished, Augmented, Sus2, Sus4, and 7th variants (Major 7, Dominant 7, Minor 7, Diminished 7, Half-dim 7)
   - Returns a `Chord` instance (call `.name()` for display string, e.g., `"C Major"`)
   - Handles inversions correctly (e.g., first-inversion C Major [E, G, C] returns `Chord { rootNote: 'C', patternName: 'Major' }`)

### Audio Playback (`AudioPlayer.ts`)

Piano audio plays automatically on MIDI note-on/off events via `MidiContext`. The module is a singleton wrapping a `Tone.PolySynth` — no audio files required, everything is synthesized via Web Audio API.

**Synth settings:** triangle oscillator, envelope (attack 5ms / decay 600ms / sustain 0.1 / release 2.5s), light reverb (20% wet, 1.5s decay). Sounds like a mallet/music box; adjust oscillator type and envelope values to taste.

**Exports:**
- `startAudio(): Promise<void>` — resumes the Web Audio `AudioContext`; must be called from a user gesture. `MidiContext` calls this automatically on the first `click` or `keydown` on the document.
- `playNote(midi: number, velocity: number): void` — triggers attack for a MIDI note (0–127) with the given velocity (0–127).
- `stopNote(midi: number): void` — triggers release for a MIDI note.

Both `playNote` and `stopNote` are no-ops until `startAudio()` has been called. Uses flat note name convention internally (`Eb4`, `Gb3`).

### Adding MIDI to a new component
```tsx
import { useMidi } from './midi/MidiContext';
import { noteNumberToName } from './midi/noteUtils';

export const MyComponent: FC = () => {
  const { pressedNotes, status } = useMidi();
  
  const noteNames = Array.from(pressedNotes).map(noteNumberToName);
  return <div>{noteNames.join(' ')}</div>;
};
```

### Routing Architecture

React Router, defined in `App.tsx`. `index.tsx` wraps the tree in `<StorageProvider>`, `<BrowserRouter>`, `<MidiProvider>` (in that order).

**Routes:** `/` (Home), `/chord-explorer`, `/practice-chords/practice` (PracticeMode), `/practice-chords/timed` (TimedMode), `/practice-chords/high-scores` (HighScores), `/practice-chords/progress` (Progress).

The "Practice" and user-menu (`faCircleUser`) nav items are pure-CSS hover dropdowns (`.nav-dropdown`), not click-triggered — trigger and menu share one hover zone so moving the mouse between them doesn't close the menu. Adding a route: create the component, add a `<Route>` in `App.tsx`, add a `<Link>` in the header.

### Component Reference

Pointers only — read the source for exact props/state/effects before editing. Only invariants that aren't obvious from a first read are noted.

- **VirtualPiano** (`midi/VirtualPiano.tsx`) — SVG piano; `numKeys` sets layout, `pressedNotes`/`secondaryPressedNotes` control highlighting (a note in both renders darker red, used by PracticeMode to overlay live MIDI on the static target chord). `showSettings` renders a gear-icon modal wrapping `Settings`; callers persist `onNumKeysChange`/`onShowNotesChange` themselves via `saveSettings()`. Aligns real MIDI note numbers to virtual keys using `KEYBOARD_OFFSETS` (`pages/Settings.tsx`) — each keyboard size has its own starting note.
- **Home** (`pages/Home.tsx`) — piano display + live note/chord readout from `useMidi()`.
- **Settings** (`pages/Settings.tsx`) — controlled, no local state; `App.tsx` owns `numKeys`/`showNotes`.
- **ChordExplorer** (`pages/ChordExplorer.tsx`) — chord-group dropdown + 12 root buttons on a 25-key piano. Base note is fixed at `KEYBOARD_OFFSETS[25]` (48/C3) regardless of the app's selected keyboard size.
- **PracticeMode** (`pages/PracticeMode.tsx`) — target chord + advancing `ChordQueue`. `baseNote = defaultBase + octaveOffset*12`; for left hand, `defaultBase` is clamped to `Math.max(36, KEYBOARD_OFFSETS[numKeys])` so the target stays on-screen on 25/37-key keyboards. Octave offset is stored per-hand and reloaded when `handsMode` changes.
- **TimedMode** (`pages/TimedMode.tsx`) — state machine `CONFIGURE → COUNTDOWN → STARTED → RESULTS`, each driven by its own `setInterval`. Calls `saveTimedResult()` on entering RESULTS.
- **HighScores** (`pages/HighScores.tsx`) — top 10 for the selected config, sorted by score then accuracy.
- **Progress** (`pages/Progress.tsx`) — Recharts line chart of daily average score for the selected config.
- **ChordQueue** (`components/ChordQueue.tsx`) — 5-card queue of random chords. Matching logic depends on `handsMode`: `'left'`/`'right'` compare chord names; `'both'` requires every target pitch class to appear at least twice among pressed notes in different octaves — `[...targetPCs].every(pc => notes.filter(n => n % 12 === pc).length >= 2)`.
- **PracticeConfiguration** (`components/PracticeConfiguration.tsx`) — chord-group multi-select (enforces a minimum of one selected), sharps-filter and hands-mode radio groups.

---

## Notes for Development

- React Strict Mode is enabled in index.tsx — in development, effects run twice (mount → unmount → remount). The health check in `StorageProvider` handles this correctly with an `AbortController` and a `cancelled` flag so only the second run sets the mode.
- Always add type annotations to component props and function parameters
- Web MIDI API types are declared inline in `MidiContext.tsx` (not from a package) for simplicity
- All components that load persisted state use a `settingsLoadedRef` (a `useRef<boolean>`) to prevent saving default values before the async load completes. See "Component loading pattern" in Persistence Architecture above.
- The `useStorage()` context functions are wrapped in `useCallback` with `[mode]` as the dependency. Since `mode` never changes after the initial health check, these functions are effectively stable for the lifetime of the app and safe to include in `useEffect` dependency arrays.
- The frontend TypeScript version (4.9.5, bundled with CRA) does not support `"moduleResolution": "bundler"` in tsconfig.json. Running `tsc --noEmit` will fail with a config error — this is pre-existing and does not affect the build (CRA uses its own pipeline). The server has its own `tsconfig.json` with correct settings for its TS version.

## Maintaining CLAUDE.md

After every code change, update CLAUDE.md if the change warrants it. Specifically:
- **Update Project Structure** if you add, delete, or move files or directories
- **Update Architecture Notes** if you add a new architectural pattern, change a core pattern, or modify how components communicate
- **Update Persistence Architecture** if you modify the storage layer, add API endpoints, or change the schema
- **Update MIDI Architecture** if you modify the MIDI system or add new MIDI features
- **Update Development Commands** if you modify scripts in package.json or change how to run the project
- **Add to Notes for Development** if you establish a new convention, pattern, or constraint that future Claude sessions should know about

Keep the documentation in sync with the code so that future work proceeds with accurate context.
