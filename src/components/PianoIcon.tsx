import { useState } from "react";
type Props = { pianoIconWidth: number; };

export function PianoIcon({ pianoIconWidth }: Props) {
    const [hovered, setHovered] = useState(false);

    const numWhiteKeys = 7;
    const whiteKeyWidth = 50;
    const whiteKeyHeight = whiteKeyWidth * 3.5;
    const blackKeyWidth = whiteKeyWidth * 0.6;
    const blackKeyHeight = whiteKeyHeight * 0.6;
    const svgDimensions = `0 0 ${whiteKeyWidth * numWhiteKeys} ${whiteKeyHeight}`;
    const piranoIconHeight = pianoIconWidth * (whiteKeyHeight / (whiteKeyWidth * numWhiteKeys));

    return (
        <svg className="virtual-piano" viewBox={svgDimensions} width={pianoIconWidth} height={piranoIconHeight}>
            {Array.from({ length: numWhiteKeys }).map((_, i) => {
            return <rect
                key={`white-${i}`}
                stroke="black"           // border color
                strokeWidth={5}
                fill={hovered && (i == 1 || i == 5) ? "#E04040" : "white"} 
                x={i * whiteKeyWidth}
                y={0}
                width={whiteKeyWidth}
                height={whiteKeyHeight}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            />
            })}
            {
            Array.from({ length: numWhiteKeys-1 }).map((_, i) => {
                return i != 2 ? (
                    <rect
                        key={`black-${i}`}
                        stroke="black"
                        strokeWidth={5}
                        fill={hovered && i == 3 ? "#E04040" : "black"} 
                        x={(i * whiteKeyWidth) + (whiteKeyWidth-(blackKeyWidth/2))}
                        y={0}
                        width={blackKeyWidth}
                        height={blackKeyHeight}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                    />
                ) : null
            })}
        </svg>
    )
}