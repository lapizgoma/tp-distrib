import type { UserRole } from '@/features/auth/types/user-role.types';
import { isTokenValid } from '@/shared/store/authStore';

/** Contexto mínimo para evaluar una política: lo que hay en el store de sesión. */
export interface AccessContext {
  token: string | null;
  user: { role: UserRole } | null;
}

/**
 * Política de acceso a una acción o pantalla.
 * - `requiresAuth: false` → pública, no importa la sesión.
 * - `requiresAuth: true` y sin `roles` → alcanza con sesión válida.
 * - `requiresAuth: true` con `roles` → sesión válida y rol incluido.
 */
export interface Policy {
  requiresAuth: boolean;
  roles?: readonly UserRole[];
}

export const PUBLIC: Policy = { requiresAuth: false };

export const AUTHENTICATED: Policy = { requiresAuth: true };

export const VISITOR_ONLY: Policy = {
  requiresAuth: true,
  roles: ['VISITANTE'],
};

export const EVENT_MANAGERS: Policy = {
  requiresAuth: true,
  roles: ['CURADOR', 'ADMINISTRADOR'],
};

/** Reportes y auditoría: mismos roles que la gestión de eventos. */
export const REPORT_VIEWERS: Policy = EVENT_MANAGERS;

/** Evalúa una política contra la sesión actual. Función pura: sirve en hooks y fuera de React. */
export function canAccess(policy: Policy, { token, user }: AccessContext): boolean {
  if (!policy.requiresAuth) return true;
  if (!isTokenValid(token)) return false;
  if (!policy.roles || policy.roles.length === 0) return true;
  return user !== null && policy.roles.includes(user.role);
}
