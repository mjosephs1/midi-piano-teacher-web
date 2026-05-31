import { FC } from 'react';
import { CHORD_PATTERNS, SharpsFilter, HandsMode } from './midi/noteUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHand } from '@fortawesome/free-solid-svg-icons';
import './PracticeConfiguration.css';

interface PracticeConfigurationProps {
  selectedGroups: Set<string>;
  onSelectedGroupsChange: (groups: Set<string>) => void;
  sharpsFilter: SharpsFilter;
  onSharpsFilterChange: (filter: SharpsFilter) => void;
  handsMode: HandsMode;
  onHandsModeChange: (mode: HandsMode) => void;
}

export const PracticeConfiguration: FC<PracticeConfigurationProps> = ({
  selectedGroups,
  onSelectedGroupsChange,
  sharpsFilter,
  onSharpsFilterChange,
  handsMode,
  onHandsModeChange,
}) => {
  const toggleGroup = (name: string) => {
    if (selectedGroups.has(name) && selectedGroups.size === 1) return;
    const next = new Set(selectedGroups);
    next.has(name) ? next.delete(name) : next.add(name);
    onSelectedGroupsChange(next);
  };

  const sharpsOptions: { label: string; value: SharpsFilter }[] = [
    { label: 'No Sharps', value: 'no-sharps' },
    { label: 'With Sharps', value: 'with-sharps' },
    { label: 'Sharps Only', value: 'sharps-only' },
  ];

  return (
    <div className="practice-config">
      <h3 className="practice-config-label">Select Chord Groups</h3>
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
      <h3 className="practice-config-label">Sharps</h3>
      <div className="sharps-buttons">
        {sharpsOptions.map(option => (
          <button
            key={option.value}
            className={`sharps-btn${sharpsFilter === option.value ? ' selected' : ''}`}
            onClick={() => onSharpsFilterChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <h3 className="practice-config-label">Select Hands</h3>
      <div className="hands-buttons">
        <button
          className={`hands-btn${handsMode === 'left' ? ' selected' : ''}`}
          onClick={() => onHandsModeChange('left')}
        >
          <FontAwesomeIcon icon={faHand} style={{ transform: 'scaleX(-1)' }} />
          <span className="hands-btn-label">Left</span>
        </button>
        <button
          className={`hands-btn${handsMode === 'both' ? ' selected' : ''}`}
          onClick={() => onHandsModeChange('both')}
        >
          <div className="both-hands-icon">
            <FontAwesomeIcon icon={faHand} style={{ transform: 'scaleX(-1)' }} />
            <FontAwesomeIcon icon={faHand} />
          </div>
          <span className="hands-btn-label">Both Hands</span>
        </button>
        <button
          className={`hands-btn${handsMode === 'right' ? ' selected' : ''}`}
          onClick={() => onHandsModeChange('right')}
        >
          <FontAwesomeIcon icon={faHand} />
          <span className="hands-btn-label">Right</span>
        </button>
      </div>
    </div>
  );
};
