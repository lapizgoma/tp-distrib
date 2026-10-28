import { useEffect, useState } from 'react';
import { getRecommendations } from '../api/recommendationsApi';
import type { RecommendedWork } from '../types/recommendations.types';

interface UseRecommendationsReturn {
  recommendations: RecommendedWork[];
  loading: boolean;
  error: string | null;
}

export function useRecommendations(limit = 4): UseRecommendationsReturn {
  const [recommendations, setRecommendations] = useState<RecommendedWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    getRecommendations(limit, controller.signal)
      .then((data) => {
        if (active) setRecommendations(data);
      })
      .catch((err: unknown) => {
        if (active && err instanceof Error && err.name !== 'AbortError') {
          setError(err.message || 'No pudimos cargar las recomendaciones');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });


      
    return () => {
      active = false;
      controller.abort();
    };
  }, [limit]);

  return { recommendations, loading, error };
}
