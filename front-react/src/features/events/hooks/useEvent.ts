import { useCallback, useEffect, useState } from 'react';
import type { EventResponseDTO } from '../types/events.types';
import { getEventById } from '../api/eventsApi';

interface UseEventReturn {
  event: EventResponseDTO | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/** Carga un evento puntual desde GET /api/rest/events/{id}. */
export function useEvent(id: number | string | undefined): UseEventReturn {
  const [event, setEvent] = useState<EventResponseDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const hasId = id !== undefined && id !== '';
  const requestKey = `${id ?? ''}#${reloadKey}`;

  useEffect(() => {
    if (!hasId) return;

    const controller = new AbortController();

    getEventById(id, controller.signal)
      .then((data) => {
        setEvent(data);
        setError(null);
        setLoadedKey(requestKey);
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') {
          setEvent(null);
          setError(err.message);
          setLoadedKey(requestKey);
        }
      });

    return () => controller.abort();
  }, [hasId, id, requestKey]);

  const refetch = useCallback(() => setReloadKey((key) => key + 1), []);

  return {
    event: hasId ? event : null,
    loading: hasId && loadedKey !== requestKey,
    error: hasId ? error : null,
    refetch,
  };
}
