import React, { useEffect } from 'react';
import { storageService, StoredSession } from './storage.service';
import { useAuthStore } from '../../store/auth/authStore';

export const StorageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const restore = async () => {
      await storageService.init();
      const rawSession = storageService.getItem('aura_auth_session');
      if (rawSession) {
        try {
          const session: StoredSession = JSON.parse(rawSession);
          if (session?.tokens?.access_token) {
            useAuthStore.getState().restoreSession(session);
          }
        } catch (e) {
          console.warn('[StorageProvider] Failed to parse restored session:', e);
        }
      }
    };
    restore();
  }, []);

  return <>{children}</>;
};
