import { useState, FC } from 'react';
import { VirtualPiano } from '../midi/VirtualPiano';
import { KEYBOARD_SIZES, KEYBOARD_OFFSETS } from './Settings';
import { CHORD_PATTERNS, NOTE_NAMES } from '../midi/noteUtils';
import './ChordVisualizer.css';

export const ChordVisualizer: FC = ({}) => {
    const [chordNotes, setChordNotes] = useState<Set<number>>(new Set());
    const [selectedChord, setSelectedChord] = useState<{ rootIndex: number; patternIndex: number } | null>(null);

    const BASE_NOTE = KEYBOARD_OFFSETS[KEYBOARD_SIZES[0]];

    const handleChordClick = (rootIndex: number, patternIndex: number) => {
      const pattern = CHORD_PATTERNS[patternIndex];
      const rootMidi = BASE_NOTE + rootIndex;
      setChordNotes(new Set(pattern.intervals.map(i => rootMidi + i)));
      setSelectedChord({ rootIndex, patternIndex });
    };

    return (
      <div className="chord-visualizer-page">
        <h2>Chord Visualizer</h2>
        <VirtualPiano
            numKeys={KEYBOARD_SIZES[0]}
            pressedNotes={chordNotes}/>

        <div className="chord-grid">
          {CHORD_PATTERNS.map((pattern, pi) => (
            <div key={pattern.name} className="chord-row">
              <span className="chord-row-label">{pattern.name}</span>
              {Array.from({ length: 12 }, (_, ri) => (
                <button
                  key={ri}
                  className={`chord-btn${selectedChord?.rootIndex === ri && selectedChord?.patternIndex === pi ? ' selected' : ''}`}
                  onClick={() => handleChordClick(ri, pi)}
                >
                  {NOTE_NAMES[ri]}{pattern.shorthand}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };
  