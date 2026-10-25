import { SearchX } from 'lucide-react';

interface TourEmptyStateProps {
  notes: string[];
}

export function TourEmptyState({ notes }: TourEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <SearchX className="size-6" />
      </span>

      <p className="font-heading text-title">No encontramos un recorrido</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        No hay obras que coincidan con esos criterios. Probá quitar algún filtro o ampliar los
        límites.
      </p>

      {notes.length > 0 && (
        <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
          {notes.map((note, index) => (
            <li key={`${note}-${index}`}>{note}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
