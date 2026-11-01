import { useCallback, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { useNotificationsIndicator } from '../hooks/useNotificationsIndicator';
import { NotificationsPanel } from './NotificationsPanel';

/**
 * Campanita del header. El punto rojo aparece solo si hay notificaciones sin
 * leer (no muestra cantidad).
 */
export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const { hasUnread, refresh } = useNotificationsIndicator(true);

  const handleMarkedRead = useCallback(() => refresh(), [refresh]);
  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="relative"
        aria-label={hasUnread ? 'Notificaciones sin leer' : 'Notificaciones'}
        title={hasUnread ? 'Tenés notificaciones sin leer' : 'Notificaciones'}
        onClick={() => setOpen(true)}
      >
        <Bell className="size-4" />
        {hasUnread && (
          <span
            className="absolute top-1 right-1 size-2 rounded-full bg-destructive ring-2 ring-background"
            aria-hidden
          />
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        {open && <NotificationsPanel onMarkedRead={handleMarkedRead} onClose={handleClose} />}
      </Dialog>
    </>
  );
}
