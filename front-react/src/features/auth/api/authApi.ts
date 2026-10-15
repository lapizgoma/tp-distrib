import type {
  LoginRequestDTO,
  LoginResponseDTO
} from '@/features/auth/types/login.types';
import type {
  RegisterRequestDTO,
} from '@/features/auth/types/register.types';
import type { User } from "@/features/auth/types/user.types"
import { apiRequest } from '@/shared/api/rest';

/** POST /api/rest/auth/login: devuelve el token (no el usuario). */
export function loginUser(payload: LoginRequestDTO) {
  return apiRequest<LoginResponseDTO>('/auth/login', {
    method: 'POST',
    body: payload,
    skipAuthRedirect: true,
  });
}

/** POST /api/rest/auth/register: crea un VISITANTE, responde 201 sin cuerpo. */
export function registerUser(payload: RegisterRequestDTO) {
  return apiRequest<void>('/auth/register', { method: 'POST', body: payload });
}

/** GET /api/rest/auth/me: datos del usuario dueño del token. */
export function getCurrentUser(signal?: AbortSignal) {
  return apiRequest<User>('/auth/me', { signal });
}