import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import { redirect } from 'next/navigation'
import BracketClient from './BracketClient'
import type { Match } from '@/types'

export const revalidate = 60

export default async function BracketPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')
  

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('kickoff_utc')

  return (
    <AppShell>
      <BracketClient matches={(matches ?? []) as Match[]} />
    </AppShell>
  )
}