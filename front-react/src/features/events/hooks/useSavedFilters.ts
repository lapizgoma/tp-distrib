import { useCallback, useEffect, useState } from 'react';
import type { SavedFilterRequestDTO, SavedFilterResponseDTO } from '../types/events.types';
import {
  createSavedFilter,
  deleteSavedFilter,
  getSavedFilters,
  updateSavedFilter,
} from '../api/savedFiltersApi';

interface UseSavedFiltersReturn {
  filters: SavedFilterResponseDTO[];
  loading: boolean;
  submitting: boolean;
  error: string | null;
  refetch: () => void;
  create: (payload: SavedFilterRequestDTO) => Promise<SavedFilterResponseDTO | null>;
  update: (id: number, payload: SavedFilterRequestDTO) => Promise<SavedFilterResponseDTO | null>;
  remove: (id: number) => Promise<boolean>;
}

/**
 * CRUD de filtros favoritos de eventos (/api/rest/filters).
 *
 * TODO(auth): todos los endpoints de filtros requieren sesión iniciada
 * (rol VISITANTE). La vista /eventos/mis-filtros debe protegerse.
 */
export function useSavedFilters(): UseSavedFiltersReturn {
  const [filters, setFilters] = useState<SavedFilterResponseDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const requestKey = String(reloadKey);

  useEffect(() => {
    const controller = new AbortController();

    getSavedFilters(controller.signal)
      .then((data) => {
        setFilters(data);
        setError(null);
        setLoadedKey(requestKey);
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') {
          setFilters([]);
          setError(err.message);
          setLoadedKey(requestKey);
        }
      });

    return () => controller.abort();
  }, [requestKey]);

  const refetch = useCallback(() => setReloadKey((key) => key + 1), []);

  const run = useCallback(async <T>(operation: () => Promise<T>): Promise<T | null> => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await operation();
      setReloadKey((key) => key + 1);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const create = useCallback(
    (payload: SavedFilterRequestDTO) => run(() => createSavedFilter(payload)),
    [run],
  );

  const update = useCallback(
    (id: number, payload: SavedFilterRequestDTO) => run(() => updateSavedFilter(id, payload)),
    [run],
  );

  const remove = useCallback(
    async (id: number) => {
      const result = await run(() => deleteSavedFilter(id));
      return result !== null;
    },
    [run],
  );

  return {
    filters,
    loading: loadedKey !== requestKey,
    submitting,
    error,
    refetch,
    create,
    update,
    remove,
  };
}
