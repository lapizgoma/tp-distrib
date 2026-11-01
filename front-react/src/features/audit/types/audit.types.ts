export const NEWS_TYPES = ['EVENT_CREATED', 'EVENT_UPDATED', 'EVENT_CANCELLED'] as const;

export type NewsType = (typeof NEWS_TYPES)[number];

export const NEWS_TYPE_LABELS: Record<NewsType, string> = {
  EVENT_CREATED: 'Alta de evento',
  EVENT_UPDATED: 'Modificación de evento',
  EVENT_CANCELLED: 'Cancelación de evento',
};

export interface KafkaPosition {
  topic: string;
  partition: number;
  offset: number;
}

/** Cambio de un campo: valor anterior y actual tal como los publica el backend REST. */
export interface FieldChange {
  previous: unknown;
  current: unknown;
}

export interface AuditEvent {
  id: number;
  messageId: string;
  schemaVersion: number;
  newsType: NewsType;
  eventId: number;
  eventTitle: string;
  eventDateTime?: string | null;
  eventType?: string | null;
  leadCuratorId?: number | null;
  responsibleUserId?: number | null;
  occurredAt: string;
  source: string;
  changes?: Record<string, FieldChange> | null;
  payload?: unknown;
  kafka: KafkaPosition;
  consumedAt: string;
}

export interface AuditFilters {
  page?: number;
  size?: number;
  newsType?: NewsType | '';
  eventId?: string;
  responsibleUserId?: string;
  /** Fecha local en formato yyyy-mm-dd (inclusive desde las 00:00 UTC). */
  from?: string;
  /** Fecha local en formato yyyy-mm-dd (inclusive hasta las 23:59:59 UTC). */
  to?: string;
  includePayload?: boolean;
}

export interface AuditResponse {
  content: AuditEvent[];
  page: number;
  size: number;
  hasMore: boolean;
}

export const DEFAULT_AUDIT_FILTERS: AuditFilters = { page: 0, size: 20 };
