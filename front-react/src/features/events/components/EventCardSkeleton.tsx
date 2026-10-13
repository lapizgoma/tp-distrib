import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function EventCardSkeleton() {
  return (
    <Card className="relative h-full gap-0 overflow-hidden pt-0 ring-1 ring-border">
      <Skeleton className="h-17 w-full rounded-none" />
      <div className="ticket-perforation" />
      <CardHeader className="gap-2 px-6 pt-5">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
      <CardContent className="px-6 pb-1">
        <div className="flex flex-col divide-y divide-border">
          <Skeleton className="my-2 h-4 w-1/2" />
          <Skeleton className="my-2 h-4 w-2/5" />
          <Skeleton className="my-2 h-4 w-1/3" />
          <Skeleton className="my-2 h-4 w-2/5" />
        </div>
      </CardContent>
      <CardFooter className="mt-auto px-6 pt-3 pb-6">
        <Skeleton className="h-8 w-full" />
      </CardFooter>
    </Card>
  );
}
