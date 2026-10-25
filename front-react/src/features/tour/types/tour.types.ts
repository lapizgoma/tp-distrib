/** Criterios aceptados por POST /api/grpc/tours/plan. */
export interface TourCriteria {
  start_datetime: string;
  topics: string[];
  eras: string[];
  techniques: string[];
  max_duration_minutes: number;
  max_works_count: number;
}

/**
 * Obra tal como la devuelve la API Gateway.
 * El gateway usa keepCase, por eso los campos llegan en snake_case.
 * Los int64 se serializan como string.
 */
export interface TourWork {
  id: string;
  title: string;
  artist_id: string;
  artist_name: string;
  image_url: string;
  creation_year: number;
  technique: string;
  dimensions: string;
  era: string;
  topic: string;
  description: string;
  location: string;
  availability: string;
  estimated_duration_minutes: number;
  topics: string[];
}

/** Evento asociado a una sala durante la ventana del recorrido. */
export interface TourEvent {
  id: string;
  title: string;
  description: string;
  datetime: string;
  duration: number;
  location: string;
  event_type: string;
  associated_era: string;
}

/** Franja horaria asignada a una sala del recorrido. */
export interface RoomSchedule {
  room: string;
  start_datetime: string;
  end_datetime: string;
}

/** Respuesta combinada de works + events. */
export interface TourPlan {
  works: TourWork[];
  total_duration_minutes: number;
  rooms: string[];
  notes: string[];
  start_datetime: string | null;
  end_datetime: string | null;
  room_schedule: RoomSchedule[];
  events: TourEvent[];
}

export const DEFAULT_TOUR_DURATION_MINUTES = 90;

export const EMPTY_TOUR_CRITERIA: TourCriteria = {
  start_datetime: '',
  topics: [],
  eras: [],
  techniques: [],
  max_duration_minutes: 0,
  max_works_count: 0,
};
