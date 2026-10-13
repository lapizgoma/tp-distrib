import { Link } from 'react-router-dom';
import { CalendarDays, Clock, UserRound, Users } from 'lucide-react';
import type { EventResponseDTO, EventType } from '../types/events.types';
import { EVENT_TYPE_LABELS } from '../types/events.types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDateParts, formatDuration, formatShortDateTime } from '../utils/format';

interface EventCardProps {
  event: EventResponseDTO;
}

/** Cabecera del ticket según el tipo de evento. */
const TYPE_BAND: Record<EventType, string> = {
  VISITA_GUIADA: 'bg-type-visita text-type-visita-foreground',
  TALLER: 'bg-type-taller text-type-taller-foreground',
  CHARLA: 'bg-type-charla text-type-charla-foreground',
  EXPOSICION: 'bg-type-exposicion text-type-exposicion-foreground',
};

export function EventCard({ event }: EventCardProps) {
  const duration = formatDuration(event.duration);
  const { day, month } = formatDateParts(event.datetime);

  return (
    <Card className="group relative h-full gap-0 overflow-hidden pt-0 ring-1 ring-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/30">
      {/* Talón del ticket */}
      <div className={`flex items-center justify-between gap-3 px-6 py-4 ${TYPE_BAND[event.eventType]}`}>
        <div className="flex items-baseline gap-2">
          <span className="font-heading text-3xl leading-none font-semibold tracking-tight">{day}</span>
          <span className="text-sm font-medium tracking-wide uppercase opacity-80">{month}</span>
        </div>
        <span className="text-right text-[0.6875rem] font-semibold tracking-[0.14em] uppercase opacity-90">
          {EVENT_TYPE_LABELS[event.eventType]}
        </span>
      </div>

      <div className="ticket-perforation" />

      <CardHeader className="gap-2 px-6 pt-5">
        <CardTitle className="text-title leading-tight transition-colors group-hover:text-primary">
          {event.title}
        </CardTitle>
        <CardDescription className="line-clamp-2">{event.description}</CardDescription>
      </CardHeader>

      <CardContent className="px-6 pb-1">
        <div className="flex flex-col divide-y divide-border text-sm text-muted-foreground">
          <p className="flex items-center gap-2 py-2">
            <CalendarDays className="size-4 shrink-0 text-primary" />
            <span className="capitalize">{formatShortDateTime(event.datetime)}</span>
          </p>
          {duration && (
            <p className="flex items-center gap-2 py-2">
              <Clock className="size-4 shrink-0 text-accent" />
              <span>Duración: {duration}</span>
            </p>
          )}
          <p className="flex items-center gap-2 py-2">
            <Users className="size-4 shrink-0 text-muted-foreground" />
            <span>{event.maximumCapacity} lugares</span>
          </p>
          <p className="flex items-center gap-2 py-2">
            <UserRound className="size-4 shrink-0 text-muted-foreground" />
            <span>{event.leadCuratorName ?? 'Curador a designar'}</span>
          </p>
        </div>
      </CardContent>

      <CardFooter className="mt-auto px-6 pt-3 pb-6">
        <Button
          variant="outline"
          size="sm"
          className="w-full group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"
          render={<Link to={`/eventos/${event.id}`} />}
        >
          Ver detalle
        </Button>
      </CardFooter>
    </Card>
  );
}
