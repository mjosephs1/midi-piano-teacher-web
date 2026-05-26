import { FC, useState, useEffect } from 'react';
import { CHORD_PATTERNS, NOTE_NAMES } from './midi/noteUtils';
import { useMidi } from './midi/MidiContext';
import './ChordQueue.css';

const MIDI_BASE = 60;

interface ChordQueueItem {
  rootIndex: number;
  patternName: string;
}

interface ChordQueueProps {
  selectedGroups: Set<string>;
  onCurrentChordChange: (notes: Set<number>) => void;
}

function generateChordItem(selectedGroups: Set<string>, exclude?: string): ChordQueueItem {
  const allowed = CHORD_PATTERNS.filter(p => selectedGroups.has(p.name));
  let item: ChordQueueItem;
  do {
    const pattern = allowed[Math.floor(Math.random() * allowed.length)];
    const rootIndex = Math.floor(Math.random() * 12);
    item = { rootIndex, patternName: pattern.name };
  } while (exclude !== undefined && `${NOTE_NAMES[item.rootIndex]} ${item.patternName}` === exclude);
  return item;
}

function computeChordNotes(item: ChordQueueItem): Set<number> {
  const pattern = CHORD_PATTERNS.find(p => p.name === item.patternName);
  if (!pattern) return new Set();
  return new Set(pattern.intervals.map(i => MIDI_BASE + item.rootIndex + i));
}

export const ChordQueue: FC<ChordQueueProps> = ({ selectedGroups, onCurrentChordChange }) => {
  const [queue, setQueue] = useState<ChordQueueItem[]>(() =>
    Array.from({ length: 5 }, () => generateChordItem(selectedGroups))
  );

  const { pressedChords } = useMidi();

  // Regenerate queue when selectedGroups changes
  useEffect(() => {
    setQueue(Array.from({ length: 5 }, () => generateChordItem(selectedGroups)));
  }, [selectedGroups]);

  // Notify parent when current chord changes
  useEffect(() => {
    const currentChordNotes = computeChordNotes(queue[0]);
    onCurrentChordChange(currentChordNotes);
  }, [queue, onCurrentChordChange]);

  // Detect chord match and advance queue
  useEffect(() => {
    if (!pressedChords) return;
    const target = `${NOTE_NAMES[queue[0].rootIndex]} ${queue[0].patternName}`;
    if (pressedChords === target) {
      setQueue(prev => {
        const rightmostChordName = `${NOTE_NAMES[prev[4].rootIndex]} ${prev[4].patternName}`;
        return [
          ...prev.slice(1),
          generateChordItem(selectedGroups, rightmostChordName),
        ];
      });
    }
  }, [pressedChords, queue, selectedGroups]);

  return (
    <div className="chord-queue">
      {queue.map((item, index) => (
        <div
          key={`${index}-${item.rootIndex}-${item.patternName}`}
          className={`chord-card${index === 0 ? ' current' : ''}`}
        >
          <span className="chord-card-root">{NOTE_NAMES[item.rootIndex]}</span>
          <span className="chord-card-type">
            {CHORD_PATTERNS.find(p => p.name === item.patternName)?.shorthand}
          </span>
        </div>
      ))}
    </div>
  );
};
