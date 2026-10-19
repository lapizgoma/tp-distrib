import type { EventType } from '@/features/events/types/events.types';
import { EVENT_TYPE_LABELS } from '@/features/events/types/events.types';

const MONTH_LABELS: Record<string, string> = {
  january: 'Enero',
  february: 'Febrero',
  march: 'Marzo',
  april: 'Abril',
  may: 'Mayo',
  june: 'Junio',
  july: 'Julio',
  august: 'Agosto',
  september: 'Septiembre',
  october: 'Octubre',
  november: 'Noviembre',
  december: 'Diciembre',
};

export type GroupLevel = 'MONTH' | 'TYPE';

/** Suma un día a una fecha YYYY-MM-DD (sin depender de la zona horaria local). */
export function nextDay(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + 1));
  return result.toISOString().slice(0, 10);
}

/** Traduce el `groupName` del backend (mes en inglés o código de tipo) a texto legible. */
export function formatGroupName(name: string, level: GroupLevel): string {
  if (level === 'MONTH') return MONTH_LABELS[name.toLowerCase()] ?? name;
  return EVENT_TYPE_LABELS[name as EventType] ?? name;
}

const integerFormat = new Intl.NumberFormat('es-AR');
const decimalFormat = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });

export function formatInteger(value: number): string {
  return integerFormat.format(value);
}

export function formatDecimal(value: number): string {
  return decimalFormat.format(value);
}
