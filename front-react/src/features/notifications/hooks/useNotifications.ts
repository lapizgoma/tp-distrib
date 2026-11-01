import { useCallback, useEffect, useState } from 'react';
import { fetchNotifications } from '../api/notificationsApi';
import { DEFAULT_NOTIFICATIONS_PAGE_SIZE } from '../types/notifications.types';
import type { Notification } from '../types/notifications.types';

/** Listado paginado de notificaciones. Si `enabled` es false no consulta. */
export function useNotifications(enabled = true) {
  const [page, setPage] = useState(0);
  const [size, setSizeState] = useState(DEFAULT_NOTIFICATIONS_PAGE_SIZE);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const requestKey = `${page}:${size}:${reloadKey}`;

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();

    fetchNotifications({ page, size }, controller.signal)
      .then((res) => {
        setNotifications(res.content);
        setHasMore(res.hasMore);
        setError(null);
        setLoadedKey(requestKey);
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') return;
        setNotifications([]);
        setHasMore(false);
        setError(err.message);
        setLoadedKey(requestKey);
      });

    return () => controller.abort();
  }, [enabled, page, size, reloadKey, requestKey]);

  const goToPage = useCallback((next: number) => setPage(Math.max(0, next)), []);

  const setSize = useCallback((next: number) => {
    setSizeState(next);
    setPage(0);
  }, []);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return {
    notifications,
    hasMore,
    loading: enabled && loadedKey !== requestKey,
    error: enabled ? error : null,
    page,
    size,
    goToPage,
    setSize,
    reload,
  };
}
