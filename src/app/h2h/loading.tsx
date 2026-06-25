import AppShell from '@/components/layout/AppShell'
import { Skeleton, HeaderSkeleton, CardListSkeleton } from '@/components/ui/PageSkeleton'

export default function Loading() {
  return (
    <AppShell>
      <div className="pt-6 space-y-5">
        <HeaderSkeleton />
        {/* Selector skeleton */}
        <div className="card p-4 space-y-3 animate-pulse">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        {/* Match list skeleton */}
        <CardListSkeleton count={6} lines={3} />
      </div>
    </AppShell>
  )
}
