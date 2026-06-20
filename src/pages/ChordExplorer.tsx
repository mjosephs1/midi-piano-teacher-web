import { useState, FC } from 'react';
import { VirtualPiano } from '../midi/VirtualPiano';
import { KEYBOARD_SIZES, KEYBOARD_OFFSETS } from './Settings';
import { CHORD_PATTERNS, NOTE_NAMES } from '../midi/noteUtils';
import './ChordExplorer.css';

export const ChordExplorer: FC = () => {
    const [chordNotes, setChordNotes] = useState<Set<number>>(new Set());
    const [selectedChord, setSelectedChord] = useState<{ rootIndex: number; patternIndex: number } | null>(null);
    const [selectedPatternIndex, setSelectedPatternIndex] = useState(0);

    const BASE_NOTE = KEYBOARD_OFFSETS[KEYBOARD_SIZES[0]];

    const handleChordClick = (rootIndex: number) => {
      const pattern = CHORD_PATTERNS[selectedPatternIndex];
      const rootMidi = BASE_NOTE + rootIndex;
      setChordNotes(new Set(pattern.intervals.map(i => rootMidi + i)));
      setSelectedChord({ rootIndex, patternIndex: selectedPatternIndex });
    };

    const handlePatternChange = (patternIndex: number) => {
      setSelectedPatternIndex(patternIndex);
      if (selectedChord !== null) {
        const pattern = CHORD_PATTERNS[patternIndex];
        const rootMidi = BASE_NOTE + selectedChord.rootIndex;
        setChordNotes(new Set(pattern.intervals.map(i => rootMidi + i)));
        setSelectedChord({ rootIndex: selectedChord.rootIndex, patternIndex });
      }
    };

    const activePattern = CHORD_PATTERNS[selectedPatternIndex];

    return (
      <div className="chord-explorer-page">
        <VirtualPiano
            numKeys={KEYBOARD_SIZES[0]}
            pressedNotes={chordNotes}
            header="Chord Explorer"
            />

        <div className="chord-row-container">
          <div className="chord-group-selector">
            <span className="chord-section-label">Chord Group</span>
            <select
              id="chord-group-select"
              value={selectedPatternIndex}
              onChange={e => handlePatternChange(Number(e.target.value))}
            >
              {CHORD_PATTERNS.map((pattern, pi) => (
                <option key={pattern.name} value={pi}>{pattern.name}</option>
              ))}
            </select>
          </div>

          <div className="chord-buttons-section">
            <span className="chord-section-label">Chord</span>
            <div className="chord-buttons">
              {Array.from({ length: 12 }, (_, ri) => (
                <button
                  key={ri}
                  className={`chord-btn${selectedChord?.rootIndex === ri && selectedChord?.patternIndex === selectedPatternIndex ? ' selected' : ''}`}
                  onClick={() => handleChordClick(ri)}
                >
                  {NOTE_NAMES[ri]}{activePattern.shorthand}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };
