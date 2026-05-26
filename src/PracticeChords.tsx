import { FC } from 'react';
import { Link } from 'react-router-dom';
import './PracticeChords.css';

export const PracticeChords: FC = () => (
  <div className="practice-chords-page">
    <h2>Practice Chords</h2>
    <div className="practice-mode-buttons">
      <Link to="/practice-chords/practice" className="practice-mode-btn">
        <div className="btn-title">Practice Mode</div>
        <div className="btn-description">Placeholder description for practice mode</div>
      </Link>
      <Link to="/practice-chords/timed" className="practice-mode-btn">
        <div className="btn-title">Timed Mode</div>
        <div className="btn-description">Placeholder description for timed mode</div>
      </Link>
      <Link to="/practice-chords/tempo" className="practice-mode-btn">
        <div className="btn-title">Tempo Mode</div>
        <div className="btn-description">Placeholder description for tempo mode</div>
      </Link>
    </div>
  </div>
);
