import { FC, useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { VirtualPiano } from './midi/VirtualPiano';
import { ChordQueue } from './ChordQueue';
import { PracticeConfiguration } from './PracticeConfiguration';
import './PracticeMode.css';

library.add(faGear);

interface PracticeModeProps {
  numKeys: number;
}

const STORAGE_KEY = 'midiPianoPracticeChordGroups';

export const PracticeMode: FC<PracticeModeProps> = ({ numKeys }) => {
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return new Set(parsed);
      }
    } catch {
      // localStorage unavailable
    }
    return new Set(['Major']);
  });

  const [currentChordNotes, setCurrentChordNotes] = useState<Set<number>>(new Set());
  const [configOpen, setConfigOpen] = useState(false);
  const configWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...selectedGroups]));
    } catch {
      // localStorage unavailable
    }
  }, [selectedGroups]);

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
              <h3 className="practice-config-title">Practice Mode Settings</h3>
              <PracticeConfiguration
                selectedGroups={selectedGroups}
                onSelectedGroupsChange={setSelectedGroups}
              />
            </div>
          )}
        </div>
      </div>
      <VirtualPiano numKeys={numKeys} pressedNotes={currentChordNotes} />
      <div className="chord-queue-section">
        <div className="chord-queue-label">Play this</div>
        <ChordQueue selectedGroups={selectedGroups} onCurrentChordChange={setCurrentChordNotes} />
      </div>
    </div>
  );
};
