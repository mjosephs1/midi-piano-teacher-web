import { FC, useState, useEffect } from 'react';
import { VirtualPiano } from './midi/VirtualPiano';
import { ChordQueue } from './ChordQueue';
import { PracticeConfiguration } from './PracticeConfiguration';
import './PracticeMode.css';

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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...selectedGroups]));
    } catch {
      // localStorage unavailable
    }
  }, [selectedGroups]);

  return (
    <div className="practice-mode-page">
      <VirtualPiano numKeys={numKeys} pressedNotes={currentChordNotes} />
      <ChordQueue selectedGroups={selectedGroups} onCurrentChordChange={setCurrentChordNotes} />
      <PracticeConfiguration
        selectedGroups={selectedGroups}
        onSelectedGroupsChange={setSelectedGroups}
      />
    </div>
  );
};
