import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookmarkPlus, CalendarDays, IdCard, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import type { EventFilters, EventType, SavedFilterRequestDTO } from '../types/events.types';
import { useEvents } from '../hooks/useEvents';
import { createSavedFilter } from '../api/savedFiltersApi';
import { EventCard } from '../components/EventCard';
import { EventCardSkeleton } from '../components/EventCardSkeleton';
import { EventFiltersBar } from '../components/EventFiltersBar';
import { SavedFilterForm } from '../components/SavedFilterForm';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function filtersFromParams(params: URLSearchParams): EventFilters {
  return {
    type: (params.get('type') as EventType | null) ?? '',
    curatorId: params.get('curatorId') ? Number(params.get('curatorId')) : '',
    startDate: params.get('startDate') ?? '',
    endDate: params.get('endDate') ?? '',
  };
}

export function EventsListView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => filtersFromParams(searchParams), [searchParams]);
  const { events, loading, error } = useEvents(filters);

  const [saveOpen, setSaveOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleFiltersChange = (next: EventFilters) => {
    const params = new URLSearchParams();
    if (next.type) params.set('type', next.type);
    if (next.curatorId) params.set('curatorId', String(next.curatorId));
    if (next.startDate) params.set('startDate', next.startDate);
    if (next.endDate) params.set('endDate', next.endDate);
    setSearchParams(params, { replace: true });
  };

  const handleSaveFilter = async (payload: SavedFilterRequestDTO) => {
    // TODO(auth): guardar un filtro requiere sesión iniciada (rol VISITANTE).
    setSaving(true);
    setSaveError(null);
    try {
      await createSavedFilter(payload);
      toast.success('Filtro guardado en "Mis filtros"');
      setSaveOpen(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'No se pudo guardar el filtro');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      {/* Portada */}
      <header className="relative overflow-hidden rounded-lg bg-foreground px-6 py-10 text-background sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute top-0 left-0 h-full w-1.5 bg-primary" />
        <div className="relative z-10 flex flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-2 text-caption font-medium text-accent">
            <Ticket className="size-3.5" />
            Cartelera del museo
          </span>
          <h1 className="max-w-2xl font-heading text-display font-semibold">
            Eventos e inscripciones
          </h1>
          <p className="max-w-2xl text-sm text-background/75 sm:text-base">
            Visitas guiadas, talleres, charlas y exposiciones. Filtrá por tipo, curador o rango de
            fechas y reservá tu lugar.
          </p>
        </div>
      </header>

      {/* Filtros + acciones */}
      <EventFiltersBar
        value={filters}
        onChange={handleFiltersChange}
        onReset={() => handleFiltersChange({})}
        rightSlot={
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={() => setSaveOpen(true)}
          >
            <BookmarkPlus className="size-4" />
            Guardar filtro
          </Button>
        }
      />

      {/* Acceso a mis filtros */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="size-4" />
          {loading ? 'Buscando eventos…' : `${events.length} evento(s) encontrado(s)`}
        </p>
        <Button variant="link" size="sm" render={<Link to="/eventos/mis-filtros" />}>
          <IdCard className="size-4" />
          Mis filtros guardados
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>No pudimos cargar la cartelera</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <EventCardSkeleton key={index} />
          ))}
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
          <CalendarDays className="size-8 text-muted-foreground" />
          <p className="font-medium">No hay eventos para estos filtros</p>
          <p className="text-sm text-muted-foreground">
            Probá ampliar el rango de fechas o quitar algún criterio.
          </p>
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Modal para guardar el filtro actual */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Guardar filtro actual</DialogTitle>
            <DialogDescription>
              Guardá esta combinación de criterios para volver a usarla desde "Mis filtros".
            </DialogDescription>
          </DialogHeader>
          <SavedFilterForm
            initialValue={{
              name: '',
              description: '',
              filterConfig: {
                type: filters.type || null,
                curatorId: filters.curatorId || null,
                startDate: filters.startDate || null,
                endDate: filters.endDate || null,
              },
            }}
            submitting={saving}
            error={saveError}
            submitLabel="Guardar filtro"
            onSubmit={handleSaveFilter}
            onCancel={() => setSaveOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
