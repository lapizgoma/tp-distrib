import { useCallback, useState } from 'react';
import { cancelRegistration, registerToEvent } from '../api/eventsApi';

interface UseEventRegistrationReturn {
  submitting: boolean;
  error: string | null;
  register: (eventId: number) => Promise<boolean>;
  cancel: (eventId: number) => Promise<boolean>;
}

/**
 * Inscripción / cancelación a un evento (POST y DELETE en /api/rest/events/members).
 *
 * TODO(auth): ambos endpoints requieren un usuario autenticado (rol VISITANTE).
 * Los botones que consumen este hook deben ocultarse/bloquearse si no hay sesión.
 */
export function useEventRegistration(): UseEventRegistrationReturn {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (operation: () => Promise<unknown>): Promise<boolean> => {
    setSubmitting(true);
    setError(null);
    try {
      await operation();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const register = useCallback(
    (eventId: number) => run(() => registerToEvent(eventId)),
    [run],
  );

  const cancel = useCallback(
    (eventId: number) => run(() => cancelRegistration(eventId)),
    [run],
  );

  return { submitting, error, register, cancel };
}
