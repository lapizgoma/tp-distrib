export type NewsType = 'EVENT_CREATED' | 'EVENT_UPDATED' | 'EVENT_CANCELLED';

export interface KafkaPosition {
  topic: string;
  partition: number;
  offset: number;
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
  changes?: Record<string, { old: unknown; new: unknown }> | unknown;
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
  from?: string;
  to?: string;
  includePayload?: boolean;
}

export interface AuditResponse {
  content: AuditEvent[];
  page: number;
  size: number;
  hasMore: boolean;
}