import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import { redirect } from 'next/navigation'
import H2HClient from './H2HClient'

export const revalidate = 0

export default async function H2HPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth')


    // Step 1: get user's group ids
    const { data: myGroups } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)

    const groupIds = (myGroups ?? []).map(m => m.group_id)

    // Step 2: get all members from those groups
    const { data: memberships } = groupIds.length > 0
        ? await supabase
            .from('group_members')
            .select('user_id, profiles(id, name, avatar_emoji, total_points)')
            .in('group_id', groupIds)
        : { data: [] }

    // Deduplicate members
    const memberMap = new Map<string, any>()
    for (const m of memberships ?? []) {
        const p = m.profiles as any
        if (p && !memberMap.has(p.id)) memberMap.set(p.id, p)
    }
    const members = Array.from(memberMap.values())

    // Step 3: get all scored predictions for those members
    const memberIds = members.map(m => m.id)
    const { data: allPredictions } = memberIds.length > 0
        ? await supabase
            .from('predictions')
            .select('*, matches(id, home_team, away_team, home_score, away_score, et_home_score, et_away_score, penalty_winner, kickoff_utc, status, stage)')
            .in('user_id', memberIds)
            .not('points_earned', 'is', null)
            .order('scored_at', { ascending: false })
        : { data: [] }

    return (
        <AppShell>
            <H2HClient
                currentUserId={user.id}
                members={members}
                predictions={allPredictions ?? []}
            />
        </AppShell>
    )
}