import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { MatchSetup } from '../lib/db';

interface User {
  firstName: string;
  lastInitial: string;
}

export interface EventInfo {
  key: string;
  name: string;
  teamNumbers: string[];
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  matchSetup: MatchSetup | null;
  setMatchSetup: (setup: MatchSetup | null) => void;
  eventInfo: EventInfo | null;
  setEventInfo: (info: EventInfo | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const EVENT_STORAGE_KEY = 'rebuilt_event';

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('rebuilt_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [matchSetup, setMatchSetup] = useState<MatchSetup | null>(null);
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(() => {
    const stored = localStorage.getItem(EVENT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const setEventInfoWithStorage = (info: EventInfo | null) => {
    setEventInfo(info);
    if (info) {
      localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify(info));
    } else {
      localStorage.removeItem(EVENT_STORAGE_KEY);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        matchSetup,
        setMatchSetup,
        eventInfo,
        setEventInfo: setEventInfoWithStorage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
