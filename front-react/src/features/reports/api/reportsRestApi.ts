import { normalizeError } from '@/shared/api/errors';
import { handleUnauthorized } from '@/shared/api/session';
import { useAuthStore } from '@/shared/store/authStore';
import type { ReportFilters } from '../types/reports.types';
import { nextDay } from '../utils/format';

const ATTENDANCE_URL = '/api/rest/reports/attendance';

/**
 * Descarga el informe de asistencia en Excel.
 *
 * `shared/api/apiRequest` no sirve acá porque siempre intenta parsear JSON, así que se hace
 * el fetch directo con el mismo manejo de token y de 401.
 *  hay ciertos filtros que no aplican a este endpoint, así que se omiten.
 */
export async function downloadAttendanceReport(
  filters: ReportFilters = {},
  signal?: AbortSignal,
): Promise<void> {
  const params = new URLSearchParams();
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', nextDay(filters.endDate));
  if (filters.type) params.set('type', filters.type);
  if (filters.status) params.set('status', filters.status);

  const headers: Record<string, string> = {};
  const token = useAuthStore.getState().token;
  if (token) 
    headers.Authorization = `Bearer ${token}`;

  const query = params.toString();
  const response = await fetch(query ? `${ATTENDANCE_URL}?${query}` : ATTENDANCE_URL, {
    headers,
    signal,
  });

  if (!response.ok) {
    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      // la respuesta no tenía body JSON.
    }
    if (response.status === 401) {
      handleUnauthorized();
    }
    throw normalizeError(response.status, payload);
  }

  /* truco para que el navegador abra la ventanita de "elegir dónde descargar". */
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reporte-asistencia-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
