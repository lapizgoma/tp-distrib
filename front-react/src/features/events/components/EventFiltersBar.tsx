import type { ReactNode } from 'react';
import { CalendarRange, Filter, RotateCcw, UserRound } from 'lucide-react';
import type { EventFilters, EventType } from '../types/events.types';
import { EVENT_TYPE_LABELS, EVENT_TYPES } from '../types/events.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ALL_TYPES = '__ALL__';

interface EventFiltersBarProps {
  value: EventFilters;
  onChange: (filters: EventFilters) => void;
  onReset?: () => void;
  rightSlot?: ReactNode;
}

export function EventFiltersBar({ value, onChange, onReset, rightSlot }: EventFiltersBarProps) {
  const hasFilters = Boolean(value.type || value.curatorId || value.startDate || value.endDate);

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="flex flex-col gap-2">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="size-3.5" />
            Tipo de evento
          </Label>
          <Select
            value={value.type || ALL_TYPES}
            onValueChange={(next) =>
              onChange({ ...value, type: next === ALL_TYPES ? '' : (next as EventType) })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
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
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="curatorId" className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <UserRound className="size-3.5" />
            Curador a cargo
          </Label>
          <Input
            id="curatorId"
            type="number"
            min={1}
            placeholder="Ej: 2"
            value={value.curatorId ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                curatorId: e.target.value ? Number(e.target.value) : '',
              })
            }
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="startDate" className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarRange className="size-3.5" />
            Desde
          </Label>
          <Input
            id="startDate"
            type="date"
            value={value.startDate ?? ''}
            onChange={(e) => onChange({ ...value, startDate: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="endDate" className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarRange className="size-3.5" />
            Hasta
          </Label>
          <Input
            id="endDate"
            type="date"
            value={value.endDate ?? ''}
            onChange={(e) => onChange({ ...value, endDate: e.target.value })}
          />
        </div>

        <div className="flex items-end gap-2">
          {onReset && (
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              disabled={!hasFilters}
              onClick={onReset}
            >
              <RotateCcw className="size-4" />
              Limpiar
            </Button>
          )}
          {rightSlot}
        </div>
      </div>
    </div>
  );
}
