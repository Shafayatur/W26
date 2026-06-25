import AppShell from '@/components/layout/AppShell'
import { Skeleton, HeaderSkeleton } from '@/components/ui/PageSkeleton'

export default function Loading() {
  return (
    <AppShell>
      <div className="pt-6 space-y-5">
        <HeaderSkeleton />
        {/* View toggle skeleton */}
        <div className="flex gap-2 animate-pulse">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        {/* Bracket skeleton - wide horizontal layout */}
        <div className="flex gap-3 overflow-hidden animate-pulse">
          {Array.from({ length: 5 }).map((_, col) => (
            <div key={col} className="flex flex-col gap-3 flex-shrink-0" style={{ minWidth: '120px' }}>
              <Skeleton className="h-3 w-20 mx-auto" />
              {Array.from({ length: Math.max(1, 8 >> col) }).map((_, row) => (
                <Skeleton key={row} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
