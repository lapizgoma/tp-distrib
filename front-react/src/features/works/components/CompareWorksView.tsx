import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ComparisonTable } from '../components/ComparisonTable';
import { useCompareWorks } from '../hooks/useCompareWorks';
import { MAX_WORKS_TO_COMPARE, MIN_WORKS_TO_COMPARE, parseIds } from '../utils/comparison';

export function CompareWorksView() {
  const [searchParams] = useSearchParams();
  const ids = parseIds(searchParams.get('ids'));
  const { works, loading, error } = useCompareWorks(ids);

  const tooFew = ids.length < MIN_WORKS_TO_COMPARE;
  const tooMany = ids.length > MAX_WORKS_TO_COMPARE;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="rounded-xl bg-card border border-border p-6 shadow-sm">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-3"
          render={<Link to="/obras" />}
        >
          <ArrowLeft className="size-4" />
          Volver al catálogo
        </Button>
        <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">
          Comparación de obras
        </h1>
        <p className="mt-2 text-muted-foreground text-sm max-w-2xl">
          Observa las obras seleccionadas lado a lado y descubre en qué se parecen.
        </p>
      </div>

      {(tooFew || tooMany) && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
          <p className="text-base font-medium">
            {tooFew
              ? `Selecciona al menos ${MIN_WORKS_TO_COMPARE} obras para comparar`
              : `Puedes comparar hasta ${MAX_WORKS_TO_COMPARE} obras a la vez`}
          </p>
          <Button variant="outline" size="sm" render={<Link to="/obras" />}>
            Elegir obras en el catálogo
          </Button>
        </div>
      )}

      {loading && (
        <div className="space-y-3" role="status" aria-label="Comparando obras">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {error && !loading && (
        <Alert variant="destructive">
          <AlertTitle>Error al comparar las obras</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && !error && works.length > 0 && <ComparisonTable works={works} />}
    </div>
  );
}