import type { SavedFilterRequestDTO, SavedFilterResponseDTO } from '../types/events.types';
import { apiRequest } from '../../../shared/api/http';

/** GET /api/rest/filters — filtros guardados del usuario autenticado. */
export function getSavedFilters(signal?: AbortSignal) {
  return apiRequest<SavedFilterResponseDTO[]>('/filters', { signal });
}

/** GET /api/rest/filters/{id} — detalle de un filtro guardado. */
export function getSavedFilterById(id: number, signal?: AbortSignal) {
  return apiRequest<SavedFilterResponseDTO>(`/filters/${id}`, { signal });
}

/** POST /api/rest/filters — crea un filtro guardado. */
export function createSavedFilter(payload: SavedFilterRequestDTO) {
  return apiRequest<SavedFilterResponseDTO>('/filters', { method: 'POST', body: payload });
}

/** PUT /api/rest/filters/{id} — actualiza un filtro guardado. */
export function updateSavedFilter(id: number, payload: SavedFilterRequestDTO) {
  return apiRequest<SavedFilterResponseDTO>(`/filters/${id}`, { method: 'PUT', body: payload });
}

/** DELETE /api/rest/filters/{id} — elimina un filtro guardado. */
export function deleteSavedFilter(id: number) {
  return apiRequest<void>(`/filters/${id}`, { method: 'DELETE' });
}
