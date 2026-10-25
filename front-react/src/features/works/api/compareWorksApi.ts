import { ApiError } from '@/shared/api/errors';
import { grpcRequest } from '@/shared/api/grpc';
import type {
  ComparedWork,
  ComparedWorkDto,
  CompareWorksResponseDto,
} from '../types/works-comparison.types';

function toComparedWork(dto: ComparedWorkDto): ComparedWork {
  return {
    id: Number(dto.id),
    title: dto.title,
    artistId: Number(dto.artist_id),
    artistName: dto.artist_name,
    imageUrl: dto.image_url,
    creationYear: dto.creation_year,
    technique: dto.technique,
    dimensions: dto.dimensions,
    era: dto.era,
    topics: dto.topic
      ? dto.topic
          .split(',')
          .map((topic) => topic.trim())
          .filter(Boolean)
      : [],
    description: dto.description,
    location: dto.location,
    availability: dto.availability,
    estimatedDurationMinutes: dto.estimated_duration_minutes,
  };
}

/** POST /api/grpc/works/compare. Devuelve las obras en el orden pedido. */
export async function compareWorks(ids: number[], signal?: AbortSignal): Promise<ComparedWork[]> {
  try {
    const response = await grpcRequest<CompareWorksResponseDto>('/works/compare', {
      method: 'POST',
      body: { work_ids: ids },
      signal,
    });
    return response.works.map(toComparedWork);
  } catch (error) {
    // El servicio responde este 404 en inglés: lo mostramos en español.
    if (error instanceof ApiError && error.status === 404) {
      throw new ApiError(
        'No se encontraron suficientes obras para comparar. Es posible que alguna ya no exista.',
        404,
        undefined,
        undefined,
      );
    }
    throw error;
  }
}