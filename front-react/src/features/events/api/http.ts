const API_BASE = '/api/rest';

/** Error de la API que conserva el código HTTP y el mensaje del ProblemDetail. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

function extractMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;

  const problem = payload as Record<string, unknown>;
  const detail = problem.detail ?? problem.message ?? problem.error;
  if (typeof detail === 'string' && detail.trim()) return detail;

  if (Array.isArray(problem.errors) && problem.errors.length > 0) {
    const first = problem.errors[0] as Record<string, unknown>;
    if (typeof first?.defaultMessage === 'string') return first.defaultMessage;
  }

  return null;
}

/**
 * Cliente HTTP único contra el backend REST (a través del proxy /api).
 * Centraliza headers, serialización JSON y el mapeo de errores.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  // TODO(auth): adjuntar el token de la sesión cuando el auth esté implementado:
  //   const token = useAuthStore.getState().token;
  //   if (token) headers.Authorization = `Bearer ${token}`;

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
      // La respuesta no tenía body JSON (ej. 401/403 sin detalle).
    }
    throw new ApiError(
      extractMessage(payload) ?? `Error ${response.status} al comunicarse con el servidor`,
      response.status,
    );
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
