import './App.css';
import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Home } from './pages/Home';
import { ChordExplorer } from './pages/ChordExplorer';
import { PracticeMode } from './pages/PracticeMode';
import { TimedMode } from './pages/TimedMode';
import { HighScores } from './pages/HighScores';
import { Progress } from './pages/Progress';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faGear, faCircleUser, faRankingStar, faChartLine, faVolumeHigh, faVolumeXmark } from '@fortawesome/free-solid-svg-icons'
import { useStorage } from './context/StorageContext';
import { useMidi } from './midi/MidiContext';
import { useAccidental } from './context/AccidentalContext';
import { NoteText } from './components/NoteText';

library.add(faGear, faCircleUser, faRankingStar, faChartLine, faVolumeHigh, faVolumeXmark)

const App: FC = () => {
  const { loadSettings, saveSettings, error } = useStorage();
  const { soundEnabled, setSoundEnabled } = useMidi();
  const { accidentalStyle, setAccidentalStyle } = useAccidental();
  const [numKeys, setNumKeys] = useState<number>(88);
  const [showNotes, setShowNotes] = useState<boolean>(false);
  const settingsLoadedRef = useRef(false);

  useEffect(() => {
    document.title = 'MIDI Piano Teacher';
  }, []);

  useEffect(() => {
    loadSettings().then(settings => {
      setNumKeys(settings.numKeys);
      setShowNotes(settings.showNotes);
      settingsLoadedRef.current = true;
    }).catch(() => {
      settingsLoadedRef.current = true;
    });
  }, [loadSettings]);

  useEffect(() => {
    if (!settingsLoadedRef.current) return;
    saveSettings({ numKeys, showNotes });
  }, [numKeys, showNotes, saveSettings]);

  return (
    <div className="App">
      {error && <div className="storage-error-banner">{error}</div>}
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
          <div className="nav-actions">
            <div className="accidental-toggle">
              <button
                className={`accidental-toggle-btn${accidentalStyle === 'sharp' ? ' active' : ''}`}
                onClick={() => setAccidentalStyle('sharp')}
                title="Show sharps"
              ><NoteText text="♯" raised={false} /></button>
              <span className="accidental-toggle-divider">/</span>
              <button
                className={`accidental-toggle-btn${accidentalStyle === 'flat' ? ' active' : ''}`}
                onClick={() => setAccidentalStyle('flat')}
                title="Show flats"
              ><NoteText text="♭" raised={false} /></button>
            </div>
            <button
              className="settings-button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute' : 'Unmute'}
            >
              <FontAwesomeIcon icon={soundEnabled ? faVolumeHigh : faVolumeXmark} />
            </button>
            <div className="user-menu">
              <button className="settings-button">
                <FontAwesomeIcon icon={faCircleUser} />
              </button>
              <div className="user-menu-dropdown">
                <Link to="/practice-chords/high-scores"><FontAwesomeIcon icon={faRankingStar} /> High Scores</Link>
                <Link to="/practice-chords/progress"><FontAwesomeIcon icon={faChartLine} /> Progress</Link>
              </div>
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
