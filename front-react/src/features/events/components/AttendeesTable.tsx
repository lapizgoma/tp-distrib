import type { EventAttendeeDTO } from '../types/events.types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatShortDateTime } from '../utils/format';

interface AttendeesTableProps {
  attendees: EventAttendeeDTO[];
}

export function AttendeesTable({ attendees }: AttendeesTableProps) {
  if (attendees.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
        Todavía no hay inscriptos en este evento.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead>Inscripto</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Fecha de inscripción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attendees.map((attendee) => (
            <TableRow key={attendee.userId}>
              <TableCell className="font-medium">{attendee.name}</TableCell>
              <TableCell className="text-muted-foreground">{attendee.email}</TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatShortDateTime(attendee.registeredAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
