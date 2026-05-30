import { FC, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import { SharpsFilter } from './midi/noteUtils';
import { PracticeConfiguration } from './PracticeConfiguration';
import './TimedMode.css';

library.add(faPlay);

interface TimedModeProps {
  numKeys: number;
}

const STORAGE_KEY = 'midiPianoTimedChordGroups';
const SHARPS_FILTER_KEY = 'midiPianoTimedSharpFilter';

export const TimedMode: FC<TimedModeProps> = ({ numKeys }) => {
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

  const [sharpsFilter, setSharpsFilter] = useState<SharpsFilter>(() => {
    try {
      const stored = localStorage.getItem(SHARPS_FILTER_KEY);
      if (stored === 'no-sharps' || stored === 'sharps-only' || stored === 'with-sharps') {
        return stored;
      }
    } catch {
      // localStorage unavailable
    }
    return 'with-sharps';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...selectedGroups]));
    } catch {
      // localStorage unavailable
    }
  }, [selectedGroups]);

  useEffect(() => {
    try {
      localStorage.setItem(SHARPS_FILTER_KEY, sharpsFilter);
    } catch {
      // localStorage unavailable
    }
  }, [sharpsFilter]);

  return (
    <div className="timed-mode-page">
      <h2>Timed Mode</h2>
      <PracticeConfiguration
        selectedGroups={selectedGroups}
        onSelectedGroupsChange={setSelectedGroups}
        sharpsFilter={sharpsFilter}
        onSharpsFilterChange={setSharpsFilter}
      />
      <button className="timed-play-button">
        Start <FontAwesomeIcon icon={faPlay} />
      </button>
    </div>
  );
};
