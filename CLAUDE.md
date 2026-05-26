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

4. **`detectChord()`** (in `src/midi/noteUtils.ts`) detects chord names from pressed MIDI notes:
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
The `VirtualPiano` component renders a visual representation of a piano keyboard using SVG and displays real-time feedback when keys are pressed via MIDI input.

**Features:**
- Renders a scalable piano keyboard with white and black keys
- Uses `useMidi()` hook to get currently-pressed notes and highlights them
- **Scalable**: The `scaleFactor` variable (currently `50`) controls the keyboard size; adjust to resize all keyboard dimensions proportionally
- **Configurable**: The `numKeys` prop (default: 88) controls the total number of keys to display
- **Automatic mapping**: Internally maps total keys to white keys (e.g., 88 keys → 52 white keys)
- **Visual feedback**: Active keys change color when pressed:
  - White keys turn light green (`#90EE90`) when active
  - Black keys turn red (`#FF6B6B`) when active

**Props:**
- `numKeys` (default: `88`) — total number of keys to display on the piano (25, 37, 49, 61, 76, or 88)

**MIDI Offset Mapping:**
The `VirtualPiano` component uses the `KEYBOARD_OFFSETS` map (exported from `src/Settings.tsx`) to correctly align virtual keys with real MIDI note numbers from physical keyboards. Each keyboard size has a starting note, and the offset maps that starting note to the virtual piano's key positions. This ensures that pressing the lowest key on a physical keyboard highlights the leftmost key on the virtual piano.

**Usage:**
```tsx
import { VirtualPiano } from './midi/VirtualPiano';

export const App: FC = () => {
  return <VirtualPiano numKeys={88} />;
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
