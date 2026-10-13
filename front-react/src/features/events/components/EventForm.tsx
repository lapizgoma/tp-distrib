import { useState, type FormEvent } from 'react';
import type { EventRequestDTO, EventType } from '../types/events.types';
import { EVENT_TYPE_LABELS, EVENT_TYPES } from '../types/events.types';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fromDateTimeLocal, toDateTimeLocal } from '../utils/format';

interface EventFormProps {
  initialValue?: Partial<EventRequestDTO>;
  submitting?: boolean;
  error?: string | null;
  submitLabel?: string;
  onSubmit: (payload: EventRequestDTO) => void;
  onCancel?: () => void;
}

interface FormState {
  title: string;
  description: string;
  datetime: string;
  duration: string;
  leadCuratorId: string;
  maximumCapacity: string;
  eventType: EventType | '';
}

type FormErrors = Partial<Record<keyof FormState, string>>;

export function EventForm({
  initialValue,
  submitting = false,
  error,
  submitLabel = 'Guardar evento',
  onSubmit,
  onCancel,
}: EventFormProps) {
  const [form, setForm] = useState<FormState>({
    title: initialValue?.title ?? '',
    description: initialValue?.description ?? '',
    datetime: toDateTimeLocal(initialValue?.datetime),
    duration: initialValue?.duration ? String(initialValue.duration) : '',
    leadCuratorId: initialValue?.leadCuratorId ? String(initialValue.leadCuratorId) : '',
    maximumCapacity: initialValue?.maximumCapacity ? String(initialValue.maximumCapacity) : '',
    eventType: initialValue?.eventType ?? '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const setField = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};

    if (!form.title.trim()) next.title = 'El título es obligatorio.';
    if (!form.eventType) next.eventType = 'Seleccioná un tipo de evento.';
    if (!form.datetime) {
      next.datetime = 'La fecha y hora son obligatorias.';
    } else if (new Date(fromDateTimeLocal(form.datetime)).getTime() <= Date.now()) {
      next.datetime = 'La fecha del evento debe ser futura.';
    }
    if (!form.leadCuratorId || Number(form.leadCuratorId) < 1) {
      next.leadCuratorId = 'Ingresá el ID del curador a cargo.';
    }
    if (!form.maximumCapacity || Number(form.maximumCapacity) < 1) {
      next.maximumCapacity = 'La capacidad debe ser al menos 1.';
    }
    if (form.duration && Number(form.duration) < 1) {
      next.duration = 'La duración mínima es de 1 minuto.';
    }

    return next;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      datetime: fromDateTimeLocal(form.datetime),
      duration: form.duration ? Number(form.duration) : null,
      leadCuratorId: Number(form.leadCuratorId),
      maximumCapacity: Number(form.maximumCapacity),
      eventType: form.eventType as EventType,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Field>
        <FieldLabel htmlFor="title">Título</FieldLabel>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => setField('title', e.target.value)}
          placeholder="Noche de Gala en el Museo"
          aria-invalid={Boolean(errors.title)}
        />
        <FieldError errors={errors.title ? [{ message: errors.title }] : undefined} />
      </Field>

      <Field>
        <FieldLabel htmlFor="description">Descripción</FieldLabel>
        <Textarea
          id="description"
          rows={3}
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          placeholder="Recorrido nocturno guiado con música en vivo."
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="eventType">Tipo de evento</FieldLabel>
          <Select
            value={form.eventType || null}
            onValueChange={(val) => setField('eventType', (val as EventType) ?? '')}
          >
            <SelectTrigger id="eventType" className="w-full" aria-invalid={Boolean(errors.eventType)}>
              <SelectValue placeholder="Seleccioná un tipo" />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {EVENT_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={errors.eventType ? [{ message: errors.eventType }] : undefined} />
        </Field>

        <Field>
          <FieldLabel htmlFor="datetime">Fecha y hora</FieldLabel>
          <Input
            id="datetime"
            type="datetime-local"
            value={form.datetime}
            onChange={(e) => setField('datetime', e.target.value)}
            aria-invalid={Boolean(errors.datetime)}
          />
          <FieldError errors={errors.datetime ? [{ message: errors.datetime }] : undefined} />
        </Field>

        <Field>
          <FieldLabel htmlFor="leadCuratorId">ID del curador a cargo</FieldLabel>
          <Input
            id="leadCuratorId"
            type="number"
            min={1}
            value={form.leadCuratorId}
            onChange={(e) => setField('leadCuratorId', e.target.value)}
            placeholder="Ej: 2"
            aria-invalid={Boolean(errors.leadCuratorId)}
          />
          <FieldError errors={errors.leadCuratorId ? [{ message: errors.leadCuratorId }] : undefined} />
        </Field>

        <Field>
          <FieldLabel htmlFor="maximumCapacity">Capacidad máxima</FieldLabel>
          <Input
            id="maximumCapacity"
            type="number"
            min={1}
            value={form.maximumCapacity}
            onChange={(e) => setField('maximumCapacity', e.target.value)}
            placeholder="Ej: 50"
            aria-invalid={Boolean(errors.maximumCapacity)}
          />
          <FieldError errors={errors.maximumCapacity ? [{ message: errors.maximumCapacity }] : undefined} />
        </Field>

        <Field>
          <FieldLabel htmlFor="duration">Duración (minutos)</FieldLabel>
          <Input
            id="duration"
            type="number"
            min={1}
            value={form.duration}
            onChange={(e) => setField('duration', e.target.value)}
            placeholder="Opcional"
            aria-invalid={Boolean(errors.duration)}
          />
          <FieldError errors={errors.duration ? [{ message: errors.duration }] : undefined} />
        </Field>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Guardando…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
