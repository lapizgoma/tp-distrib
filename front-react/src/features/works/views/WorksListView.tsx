// src/features/works/views/WorksListView.tsx
import { useWorks } from '../hooks/useWorks';
import { WorkCard } from '../components/WorkCard';
import { WorkFiltersBar } from '../components/WorkFiltersBar';
import { Loader2 } from 'lucide-react';

export function WorksListView() {
  const { works, loading, error, filters, updateFilters, clearFilters } = useWorks();

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Encabezado */}
      <div className="rounded-xl bg-card border border-border p-6 shadow-sm">
        <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">
          Catálogo de Obras
        </h1>
        <p className="mt-2 text-muted-foreground text-sm max-w-2xl">
          Explora la colección del museo. Consulta los detalles de cada obra, su disponibilidad en sala y los comentarios de los visitantes.
        </p>
      </div>

      {/* Barra de Filtros */}
      <WorkFiltersBar
        filters={filters}
        onChange={updateFilters}
        onClear={clearFilters}
      />

      {/* Estado de Carga */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm">Cargando catálogo de obras...</p>
        </div>
      )}

      {/* Estado de Error */}
      {error && !loading && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center text-destructive">
          <p className="font-semibold">Error al cargar las obras</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Resultado Vacío */}
      {!loading && !error && works.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          <p className="text-base font-medium">No se encontraron obras</p>
          <p className="text-sm mt-1">Prueba cambiando o limpiando los filtros seleccionados.</p>
        </div>
      )}

      {/* Grilla de Obras */}
      {!loading && !error && works.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {works.map((work) => (
            <WorkCard key={work.id} work={work} />
          ))}
        </div>
      )}
    </div>
  );
}