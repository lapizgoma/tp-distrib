/**
 * Store de autenticación (PENDIENTE).
 *
 * Acá va el estado de sesión: token JWT, usuario actual y rol (VISITANTE,
 * CURADOR, ADMINISTRADOR). Todavía NO está implementado porque el auth no es
 * parte de esta tarea.
 *
 * Puntos donde se necesita (buscar los comentarios "TODO(auth)"):
 *  - `features/events/api/http.ts`: adjuntar `Authorization: Bearer <token>`.
 *  - `features/events/views/EventDetailView.tsx`: inscribirse/cancelar y ver inscriptos.
 *  - `features/events/views/EventFormView.tsx`: ABM (CURADOR/ADMIN).
 *  - `features/events/views/SavedFiltersView.tsx`: mis filtros (VISITANTE).
 *  - `shared/components/Layout.tsx`: menú de sesión / login.
 */
export {};
