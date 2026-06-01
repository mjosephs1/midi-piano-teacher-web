import { getWhiteKeysFromTotalKeys, KEYBOARD_OFFSETS } from '../pages/Settings';
import './VirtualPiano.css';

interface VirtualPianoProps {
  numKeys?: number;
  pressedNotes?: Set<number>;
  secondaryPressedNotes?: Set<number>;
}

export function VirtualPiano({ numKeys = 88, pressedNotes = new Set(), secondaryPressedNotes = new Set() }: VirtualPianoProps = {}) {
    const numWhiteKeys = getWhiteKeysFromTotalKeys(numKeys);
    const offset = KEYBOARD_OFFSETS[numKeys] ?? 21;
    const blackKeyPattern = [true, true, false, true, true, true, false];

    // Scalable Interactive Piano
    const scaleFactor = 50;
    const whiteKeyWidth = scaleFactor;
    const whiteKeyHeight = whiteKeyWidth * 4;
    const blackKeyWidth = whiteKeyWidth * 0.6;
    const blackKeyHeight = whiteKeyHeight * 0.6;
    const svgDimensions = `0 0 ${whiteKeyWidth * numWhiteKeys} ${whiteKeyHeight}`

    const getKeyNumber = (whiteKeyNum: number) => {
        let blackKeyCount = ((Math.floor(whiteKeyNum / 7)) * 5);
        for(let i = 0; i <= (whiteKeyNum%7) - 1; i++) {
            blackKeyCount += blackKeyPattern[i] ? 1 : 0;
        }
        return whiteKeyNum + blackKeyCount;
    }

    return (
      <svg className="virtual-piano" viewBox={svgDimensions} width="1000" height="200">
        {Array.from({ length: numWhiteKeys }).map((_, i) => {
            const noteNumber = getKeyNumber(i);
          return <rect
            key={`white-${i}`}
            className={`white-key ${pressedNotes.has(noteNumber + offset) ? 'active' : ''} ${secondaryPressedNotes.has(noteNumber + offset) ? 'secondary' : ''}`}
            x={i * whiteKeyWidth}
            y={0}
            width={whiteKeyWidth}
            height={whiteKeyHeight}
          />
        })}
        {
        Array.from({ length: numWhiteKeys }).map((_, i) => {
            const noteNumber = getKeyNumber(i) + 1;
            return blackKeyPattern[i%7] && noteNumber < numKeys ? (
                <rect
                    key={`black-${i}`}
                    className={`black-key ${pressedNotes.has(noteNumber + offset) ? 'active' : ''} ${secondaryPressedNotes.has(noteNumber + offset) ? 'secondary' : ''}`}
                    x={(i * whiteKeyWidth) + (whiteKeyWidth-(blackKeyWidth/2))}
                    y={0}
                    width={blackKeyWidth}
                    height={blackKeyHeight}
                />
            ) : null
        })}
      </svg>
    );
  }