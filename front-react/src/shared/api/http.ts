const API_BASE = '/api/rest';

/** Error de la API que conserva el código HTTP y el mensaje del ProblemDetail. */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors?: Record<string, string>;
  readonly code?: string;

  constructor(
    message: string,
    status: number,
    fieldErrors?: Record<string, string>,
    code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.code = code;
  }
}



interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}




/** Mensaje en español basado solo en el status HTTP (fallback) */
function messageForStatus(status: number): string {
  if (status === 401) return 'Tu sesión expiró o no iniciaste sesión';
  if (status === 403) return 'No tenés permisos para realizar esta acción';
  if (status === 404) return 'No encontramos lo que buscabas';
  if (status === 409) return 'Hay un conflicto con los datos enviados';
  if (status >= 500) return 'Error del servidor, probá de nuevo más tarde';
  return 'Error inesperado';
}




/** Devuelve `errors` solo si es un objeto plano con valores string */
function extractFieldErrors(payload: unknown): Record<string, string> | undefined {
  if (!payload || typeof payload !== 'object') return undefined;

  const errors = (payload as Record<string, unknown>).errors;
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) return undefined;

  const result: Record<string, string> = {};
  for (const [field, msg] of Object.entries(errors)) {
    if (typeof msg === 'string') result[field] = msg;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}



/** Convierte cualquier respuesta de error en un ApiError */
export function normalizeError(status: number, payload: unknown): ApiError {
  let message: string | null = null;

  if (payload && typeof payload === 'object') {
    const detail = (payload as Record<string, unknown>).detail;
    if (typeof detail === 'string' && detail.trim()) message = detail;
  }

  return new ApiError(
    message ?? messageForStatus(status),
    status,
    extractFieldErrors(payload),
  );
}



/**
 * Cliente HTTP único contra el backend REST (a través del proxy /api).
 * Centraliza headers, serialización JSON y el mapeo de errores.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

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
      // La respuesta no tenía body JSON (ej. 401/403 sin detalle)
    }
    throw normalizeError(response.status, payload);
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
