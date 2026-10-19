import { RotateCcw } from 'lucide-react';
import { EVENT_TYPES, EVENT_TYPE_LABELS } from '@/features/events/types/events.types';
import type { EventType } from '@/features/events/types/events.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DEFAULT_GROUPING,
  DEFAULT_STATUS,
  GROUPING_LABELS,
  STATUS_LABELS,
} from '../types/reports.types';
import type { Grouping, ReportFilters, ReportStatus } from '../types/reports.types';

/** valor centinela del Select de tipo: sin filtro */
const ALL_TYPES = 'ALL';

const GROUPINGS = Object.keys(GROUPING_LABELS) as Grouping[];
const STATUSES = Object.keys(STATUS_LABELS) as ReportStatus[];

interface ReportFiltersBarProps {
  value: ReportFilters;
  onChange: (next: ReportFilters) => void;
  onReset: () => void;
  /** mensaje de validación del rango de fechas */
  dateError?: string | null;
}

export function ReportFiltersBar({ value, onChange, onReset, dateError }: ReportFiltersBarProps) {
  return (
    <Card className="ring-border shadow-none">
      <CardContent>
        <FieldGroup className="gap-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field data-invalid={Boolean(dateError)}>
              <FieldLabel htmlFor="report-start">Desde</FieldLabel>
              <Input
                id="report-start"
                type="date"
                value={value.startDate ?? ''}
                aria-invalid={Boolean(dateError)}
                onChange={(e) => onChange({ ...value, startDate: e.target.value })}
              />
            </Field>

            <Field data-invalid={Boolean(dateError)}>
              <FieldLabel htmlFor="report-end">Hasta (inclusive)</FieldLabel>
              <Input
                id="report-end"
                type="date"
                value={value.endDate ?? ''}
                aria-invalid={Boolean(dateError)}
                onChange={(e) => onChange({ ...value, endDate: e.target.value })}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="report-type">Tipo de evento</FieldLabel>
              <Select
                value={value.type || ALL_TYPES}
                onValueChange={(next) =>
                  next &&
                  onChange({ ...value, type: next === ALL_TYPES ? '' : (next as EventType) })
                }
              >
                <SelectTrigger id="report-type" className="w-full">
                  <SelectValue>
                    {(current: string) =>
                      current === ALL_TYPES
                        ? 'Todos los tipos'
                        : (EVENT_TYPE_LABELS[current as EventType] ?? current)
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_TYPES}>Todos los tipos</SelectItem>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {EVENT_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="report-status">Estado</FieldLabel>
              <Select
                value={value.status ?? DEFAULT_STATUS}
                onValueChange={(next) => next && onChange({ ...value, status: next as ReportStatus })}
              >
                <SelectTrigger id="report-status" className="w-full">
                  <SelectValue>
                    {(current: string) => STATUS_LABELS[current as ReportStatus] ?? current}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="report-grouping">Agrupar</FieldLabel>
              <Select
                value={value.grouping ?? DEFAULT_GROUPING}
                onValueChange={(next) => next && onChange({ ...value, grouping: next as Grouping })}
              >
                <SelectTrigger id="report-grouping" className="w-full">
                  <SelectValue>
                    {(current: string) => GROUPING_LABELS[current as Grouping] ?? current}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {GROUPINGS.map((grouping) => (
                    <SelectItem key={grouping} value={grouping}>
                      {GROUPING_LABELS[grouping]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="flex items-end">
              <Button type="button" variant="outline" className="w-full" onClick={onReset}>
                <RotateCcw className="size-4" />
                Limpiar filtros
              </Button>
            </div>
          </div>

          <FieldError>{dateError}</FieldError>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
