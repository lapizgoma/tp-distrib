import { useCallback, useEffect, useRef, useState } from 'react';
import type { EventFilters, EventResponseDTO } from '../types/events.types';
import { getEvents } from '../api/eventsApi';

interface UseEventsReturn {
  events: EventResponseDTO[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/** Carga la cartelera desde GET /api/rest/events aplicando los filtros recibidos. */
export function useEvents(filters: EventFilters = {}): UseEventsReturn {
  const [events, setEvents] = useState<EventResponseDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const filtersKey = JSON.stringify(filters);
  const requestKey = `${filtersKey}#${reloadKey}`;

  // Mantenemos los filtros en un ref para poder usarlos dentro del efecto sin
  // re-dispararlo en cada render (la clave serializada controla el refetch).
  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  });

  useEffect(() => {
    const controller = new AbortController();

    getEvents(filtersRef.current, controller.signal)
      .then((data) => {
        setEvents(data);
        setError(null);
        setLoadedKey(requestKey);
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') {
          setEvents([]);
          setError(err.message);
          setLoadedKey(requestKey);
        }
      });

    return () => controller.abort();
  }, [requestKey]);

  const refetch = useCallback(() => setReloadKey((key) => key + 1), []);
  const loading = loadedKey !== requestKey;

  return { events, loading, error, refetch };
}
