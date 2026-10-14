import { ApiError, normalizeError } from '@/shared/api/errors';
import { handleUnauthorized } from '@/shared/api/session';
import { useAuthStore } from '@/shared/store/authStore';

const GRAPHQL_URL = '/api/graphql';

interface GraphQLRequestOptions {
  variables?: Record<string, unknown>;
  signal?: AbortSignal;
}

/** Convierte el primer error de un response GraphQL en un ApiError (o null si no hay errores). */
function toApiError(payload: unknown): ApiError | null {
  if (!payload || typeof payload !== 'object') return null;

  const errors = (payload as Record<string, unknown>).errors;
  if (!Array.isArray(errors) || errors.length === 0) return null;

  const first: unknown = errors[0];
  let message: string | null = null;
  let code: string | null = null;

  if (first && typeof first === 'object') {
    const item = first as Record<string, unknown>;
    if (typeof item.message === 'string' && item.message.trim()) message = item.message;

    const extensions = item.extensions;
    if (extensions && typeof extensions === 'object') {
      const rawCode = (extensions as Record<string, unknown>).code;
      if (typeof rawCode === 'string') code = rawCode;
    }
  }

  if (code === 'UNAUTHENTICATED') {
    return new ApiError(message ?? normalizeError(401, null).message, 401, undefined, code);
  }
  if (code === 'FORBIDDEN') {
    return new ApiError(message ?? normalizeError(403, null).message, 403, undefined, code);
  }
  // INTERNAL_ERROR, código desconocido o ausente: mensaje genérico, sin el texto del servidor.
  return new ApiError(normalizeError(500, null).message, 500, undefined, code ?? undefined);
}

/**
 * Cliente contra el servicio GraphQL (a través del proxy /api).
 * Devuelve el contenido de `data`; lanza ApiError si hay errores.
 */
export async function graphqlRequest<T>(
  query: string,
  options: GraphQLRequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  const token = useAuthStore.getState().token;
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables: options.variables }),
    signal: options.signal,
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // La respuesta no tenía body JSON.
  }

  // Caso 1: HTTP 4xx/5xx (ej. 401 problem+json de Go por token inválido o vencido).
  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    throw normalizeError(response.status, payload);
  }

  // Caso 2: HTTP 200 con `errors` en el cuerpo.
  const error = toApiError(payload);
  if (error) {
    if (error.status === 401) handleUnauthorized();
    throw error;
  }

  // Caso 3: éxito.
  if (payload && typeof payload === 'object') {
    const data = (payload as Record<string, unknown>).data;
    if (data !== null && data !== undefined) return data as T;
  }
  throw normalizeError(500, null);
}