import { FC, useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { PracticeConfig } from '../midi/noteUtils';
import { VirtualPiano } from '../midi/VirtualPiano';
import { ChordQueue } from '../components/ChordQueue';
import { PracticeConfiguration } from '../components/PracticeConfiguration';
import './PracticeMode.css';

library.add(faGear);

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

  const [currentChordNotes, setCurrentChordNotes] = useState<Set<number>>(new Set());
  const [configOpen, setConfigOpen] = useState(false);
  const configWrapperRef = useRef<HTMLDivElement>(null);

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
                config={config}
                onPracticeConfigChange={setConfig}
              />
            </div>
          )}
        </div>
      </div>
      <VirtualPiano numKeys={numKeys} pressedNotes={currentChordNotes} />
      <div className="chord-queue-section">
        <div className="chord-queue-label">Play this</div>
        <ChordQueue config={config} onCurrentChordChange={setCurrentChordNotes} />
      </div>
    </div>
  );
};
