import { FC, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PracticeConfig, TIMED_HISTORY_KEY, TimedHistory, TimedResult } from './midi/noteUtils';
import { PracticeConfiguration } from './PracticeConfiguration';
import './HighScores.css';

export const HighScores: FC = () => {
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

  useEffect(() => {
    try {
      localStorage.setItem(PracticeConfig.STORAGE_KEY, JSON.stringify(config.toJson()));
    } catch {
      // localStorage unavailable
    }
  }, [config]);

  const getTopScores = (): (TimedResult & { rank: number })[] => {
    try {
      const raw = localStorage.getItem(TIMED_HISTORY_KEY);
      const history: TimedHistory = raw ? JSON.parse(raw) : {};
      const key = config.toString();
      const entries = history[key] ?? [];

      const withAccuracy = entries.map(entry => ({
        ...entry,
        accuracy: entry.score + entry.mistakes === 0 ? 100 : Math.round((entry.score / (entry.score + entry.mistakes)) * 100),
      }));

      const sorted = withAccuracy.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.accuracy - a.accuracy;
      });

      return sorted.slice(0, 10).map((entry, i) => ({
        ...entry,
        rank: i + 1,
      }));
    } catch {
      return [];
    }
  };

  const topScores = getTopScores();

  return (
    <div className="high-scores-page">
      <div className="high-scores-header">
        <h2>High Scores</h2>
        <Link to="/practice-chords/timed" className="high-scores-back">
          ← Timed Mode
        </Link>
      </div>

      <PracticeConfiguration
        config={config}
        onPracticeConfigChange={setConfig}
      />

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
                <td className="date-cell">{new Date(entry.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
