export type EventType = 'VISITA_GUIADA' | 'TALLER' | 'CHARLA' | 'EXPOSICION';

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