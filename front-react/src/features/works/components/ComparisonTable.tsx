import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { allCoincide, commonTopics, humanize } from '../utils/comparison';
import type { ComparedWork } from '../types/works-comparison.types';

interface Row {
  label: string;
  /** Texto usado para mostrar y para decidir si todas las obras coinciden. */
  text: (work: ComparedWork) => string;
  /** false = la fila nunca se resalta (ej. descripción). */
  comparable: boolean;
  render?: (work: ComparedWork, common: Set<string>) => ReactNode;
}

const ROWS: Row[] = [
  { label: 'Artista', text: (w) => w.artistName, comparable: true },
  { label: 'Año', text: (w) => (w.creationYear > 0 ? String(w.creationYear) : ''), comparable: true },
  { label: 'Técnica', text: (w) => humanize(w.technique), comparable: true },
  { label: 'Época', text: (w) => humanize(w.era), comparable: true },
  { label: 'Dimensiones', text: (w) => w.dimensions, comparable: true },
  {
    label: 'Temas',
    text: (w) => [...w.topics].sort().join('|'),
    comparable: true,
    render: (w, common) =>
      w.topics.length === 0 ? (
        '—'
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {w.topics.map((topic) => (
            <Badge key={topic} variant={common.has(topic) ? 'default' : 'secondary'}>
              {topic}
            </Badge>
          ))}
        </div>
      ),
  },
  { label: 'Ubicación', text: (w) => humanize(w.location), comparable: true },
  { label: 'Disponibilidad', text: (w) => humanize(w.availability), comparable: true },
  {
    label: 'Duración estimada',
    text: (w) => (w.estimatedDurationMinutes > 0 ? `${w.estimatedDurationMinutes} min` : ''),
    comparable: true,
  },
  { label: 'Descripción', text: (w) => w.description, comparable: false },
];

interface ComparisonTableProps {
  works: ComparedWork[];
}

export function ComparisonTable({ works }: ComparisonTableProps) {
  const common = commonTopics(works);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky left-0 z-10 w-36 min-w-36 bg-card align-bottom text-xs tracking-wide text-muted-foreground uppercase">
                Campo
              </TableHead>
              {works.map((work) => (
                <TableHead
                  key={work.id}
                  className="h-auto min-w-56 p-3 align-top font-normal whitespace-normal"
                >
                  <img
                    src={work.imageUrl}
                    alt={work.title}
                    loading="lazy"
                    className="mb-3 aspect-3/2 w-full rounded-lg object-cover"
                  />
                  <Link
                    to={`/obras/${work.id}`}
                    className="font-heading text-base font-semibold text-foreground hover:underline"
                  >
                    {work.title}
                  </Link>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {ROWS.map((row) => {
              const coincide = row.comparable && allCoincide(works.map(row.text));
              return (
                <TableRow key={row.label}>
                  <TableHead
                    scope="row"
                    className="sticky left-0 z-10 h-auto bg-card p-3 align-top font-medium whitespace-normal text-foreground"
                  >
                    <span className="flex items-center gap-1.5">
                      {row.label}
                      {coincide && (
                        <>
                          <Check className="size-3.5 text-primary" aria-hidden="true" />
                          <span className="sr-only">(coinciden)</span>
                        </>
                      )}
                    </span>
                  </TableHead>
                  {works.map((work) => (
                    <TableCell
                      key={work.id}
                      className={`p-3 align-top whitespace-normal text-foreground ${coincide ? 'bg-primary/10' : ''}`}
                    >
                      {row.render ? row.render(work, common) : row.text(work) || '—'}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        Las filas resaltadas indican que todas las obras coinciden en ese campo. En los temas, los
        destacados aparecen en todas las obras.
      </p>
    </div>
  );
}