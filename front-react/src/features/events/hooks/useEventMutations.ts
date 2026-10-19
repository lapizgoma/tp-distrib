import { useCallback, useState } from 'react';
import type { EventRequestDTO, EventResponseDTO } from '../types/events.types';
import { createEvent, deleteEvent, updateEvent } from '../api/eventsApi';

interface UseEventMutationsReturn {
  submitting: boolean;
  error: string | null;
  create: (payload: EventRequestDTO) => Promise<EventResponseDTO | null>;
  update: (id: number | string, payload: EventRequestDTO) => Promise<EventResponseDTO | null>;
  remove: (id: number | string) => Promise<boolean>;
}

/**
 * Operaciones de ABM de eventos (POST/PUT/DELETE en /api/rest/events).
 */
export function useEventMutations(): UseEventMutationsReturn {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async <T>(operation: () => Promise<T>): Promise<T | null> => {
    setSubmitting(true);
    setError(null);
    try {
      return await operation();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const create = useCallback(
    (payload: EventRequestDTO) => run(() => createEvent(payload)),
    [run],
  );

  const update = useCallback(
    (id: number | string, payload: EventRequestDTO) => run(() => updateEvent(id, payload)),
    [run],
  );

  const remove = useCallback(
    async (id: number | string) => {
      const result = await run(() => deleteEvent(id));
      return result !== null;
    },
    [run],
  );

  return { submitting, error, create, update, remove };
}
