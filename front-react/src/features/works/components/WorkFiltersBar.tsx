// src/features/works/components/WorkFiltersBar.tsx
import { Search, RotateCcw } from 'lucide-react';
import type { WorkFilters, Availability } from '../types/works.types';
import { ERA_LABELS, TECHNIQUE_LABELS, LOCATION_LABELS } from '../types/works.types';
import { Button } from '@/components/ui/button';

interface WorkFiltersBarProps {
  filters: WorkFilters;
  onChange: (filters: Partial<WorkFilters>) => void;
  onClear: () => void;
}

export function WorkFiltersBar({ filters, onChange, onClear }: WorkFiltersBarProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5">
        
        {/* Búsqueda por palabra clave */}
        <div className="relative md:col-span-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por obra o artista..."
            value={filters.keyword || ''}
            onChange={(e) => onChange({ keyword: e.target.value })}
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {/* Filtro Época */}
        <select
          value={filters.era || ''}
          onChange={(e) => onChange({ era: e.target.value })}
          className="w-full rounded-md border border-input bg-background py-2 px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Todas las épocas</option>
          {Object.entries(ERA_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        {/* Filtro Técnica */}
        <select
          value={filters.technique || ''}
          onChange={(e) => onChange({ technique: e.target.value })}
          className="w-full rounded-md border border-input bg-background py-2 px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Todas las técnicas</option>
          {Object.entries(TECHNIQUE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        {/* Filtro Ubicación */}
        <select
          value={filters.location || ''}
          onChange={(e) => onChange({ location: e.target.value })}
          className="w-full rounded-md border border-input bg-background py-2 px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Todas las ubicaciones</option>
          {Object.entries(LOCATION_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        {/* Filtro Disponibilidad */}
        <select
          value={filters.availability || ''}
          onChange={(e) => onChange({ availability: (e.target.value as Availability) || undefined })}
          className="w-full rounded-md border border-input bg-background py-2 px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Cualquier estado</option>
          <option value="EN_EXHIBICION">En Exhibición</option>
          <option value="EN_DEPOSITO">En Depósito</option>
        </select>
      </div>

      <div className="mt-3 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="size-3.5" />
          Limpiar filtros
        </Button>
      </div>
    </div>
  );
}