import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAuditEvents } from '../api/auditApi';
import { DEFAULT_AUDIT_FILTERS } from '../types/audit.types';
import type { AuditEvent, AuditFilters } from '../types/audit.types';

/**
 * Carga la auditoría aplicando los filtros recibidos.
 * Si `enabled` es false no se consulta (ej. rango de fechas inválido).
 */
export function useAuditLogs(
  initialFilters: AuditFilters = DEFAULT_AUDIT_FILTERS,
  enabled = true,
) {
  const [filters, setFilters] = useState<AuditFilters>(initialFilters);
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [hasMore, setHasMore] = useState(false);
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

    fetchAuditEvents(filtersRef.current, controller.signal)
      .then((res) => {
        setLogs(res.content);
        setHasMore(res.hasMore);
        setError(null);
        setLoadedKey(requestKey);
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') return;
        setLogs([]);
        setHasMore(false);
        setError(err.message);
        setLoadedKey(requestKey);
      });

    return () => controller.abort();
  }, [enabled, requestKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  const reset = useCallback(() => setFilters(DEFAULT_AUDIT_FILTERS), []);

  return {
    logs,
    hasMore,
    loading: enabled && loadedKey !== requestKey,
    error: enabled ? error : null,
    filters,
    setFilters,
    reload,
    reset,
  };
}
