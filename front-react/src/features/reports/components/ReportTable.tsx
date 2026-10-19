import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from 'cn';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { GroupResult, Grouping } from '../types/reports.types';
import { formatDecimal, formatGroupName, formatInteger } from '../utils/format';
import type { GroupLevel } from '../utils/format';

/** Qué dimensión representa cada nivel de anidamiento según el modo elegido. */
const LEVELS: Record<Grouping, GroupLevel[]> = {
  MONTH: ['MONTH'],
  TYPE: ['TYPE'],
  MONTH_TYPE: ['MONTH', 'TYPE'],
};

interface GroupRowsProps {
  group: GroupResult;
  depth: number;
  levels: GroupLevel[];
}

function GroupRows({ group, depth, levels }: GroupRowsProps) {
  const [open, setOpen] = useState(false);
  const subGroups = group.subGroups ?? [];
  const hasSubGroups = subGroups.length > 0;
  const label = formatGroupName(group.groupName, levels[depth] ?? 'TYPE');

  return (
    <>
      <TableRow className={cn(depth > 0 && 'bg-muted/30')}>
        <TableCell>
          <div className="flex items-center gap-1" style={{ paddingLeft: depth * 24 }}>
            
            {/* este botón de despliegue aparece solo si hay subgrupos. */}
            {hasSubGroups ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-expanded={open}
                aria-label={open ? `Ocultar desglose de ${label}` : `Ver desglose de ${label}`}
                onClick={() => setOpen((current) => !current)}
              >
                <ChevronRight className={cn('transition-transform', open && 'rotate-90')} />
              </Button>
            ) : (
              <span className="size-6 shrink-0" aria-hidden />
            )}
            
            <span className="font-medium">{label}</span>
          </div>
        </TableCell>
        <TableCell className="text-right tabular-nums">{formatInteger(group.eventCount)}</TableCell>
        <TableCell className="text-right tabular-nums">
          {formatInteger(group.totalRegistrants)}
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {formatDecimal(group.averageAttendance)}
        </TableCell>
        <TableCell className="whitespace-normal">
          {group.topEvents.length === 0 ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <ol className="flex flex-col gap-1">
              {group.topEvents.map((event, index) => (
                <li key={event.id} className="flex items-center justify-between gap-3">
                  <span className="truncate">
                    <span className="mr-1.5 text-muted-foreground">{index + 1}.</span>
                    <a href={`/eventos/${event.id}`} className="hover:underline">
                      {event.name}
                    </a>
                  </span>
                  <Badge variant="secondary">{formatInteger(event.registrants)}</Badge>
                </li>
              ))}
            </ol>
          )}
        </TableCell>
      </TableRow>

      {open &&
        subGroups.map((subGroup) => (
          <GroupRows
            key={`${group.groupName}/${subGroup.groupName}`}
            group={subGroup}
            depth={depth + 1}
            levels={levels}
          />
        ))}
    </>
  );
}

interface ReportTableProps {
  groups: GroupResult[];
  grouping: Grouping;
}

export function ReportTable({ groups, grouping }: ReportTableProps) {
  const levels = LEVELS[grouping];
  const firstColumn = grouping === 'TYPE' ? 'Tipo' : 'Mes';

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>{firstColumn}</TableHead>
            <TableHead className="text-right">Eventos</TableHead>
            <TableHead className="text-right">Inscriptos</TableHead>
            <TableHead className="text-right">Promedio por evento</TableHead>
            <TableHead>Más populares (inscriptos)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => (
            <GroupRows key={group.groupName} group={group} depth={0} levels={levels} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
