import AppShell from '@/components/layout/AppShell'
import { PageSkeleton } from '@/components/ui/PageSkeleton'

export default function Loading() {
  return (
    <AppShell>
      <PageSkeleton cardCount={8} cardLines={2} />
    </AppShell>
  )
}
