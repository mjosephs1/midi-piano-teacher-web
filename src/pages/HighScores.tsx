import { FC, useState, useEffect, useRef } from 'react';
import { PracticeConfig, TimedResult } from '../midi/noteUtils';
import { PracticeConfiguration } from '../components/PracticeConfiguration';
import { useStorage } from '../context/StorageContext';
import './HighScores.css';

type RankedResult = TimedResult & { rank: number; accuracy: number };

export const HighScores: FC = () => {
  const { loadSettings, saveSettings, loadTimedResults } = useStorage();
  const [config, setConfig] = useState<PracticeConfig>(new PracticeConfig());
  const [topScores, setTopScores] = useState<RankedResult[]>([]);
  const settingsLoadedRef = useRef(false);

  // Load config on mount
  useEffect(() => {
    loadSettings().then(settings => {
      setConfig(new PracticeConfig(
        new Set(settings.selectedGroups),
        settings.sharpsFilter,
        settings.handsMode,
      ));
      settingsLoadedRef.current = true;
    }).catch(() => {
      settingsLoadedRef.current = true;
    });
  }, [loadSettings]);

  // Save config when it changes
  useEffect(() => {
    if (!settingsLoadedRef.current) return;
    saveSettings({
      selectedGroups: [...config.selectedGroups],
      sharpsFilter: config.sharpsFilter,
      handsMode: config.handsMode,
    });
  }, [config, saveSettings]);

  // Load scores whenever config changes
  useEffect(() => {
    loadTimedResults(config).then(results => {
      const withAccuracy = results.map(entry => ({
        ...entry,
        accuracy: entry.score + entry.mistakes === 0
          ? 100
          : Math.round((entry.score / (entry.score + entry.mistakes)) * 100),
      }));
      const sorted = withAccuracy.sort((a, b) =>
        b.score !== a.score ? b.score - a.score : b.accuracy - a.accuracy
      );
      setTopScores(sorted.slice(0, 10).map((entry, i) => ({ ...entry, rank: i + 1 })));
    });
  }, [config, loadTimedResults]);

  return (
    <div className="high-scores-page">
      <h2>High Scores</h2>

      <div className="high-scores-layout">
        <div className="high-scores-config-card">
          <h3 className="high-scores-config-card-title">Configuration</h3>
          <PracticeConfiguration
            config={config}
            onPracticeConfigChange={setConfig}
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
