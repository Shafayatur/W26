import AppShell from '@/components/layout/AppShell'
import { Skeleton, HeaderSkeleton } from '@/components/ui/PageSkeleton'

export default function Loading() {
  return (
    <AppShell>
      <div className="pt-6 space-y-5">
        <HeaderSkeleton />
        {/* Tab row skeleton */}
        <div className="flex gap-2 animate-pulse">
          <Skeleton className="h-9 flex-1 rounded-lg" />
          <Skeleton className="h-9 flex-1 rounded-lg" />
          <Skeleton className="h-9 flex-1 rounded-lg" />
        </div>
        {/* Prediction cards */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card p-4 space-y-3 animate-pulse">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="flex items-center justify-around gap-2">
              <div className="text-center space-y-1.5">
                <Skeleton className="h-8 w-8 rounded-full mx-auto" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-8 w-16 rounded-lg" />
              <div className="text-center space-y-1.5">
                <Skeleton className="h-8 w-8 rounded-full mx-auto" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  )
}
