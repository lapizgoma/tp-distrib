import { useAuthStore } from '@/shared/store/authStore';
import type { AuditFilters, AuditResponse } from '../types/audit.types';

const API_BASE_URL = import.meta.env.VITE_AUDIT_API_URL || 'http://localhost:8083';

export async function fetchAuditEvents(filters: AuditFilters): Promise<AuditResponse> {
  const token = useAuthStore.getState().token || localStorage.getItem('token');

  const params = new URLSearchParams();
  if (filters.page !== undefined) params.append('page', filters.page.toString());
  if (filters.size !== undefined) params.append('size', filters.size.toString());
  if (filters.newsType) params.append('newsType', filters.newsType);
  if (filters.eventId) params.append('eventId', filters.eventId);
  if (filters.responsibleUserId) params.append('responsibleUserId', filters.responsibleUserId);
  if (filters.from) params.append('from', new Date(filters.from).toISOString());
  if (filters.to) params.append('to', new Date(filters.to).toISOString());
  if (filters.includePayload) params.append('includePayload', 'true');

  try {
    const response = await fetch(`${API_BASE_URL}/api/audit/events?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as { detail?: string; message?: string };
      throw new Error(errorData.detail || errorData.message || `Error HTTP ${response.status}`);
    }

    return (await response.json()) as AuditResponse;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'No se pudo conectar con el servicio de auditoría';
    throw new Error(message, { cause: err });
  }
}