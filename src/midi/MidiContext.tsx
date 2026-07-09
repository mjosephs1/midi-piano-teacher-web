import React, { createContext, useContext, useEffect, useRef, useState, ReactNode, FC, useMemo } from 'react';
import { detectChord, Chord } from './noteUtils';
import { startAudio, playNote, stopNote } from './AudioPlayer';

// Web MIDI API types (not included in standard TypeScript DOM lib)
interface MIDIMessageEvent extends Event {
  data: Uint8Array;
}

interface MIDIInput extends EventTarget {
  onmidimessage: ((event: MIDIMessageEvent) => void) | null;
}

type MIDIInputMap = Map<string, MIDIInput> & {
  values(): IterableIterator<MIDIInput>;
};

interface MIDIAccess {
  inputs: MIDIInputMap;
  outputs: any;
}

type MidiStatus = 'unavailable' | 'denied' | 'listening';

interface MidiContextValue {
  pressedNotes: Set<number>;
  status: MidiStatus;
  pressedChord: Chord | null;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

const MidiContext = createContext<MidiContextValue | undefined>(undefined);

interface MidiProviderProps {
  children: ReactNode;
}

export const MidiProvider: FC<MidiProviderProps> = ({ children }) => {
  const [pressedNotes, setPressedNotes] = useState<Set<number>>(new Set());
  const [status, setStatus] = useState<MidiStatus>('unavailable');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(true);
  const pressedNotesRef = useRef<Set<number>>(new Set());
  const pressedChord = useMemo(() => detectChord(pressedNotes), [pressedNotes]);

  useEffect(() => {
    pressedNotesRef.current = pressedNotes;
  }, [pressedNotes]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
    if (!soundEnabled) {
      pressedNotesRef.current.forEach(note => stopNote(note));
    }
  }, [soundEnabled]);

  useEffect(() => {
    const onInteraction = () => {
      startAudio();
      document.removeEventListener('click', onInteraction);
      document.removeEventListener('keydown', onInteraction);
    };
    document.addEventListener('click', onInteraction);
    document.addEventListener('keydown', onInteraction);
    return () => {
      document.removeEventListener('click', onInteraction);
      document.removeEventListener('keydown', onInteraction);
    };
  }, []);

  useEffect(() => {
    const setupMidi = async () => {
      try {
        const midiAccess = await (navigator as any).requestMIDIAccess();
        setStatus('listening');

        const onMidiMessage = (event: MIDIMessageEvent) => {
          const [statusByte, noteName, velocity] = event.data;
          const status = statusByte & 0xf0;
          const noteNumber = noteName;

          // 0x90 = note on, 0x80 = note off
          if (status === 0x90 && velocity > 0) {
            // Note on — also try to start audio; works if the browser has sticky user activation
            startAudio();
            if (soundEnabledRef.current) playNote(noteNumber, velocity);
            setPressedNotes((prev) => new Set(prev).add(noteNumber));
          } else if (status === 0x80 || (status === 0x90 && velocity === 0)) {
            // Note off — always stop even when muted, so notes don't sustain indefinitely
            stopNote(noteNumber);
            setPressedNotes((prev) => {
              const next = new Set(prev);
              next.delete(noteNumber);
              return next;
            });
          }
        };

        // Attach listeners to all current inputs
        midiAccess.inputs.forEach((input: MIDIInput) => {
          input.onmidimessage = onMidiMessage;
        });

        // Handle new inputs that may be connected later
        (midiAccess as any).onstatechange = (event: any) => {
          const input = event.port as MIDIInput;
          if (event.port.type === 'input') {
            input.onmidimessage = onMidiMessage;
          }
        };
      } catch (error) {
        if ((error as Error).name === 'NotAllowedError') {
          setStatus('denied');
        } else {
          setStatus('unavailable');
        }
      }
    };

    setupMidi();
  }, []);

  return (
    <MidiContext.Provider value={{ pressedNotes, status, pressedChord, soundEnabled, setSoundEnabled }}>
      {children}
    </MidiContext.Provider>
  );
};

export const useMidi = (): MidiContextValue => {
  const context = useContext(MidiContext);
  if (!context) {
    throw new Error('useMidi must be used within a MidiProvider');
  }
  return context;
};
