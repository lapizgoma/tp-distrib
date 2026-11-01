import { useState, useEffect, useCallback } from 'react';
import { fetchAuditEvents } from '../api/auditApi';
import type { AuditEvent, AuditFilters } from '../types/audit.types';

export function useAuditLogs(initialFilters: AuditFilters = { page: 0, size: 20 }) {
  const [filters, setFilters] = useState<AuditFilters>(initialFilters);
  const [data, setData] = useState<AuditEvent[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAuditEvents(filters);
      if (!signal?.aborted) {
        setData(res.content);
        setHasMore(res.hasMore);
      }
    } catch (err: unknown) {
      if (!signal?.aborted) {
        const message = err instanceof Error ? err.message : 'Error al cargar los logs de auditoría';
        setError(message);
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [filters]);

  useEffect(() => {
    let isSubscribed = true;

    async function executeFetch() {
      // 1. Movemos la actualización de estado dentro del microtask asíncrono
      await Promise.resolve();
      if (!isSubscribed) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetchAuditEvents(filters);
        if (isSubscribed) {
          setData(res.content);
          setHasMore(res.hasMore);
        }
      } catch (err: unknown) {
        if (isSubscribed) {
          const message = err instanceof Error ? err.message : 'Error al cargar los logs de auditoría';
          setError(message);
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }

    void executeFetch();

    return () => {
      isSubscribed = false;
    };
  }, [filters]);

  return {
    logs: data,
    hasMore,
    loading,
    error,
    filters,
    setFilters,
    reload,
  };
}