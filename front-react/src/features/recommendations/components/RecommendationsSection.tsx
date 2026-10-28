import { Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { WorkCard } from '@/features/works/components/WorkCard';
import { useRecommendations } from '../hooks/useRecommendations';

export function RecommendationsSection() {
  const { recommendations, loading, error } = useRecommendations(4);

  if (loading) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-heading font-semibold tracking-tight">
          Recomendaciones para vos
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-96 w-full rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-2">
        <h2 className="text-2xl font-heading font-semibold tracking-tight">
          Recomendaciones para vos
        </h2>
        <p className="text-sm text-muted-foreground">{error}</p>
      </section>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-heading font-semibold tracking-tight">
          Recomendaciones para vos
        </h2>
        <p className="text-sm text-muted-foreground">
          Obras elegidas a partir de tus preferencias e interacciones.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {recommendations.map(({ work, reasons }) => (
          <div key={work.id} className="flex flex-col">
            <WorkCard work={work} showComments={false} />
            {reasons.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                {reasons.map((reason) => (
                  <li key={reason} className="flex items-start gap-1.5">
                    <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
