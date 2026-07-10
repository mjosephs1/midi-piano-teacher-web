import { FC } from 'react';
import { CHORD_GROUPS, PracticeConfig, SharpsFilter, HandsMode } from '../midi/noteUtils';
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

  const selectAll = () => {
    const allGroups = new Set(CHORD_GROUPS.map(p => p.name));
    onPracticeConfigChange(new PracticeConfig(allGroups, config.sharpsFilter, config.handsMode));
  };

  const deselectAll = () => {
    onPracticeConfigChange(new PracticeConfig(new Set(['Major']), config.sharpsFilter, config.handsMode));
  };

  const sharpsOptions: { label: string; value: SharpsFilter }[] = [
    { label: 'Exclude Sharps', value: 'no-sharps' },
    { label: 'Include Sharps', value: 'with-sharps' },
    { label: 'Sharps Only', value: 'sharps-only' },
  ];

  return (
    <div className="practice-config">
      <div className="config-top-row">
        <div className="config-section">
          <div className="chord-group-list-container">
            <div className="chord-group-list-header">
              <h3 className="practice-config-label">Chord Groups</h3>
              <div className="chord-group-toolbar-buttons">
                <button className="chord-group-toolbar-btn" onClick={selectAll}>Select All</button>
                <button className="chord-group-toolbar-btn" onClick={deselectAll}>Deselect All</button>
              </div>
            </div>
            {CHORD_GROUPS.map(pattern => {
              const isSelected = config.selectedGroups.has(pattern.name);
              const isOnlySelected = isSelected && config.selectedGroups.size === 1;
              return (
                <label key={pattern.name} className="chord-group-item">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isOnlySelected}
                    onChange={() => toggleGroup(pattern.name)}
                  />
                  <span className="chord-group-name">{pattern.name}</span>
                  <span className="chord-group-shorthand">{pattern.shorthand}</span>
                </label>
              );
            })}
          </div>
        </div>
        <div className="config-section config-section--sharps">
          <div className="sharps-list-container">
            <div className="sharps-list-header">
              <h3 className="practice-config-label">Sharps</h3>
            </div>
            {sharpsOptions.map(option => (
              <label key={option.value} className="sharps-item">
                <input
                  type="checkbox"
                  checked={config.sharpsFilter === option.value}
                  onChange={() => onPracticeConfigChange(new PracticeConfig(config.selectedGroups, option.value, config.handsMode))}
                />
                <span className="sharps-label">{option.label}</span>
              </label>
            ))}
          </div>
          <div className="hands-card">
            <h3 className="practice-config-label">Hands</h3>
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
        </div>
      </div>
    </div>
  );
};
