import { FC, useState, useEffect, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faGear, faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { PracticeConfig, Chord } from '../midi/noteUtils';
import { KEYBOARD_OFFSETS } from './Settings';
import { useMidi } from '../midi/MidiContext';
import { VirtualPiano } from '../midi/VirtualPiano';
import { ChordQueue } from '../components/ChordQueue';
import { PracticeConfiguration } from '../components/PracticeConfiguration';
import './PracticeMode.css';

library.add(faGear, faChevronUp, faChevronDown);

function clampToKeyboard(chord: Chord, baseNote: number, pianoLow: number, pianoHigh: number): number {
  const notes = Array.from(chord.getNoteIndices(baseNote));
  if (notes.length === 0) return baseNote;
  const minNote = Math.min(...notes);
  const maxNote = Math.max(...notes);
  if (minNote < pianoLow) return baseNote + Math.ceil((pianoLow - minNote) / 12) * 12;
  if (maxNote > pianoHigh) return baseNote - Math.ceil((maxNote - pianoHigh) / 12) * 12;
  return baseNote;
}

interface PracticeModeProps {
  numKeys: number;
}

export const PracticeMode: FC<PracticeModeProps> = ({ numKeys }) => {
  const [config, setConfig] = useState<PracticeConfig>(() => {
    try {
      const stored = localStorage.getItem(PracticeConfig.STORAGE_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        const loaded = PracticeConfig.fromJson(parsed);
        if (loaded) return loaded;
      }
    } catch {
      // localStorage unavailable or invalid JSON
    }
    return new PracticeConfig();
  });

  const { pressedNotes } = useMidi();
  const [currentChord, setCurrentChord] = useState<Chord | null>(null);
  const [octaveOffset, setOctaveOffset] = useState(0);
  const [configOpen, setConfigOpen] = useState(false);
  const configWrapperRef = useRef<HTMLDivElement>(null);

  // calculate where to place the notes for the current chord so that it fits within the bounds of the virtual piano
  const leftDefault = Math.max(36, KEYBOARD_OFFSETS[numKeys] ?? 21);
  const defaultBase = config.handsMode === 'left' ? leftDefault : 72;
  const baseNote = defaultBase + octaveOffset * 12;
  const pianoLow = KEYBOARD_OFFSETS[numKeys] ?? 21;
  const pianoHigh = pianoLow + numKeys - 1;
  const effectiveBase = currentChord ? clampToKeyboard(currentChord, baseNote, pianoLow, pianoHigh) : baseNote;
  const currentChordNotes = currentChord ? currentChord.getNoteIndices(effectiveBase) : new Set<number>();

  useEffect(() => {
    setOctaveOffset(0);
  }, [config.handsMode, numKeys]);

  useEffect(() => {
    try {
      localStorage.setItem(PracticeConfig.STORAGE_KEY, JSON.stringify(config.toJson()));
    } catch {
      // localStorage unavailable
    }
  }, [config]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (configWrapperRef.current && !configWrapperRef.current.contains(e.target as Node)) {
        setConfigOpen(false);
      }
    };
    if (configOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [configOpen]);

  const handleCurrentChordChange = useCallback((chord: Chord) => {
    setCurrentChord(chord);
  }, []);

  return (
    <div className="practice-mode-page">
      {configOpen && (
        <div className="practice-config-backdrop" onClick={() => setConfigOpen(false)} />
      )}
      <div className="practice-mode-title-row">
        <h2>Practice Mode</h2>
        <div className="practice-config-wrapper" ref={configWrapperRef}>
          <button
            className="practice-config-button"
            onClick={() => setConfigOpen(prev => !prev)}
            aria-expanded={configOpen}
          >
            <FontAwesomeIcon icon={faGear} />
          </button>
          {configOpen && (
            <div className="practice-config-panel">
              <h3 className="practice-config-title">Practice Mode Configuration</h3>
              <PracticeConfiguration
                config={config}
                onPracticeConfigChange={setConfig}
              />
            </div>
          )}
        </div>
      </div>
      <div className="piano-with-octave">
        <VirtualPiano numKeys={numKeys} pressedNotes={currentChordNotes} secondaryPressedNotes={pressedNotes} />
        <div className="octave-section">
          <span className="octave-label">Octave {Math.floor(baseNote / 12) - 1}</span>
          <button
            className="octave-button"
            onClick={() => setOctaveOffset(o => o + 1)}
            disabled={baseNote + 12 > 108}
          >
            <FontAwesomeIcon icon={faChevronUp} />
          </button>
          <button
            className="octave-button"
            onClick={() => setOctaveOffset(o => o - 1)}
            disabled={baseNote - 12 < 12}
          >
            <FontAwesomeIcon icon={faChevronDown} />
          </button>
        </div>
      </div>
      <div className="chord-queue-section">
        <div className="chord-queue-label">Play this</div>
        <ChordQueue config={config} onCurrentChordChange={handleCurrentChordChange} />
      </div>
    </div>
  );
};
