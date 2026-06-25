'use client'

// Generic shimmer skeleton block
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-pitch-700/60 ${className}`} />
  )
}

// A skeleton card with 2 lines of text
export function CardSkeleton({ lines = 2 }: { lines?: number }) {
  return (
    <div className="card p-4 space-y-3 animate-pulse">
      <Skeleton className="h-4 w-2/3" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" />
      ))}
    </div>
  )
}

// A list of card skeletons
export function CardListSkeleton({ count = 5, lines = 2 }: { count?: number; lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} lines={lines} />
      ))}
    </div>
  )
}

// Page header skeleton (title + subtitle)
export function HeaderSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-3 w-56" />
    </div>
  )
}

// A full page skeleton with header + cards
export function PageSkeleton({ cardCount = 5, cardLines = 2 }: { cardCount?: number; cardLines?: number }) {
  return (
    <div className="pt-6 space-y-5">
      <HeaderSkeleton />
      <CardListSkeleton count={cardCount} lines={cardLines} />
    </div>
  )
}
