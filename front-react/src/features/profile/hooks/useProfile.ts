import { useCallback, useEffect, useState } from 'react';
import { getCurrentUser } from '@/features/auth/api/authApi';
import type { User } from '@/features/auth/types/user.types';
import {
  deleteMyPreferences,
  getMyPreferences,
  updateMyPreferences,
} from '../api/profileApi';
import type {
  UserPreferences,
  UserPreferencesRequestDTO,
} from '../types/profile.types';
import { useAuthStore } from '@/shared/store/authStore';

interface UseProfileReturn {
  user: User | null;
  preferences: UserPreferences | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  reload: () => void;
  save: (payload: UserPreferencesRequestDTO) => Promise<UserPreferences | null>;
  clear: () => Promise<boolean>;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Ocurrió un error inesperado';
}

export function useProfile(): UseProfileReturn {
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const setSessionUser = useAuthStore((state) => state.setUser);
  const requestKey = String(reloadKey);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      getCurrentUser(controller.signal),
      getMyPreferences(controller.signal),
    ])
      .then(([currentUser, currentPreferences]) => {
        setUser(currentUser);
        setSessionUser(currentUser);
        setPreferences(currentPreferences);
        setLoadedKey(requestKey);
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') {
          setError(errorMessage(err));
          setLoadedKey(requestKey);
        }
      });

    return () => controller.abort();
  }, [requestKey, setSessionUser]);

  const reload = useCallback(() => {
    setError(null);
    setReloadKey((key) => key + 1);
  }, []);

  const save = useCallback(
    async (payload: UserPreferencesRequestDTO): Promise<UserPreferences | null> => {
      setSaving(true);
      setError(null);
      try {
        const updated = await updateMyPreferences(payload);
        setPreferences(updated);
        return updated;
      } catch (err) {
        setError(errorMessage(err));
        return null;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const clear = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      await deleteMyPreferences();
      setPreferences((current) =>
        current
          ? { ...current, favoriteTopics: [], favoriteTechniques: [], favoriteEras: [] }
          : current,
      );
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    user,
    preferences,
    loading: loadedKey !== requestKey,
    saving,
    error,
    reload,
    save,
    clear,
  };
}
