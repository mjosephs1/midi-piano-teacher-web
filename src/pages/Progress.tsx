import { FC, useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { PracticeConfig } from '../midi/noteUtils';
import { PracticeConfiguration } from '../components/PracticeConfiguration';
import { useStorage } from '../context/StorageContext';
import './Progress.css';

type ChartDataPoint = { date: string; avgScore: number };

export const Progress: FC = () => {
  const { loadSettings, saveSettings, loadTimedResults } = useStorage();
  const [config, setConfig] = useState<PracticeConfig>(new PracticeConfig());
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
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

  // Load chart data whenever config changes
  useEffect(() => {
    loadTimedResults(config).then(results => {
      const byDay: Record<string, number[]> = {};
      for (const entry of results) {
        const day = new Date(entry.timestamp).toLocaleDateString();
        if (!byDay[day]) byDay[day] = [];
        byDay[day].push(entry.score);
      }
      const data = Object.entries(byDay)
        .map(([date, scores]) => ({
          date,
          avgScore: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setChartData(data);
    });
  }, [config, loadTimedResults]);

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
            <>
              <h3 className="progress-chart-title">Average Score Over Time</h3>
              <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} label={{ value: 'Score', angle: -90, position: 'insideLeft' }} />
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};
