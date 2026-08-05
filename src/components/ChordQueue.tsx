import { FC, useState, useEffect, useMemo, useRef } from 'react';
import { CHORD_GROUPS, NOTE_NAMES, PracticeConfig, Chord, isChordDiatonicToKey } from '../midi/noteUtils';
import { useMidi } from '../midi/MidiContext';
import './ChordQueue.css';

interface ChordQueueItem {
  id: number;
  chord: Chord;
}

interface ChordQueueProps {
  config: PracticeConfig;
  onCurrentChordChange: (chord: Chord) => void;
  onChordMatched?: () => void;
  onChordMistake?: () => void;
}

let itemIdCounter = 0;

function getAvailableRootNotes(sharpsFilter: string): string[] {
  const SHARP_NOTES = ['C#', 'D#', 'F#', 'G#', 'A#'];

  if (sharpsFilter === 'no-sharps') {
    return NOTE_NAMES.filter(n => !SHARP_NOTES.includes(n));
  } else if (sharpsFilter === 'sharps-only') {
    return SHARP_NOTES;
  }
  return [...NOTE_NAMES];
}

function getAvailableChordPool(
  selectedGroups: Set<string>,
  sharpsFilter: string,
  selectedKey: string | null
): Chord[] {
  const allowedGroups = CHORD_GROUPS.filter(p => selectedGroups.has(p.name));
  const availableRoots = getAvailableRootNotes(sharpsFilter);
  const pool: Chord[] = [];
  for (const rootNote of availableRoots) {
    for (const chordGroup of allowedGroups) {
      if (selectedKey === null || isChordDiatonicToKey(rootNote, chordGroup.name, selectedKey)) {
        pool.push(new Chord(rootNote, chordGroup.name));
      }
    }
  }
  return pool;
}

function generateChordItem(pool: Chord[], exclude?: Chord): ChordQueueItem {
  const candidates = (pool.length > 1 && exclude)
    ? pool.filter(c => !(c.rootNote === exclude.rootNote && c.chordGroupName === exclude.chordGroupName))
    : pool;
  const choice = candidates[Math.floor(Math.random() * candidates.length)];
  return { id: itemIdCounter++, chord: choice };
}

function generateInitialQueue(pool: Chord[]): ChordQueueItem[] {
  const items: ChordQueueItem[] = [];
  for (let i = 0; i < 5; i++) {
    items.push(generateChordItem(pool, items[i - 1]?.chord));
  }
  return items;
}

export const ChordQueue: FC<ChordQueueProps> = ({ config, onCurrentChordChange, onChordMatched, onChordMistake }) => {
  const { selectedGroups, sharpsFilter, handsMode, selectedKey } = config;

  const onChordMatchedRef = useRef(onChordMatched);
  const onChordMistakeRef = useRef(onChordMistake);
  onChordMatchedRef.current = onChordMatched;
  onChordMistakeRef.current = onChordMistake;

  const pool = useMemo(
    () => getAvailableChordPool(selectedGroups, sharpsFilter, selectedKey),
    [selectedGroups, sharpsFilter, selectedKey]
  );

  const [queue, setQueue] = useState<ChordQueueItem[]>(() =>
    pool.length > 0 ? generateInitialQueue(pool) : []
  );

  const [isAdvancing, setIsAdvancing] = useState(false);
  const [fadingOutCard, setFadingOutCard] = useState<ChordQueueItem | null>(null);
  const isTransitioningRef = useRef(false);
  const nextChordPressedRef = useRef(false);
  const lastMatchedChordRef = useRef<Chord | null>(null);
  const fadingOutCardRef = useRef<ChordQueueItem | null>(null);

  const { pressedChord, pressedNotes } = useMidi();

  // Regenerate queue when config changes
  useEffect(() => {
    setQueue(pool.length > 0 ? generateInitialQueue(pool) : []);
  }, [pool]);

  // Notify parent when current chord changes
  useEffect(() => {
    if (queue.length === 0) return;
    onCurrentChordChange(queue[0].chord);
  }, [queue, onCurrentChordChange]);

  // Detect chord match and trigger flash
  useEffect(() => {
    if (queue.length === 0) return;
    if (!pressedChord && handsMode !== 'both') return;
    if (handsMode === 'both' && pressedNotes.size === 0) return;

    const targetChord = queue[0].chord;
    if (isTransitioningRef.current) return;

    let isMatch = false;
    if (handsMode === 'both') {
      if (pressedNotes.size < 6) return;
      const targetNotes = targetChord.getNoteIndices();
      const targetPCs = new Set(Array.from(targetNotes).map(n => n % 12));
      isMatch = [...targetPCs].every(pc =>
        Array.from(pressedNotes).filter(n => n % 12 === pc).length >= 2
      );
    } else {
      if (!pressedChord) return;
      isMatch = targetChord.matches(pressedNotes);
    }

    if (!isMatch) {
      onChordMistakeRef.current?.();
      return;
    }

    isTransitioningRef.current = true;
    lastMatchedChordRef.current = targetChord;
    nextChordPressedRef.current = false;
    fadingOutCardRef.current = queue[0];
    onChordMatchedRef.current?.();
    setIsAdvancing(true);
  }, [pressedChord, pressedNotes, handsMode, queue]);

  // Detect if a new chord is pressed while transitioning
  useEffect(() => {
    if (queue.length === 0 || !isTransitioningRef.current || !pressedChord) return;

    const targetChord = queue[0].chord;
    if (pressedChord.equals(targetChord) && !lastMatchedChordRef.current?.equals(pressedChord)) {
      nextChordPressedRef.current = true;
    }
  }, [pressedChord, queue]);

  // Handle queue advance and animation timing
  useEffect(() => {
    if (!isAdvancing) return;

    setFadingOutCard(fadingOutCardRef.current);

    setQueue(prev => [
      ...prev.slice(1),
      generateChordItem(pool, prev[4].chord),
    ]);

    const animationTimeout = setTimeout(() => {
      setFadingOutCard(null);
      setIsAdvancing(false);

      if (nextChordPressedRef.current) {
        nextChordPressedRef.current = false;
        setIsAdvancing(true);
      } else {
        isTransitioningRef.current = false;
      }
    }, 200);

    return () => clearTimeout(animationTimeout);
  }, [isAdvancing, pool]);

  if (pool.length === 0) {
    return (
      <div className="chord-queue-wrapper chord-queue-empty">
        <p className="chord-queue-empty-message">
          No chords match this configuration. Try selecting a different key or chord group.
        </p>
      </div>
    );
  }

  return (
    <div className="chord-queue-wrapper">
      {fadingOutCard && (
        <div key={fadingOutCard.id} className="chord-card chord-card-fading">
          <span className="chord-card-label">
            {fadingOutCard.chord.rootNote}{fadingOutCard.chord.shorthand()}
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
                {item.chord.rootNote}{item.chord.shorthand()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
