import { useCallback, useEffect, useRef, useState } from 'react';
import type { GroupResult, ReportFilters } from '../types/reports.types';
import { getReport } from '../api/reportsGqlApi';

interface UseReportReturn {
  groups: GroupResult[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Carga el informe de asistencia aplicando los filtros recibidos.
 * Si `enabled` es false no se consulta (ej. rango de fechas inválido).
 */
export function useReport(filters: ReportFilters = {}, enabled = true): UseReportReturn {
  const [groups, setGroups] = useState<GroupResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const requestKey = `${JSON.stringify(filters)}#${reloadKey}`;

  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  });

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();

    getReport(filtersRef.current, controller.signal)
      .then((data) => {
        setGroups(data);
        setError(null);
        setLoadedKey(requestKey);
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') {
          setGroups([]);
          setError(err.message);
          setLoadedKey(requestKey);
        }
      });

    return () => controller.abort();
  }, [enabled, requestKey]);

  const refetch = useCallback(() => setReloadKey((key) => key + 1), []);

  return {
    groups: enabled ? groups : [],
    loading: enabled && loadedKey !== requestKey,
    error: enabled ? error : null,
    refetch,
  };
}
