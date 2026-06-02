import { FC, useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { PracticeConfig, TIMED_HISTORY_KEY, TimedHistory } from '../midi/noteUtils';
import { PracticeConfiguration } from '../components/PracticeConfiguration';
import './Progress.css';

type ChartDataPoint = { date: string; avgScore: number };

const getChartData = (config: PracticeConfig): ChartDataPoint[] => {
  try {
    const raw = localStorage.getItem(TIMED_HISTORY_KEY);
    const history: TimedHistory = raw ? JSON.parse(raw) : {};
    const entries = history[config.toString()] ?? [];

    const byDay: Record<string, number[]> = {};
    for (const entry of entries) {
      const day = new Date(entry.timestamp).toLocaleDateString();
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(entry.score);
    }

    return Object.entries(byDay)
      .map(([date, scores]) => ({
        date,
        avgScore: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch {
    return [];
  }
};

export const Progress: FC = () => {
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

  const chartData = getChartData(config);

  return (
    <div className="progress-page">
      <h2>Progress</h2>

      <div className="progress-layout">
        <div className="progress-config-card">
          <h3 className="progress-config-card-title">Configuration</h3>
          <PracticeConfiguration
            config={config}
            onPracticeConfigChange={setConfig}
          />
        </div>

        <div className="progress-chart-section">
          {chartData.length === 0 ? (
            <div className="progress-empty">No scores yet for this configuration.</div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="avgScore"
                  name="Avg Score"
                  stroke="#e53935"
                  dot={true}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
