import './App.css';
import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Home } from './Home';
import { Settings, KEYBOARD_SIZES } from './Settings';
import { ChordVisualizer } from './ChordVisualizer';
import { PracticeMode } from './PracticeMode';
import { TimedMode } from './TimedMode';
import { HighScores } from './HighScores';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'

/* import all the icons in Free Solid, Free Regular, and Brands styles */
import { faGear } from '@fortawesome/free-solid-svg-icons'

library.add(faGear)


const STORAGE_KEY = 'midiPianoNumKeys';

const App: FC = () => {
  const [numKeys, setNumKeys] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed)) return parsed;
      }
    } catch {
      // localStorage unavailable
    }
    return 88;
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'MIDI Piano Teacher';
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(numKeys));
    } catch {
      // localStorage unavailable, skip persistence
    }
  }, [numKeys]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsWrapperRef.current && !settingsWrapperRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="App">
      <header className="app-header">
        <h1>MIDI Piano Teacher</h1>
        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/chord-visualizer">Chord Visualizer</Link>
          <div className="nav-dropdown">
            <span className="nav-dropdown-trigger">Practice</span>
            <div className="nav-dropdown-menu">
              <Link to="/practice-chords/practice">Practice Mode</Link>
              <Link to="/practice-chords/timed">Timed Mode</Link>
              <Link to="/practice-chords/tempo">Tempo Mode</Link>
            </div>
          </div>
        </nav>
        <div className="settings-wrapper" ref={settingsWrapperRef}>
          <button
            className="settings-button"
            onClick={() => setSettingsOpen(prev => !prev)}
            aria-expanded={settingsOpen}
          >
            <FontAwesomeIcon icon={faGear} />
            Settings
          </button>
          {settingsOpen && (
            <div className="settings-panel">
              <Settings
                numKeys={numKeys}
                onNumKeysChange={setNumKeys}
                keyboardSizes={KEYBOARD_SIZES}
              />
            </div>
          )}
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Home numKeys={numKeys} />} />
        <Route path="/chord-visualizer" element={<ChordVisualizer/>} />
<Route path="/practice-chords/practice" element={<PracticeMode numKeys={numKeys} />} />
        <Route path="/practice-chords/timed" element={<TimedMode />} />
        <Route path="/practice-chords/high-scores" element={<HighScores />} />
      </Routes>
    </div>
  );
};

export default App;
