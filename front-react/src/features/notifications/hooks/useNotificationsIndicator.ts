import { useCallback, useEffect, useState } from 'react';
import { fetchNotifications } from '../api/notificationsApi';

const POLL_INTERVAL_MS = 60_000;

/**
 * Indica si el usuario tiene notificaciones sin leer.
 * Consulta una sola fila (`size=1&unreadOnly=true`) y refresca cada minuto.
 */
export function useNotificationsIndicator(enabled: boolean) {
  const [hasUnread, setHasUnread] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    let cancelled = false;

    async function load() {
      try {
        const res = await fetchNotifications(
          { page: 0, size: 1, unreadOnly: true },
          controller.signal,
        );
        if (!cancelled) setHasUnread(res.content.length > 0);
      } catch {
        // Red caída o sesión vencida: se mantiene el último estado conocido.
      }
    }

    void load();
    const timer = setInterval(() => void load(), POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(timer);
    };
  }, [enabled, reloadKey]);

  const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

  return { hasUnread: enabled && hasUnread, refresh };
}
