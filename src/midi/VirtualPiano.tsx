import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { getWhiteKeysFromTotalKeys, KEYBOARD_OFFSETS, KEYBOARD_SIZES, Settings } from '../pages/Settings';
import { noteNumberToName } from './noteUtils';
import './VirtualPiano.css';

interface VirtualPianoProps {
  numKeys?: number;
  pressedNotes?: Set<number>;
  secondaryPressedNotes?: Set<number>;
  maxWidth?: number;
  maxHeight?: number;
  header?: string;
  showSettings?: boolean;
  showNotes?: boolean;
  onNumKeysChange?: (numKeys: number) => void;
  onShowNotesChange?: (showNotes: boolean) => void;
}

export function VirtualPiano({
  numKeys = 88,
  pressedNotes = new Set(),
  secondaryPressedNotes = new Set(),
  maxWidth = 1200,
  maxHeight = 200,
  header = "",
  showSettings = false,
  showNotes = false,
  onNumKeysChange,
  onShowNotesChange,
}: VirtualPianoProps = {}) {
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [screenWidth, setScreenWidth] = useState(window.innerWidth);

    useEffect(() => {
      const handleResize = () => setScreenWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    const numWhiteKeys = getWhiteKeysFromTotalKeys(numKeys);
    const offset = KEYBOARD_OFFSETS[numKeys] ?? 21;
    const blackKeyPattern = [true, true, false, true, true, true, false];

    const startPitchClass = offset % 12;
    const semitoneToWhiteKeyIndex: Record<number, number> = {
      0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6
    };
    const startWhiteKeyIndex = semitoneToWhiteKeyIndex[startPitchClass] ?? 0;

    // Scalable Interactive Piano
    const scaleFactor = 50;
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
    const effectiveMaxWidth = Math.min(maxWidth, screenWidth*0.9);
    const widthConstratinedWidth = Math.min(keyboardWidth, effectiveMaxWidth); // The Virtual Piano width can not exceed 1000px
    const widthConstratinedHeight = widthConstratinedWidth * (1/widthToHeighRatio);

    const headerFontSize = scaleFactor*0.8;
    const headerWidth = headerFontSize * header.length/2;
    const headerXPosition = (keyboardWidth/2) - (headerWidth/2); // centered
    const headerYPosition = scaleFactor * 1.4;

    const gearIconSize = scaleFactor * 1.4;

    const getKeyNumber = (whiteKeyNum: number) => {
        const adjustedWhiteKeyNum = whiteKeyNum + startWhiteKeyIndex;
        let blackKeyCount = (Math.floor(adjustedWhiteKeyNum / 7)) * 5;
        for (let i = 0; i <= (adjustedWhiteKeyNum % 7) - 1; i++) {
            blackKeyCount += blackKeyPattern[i] ? 1 : 0;
        }
        return (adjustedWhiteKeyNum + blackKeyCount) - startPitchClass;
    }

    return (
      <>
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
            fontSize={headerFontSize}
            fontWeight="bold"
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
            rx={scaleFactor/10}
            ry={scaleFactor/10}
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
                    rx={scaleFactor/12}
                    ry={scaleFactor/12}
                />
            ) : null
        })}

        {/* Display Notes on keyboard */}
        {Array.from({ length: numWhiteKeys }).map((_, i) => {
            const noteNumber = getKeyNumber(i) + offset;
          return showNotes ? (<text
            key={`white-note-${i}`}
            x={(i * whiteKeyWidth) + keyboardSideWidth + (keyboardEdgePadding/2) + whiteKeyWidth/3}
            y={keyboardTopWidth - (keyboardHeight*0.05) + whiteKeyHeight*0.95}
            height={whiteKeyHeight}
            fill="black"
          >{noteNumberToName(noteNumber)}</text>) : null
        })}
        {Array.from({ length: numWhiteKeys }).map((_, i) => {
            const noteNumber = getKeyNumber(i) + 1;
            return showNotes && blackKeyPattern[(startWhiteKeyIndex + i) % 7] && noteNumber < numKeys ? (
                <text
                    key={`black-note-${i}`}
                    x={(i * whiteKeyWidth) + (whiteKeyWidth-(blackKeyWidth/2)) + keyboardSideWidth + (keyboardEdgePadding/2)}
                    y={keyboardTopWidth - (keyboardHeight*0.05) + blackKeyHeight*0.95}
                    width={blackKeyWidth}
                    height={blackKeyHeight}
                    fill="white"
                    fontSize={scaleFactor*0.4}
                >{noteNumberToName(noteNumber + offset)}</text>
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

        {showSettings && (
          <foreignObject
            x={keyboardWidth - keyboardSideWidth - gearIconSize - scaleFactor * 0.3}
            y={scaleFactor * 0.3}
            width={gearIconSize}
            height={gearIconSize}
          >
            <button
              onClick={() => setSettingsOpen(true)}
              style={{
                width: '100%',
                height: '100%',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: `${scaleFactor * 0.8}px`,
                color: 'black',
              }}
            >
              <FontAwesomeIcon icon={faGear} />
            </button>
          </foreignObject>
        )}

      </svg>

      {settingsOpen && (
        <>
          <div className="piano-settings-backdrop" onClick={() => setSettingsOpen(false)} />
          <div className="piano-settings-panel">
            <div className="piano-settings-panel-header">
              <h3>Piano Settings</h3>
              <button className="piano-settings-close" onClick={() => setSettingsOpen(false)}>✕</button>
            </div>
            <Settings
              numKeys={numKeys}
              onNumKeysChange={onNumKeysChange ?? (() => {})}
              keyboardSizes={KEYBOARD_SIZES}
              showNotes={showNotes}
              onShowNotesChange={onShowNotesChange ?? (() => {})}
            />
          </div>
        </>
      )}
      </>
    );
  }
