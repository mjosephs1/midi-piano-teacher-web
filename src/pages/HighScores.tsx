import { FC, useState, useEffect, useCallback } from 'react';
import { PracticeConfig, TimedResult } from '../midi/noteUtils';
import { PracticeConfiguration } from '../components/PracticeConfiguration';
import { useStorage } from '../context/StorageContext';
import './HighScores.css';

type RankedResult = TimedResult & { rank: number; accuracy: number };

function processResults(results: TimedResult[]): RankedResult[] {
  const withAccuracy = results.map(entry => ({
    ...entry,
    accuracy: entry.score + entry.mistakes === 0
      ? 100
      : Math.round((entry.score / (entry.score + entry.mistakes)) * 100),
  }));
  return withAccuracy
    .sort((a, b) => b.score !== a.score ? b.score - a.score : b.accuracy - a.accuracy)
    .slice(0, 10)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}

export const HighScores: FC = () => {
  const { loadSettings, saveSettings, loadTimedResults } = useStorage();
  const [config, setConfig] = useState<PracticeConfig>(new PracticeConfig());
  const [topScores, setTopScores] = useState<RankedResult[]>([]);

  // Load settings then results in sequence — avoids a redundant results fetch with the default config
  useEffect(() => {
    loadSettings()
      .then(settings => {
        const loadedConfig = new PracticeConfig(
          new Set(settings.selectedGroups),
          settings.sharpsFilter,
          settings.handsMode,
          settings.selectedKey,
        );
        setConfig(loadedConfig);
        return loadTimedResults(loadedConfig);
      })
      .then(results => setTopScores(processResults(results)))
      .catch(() => {});
  }, [loadSettings, loadTimedResults]);

  const handleConfigChange = useCallback((newConfig: PracticeConfig) => {
    setConfig(newConfig);
    saveSettings({
      selectedGroups: [...newConfig.selectedGroups],
      sharpsFilter: newConfig.sharpsFilter,
      handsMode: newConfig.handsMode,
      selectedKey: newConfig.selectedKey,
    });
    loadTimedResults(newConfig).then(results => setTopScores(processResults(results)));
  }, [loadTimedResults, saveSettings]);

  return (
    <div className="high-scores-page">
      <h2>High Scores</h2>

      <div className="high-scores-layout">
        <div className="high-scores-config-card">
          <h3 className="high-scores-config-card-title">Configuration</h3>
          <PracticeConfiguration
            config={config}
            onPracticeConfigChange={handleConfigChange}
          />
        </div>

        <div className="high-scores-scores-section">
          {topScores.length === 0 ? (
            <div className="high-scores-empty">No scores yet for this configuration.</div>
          ) : (
            <table className="high-scores-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Score</th>
                  <th>Accuracy</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {topScores.map(entry => (
                  <tr key={`${entry.timestamp}-${entry.score}`} className={entry.rank === 1 ? 'rank-1' : ''}>
                    <td className="rank-cell">{entry.rank}</td>
                    <td className="score-cell">{entry.score}</td>
                    <td className="accuracy-cell">{entry.accuracy}%</td>
                    <td className="date-cell">{new Date(entry.timestamp).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
