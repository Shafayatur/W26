import AppShell from '@/components/layout/AppShell'
import { PageSkeleton } from '@/components/ui/PageSkeleton'

export default function Loading() {
  return (
    <AppShell>
      <PageSkeleton cardCount={6} cardLines={3} />
    </AppShell>
  )
}
