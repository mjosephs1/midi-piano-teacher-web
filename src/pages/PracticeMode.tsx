import { FC, useState, useEffect, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faGear, faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { PracticeConfig, Chord, OCTAVE_OFFSET_STORAGE_KEY } from '../midi/noteUtils';
import { KEYBOARD_OFFSETS } from './Settings';
import { useMidi } from '../midi/MidiContext';
import { VirtualPiano } from '../midi/VirtualPiano';
import { ChordQueue } from '../components/ChordQueue';
import { PracticeConfiguration } from '../components/PracticeConfiguration';
import './PracticeMode.css';
import { PianoIcon } from '../components/PianoIcon';

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
  onNumKeysChange: (numKeys: number) => void;
}

export const PracticeMode: FC<PracticeModeProps> = ({ numKeys, onNumKeysChange }) => {
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
  const [octaveOffset, setOctaveOffset] = useState(() => {
    try {
      const configStored = localStorage.getItem(PracticeConfig.STORAGE_KEY);
      let handsMode = 'right';
      if (configStored) {
        const parsed = PracticeConfig.fromJson(JSON.parse(configStored));
        if (parsed) handsMode = parsed.handsMode;
      }
      const octaveStored = localStorage.getItem(OCTAVE_OFFSET_STORAGE_KEY);
      if (octaveStored) {
        const parsed = JSON.parse(octaveStored);
        const hand = handsMode === 'left' ? 'left' : 'right';
        if (typeof parsed[hand] === 'number') return parsed[hand];
      }
    } catch {}
    return 0;
  });
  const [configOpen, setConfigOpen] = useState(false);
  const configWrapperRef = useRef<HTMLDivElement>(null);
  const prevNumKeysRef = useRef(numKeys);

  // calculate where to place the notes for the current chord so that it fits within the bounds of the virtual piano
  const leftDefault = Math.max(36, KEYBOARD_OFFSETS[numKeys] ?? 21);
  const defaultBase = config.handsMode === 'left' ? leftDefault : 72;
  const baseNote = defaultBase + octaveOffset * 12;
  const pianoLow = KEYBOARD_OFFSETS[numKeys] ?? 21;
  const pianoHigh = pianoLow + numKeys - 1;
  const effectiveBase = currentChord ? clampToKeyboard(currentChord, baseNote, pianoLow, pianoHigh) : baseNote;
  const currentChordNotes = currentChord ? currentChord.getNoteIndices(effectiveBase) : new Set<number>();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(OCTAVE_OFFSET_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const hand = config.handsMode === 'left' ? 'left' : 'right';
        setOctaveOffset(typeof parsed[hand] === 'number' ? parsed[hand] : 0);
        return;
      }
    } catch {}
    setOctaveOffset(0);
  }, [config.handsMode]);

  useEffect(() => {
    if (prevNumKeysRef.current === numKeys) return;
    prevNumKeysRef.current = numKeys;
    setOctaveOffset(0);
    try {
      const stored = localStorage.getItem(OCTAVE_OFFSET_STORAGE_KEY);
      const existing = stored ? JSON.parse(stored) : {};
      const hand = config.handsMode === 'left' ? 'left' : 'right';
      localStorage.setItem(OCTAVE_OFFSET_STORAGE_KEY, JSON.stringify({ ...existing, [hand]: 0 }));
    } catch {}
  }, [numKeys, config.handsMode]);

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

  const handleOctaveChange = useCallback((delta: number) => {
    setOctaveOffset(prev => {
      const next = prev + delta;
      try {
        const stored = localStorage.getItem(OCTAVE_OFFSET_STORAGE_KEY);
        const existing = stored ? JSON.parse(stored) : {};
        const hand = config.handsMode === 'left' ? 'left' : 'right';
        localStorage.setItem(OCTAVE_OFFSET_STORAGE_KEY, JSON.stringify({ ...existing, [hand]: next }));
      } catch {}
      return next;
    });
  }, [config.handsMode]);

  const handleCurrentChordChange = useCallback((chord: Chord) => {
    setCurrentChord(chord);
  }, []);

  return (
    <div className="practice-mode-page">
      {configOpen && (
        <div className="practice-config-backdrop" onClick={() => setConfigOpen(false)} />
      )}
      <div className="practice-mode-title-row">
        <div className="practice-config-wrapper" ref={configWrapperRef}>
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
        <VirtualPiano 
          numKeys={numKeys}
          pressedNotes={currentChordNotes}
          secondaryPressedNotes={pressedNotes}
          header="Practice Mode"
          showSettings={true}
          onNumKeysChange={onNumKeysChange} />
        <div className="practice-mode-settings-section">
          <span className="octave-label">Settings</span>
          <button
              className="practice-config-button"
              onClick={() => setConfigOpen(prev => !prev)}
              aria-expanded={configOpen}
            >
              <PianoIcon pianoIconWidth={40}/>
          </button>
          <span className="octave-label">Octave {Math.floor(baseNote / 12) - 1}</span>
          <button
            className="octave-button"
            onClick={() => handleOctaveChange(1)}
            disabled={baseNote + 12 > 108}
          >
            <FontAwesomeIcon icon={faChevronUp} />
          </button>
          <button
            className="octave-button"
            onClick={() => handleOctaveChange(-1)}
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
