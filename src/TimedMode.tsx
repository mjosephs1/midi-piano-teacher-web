import { FC, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faPlay, faStop, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { PracticeConfig } from './midi/noteUtils';
import { PracticeConfiguration } from './PracticeConfiguration';
import { ChordQueue } from './ChordQueue';
import './TimedMode.css';

library.add(faPlay, faStop, faRotateRight);

type TimedStage = 'CONFIGURE' | 'COUNTDOWN' | 'STARTED' | 'RESULTS';

const COUNTDOWN_LABELS = ['3', '2', '1', 'Begin'];

export const TimedMode: FC = () => {
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

  const [stage, setStage] = useState<TimedStage>('CONFIGURE');
  const [countdownStep, setCountdownStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem(PracticeConfig.STORAGE_KEY, JSON.stringify(config.toJson()));
    } catch {
      // localStorage unavailable
    }
  }, [config]);

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

  const handleChordMatched = () => {
    setScore(prev => prev + 1);
  };

  const handleChordMistake = () => {
    setMistakes(prev => prev + 1);
  };

  const handleStartClick = () => {
    setCountdownStep(0);
    setStage('COUNTDOWN');
  };

  const handleStopClick = () => {
    setStage('CONFIGURE');
  };

  const handlePlayAgainClick = () => {
    setCountdownStep(0);
    setStage('COUNTDOWN');
  };

  const handleConfigureClick = () => {
    setStage('CONFIGURE');
  };

  return (
    <div className="timed-mode-page">
      {stage === 'CONFIGURE' && (
        <>
          <h2>Timed Mode</h2>
          <PracticeConfiguration
            config={config}
            onPracticeConfigChange={setConfig}
          />
          <button className="timed-play-button" onClick={handleStartClick}>
            Start <FontAwesomeIcon icon={faPlay} />
          </button>
        </>
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
            <button className="timed-results-button" onClick={handleConfigureClick}>
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
