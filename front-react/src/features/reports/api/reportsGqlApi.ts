import { graphqlRequest } from '@/shared/api/graphql';
import { GROUPING_TO_GROUP_BY, DEFAULT_GROUPING, DEFAULT_STATUS } from '../types/reports.types';
import type { GroupResult, ReportFilters } from '../types/reports.types';
import { nextDay } from '../utils/format';

const REPORT_QUERY = `
  query Report(
    $startDate: String
    $endDate: String
    $type: String
    $status: EventStatus
    $groupBy: [GroupBy!]!
  ) {
    report(
      startDate: $startDate
      endDate: $endDate
      type: $type
      status: $status
      groupBy: $groupBy
    ) {
      ...GroupFields
      subGroups {
        ...GroupFields
      }
    }
  }

  fragment GroupFields on GroupResult {
    groupName
    eventCount
    totalRegistrants
    averageAttendance
    topEvents {
      id
      name
      registrants
    }
  }
`;

interface ReportResponse {
  report: GroupResult[] | null;
}

/**
 * Consulta el informe de asistencia (query GraphQL `report`).
 * Requiere sesión con rol CURADOR o ADMINISTRADOR.
 *
 * El backend toma `endDate` como límite EXCLUSIVO, pero en la UI la fecha "hasta"
 * se entiende inclusiva, por eso se le suma un día antes de enviarla.
 */
export async function getReport(
  filters: ReportFilters = {},
  signal?: AbortSignal,
): Promise<GroupResult[]> {
  const variables: Record<string, unknown> = {
    status: filters.status ?? DEFAULT_STATUS,
    groupBy: GROUPING_TO_GROUP_BY[filters.grouping ?? DEFAULT_GROUPING],
  };

  if (filters.startDate) variables.startDate = filters.startDate;
  if (filters.endDate) variables.endDate = nextDay(filters.endDate);
  if (filters.type) variables.type = filters.type;

  const data = await graphqlRequest<ReportResponse>(REPORT_QUERY, { variables, signal });
  return data.report ?? [];
}
