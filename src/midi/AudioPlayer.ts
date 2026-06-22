import * as Tone from 'tone';

const NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[midi % 12]}${octave}`;
}

let synth: Tone.PolySynth | null = null;
let audioStarted = false;
let audioInitPromise: Promise<void> | null = null;

async function initAudio(): Promise<void> {
  await Tone.start();
  // Freeverb is algorithmic (no IR generation) — create after Tone.start() so the
  // AudioContext isn't instantiated until the user has interacted with the page
  const reverb = new Tone.Freeverb({ roomSize: 0.6, dampening: 3000, wet: 0.2 }).toDestination();
  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: {
      attack: 0.005,
      decay: 0.6,
      sustain: 0.1,
      release: 2.5,
    },
    volume: -6,
  }).connect(reverb);
  audioStarted = true;
}

export function startAudio(): Promise<void> {
  if (!audioInitPromise) audioInitPromise = initAudio();
  return audioInitPromise;
}

export function playNote(midi: number, velocity: number): void {
  if (!audioStarted || !synth) return;
  synth.triggerAttack(midiToNoteName(midi), Tone.now(), velocity / 127);
}

export function stopNote(midi: number): void {
  if (!audioStarted || !synth) return;
  synth.triggerRelease(midiToNoteName(midi), Tone.now());
}
