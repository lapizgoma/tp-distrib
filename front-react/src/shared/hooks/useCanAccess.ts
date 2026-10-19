import { isTokenValid, useAuthStore } from '@/shared/store/authStore';
import type { UserRole } from '@/features/auth/types/user-role.types';

/**
 * Autorización en cliente: sesión válida + rol.
 * - Sin `roles` → true si hay sesión válida.
 * - Con `roles` → true si hay sesión válida y el rol del usuario está incluido.
 */
export function useCanAccess(roles?: UserRole[]): boolean {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  if (!isTokenValid(token)) return false;
  if (!roles || roles.length === 0) return true;
  if (!user) return false;
  return roles.includes(user.role);
}
