import { useState, useCallback } from 'react';
import { getExplorationByEra } from '../api/explorationApi';
import type { ExplorationResponseDto } from '../types/exploration.types';

export function useExploration() {
  const [data, setData] = useState<ExplorationResponseDto | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExploration = useCallback(async (era: string) => {
    if (!era) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getExplorationByEra(era);
      setData(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar la exploración por era';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchExploration };
}