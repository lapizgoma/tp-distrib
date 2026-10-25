import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorks } from '../hooks/useWorks';
import { WorkCard } from '../components/WorkCard';
import { WorkFiltersBar } from '../components/WorkFiltersBar';
import { Check, Loader2, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isTokenValid, useAuthStore } from '@/shared/store/authStore';
import { MAX_WORKS_TO_COMPARE, MIN_WORKS_TO_COMPARE } from '../utils/comparison';

export function WorksListView() {
  const { works, loading, error, filters, updateFilters, clearFilters } = useWorks();
  const navigate = useNavigate();

  // La comparación va por la Gateway, que exige sesión.
  const canCompare = useAuthStore((state) => isTokenValid(state.token));
  const [selected, setSelected] = useState<number[]>([]);
  const limitReached = selected.length >= MAX_WORKS_TO_COMPARE;

  function toggle(id: number) {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id);
      if (current.length >= MAX_WORKS_TO_COMPARE) return current;
      return [...current, id];
    });
  }

  function compare() {
    navigate(`/comparar?ids=${selected.join(',')}`);
  }

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
          {works.map((work) => {
            const id = Number(work.id);
            const checked = selected.includes(id);
            return (
              <div key={work.id} className="relative">
                <WorkCard work={work} />
                {canCompare && (
                  <Button
                    type="button"
                    size="sm"
                    variant={checked ? 'default' : 'outline'}
                    aria-pressed={checked}
                    disabled={!checked && limitReached}
                    onClick={() => toggle(id)}
                    className="absolute left-3 top-3 z-10 shadow-sm"
                  >
                    {checked ? <Check className="size-4" /> : <Scale className="size-4" />}
                    {checked ? 'Seleccionada' : 'Comparar'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Barra de selección para comparar */}
      {canCompare && selected.length > 0 && (
        <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-lg">
          <p className="text-sm text-foreground">
            <span className="font-semibold">{selected.length}</span> de {MAX_WORKS_TO_COMPARE} obras seleccionadas
            {selected.length < MIN_WORKS_TO_COMPARE && (
              <span className="text-muted-foreground">
                {' '}· selecciona al menos {MIN_WORKS_TO_COMPARE}
              </span>
            )}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setSelected([])}>
              Limpiar
            </Button>
            <Button type="button" onClick={compare} disabled={selected.length < MIN_WORKS_TO_COMPARE}>
              <Scale className="size-4" />
              Comparar obras
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}