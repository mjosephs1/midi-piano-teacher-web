# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a MIDI Piano Teacher web application built with React 19, TypeScript, and Create React App. The project aims to provide interactive piano instruction using MIDI input.

## Development Commands

### Running the development server
```bash
npm start
```
- Launches the app at http://localhost:3000 with hot reloading
- Changes to source files will automatically reload the page

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
  ├── App.tsx                # Main component
  ├── App.css                # App styling
  ├── index.tsx              # React root entry point
  ├── App.test.tsx           # Tests for App component
  ├── setupTests.ts          # Jest configuration for tests
  └── reportWebVitals.ts     # Web vitals reporting
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

## Notes for Development

- The project is in early stages with only boilerplate set up
- As features are added, establish clear patterns for:
  - Component organization (feature-based vs. component-type based directories)
  - State management if needed (Context API, Redux, Zustand, etc.)
  - MIDI input handling and music theory utilities
- React Strict Mode is enabled in index.tsx to help catch potential bugs
- Always add type annotations to component props and function parameters
