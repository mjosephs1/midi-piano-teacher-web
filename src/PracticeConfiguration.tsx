import { FC } from 'react';
import { CHORD_PATTERNS, PracticeConfig, SharpsFilter, HandsMode } from './midi/noteUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHand } from '@fortawesome/free-solid-svg-icons';
import './PracticeConfiguration.css';

interface PracticeConfigurationProps {
  config: PracticeConfig;
  onPracticeConfigChange: (config: PracticeConfig) => void;
}

export const PracticeConfiguration: FC<PracticeConfigurationProps> = ({
  config,
  onPracticeConfigChange,
}) => {
  const toggleGroup = (name: string) => {
    if (config.selectedGroups.has(name) && config.selectedGroups.size === 1) return;
    const next = new Set(config.selectedGroups);
    next.has(name) ? next.delete(name) : next.add(name);
    onPracticeConfigChange(new PracticeConfig(next, config.sharpsFilter, config.handsMode));
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
          const isSelected = config.selectedGroups.has(pattern.name);
          const isOnlySelected = isSelected && config.selectedGroups.size === 1;
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
            className={`sharps-btn${config.sharpsFilter === option.value ? ' selected' : ''}`}
            onClick={() => onPracticeConfigChange(new PracticeConfig(config.selectedGroups, option.value, config.handsMode))}
          >
            {option.label}
          </button>
        ))}
      </div>
      <h3 className="practice-config-label">Select Hands</h3>
      <div className="hands-buttons">
        <button
          className={`hands-btn${config.handsMode === 'left' ? ' selected' : ''}`}
          onClick={() => onPracticeConfigChange(new PracticeConfig(config.selectedGroups, config.sharpsFilter, 'left'))}
        >
          <FontAwesomeIcon icon={faHand} style={{ transform: 'scaleX(-1)' }} />
          <span className="hands-btn-label">Left</span>
        </button>
        <button
          className={`hands-btn${config.handsMode === 'both' ? ' selected' : ''}`}
          onClick={() => onPracticeConfigChange(new PracticeConfig(config.selectedGroups, config.sharpsFilter, 'both'))}
        >
          <div className="both-hands-icon">
            <FontAwesomeIcon icon={faHand} style={{ transform: 'scaleX(-1)' }} />
            <FontAwesomeIcon icon={faHand} />
          </div>
          <span className="hands-btn-label">Both Hands</span>
        </button>
        <button
          className={`hands-btn${config.handsMode === 'right' ? ' selected' : ''}`}
          onClick={() => onPracticeConfigChange(new PracticeConfig(config.selectedGroups, config.sharpsFilter, 'right'))}
        >
          <FontAwesomeIcon icon={faHand} />
          <span className="hands-btn-label">Right</span>
        </button>
      </div>
    </div>
  );
};
