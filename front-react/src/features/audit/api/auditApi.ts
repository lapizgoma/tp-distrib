import { handleUnauthorized } from '@/shared/api/session';
import { useAuthStore } from '@/shared/store/authStore';
import type { AuditFilters, AuditResponse } from '../types/audit.types';

/**
 * Base del servicio de auditoría. Vacío por defecto: las requests salen por
 * `/api/audit/...` y el proxy unificado (`backend-proxy`) las deriva a `audit`.
 * Se puede apuntar directo al servicio con `VITE_AUDIT_API_URL`.
 */
const API_BASE_URL = (import.meta.env.VITE_AUDIT_API_URL ?? '').replace(/\/+$/, '');

/** `yyyy-mm-dd` -> `yyyy-mm-ddT00:00:00Z` */
function startOfDay(date: string): string {
  return `${date}T00:00:00Z`;
}

/** `yyyy-mm-dd` -> `yyyy-mm-ddT23:59:59Z` (incluye todo el día) */
function endOfDay(date: string): string {
  return `${date}T23:59:59Z`;
}

function buildQuery(filters: AuditFilters): string {
  const params = new URLSearchParams();

  if (filters.page !== undefined) params.set('page', String(filters.page));
  if (filters.size !== undefined) params.set('size', String(filters.size));
  if (filters.newsType) params.set('newsType', filters.newsType);
  if (filters.eventId) params.set('eventId', filters.eventId);
  if (filters.responsibleUserId) params.set('responsibleUserId', filters.responsibleUserId);
  if (filters.from) params.set('from', startOfDay(filters.from));
  if (filters.to) params.set('to', endOfDay(filters.to));
  if (filters.includePayload) params.set('includePayload', 'true');

  return params.toString();
}

export async function fetchAuditEvents(
  filters: AuditFilters,
  signal?: AbortSignal,
): Promise<AuditResponse> {
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const query = buildQuery(filters);
  const url = `${API_BASE_URL}/api/audit/events${query ? `?${query}` : ''}`;

  let response: Response;
  try {
    response = await fetch(url, { method: 'GET', headers, signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new Error('No se pudo conectar con el servicio de auditoría', { cause: err });
  }

  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('Tu sesión expiró. Volvé a iniciar sesión.');
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { detail?: string; message?: string }
      | null;
    throw new Error(body?.detail ?? body?.message ?? `Error HTTP ${response.status}`);
  }

  return (await response.json()) as AuditResponse;
}
