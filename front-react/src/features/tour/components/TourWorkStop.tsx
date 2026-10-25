import { Link } from 'react-router-dom';
import { Clock, Palette } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDuration } from '@/features/events/utils/format';
import type { TourWork } from '../types/tour.types';
import { eraLabel, techniqueLabel, topicLabel } from '../utils/format';

interface TourWorkStopProps {
  work: TourWork;
}

export function TourWorkStop({ work }: TourWorkStopProps) {
  const duration = formatDuration(work.estimated_duration_minutes);
  const topics = work.topics.slice(0, 3);
  const remainingTopics = work.topics.length - topics.length;

  return (
    <li className="relative">
      <span
        className="absolute top-4 -left-[1.9rem] size-2.5 rounded-full bg-primary ring-4 ring-background"
        aria-hidden
      />

      <article className="rounded-lg border border-border bg-card p-3 shadow-xs transition-colors hover:border-primary/40">
        <div className="flex gap-3">
          <div className="size-20 shrink-0 overflow-hidden rounded-md bg-muted">
            {work.image_url ? (
              <img
                src={work.image_url}
                alt={work.title}
                className="size-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <Palette className="size-6 opacity-40" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="truncate font-heading text-base leading-tight font-medium">
                  {work.title}
                </h4>
                <p className="truncate text-sm text-muted-foreground">
                  {work.artist_name || 'Artista no especificado'}
                </p>
              </div>

              {duration && (
                <Badge variant="secondary" className="h-auto shrink-0 gap-1 px-2 py-1 text-[0.6875rem]">
                  <Clock className="size-3" />
                  {duration}
                </Badge>
              )}
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              {[
                work.creation_year > 0 ? work.creation_year : null,
                techniqueLabel(work.technique),
                eraLabel(work.era),
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>

            {topics.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {topics.map((topic) => (
                  <Badge key={topic} variant="outline" className="h-auto px-2 py-0.5 text-[0.6875rem] font-normal">
                    {topicLabel(topic)}
                  </Badge>
                ))}
                {remainingTopics > 0 && (
                  <Badge variant="ghost" className="h-auto px-1.5 py-0.5 text-[0.6875rem] font-normal">
                    +{remainingTopics}
                  </Badge>
                )}
              </div>
            )}

            <Button
              variant="link"
              size="sm"
              className="mt-1 h-auto p-0 text-xs"
              render={<Link to={`/obras/${work.id}`} />}
            >
              Ver obra
            </Button>
          </div>
        </div>
      </article>
    </li>
  );
}
