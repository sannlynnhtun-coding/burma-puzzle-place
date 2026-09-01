import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { normalizeDisplayName } from '../lib/guestName';

type GuestSession = {
  started: boolean;
  displayName: string;
  selectedEventId: string | null;
  start: (name: string, eventId: string) => void;
  reset: () => void;
};

const GuestSessionContext = createContext<GuestSession | undefined>(undefined);

export function GuestSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState({ started: false, displayName: 'Guest', selectedEventId: null as string | null });

  const value = useMemo<GuestSession>(() => ({
    ...session,
    start: (name, eventId) => setSession({ started: true, displayName: normalizeDisplayName(name), selectedEventId: eventId }),
    reset: () => setSession({ started: false, displayName: 'Guest', selectedEventId: null }),
  }), [session]);

  return <GuestSessionContext.Provider value={value}>{children}</GuestSessionContext.Provider>;
}

export function useGuestSession() {
  const context = useContext(GuestSessionContext);
  if (!context) throw new Error('useGuestSession must be used within GuestSessionProvider');
  return context;
}
