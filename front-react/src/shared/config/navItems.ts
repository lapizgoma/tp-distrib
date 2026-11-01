import type { Policy } from '@/shared/auth/permissions';
import {
  AUTHENTICATED,
  PUBLIC,
  REPORT_VIEWERS,
  VISITOR_ONLY,
} from '@/shared/auth/permissions';

export interface NavItem {
  to: string;
  label: string;
  /** `true` (default) resalta solo en la ruta exacta. */
  end?: boolean;
  policy: Policy;
}

/**
 * Ítems del navbar y quién puede verlos.
 * El orden acá es el orden en pantalla; el filtrado vive en `Layout`.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Inicio', policy: PUBLIC },
  { to: '/eventos', label: 'Eventos', policy: PUBLIC },
  { to: '/eventos/mis-filtros', label: 'Mis filtros', policy: AUTHENTICATED },
  { to: '/obras', label: 'Catálogo', end: false, policy: PUBLIC },
  { to: '/explorar', label: 'Explorar por Era', policy: AUTHENTICATED },
  { to: '/recorrido', label: 'Armar recorrido', policy: VISITOR_ONLY },
  { to: '/eventos/reporte', label: 'Reporte', policy: REPORT_VIEWERS },
  { to: '/auditoria', label: 'Auditoría', policy: REPORT_VIEWERS },
  { to: '/perfil', label: 'Mi perfil', policy: AUTHENTICATED },
];
