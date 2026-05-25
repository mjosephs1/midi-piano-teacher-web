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
  ├── App.tsx                # Main home page component
  ├── App.css                # App styling
  ├── index.tsx              # React root entry point (wraps App in MidiProvider)
  ├── App.test.tsx           # Tests for App component
  ├── setupTests.ts          # Jest configuration for tests
  ├── reportWebVitals.ts     # Web vitals reporting
  └── midi/
      ├── MidiContext.tsx    # MidiProvider and useMidi() hook
      ├── MidiPiano.tsx      # Visual piano component that displays and animates pressed keys
      ├── MidiPiano.css      # Styling for the piano component
      └── noteUtils.ts       # Utility to convert MIDI note numbers to names
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
   const { pressedNotes, status } = useMidi();
   ```
   - `pressedNotes`: `Set<number>` of MIDI note numbers currently pressed
   - `status`: One of `'listening' | 'denied' | 'unavailable'`

3. **`noteNumberToName()`** (in `src/midi/noteUtils.ts`) converts MIDI note numbers to names:
   - `noteNumberToName(60)` → `"C"`
   - `noteNumberToName(61)` → `"C#"`
   - Uses modulo 12 to get the note class, ignoring octave

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

### Piano Component (`MidiPiano.tsx`)
The `Piano` component renders a visual representation of a piano keyboard using SVG and displays real-time feedback when keys are pressed via MIDI input.

**Features:**
- Renders a scalable piano keyboard with white and black keys
- Uses `useMidi()` hook to get currently-pressed notes and highlights them
- **Scalable**: The `scaleFactor` variable (currently `50`) controls the keyboard size; adjust to resize all keyboard dimensions proportionally
- **Configurable**: The `numWhiteKeys` prop (default: 21) controls how many white keys to display
- **Visual feedback**: Active keys change color when pressed:
  - White keys turn light green (`#90EE90`) when active
  - Black keys turn red (`#FF6B6B`) when active

**Props:**
- `numWhiteKeys` (default: `21`) — number of white keys to display on the piano

**Usage:**
```tsx
import { Piano } from './midi/MidiPiano';

export const App: FC = () => {
  return <Piano numWhiteKeys={21} />;
};
```

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
