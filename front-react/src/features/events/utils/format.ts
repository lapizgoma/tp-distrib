import { EVENT_TYPE_LABELS, type EventType, type SavedFilterConfig } from '../types/events.types';

export function formatEventDateTime(value?: string | null): string {
  if (!value) return 'Fecha a confirmar';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('es-AR', { dateStyle: 'full', timeStyle: 'short' });
}

export function formatShortDateTime(value?: string | null): string {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
}

/** Día y mes abreviado para el talón del ticket de evento. */
export function formatDateParts(value?: string | null): { day: string; month: string } {
  if (!value) return { day: '--', month: 's/f' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { day: '--', month: value };
  return {
    day: String(date.getDate()).padStart(2, '0'),
    month: date.toLocaleString('es-AR', { month: 'short' }).replace('.', ''),
  };
}

export function formatDuration(minutes?: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

/** Adapta un LocalDateTime del backend al formato de <input type="datetime-local">. */
export function toDateTimeLocal(value?: string | null): string {
  if (!value) return '';
  return value.slice(0, 16);
}

/** Adapta el valor de <input type="datetime-local"> al LocalDateTime del backend. */
export function fromDateTimeLocal(value: string): string {
  return value.length === 16 ? `${value}:00` : value;
}

export function describeFilterConfig(config?: SavedFilterConfig | null): string[] {
  if (!config) return [];
  const chips: string[] = [];

  if (config.type) chips.push(EVENT_TYPE_LABELS[config.type as EventType]);
  if (config.curatorId) chips.push(`Curador #${config.curatorId}`);
  if (config.startDate) chips.push(`Desde ${config.startDate}`);
  if (config.endDate) chips.push(`Hasta ${config.endDate}`);

  return chips;
}
