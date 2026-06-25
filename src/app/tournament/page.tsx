import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import { redirect } from 'next/navigation'
import TournamentClient from './TournamentClient'

export const revalidate = 60

export default async function TournamentPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth')
    

    const [{ data: myPreds }, { data: results }, { data: allPreds }] = await Promise.all([
        supabase.from('tournament_predictions').select('*').eq('user_id', user.id),
        supabase.from('tournament_results').select('*'),
        supabase.from('tournament_predictions').select('*, profiles(name, avatar_emoji)'),
    ])

    return (
        <AppShell>
            <TournamentClient
                userId={user.id}
                myPredictions={myPreds ?? []}
                results={results ?? []}
                allPredictions={allPreds ?? []}
            />
        </AppShell>
    )
}