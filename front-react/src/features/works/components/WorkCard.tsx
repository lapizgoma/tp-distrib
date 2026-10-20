import { Link } from 'react-router-dom';
import { Palette, MapPin, MessageSquare, Calendar } from 'lucide-react';
import type { Work } from '../types/works.types';
import { AVAILABILITY_LABELS, LOCATION_LABELS } from '../types/works.types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface WorkCardProps {
  work: Work;
}

export function WorkCard({ work }: WorkCardProps) {
  const isAvailable = work.availability === 'EN_EXHIBICION';
  const locationText = LOCATION_LABELS[work.location] || work.location || 'Ubicación no especificada';

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden ring-1 ring-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/30">
      <div className="relative h-52 w-full overflow-hidden bg-muted">
        {work.image_url ? (
          <img
            src={work.image_url}
            alt={work.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <Palette className="size-10 opacity-40" />
            <span className="text-xs">Sin imagen disponible</span>
          </div>
        )}
        <span
          className={`absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold tracking-wider uppercase shadow-sm ${
            isAvailable
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
          }`}
        >
          {AVAILABILITY_LABELS[work.availability] || work.availability}
        </span>
      </div>

      <CardHeader className="gap-1 px-6 pt-4">
        <CardTitle className="text-title leading-tight transition-colors group-hover:text-primary">
          {work.title}
        </CardTitle>
        <CardDescription className="font-medium text-foreground/80">
          {work.artist?.name || 'Artista no especificado'}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 px-6 pb-2 text-sm text-muted-foreground">
        <p className="mb-4 line-clamp-2 text-xs leading-relaxed">{work.description}</p>
        
        <div className="flex flex-col gap-2 border-t border-border pt-3 text-xs">
          {work.creation_year > 0 && (
            <div className="flex items-center gap-2">
              <Calendar className="size-3.5 shrink-0 text-primary" />
              <span>Año: {work.creation_year}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <MapPin className="size-3.5 shrink-0 text-primary" />
            <span className="truncate">{locationText}</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
            <span>{work.comments?.length || 0} comentarios</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="mt-auto px-6 pt-3 pb-6">
        <Button
          variant="outline"
          size="sm"
          className="w-full group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"
          render={<Link to={`/obras/${work.id}`} />}
        >
          Ver detalles y comentarios
        </Button>
      </CardFooter>
    </Card>
  );
}