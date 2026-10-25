import type { ComparedWork } from '../types/works-comparison.types';

export const MIN_WORKS_TO_COMPARE = 2;
export const MAX_WORKS_TO_COMPARE = 10;

/** "1,4,6" -> [1, 4, 6]. Descarta valores inválidos y repetidos, conserva el orden. */
export function parseIds(raw: string | null): number[] {
  if (!raw) return [];
  const ids = raw
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((n) => Number.isSafeInteger(n) && n > 0);
  return [...new Set(ids)];
}

/** "SALA_4_ARTE_MODERNO" -> "Sala 4 arte moderno". */
export function humanize(value: string): string {
  const text = value.replace(/_/g, ' ').trim().toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** true si hay 2 o más valores, no están vacíos y son todos iguales. */
export function allCoincide(values: string[]): boolean {
  const first = values[0];
  if (values.length < 2 || first === undefined || first === '') return false;
  return values.every((value) => value === first);
}

/** Temas que aparecen en todas las obras. */
export function commonTopics(works: ComparedWork[]): Set<string> {
  const first = works[0];
  if (!first) return new Set();
  const rest = works.slice(1);
  return new Set(first.topics.filter((topic) => rest.every((work) => work.topics.includes(topic))));
}