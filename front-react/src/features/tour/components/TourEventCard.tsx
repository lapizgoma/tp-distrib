import { Link } from 'react-router-dom';
import { CalendarClock, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EventTypeBadge } from '@/features/events/components/EventTypeBadge';
import { formatDuration, formatShortDateTime } from '@/features/events/utils/format';
import type { TourEvent } from '../types/tour.types';
import { asEventType, eraLabel, eventTypeLabel, roomLabel } from '../utils/format';

interface TourEventCardProps {
  event: TourEvent;
  showLocation?: boolean;
}

export function TourEventCard({ event, showLocation = false }: TourEventCardProps) {
  const type = asEventType(event.event_type);
  const duration = formatDuration(event.duration);

  return (
    <article className="rounded-lg border border-accent/40 bg-accent/10 p-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {type ? (
          <EventTypeBadge type={type} />
        ) : (
          <Badge variant="outline" className="h-auto px-2 py-1 text-[0.6875rem]">
            {event.event_type ? eventTypeLabel(event.event_type) : 'Evento'}
          </Badge>
        )}

        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarClock className="size-3.5" />
          {formatShortDateTime(event.datetime)}
        </span>

        {duration && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            {duration}
          </span>
        )}
      </div>

      <h4 className="mt-2 font-heading text-base leading-tight font-medium">{event.title}</h4>

      {event.description && (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {event.description}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {showLocation
            ? roomLabel(event.location)
            : event.associated_era
              ? eraLabel(event.associated_era)
              : 'Evento del museo'}
        </span>
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-xs"
          render={<Link to={`/eventos/${event.id}`} />}
        >
          Ver evento
        </Button>
      </div>
    </article>
  );
}
