import { useState } from 'react';
import { AlertCircle, RotateCcw, Route, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useTourPlan } from '../hooks/useTourPlan';
import {
  DEFAULT_TOUR_DURATION_MINUTES,
  EMPTY_TOUR_CRITERIA,
  type TourCriteria,
} from '../types/tour.types';
import { TourCriteriaForm } from '../components/TourCriteriaForm';
import { TourPlanResult } from '../components/TourPlanResult';
import { TourSkeleton } from '../components/TourSkeleton';
import { toDateTimeLocalValue } from '../utils/format';

const INTRO_STEPS = [
  'Si querés, elegí cuándo visitás; si no, empieza ahora.',
  'Sumá temas, épocas o técnicas que te interesen.',
  'El museo ordena las salas y busca eventos dentro de cada franja.',
];

function newCriteria(): TourCriteria {
  return {
    ...EMPTY_TOUR_CRITERIA,
    start_datetime: '',
    max_duration_minutes: DEFAULT_TOUR_DURATION_MINUTES,
    topics: [],
    eras: [],
    techniques: [],
  };
}

function TourIntro() {
  return (
    <div className="relative flex min-h-[420px] flex-col justify-center overflow-hidden rounded-xl border border-dashed border-border bg-card p-6 sm:p-10">
      <div
        className="pointer-events-none absolute -top-20 -right-20 size-56 rounded-full bg-accent/20 blur-3xl"
        aria-hidden
      />

      <span className="flex size-11 items-center justify-center rounded-md bg-accent text-accent-foreground">
        <Sparkles className="size-5" />
      </span>

      <h2 className="mt-4 font-heading text-title">Tu hoja de recorrido</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        Elegí cuándo venís, o dejalo vacío para empezar ahora. El museo arma una visita ordenada,
        con horarios por sala y eventos que coinciden con tu recorrido.
      </p>

      <ul className="mt-5 space-y-2.5">
        {INTRO_STEPS.map((step, index) => (
          <li key={step} className="flex items-start gap-3 text-sm text-muted-foreground">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted font-heading text-[0.6875rem] font-semibold text-foreground">
              {index + 1}
            </span>
            {step}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TourPlannerView() {
  const [criteria, setCriteria] = useState<TourCriteria>(newCriteria);
  const { plan, loading, error, submit, reset } = useTourPlan();

  const handleSubmit = () => {
    const next = criteria.start_datetime
      ? criteria
      : { ...criteria, start_datetime: toDateTimeLocalValue(new Date()) };

    if (next !== criteria) setCriteria(next);
    void submit(next);
  };

  const handleReset = () => {
    setCriteria(newCriteria());
    reset();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 max-w-2xl">
        <span className="inline-flex w-fit items-center gap-2 text-caption font-medium text-accent">
          <Route className="size-4" />
          Planificador de visitas
        </span>
        <h1 className="mt-2 max-w-2xl font-heading text-display font-semibold">
          Tu recorrido por el museo
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Armá una visita a tu medida. Elegí fecha y hora: el recorrido se agrupa por sala y
          muestra solo los eventos que ocurren mientras estás en cada una.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
        <TourCriteriaForm
          value={criteria}
          onChange={setCriteria}
          onSubmit={handleSubmit}
          onReset={handleReset}
          loading={loading}
        />

        <section aria-label="Resultado del recorrido" className="min-w-0">
          {!plan && !loading && !error && <TourIntro />}
          {loading && <TourSkeleton />}

          {error && !loading && (
            <Alert variant="destructive" className="items-start">
              <AlertCircle />
              <AlertTitle>No pudimos armar el recorrido</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>{error}</p>
                <Button type="button" variant="outline" size="sm" onClick={handleSubmit}>
                  <RotateCcw className="size-3.5" />
                  Reintentar
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {plan && !loading && <TourPlanResult plan={plan} />}
        </section>
      </div>
    </div>
  );
}
