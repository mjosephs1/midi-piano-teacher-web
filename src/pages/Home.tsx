import type { FC } from 'react';
import { useMidi } from '../midi/MidiContext';
import { VirtualPiano } from '../midi/VirtualPiano';
import { noteNumberToName } from '../midi/noteUtils';
import { NoteText } from '../components/NoteText';
import { useAccidental } from '../context/AccidentalContext';

interface HomeProps {
  numKeys: number;
  onNumKeysChange: (numKeys: number) => void;
  showNotes: boolean;
  onShowNotesChange: (showNotes: boolean) => void;
}

export const Home: FC<HomeProps> = ({ numKeys, onNumKeysChange, showNotes, onShowNotesChange }) => {
  const { pressedNotes, status, pressedChord } = useMidi();
  const { accidentalStyle } = useAccidental();

  const statusMessage = {
    unavailable: 'Web MIDI API not available in your browser',
    denied: 'MIDI access denied. Please check browser permissions.',
    listening: 'Listening...',
  }[status];

  const sortedNotes = Array.from(pressedNotes).sort((a, b) => a - b);
  const noteNames = sortedNotes.map(n => noteNumberToName(n, accidentalStyle)).join(' ');

  return (
    <>
      {status !== 'listening' && (
        <p className="status">{statusMessage}</p>
      )}
      <div>
        <VirtualPiano numKeys={numKeys} pressedNotes={pressedNotes} header="MIDI Piano Teacher" showSettings={true} onNumKeysChange={onNumKeysChange} showNotes={showNotes} onShowNotesChange={onShowNotesChange} />
      </div>
      {status === 'listening' && (
        <div className="notes-display">
          <div className="notes-section">
            {noteNames ? <p><NoteText text={noteNames} /></p> : <p className="empty">Play Something!</p>}
          </div>
          <div className="chord-section">
            <p>{pressedChord ? <NoteText text={pressedChord.name(accidentalStyle)} /> : ' '}</p>
          </div>
        </div>
      )}
    </>
  );
};
