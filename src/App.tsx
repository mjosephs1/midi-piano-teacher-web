import './App.css';
import type { FC } from 'react';
import { useEffect } from 'react';
import { useMidi } from './midi/MidiContext';
import { Piano } from './midi/MidiPiano'
import { noteNumberToName } from './midi/noteUtils';

const App: FC = () => {
  const { pressedNotes, status } = useMidi();

  useEffect(() => {
    document.title = 'MIDI Piano Teacher';
  }, []);

  const statusMessage = {
    unavailable: 'Web MIDI API not available in your browser',
    denied: 'MIDI access denied. Please check browser permissions.',
    listening: 'Listening...',
  }[status];

  const sortedNotes = Array.from(pressedNotes).sort((a, b) => a - b);
  const noteNames = sortedNotes.map(noteNumberToName).join(' ');

  return (
    <div className="App">
      <h1>MIDI Piano Teacher</h1>
      {status !== 'listening' && (
        <p className="status">{statusMessage}</p>
      )}
      <div>
        <Piano />
      </div>
      {status === 'listening' && (
        <div className="notes-display">
          {noteNames ? <p>{noteNames}</p> : <p className="empty">No notes pressed</p>}
        </div>
      )}
    </div>
  );
};

export default App;
