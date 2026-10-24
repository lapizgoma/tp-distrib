import { CalendarDays, Clock } from 'lucide-react';
import { formatDuration } from '@/features/events/utils/format';
import type { RoomSchedule, TourEvent, TourWork } from '../types/tour.types';
import { formatRoomSlot, roomLabel } from '../utils/format';
import { TourEventCard } from './TourEventCard';
import { TourWorkStop } from './TourWorkStop';

interface TourRoomSectionProps {
  room: string;
  index: number;
  works: TourWork[];
  events: TourEvent[];
  slot?: RoomSchedule;
}

export function TourRoomSection({
  room,
  index,
  works,
  events,
  slot,
}: TourRoomSectionProps) {
  const slotLabel = formatRoomSlot(slot);
  const worksDuration = formatDuration(
    works.reduce((total, work) => total + Math.max(0, work.estimated_duration_minutes), 0),
  );

  return (
    <section aria-labelledby={`tour-room-${room}`}>
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-sm font-semibold text-primary-foreground">
          {String(index).padStart(2, '0')}
        </span>
        <div>
          <h3 id={`tour-room-${room}`} className="font-heading text-title leading-tight">
            {roomLabel(room)}
          </h3>
          <p className="text-xs text-muted-foreground">
            {works.length} obra(s)
            {worksDuration ? ` · ${worksDuration} en obras` : ''}
          </p>
          {slotLabel && (
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-primary">
              <Clock className="size-3.5" />
              {slotLabel}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 ml-4 border-l border-border pl-6">
        <ol className="space-y-3">
          {works.map((work) => (
            <TourWorkStop key={work.id} work={work} />
          ))}
        </ol>

        {events.length > 0 && (
          <div className="mt-5 border-t border-dashed border-border pt-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <CalendarDays className="size-3.5 text-accent" />
              Eventos durante tu visita en esta sala
            </p>
            <div className="space-y-2">
              {events.map((event) => (
                <TourEventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
