import { FC } from 'react';
import { CHORD_PATTERNS } from './midi/noteUtils';
import './PracticeConfiguration.css';

interface PracticeConfigurationProps {
  selectedGroups: Set<string>;
  onSelectedGroupsChange: (groups: Set<string>) => void;
}

export const PracticeConfiguration: FC<PracticeConfigurationProps> = ({
  selectedGroups,
  onSelectedGroupsChange,
}) => {
  const toggleGroup = (name: string) => {
    if (selectedGroups.has(name) && selectedGroups.size === 1) return;
    const next = new Set(selectedGroups);
    next.has(name) ? next.delete(name) : next.add(name);
    onSelectedGroupsChange(next);
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
