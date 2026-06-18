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
import { useStorage } from '../context/StorageContext';
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
  showNotes: boolean;
  onShowNotesChange: (showNotes: boolean) => void;
}

export const PracticeMode: FC<PracticeModeProps> = ({ numKeys, onNumKeysChange, showNotes, onShowNotesChange }) => {
  const { loadSettings, saveSettings } = useStorage();
  const [config, setConfig] = useState<PracticeConfig>(new PracticeConfig());
  const { pressedNotes } = useMidi();
  const [currentChord, setCurrentChord] = useState<Chord | null>(null);
  const [octaveOffset, setOctaveOffset] = useState(0);
  const [configOpen, setConfigOpen] = useState(false);
  const configWrapperRef = useRef<HTMLDivElement>(null);
  const prevNumKeysRef = useRef(numKeys);
  const settingsLoadedRef = useRef(false);

  const leftDefault = Math.max(36, KEYBOARD_OFFSETS[numKeys] ?? 21);
  const defaultBase = config.handsMode === 'left' ? leftDefault : 72;
  const baseNote = defaultBase + octaveOffset * 12;
  const pianoLow = KEYBOARD_OFFSETS[numKeys] ?? 21;
  const pianoHigh = pianoLow + numKeys - 1;
  const effectiveBase = currentChord ? clampToKeyboard(currentChord, baseNote, pianoLow, pianoHigh) : baseNote;
  const currentChordNotes = currentChord ? currentChord.getNoteIndices(effectiveBase) : new Set<number>();

  // Load all settings on mount
  useEffect(() => {
    loadSettings().then(settings => {
      setConfig(new PracticeConfig(
        new Set(settings.selectedGroups),
        settings.sharpsFilter,
        settings.handsMode,
      ));
      const hand = settings.handsMode === 'left' ? 'left' : 'right';
      setOctaveOffset(hand === 'left' ? settings.octaveOffsetLeft : settings.octaveOffsetRight);
      settingsLoadedRef.current = true;
    }).catch(() => {
      settingsLoadedRef.current = true;
    });
  }, [loadSettings]);

  // When handsMode changes, load the saved offset for the new hand
  useEffect(() => {
    if (!settingsLoadedRef.current) return;
    loadSettings().then(settings => {
      const hand = config.handsMode === 'left' ? 'left' : 'right';
      setOctaveOffset(hand === 'left' ? settings.octaveOffsetLeft : settings.octaveOffsetRight);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.handsMode]);

  // When numKeys changes, reset octave offset for the current hand
  useEffect(() => {
    if (prevNumKeysRef.current === numKeys) return;
    prevNumKeysRef.current = numKeys;
    setOctaveOffset(0);
    const hand = config.handsMode === 'left' ? 'left' : 'right';
    saveSettings(hand === 'left' ? { octaveOffsetLeft: 0 } : { octaveOffsetRight: 0 });
  }, [numKeys, config.handsMode, saveSettings]);

  // Save config when it changes
  useEffect(() => {
    if (!settingsLoadedRef.current) return;
    saveSettings({
      selectedGroups: [...config.selectedGroups],
      sharpsFilter: config.sharpsFilter,
      handsMode: config.handsMode,
    });
  }, [config, saveSettings]);

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
      const hand = config.handsMode === 'left' ? 'left' : 'right';
      saveSettings(hand === 'left' ? { octaveOffsetLeft: next } : { octaveOffsetRight: next });
      return next;
    });
  }, [config.handsMode, saveSettings]);

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
          onNumKeysChange={onNumKeysChange}
          showNotes={showNotes}
          onShowNotesChange={onShowNotesChange} />
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
