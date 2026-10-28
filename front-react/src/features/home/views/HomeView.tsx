import { RecommendationsSection } from '@/features/recommendations/components/RecommendationsSection';
import { useCanAccess } from '@/shared/hooks/useCanAccess';

export function HomeView() {
  const isVisitor = useCanAccess(['VISITANTE']);

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-heading font-bold tracking-tight">
        Bienvenido al Museo Virtual Interactivo
      </h1>

      {isVisitor && <RecommendationsSection />}
    </div>
  );
}
