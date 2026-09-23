import { createContext, FC, ReactNode, useContext, useEffect, useState } from 'react';
import { AccidentalStyle } from '../midi/noteUtils';
import { useStorage } from './StorageContext';

interface AccidentalContextValue {
  accidentalStyle: AccidentalStyle;
  setAccidentalStyle: (style: AccidentalStyle) => void;
}

const AccidentalContext = createContext<AccidentalContextValue | undefined>(undefined);

interface AccidentalProviderProps {
  children: ReactNode;
}

export const AccidentalProvider: FC<AccidentalProviderProps> = ({ children }) => {
  const { loadSettings, saveSettings } = useStorage();
  const [accidentalStyle, setAccidentalStyle] = useState<AccidentalStyle>('sharp');
  // State rather than a ref: it also gates rendering, so the app never paints with the
  // default 'sharp' before the saved style arrives (avoids a ♯→♭ flicker on load)
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    loadSettings().then(settings => {
      setAccidentalStyle(settings.accidentalStyle);
    }).catch(() => {
      // fall back to the default
    }).finally(() => {
      setSettingsLoaded(true);
    });
  }, [loadSettings]);

  useEffect(() => {
    if (!settingsLoaded) return;
    saveSettings({ accidentalStyle });
  }, [accidentalStyle, settingsLoaded, saveSettings]);

  if (!settingsLoaded) return null;

  return (
    <AccidentalContext.Provider value={{ accidentalStyle, setAccidentalStyle }}>
      {children}
    </AccidentalContext.Provider>
  );
};

export const useAccidental = (): AccidentalContextValue => {
  const context = useContext(AccidentalContext);
  if (!context) {
    throw new Error('useAccidental must be used within an AccidentalProvider');
  }
  return context;
};
