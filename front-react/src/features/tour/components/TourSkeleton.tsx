import { Skeleton } from '@/components/ui/skeleton';

export function TourSkeleton() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-live="polite">
      <span className="sr-only">Armando recorrido…</span>

      <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <Skeleton className="h-3 w-28" />
        <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
          <Skeleton className="h-12 w-40" />
          <div className="grid grid-cols-3 gap-4 sm:gap-6">
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex flex-col items-center gap-2">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-6 w-8" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {[0, 1].map((section) => (
        <div key={section} className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="ml-4 border-l border-border pl-6">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-28 w-full rounded-lg" />
              <Skeleton className="h-28 w-full rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
