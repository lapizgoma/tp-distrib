import { useMemo } from 'react';
import { Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatDuration } from '@/features/events/utils/format';
import type { TourEvent, TourPlan, TourWork } from '../types/tour.types';
import { formatVisitWindow, normalizeRoomCode } from '../utils/format';
import { TourEmptyState } from './TourEmptyState';
import { TourRoomSection } from './TourRoomSection';

interface TourPlanResultProps {
  plan: TourPlan;
}

interface RoomGroup {
  room: string;
  works: TourWork[];
  events: TourEvent[];
}

export function TourPlanResult({ plan }: TourPlanResultProps) {
  const groups = useMemo<RoomGroup[]>(() => {
    const worksByRoom = new Map<string, TourWork[]>();
    for (const work of plan.works) {
      const room = normalizeRoomCode(work.location);
      const works = worksByRoom.get(room) ?? [];
      works.push(work);
      worksByRoom.set(room, works);
    }

    const eventsByRoom = new Map<string, TourEvent[]>();
    for (const event of plan.events) {
      const room = normalizeRoomCode(event.location);
      const events = eventsByRoom.get(room) ?? [];
      events.push(event);
      eventsByRoom.set(room, events);
    }

    const seen = new Set<string>();
    const orderedRooms = [...plan.rooms.map(normalizeRoomCode), ...worksByRoom.keys()];

    return orderedRooms
      .filter((room) => {
        if (seen.has(room)) return false;
        seen.add(room);
        return true;
      })
      .map((room) => ({
        room,
        works: worksByRoom.get(room) ?? [],
        events: eventsByRoom.get(room) ?? [],
      }))
      .filter((group) => group.works.length > 0);
  }, [plan]);

  const scheduleByRoom = useMemo(() => {
    return new Map(
      (plan.room_schedule ?? []).map((slot) => [normalizeRoomCode(slot.room), slot]),
    );
  }, [plan.room_schedule]);

  if (plan.works.length === 0) {
    return <TourEmptyState notes={plan.notes} />;
  }

  const totalDuration = formatDuration(plan.total_duration_minutes);
  const visitWindow = formatVisitWindow(plan.start_datetime, plan.end_datetime);

  return (
    <div className="flex flex-col gap-6" aria-live="polite">
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[0.6875rem] font-medium tracking-widest text-muted-foreground uppercase">
              Recorrido estimado
            </p>
            <p className="mt-1 font-heading text-display leading-none">
              {totalDuration ?? 'Sin duración estimada'}
            </p>
            {visitWindow && (
              <p className="mt-2 text-sm font-medium text-foreground">{visitWindow}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Incluye los traslados entre salas.
            </p>
            {visitWindow && plan.events.length === 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                No hay eventos en las salas durante esta franja.
              </p>
            )}
          </div>

          <dl className="grid grid-cols-3 gap-4 text-center sm:gap-6">
            <div>
              <dt className="text-[0.6875rem] text-muted-foreground uppercase">Obras</dt>
              <dd className="font-heading text-title leading-tight">{plan.works.length}</dd>
            </div>
            <div>
              <dt className="text-[0.6875rem] text-muted-foreground uppercase">Salas</dt>
              <dd className="font-heading text-title leading-tight">{groups.length}</dd>
            </div>
            <div>
              <dt className="text-[0.6875rem] text-muted-foreground uppercase">Eventos</dt>
              <dd className="font-heading text-title leading-tight">{plan.events.length}</dd>
            </div>
          </dl>
        </div>
      </div>

      {plan.events.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <p>
            Los eventos son actividades independientes del recorrido. No suman tiempo; podés
            inscribirte desde el detalle de cada evento.
          </p>
        </div>
      )}

      {plan.notes.length > 0 && (
        <Alert className="border-accent/40 bg-accent/10">
          <Info className="text-accent" />
          <AlertTitle>El recorrido se ajustó</AlertTitle>
          <AlertDescription>
            <ul className="space-y-1">
              {plan.notes.map((note, index) => (
                <li key={`${note}-${index}`}>{note}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-title">Itinerario</h2>
          <p className="text-xs text-muted-foreground">
            {groups.length} sala(s) · {plan.works.length} obra(s)
          </p>
        </div>

        {groups.map((group, index) => (
          <TourRoomSection
            key={group.room}
            room={group.room}
            index={index + 1}
            works={group.works}
            events={group.events}
            slot={scheduleByRoom.get(group.room)}
          />
        ))}
      </div>
    </div>
  );
}
