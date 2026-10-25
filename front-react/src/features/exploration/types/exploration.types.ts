export interface Work {
    id: number;
    title: string;
    artist_name?: string;
    image_url?: string;
    technique?: string;
    year?: number;
  }
  
  export interface Artist {
    id: number;
    name: string;
    nationality?: string;
    biography?: string;
  }
  
  export interface Event {
    id: number;
    title: string;
    description?: string;
    date?: string;
    location?: string;
    type?: string;
  }
  
  export interface ExplorationResponseDto {
    era: string;
    works: Work[];
    artists: Artist[];
    events: Event[];
  }