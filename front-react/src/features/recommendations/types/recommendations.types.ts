import type { Work } from '@/features/works/types/works.types';

/** Obra tal como llega de la Gateway dentro de una recomendación. */
export interface RecommendedWorkDto {
  work: WorkDto;
  reasons: string[];
}

export interface WorkDto {
  id: string;
  title: string;
  artist_id: string;
  artist_name: string;
  image_url: string;
  creation_year: number;
  technique: string;
  dimensions: string;
  era: string;
  topic: string;
  description: string;
  location: string;
  availability: string;
  estimated_duration_minutes: number;
  topics: string[];
}

export interface RecommendationListResponseDto {
  recommendations: RecommendedWorkDto[];
}

export interface RecommendedWork {
  work: Work;
  reasons: string[];
}
