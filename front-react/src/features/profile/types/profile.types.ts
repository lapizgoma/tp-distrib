import type { Era, Technique } from '@/features/works/types/works.types';
import { ERA_LABELS, TECHNIQUE_LABELS } from '@/features/works/types/works.types';

export type Topic =
  | 'Naturaleza'
  | 'Retrato'
  | 'Paisaje'
  | 'Nocturno'
  | 'Bodegón'
  | 'Flores'
  | 'Vida cotidiana'
  | 'Interior'
  | 'Mar'
  | 'Agua'
  | 'Renacimiento'
  | 'Religión'
  | 'Historia'
  | 'Identidad'
  | 'Simbolismo'
  | 'Dolor'
  | 'Guerra'
  | 'Política'
  | 'Amor'
  | 'Modernismo'
  | 'Barroco'
  | 'Surrealismo'
  | 'Tiempo'
  | 'Sueños'
  | 'Jardín';

export const TOPIC_OPTIONS: { value: Topic; label: string }[] = [
  { value: 'Naturaleza', label: 'Naturaleza' },
  { value: 'Retrato', label: 'Retrato' },
  { value: 'Paisaje', label: 'Paisaje' },
  { value: 'Nocturno', label: 'Nocturno' },
  { value: 'Bodegón', label: 'Bodegón' },
  { value: 'Flores', label: 'Flores' },
  { value: 'Vida cotidiana', label: 'Vida cotidiana' },
  { value: 'Interior', label: 'Interior' },
  { value: 'Mar', label: 'Mar' },
  { value: 'Agua', label: 'Agua' },
  { value: 'Renacimiento', label: 'Renacimiento' },
  { value: 'Religión', label: 'Religión' },
  { value: 'Historia', label: 'Historia' },
  { value: 'Identidad', label: 'Identidad' },
  { value: 'Simbolismo', label: 'Simbolismo' },
  { value: 'Dolor', label: 'Dolor' },
  { value: 'Guerra', label: 'Guerra' },
  { value: 'Política', label: 'Política' },
  { value: 'Amor', label: 'Amor' },
  { value: 'Modernismo', label: 'Modernismo' },
  { value: 'Barroco', label: 'Barroco' },
  { value: 'Surrealismo', label: 'Surrealismo' },
  { value: 'Tiempo', label: 'Tiempo' },
  { value: 'Sueños', label: 'Sueños' },
  { value: 'Jardín', label: 'Jardín' },
];

export const TECHNIQUE_OPTIONS: { value: Technique; label: string }[] = [
  { value: 'OLEO', label: TECHNIQUE_LABELS.OLEO },
  { value: 'ACRILICO', label: TECHNIQUE_LABELS.ACRILICO },
  { value: 'ACUARELA', label: TECHNIQUE_LABELS.ACUARELA },
  { value: 'TEMPLE', label: TECHNIQUE_LABELS.TEMPLE },
  { value: 'ESCULTURA', label: TECHNIQUE_LABELS.ESCULTURA },
];

export const ERA_OPTIONS: { value: Era; label: string }[] = [
  { value: 'RENACIMIENTO', label: ERA_LABELS.RENACIMIENTO },
  { value: 'BARROCO', label: ERA_LABELS.BARROCO },
  { value: 'IMPRESIONISMO', label: ERA_LABELS.IMPRESIONISMO },
  { value: 'VANGUARDIA', label: ERA_LABELS.VANGUARDIA },
  { value: 'CONTEMPORANEO', label: ERA_LABELS.CONTEMPORANEO },
];

export interface UserPreferences {
  userId: number;
  favoriteTopics: Topic[];
  favoriteTechniques: Technique[];
  favoriteEras: Era[];
}

export interface UserPreferencesRequestDTO {
  favoriteTopics: Topic[];
  favoriteTechniques: Technique[];
  favoriteEras: Era[];
}
