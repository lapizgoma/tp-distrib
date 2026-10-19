import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart3, Download, Info, Loader2 } from 'lucide-react';
import { EVENT_TYPES } from '@/features/events/types/events.types';
import type { EventType } from '@/features/events/types/events.types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useReport } from '../hooks/useReport';
import { useReportDownload } from '../hooks/useReportDownload';
import { ReportFiltersBar } from '../components/ReportFiltersBar';
import { ReportTable } from '../components/ReportTable';
import {
  DEFAULT_GROUPING,
  DEFAULT_STATUS,
  GROUPING_LABELS,
  STATUS_LABELS,
} from '../types/reports.types';
import type { Grouping, ReportFilters, ReportStatus } from '../types/reports.types';
import { formatInteger } from '../utils/format';

function filtersFromParams(params: URLSearchParams): ReportFilters {
  const type = params.get('type');
  const status = params.get('status');
  const grouping = params.get('grouping');

  return {
    startDate: params.get('startDate') ?? '',
    endDate: params.get('endDate') ?? '',
    type: type && EVENT_TYPES.includes(type as EventType) ? (type as EventType) : '',
    status: status && status in STATUS_LABELS ? (status as ReportStatus) : DEFAULT_STATUS,
    grouping: grouping && grouping in GROUPING_LABELS ? (grouping as Grouping) : DEFAULT_GROUPING,
  };
}

export function ReportView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => filtersFromParams(searchParams), [searchParams]);

  const dateError =
    filters.startDate && filters.endDate && filters.startDate > filters.endDate
      ? 'La fecha "Desde" no puede ser posterior a la fecha "Hasta".'
      : null;

  const { groups, loading, error } = useReport(filters, !dateError);
  const { download, downloading, error: downloadError } = useReportDownload();

  const handleFiltersChange = (next: ReportFilters) => {
    const params = new URLSearchParams();
    if (next.startDate) params.set('startDate', next.startDate);
    if (next.endDate) params.set('endDate', next.endDate);
    if (next.type) params.set('type', next.type);
    if (next.status && next.status !== DEFAULT_STATUS) params.set('status', next.status);
    if (next.grouping && next.grouping !== DEFAULT_GROUPING) params.set('grouping', next.grouping);
    setSearchParams(params, { replace: true });
  };

  const totalEvents = groups.reduce((sum, group) => sum + group.eventCount, 0);
  const totalRegistrants = groups.reduce((sum, group) => sum + group.totalRegistrants, 0);
  const groupsByMonth = filters.grouping !== 'TYPE';

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="relative overflow-hidden rounded-lg bg-foreground px-6 py-10 text-background sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute top-0 left-0 h-full w-1.5 bg-primary" />
        <div className="relative z-10 flex flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-2 text-caption font-medium text-accent">
            <BarChart3 className="size-3.5" />
            Panel de gestión
          </span>
          <h1 className="max-w-2xl font-heading text-display font-semibold">
            Asistencia e interés por eventos
          </h1>
          <p className="max-w-2xl text-sm text-background/75 sm:text-base">
            Consultá cuántas personas se inscriben a los eventos del museo. Filtrá por fechas, tipo
            y estado, y agrupá el informe por mes, por tipo o por ambos.
          </p>
        </div>
      </header>

      <ReportFiltersBar
        value={filters}
        onChange={handleFiltersChange}
        onReset={() => handleFiltersChange({})}
        dateError={dateError}
      />

      {/* resumen y exportación */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {!loading && !error && !dateError && groups.length > 0
            ? `${formatInteger(totalEvents)} evento(s) y ${formatInteger(totalRegistrants)} inscripto(s) en total.`
            : ''}
        </p>
        
        <div className="flex flex-col items-end gap-1">
          <Button
            type="button"
            variant="outline"
            disabled={Boolean(dateError) || downloading}
            onClick={() => download(filters)}
          >
            {downloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            {downloading ? 'Descargando…' : 'Descargar Excel'}
          </Button>
        </div>
      </div>

      {groupsByMonth && !dateError && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="size-3.5" />
          El agrupamiento por mes no distingue el año: los eventos del mismo mes de años distintos se
          suman en un mismo grupo.
        </p>
      )}

      {downloadError && (
        <Alert variant="destructive">
          <AlertTitle>No pudimos descargar el reporte</AlertTitle>
          <AlertDescription>{downloadError}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>No pudimos cargar el reporte</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      )}

      {!loading && !error && !dateError && groups.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
          <BarChart3 className="size-8 text-muted-foreground" />
          <p className="font-medium">No hay eventos para estos filtros</p>
          <p className="text-sm text-muted-foreground">
            Probá ampliar el rango de fechas o quitar algún criterio.
          </p>
        </div>
      )}

      {!loading && !error && !dateError && groups.length > 0 && (
        <ReportTable groups={groups} grouping={filters.grouping ?? DEFAULT_GROUPING} />
      )}
    </div>
  );
}