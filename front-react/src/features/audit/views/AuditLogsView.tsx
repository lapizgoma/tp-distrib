import { useState } from 'react';
import {
  ArrowRight,
  Info,
  Loader2,
  RefreshCw,
  RotateCcw,
  ScrollText,
  Search,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { NEWS_TYPES, NEWS_TYPE_LABELS } from '../types/audit.types';
import type { AuditEvent, AuditFilters, FieldChange, NewsType } from '../types/audit.types';

/** valor centinela del Select de tipo: sin filtro */
const ALL_NEWS_TYPES = 'ALL';

const PAGE_SIZES = [20, 50, 100] as const;

const NEWS_TYPE_BADGES: Record<NewsType, 'default' | 'secondary' | 'destructive'> = {
  EVENT_CREATED: 'default',
  EVENT_UPDATED: 'secondary',
  EVENT_CANCELLED: 'destructive',
};

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function hasDetails(event: AuditEvent): boolean {
  const hasChanges = Boolean(event.changes && Object.keys(event.changes).length > 0);
  return hasChanges || event.payload !== undefined;
}

export function AuditLogsView() {
  const { logs, hasMore, loading, error, filters, setFilters, reload, reset } = useAuditLogs({
    page: 0,
    size: 20,
  });
  const [selected, setSelected] = useState<AuditEvent | null>(null);

  const dateError =
    filters.from && filters.to && filters.from > filters.to
      ? 'La fecha "desde" no puede ser posterior a la fecha "hasta".'
      : null;

  const updateFilters = (patch: Partial<AuditFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch, page: 0 }));
  };

  const changePage = (page: number) => {
    setFilters((prev) => ({ ...prev, page: Math.max(0, page) }));
  };

  const selectedChanges = selected?.changes
    ? (Object.entries(selected.changes) as [string, FieldChange][])
    : [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="relative overflow-hidden rounded-lg bg-foreground px-6 py-10 text-background sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute top-0 left-0 h-full w-1.5 bg-primary" />
        <div className="relative z-10 flex flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-2 text-caption font-medium text-accent">
            <ScrollText className="size-3.5" />
            Panel de gestión
          </span>
          <h1 className="max-w-2xl font-heading text-display font-semibold">
            Historial de auditoría
          </h1>
          <p className="max-w-2xl text-sm text-background/75 sm:text-base">
            Registro asíncrono de las altas, modificaciones y cancelaciones de eventos del museo.
            Filtrá por tipo, evento, usuario responsable o rango de fechas.
          </p>
        </div>
      </header>

      <Card className="ring-border shadow-none">
        <CardContent>
          <FieldGroup className="gap-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="audit-news-type">Tipo de novedad</FieldLabel>
                <Select
                  value={filters.newsType || ALL_NEWS_TYPES}
                  onValueChange={(next) =>
                    next &&
                    updateFilters({
                      newsType: next === ALL_NEWS_TYPES ? '' : (next as NewsType),
                    })
                  }
                >
                  <SelectTrigger id="audit-news-type" className="w-full">
                    <SelectValue>
                      {(current: string) =>
                        current === ALL_NEWS_TYPES
                          ? 'Todas'
                          : (NEWS_TYPE_LABELS[current as NewsType] ?? current)
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_NEWS_TYPES}>Todas</SelectItem>
                    {NEWS_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {NEWS_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="audit-event-id">ID de evento</FieldLabel>
                <Input
                  id="audit-event-id"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  placeholder="Ej: 12"
                  value={filters.eventId ?? ''}
                  onChange={(e) => updateFilters({ eventId: e.target.value })}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="audit-user-id">ID de usuario responsable</FieldLabel>
                <Input
                  id="audit-user-id"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  placeholder="Ej: 5"
                  value={filters.responsibleUserId ?? ''}
                  onChange={(e) => updateFilters({ responsibleUserId: e.target.value })}
                />
              </Field>

              <Field data-invalid={Boolean(dateError)}>
                <FieldLabel htmlFor="audit-from">Desde</FieldLabel>
                <Input
                  id="audit-from"
                  type="date"
                  value={filters.from ?? ''}
                  aria-invalid={Boolean(dateError)}
                  onChange={(e) => updateFilters({ from: e.target.value })}
                />
              </Field>

              <Field data-invalid={Boolean(dateError)}>
                <FieldLabel htmlFor="audit-to">Hasta (inclusive)</FieldLabel>
                <Input
                  id="audit-to"
                  type="date"
                  value={filters.to ?? ''}
                  aria-invalid={Boolean(dateError)}
                  onChange={(e) => updateFilters({ to: e.target.value })}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="audit-payload">Incluir payload original</FieldLabel>
                <Select
                  value={filters.includePayload ? 'true' : 'false'}
                  onValueChange={(next) =>
                    next && updateFilters({ includePayload: next === 'true' })
                  }
                >
                  <SelectTrigger id="audit-payload" className="w-full">
                    <SelectValue>
                      {(current: string) => (current === 'true' ? 'Sí' : 'No')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">No</SelectItem>
                    <SelectItem value="true">Sí</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <FieldError>{dateError}</FieldError>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={reset}
                disabled={loading && !dateError}
              >
                <RotateCcw className="size-4" />
                Limpiar filtros
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={reload}
                disabled={Boolean(dateError) || loading}
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                Actualizar
              </Button>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="size-3.5" />
                Los filtros de fecha usan UTC y el extremo "hasta" incluye todo el día.
              </p>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>No pudimos cargar la auditoría</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && !dateError && (
        <Card className="ring-border shadow-none">
          <CardHeader>
            <CardTitle>Registros</CardTitle>
            <CardDescription>
              {loading
                ? 'Cargando registros…'
                : `${logs.length} registro(s) en la página ${(filters.page ?? 0) + 1}.`}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
                <Search className="size-8 text-muted-foreground" />
                <p className="font-medium">No hay registros para estos filtros</p>
                <p className="text-sm text-muted-foreground">
                  Probá ampliar el rango de fechas o quitar algún criterio.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha y hora</TableHead>
                    <TableHead>Operación</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Usuario resp.</TableHead>
                    <TableHead>Kafka</TableHead>
                    <TableHead className="text-right">Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(log.occurredAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={NEWS_TYPE_BADGES[log.newsType] ?? 'secondary'}>
                          {NEWS_TYPE_LABELS[log.newsType] ?? log.newsType}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[18rem] truncate">
                        <span className="font-medium text-muted-foreground">#{log.eventId}</span>{' '}
                        {log.eventTitle}
                      </TableCell>
                      <TableCell>
                        {log.responsibleUserId ? `Usuario #${log.responsibleUserId}` : 'Sistema'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.kafka.topic}[{log.kafka.partition}]@{log.kafka.offset}
                      </TableCell>
                      <TableCell className="text-right">
                        {hasDetails(log) ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSelected(log)}
                          >
                            Ver detalle
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Por página</span>
                <Select
                  value={String(filters.size ?? 20)}
                  onValueChange={(next) =>
                    next && setFilters((prev) => ({ ...prev, size: Number(next), page: 0 }))
                  }
                >
                  <SelectTrigger size="sm" className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={(filters.page ?? 0) === 0 || loading}
                  onClick={() => changePage((filters.page ?? 0) - 1)}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {(filters.page ?? 0) + 1}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!hasMore || loading}
                  onClick={() => changePage((filters.page ?? 0) + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del registro</DialogTitle>
            <DialogDescription>
              {selected
                ? `#${selected.eventId} · ${selected.eventTitle} · ${formatDate(selected.occurredAt)}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="flex max-h-[65vh] flex-col gap-5 overflow-y-auto pr-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={NEWS_TYPE_BADGES[selected.newsType] ?? 'secondary'}>
                  {NEWS_TYPE_LABELS[selected.newsType] ?? selected.newsType}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  messageId: <code>{selected.messageId}</code>
                </span>
              </div>

              <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                <Detail label="Fecha del evento" value={formatDate(selected.eventDateTime)} />
                <Detail label="Tipo de evento" value={selected.eventType ?? '—'} />
                <Detail
                  label="Curador responsable"
                  value={selected.leadCuratorId ? `Usuario #${selected.leadCuratorId}` : '—'}
                />
                <Detail
                  label="Usuario que operó"
                  value={
                    selected.responsibleUserId ? `Usuario #${selected.responsibleUserId}` : 'Sistema'
                  }
                />
                <Detail label="Origen" value={selected.source} />
                <Detail label="Schema" value={`v${selected.schemaVersion}`} />
                <Detail
                  label="Kafka"
                  value={`${selected.kafka.topic}[${selected.kafka.partition}]@${selected.kafka.offset}`}
                />
                <Detail label="Consumido" value={formatDate(selected.consumedAt)} />
              </dl>

              {selectedChanges.length > 0 && (
                <section className="flex flex-col gap-2">
                  <h2 className="font-medium">Campos modificados</h2>
                  <div className="divide-y rounded-lg border border-border">
                    {selectedChanges.map(([field, change]) => (
                      <div
                        key={field}
                        className="grid gap-2 px-3 py-2 text-sm sm:grid-cols-[8rem_1fr_auto_1fr] sm:items-center"
                      >
                        <span className="font-medium">{field}</span>
                        <code className="truncate rounded bg-muted px-1.5 py-0.5 text-xs">
                          {formatValue(change.previous)}
                        </code>
                        <ArrowRight className="hidden size-3.5 text-muted-foreground sm:block" />
                        <code className="truncate rounded bg-muted px-1.5 py-0.5 text-xs">
                          {formatValue(change.current)}
                        </code>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {selected.payload !== undefined && (
                <section className="flex flex-col gap-2">
                  <h2 className="font-medium">Payload original</h2>
                  <pre className="max-h-64 overflow-auto rounded-lg bg-muted p-3 text-xs">
                    {JSON.stringify(selected.payload, null, 2)}
                  </pre>
                </section>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate" title={value}>
        {value}
      </dd>
    </div>
  );
}
