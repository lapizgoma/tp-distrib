export const NEWS_TYPES = ['EVENT_CREATED', 'EVENT_UPDATED', 'EVENT_CANCELLED'] as const;

export type NewsType = (typeof NEWS_TYPES)[number];

export const NEWS_TYPE_LABELS: Record<NewsType, string> = {
  EVENT_CREATED: 'Alta',
  EVENT_UPDATED: 'Modificación',
  EVENT_CANCELLED: 'Cancelación',
};

export interface Notification {
  id: number;
  messageId: string;
  eventId: number;
  newsType: NewsType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationFilters {
  page?: number;
  size?: number;
  unreadOnly?: boolean;
}

export interface NotificationsResponse {
  content: Notification[];
  page: number;
  size: number;
  hasMore: boolean;
}

export const DEFAULT_NOTIFICATIONS_PAGE_SIZE = 20;
