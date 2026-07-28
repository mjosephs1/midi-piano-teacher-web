import { useState, FC } from 'react';
import { VirtualPiano } from '../midi/VirtualPiano';
import { KEYBOARD_SIZES, KEYBOARD_OFFSETS } from './Settings';
import { CHORD_GROUPS, INVERSION_LABELS, NOTE_NAMES, Chord } from '../midi/noteUtils';
import './ChordExplorer.css';

const invertIntervals = (intervals: number[], inversion: number): number[] => [
  ...intervals.slice(inversion),
  ...intervals.slice(0, inversion).map(i => i + 12),
];

export const ChordExplorer: FC = () => {
    const [chordNotes, setChordNotes] = useState<Set<number>>(new Set());
    const [selectedChord, setSelectedChord] = useState<Chord | null>(null);
    const [selectedChordGroupIndex, setSelectedChordGroupIndex] = useState(0);
    const [selectedInversion, setSelectedInversion] = useState(0);

    const BASE_NOTE = KEYBOARD_OFFSETS[KEYBOARD_SIZES[0]];

    const activeChordGroup = CHORD_GROUPS[selectedChordGroupIndex];

    const updateDisplayedChord = (chordGroupIndex: number, inversion: number, rootIndex?: number) => {
      setSelectedChordGroupIndex(chordGroupIndex);
      setSelectedInversion(inversion);

      const effectiveRootIndex = rootIndex ?? (selectedChord ? NOTE_NAMES.indexOf(selectedChord.rootNote) : undefined);
      if (effectiveRootIndex === undefined) return;

      const rootMidi = BASE_NOTE + effectiveRootIndex;
      const chordGroup = CHORD_GROUPS[chordGroupIndex];
      const rawNotes = invertIntervals(chordGroup.intervals, inversion).map(i => rootMidi + i);
      const octaveShift = Math.min(...rawNotes) >= BASE_NOTE + 12 ? -12 : 0;
      setChordNotes(new Set(rawNotes.map(note => note + octaveShift)));
      setSelectedChord(new Chord(NOTE_NAMES[effectiveRootIndex], chordGroup.name, inversion));
    };

    const handleChordClick = (rootIndex: number) => {
      updateDisplayedChord(selectedChordGroupIndex, selectedInversion, rootIndex);
    };

    const handleChordGroupChange = (chordGroupIndex: number) => {
      const chordGroup = CHORD_GROUPS[chordGroupIndex];
      const nextInversion = selectedInversion > chordGroup.intervals.length - 1 ? 0 : selectedInversion;
      updateDisplayedChord(chordGroupIndex, nextInversion);
    };

    const handleInversionChange = (inversion: number) => {
      updateDisplayedChord(selectedChordGroupIndex, inversion);
    };

    return (
      <div className="chord-explorer-page">
        <VirtualPiano
            numKeys={KEYBOARD_SIZES[0]}
            pressedNotes={chordNotes}
            header="Chord Explorer"
            />

        <div className="chord-row-container">
          <div className="chord-selectors-row">
            <div className="chord-group-selector">
              <span className="chord-section-label">Chord Group</span>
              <select
                id="chord-group-select"
                value={selectedChordGroupIndex}
                onChange={e => handleChordGroupChange(Number(e.target.value))}
              >
                {CHORD_GROUPS.map((chordGroup, ci) => (
                  <option key={chordGroup.name} value={ci}>{chordGroup.name}</option>
                ))}
              </select>
            </div>

            <div className="chord-inversion-selector">
              <span className="chord-section-label">Inversion</span>
              <select
                id="chord-inversion-select"
                value={selectedInversion}
                onChange={e => handleInversionChange(Number(e.target.value))}
              >
                {Array.from({ length: activeChordGroup.intervals.length }, (_, i) => i).map(inversion => (
                  <option key={inversion} value={inversion}>{INVERSION_LABELS[inversion]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="chord-buttons-section">
            <span className="chord-section-label">Chord</span>
            <div className="chord-buttons">
              {Array.from({ length: 12 }, (_, ri) => (
                <button
                  key={ri}
                  className={`chord-btn${selectedChord?.rootNote === NOTE_NAMES[ri] && selectedChord?.patternName === activeChordGroup.name ? ' selected' : ''}`}
                  onClick={() => handleChordClick(ri)}
                >
                  {NOTE_NAMES[ri]}{activeChordGroup.shorthand}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };
