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
   const { pressedNotes, status, pressedChord } = useMidi();
   ```
   - `pressedNotes`: `Set<number>` of MIDI note numbers currently pressed
   - `status`: One of `'listening' | 'denied' | 'unavailable'`
   - `pressedChord`: `Chord | null` — the detected chord (a `Chord` instance), or `null` if no valid chord is pressed. Use `pressedChord?.name()` to get the display string (e.g., `"C Major"`).

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

### VirtualPiano Component (`VirtualPiano.tsx`)
The `VirtualPiano` component renders a visual representation of a piano keyboard using SVG and displays real-time feedback when keys are pressed.

**Features:**
- Renders a scalable piano keyboard with white and black keys
- Highlights pressed keys based on the `pressedNotes` prop (decoupled from MIDI input)
- **Scalable**: The `scaleFactor` variable (currently `30`) controls the keyboard size; adjust to resize all keyboard dimensions proportionally
- **Configurable**: The `numKeys` prop (default: 88) controls the total number of keys to display
- **Automatic mapping**: Internally maps total keys to white keys (e.g., 88 keys → 52 white keys)
- **Visual feedback**: Active keys change color when pressed:
  - White keys turn light green (`#90EE90`) when active
  - Black keys turn red (`#FF6B6B`) when active

**Props:**
- `numKeys` (default: `88`) — total number of keys to display on the piano (25, 37, 49, 61, 76, or 88)
- `pressedNotes` (default: `new Set()`) — a `Set<number>` of MIDI note numbers that are currently pressed; these keys render with red fill
- `secondaryPressedNotes` (default: `new Set()`) — a `Set<number>` of MIDI note numbers to highlight with a light gray fill. Used in PracticeMode to show live MIDI input alongside the static target chord. A key in both sets renders as a darker red (`#b02828`) to indicate a correct match.
- `showSettings` (default: `false`) — when `true`, renders a gear icon button (⚙) in the piano's header area (top band above the keys), right-aligned. Clicking the gear opens a centered modal containing the `Settings` component (keyboard-size dropdown + Show Notes checkbox). Currently `true` in `PracticeMode` and `Home`. Uses SVG `<foreignObject>` for the gear button; the modal is rendered as a sibling outside the SVG in a React fragment.
- `onNumKeysChange` — callback `(numKeys: number) => void` invoked when the user selects a different keyboard size from the settings modal. Only relevant when `showSettings` is `true`. Callers are responsible for persisting the value via `saveSettings()`.
- `onShowNotesChange` — callback `(showNotes: boolean) => void` invoked when the user toggles the "Show Notes" checkbox in the settings modal. Only relevant when `showSettings` is `true`. Callers are responsible for persisting the value via `saveSettings()`.

**MIDI Offset Mapping:**
The `VirtualPiano` component uses the `KEYBOARD_OFFSETS` map (exported from `src/Settings.tsx`) to correctly align virtual keys with real MIDI note numbers from physical keyboards. Each keyboard size has a starting note, and the offset maps that starting note to the virtual piano's key positions. This ensures that pressing the lowest key on a physical keyboard highlights the leftmost key on the virtual piano.

**Usage:**
```tsx
import { VirtualPiano } from './midi/VirtualPiano';
import { useMidi } from './midi/MidiContext';

export const App: FC = () => {
  const { pressedNotes } = useMidi();
  return <VirtualPiano numKeys={88} pressedNotes={pressedNotes} />;
};
```

### Routing Architecture

The app uses **React Router** for client-side routing. The structure is:

1. **`index.tsx`** wraps the app in `<StorageProvider>`, `<BrowserRouter>`, and `<MidiProvider>` (in that order)
2. **`App.tsx`** contains:
   - The header with navigation links (`<Link>` components). The `<h1>MIDI Piano Teacher</h1>` title is wrapped in a `<Link to="/" className="title-link">` so clicking the title navigates home. There is no separate "Home" nav link.
   - State management for `numKeys` and `showNotes` (loaded async via `useStorage()` on mount)
   - An error banner (`<div className="storage-error-banner">`) shown when `useStorage().error` is non-null
   - The `<Routes>` definition with all application routes
3. **Routes:**
   - `/` → `<Home>` component
   - `/chord-explorer` → `<ChordExplorer>` component
   - `/practice-chords/practice` → `<PracticeMode>` component
   - `/practice-chords/timed` → `<TimedMode>` component
   - `/practice-chords/high-scores` → `<HighScores>` component
   - `/practice-chords/progress` → `<Progress>` component
4. **Practice nav dropdown**: The "Practice" nav item is a `<div className="nav-dropdown">` with a `<span>` trigger (no navigation on click) and a pure-CSS hover dropdown menu containing links to the two practice modes (Practice Mode and Timed Mode). Moving the mouse from the trigger into the menu stays within the `.nav-dropdown` hover zone so the menu remains open.

5. **User menu dropdown**: A circle-user icon button (`faCircleUser`) inside `nav-links`, positioned immediately to the right of the Practice dropdown. It uses the same pure-CSS hover pattern as the Practice dropdown. The menu contains "High Scores" (links to `/practice-chords/high-scores`) and "Progress" (links to `/practice-chords/progress`).

**Adding a new route:**
```tsx
// 1. Create a new component (e.g., MyPage.tsx)
// 2. Add it to App.tsx Routes:
<Route path="/my-page" element={<MyPage />} />
// 3. Add a navigation link in the header:
<Link to="/my-page">My Page</Link>
```

### Home Component (`Home.tsx`)

The `Home` component renders the main piano interface. It receives the current keyboard size preference as a prop and displays:
- MIDI status message
- Piano keyboard visualization
- Real-time note display when MIDI is active
- Detected chord name (if a valid chord is being played)

**Props:**
- `numKeys: number` — the selected keyboard size from parent `App.tsx`

**Note Display:**
The component displays two sections when MIDI is active:
- **Notes section**: Space-separated pitch class names of all pressed keys (e.g., `"C E G"`)
- **Chord section**: The detected chord name if 3+ unique pitch classes form a recognized chord pattern (e.g., `"C Major"`); otherwise blank

### Settings Component (`Settings.tsx`)
The `Settings` component provides a user interface for selecting keyboard size and toggling note labels. It is a controlled component rendered inside VirtualPiano's settings modal (opened via the gear icon).

**Features:**
- Dropdown with 6 preset keyboard sizes: 25, 37, 49, 61, 76, 88 keys
- Shows user-friendly labels ("25 keys", "88 keys", etc.)
- Checkbox to toggle "Show Notes" (renders note names on piano keys)

**Props:**
- `numKeys: number` — the currently selected total key count
- `onNumKeysChange: (numKeys: number) => void` — callback when user selects a different size
- `keyboardSizes: readonly number[]` — array of available total key counts
- `showNotes: boolean` — whether note labels are currently shown on piano keys
- `onShowNotesChange: (showNotes: boolean) => void` — callback when user toggles the Show Notes checkbox

**Helper function:**
- `getWhiteKeysFromTotalKeys(numKeys: number): number` — converts total keys to white keys for internal use in `Piano`

**State Management:**
`Settings` has no local state. `App.tsx` owns `numKeys` and `showNotes`, loading them async via `useStorage().loadSettings()` on mount and persisting changes via `useStorage().saveSettings({ numKeys, showNotes })`.

### ChordExplorer Component (`ChordExplorer.tsx`)
The `ChordExplorer` component provides an interactive tool for exploring chord fingerings on the piano. It shows a "Chord Group" dropdown to select one of the 11 chord types, then displays a row of 12 root-note buttons for that group. Clicking a button highlights the corresponding notes on a 25-key virtual piano.

**Features:**
- "Chord Group" dropdown (defaults to Major) to select which chord type to explore
- 12 chord buttons for the selected group, one per root note (C through B)
- Real-time visual feedback on the virtual piano when a chord button is selected
- Switching chord group clears the previous selection

**State:**
- `chordNotes: Set<number>` — MIDI note numbers to display on the piano
- `selectedChord: { rootIndex: number; patternIndex: number } | null` — tracks the currently selected button for highlighting
- `selectedPatternIndex: number` — index into `CHORD_PATTERNS` for the active chord group (default 0 = Major)

**Implementation:**
The component uses `KEYBOARD_OFFSETS[KEYBOARD_SIZES[0]]` (which equals 48, C3) as the base note. When a chord button is clicked:
1. The root note is calculated as `BASE_NOTE + rootIndex`
2. The active pattern's intervals are applied: `pattern.intervals.map(i => rootMidi + i)`
3. The resulting note set is passed to the `VirtualPiano` component for display

**Route:**
- `/chord-explorer` (registered in `App.tsx`)

### PracticeMode Component (`PracticeMode.tsx`)
The `PracticeMode` component is a practice page where users advance through a queue of chords by playing them on their MIDI keyboard. It displays a visual piano showing the target chord, a queue of 5 upcoming chords, and controls for selecting which chord groups to include in the practice session.

**Features:**
- Displays a `VirtualPiano` showing the fingering for the current target chord (static display, not live MIDI)
- Shows a horizontal queue of 5 chord cards; the leftmost card is the target to play
- When the user plays the target chord on their MIDI keyboard, the queue advances (target disappears, new chord added on the right)
- Includes a `PracticeConfiguration` panel toggled by a gear icon button for selecting chord groups, sharps filter, and hands mode
- Settings persist via `useStorage()` (API or localStorage depending on mode)
- **Octave selector**: Up/down arrow buttons to the right of the VirtualPiano shift the displayed octave by ±12 semitones. Buttons disable at MIDI bounds (0 and 108).

**Props:**
- `numKeys: number` — the selected keyboard size from parent `App.tsx`
- `onNumKeysChange: (numKeys: number) => void` — passed through to VirtualPiano's in-piano settings dropdown

**State:**
- `config: PracticeConfig` — loaded async on mount via `loadSettings()`. Saved on change via `saveSettings({ selectedGroups, sharpsFilter, handsMode })`.
- `currentChord: Chord | null` — the current target chord object (not notes). Notes are derived via `currentChord.getNoteIndices(baseNote)` where `baseNote` is computed from `handsMode` and `octaveOffset`.
- `octaveOffset: number` — loaded async on mount from `loadSettings()` for the active hand. When `handsMode` changes, re-loads settings to get the correct offset for the new hand. When `numKeys` changes, resets to 0 and saves via `saveSettings()`.
- `configOpen: boolean` — controls visibility of the `PracticeConfiguration` modal
- `settingsLoadedRef: MutableRefObject<boolean>` — guards against saving settings before the initial load completes

**Derived values (not state):**
- `defaultBase`: for right-hand mode = 72; for left-hand mode = `Math.max(36, KEYBOARD_OFFSETS[numKeys] ?? 21)` — ensures the default is always within the visible keyboard range (25/37-key keyboards start at 48, so left-hand default is clamped to 48; 49+ key keyboards use 36)
- `baseNote`: `defaultBase + octaveOffset * 12`
- `currentChordNotes`: `currentChord.getNoteIndices(baseNote)` — passed to `VirtualPiano` as `pressedNotes`

**Route:**
- `/practice-chords/practice` (registered in `App.tsx`)

### TimedMode Component (`TimedMode.tsx`)
The `TimedMode` component is a timed practice mode that uses a four-stage state machine to control the user flow: CONFIGURE → COUNTDOWN → STARTED → RESULTS. Users configure chord groups, trigger a countdown, play chords for 60 seconds while their score increments, and then view results with options to play again or reconfigure.

**State Machine Stages:**
- **CONFIGURE**: Initial configuration screen with "Timed Mode" title, `PracticeConfiguration`, and "Start" button.
- **COUNTDOWN**: 4-second countdown with fading text ("3", "2", "1", "Begin"). Each step animates with a fade-in/fade-out effect.
- **STARTED**: Active game session showing HUD (Stop button, Timer, Score) and `ChordQueue`. Timer counts down from 60 seconds. Each matched chord increments score.
- **RESULTS**: Final score display with options to "Try Again" (returns to COUNTDOWN), "High Scores" (navigates to High Scores page), or "Back" (returns to CONFIGURE).

**Props:**
- None — TimedMode is self-contained and does not receive props from parent

**State:**
- `config: PracticeConfig` — loaded async on mount via `loadSettings()`. Saved on change via `saveSettings()`.
- `stage: TimedStage` — one of `'CONFIGURE' | 'COUNTDOWN' | 'STARTED' | 'RESULTS'`. Controls which UI is rendered.
- `countdownStep: number` — 0–3, indexes into `['3', '2', '1', 'Begin']`. Incremented every second during COUNTDOWN.
- `timeLeft: number` — starts at 60, decrements every second during STARTED. When it reaches 0, transitions to RESULTS.
- `score: number` — incremented by 1 each time `ChordQueue` calls the `onChordMatched` callback. Reset to 0 when entering STARTED.
- `mistakes: number` — incremented by 1 each time `ChordQueue` calls the `onChordMistake` callback. Reset to 0 when entering STARTED.

**Timers:**
- **Countdown timer**: `setInterval` fires every 1 second, increments `countdownStep`. When `countdownStep` reaches 3 ("Begin"), the next second triggers transition to STARTED.
- **Game timer**: `setInterval` fires every 1 second, decrements `timeLeft`. When `timeLeft` reaches 0, transitions to RESULTS.

**Result persistence:**
When entering RESULTS stage, calls `saveTimedResult(score, mistakes, config)` via `useStorage()`. The API stores results as rows in `timed_results`; the localStorage fallback appends to a keyed history object under `TIMED_HISTORY_KEY`.

**Route:**
- `/practice-chords/timed` (registered in `App.tsx`)

### HighScores Component (`HighScores.tsx`)
The `HighScores` component displays the top 10 Timed Mode results for a selected practice configuration. It allows users to view historical performance and filter results by configuration.

**Features:**
- `PracticeConfiguration` selector at the top to filter scores by config
- Loads results async via `loadTimedResults(config)` whenever config changes
- Top 10 results displayed in a table with rank, score, accuracy, and timestamp
- Primary sorting by score (descending); ties broken by accuracy (descending)
- Rank #1 highlighted with gold background
- Empty state message when no scores exist for the selected config

**Props:**
- None — HighScores is self-contained and does not receive props from parent

**State:**
- `config: PracticeConfig` — loaded async on mount. Saved on change.
- `topScores: RankedResult[]` — loaded and re-computed in a `useEffect` whenever `config` changes

**Route:**
- `/practice-chords/high-scores` (registered in `App.tsx`)

### Progress Component (`Progress.tsx`)
The `Progress` component displays a line chart of the user's average score over time for a selected practice configuration. Uses Recharts for visualization and mirrors the two-column layout of `HighScores`.

**Features:**
- `PracticeConfiguration` selector on the left to filter chart data by config
- Recharts `LineChart` on the right showing daily average scores over time, with title "Average Score Over Time"
- X-axis: one tick per calendar day (formatted with `toLocaleDateString()`)
- Y-axis: average score for that day (average of all Timed Mode runs on that day), labeled "Score"
- Empty state message when no history exists for the selected config
- Config persisted via `useStorage()`

**Props:**
- None — self-contained

**State:**
- `config: PracticeConfig` — loaded async on mount. Saved on change.
- `chartData: ChartDataPoint[]` — loaded and re-computed in a `useEffect` whenever `config` changes via `loadTimedResults(config)`

**Route:**
- `/practice-chords/progress` (registered in `App.tsx`)

### ChordQueue Component (`ChordQueue.tsx`)
The `ChordQueue` component displays a horizontal row of 5 chord cards. It maintains a queue of random chords from the selected chord groups and detects when the user plays the target (leftmost) chord, advancing the queue.

**Features:**
- Displays 5 chord cards in a horizontal flex row
- The leftmost card (current target) is highlighted in red and scaled up
- Listens to `pressedChord` from `useMidi()` hook to detect when user plays the target chord
- On match, advances the queue: removes the leftmost card and appends a new random card on the right
- Regenerates all 5 cards when `config.selectedGroups` or `config.sharpsFilter` changes
- Prevents immediate re-triggering by excluding the just-matched chord from the new random generation

**Props:**
- `config: PracticeConfig` — encapsulates practice settings: `selectedGroups` (set of chord group names to sample from), `sharpsFilter` (controls available root notes: `'no-sharps'` excludes C#, D#, F#, G#, A# (indices 1, 3, 6, 8, 10); `'sharps-only'` keeps only those; `'with-sharps'` allows all 12), and `handsMode` (controls chord matching: `'left'` or `'right'` matches by chord name; `'both'` requires each pitch class appear at least twice in different octaves)
- `onCurrentChordChange: (chord: Chord) => void` — callback fired when the target chord changes (on mount, after advance, or when config changes). Receives a `Chord` instance. Consumers are responsible for interpreting it (e.g., call `chord.getNoteIndices()` to get MIDI notes for `VirtualPiano`).
- `onChordMatched?: () => void` — optional callback fired when the user successfully plays the target chord. Fired just before the queue advances.
- `onChordMistake?: () => void` — optional callback fired when the user plays a chord that doesn't match the target.

**Implementation Details:**
- Uses a helper function `generateChordItem(selectedGroups, sharpsFilter, exclude?)` to randomly select a `{ rootIndex, patternName }` from the enabled chord groups and available root indices. The optional `exclude` parameter prevents re-generating the same chord name.
- Helper function `getAvailableRootIndices(sharpsFilter)` returns the set of available root indices (0–11) based on the filter.
- Computes MIDI note numbers using base note 60 (C4) and pattern intervals: `new Set(pattern.intervals.map(i => 60 + rootIndex + i))`. This range (60–82) is visible on all keyboard sizes.
- **Chord matching logic** varies by `handsMode`:
  - For `'left'` and `'right'`: compares `pressedChord?.name()` with `queue[0].chord.name()`
  - For `'both'`: extracts pitch classes from the target chord, then checks that every pitch class is present at least twice (in different octaves) among `pressedNotes`. Formula: `[...targetPCs].every(pc => Array.from(pressedNotes).filter(n => n % 12 === pc).length >= 2)`
- Four `useEffect` hooks:
  1. Regenerate all 5 items when `selectedGroups` or `sharpsFilter` changes
  2. Compute and notify parent of current chord notes when queue changes
  3. Detect chord match and advance queue when `pressedChord`, `pressedNotes`, `handsMode`, or queue changes
  4. Detect if a new chord is pressed during a transition (for chaining matches)

### PracticeConfiguration Component (`PracticeConfiguration.tsx`)
The `PracticeConfiguration` component is a controlled component for selecting which chord groups to practice, which root notes to include, and which hand(s) to use. It displays a grid of toggle buttons for chord patterns, a radio-style group of buttons for the sharps filter, and a radio-style group of buttons for hand selection.

**Features:**
- **Chord Groups section**: Toggle buttons for each chord pattern: Major, Minor, Diminished, Augmented, Sus2, Sus4, Dominant 7, Major 7, Minor 7, Diminished 7, Half-dim 7. Buttons show the chord name and its shorthand (e.g., "Major / maj"). Selected chords are highlighted in red; non-selected are gray. Enforces a minimum of one selected chord group (prevents deselecting the last one). The only-selected chord is visually dimmed to signal it cannot be deselected.
- **Sharps section**: Three mutually-exclusive buttons ("No Sharps", "With Sharps", "Sharps Only") that control which root notes (C–B) appear in generated chords. Exactly one is always selected. Selected button is highlighted in red; others are gray. Radio-style behavior (no minimum enforcement needed).
- **Select Hands section**: Three mutually-exclusive buttons ("Left" with flipped hand icon, "Both Hands" with two hands, "Right" with normal hand icon) that control how chord matching works. Exactly one is always selected. Default is "Right". Uses FontAwesome `faHand` icon with `transform: scaleX(-1)` on the Left button to create a mirrored appearance.

**Props:**
- `config: PracticeConfig` — the current practice configuration object encapsulating `selectedGroups`, `sharpsFilter`, and `handsMode`
- `onPracticeConfigChange: (config: PracticeConfig) => void` — callback fired when the user makes any configuration change (toggles a chord group, selects a sharps filter option, or selects a hands mode). Receives the updated `PracticeConfig` object.

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
