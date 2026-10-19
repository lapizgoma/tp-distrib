import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarPlus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import type { EventRequestDTO } from '../types/events.types';
import { useEvent } from '../hooks/useEvent';
import { useEventMutations } from '../hooks/useEventMutations';
import { EventForm } from '../components/EventForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/**
 * ABM de eventos.
 */
export function EventFormView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { event, loading, error: loadError } = useEvent(isEdit ? id : undefined);
  const { create, update, submitting, error: submitError } = useEventMutations();

  const handleSubmit = async (payload: EventRequestDTO) => {
    if (isEdit && id) {
      const updated = await update(id, payload);
      if (updated) {
        toast.success('Evento actualizado');
        navigate(`/eventos/${updated.id}`);
      }
      return;
    }

    const created = await create(payload);
    if (created) {
      toast.success('Evento creado');
      navigate(`/eventos/${created.id}`);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => navigate(-1)}>
        <ArrowLeft className="size-4" />
        Volver
      </Button>

      <Card className="ring-border shadow-none">
        <CardHeader>
          <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            {isEdit ? <Pencil className="size-5" /> : <CalendarPlus className="size-5" />}
          </span>
          <CardTitle className="mt-2 text-title">
            {isEdit ? 'Editar evento' : 'Nuevo evento'}
          </CardTitle>
          <CardDescription>
            {isEdit
              ? 'Modificá los datos del evento y guardá los cambios.'
              : 'Completá los datos para programar un nuevo evento en el museo.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isEdit && loading && (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}

          {isEdit && loadError && (
            <Alert variant="destructive">
              <AlertTitle>No pudimos cargar el evento</AlertTitle>
              <AlertDescription>{loadError}</AlertDescription>
            </Alert>
          )}

          {(!isEdit || (!loading && !loadError)) && (
            <EventForm
              initialValue={isEdit && event ? event : undefined}
              submitting={submitting}
              error={submitError}
              submitLabel={isEdit ? 'Guardar cambios' : 'Crear evento'}
              onSubmit={handleSubmit}
              onCancel={() => navigate(-1)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
