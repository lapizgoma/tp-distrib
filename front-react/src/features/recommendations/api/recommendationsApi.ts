import { grpcRequest } from '@/shared/api/grpc';
import type { Availability, Work } from '@/features/works/types/works.types';
import type {
  RecommendationListResponseDto,
  RecommendedWork,
  RecommendedWorkDto,
  WorkDto,
} from '../types/recommendations.types';

const DEFAULT_LIMIT = 4;

function toWork(dto: WorkDto): Work {
  return {
    id: String(dto.id),
    title: dto.title,
    artist: { name: dto.artist_name, biography: '' },
    image_url: dto.image_url,
    creation_year: Number(dto.creation_year),
    technique: dto.technique,
    dimensions: dto.dimensions,
    era: dto.era,
    description: dto.description,
    location: dto.location,
    availability: dto.availability as Availability,
    comments: [],
  };
}

function toRecommendedWork(dto: RecommendedWorkDto): RecommendedWork {
  return {
    work: toWork(dto.work),
    reasons: dto.reasons ?? [],
  };
}

export async function getRecommendations(
  limit: number = DEFAULT_LIMIT,
  signal?: AbortSignal,
): Promise<RecommendedWork[]> {
  const response = await grpcRequest<RecommendationListResponseDto>(
    `/works/recommended?limit=${limit}`,
    { signal },
  );
  return (response.recommendations ?? []).map(toRecommendedWork);
}
