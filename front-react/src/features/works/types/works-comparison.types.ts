/** Obra tal como llega de la Gateway */
export interface ComparedWorkDto {
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
}

export interface CompareWorksResponseDto {
  works: ComparedWorkDto[];
}

/** Obra lista para usar en la UI. */
export interface ComparedWork {
  id: number;
  title: string;
  artistId: number;
  artistName: string;
  imageUrl: string;
  creationYear: number;
  technique: string;
  dimensions: string;
  era: string;
  topics: string[];
  description: string;
  location: string;
  availability: string;
  estimatedDurationMinutes: number;
}