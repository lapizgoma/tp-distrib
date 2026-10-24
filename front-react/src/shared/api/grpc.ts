import { ApiError, normalizeError } from '@/shared/api/errors';
import { handleUnauthorized } from '@/shared/api/session';
import { useAuthStore } from '@/shared/store/authStore';

const GRPC_BASE = '/api/grpc';

interface GrpcRequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  signal?: AbortSignal;
}

/** La API Gateway responde los errores como { "error": "<detalle>" }. */
function gatewayMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const error = (payload as Record<string, unknown>).error;
  return typeof error === 'string' && error.trim() ? error : null;
}

/**
 * Cliente contra la API Gateway (a través del proxy /api/grpc).
 * Lanza ApiError ante cualquier respuesta no exitosa.
 */
export async function grpcRequest<T>(path: string, options: GrpcRequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  const token = useAuthStore.getState().token;
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${GRPC_BASE}${path}`, {
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
      // La respuesta no tiene body JSON.
    }

    if (response.status === 401) handleUnauthorized();

    // 400/403/404: el mensaje de la Gateway sirve al usuario. Resto: mensaje genérico.
    const message = gatewayMessage(payload);
    if (message && [400, 403, 404].includes(response.status)) {
      throw new ApiError(message, response.status, undefined, undefined);
    }
    throw normalizeError(response.status, null);
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}