export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export type SharpsFilter = 'no-sharps' | 'with-sharps' | 'sharps-only';
export type HandsMode = 'left' | 'both' | 'right';

export const TIMED_HISTORY_KEY = 'midiPianoTimedHistory';
export const OCTAVE_OFFSET_STORAGE_KEY = 'midiPianoOctaveOffset';

export type TimedResult = {
  score: number;
  mistakes: number;
  timestamp: string;
};

export type TimedHistory = {
  [configKey: string]: TimedResult[];
};

export class PracticeConfig {
  static readonly STORAGE_KEY = 'midiPianoPracticeConfig';

  selectedGroups: Set<string>;
  sharpsFilter: SharpsFilter;
  handsMode: HandsMode;
  selectedKey: string | null;

  constructor(
    selectedGroups: Set<string> = new Set(['Major']),
    sharpsFilter: SharpsFilter = 'with-sharps',
    handsMode: HandsMode = 'right',
    selectedKey: string | null = null
  ) {
    this.selectedGroups = selectedGroups;
    this.sharpsFilter = sharpsFilter;
    this.handsMode = handsMode;
    this.selectedKey = selectedKey;
  }

  toJson(): { selectedGroups: string[]; sharpsFilter: SharpsFilter; handsMode: HandsMode; selectedKey: string | null } {
    return {
      selectedGroups: [...this.selectedGroups],
      sharpsFilter: this.sharpsFilter,
      handsMode: this.handsMode,
      selectedKey: this.selectedKey,
    };
  }

  toString(): string {
    const groups = [...this.selectedGroups].sort().join(',');
    return `${groups}|${this.sharpsFilter}|${this.handsMode}|${this.selectedKey ?? 'none'}`;
  }

  static fromJson(data: unknown): PracticeConfig | null {
    if (!data || typeof data !== 'object') return null;

    const obj = data as Record<string, unknown>;
    const selectedGroups = obj.selectedGroups;
    const sharpsFilter = obj.sharpsFilter;
    const handsMode = obj.handsMode;
    const selectedKey = obj.selectedKey === undefined ? null : obj.selectedKey;

    if (!Array.isArray(selectedGroups) || selectedGroups.length === 0) return null;
    if (sharpsFilter !== 'no-sharps' && sharpsFilter !== 'sharps-only' && sharpsFilter !== 'with-sharps') return null;
    if (handsMode !== 'left' && handsMode !== 'both' && handsMode !== 'right') return null;
    if (selectedKey !== null && (typeof selectedKey !== 'string' || !NOTE_NAMES.includes(selectedKey))) return null;

    return new PracticeConfig(new Set(selectedGroups), sharpsFilter, handsMode, selectedKey);
  }
}

export const noteNumberToName = (noteNumber: number): string => {
  return NOTE_NAMES[noteNumber % 12];
};

export interface ChordGroup {
  name: string;
  shorthand: string;
  intervals: number[];
}

export const CHORD_GROUPS: ChordGroup[] = [
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

export const INVERSION_LABELS = ['Root Inversion', '1st Inversion', '2nd Inversion', '3rd Inversion'];

export const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];

export function getDiatonicPitchClasses(keyRoot: string): Set<number> {
  const rootIndex = NOTE_NAMES.indexOf(keyRoot);
  return new Set(MAJOR_SCALE_INTERVALS.map(i => (rootIndex + i) % 12));
}

export function isChordDiatonicToKey(rootNote: string, chordGroupName: string, keyRoot: string): boolean {
  const rootIndex = NOTE_NAMES.indexOf(rootNote);
  const chordGroup = CHORD_GROUPS.find(group => group.name === chordGroupName);
  if (rootIndex === -1 || !chordGroup) return false;
  const diatonicPitchClasses = getDiatonicPitchClasses(keyRoot);
  return chordGroup.intervals.every(interval => diatonicPitchClasses.has((rootIndex + interval) % 12));
}

export class Chord {
  constructor(readonly rootNote: string, readonly chordGroupName: string, readonly inversion: number = 0) {}

  name(): string {
    return `${this.rootNote} ${this.chordGroupName} (${INVERSION_LABELS[this.inversion]})`;
  }

  equals(other: Chord): boolean {
    return this.rootNote === other.rootNote && this.chordGroupName === other.chordGroupName;
  }

  matches(pressedNotes: Set<number>): boolean {
    const chordPCs = new Set(Array.from(this.getNoteIndices()).map(n => n % 12));
    const pressedPCs = new Set(Array.from(pressedNotes).map(n => n % 12));
    return chordPCs.size === pressedPCs.size && [...chordPCs].every(pc => pressedPCs.has(pc));
  }

  shorthand(): string {
    return CHORD_GROUPS.find(group => group.name === this.chordGroupName)?.shorthand ?? '';
  }

  getNoteIndices(baseNote = 60): Set<number> {
    const rootIndex = NOTE_NAMES.indexOf(this.rootNote);
    const chordGroup = CHORD_GROUPS.find(group => group.name === this.chordGroupName);
    if (rootIndex === -1 || !chordGroup) return new Set();
    return new Set(chordGroup.intervals.map(i => baseNote + rootIndex + i));
  }
}

export const detectChord = (pressedNotes: Set<number>): Chord | null => {
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

    // Try each chord group
    for (const chordGroup of CHORD_GROUPS) {
      if (intervals.length === chordGroup.intervals.length &&
          intervals.every((interval, index) => interval === chordGroup.intervals[index])) {
        const bassPitchClass = Math.min(...pressedNotes) % 12;
        const inversion = chordGroup.intervals.indexOf((bassPitchClass - root + 12) % 12);
        return new Chord(NOTE_NAMES[root], chordGroup.name, inversion);
      }
    }
  }

  return null;
};
