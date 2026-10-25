import { grpcRequest } from '@/shared/api/grpc';
import type { TourCriteria, TourPlan } from '../types/tour.types';

/** POST /api/grpc/tours/plan: arma el recorrido y trae eventos por franja de sala. */
export function getTourPlan(criteria: TourCriteria, signal?: AbortSignal) {
  return grpcRequest<TourPlan>('/tours/plan', {
    method: 'POST',
    body: criteria,
    signal,
  });
}
