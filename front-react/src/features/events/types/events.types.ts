export type EventType = 'VISITA_GUIADA' | 'TALLER' | 'CHARLA' | 'EXPOSICION';

export interface EventFilters {
  type?: EventType | '';
  curatorId?: number | '';
  startDate?: string; // Formato YYYY-MM-DD
  endDate?: string;   // Formato YYYY-MM-DD
}

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
}