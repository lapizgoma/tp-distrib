export type Availability = 'EN_EXHIBICION' | 'EN_DEPOSITO';

export type Era = 
  | 'RENACIMIENTO' 
  | 'BARROCO' 
  | 'IMPRESIONISMO' 
  | 'VANGUARDIA' 
  | 'CONTEMPORANEO';

export type Technique = 
  | 'OLEO' 
  | 'ACRILICO' 
  | 'ACUARELA' 
  | 'TEMPLE' 
  | 'ESCULTURA';

export type LocationCode = 
  | 'SALA_1_GRANDES_MAESTROS' 
  | 'SALA_2_IMPRESIONISMO' 
  | 'SALA_3_VANGUARDIAS' 
  | 'SALA_4_ARTE_MODERNO' 
  | 'DEPOSITO';

export interface Artist {
  name: string;
  biography: string;
}

export interface Comment {
  id?: number | string;
  user: string;
  text: string;
  date: string;
}

export interface Work {
  id: string;
  title: string;
  artist: Artist;
  image_url: string;
  creation_year: number;
  technique: string;
  dimensions: string;
  era: string;
  description: string;
  location: string;
  availability: Availability;
  comments: Comment[];
}

export interface WorkFilters {
  keyword?: string;
  era?: string;
  technique?: string;
  location?: string;
  availability?: Availability | '';
}

export interface CommentRequestDTO {
  text: string;
}

// Mapeos legibles para la interfaz visual
export const AVAILABILITY_LABELS: Record<Availability, string> = {
  EN_EXHIBICION: 'En Exhibición',
  EN_DEPOSITO: 'En Depósito',
};

export const ERA_LABELS: Record<string, string> = {
  RENACIMIENTO: 'Renacimiento',
  BARROCO: 'Barroco',
  IMPRESIONISMO: 'Impresionismo',
  VANGUARDIA: 'Vanguardia',
  CONTEMPORANEO: 'Contemporáneo',
};

export const TECHNIQUE_LABELS: Record<string, string> = {
  OLEO: 'Óleo',
  ACRILICO: 'Acrílico',
  ACUARELA: 'Acuarela',
  TEMPLE: 'Temple',
  ESCULTURA: 'Escultura',
};

export const LOCATION_LABELS: Record<string, string> = {
  SALA_1_GRANDES_MAESTROS: 'Sala 1 - Grandes Maestros',
  SALA_2_IMPRESIONISMO: 'Sala 2 - Impresionismo',
  SALA_3_VANGUARDIAS: 'Sala 3 - Vanguardias',
  SALA_4_ARTE_MODERNO: 'Sala 4 - Arte Moderno',
  DEPOSITO: 'Depósito',
};