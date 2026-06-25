import AppShell from '@/components/layout/AppShell'
import { Skeleton, HeaderSkeleton, CardSkeleton } from '@/components/ui/PageSkeleton'

export default function Loading() {
  return (
    <AppShell>
      <div className="pt-6 space-y-6">
        <HeaderSkeleton />
        {/* Two week recap skeletons */}
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-3 animate-pulse">
            {/* Week header */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-24" />
              <div className="flex-1 h-px bg-pitch-700" />
              <Skeleton className="h-3 w-16" />
            </div>
            {/* Winner banner */}
            <div className="card p-4 flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-8 w-12 rounded" />
            </div>
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <CardSkeleton key={j} lines={3} />
              ))}
            </div>
            {/* Rankings */}
            <CardSkeleton lines={4} />
          </div>
        ))}
      </div>
    </AppShell>
  )
}
