import { useState, useEffect, useCallback } from 'react';
import type { Work, WorkFilters } from '../types/works.types';
import { getWorks } from '../api/worksGqlApi';

export function useWorks(initialFilters: WorkFilters = {}) {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<WorkFilters>(initialFilters);

  const fetchWorks = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWorks(filters, signal);
      setWorks(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message || 'Error al cargar las obras');
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    getWorks(filters, controller.signal)
      .then((data) => {
        if (active) setWorks(data);
      })
      .catch((err: unknown) => {
        if (active && err instanceof Error && err.name !== 'AbortError') {
          setError(err.message || 'Error al cargar las obras');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [filters]);

  const updateFilters = (newFilters: Partial<WorkFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  return {
    works,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    refetch: fetchWorks,
  };
}