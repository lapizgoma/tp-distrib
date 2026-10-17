// src/features/works/hooks/useWork.ts
import { useState, useEffect, useCallback } from 'react';
import type { Work } from '../types/works.types';
import { getWorks } from '../api/worksGqlApi';

export function useWork(workId: string | undefined) {
  const [work, setWork] = useState<Work | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWork = useCallback(async () => {
    if (!workId) return;
    setLoading(true);
    setError(null);
    try {
      // Pedimos las obras y filtramos la que coincide con el ID
      const allWorks = await getWorks();
      const found = allWorks.find((w) => String(w.id) === String(workId));
      if (found) {
        setWork(found);
      } else {
        setError('Obra no encontrada');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Error al cargar la obra');
      }
    } finally {
      setLoading(false);
    }
  }, [workId]);

  useEffect(() => {
    let active = true;

    if (!workId) return;

    getWorks()
      .then((allWorks) => {
        if (!active) return;
        const found = allWorks.find((w) => String(w.id) === String(workId));
        if (found) {
          setWork(found);
        } else {
          setError('Obra no encontrada');
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        if (err instanceof Error) {
          setError(err.message || 'Error al cargar la obra');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [workId]);

  return { work, loading, error, refetch: fetchWork };
}