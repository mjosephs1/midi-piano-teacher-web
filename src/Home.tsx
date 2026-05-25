import type { FC } from 'react';
import { useMidi } from './midi/MidiContext';
import { Piano } from './midi/MidiPiano';
import { noteNumberToName } from './midi/noteUtils';

interface HomeProps {
  numKeys: number;
}

export const Home: FC<HomeProps> = ({ numKeys }) => {
  const { pressedNotes, status } = useMidi();

  const statusMessage = {
    unavailable: 'Web MIDI API not available in your browser',
    denied: 'MIDI access denied. Please check browser permissions.',
    listening: 'Listening...',
  }[status];

  const sortedNotes = Array.from(pressedNotes).sort((a, b) => a - b);
  const noteNames = sortedNotes.map(noteNumberToName).join(' ');

  return (
    <>
      {status !== 'listening' && (
        <p className="status">{statusMessage}</p>
      )}
      <div>
        <Piano numKeys={numKeys} />
      </div>
      {status === 'listening' && (
        <div className="notes-display">
          {noteNames ? <p>{noteNames}</p> : <p className="empty">No notes pressed</p>}
        </div>
      )}
    </>
  );
};
