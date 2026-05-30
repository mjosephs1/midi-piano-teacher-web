export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export type SharpsFilter = 'no-sharps' | 'with-sharps' | 'sharps-only';

export const noteNumberToName = (noteNumber: number): string => {
  return NOTE_NAMES[noteNumber % 12];
};

export interface ChordPattern {
  name: string;
  shorthand: string;
  intervals: number[];
}

export const CHORD_PATTERNS: ChordPattern[] = [
  { name: 'Major', shorthand: 'maj', intervals: [0, 4, 7] },
  { name: 'Minor', shorthand: 'm', intervals: [0, 3, 7] },
  { name: 'Diminished', shorthand: 'dim', intervals: [0, 3, 6] },
  { name: 'Augmented', shorthand: 'aug', intervals: [0, 4, 8] },
  { name: 'Sus2', shorthand: 'sus2', intervals: [0, 2, 7] },
  { name: 'Sus4', shorthand: 'sus4', intervals: [0, 5, 7] },
  { name: 'Dominant 7', shorthand: '7', intervals: [0, 4, 7, 10] },
  { name: 'Major 7', shorthand: 'maj7', intervals: [0, 4, 7, 11] },
  { name: 'Minor 7', shorthand: 'm7', intervals: [0, 3, 7, 10] },
  { name: 'Diminished 7', shorthand: 'dim7', intervals: [0, 3, 6, 9] },
  { name: 'Half-dim 7', shorthand: 'ø7', intervals: [0, 3, 6, 10] },
];

export const detectChord = (pressedNotes: Set<number>): string | null => {
  if (pressedNotes.size < 3) {
    return null;
  }

  // Extract unique pitch classes
  const pitchClasses = new Set(Array.from(pressedNotes).map((note) => note % 12));

  if (pitchClasses.size < 3) {
    return null;
  }

  const sortedPitches = Array.from(pitchClasses).sort((a, b) => a - b);

  // Try each pitch as the root
  for (const root of sortedPitches) {
    const intervals = sortedPitches
      .map((pitch) => (pitch - root + 12) % 12)
      .sort((a, b) => a - b);

    // Try each chord pattern
    for (const pattern of CHORD_PATTERNS) {
      if (intervals.length === pattern.intervals.length &&
          intervals.every((interval, index) => interval === pattern.intervals[index])) {
        return `${NOTE_NAMES[root]} ${pattern.name}`;
      }
    }
  }

  return null;
};
