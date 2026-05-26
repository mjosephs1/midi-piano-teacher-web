import { FC, useState, useEffect } from 'react';
import { CHORD_PATTERNS } from './midi/noteUtils';
import './PracticeConfiguration.css';

const STORAGE_KEY = 'midiPianoPracticeChordGroups';

export const PracticeConfiguration: FC = () => {
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...selectedGroups]));
    } catch {
      // localStorage unavailable
    }
  }, [selectedGroups]);

  const toggleGroup = (name: string) => {
    setSelectedGroups(prev => {
      if (prev.has(name) && prev.size === 1) return prev;
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  return (
    <div className="practice-config">
      <h3 className="practice-config-label">Chord Groups</h3>
      <div className="chord-group-buttons">
        {CHORD_PATTERNS.map(pattern => {
          const isSelected = selectedGroups.has(pattern.name);
          const isOnlySelected = isSelected && selectedGroups.size === 1;
          return (
            <button
              key={pattern.name}
              className={`chord-group-btn${isSelected ? ' selected' : ''}${isOnlySelected ? ' only-selected' : ''}`}
              onClick={() => toggleGroup(pattern.name)}
            >
              <span className="chord-group-name">{pattern.name}</span>
              <span className="chord-group-shorthand">{pattern.shorthand}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
