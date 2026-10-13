import { Pencil, Play, Trash2 } from 'lucide-react';
import type { SavedFilterResponseDTO } from '../types/events.types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { describeFilterConfig } from '../utils/format';

interface SavedFilterCardProps {
  filter: SavedFilterResponseDTO;
  onApply: (filter: SavedFilterResponseDTO) => void;
  onEdit: (filter: SavedFilterResponseDTO) => void;
  onDelete: (filter: SavedFilterResponseDTO) => void;
}

export function SavedFilterCard({ filter, onApply, onEdit, onDelete }: SavedFilterCardProps) {
  const chips = describeFilterConfig(filter.filterConfig);

  return (
    <Card className="h-full ring-border shadow-none transition-all hover:shadow-md hover:ring-primary/30">
      <CardHeader>
        <CardTitle className="text-base">{filter.name}</CardTitle>
        {filter.description && (
          <p className="text-sm text-muted-foreground">{filter.description}</p>
        )}
      </CardHeader>

      <CardContent className="flex flex-wrap gap-2">
        {chips.length > 0 ? (
          chips.map((chip) => (
            <Badge key={chip} variant="secondary" className="font-normal">
              {chip}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">Sin criterios definidos</span>
        )}
      </CardContent>

      <CardFooter className="mt-auto flex-wrap gap-2">
        <Button size="sm" onClick={() => onApply(filter)}>
          <Play className="size-4" />
          Aplicar
        </Button>
        <Button size="sm" variant="outline" onClick={() => onEdit(filter)}>
          <Pencil className="size-4" />
          Editar
        </Button>
        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDelete(filter)}>
          <Trash2 className="size-4" />
          Eliminar
        </Button>
      </CardFooter>
    </Card>
  );
}
