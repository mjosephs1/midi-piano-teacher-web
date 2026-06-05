import { getWhiteKeysFromTotalKeys, KEYBOARD_OFFSETS } from '../pages/Settings';
import './VirtualPiano.css';

interface VirtualPianoProps {
  numKeys?: number;
  pressedNotes?: Set<number>;
  secondaryPressedNotes?: Set<number>;
  maxWidth?: number;
  maxHeight?: number;
  header?: string;
}

export function VirtualPiano({
  numKeys = 88,
  pressedNotes = new Set(),
  secondaryPressedNotes = new Set(),
  maxWidth = 1200,
  maxHeight = 200,
  header = ""
}: VirtualPianoProps = {}) {
    const numWhiteKeys = getWhiteKeysFromTotalKeys(numKeys);
    const offset = KEYBOARD_OFFSETS[numKeys] ?? 21;
    const blackKeyPattern = [true, true, false, true, true, true, false];

    const startPitchClass = offset % 12;
    const semitoneToWhiteKeyIndex: Record<number, number> = {
      0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6
    };
    const startWhiteKeyIndex = semitoneToWhiteKeyIndex[startPitchClass] ?? 0;

    // Scalable Interactive Piano
    const scaleFactor = 30;
    const whiteKeyWidth = scaleFactor;
    const whiteKeyHeight = whiteKeyWidth * 4.5;
    const blackKeyWidth = whiteKeyWidth * 0.6;
    const blackKeyHeight = whiteKeyHeight * 0.6;

    const keyboardSideWidth = whiteKeyWidth;
    const keyboardTopWidth = whiteKeyHeight * 0.6;
    const keyboardEdgePadding = scaleFactor/10; // prevent lines from being cutoff at the edges
    const keyboardWidth = (whiteKeyWidth * numWhiteKeys) + (keyboardSideWidth * 2) + keyboardEdgePadding;
    const keyboardHeight = whiteKeyHeight + keyboardTopWidth + keyboardEdgePadding;
    const svgDimensions = `0 0 ${keyboardWidth} ${keyboardHeight}`

    // Cap the width/height to prevent it from rendering too large
    const widthToHeighRatio = keyboardWidth/keyboardHeight;
    const heightConstrainedHeight = Math.min(keyboardHeight, maxHeight); // The Virtual Piano height can not exceed 200px
    const heightConstrainedWidth = heightConstrainedHeight * widthToHeighRatio;
    const widthConstratinedWidth = Math.min(keyboardWidth, maxWidth); // The Virtual Piano width can not exceed 1000px
    const widthConstratinedHeight = widthConstratinedWidth * (1/widthToHeighRatio);

    const headerFontSize = scaleFactor*0.8;
    const headerWidth = headerFontSize * header.length/2;
    const headerXPosition = (keyboardWidth/2) - (headerWidth/2); // centered
    const headerYPosition = scaleFactor * 1.4;
    

    const getKeyNumber = (whiteKeyNum: number) => {
        const adjustedWhiteKeyNum = whiteKeyNum + startWhiteKeyIndex;
        let blackKeyCount = (Math.floor(adjustedWhiteKeyNum / 7)) * 5;
        for (let i = 0; i <= (adjustedWhiteKeyNum % 7) - 1; i++) {
            blackKeyCount += blackKeyPattern[i] ? 1 : 0;
        }
        return (adjustedWhiteKeyNum + blackKeyCount) - startPitchClass;
    }

    return (
      <svg className="virtual-piano" viewBox={svgDimensions} width={Math.min(heightConstrainedWidth, widthConstratinedWidth)} height={Math.min(heightConstrainedHeight, widthConstratinedHeight)}>
        <rect 
          x={keyboardEdgePadding/2}
          y={keyboardEdgePadding/2}
          width={(whiteKeyWidth * numWhiteKeys) + (keyboardSideWidth * 2)}
          height={whiteKeyHeight + keyboardTopWidth}
          fill="white"
          stroke="black"
          strokeWidth={keyboardEdgePadding}
          rx={scaleFactor/2}
          ry={scaleFactor/2}
        />

        {
        header !== "" && 
          <text
            x={headerXPosition}
            y={headerYPosition}
            fill="black"
            font-size={headerFontSize}
            font-weight="bold"
          >
            {header}
          </text>
        }

        {Array.from({ length: numWhiteKeys }).map((_, i) => {
            const noteNumber = getKeyNumber(i);
          return <rect
            key={`white-${i}`}
            className={`white-key ${pressedNotes.has(noteNumber + offset) ? 'active' : ''} ${secondaryPressedNotes.has(noteNumber + offset) ? 'secondary' : ''}`}
            x={(i * whiteKeyWidth) + keyboardSideWidth + (keyboardEdgePadding/2)}
            y={keyboardTopWidth - (keyboardHeight*0.05)}
            width={whiteKeyWidth}
            height={whiteKeyHeight}
          />
        })}
        {
        Array.from({ length: numWhiteKeys }).map((_, i) => {
            const noteNumber = getKeyNumber(i) + 1;
            return blackKeyPattern[(startWhiteKeyIndex + i) % 7] && noteNumber < numKeys ? (
                <rect
                    key={`black-${i}`}
                    className={`black-key ${pressedNotes.has(noteNumber + offset) ? 'active' : ''} ${secondaryPressedNotes.has(noteNumber + offset) ? 'secondary' : ''}`}
                    x={(i * whiteKeyWidth) + (whiteKeyWidth-(blackKeyWidth/2)) + keyboardSideWidth + (keyboardEdgePadding/2)}
                    y={keyboardTopWidth - (keyboardHeight*0.05)}
                    width={blackKeyWidth}
                    height={blackKeyHeight}
                />
            ) : null
        })}

        {/* Uncomment to visually see the MIDI note numbers on the virtual keyboard */}
        {/* {Array.from({ length: numWhiteKeys }).map((_, i) => {
          const noteNumber = getKeyNumber(i);
          const noteLabel = noteNumber + offset;

          return <text 
          x={(i * whiteKeyWidth) + keyboardSideWidth + (keyboardEdgePadding/2)}
          y={keyboardTopWidth + whiteKeyHeight - (keyboardHeight*0.05)}
          fill="black"
          >{noteLabel}</text>
        })} */}

      </svg>
    );
  }