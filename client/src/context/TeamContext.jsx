/**
 * TeamContext.jsx — Global team state manager.
 *
 * Wraps the /register page (inside ClerkProvider).
 * – Uses useUser() to get the logged-in user's email.
 * – On mount (and whenever refreshTeam() is called), hits GET /api/teams/user/:email.
 * – Exposes: team, isLoading, refreshTeam via useTeam() hook.
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { createApiClient, fetchTeamByEmail } from '../utils/api';

const TeamContext = createContext(null);

export function TeamProvider({ children }) {
  const { user, isLoaded: userLoaded } = useUser();
  const { getToken } = useAuth();

  const [team, setTeam]         = useState(null);
  const [isLoading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // Memoise the api client so it is only recreated when getToken ref changes
  const api = useMemo(() => createApiClient(getToken), [getToken]);

  const refreshTeam = useCallback(async () => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return;

    setLoading(true);
    try {
      const data = await fetchTeamByEmail(api, email);
      setTeam(data ?? null);
    } catch (err) {
      // 404 means "not in a team yet" — treat as null, not an error
      if (err?.message?.includes('404') || err?.response?.status === 404) {
        setTeam(null);
      } else {
        console.error('[TeamContext] Failed to fetch team:', err.message);
        setTeam(null);
      }
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  }, [api, user]);

  // Fetch once when the Clerk user is ready
  useEffect(() => {
    if (userLoaded && user && !hasFetched) {
      refreshTeam();
    }
    // If user signs out, clear team
    if (userLoaded && !user) {
      setTeam(null);
      setHasFetched(false);
    }
  }, [userLoaded, user, hasFetched, refreshTeam]);

  const value = useMemo(
    () => ({ team, setTeam, isLoading, refreshTeam, api }),
    [team, isLoading, refreshTeam, api]
  );

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
}

/** Hook to consume TeamContext. Must be used inside <TeamProvider>. */
export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeam must be used within a TeamProvider');
  return ctx;
}
