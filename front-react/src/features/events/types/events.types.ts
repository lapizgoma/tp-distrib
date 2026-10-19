export type EventType = 'VISITA_GUIADA' | 'TALLER' | 'CHARLA' | 'EXPOSICION';

export const EVENT_TYPES: EventType[] = [
  'VISITA_GUIADA',
  'TALLER',
  'CHARLA',
  'EXPOSICION',
];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  VISITA_GUIADA: 'Visita guiada',
  TALLER: 'Taller',
  CHARLA: 'Charla',
  EXPOSICION: 'Exposición',
};

/** Filtros aceptados por GET /api/rest/events (EventFilterRequestDTO). */
export interface EventFilters {
  type?: EventType | '';
  curatorId?: number | '';
  startDate?: string; // Formato YYYY-MM-DD
  endDate?: string;   // Formato YYYY-MM-DD
}

export interface EventAttendeeDTO {
  userId: number;
  name: string;
  email: string;
  registeredAt: string;
}

/** Respuesta de GET /api/rest/events y /api/rest/events/{id}. */
export interface EventResponseDTO {
  id: number;
  title: string;
  description: string;
  datetime: string;
  duration?: number;
  leadCuratorId?: number;
  leadCuratorName?: string;
  maximumCapacity: number;
  eventType: EventType;
  /** Solo se completa para el curador a cargo o un administrador. */
  attendees?: EventAttendeeDTO[] | null;
  /** true si el usuario autenticado está inscripto; null para anónimos. */
  isRegistered?: boolean | null;
}

/** Cuerpo de POST/PUT /api/rest/events (EventRequestDTO). */
export interface EventRequestDTO {
  title: string;
  description?: string;
  datetime: string; // LocalDateTime sin zona: 2026-11-15T20:00:00
  duration?: number | null;
  leadCuratorId: number;
  maximumCapacity: number;
  eventType: EventType;
}

/** Respuesta de POST /api/rest/events/members. */
export interface EventRegistrationResponseDTO {
  eventId: number;
  eventTitle: string;
  userId: number;
  userEmail: string;
  registeredAt: string;
}

/** Configuración de filtros guardados (EventFilterConfigDTO). */
export interface SavedFilterConfig {
  type?: EventType | null;
  curatorId?: number | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface SavedFilterResponseDTO {
  id: number;
  userId: number;
  name: string;
  description?: string | null;
  filterConfig: SavedFilterConfig;
}

export interface SavedFilterRequestDTO {
  name: string;
  description?: string | null;
  filterConfig: SavedFilterConfig;
}
