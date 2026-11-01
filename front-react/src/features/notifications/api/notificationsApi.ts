import { handleUnauthorized } from '@/shared/api/session';
import { useAuthStore } from '@/shared/store/authStore';
import type { NotificationFilters, NotificationsResponse } from '../types/notifications.types';

const API_URL = '/api/notifications';

function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function readError(response: Response): Promise<Error> {
  const body = (await response.json().catch(() => null)) as
    | { detail?: string; message?: string }
    | null;
  return new Error(body?.detail ?? body?.message ?? `Error HTTP ${response.status}`);
}

/** Lista paginada de notificaciones del usuario autenticado (userId sale del token). */
export async function fetchNotifications(
  filters: NotificationFilters = {},
  signal?: AbortSignal,
): Promise<NotificationsResponse> {
  const params = new URLSearchParams();
  if (filters.page !== undefined) params.set('page', String(filters.page));
  if (filters.size !== undefined) params.set('size', String(filters.size));
  if (filters.unreadOnly) params.set('unreadOnly', 'true');

  const query = params.toString();
  const url = `${API_URL}${query ? `?${query}` : ''}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json', ...authHeaders() },
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new Error('No se pudo conectar con el servicio de notificaciones', { cause: err });
  }

  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('Tu sesión expiró. Volvé a iniciar sesión.');
  }

  if (!response.ok) throw await readError(response);

  return (await response.json()) as NotificationsResponse;
}

/** Marca como leídas todas las notificaciones del usuario. */
export async function markAllNotificationsRead(signal?: AbortSignal): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/read`, {
      method: 'PATCH',
      headers: { Accept: 'application/json', ...authHeaders() },
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new Error('No se pudo conectar con el servicio de notificaciones', { cause: err });
  }

  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('Tu sesión expiró. Volvé a iniciar sesión.');
  }

  if (!response.ok) throw await readError(response);
}
