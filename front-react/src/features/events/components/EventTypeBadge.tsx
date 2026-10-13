import { Badge } from '@/components/ui/badge';
import { cn } from 'cn';
import { EVENT_TYPE_LABELS, type EventType } from '../types/events.types';

/** Colores de la cartelera para cada tipo de evento (tokens en index.css). */
const TYPE_STYLE_MAP: Record<EventType, string> = {
  VISITA_GUIADA: 'bg-type-visita text-type-visita-foreground',
  TALLER: 'bg-type-taller text-type-taller-foreground',
  CHARLA: 'bg-type-charla text-type-charla-foreground',
  EXPOSICION: 'bg-type-exposicion text-type-exposicion-foreground',
};

interface EventTypeBadgeProps {
  type: EventType;
  className?: string;
}

export function EventTypeBadge({ type, className }: EventTypeBadgeProps) {
  return (
    <Badge
      className={cn(
        'h-auto rounded-sm border-transparent px-2 py-1 text-[0.6875rem] font-semibold tracking-[0.14em] uppercase',
        TYPE_STYLE_MAP[type],
        className,
      )}
    >
      {EVENT_TYPE_LABELS[type]}
    </Badge>
  );
}
