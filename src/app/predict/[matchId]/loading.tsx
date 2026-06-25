import AppShell from '@/components/layout/AppShell'
import { Skeleton, CardListSkeleton } from '@/components/ui/PageSkeleton'

export default function Loading() {
  return (
    <AppShell>
      <div className="pt-4 space-y-5">
        {/* Back link skeleton */}
        <Skeleton className="h-4 w-32 animate-pulse" />
        {/* Match header card */}
        <div className="card p-5 text-center space-y-4 animate-pulse">
          <Skeleton className="h-3 w-28 mx-auto" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-10 w-10 rounded-full mx-auto" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </div>
            <Skeleton className="h-8 w-16 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-10 w-10 rounded-full mx-auto" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </div>
          </div>
        </div>
        {/* Predict form skeleton */}
        <div className="card p-4 space-y-4 animate-pulse">
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-4 justify-center">
            <Skeleton className="h-14 w-20 rounded-xl" />
            <Skeleton className="h-14 w-8 rounded" />
            <Skeleton className="h-14 w-20 rounded-xl" />
          </div>
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        {/* Family picks skeleton */}
        <CardListSkeleton count={4} lines={2} />
      </div>
    </AppShell>
  )
}
