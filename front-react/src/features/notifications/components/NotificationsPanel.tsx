import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BellOff, Loader2, RefreshCw } from 'lucide-react';
import { cn } from 'cn';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { markAllNotificationsRead } from '../api/notificationsApi';
import { useNotifications } from '../hooks/useNotifications';
import { NEWS_TYPE_LABELS } from '../types/notifications.types';
import type { NewsType } from '../types/notifications.types';

const NEWS_TYPE_BADGES: Record<NewsType, 'default' | 'secondary' | 'destructive'> = {
  EVENT_CREATED: 'default',
  EVENT_UPDATED: 'secondary',
  EVENT_CANCELLED: 'destructive',
};

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

interface NotificationsPanelProps {
  /** Se llama cuando las notificaciones se marcaron como leídas. */
  onMarkedRead: () => void;
  /** Cierra el panel al navegar a un evento. */
  onClose: () => void;
}

export function NotificationsPanel({ onMarkedRead, onClose }: NotificationsPanelProps) {
  const { notifications, hasMore, loading, error, page, goToPage, reload } = useNotifications(
    true,
  );
  const markedRef = useRef(false);

  // Al abrir el panel se marcan como leídas todas las del usuario. Si falla,
  // se reintenta en el próximo render.
  useEffect(() => {
    if (markedRef.current || loading || error || notifications.length === 0) return;
    markedRef.current = true;

    if (!notifications.some((notification) => !notification.isRead)) return;

    markAllNotificationsRead()
      .then(() => onMarkedRead())
      .catch(() => {
        markedRef.current = false;
      });
  }, [loading, error, notifications, onMarkedRead]);

  return (
    <DialogContent className="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>Notificaciones</DialogTitle>
        <DialogDescription>
          Novedades de los eventos del museo. Las no leídas quedan marcadas con un punto.
        </DialogDescription>
      </DialogHeader>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>No pudimos cargar las notificaciones</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      )}

      {!loading && !error && notifications.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
          <BellOff className="size-8 text-muted-foreground" />
          <p className="font-medium">No tenés notificaciones</p>
          <p className="text-sm text-muted-foreground">
            Cuando se cree, modifique o cancele un evento, te vas a enterar acá.
          </p>
        </div>
      )}

      {!loading && notifications.length > 0 && (
        <div className="flex max-h-[55vh] flex-col gap-2 overflow-y-auto pr-1">
          {notifications.map((notification) => (
            <Link
              key={notification.id}
              to={`/eventos/${notification.eventId}`}
              onClick={onClose}
              className="flex gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/60"
            >
              <span
                className={cn(
                  'mt-1.5 size-2 shrink-0 rounded-full',
                  notification.isRead ? 'bg-transparent' : 'bg-primary',
                )}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-medium">{notification.title}</span>
                  <Badge variant={NEWS_TYPE_BADGES[notification.newsType] ?? 'secondary'}>
                    {NEWS_TYPE_LABELS[notification.newsType] ?? notification.newsType}
                  </Badge>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{notification.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(notification.createdAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={reload}
          disabled={loading}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Actualizar
        </Button>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page === 0 || loading}
            onClick={() => goToPage(page - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">Página {page + 1}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasMore || loading}
            onClick={() => goToPage(page + 1)}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}
