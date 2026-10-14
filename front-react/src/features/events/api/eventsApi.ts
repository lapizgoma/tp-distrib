import type {
  EventFilters,
  EventRegistrationResponseDTO,
  EventRequestDTO,
  EventResponseDTO,
} from '../types/events.types';
import { apiRequest } from '@/shared/api/rest';

function buildQuery(filters: EventFilters = {}): string {
  const params = new URLSearchParams();

  if (filters.type) params.append('type', filters.type);
  if (filters.curatorId) params.append('curatorId', String(filters.curatorId));
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);

  const query = params.toString();
  return query ? `?${query}` : '';
}

/** GET /api/rest/events — cartelera pública con filtros opcionales. */
export function getEvents(filters: EventFilters = {}, signal?: AbortSignal) {
  return apiRequest<EventResponseDTO[]>(`/events${buildQuery(filters)}`, { signal });
}

/** GET /api/rest/events/{id} — detalle de un evento. */
export function getEventById(id: number | string, signal?: AbortSignal) {
  return apiRequest<EventResponseDTO>(`/events/${id}`, { signal });
}

/** POST /api/rest/events — alta de evento (CURADOR/ADMIN). */
export function createEvent(payload: EventRequestDTO) {
  return apiRequest<EventResponseDTO>('/events', { method: 'POST', body: payload });
}

/** PUT /api/rest/events/{id} — edición de evento (CURADOR/ADMIN). */
export function updateEvent(id: number | string, payload: EventRequestDTO) {
  return apiRequest<EventResponseDTO>(`/events/${id}`, { method: 'PUT', body: payload });
}

/** DELETE /api/rest/events/{id} — baja de evento (CURADOR/ADMIN). */
export function deleteEvent(id: number | string) {
  return apiRequest<void>(`/events/${id}`, { method: 'DELETE' });
}

/** POST /api/rest/events/members — inscribe al usuario autenticado. */
export function registerToEvent(eventId: number) {
  return apiRequest<EventRegistrationResponseDTO>('/events/members', {
    method: 'POST',
    body: { eventId },
  });
}

/** DELETE /api/rest/events/members — cancela la inscripción del usuario autenticado. */
export function cancelRegistration(eventId: number) {
  return apiRequest<void>('/events/members', { method: 'DELETE', body: { eventId } });
}
