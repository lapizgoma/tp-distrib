import { useCallback, useState } from 'react';
import { registerUser } from '@/features/auth/api/authApi';
import type { RegisterRequestDTO } from '@/features/auth/types/register.types';
import { ApiError } from '@/shared/api/errors';

interface UseRegisterReturn {
  submitting: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  submit: (payload: RegisterRequestDTO) => Promise<boolean>;
}

/** Registro de usuario: POST /auth/register (responde 201 sin token). */
export function useRegister(): UseRegisterReturn {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const submit = useCallback(async (payload: RegisterRequestDTO): Promise<boolean> => {
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      await registerUser(payload);
      return true;
    } catch (err) {
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
