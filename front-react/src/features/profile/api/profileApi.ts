import type {
  UserPreferences,
  UserPreferencesRequestDTO,
} from '@/features/profile/types/profile.types';
import { apiRequest } from '@/shared/api/rest';

/** GET /api/rest/users/me/preferences: preferencias del usuario autenticado. */
export function getMyPreferences(signal?: AbortSignal) {
  return apiRequest<UserPreferences>('/users/me/preferences', { signal });
}

/** PUT /api/rest/users/me/preferences: crea o reemplaza las preferencias. */
export function updateMyPreferences(payload: UserPreferencesRequestDTO) {
  return apiRequest<UserPreferences>('/users/me/preferences', {
    method: 'PUT',
    body: payload,
  });
}

/** DELETE /api/rest/users/me/preferences: borra las preferencias. */
export function deleteMyPreferences() {
  return apiRequest<void>('/users/me/preferences', { method: 'DELETE' });
}
