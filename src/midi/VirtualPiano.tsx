import { getWhiteKeysFromTotalKeys, KEYBOARD_OFFSETS } from '../pages/Settings';
import './VirtualPiano.css';

interface VirtualPianoProps {
  numKeys?: number;
  pressedNotes?: Set<number>;
  secondaryPressedNotes?: Set<number>;
  maxWidth?: number;
  maxHeight?: number;
}

export function VirtualPiano({ numKeys = 88, pressedNotes = new Set(), secondaryPressedNotes = new Set(), maxWidth = 1200, maxHeight = 200 }: VirtualPianoProps = {}) {
    const numWhiteKeys = getWhiteKeysFromTotalKeys(numKeys);
    const offset = KEYBOARD_OFFSETS[numKeys] ?? 21;
    const blackKeyPattern = [true, true, false, true, true, true, false];

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
    
    // widthToHeighRatio * actualHeight;

    const getKeyNumber = (whiteKeyNum: number) => {
        let blackKeyCount = ((Math.floor(whiteKeyNum / 7)) * 5);
        for(let i = 0; i <= (whiteKeyNum%7) - 1; i++) {
            blackKeyCount += blackKeyPattern[i] ? 1 : 0;
        }
        return whiteKeyNum + blackKeyCount;
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
            return blackKeyPattern[i%7] && noteNumber < numKeys ? (
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
          y={keyboardTopWidth+150}
          fill="black"
          >{noteLabel}</text>
        })} */}

      </svg>
    );
  }