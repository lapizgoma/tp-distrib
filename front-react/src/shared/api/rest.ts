import { normalizeError } from '@/shared/api/errors';
import { handleUnauthorized } from '@/shared/api/session';
import { useAuthStore } from '@/shared/store/authStore';

const API_BASE = '/api/rest';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  /** No hacer logout/redirect ante un 401 (ej. el login con credenciales malas). */
  skipAuthRedirect?: boolean;
}

/**
 * Cliente HTTP contra el backend REST (a través del proxy /api).
 * Centraliza headers, serialización JSON y el mapeo de errores.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  const token = useAuthStore.getState().token;
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (!response.ok) {
    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      // La respuesta no tenía body JSON.
    }
    if (response.status === 401 && !options.skipAuthRedirect) {
      handleUnauthorized();
    }
    throw normalizeError(response.status, payload);
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}