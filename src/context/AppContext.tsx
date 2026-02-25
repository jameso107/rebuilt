import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { MatchSetup } from '../lib/db';
import { getCurrentEvent, setCurrentEvent, clearCurrentEvent } from '../lib/db';
import type { EventInfo } from '../lib/db';

interface User {
  firstName: string;
  lastInitial: string;
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  matchSetup: MatchSetup | null;
  setMatchSetup: (setup: MatchSetup | null) => void;
  eventInfo: EventInfo | null;
  setEventInfo: (info: EventInfo | null) => Promise<void>;
  eventLoading: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('rebuilt_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [matchSetup, setMatchSetup] = useState<MatchSetup | null>(null);
  const [eventInfo, setEventInfoState] = useState<EventInfo | null>(null);
  const [eventLoading, setEventLoading] = useState(true);

  useEffect(() => {
    const load = () =>
      getCurrentEvent().then((info) => {
        setEventInfoState(info);
        setEventLoading(false);
      });
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const setEventInfo = async (info: EventInfo | null) => {
    setEventInfoState(info);
    if (info) {
      await setCurrentEvent(info);
    } else {
      await clearCurrentEvent();
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
        setEventInfo,
        eventLoading,
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
