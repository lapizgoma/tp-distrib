import type { EventType } from '@/features/events/types/events.types';

export type ReportStatus = 'ALL' | 'ENDED' | 'UPCOMING';

export type GroupBy = 'MONTH' | 'TYPE';

export type Grouping = 'MONTH' | 'TYPE' | 'MONTH_TYPE';

export const DEFAULT_GROUPING: Grouping = 'MONTH';
export const DEFAULT_STATUS: ReportStatus = 'ALL';

export const GROUPING_TO_GROUP_BY: Record<Grouping, GroupBy[]> = {
  MONTH: ['MONTH'],
  TYPE: ['TYPE'],
  MONTH_TYPE: ['MONTH', 'TYPE'],
};

export const GROUPING_LABELS: Record<Grouping, string> = {
  MONTH: 'Por mes',
  TYPE: 'Por tipo de evento',
  MONTH_TYPE: 'Por mes y tipo',
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
  ALL: 'Todos',
  ENDED: 'Ya ocurrieron',
  UPCOMING: 'Por ocurrir',
};

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  type?: EventType | '';
  status?: ReportStatus;
  grouping?: Grouping;
}

export interface ReportEvent {
  id: string;
  name: string;
  registrants: number;
}

export interface GroupResult {
  groupName: string;
  eventCount: number;
  totalRegistrants: number;
  averageAttendance: number;
  topEvents: ReportEvent[];
  subGroups?: GroupResult[] | null;
}
