import { useState, type FormEvent } from 'react';
import type { EventFilters, SavedFilterRequestDTO } from '../types/events.types';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { EventFiltersBar } from './EventFiltersBar';

interface SavedFilterFormProps {
  initialValue?: Partial<SavedFilterRequestDTO>;
  submitting?: boolean;
  error?: string | null;
  submitLabel?: string;
  onSubmit: (payload: SavedFilterRequestDTO) => void;
  onCancel?: () => void;
}

function toFilters(config?: Partial<SavedFilterRequestDTO>['filterConfig']): EventFilters {
  return {
    type: config?.type ?? '',
    curatorId: config?.curatorId ?? '',
    startDate: config?.startDate ?? '',
    endDate: config?.endDate ?? '',
  };
}

export function SavedFilterForm({
  initialValue,
  submitting = false,
  error,
  submitLabel = 'Guardar filtro',
  onSubmit,
  onCancel,
}: SavedFilterFormProps) {
  const [name, setName] = useState(initialValue?.name ?? '');
  const [description, setDescription] = useState(initialValue?.description ?? '');
  const [filters, setFilters] = useState<EventFilters>(toFilters(initialValue?.filterConfig));
  const [nameError, setNameError] = useState<string | undefined>();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('El nombre del filtro es obligatorio.');
      return;
    }
    setNameError(undefined);

    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      filterConfig: {
        type: filters.type || null,
        curatorId: filters.curatorId || null,
        startDate: filters.startDate || null,
        endDate: filters.endDate || null,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field>
        <FieldLabel htmlFor="filter-name">Nombre</FieldLabel>
        <Input
          id="filter-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Talleres fin de semana"
          aria-invalid={Boolean(nameError)}
        />
        <FieldError errors={nameError ? [{ message: nameError }] : undefined} />
      </Field>

      <Field>
        <FieldLabel htmlFor="filter-description">Descripción</FieldLabel>
        <Textarea
          id="filter-description"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Opcional"
        />
      </Field>

      <div className="flex flex-col gap-2">
        <span className="text-caption font-medium text-muted-foreground">
          Criterios de búsqueda
        </span>
        <EventFiltersBar value={filters} onChange={setFilters} onReset={() => setFilters({})} />
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Guardando…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
