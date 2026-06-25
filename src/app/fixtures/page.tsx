import { createClient } from '@/lib/supabase/server'
import FixturesClient from './FixturesClient'
import { redirect } from 'next/navigation'

export const revalidate = 60

export default async function FixturesPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const [
    { data: matches },
    { data: predictions },
    { data: pinned }
  ] = await Promise.all([
    supabase
      .from('matches')
      .select('*')
      .order('kickoff_utc', { ascending: true }),

    supabase
      .from('predictions')
      .select('*')
      .eq('user_id', user.id),

    supabase
      .from('announcements')
      .select('*')
      .eq('is_pinned', true)
      .order('created_at', { ascending: false })
      .limit(1),
  ])

  return (
    <FixturesClient
      matches={matches ?? []}
      predictions={predictions ?? []}
      userId={user.id}
      pinnedAnnouncement={pinned?.[0] ?? null}
    />
  )
}