import './App.css';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Home } from './pages/Home';
import { ChordExplorer } from './pages/ChordExplorer';
import { PracticeMode } from './pages/PracticeMode';
import { TimedMode } from './pages/TimedMode';
import { HighScores } from './pages/HighScores';
import { Progress } from './pages/Progress';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'

/* import all the icons in Free Solid, Free Regular, and Brands styles */
import { faGear, faCircleUser, faRankingStar, faChartLine } from '@fortawesome/free-solid-svg-icons'

library.add(faGear, faCircleUser, faRankingStar, faChartLine)


const STORAGE_KEY = 'midiPianoNumKeys';

interface PianoSettings {
  numKeys: number;
  showNotes: boolean;
}

function loadPianoSettings(): PianoSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        const numKeys = typeof parsed.numKeys === 'number' ? parsed.numKeys : 88;
        const showNotes = typeof parsed.showNotes === 'boolean' ? parsed.showNotes : false;
        return { numKeys, showNotes };
      }
    }
  } catch {
    // localStorage unavailable or invalid JSON
  }
  return { numKeys: 88, showNotes: false };
}

const App: FC = () => {
  const [numKeys, setNumKeys] = useState<number>(() => loadPianoSettings().numKeys);
  const [showNotes, setShowNotes] = useState<boolean>(() => loadPianoSettings().showNotes);

  useEffect(() => {
    document.title = 'MIDI Piano Teacher';
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ numKeys, showNotes }));
    } catch {
      // localStorage unavailable, skip persistence
    }
  }, [numKeys, showNotes]);

  return (
    <div className="App">
      <header className="app-header">
        <Link to="/" className="title-link"><h1>MIDI Piano Teacher</h1></Link>
        <nav className="nav-links">
          <Link to="/chord-explorer">Chord Explorer</Link>
          <div className="nav-dropdown">
            <span className="nav-dropdown-trigger">Practice</span>
            <div className="nav-dropdown-menu">
              <Link to="/practice-chords/practice">Practice Mode</Link>
              <Link to="/practice-chords/timed">Timed Mode</Link>
            </div>
          </div>
          <div className="user-menu">
            <button className="settings-button">
              <FontAwesomeIcon icon={faCircleUser} />
            </button>
            <div className="user-menu-dropdown">
              <Link to="/practice-chords/high-scores"><FontAwesomeIcon icon={faRankingStar} /> High Scores</Link>
              <Link to="/practice-chords/progress"><FontAwesomeIcon icon={faChartLine} /> Progress</Link>
            </div>
          </div>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Home numKeys={numKeys} onNumKeysChange={setNumKeys} showNotes={showNotes} onShowNotesChange={setShowNotes} />} />
        <Route path="/chord-explorer" element={<ChordExplorer/>} />
        <Route path="/practice-chords/practice" element={<PracticeMode numKeys={numKeys} onNumKeysChange={setNumKeys} showNotes={showNotes} onShowNotesChange={setShowNotes} />} />
        <Route path="/practice-chords/timed" element={<TimedMode />} />
        <Route path="/practice-chords/high-scores" element={<HighScores />} />
        <Route path="/practice-chords/progress" element={<Progress />} />
      </Routes>
    </div>
  );
};

export default App;
