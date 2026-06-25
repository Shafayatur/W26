import AppShell from '@/components/layout/AppShell'
import { Skeleton, CardListSkeleton } from '@/components/ui/PageSkeleton'

export default function Loading() {
  return (
    <AppShell>
      <div className="pt-6 space-y-5">
        {/* Profile card skeleton */}
        <div className="card p-5 text-center space-y-3 animate-pulse">
          <Skeleton className="h-14 w-14 rounded-full mx-auto" />
          <Skeleton className="h-5 w-32 mx-auto" />
          <Skeleton className="h-3 w-44 mx-auto" />
          <Skeleton className="h-8 w-24 mx-auto" />
        </div>
        {/* Stats grid skeleton */}
        <div className="grid grid-cols-2 gap-3 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-4 text-center space-y-2">
              <Skeleton className="h-7 w-7 mx-auto rounded" />
              <Skeleton className="h-5 w-12 mx-auto" />
              <Skeleton className="h-3 w-20 mx-auto" />
            </div>
          ))}
        </div>
        <CardListSkeleton count={2} lines={3} />
      </div>
    </AppShell>
  )
}
