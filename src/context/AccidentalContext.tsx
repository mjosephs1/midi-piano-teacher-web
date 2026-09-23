import { createContext, FC, ReactNode, useContext, useEffect, useRef, useState } from 'react';
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
  const settingsLoadedRef = useRef(false);

  useEffect(() => {
    loadSettings().then(settings => {
      setAccidentalStyle(settings.accidentalStyle);
      settingsLoadedRef.current = true;
    }).catch(() => {
      settingsLoadedRef.current = true;
    });
  }, [loadSettings]);

  useEffect(() => {
    if (!settingsLoadedRef.current) return;
    saveSettings({ accidentalStyle });
  }, [accidentalStyle, saveSettings]);

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
