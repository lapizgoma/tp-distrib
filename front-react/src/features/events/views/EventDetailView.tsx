import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Pencil,
  Trash2,
  UserCheck,
  UserRound,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { useEvent } from '../hooks/useEvent';
import { useEventRegistration } from '../hooks/useEventRegistration';
import { useEventMutations } from '../hooks/useEventMutations';
import { EventTypeBadge } from '../components/EventTypeBadge';
import { AttendeesTable } from '../components/AttendeesTable';
import { ConfirmDeleteDialog } from '../components/ConfirmDeleteDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatDuration, formatEventDateTime } from '../utils/format';

export function EventDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { event, loading, error } = useEvent(id);
  const registration = useEventRegistration();
  const { remove, submitting: deleting } = useEventMutations();

  const [confirmOpen, setConfirmOpen] = useState(false);
  // TODO(auth): usar el rol del visitante autenticado para alternar este estado
  // (se resolvería con GET /api/rest/events/members o un "me" del backend).
  const [isRegistered, setIsRegistered] = useState(false);

  const handleRegister = async () => {
    if (!event) return;
    // TODO(auth): si no hay sesión, redirigir al login en lugar de inscribir.
    const ok = await registration.register(event.id);
    if (ok) {
      setIsRegistered(true);
      toast.success('¡Inscripción confirmada!');
    }
  };

  const handleCancel = async () => {
    if (!event) return;
    // TODO(auth): idem, requiere sesión iniciada.
    const ok = await registration.cancel(event.id);
    if (ok) {
      setIsRegistered(false);
      toast.success('Inscripción cancelada');
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    const ok = await remove(event.id);
    if (ok) {
      toast.success('Evento eliminado');
      navigate('/eventos');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-44 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <Alert variant="destructive">
          <AlertTitle>No pudimos cargar el evento</AlertTitle>
          <AlertDescription>{error ?? 'Evento no encontrado.'}</AlertDescription>
        </Alert>
        <Button variant="link" className="mt-4" render={<Link to="/eventos" />}>
          <ArrowLeft className="size-4" />
          Volver a la cartelera
        </Button>
      </div>
    );
  }

  const duration = formatDuration(event.duration);
  const attendees = event.attendees ?? null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Button variant="ghost" size="sm" className="w-fit" render={<Link to="/eventos" />}>
        <ArrowLeft className="size-4" />
        Volver a la cartelera
      </Button>

      {/* Encabezado */}
      <header className="relative overflow-hidden rounded-lg bg-foreground px-6 py-8 text-background sm:px-10">
        <div className="pointer-events-none absolute top-0 left-0 h-full w-1.5 bg-primary" />
        <div className="relative z-10 flex flex-col gap-3">
          <EventTypeBadge type={event.eventType} className="w-fit" />
          <h1 className="max-w-3xl font-heading text-title font-semibold sm:text-display">
            {event.title}
          </h1>
          <p className="flex items-center gap-2 text-sm text-background/75">
            <CalendarDays className="size-4" />
            <span className="capitalize">{formatEventDateTime(event.datetime)}</span>
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Descripción */}
        <Card className="ring-border shadow-none">
          <CardHeader>
            <CardTitle>Sobre el evento</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground">
            {event.description || 'Sin descripción disponible.'}
          </CardContent>
        </Card>

        {/* Datos */}
        <Card className="ring-border shadow-none">
          <CardHeader>
            <CardTitle>Información</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p className="flex items-center gap-2">
              <CalendarDays className="size-4 text-primary" />
              <span className="capitalize">{formatEventDateTime(event.datetime)}</span>
            </p>
            {duration && (
              <p className="flex items-center gap-2">
                <Clock className="size-4 text-accent" />
                Duración: {duration}
              </p>
            )}
            <p className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              Capacidad: {event.maximumCapacity} personas
            </p>
            <p className="flex items-center gap-2">
              <UserRound className="size-4 text-accent" />
              {event.leadCuratorName ?? 'Curador a designar'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Inscripción — Visitante */}
      {/* TODO(auth): mostrar esta sección solo para usuarios con rol VISITANTE autenticados. */}
      <Card className="ring-border shadow-none">
        <CardHeader>
          <CardTitle>Tu inscripción</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {isRegistered ? (
            <>
              <p className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="size-4 text-accent" />
                Ya estás inscripto a este evento.
              </p>
              <Button
                variant="outline"
                className="w-fit"
                disabled={registration.submitting}
                onClick={handleCancel}
              >
                {registration.submitting ? 'Cancelando…' : 'Cancelar participación'}
              </Button>
            </>
          ) : (
            <>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserCheck className="size-4" />
                Reservá tu lugar antes de que se agoten.
              </p>
              <Button
                className="w-fit"
                disabled={registration.submitting}
                onClick={handleRegister}
              >
                {registration.submitting ? 'Inscribiendo…' : 'Inscribirme'}
              </Button>
            </>
          )}
          {registration.error && (
            <p className="text-sm text-destructive">{registration.error}</p>
          )}
        </CardContent>
      </Card>

      {/* Inscriptos — Curador/Admin */}
      {attendees && (
        <Card className="ring-border shadow-none">
          <CardHeader>
            <CardTitle>Lista de inscriptos ({attendees.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendeesTable attendees={attendees} />
          </CardContent>
        </Card>
      )}

      {/* Acciones de gestión — CURADOR/ADMIN */}
      {/* TODO(auth): habilitar solo para roles CURADOR o ADMINISTRADOR. */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <span className="mr-auto text-caption font-medium text-muted-foreground">
          Gestión del evento
        </span>
        <Button variant="outline" size="sm" render={<Link to={`/eventos/${event.id}/editar`} />}>
          <Pencil className="size-4" />
          Editar
        </Button>
        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setConfirmOpen(true)}>
          <Trash2 className="size-4" />
          Eliminar
        </Button>
      </div>

      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar evento"
        description="Esta acción es irreversible. ¿Querés eliminar el evento definitivamente?"
        submitting={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
