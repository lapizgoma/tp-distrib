import {
  EVENT_TYPE_LABELS,
  EVENT_TYPES,
  type EventType,
} from '@/features/events/types/events.types';
import { formatShortDateTime } from '@/features/events/utils/format';
import {
  ERA_LABELS,
  LOCATION_LABELS,
  TECHNIQUE_LABELS,
} from '@/features/works/types/works.types';
import type { RoomSchedule } from '../types/tour.types';

/** Temas frecuentes de la colección; el usuario también puede agregar otros. */
export const TOUR_TOPIC_OPTIONS = [
  'Naturaleza',
  'Paisaje',
  'Retrato',
  'Historia',
  'Sueños',
  'Vida cotidiana',
  'Guerra',
  'Amor',
  'Simbolismo',
  'Nocturno',
];

export const TOUR_ERA_OPTIONS = Object.entries(ERA_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const TOUR_TECHNIQUE_OPTIONS = Object.entries(TECHNIQUE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

/**
 * Las salas del recorrido vienen en minúsculas (`sala_2_impresionismo`),
 * pero los catálogos de labels usan mayúsculas.
 */
export function normalizeRoomCode(value: string): string {
  return labelKey(value).toLowerCase();
}

/** Clave tolerante a mayúsculas, acentos y separadores para buscar labels. */
function labelKey(value: string): string {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_')
    .toUpperCase();
}

function capitalize(value: string): string {
  const clean = value.trim();
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : '';
}

export function roomLabel(value: string): string {
  const label = LOCATION_LABELS[labelKey(value)];
  if (label) return label;

  const fallback = capitalize(value.replaceAll('_', ' ').toLowerCase());
  return fallback || 'Sala sin identificar';
}

export function eraLabel(value: string): string {
  return ERA_LABELS[labelKey(value)] ?? capitalize(value) ?? 'Sin época';
}

export function techniqueLabel(value: string): string {
  return TECHNIQUE_LABELS[labelKey(value)] ?? capitalize(value) ?? 'Sin técnica';
}

export function topicLabel(value: string): string {
  return capitalize(value);
}

export function asEventType(value: string): EventType | null {
  const key = labelKey(value);
  return EVENT_TYPES.includes(key as EventType) ? (key as EventType) : null;
}

export function eventTypeLabel(value: string): string {
  const type = asEventType(value);
  return type ? EVENT_TYPE_LABELS[type] : value;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function toDateTimeLocalValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function timeLabel(date: Date): string {
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

export function formatVisitWindow(
  startDatetime?: string | null,
  endDatetime?: string | null,
): string | null {
  if (!startDatetime || !endDatetime) return null;

  const start = new Date(startDatetime);
  const end = new Date(endDatetime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  const sameDay = start.toDateString() === end.toDateString();
  if (!sameDay) {
    return `${formatShortDateTime(startDatetime)} – ${formatShortDateTime(endDatetime)}`;
  }

  const dateLabel = start.toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return `${dateLabel} · ${timeLabel(start)}–${timeLabel(end)}`;
}

export function formatRoomSlot(slot?: RoomSchedule | null): string | null {
  if (!slot) return null;

  const start = new Date(slot.start_datetime);
  const end = new Date(slot.end_datetime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  const sameDay = start.toDateString() === end.toDateString();
  if (!sameDay) {
    return `${formatShortDateTime(slot.start_datetime)} – ${formatShortDateTime(
      slot.end_datetime,
    )}`;
  }

  return `${timeLabel(start)}–${timeLabel(end)}`;
}
