import { useCallback, useState } from 'react';
import { getCurrentUser, loginUser } from '@/features/auth/api/authApi';
import type { LoginRequestDTO } from '@/features/auth/types/login.types';
import { ApiError } from '@/shared/api/errors';
import { useAuthStore } from '@/shared/store/authStore';

interface UseLoginReturn {
  submitting: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  submit: (payload: LoginRequestDTO) => Promise<boolean>;
}

/**
 * Flujo de inicio de sesión: login → guardar token → GET /auth/me → guardar usuario.
 * Devuelve true si todo salió bien, false si falló algún paso.
 */
export function useLogin(): UseLoginReturn {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const submit = useCallback(async (payload: LoginRequestDTO): Promise<boolean> => {
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    const { login, setUser, logout } = useAuthStore.getState();

    try {
      const { accessToken } = await loginUser(payload);
      login(accessToken);
      const user = await getCurrentUser();
      setUser(user);
      return true;
    } catch (err) {
      logout();
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.fieldErrors ?? {});
      } else {
        setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
      }
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { submitting, error, fieldErrors, submit };
}