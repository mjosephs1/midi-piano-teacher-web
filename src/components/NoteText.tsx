import type { FC } from 'react';
import './NoteText.css';

// Single entry point for rendering any display string that may contain ♯/♭ (note names,
// chord names, etc.). Each accidental is wrapped in an element with a pinned font and an
// explicit size/offset, so it renders identically regardless of the surrounding element's
// font, weight, or letter-spacing. Without this, the glyph comes from whatever font the
// container happens to resolve (body text vs. <button> vs. SVG), and those fonts draw
// ♯/♭ at different sizes, heights, and widths.

const ACCIDENTAL_SPLIT = /([♯♭])/;
const isAccidental = (part: string): boolean => part === '♯' || part === '♭';

interface NoteTextProps {
  text: string;
  // Render inside an SVG <text> element (emits <tspan>s instead of <span>s)
  svg?: boolean;
  // Superscript the accidentals (default). Pass false for a standalone symbol, e.g. the nav toggle.
  raised?: boolean;
}

export const NoteText: FC<NoteTextProps> = ({ text, svg = false, raised = true }) => {
  const parts = text.split(ACCIDENTAL_SPLIT).filter(part => part !== '');
  const accidentalClass = `accidental${raised ? ' accidental--raised' : ''}`;

  if (!svg) {
    return (
      <>
        {parts.map((part, i) => isAccidental(part)
          ? <span key={i} className={accidentalClass}>{part}</span>
          : part)}
      </>
    );
  }

  // vertical-align doesn't apply inside SVG, so raise the accidental with dy and drop the
  // following text back down to the baseline, matching the HTML vertical-align offset.
  return (
    <>
      {parts.map((part, i) => {
        if (isAccidental(part)) {
          return <tspan key={i} className={accidentalClass} dy={raised ? '-0.25em' : undefined}>{part}</tspan>;
        }
        const followsRaisedAccidental = raised && i > 0 && isAccidental(parts[i - 1]);
        return <tspan key={i} dy={followsRaisedAccidental ? '0.25em' : undefined}>{part}</tspan>;
      })}
    </>
  );
};
