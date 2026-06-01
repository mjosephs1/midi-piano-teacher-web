import type { FC } from 'react';
import './Settings.css';

export const KEYBOARD_SIZES = [25, 37, 49, 61, 76, 88] as const;

export const KEYBOARD_OFFSETS: Record<number, number> = {
  25: 60,  // C4 (middle C)
  37: 48,  // C3
  49: 36,  // C2
  61: 36,  // C2
  76: 28,  // E1
  88: 21,  // A0
};

export function getWhiteKeysFromTotalKeys(numKeys: number): number {
  const mapping: Record<number, number> = {
    25: 15,
    37: 22,
    49: 29,
    61: 36,
    76: 45,
    88: 52,
  };
  return mapping[numKeys] ?? 52;
}

interface SettingsProps {
  numKeys: number;
  onNumKeysChange: (numKeys: number) => void;
  keyboardSizes: readonly number[];
}

export const Settings: FC<SettingsProps> = ({
  numKeys,
  onNumKeysChange,
  keyboardSizes,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onNumKeysChange(parseInt(e.target.value, 10));
  };

  return (
    <div className="settings-page">
      {/* <h2>Settings</h2> */}
      <div className="settings-row">
        <label htmlFor="keyboard-size">Keyboard Size</label>
        <select
          id="keyboard-size"
          value={numKeys}
          onChange={handleChange}
        >
          {keyboardSizes.map((size) => (
            <option key={size} value={size}>
              {size} keys
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
