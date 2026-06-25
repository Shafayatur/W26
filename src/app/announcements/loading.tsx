import AppShell from '@/components/layout/AppShell'
import { Skeleton, HeaderSkeleton } from '@/components/ui/PageSkeleton'

export default function Loading() {
  return (
    <AppShell>
      <div className="pt-6 space-y-4">
        <HeaderSkeleton />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4 space-y-3 animate-pulse">
            {/* Announcement header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
            {/* Body lines */}
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/6" />
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  )
}
