# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a MIDI Piano Teacher web application built with React 19, TypeScript, and Create React App. The project aims to provide interactive piano instruction using MIDI input.

## Development Commands

### Running the development server
```bash
npm start
```
- Starts the dev server at http://localhost:3000 (browser opens manually)
- Changes to source files will automatically reload the page
- The browser does not open automatically; navigate to http://localhost:3000 manually

### Running tests
```bash
npm test
```
- Launches the test runner in interactive watch mode
- Run specific test files by pressing `p` to filter, then enter the filename
- Press `a` to run all tests

### Building for production
```bash
npm run build
```
- Creates an optimized production build in the `build/` folder
- Output is minified with hashed filenames

## Project Structure

```
src/
  ├── App.tsx                # Main router and layout component
  ├── App.css                # App styling
  ├── Home.tsx               # Home page route with piano display
  ├── Settings.tsx           # Settings page route
  ├── Settings.css           # Settings page styling
  ├── ChordVisualizer.tsx    # Chord visualizer page with interactive chord button grid
  ├── ChordVisualizer.css    # Styling for the chord visualizer page
  ├── PracticeChords.tsx     # Practice Chords hub page with practice mode buttons
  ├── PracticeChords.css     # Styling for the Practice Chords page
  ├── PracticeMode.tsx       # Practice Mode page — displays target chord and advancing queue
  ├── PracticeMode.css       # Styling for the Practice Mode page
  ├── TimedMode.tsx          # Timed Mode page — initial page with Play and Configure buttons
  ├── TimedMode.css          # Styling for the Timed Mode page
  ├── ChordQueue.tsx         # Component displaying 5 advancing chord cards
  ├── ChordQueue.css         # Styling for the chord queue component
  ├── PracticeConfiguration.tsx  # Controlled component for selecting practice chord groups
  ├── PracticeConfiguration.css  # Styling for practice configuration component
  ├── index.tsx              # React root entry point (wraps app in Router and MidiProvider)
  ├── App.test.tsx           # Tests for App component
  ├── setupTests.ts          # Jest configuration for tests
  ├── reportWebVitals.ts     # Web vitals reporting
  └── midi/
      ├── MidiContext.tsx    # MidiProvider and useMidi() hook
      ├── VirtualPiano.tsx   # Visual piano component that displays and animates pressed keys
      ├── VirtualPiano.css   # Styling for the piano component
      └── noteUtils.ts       # Utilities: note number to name conversion and chord detection
public/
  ├── index.html             # HTML entry point (served by dev server)
  └── [other static assets]
package.json                 # Dependencies and scripts
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
   const { pressedNotes, status, pressedChords } = useMidi();
   ```
   - `pressedNotes`: `Set<number>` of MIDI note numbers currently pressed
   - `status`: One of `'listening' | 'denied' | 'unavailable'`
   - `pressedChords`: `string | null` — the name of the detected chord (e.g., `"C Major"`), or `null` if no valid chord is pressed

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
     - Static constant `STORAGE_KEY = 'midiPianoPracticeConfig'` — used by both PracticeMode and TimedMode for globally-shared settings persistence
     - `toJson()`: Returns a plain object with serializable fields for localStorage storage
     - `toString()`: Returns a deterministic string key (e.g., `"Major,Minor|with-sharps|right"`) for use as a history key in localStorage. Sorts `selectedGroups` to ensure consistent keys regardless of selection order.
     - `fromJson(data)`: Static method that validates and deserializes from a plain object; returns `PracticeConfig | null`
   - `TIMED_HISTORY_KEY` constant: `'midiPianoTimedHistory'` — used by TimedMode to store result history in localStorage
   - `TimedResult` type: Object with `score: number`, `mistakes: number`, and `timestamp: string` (ISO 8601 format)
   - `TimedHistory` type: Object with config string keys mapping to arrays of `TimedResult` entries
   - All exported from `src/midi/noteUtils.ts`. Used by `PracticeConfiguration`, `ChordQueue`, and both practice mode components to pass configuration consistently.

5. **`detectChord()`** (in `src/midi/noteUtils.ts`) detects chord names from pressed MIDI notes:
   - Takes a `Set<number>` of MIDI note numbers and returns a chord name string or `null`
   - Returns `null` if fewer than 3 unique pitch classes are pressed
   - Normalizes notes to pitch classes (modulo 12) and tries each as a potential root
   - Matches intervals against known chord patterns: Major, Minor, Diminished, Augmented, Sus2, Sus4, and 7th variants (Major 7, Dominant 7, Minor 7, Diminished 7, Half-dim 7)
   - Returns chord name with root (e.g., `"C Major"`, `"D Minor 7"`)
   - Handles inversions correctly (e.g., first-inversion C Major [E, G, C] returns `"C Major"`)

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
- **Scalable**: The `scaleFactor` variable (currently `50`) controls the keyboard size; adjust to resize all keyboard dimensions proportionally
- **Configurable**: The `numKeys` prop (default: 88) controls the total number of keys to display
- **Automatic mapping**: Internally maps total keys to white keys (e.g., 88 keys → 52 white keys)
- **Visual feedback**: Active keys change color when pressed:
  - White keys turn light green (`#90EE90`) when active
  - Black keys turn red (`#FF6B6B`) when active

**Props:**
- `numKeys` (default: `88`) — total number of keys to display on the piano (25, 37, 49, 61, 76, or 88)
- `pressedNotes` (default: `new Set()`) — a `Set<number>` of MIDI note numbers that are currently pressed

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

Alternatively, to use the piano without MIDI input (e.g., for demos or programmatic control):
```tsx
import { VirtualPiano } from './midi/VirtualPiano';

export const Demo: FC = () => {
  const highlightedNotes = new Set([60, 64, 67]); // C major chord
  return <VirtualPiano numKeys={88} pressedNotes={highlightedNotes} />;
};
```

### Routing Architecture

The app uses **React Router** for client-side routing. The structure is:

1. **`index.tsx`** wraps the app in `<BrowserRouter>` to enable routing
2. **`App.tsx`** contains:
   - The header with navigation links (`<Link>` components)
   - State management for `numKeys` (keyboard size preference)
   - The `<Routes>` definition with all application routes
3. **Routes:**
   - `/` → `<Home>` component
   - `/settings` → `<Settings>` component
   - `/chord-visualizer` → `<ChordVisualizer>` component
   - `/practice-chords` → `<PracticeChords>` component (hub page)
   - `/practice-chords/practice` → `<PracticeMode>` component

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
The `Settings` component provides a user interface for selecting keyboard size. It is a controlled component that receives the current setting and a change callback as props.

**Features:**
- Dropdown with 6 preset keyboard sizes: 25, 37, 49, 61, 76, 88 keys
- Shows user-friendly labels ("25 keys", "88 keys", etc.)
- Current selection is always displayed in the dropdown

**Props:**
- `numKeys: number` — the currently selected total key count
- `onNumKeysChange: (numKeys: number) => void` — callback when user selects a different size
- `keyboardSizes: readonly number[]` — array of available total key counts

**Helper function:**
- `getWhiteKeysFromTotalKeys(numKeys: number): number` — converts total keys to white keys for internal use in `Piano`

**State Management:**
The `Settings` component has no local state. The parent `App.tsx` owns the `numKeys` state:
- Initial value is read from `localStorage` (key: `midiPianoNumKeys`) on component mount
- Default value is 88 keys
- On every change, the new value is persisted to `localStorage`
- Both localStorage reads and writes are wrapped in try/catch to handle unavailability (e.g., private browsing)

### ChordVisualizer Component (`ChordVisualizer.tsx`)
The `ChordVisualizer` component provides an interactive tool for exploring chord fingerings on the piano. It displays a grid of chord buttons that, when clicked, highlight the corresponding notes on a 25-key virtual piano.

**Features:**
- Interactive grid of chord buttons organized by chord type (rows) and root note (columns)
- 11 chord types: Major, Minor, Major 7, Dominant 7, Minor 7, Diminished, Diminished 7, Half-dim 7, Augmented, Sus2, Sus4
- 12 root notes per chord type: C through B (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
- Real-time visual feedback on the virtual piano when a chord button is selected
- Selected chord button is highlighted to show active selection

**State:**
- `chordNotes: Set<number>` — MIDI note numbers to display on the piano
- `selectedChord: { rootIndex: number; patternIndex: number } | null` — tracks the currently selected button for highlighting

**Implementation:**
The component uses `KEYBOARD_OFFSETS[KEYBOARD_SIZES[0]]` (which equals 60, middle C) as the base note. When a chord button is clicked:
1. The root note is calculated as `BASE_NOTE + rootIndex`
2. The chord pattern's intervals are applied: `pattern.intervals.map(i => rootMidi + i)`
3. The resulting note set is passed to the `VirtualPiano` component for display

**Route:**
- `/chord-visualizer` (registered in `App.tsx`)

### PracticeChords Component (`PracticeChords.tsx`)
The `PracticeChords` component is a hub page that provides navigation to different practice modes. It displays a vertical list of buttons linking to different practice modes.

**Features:**
- Hub page with three practice mode buttons: Practice, Timed Mode, and Tempo Mode
- Each button links to a practice mode page (Practice and Timed are implemented; Tempo is a future placeholder)
- Minimal, self-contained component with no MIDI integration or state management

**State:**
- None — this is a presentation component with no local state

**Route:**
- `/practice-chords` (registered in `App.tsx`)
- Implemented sub-routes:
  - `/practice-chords/practice` → `<PracticeMode>` (active practice mode)
  - `/practice-chords/timed` → `<TimedMode>` (timed practice mode)
- Future sub-routes (placeholder):
  - `/practice-chords/tempo` — future Tempo Mode

### PracticeMode Component (`PracticeMode.tsx`)
The `PracticeMode` component is a practice page where users advance through a queue of chords by playing them on their MIDI keyboard. It displays a visual piano showing the target chord, a queue of 5 upcoming chords, and controls for selecting which chord groups to include in the practice session.

**Features:**
- Displays a `VirtualPiano` showing the fingering for the current target chord (static display, not live MIDI)
- Shows a horizontal queue of 5 chord cards; the leftmost card is the target to play
- When the user plays the target chord on their MIDI keyboard, the queue advances (target disappears, new chord added on the right)
- Includes a `PracticeConfiguration` panel toggled by a gear icon button for selecting chord groups, sharps filter, and hands mode
- Settings persist globally via `localStorage` (shared across PracticeMode and TimedMode) as a serialized `PracticeConfig` object

**Props:**
- `numKeys: number` — the selected keyboard size from parent `App.tsx`

**State:**
- `config: PracticeConfig` — encapsulates `selectedGroups`, `sharpsFilter`, and `handsMode` in a single object. Initialized from global `PracticeConfig.STORAGE_KEY` with defaults `new Set(['Major'])`, `'with-sharps'`, and `'right'` respectively. Serialized and persisted on every change.
- `currentChordNotes: Set<number>` — MIDI note numbers for the current target chord, set by the `ChordQueue` component and passed to `VirtualPiano`
- `configOpen: boolean` — controls visibility of the `PracticeConfiguration` modal

**Route:**
- `/practice-chords/practice` (registered in `App.tsx`)

### TimedMode Component (`TimedMode.tsx`)
The `TimedMode` component is a timed practice mode that uses a four-stage state machine to control the user flow: CONFIGURE → COUNTDOWN → STARTED → RESULTS. Users configure chord groups, trigger a countdown, play chords for 60 seconds while their score increments, and then view results with options to play again or reconfigure.

**State Machine Stages:**
- **CONFIGURE**: Initial configuration screen with `PracticeConfiguration` and "Start" button.
- **COUNTDOWN**: 4-second countdown with fading text ("3", "2", "1", "Begin"). Each step animates with a fade-in/fade-out effect.
- **STARTED**: Active game session showing HUD (Stop button, Timer, Score) and `ChordQueue`. Timer counts down from 60 seconds. Each matched chord increments score.
- **RESULTS**: Final score display with options to "Try Again" (returns to COUNTDOWN) or "Back" (returns to CONFIGURE).

**Props:**
- None — TimedMode is self-contained and does not receive props from parent

**State:**
- `config: PracticeConfig` — encapsulates `selectedGroups`, `sharpsFilter`, and `handsMode` in a single object. Initialized from global `PracticeConfig.STORAGE_KEY` (shared with PracticeMode) with defaults `new Set(['Major'])`, `'with-sharps'`, and `'right'` respectively. Serialized and persisted on every change.
- `stage: TimedStage` — one of `'CONFIGURE' | 'COUNTDOWN' | 'STARTED' | 'RESULTS'`. Controls which UI is rendered.
- `countdownStep: number` — 0–3, indexes into `['3', '2', '1', 'Begin']`. Incremented every second during COUNTDOWN.
- `timeLeft: number` — starts at 60, decrements every second during STARTED. When it reaches 0, transitions to RESULTS.
- `score: number` — incremented by 1 each time `ChordQueue` calls the `onChordMatched` callback. Reset to 0 when entering STARTED.
- `mistakes: number` — incremented by 1 each time `ChordQueue` calls the `onChordMistake` callback. Reset to 0 when entering STARTED.

**Timers:**
- **Countdown timer**: `setInterval` fires every 1 second, increments `countdownStep`. When `countdownStep` reaches 3 ("Begin"), the next second triggers transition to STARTED.
- **Game timer**: `setInterval` fires every 1 second, decrements `timeLeft`. When `timeLeft` reaches 0, transitions to RESULTS.

**Result History:**
- When entering RESULTS stage, each run's `score`, `mistakes`, and timestamp are automatically saved to localStorage under `TIMED_HISTORY_KEY` (`'midiPianoTimedHistory'`)
- History is keyed by `config.toString()` (e.g., `"Major|with-sharps|right"`) so that results are grouped by configuration
- Multiple runs with the same config append new entries to the same array; different configs create separate entries
- History persists across sessions and can be viewed in browser DevTools (Application → Local Storage → `midiPianoTimedHistory`)

**Route:**
- `/practice-chords/timed` (registered in `App.tsx`)

### ChordQueue Component (`ChordQueue.tsx`)
The `ChordQueue` component displays a horizontal row of 5 chord cards. It maintains a queue of random chords from the selected chord groups and detects when the user plays the target (leftmost) chord, advancing the queue.

**Features:**
- Displays 5 chord cards in a horizontal flex row
- The leftmost card (current target) is highlighted in red and scaled up
- Listens to `pressedChords` from `useMidi()` hook to detect when user plays the target chord
- On match, advances the queue: removes the leftmost card and appends a new random card on the right
- Regenerates all 5 cards when `config.selectedGroups` or `config.sharpsFilter` changes
- Prevents immediate re-triggering by excluding the just-matched chord from the new random generation

**Props:**
- `config: PracticeConfig` — encapsulates practice settings: `selectedGroups` (set of chord group names to sample from), `sharpsFilter` (controls available root notes: `'no-sharps'` excludes C#, D#, F#, G#, A# (indices 1, 3, 6, 8, 10); `'sharps-only'` keeps only those; `'with-sharps'` allows all 12), and `handsMode` (controls chord matching: `'left'` or `'right'` matches by chord name; `'both'` requires each pitch class appear at least twice in different octaves)
- `onCurrentChordChange: (notes: Set<number>) => void` — callback fired when the target chord changes (on mount, after advance, or when config changes). Receives the MIDI note set for the target chord.
- `onChordMatched?: () => void` — optional callback fired when the user successfully plays the target chord. Fired just before the queue advances.
- `onChordMistake?: () => void` — optional callback fired when the user plays a chord that doesn't match the target.

**Implementation Details:**
- Uses a helper function `generateChordItem(selectedGroups, sharpsFilter, exclude?)` to randomly select a `{ rootIndex, patternName }` from the enabled chord groups and available root indices. The optional `exclude` parameter prevents re-generating the same chord name.
- Helper function `getAvailableRootIndices(sharpsFilter)` returns the set of available root indices (0–11) based on the filter.
- Computes MIDI note numbers using base note 60 (C4) and pattern intervals: `new Set(pattern.intervals.map(i => 60 + rootIndex + i))`. This range (60–82) is visible on all keyboard sizes.
- **Chord matching logic** varies by `handsMode`:
  - For `'left'` and `'right'`: compares `pressedChords` string (e.g., `"G Minor"`) with target name `NOTE_NAMES[rootIndex] + " " + patternName`
  - For `'both'`: extracts pitch classes from the target chord, then checks that every pitch class is present at least twice (in different octaves) among `pressedNotes`. Formula: `[...targetPCs].every(pc => Array.from(pressedNotes).filter(n => n % 12 === pc).length >= 2)`
- Four `useEffect` hooks:
  1. Regenerate all 5 items when `selectedGroups` or `sharpsFilter` changes
  2. Compute and notify parent of current chord notes when queue changes
  3. Detect chord match and advance queue when `pressedChords`, `pressedNotes`, `handsMode`, or queue changes
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

**Usage in PracticeMode and TimedMode:**
The `PracticeConfiguration` is placed inside a collapsible panel (toggled by a gear icon button) in `PracticeMode`, and on the main CONFIGURE screen in `TimedMode`. When the user changes selections, the callback updates parent state with a new `PracticeConfig` object, which triggers `ChordQueue` to regenerate its 5 items and adjust matching behavior based on the new settings.

---

## Notes for Development

- React Strict Mode is enabled in index.tsx to help catch potential bugs
- Always add type annotations to component props and function parameters
- Web MIDI API types are declared inline in `MidiContext.tsx` (not from a package) for simplicity

## Maintaining CLAUDE.md

After every code change, update CLAUDE.md if the change warrants it. Specifically:
- **Update Project Structure** if you add, delete, or move files or directories
- **Update Architecture Notes** if you add a new architectural pattern, change a core pattern, or modify how components communicate
- **Update MIDI Architecture** if you modify the MIDI system or add new MIDI features
- **Update Development Commands** if you modify scripts in package.json or change how to run the project
- **Add to Notes for Development** if you establish a new convention, pattern, or constraint that future Claude sessions should know about

Keep the documentation in sync with the code so that future work proceeds with accurate context.
