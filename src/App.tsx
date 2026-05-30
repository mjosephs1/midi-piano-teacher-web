import './App.css';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Home } from './Home';
import { Settings, KEYBOARD_SIZES } from './Settings';
import { ChordVisualizer } from './ChordVisualizer';
import { PracticeChords } from './PracticeChords';
import { PracticeMode } from './PracticeMode';
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

  return (
    <div className="App">
      <header className="app-header">
        <h1>MIDI Piano Teacher</h1>
        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/chord-visualizer">Chord Visualizer</Link>
          <Link to="/practice-chords">Practice Chords</Link>
          <Link to="/settings" className="settings-link">
            <FontAwesomeIcon icon={faGear} />
            Settings
          </Link>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Home numKeys={numKeys} />} />
        <Route
          path="/settings"
          element={
            <Settings
              numKeys={numKeys}
              onNumKeysChange={setNumKeys}
              keyboardSizes={KEYBOARD_SIZES}
            />
          }
        />
      <Route
          path="/chord-visualizer"
          element={
            <ChordVisualizer/>
          }
        />
        <Route path="/practice-chords" element={<PracticeChords />} />
        <Route path="/practice-chords/practice" element={<PracticeMode numKeys={numKeys} />} />
      </Routes>
    </div>
  );
};

export default App;
