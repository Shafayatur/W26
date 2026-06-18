import { createClient } from '@/lib/supabase/server'
import FixturesClient from './FixturesClient'
import { redirect } from 'next/navigation'

export const revalidate = 60

export default async function FixturesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [{ data: matches }, { data: predictions }] = await Promise.all([
    supabase.from('matches').select('*').order('kickoff_utc', { ascending: true }),
    supabase.from('predictions').select('*').eq('user_id', user.id),
  ])

  return (
    <FixturesClient
      matches={matches ?? []}
      predictions={predictions ?? []}
      userId={user.id}
    />
  )
}
