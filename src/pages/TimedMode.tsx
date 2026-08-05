import { FC, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faPlay, faStop, faRotateRight, faRankingStar, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { PracticeConfig } from '../midi/noteUtils';
import { PracticeConfiguration } from '../components/PracticeConfiguration';
import { ChordQueue } from '../components/ChordQueue';
import { useStorage } from '../context/StorageContext';
import './TimedMode.css';

library.add(faPlay, faStop, faRotateRight, faRankingStar, faChartLine);

type TimedStage = 'CONFIGURE' | 'COUNTDOWN' | 'STARTED' | 'RESULTS';

const COUNTDOWN_LABELS = ['3', '2', '1', 'Begin'];

export const TimedMode: FC = () => {
  const { loadSettings, saveSettings, saveTimedResult } = useStorage();
  const [config, setConfig] = useState<PracticeConfig>(new PracticeConfig());
  const [stage, setStage] = useState<TimedStage>('CONFIGURE');
  const [countdownStep, setCountdownStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const settingsLoadedRef = useRef(false);

  // Load config on mount
  useEffect(() => {
    loadSettings().then(settings => {
      setConfig(new PracticeConfig(
        new Set(settings.selectedGroups),
        settings.sharpsFilter,
        settings.handsMode,
        settings.selectedKey,
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
      selectedKey: config.selectedKey,
    });
  }, [config, saveSettings]);

  // Countdown logic
  useEffect(() => {
    if (stage !== 'COUNTDOWN') return;

    const interval = setInterval(() => {
      setCountdownStep(prev => {
        const nextStep = prev + 1;
        if (nextStep >= COUNTDOWN_LABELS.length) {
          setStage('STARTED');
          return 0;
        }
        return nextStep;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [stage]);

  // Timer logic
  useEffect(() => {
    if (stage !== 'STARTED') return;

    setScore(0);
    setMistakes(0);
    setTimeLeft(60);

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const nextTime = prev - 1;
        if (nextTime <= 0) {
          setStage('RESULTS');
          return 0;
        }
        return nextTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [stage]);

  // Save result when entering RESULTS stage
  useEffect(() => {
    if (stage !== 'RESULTS') return;
    saveTimedResult(score, mistakes, config);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const handleChordMatched = () => setScore(prev => prev + 1);
  const handleChordMistake = () => setMistakes(prev => prev + 1);
  const handleStartClick = () => { setCountdownStep(0); setStage('COUNTDOWN'); };
  const handleStopClick = () => setStage('CONFIGURE');
  const handlePlayAgainClick = () => { setCountdownStep(0); setStage('COUNTDOWN'); };
  const handleConfigureClick = () => setStage('CONFIGURE');

  return (
    <div className="timed-mode-page">
      <h2>Timed Mode</h2>
      {stage === 'CONFIGURE' && (
        <div className="timed-configure-layout">
          <div className="timed-config-card">
            <h3 className="timed-config-card-title">Configuration</h3>
            <PracticeConfiguration
              config={config}
              onPracticeConfigChange={setConfig}
            />
          </div>
          <div className="timed-configure-buttons">
            <button className="timed-play-button" onClick={handleStartClick}>
              Start <FontAwesomeIcon icon={faPlay} />
            </button>
            <Link to="/practice-chords/high-scores" className="timed-play-button">
              High Scores <FontAwesomeIcon icon={faRankingStar} />
            </Link>
            <Link to="/practice-chords/progress" className="timed-play-button">
              Progress <FontAwesomeIcon icon={faChartLine} />
            </Link>
          </div>
        </div>
      )}

      {stage === 'COUNTDOWN' && (
        <div className="timed-countdown">
          <span key={countdownStep} className="timed-countdown-number">
            {COUNTDOWN_LABELS[countdownStep]}
          </span>
        </div>
      )}

      {stage === 'STARTED' && (
        <>
          <div className="timed-hud">
            <button className="timed-stop-button" onClick={handleStopClick}>
              Stop <FontAwesomeIcon icon={faStop} />
            </button>
            <div className="timed-timer">{timeLeft}s</div>
            <div className="timed-hud-right">
              <div className="timed-score">Score: {score}</div>
              <div className="timed-mistakes">Mistakes: {mistakes}</div>
            </div>
          </div>
          <ChordQueue
            config={config}
            onCurrentChordChange={() => {}}
            onChordMatched={handleChordMatched}
            onChordMistake={handleChordMistake}
          />
        </>
      )}

      {stage === 'RESULTS' && (
        <div className="timed-results">
          <div className="timed-final-score">{score}</div>
          <div className="timed-results-label">chords in 60 seconds</div>
          <div className="timed-results-mistakes">{mistakes} mistake{mistakes !== 1 ? 's' : ''}</div>
          <div className="timed-results-accuracy">
            Accuracy: {score + mistakes === 0 ? '100' : Math.round((score / (score + mistakes)) * 100)}%
          </div>
          <div className="timed-results-buttons">
            <button className="timed-results-button" onClick={handlePlayAgainClick}>
              Try Again <FontAwesomeIcon icon={faRotateRight} />
            </button>
            <Link to="/practice-chords/high-scores" className="timed-results-button">
              High Scores <FontAwesomeIcon icon={faRankingStar} />
            </Link>
            <button className="timed-results-button" onClick={handleConfigureClick}>
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
