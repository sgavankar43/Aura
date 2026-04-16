import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, createContext } from 'react';
import { useAuth } from './AuthContext';

export const RealTimeContext = createContext<{ connected: boolean }>({ connected: false });

/**
 * Refreshes flag and audit data when the window regains focus.
 * (Full WebSocket fan-out for multi-project admin sessions can be added when the gateway supports JWT rooms.)
 */
export function RealTimeProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const [connected] = React.useState(false);

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    const handleFocus = () => {
      void queryClient.invalidateQueries({ queryKey: ['features'] });
      void queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [token, user, queryClient]);

  return <RealTimeContext.Provider value={{ connected }}>{children}</RealTimeContext.Provider>;
}
