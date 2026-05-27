import { FC, useState, useEffect, useRef } from 'react';
import { CHORD_PATTERNS, NOTE_NAMES } from './midi/noteUtils';
import { useMidi } from './midi/MidiContext';
import './ChordQueue.css';

const MIDI_BASE = 60;

interface ChordQueueItem {
  id: number;
  rootIndex: number;
  patternName: string;
}

interface ChordQueueProps {
  selectedGroups: Set<string>;
  onCurrentChordChange: (notes: Set<number>) => void;
}

let itemIdCounter = 0;

function generateChordItem(selectedGroups: Set<string>, exclude?: string): ChordQueueItem {
  const allowed = CHORD_PATTERNS.filter(p => selectedGroups.has(p.name));
  let item: ChordQueueItem;
  do {
    const pattern = allowed[Math.floor(Math.random() * allowed.length)];
    const rootIndex = Math.floor(Math.random() * 12);
    item = { id: itemIdCounter++, rootIndex, patternName: pattern.name };
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

  const [isFlashing, setIsFlashing] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [fadingOutCard, setFadingOutCard] = useState<ChordQueueItem | null>(null);
  const isTransitioningRef = useRef(false);
  const nextChordPressedRef = useRef(false);
  const lastMatchedChordRef = useRef<string | null>(null);
  const fadingOutCardRef = useRef<ChordQueueItem | null>(null);

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

  // Detect chord match and trigger flash
  useEffect(() => {
    if (!pressedChords) return;
    const target = `${NOTE_NAMES[queue[0].rootIndex]} ${queue[0].patternName}`;
    if (pressedChords !== target) return;
    if (isTransitioningRef.current) return;

    isTransitioningRef.current = true;
    lastMatchedChordRef.current = target;
    nextChordPressedRef.current = false;
    fadingOutCardRef.current = queue[0];
    setIsFlashing(true);
    setIsAdvancing(true);
  }, [pressedChords, queue]);

  // Detect if a new chord is pressed while transitioning
  useEffect(() => {
    if (!isTransitioningRef.current || !pressedChords) return;

    const target = `${NOTE_NAMES[queue[0].rootIndex]} ${queue[0].patternName}`;
    // Only set flag if this is a different chord from the one that triggered the transition
    if (pressedChords === target && pressedChords !== lastMatchedChordRef.current) {
      nextChordPressedRef.current = true;
    }
  }, [pressedChords, queue]);

  // Handle queue advance and animation timing
  useEffect(() => {
    if (!isAdvancing) return;

    // Use the captured fading-out card from the detection effect
    setFadingOutCard(fadingOutCardRef.current);

    // Advance the queue immediately so the next target is correct
    setQueue(prev => {
      const rightmostChordName = `${NOTE_NAMES[prev[4].rootIndex]} ${prev[4].patternName}`;
      return [
        ...prev.slice(1),
        generateChordItem(selectedGroups, rightmostChordName),
      ];
    });

    const animationTimeout = setTimeout(() => {
      setFadingOutCard(null);
      setIsFlashing(false);
      setIsAdvancing(false);

      // Check if the user pressed the next chord at any point during the animation
      if (nextChordPressedRef.current) {
        nextChordPressedRef.current = false;
        setIsFlashing(true);
        setIsAdvancing(true);
      } else {
        // Normal completion: clear transition state
        isTransitioningRef.current = false;
      }
    }, 200);

    return () => clearTimeout(animationTimeout);
  }, [isAdvancing, selectedGroups]);

  return (
    <div className="chord-queue-wrapper">
      {fadingOutCard && (
        <div key={fadingOutCard.id} className="chord-card chord-card-fading">
          <span className="chord-card-label">
            {NOTE_NAMES[fadingOutCard.rootIndex]}{CHORD_PATTERNS.find(p => p.name === fadingOutCard.patternName)?.shorthand ?? ''}
          </span>
        </div>
      )}
      <div className={`chord-queue${isAdvancing ? ' advancing' : ''}`}>
        {queue.map((item) => (
          <div
            key={item.id}
            className="chord-card"
          >
            <span className="chord-card-label">
              {NOTE_NAMES[item.rootIndex]}{CHORD_PATTERNS.find(p => p.name === item.patternName)?.shorthand ?? ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
