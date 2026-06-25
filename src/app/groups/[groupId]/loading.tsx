import AppShell from '@/components/layout/AppShell'
import { Skeleton } from '@/components/ui/PageSkeleton'

export default function Loading() {
  return (
    <AppShell>
      <div className="pt-4 space-y-5">
        {/* Back link */}
        <Skeleton className="h-4 w-24 animate-pulse" />
        {/* Group header card */}
        <div className="card p-4 space-y-2 animate-pulse">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
        {/* Podium skeleton */}
        <div className="flex items-end justify-center gap-3 py-2 animate-pulse">
          <div className="flex flex-col items-center gap-1">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-20 w-16 rounded-t-xl" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-28 w-16 rounded-t-xl" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-16 w-16 rounded-t-xl" />
          </div>
        </div>
        {/* Leaderboard rows */}
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-4 flex items-center gap-3 animate-pulse">
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
