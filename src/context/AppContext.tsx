import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { MatchSetup } from '../lib/db';

interface User {
  firstName: string;
  lastInitial: string;
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  matchSetup: MatchSetup | null;
  setMatchSetup: (setup: MatchSetup | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('rebuilt_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [matchSetup, setMatchSetup] = useState<MatchSetup | null>(null);

  return (
    <AppContext.Provider value={{ user, setUser, matchSetup, setMatchSetup }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
