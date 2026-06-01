import { FC, useState, useEffect, useRef } from 'react';
import { CHORD_PATTERNS, NOTE_NAMES, PracticeConfig } from '../midi/noteUtils';
import { useMidi } from '../midi/MidiContext';
import './ChordQueue.css';

const MIDI_BASE = 60;

interface ChordQueueItem {
  id: number;
  rootIndex: number;
  patternName: string;
}

interface ChordQueueProps {
  config: PracticeConfig;
  onCurrentChordChange: (notes: Set<number>) => void;
  onChordMatched?: () => void;
  onChordMistake?: () => void;
}

let itemIdCounter = 0;

function getAvailableRootIndices(sharpsFilter: string): number[] {
  const SHARP_INDICES = [1, 3, 6, 8, 10]; // C#, D#, F#, G#, A#
  const ALL_INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  if (sharpsFilter === 'no-sharps') {
    return ALL_INDICES.filter(i => !SHARP_INDICES.includes(i));
  } else if (sharpsFilter === 'sharps-only') {
    return SHARP_INDICES;
  }
  return ALL_INDICES;
}

function generateChordItem(selectedGroups: Set<string>, sharpsFilter: string, exclude?: string): ChordQueueItem {
  const allowed = CHORD_PATTERNS.filter(p => selectedGroups.has(p.name));
  const availableRoots = getAvailableRootIndices(sharpsFilter);
  let item: ChordQueueItem;
  do {
    const pattern = allowed[Math.floor(Math.random() * allowed.length)];
    const rootIndex = availableRoots[Math.floor(Math.random() * availableRoots.length)];
    item = { id: itemIdCounter++, rootIndex, patternName: pattern.name };
  } while (exclude !== undefined && `${NOTE_NAMES[item.rootIndex]} ${item.patternName}` === exclude);
  return item;
}

function computeChordNotes(item: ChordQueueItem): Set<number> {
  const pattern = CHORD_PATTERNS.find(p => p.name === item.patternName);
  if (!pattern) return new Set();
  return new Set(pattern.intervals.map(i => MIDI_BASE + item.rootIndex + i));
}

export const ChordQueue: FC<ChordQueueProps> = ({ config, onCurrentChordChange, onChordMatched, onChordMistake }) => {
  const { selectedGroups, sharpsFilter, handsMode } = config;

  const [queue, setQueue] = useState<ChordQueueItem[]>(() =>
    Array.from({ length: 5 }, () => generateChordItem(selectedGroups, sharpsFilter))
  );

  const [isFlashing, setIsFlashing] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [fadingOutCard, setFadingOutCard] = useState<ChordQueueItem | null>(null);
  const isTransitioningRef = useRef(false);
  const nextChordPressedRef = useRef(false);
  const lastMatchedChordRef = useRef<string | null>(null);
  const fadingOutCardRef = useRef<ChordQueueItem | null>(null);

  const { pressedChords, pressedNotes } = useMidi();

  // Regenerate queue when config changes
  useEffect(() => {
    setQueue(Array.from({ length: 5 }, () => generateChordItem(selectedGroups, sharpsFilter)));
  }, [selectedGroups, sharpsFilter]);

  // Notify parent when current chord changes
  useEffect(() => {
    const currentChordNotes = computeChordNotes(queue[0]);
    onCurrentChordChange(currentChordNotes);
  }, [queue, onCurrentChordChange]);

  // Detect chord match and trigger flash
  useEffect(() => {
    if (!pressedChords && handsMode !== 'both') return;
    if (handsMode === 'both' && pressedNotes.size === 0) return;

    const target = `${NOTE_NAMES[queue[0].rootIndex]} ${queue[0].patternName}`;
    if (isTransitioningRef.current) return;

    let isMatch = false;
    if (handsMode === 'both') {
      // For both hands mode: only check for mistakes if 6+ notes are pressed
      if (pressedNotes.size < 6) return;
      // Check that each pitch class appears at least twice
      const targetNotes = computeChordNotes(queue[0]);
      const targetPCs = new Set(Array.from(targetNotes).map(n => n % 12));
      isMatch = [...targetPCs].every(pc =>
        Array.from(pressedNotes).filter(n => n % 12 === pc).length >= 2
      );
    } else {
      // For left/right modes: use chord name matching
      isMatch = pressedChords === target;
    }

    if (!isMatch) {
      onChordMistake?.();
      return;
    }

    isTransitioningRef.current = true;
    lastMatchedChordRef.current = target;
    nextChordPressedRef.current = false;
    fadingOutCardRef.current = queue[0];
    onChordMatched?.();
    setIsFlashing(true);
    setIsAdvancing(true);
  }, [pressedChords, pressedNotes, handsMode, queue]);

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
        generateChordItem(selectedGroups, sharpsFilter, rightmostChordName),
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
  }, [isAdvancing, selectedGroups, sharpsFilter]);

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
        {queue.map((item, index) => {
          const opacity = queue.length === 1
            ? 1
            : 1 - (index / (queue.length - 1)) * 0.7;
          return (
            <div
              key={item.id}
              className={`chord-card${index === 0 ? ' chord-card-target' : ''}`}
              style={{ opacity }}
            >
              <span className="chord-card-label">
                {NOTE_NAMES[item.rootIndex]}{CHORD_PATTERNS.find(p => p.name === item.patternName)?.shorthand ?? ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
