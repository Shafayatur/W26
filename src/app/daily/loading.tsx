import AppShell from '@/components/layout/AppShell'
import { Skeleton, HeaderSkeleton } from '@/components/ui/PageSkeleton'

export default function Loading() {
  return (
    <AppShell>
      <div className="pt-6 space-y-5">
        <HeaderSkeleton />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4 flex items-center gap-3 animate-pulse">
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-12 rounded" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
