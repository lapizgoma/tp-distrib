import { useAuthStore } from '@/shared/store/authStore';

/** Sesión inválida: borra el store y manda a /login (si no estamos ya ahí). */
export function handleUnauthorized(): void {
  useAuthStore.getState().logout();
  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}