import { Check } from 'lucide-react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';

export interface ChipOption {
  value: string;
  label: string;
}

interface CriteriaChipGroupProps {
  legend: string;
  description?: string;
  options: ChipOption[];
  selected: string[];
  onToggle: (value: string) => void;
}

/** Grupo de chips múltiple, accesible como fieldset. */
export function CriteriaChipGroup({
  legend,
  description,
  options,
  selected,
  onToggle,
}: CriteriaChipGroupProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-foreground">{legend}</legend>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option.value);

          return (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={active ? 'default' : 'outline'}
              aria-pressed={active}
              onClick={() => onToggle(option.value)}
              className={cn(
                'h-7 rounded-full px-3 text-xs',
                !active && 'text-muted-foreground hover:text-foreground',
              )}
            >
              {active && <Check className="size-3" />}
              {option.label}
            </Button>
          );
        })}
      </div>
    </fieldset>
  );
}
