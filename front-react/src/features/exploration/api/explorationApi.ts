import { grpcRequest } from '@/shared/api/grpc';
import type { ExplorationResponseDto } from '../types/exploration.types';

export async function getExplorationByEra(era: string): Promise<ExplorationResponseDto> {
  return grpcRequest<ExplorationResponseDto>(`/exploration/era/${encodeURIComponent(era)}`);
}