const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const noteNumberToName = (noteNumber: number): string => {
  return NOTE_NAMES[noteNumber % 12];
};
