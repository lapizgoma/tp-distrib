import { useCallback, useEffect, useRef, useState } from 'react';
import { getTourPlan } from '../api/tourApi';
import type { TourCriteria, TourPlan } from '../types/tour.types';

interface UseTourPlanReturn {
  plan: TourPlan | null;
  loading: boolean;
  error: string | null;
  submit: (criteria: TourCriteria) => Promise<boolean>;
  reset: () => void;
}

/** Maneja una única solicitud de tour, con cancelación de la anterior. */
export function useTourPlan(): UseTourPlanReturn {
  const [plan, setPlan] = useState<TourPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
    },
    [],
  );

  const submit = useCallback(async (criteria: TourCriteria): Promise<boolean> => {
    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);
    setPlan(null);

    try {
      const data = await getTourPlan(criteria, controller.signal);
      if (controllerRef.current !== controller) return false;

      setPlan(data);
      return true;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return false;
      if (controllerRef.current !== controller) return false;

      setError(err instanceof Error ? err.message : 'No pudimos armar el recorrido');
      return false;
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setLoading(false);
      }
    }
  }, []);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setPlan(null);
    setError(null);
    setLoading(false);
  }, []);

  return { plan, loading, error, submit, reset };
}
