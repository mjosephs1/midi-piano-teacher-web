import React, { createContext, FC, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import {
  PracticeConfig,
  SharpsFilter,
  HandsMode,
  AccidentalStyle,
  TimedResult,
  TIMED_HISTORY_KEY,
  OCTAVE_OFFSET_STORAGE_KEY,
  ACCIDENTAL_STYLE_STORAGE_KEY,
  SOUND_ENABLED_STORAGE_KEY,
} from '../midi/noteUtils';

const API_BASE = 'http://localhost:3001';
const NUM_KEYS_STORAGE_KEY = 'midiPianoNumKeys';

export type StorageMode = 'checking' | 'api' | 'local';

export interface AllSettings {
  numKeys: number;
  showNotes: boolean;
  selectedGroups: string[];
  sharpsFilter: SharpsFilter;
  handsMode: HandsMode;
  selectedKey: string | null;
  octaveOffsetRight: number;
  octaveOffsetLeft: number;
  accidentalStyle: AccidentalStyle; // display-only: whether accidentals render as ♯ or ♭
  soundEnabled: boolean; // whether MIDI input plays audio (nav-bar mute toggle)
}

const DEFAULT_SETTINGS: AllSettings = {
  numKeys: 88,
  showNotes: false,
  selectedGroups: ['Major'],
  sharpsFilter: 'with-sharps',
  handsMode: 'right',
  selectedKey: null,
  octaveOffsetRight: 0,
  octaveOffsetLeft: 0,
  accidentalStyle: 'sharp',
  soundEnabled: true,
};

interface StorageContextValue {
  mode: StorageMode;
  error: string | null;
  loadSettings: () => Promise<AllSettings>;
  saveSettings: (patch: Partial<AllSettings>) => Promise<void>;
  loadTimedResults: (config: PracticeConfig) => Promise<TimedResult[]>;
  saveTimedResult: (score: number, mistakes: number, config: PracticeConfig) => Promise<void>;
}

// ─── localStorage helpers ────────────────────────────────────────────────────

function loadSettingsFromLocal(): AllSettings {
  try {
    const numKeysRaw = localStorage.getItem(NUM_KEYS_STORAGE_KEY);
    const { numKeys, showNotes } = numKeysRaw
      ? JSON.parse(numKeysRaw)
      : { numKeys: DEFAULT_SETTINGS.numKeys, showNotes: DEFAULT_SETTINGS.showNotes };

    const practiceRaw = localStorage.getItem(PracticeConfig.STORAGE_KEY);
    const practiceConfig = practiceRaw
      ? PracticeConfig.fromJson(JSON.parse(practiceRaw))
      : null;
    const config = practiceConfig ?? new PracticeConfig();

    const octaveRaw = localStorage.getItem(OCTAVE_OFFSET_STORAGE_KEY);
    const { right: octaveOffsetRight, left: octaveOffsetLeft } = octaveRaw
      ? JSON.parse(octaveRaw)
      : { right: 0, left: 0 };

    const accidentalRaw = localStorage.getItem(ACCIDENTAL_STYLE_STORAGE_KEY);
    const accidentalStyle: AccidentalStyle = accidentalRaw === 'flat' ? 'flat' : 'sharp';

    const soundEnabled = localStorage.getItem(SOUND_ENABLED_STORAGE_KEY) !== 'false';

    return {
      numKeys: numKeys ?? DEFAULT_SETTINGS.numKeys,
      showNotes: showNotes ?? DEFAULT_SETTINGS.showNotes,
      selectedGroups: [...config.selectedGroups],
      sharpsFilter: config.sharpsFilter,
      handsMode: config.handsMode,
      selectedKey: config.selectedKey,
      octaveOffsetRight: octaveOffsetRight ?? 0,
      octaveOffsetLeft: octaveOffsetLeft ?? 0,
      accidentalStyle,
      soundEnabled,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettingsToLocal(patch: Partial<AllSettings>): void {
  try {
    if ('numKeys' in patch || 'showNotes' in patch) {
      const raw = localStorage.getItem(NUM_KEYS_STORAGE_KEY);
      const current = raw ? JSON.parse(raw) : { numKeys: 88, showNotes: false };
      localStorage.setItem(NUM_KEYS_STORAGE_KEY, JSON.stringify({
        numKeys: patch.numKeys ?? current.numKeys,
        showNotes: patch.showNotes ?? current.showNotes,
      }));
    }

    if ('selectedGroups' in patch || 'sharpsFilter' in patch || 'handsMode' in patch || 'selectedKey' in patch) {
      const raw = localStorage.getItem(PracticeConfig.STORAGE_KEY);
      const existing = raw ? PracticeConfig.fromJson(JSON.parse(raw)) : null;
      const base = existing ?? new PracticeConfig();
      const nextSelectedKey = 'selectedKey' in patch ? patch.selectedKey ?? null : base.selectedKey;
      const config = new PracticeConfig(
        new Set(patch.selectedGroups ?? [...base.selectedGroups]),
        patch.sharpsFilter ?? base.sharpsFilter,
        patch.handsMode ?? base.handsMode,
        nextSelectedKey,
      );
      localStorage.setItem(PracticeConfig.STORAGE_KEY, JSON.stringify(config.toJson()));
    }

    if ('octaveOffsetRight' in patch || 'octaveOffsetLeft' in patch) {
      const raw = localStorage.getItem(OCTAVE_OFFSET_STORAGE_KEY);
      const current = raw ? JSON.parse(raw) : { right: 0, left: 0 };
      localStorage.setItem(OCTAVE_OFFSET_STORAGE_KEY, JSON.stringify({
        right: patch.octaveOffsetRight ?? current.right,
        left: patch.octaveOffsetLeft ?? current.left,
      }));
    }

    if (patch.accidentalStyle !== undefined) {
      localStorage.setItem(ACCIDENTAL_STYLE_STORAGE_KEY, patch.accidentalStyle);
    }

    if (patch.soundEnabled !== undefined) {
      localStorage.setItem(SOUND_ENABLED_STORAGE_KEY, String(patch.soundEnabled));
    }
  } catch {
    // localStorage unavailable
  }
}

function loadTimedResultsFromLocal(config: PracticeConfig): TimedResult[] {
  try {
    const raw = localStorage.getItem(TIMED_HISTORY_KEY);
    if (!raw) return [];
    const history = JSON.parse(raw);
    return history[config.toString()] ?? [];
  } catch {
    return [];
  }
}

function saveTimedResultToLocal(score: number, mistakes: number, config: PracticeConfig): void {
  try {
    const raw = localStorage.getItem(TIMED_HISTORY_KEY);
    const history = raw ? JSON.parse(raw) : {};
    const key = config.toString();
    history[key] = [...(history[key] ?? []), { score, mistakes, timestamp: new Date().toISOString() }];
    localStorage.setItem(TIMED_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // localStorage unavailable
  }
}

// ─── API helpers ─────────────────────────────────────────────────────────────

async function loadSettingsFromApi(): Promise<AllSettings> {
  const res = await fetch(`${API_BASE}/api/settings`);
  if (!res.ok) throw new Error('Failed to load settings');
  const data = await res.json();
  return {
    numKeys: data.numKeys,
    showNotes: data.showNotes,
    selectedGroups: data.selectedGroups,
    sharpsFilter: data.sharpsFilter as SharpsFilter,
    handsMode: data.handsMode as HandsMode,
    selectedKey: data.selectedKey ?? null,
    octaveOffsetRight: data.octaveOffsetRight,
    octaveOffsetLeft: data.octaveOffsetLeft,
    accidentalStyle: data.accidentalStyle === 'flat' ? 'flat' : 'sharp',
    soundEnabled: data.soundEnabled ?? true,
  };
}

async function saveSettingsToApi(patch: Partial<AllSettings>): Promise<void> {
  const res = await fetch(`${API_BASE}/api/settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error('Failed to save settings');
}

async function loadTimedResultsFromApi(config: PracticeConfig): Promise<TimedResult[]> {
  const params = new URLSearchParams({
    selected_groups: [...config.selectedGroups].sort().join(','),
    sharps_filter: config.sharpsFilter,
    hands_mode: config.handsMode,
  });
  if (config.selectedKey !== null) {
    params.set('selected_key', config.selectedKey);
  }
  const res = await fetch(`${API_BASE}/api/timed-results?${params}`);
  if (!res.ok) throw new Error('Failed to load timed results');
  const data: { score: number; mistakes: number; createdAt: string }[] = await res.json();
  return data.map(row => ({ score: row.score, mistakes: row.mistakes, timestamp: row.createdAt }));
}

async function saveTimedResultToApi(score: number, mistakes: number, config: PracticeConfig): Promise<void> {
  const res = await fetch(`${API_BASE}/api/timed-results`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      score,
      mistakes,
      selectedGroups: [...config.selectedGroups].sort(),
      sharpsFilter: config.sharpsFilter,
      handsMode: config.handsMode,
      selectedKey: config.selectedKey,
    }),
  });
  if (!res.ok) throw new Error('Failed to save timed result');
}

// ─── Context ──────────────────────────────────────────────────────────────────

const StorageContext = createContext<StorageContextValue | null>(null);

export const StorageProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<StorageMode>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const check = async () => {
      try {
        const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
        if (!cancelled) setMode(res.ok ? 'api' : 'local');
      } catch {
        if (!cancelled) setMode('local');
      } finally {
        clearTimeout(timeoutId);
      }
    };
    check();

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  const loadSettings = useCallback(async (): Promise<AllSettings> => {
    if (mode === 'api') {
      try {
        return await loadSettingsFromApi();
      } catch {
        setError('Lost connection to the server.');
        throw new Error('API unavailable');
      }
    }
    return loadSettingsFromLocal();
  }, [mode]);

  const saveSettings = useCallback(async (patch: Partial<AllSettings>): Promise<void> => {
    if (mode === 'api') {
      try {
        await saveSettingsToApi(patch);
      } catch {
        setError('Lost connection to the server.');
      }
      return;
    }
    saveSettingsToLocal(patch);
  }, [mode]);

  const loadTimedResults = useCallback(async (config: PracticeConfig): Promise<TimedResult[]> => {
    if (mode === 'api') {
      try {
        return await loadTimedResultsFromApi(config);
      } catch {
        setError('Lost connection to the server.');
        return [];
      }
    }
    return loadTimedResultsFromLocal(config);
  }, [mode]);

  const saveTimedResult = useCallback(async (score: number, mistakes: number, config: PracticeConfig): Promise<void> => {
    if (mode === 'api') {
      try {
        await saveTimedResultToApi(score, mistakes, config);
      } catch {
        setError('Lost connection to the server.');
      }
      return;
    }
    saveTimedResultToLocal(score, mistakes, config);
  }, [mode]);

  if (mode === 'checking') return null;

  return (
    <StorageContext.Provider value={{ mode, error, loadSettings, saveSettings, loadTimedResults, saveTimedResult }}>
      {children}
    </StorageContext.Provider>
  );
};

export const useStorage = (): StorageContextValue => {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error('useStorage must be used within StorageProvider');
  return ctx;
};
