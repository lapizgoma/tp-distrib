import { useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Loader2, Plus, RotateCcw, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  DEFAULT_TOUR_DURATION_MINUTES,
  type TourCriteria,
} from '../types/tour.types';
import {
  TOUR_ERA_OPTIONS,
  TOUR_TECHNIQUE_OPTIONS,
  TOUR_TOPIC_OPTIONS,
  toDateTimeLocalValue,
} from '../utils/format';
import { CriteriaChipGroup, type ChipOption } from './CriteriaChipGroup';

type ArrayField = 'topics' | 'eras' | 'techniques';
type LimitField = 'max_duration_minutes' | 'max_works_count';

interface TourCriteriaFormProps {
  value: TourCriteria;
  onChange: (value: TourCriteria) => void;
  onSubmit: () => void;
  onReset: () => void;
  loading: boolean;
}

export function TourCriteriaForm({
  value,
  onChange,
  onSubmit,
  onReset,
  loading,
}: TourCriteriaFormProps) {
  const [topicDraft, setTopicDraft] = useState('');

  const topicOptions = useMemo<ChipOption[]>(() => {
    const known = TOUR_TOPIC_OPTIONS.map((topic) => ({ value: topic, label: topic }));
    const extras = value.topics
      .filter(
        (topic) =>
          !TOUR_TOPIC_OPTIONS.some(
            (option) => option.toLowerCase() === topic.toLowerCase(),
          ),
      )
      .map((topic) => ({ value: topic, label: topic }));

    return [...known, ...extras];
  }, [value.topics]);

  const toggle = (field: ArrayField, option: string) => {
    const current = value[field];
    const next = current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option];

    onChange({ ...value, [field]: next });
  };

  const addTopic = () => {
    const topic = topicDraft.trim();
    if (!topic) return;

    const alreadySelected = value.topics.some(
      (selected) => selected.toLowerCase() === topic.toLowerCase(),
    );

    if (!alreadySelected) {
      const knownTopic = TOUR_TOPIC_OPTIONS.find(
        (option) => option.toLowerCase() === topic.toLowerCase(),
      );
      onChange({ ...value, topics: [...value.topics, knownTopic ?? topic] });
    }
    setTopicDraft('');
  };

  const handleTopicKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    addTopic();
  };

  const updateLimit = (field: LimitField, raw: string) => {
    const parsed = raw === '' ? 0 : Number(raw);
    const next = Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;

    onChange({ ...value, [field]: next });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  const handleReset = () => {
    setTopicDraft('');
    onReset();
  };

  return (
    <Card className="lg:sticky lg:top-24">
      <CardHeader>
        <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Route className="size-5" />
        </span>
        <CardTitle className="mt-2 text-title">Armá tu recorrido</CardTitle>
        <CardDescription>
          Elegí qué querés ver y cuánto tiempo tenés. El museo ordena las obras por sala.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Field>
            <FieldLabel htmlFor="tour-start">Inicio de la visita</FieldLabel>
            <Input
              id="tour-start"
              type="datetime-local"
              min={toDateTimeLocalValue(new Date())}
              value={value.start_datetime}
              onChange={(event) =>
                onChange({ ...value, start_datetime: event.target.value })
              }
            />
            <FieldDescription>
              Si se deja vacío, empieza ahora.
            </FieldDescription>
          </Field>

          <div className="flex flex-col gap-5">
            <CriteriaChipGroup
              legend="Temas"
              description="Podés combinar varios. Los temas no se relajan."
              options={topicOptions}
              selected={value.topics}
              onToggle={(topic) => toggle('topics', topic)}
            />

            <Field>
              <FieldLabel htmlFor="tour-topic">Agregar otro tema</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="tour-topic"
                  value={topicDraft}
                  onChange={(event) => setTopicDraft(event.target.value)}
                  onKeyDown={handleTopicKeyDown}
                  placeholder="Ej. Arquitectura"
                  autoComplete="off"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addTopic}
                  disabled={!topicDraft.trim()}
                  aria-label="Agregar tema"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              <FieldDescription>Enter o el botón + para sumarlo.</FieldDescription>
            </Field>

            <CriteriaChipGroup
              legend="Épocas"
              options={TOUR_ERA_OPTIONS}
              selected={value.eras}
              onToggle={(era) => toggle('eras', era)}
            />

            <CriteriaChipGroup
              legend="Técnicas"
              options={TOUR_TECHNIQUE_OPTIONS}
              selected={value.techniques}
              onToggle={(technique) => toggle('techniques', technique)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="tour-duration">Duración máxima</FieldLabel>
              <Input
                id="tour-duration"
                type="number"
                min={0}
                max={2147483647}
                step={5}
                inputMode="numeric"
                value={value.max_duration_minutes > 0 ? value.max_duration_minutes : ''}
                onChange={(event) => updateLimit('max_duration_minutes', event.target.value)}
                placeholder="Sin límite"
              />
              <FieldDescription>
                Vacío = sin límite. Sugerido: {DEFAULT_TOUR_DURATION_MINUTES} min.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="tour-works">Máximo de obras</FieldLabel>
              <Input
                id="tour-works"
                type="number"
                min={0}
                max={2147483647}
                step={1}
                inputMode="numeric"
                value={value.max_works_count > 0 ? value.max_works_count : ''}
                onChange={(event) => updateLimit('max_works_count', event.target.value)}
                placeholder="Sin límite"
              />
              <FieldDescription>Vacío = sin límite.</FieldDescription>
            </Field>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Si no hay coincidencias exactas, se puede ampliar la época o la técnica. La duración
            total incluye los traslados entre salas.
          </p>

          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Route className="size-4" />
              )}
              {loading ? 'Armando recorrido…' : 'Armar recorrido'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
              className="w-full text-muted-foreground"
            >
              <RotateCcw className="size-4" />
              Limpiar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
