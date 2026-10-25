import { useEffect, useState } from 'react';
import { compareWorks } from '../api/compareWorksApi';
import { MAX_WORKS_TO_COMPARE, MIN_WORKS_TO_COMPARE, parseIds } from '../utils/comparison';
import type { ComparedWork } from '../types/works-comparison.types';

interface Result {
  key: string;
  works: ComparedWork[];
  error: string | null;
}

/** Pide la comparación de las obras indicadas. No hace nada si la cantidad no es válida (2 a 10). */
export function useCompareWorks(ids: number[]) {
  const key = ids.join(',');
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    const parsed = parseIds(key);
    if (parsed.length < MIN_WORKS_TO_COMPARE || parsed.length > MAX_WORKS_TO_COMPARE) return;

    const controller = new AbortController();
    compareWorks(parsed, controller.signal)
      .then((works) => {
        if (controller.signal.aborted) return;
        setResult({ key, works, error: null });
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setResult({
          key,
          works: [],
          error: e instanceof Error ? e.message : 'No se pudo comparar las obras',
        });
      });

    return () => controller.abort();
  }, [key]);

  const enabled = ids.length >= MIN_WORKS_TO_COMPARE && ids.length <= MAX_WORKS_TO_COMPARE;
  const current = result?.key === key ? result : null;

  return {
    works: current?.works ?? [],
    error: current?.error ?? null,
    loading: enabled && current === null,
  };
}