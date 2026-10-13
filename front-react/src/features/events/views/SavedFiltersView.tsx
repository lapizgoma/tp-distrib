import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookmarkPlus, Filter } from 'lucide-react';
import { toast } from 'sonner';
import type { SavedFilterRequestDTO, SavedFilterResponseDTO } from '../types/events.types';
import { useSavedFilters } from '../hooks/useSavedFilters';
import { SavedFilterCard } from '../components/SavedFilterCard';
import { SavedFilterForm } from '../components/SavedFilterForm';
import { ConfirmDeleteDialog } from '../components/ConfirmDeleteDialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Gestión de filtros favoritos de eventos (/api/rest/filters).
 *
 * TODO(auth): vista protegida para usuarios con rol VISITANTE autenticados.
 */
export function SavedFiltersView() {
  const navigate = useNavigate();
  const { filters, loading, submitting, error, create, update, remove } = useSavedFilters();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SavedFilterResponseDTO | null>(null);
  const [toDelete, setToDelete] = useState<SavedFilterResponseDTO | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (filter: SavedFilterResponseDTO) => {
    setEditing(filter);
    setDialogOpen(true);
  };

  const handleSubmit = async (payload: SavedFilterRequestDTO) => {
    const result = editing ? await update(editing.id, payload) : await create(payload);
    if (result) {
      toast.success(editing ? 'Filtro actualizado' : 'Filtro creado');
      setDialogOpen(false);
      setEditing(null);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    const ok = await remove(toDelete.id);
    if (ok) {
      toast.success('Filtro eliminado');
      setToDelete(null);
    }
  };

  const handleApply = (filter: SavedFilterResponseDTO) => {
    const params = new URLSearchParams();
    const config = filter.filterConfig;
    if (config?.type) params.set('type', config.type);
    if (config?.curatorId) params.set('curatorId', String(config.curatorId));
    if (config?.startDate) params.set('startDate', config.startDate);
    if (config?.endDate) params.set('endDate', config.endDate);
    navigate(`/eventos?${params.toString()}`);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="inline-flex w-fit items-center gap-2 text-caption font-medium text-primary">
            <Filter className="size-3.5" />
            Mis filtros
          </span>
          <h1 className="font-heading text-title font-semibold">Filtros guardados</h1>
          <p className="text-sm text-muted-foreground">
            Guardá tus búsquedas favoritas y aplicálas con un clic en la cartelera.
          </p>
        </div>
        <Button onClick={openCreate}>
          <BookmarkPlus className="size-4" />
          Nuevo filtro
        </Button>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>No pudimos cargar tus filtros</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!loading && filters.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
          <Filter className="size-8 text-muted-foreground" />
          <p className="font-medium">Todavía no guardaste filtros</p>
          <p className="text-sm text-muted-foreground">
            Creá uno nuevo o guardá el filtro actual desde la cartelera.
          </p>
        </div>
      )}

      {!loading && filters.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filters.map((filter) => (
            <SavedFilterCard
              key={filter.id}
              filter={filter}
              onApply={handleApply}
              onEdit={openEdit}
              onDelete={setToDelete}
            />
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar filtro' : 'Nuevo filtro'}</DialogTitle>
            <DialogDescription>
              Definí un nombre y los criterios de búsqueda que querés reutilizar.
            </DialogDescription>
          </DialogHeader>
          <SavedFilterForm
            initialValue={
              editing
                ? {
                    name: editing.name,
                    description: editing.description ?? '',
                    filterConfig: editing.filterConfig,
                  }
                : undefined
            }
            submitting={submitting}
            error={error}
            submitLabel={editing ? 'Guardar cambios' : 'Crear filtro'}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Eliminar filtro"
        description={`¿Querés eliminar el filtro "${toDelete?.name ?? ''}"?`}
        submitting={submitting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
