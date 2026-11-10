'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { TimeUnit } from '@/lib/format';

const STORAGE_KEY = 'unwrapped:time-unit';

interface TimeUnitContextValue {
  unit: TimeUnit;
  setUnit: (unit: TimeUnit) => void;
}

const TimeUnitContext = createContext<TimeUnitContextValue>({ unit: 'hours', setUnit: () => {} });

export function TimeUnitProvider({ children }: { children: React.ReactNode }) {
  const [unit, setUnitState] = useState<TimeUnit>('hours');

  // Restore the viewer's last choice (storage can be unavailable, e.g. private mode).
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'minutes' || saved === 'hours' || saved === 'days') setUnitState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const setUnit = useCallback((next: TimeUnit) => {
    setUnitState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  return <TimeUnitContext.Provider value={{ unit, setUnit }}>{children}</TimeUnitContext.Provider>;
}

export const useTimeUnit = () => useContext(TimeUnitContext);
