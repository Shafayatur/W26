import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import { redirect, notFound } from 'next/navigation'
import GroupLeaderboardClient from './GroupLeaderboardClient'

export const revalidate = 60

export default async function GroupLeaderboardPage({ params }: { params: { groupId: string } }) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth')

    const [{ data: group }, { data: members }, { data: profile }, { data: upcomingMatches }, { data: myBets }] = await Promise.all([
        supabase.from('groups').select('*').eq('id', params.groupId).single(),
        supabase
            .from('group_members')
            .select(`
                *,
                profiles(
                    id, name, avatar_emoji, streak, best_streak, is_vip, custom_title,
                    predictions(
                        id, points_earned,
                        matches(stage)
                    )
                )
            `)
            .eq('group_id', params.groupId),
        supabase.from('profiles').select('coins').eq('id', user.id).single(),
        supabase
            .from('matches')
            .select('id, home_team, away_team, kickoff_utc')
            .eq('status', 'SCHEDULED')
            .order('kickoff_utc', { ascending: true })
            .limit(20),
        supabase
            .from('side_bets')
            .select('*, match:match_id(home_team, away_team, kickoff_utc), challenger:challenger_id(name, avatar_emoji), challenged:challenged_id(name, avatar_emoji)')
            .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)
            .in('status', ['PENDING', 'ACCEPTED', 'RESOLVED'])
            .order('created_at', { ascending: false })
            .limit(20),
    ])

    if (!group) notFound()

    const GROUP_STAGES = ['GROUP_STAGE']

    const entries = (members ?? [])
        .map(m => {
            const p = m.profiles as any
            if (!p) return null
            const preds = (p.predictions ?? []) as any[]

            const groupPreds = preds.filter((pr: any) => GROUP_STAGES.includes(pr.matches?.stage))
            const knockoutPreds = preds.filter((pr: any) => !GROUP_STAGES.includes(pr.matches?.stage) && pr.matches?.stage)

            const calcStats = (list: any[]) => {
                const scored = list.filter((pr: any) => pr.points_earned !== null)
                const correct = scored.filter((pr: any) => pr.points_earned > 0)
                const pts = scored.reduce((sum: number, pr: any) => sum + (pr.points_earned ?? 0), 0)
                return { pts, correct: correct.length, scored: scored.length }
            }

            const overall = calcStats(preds)
            const group = calcStats(groupPreds)
            const knockout = calcStats(knockoutPreds)

            return {
                id: p.id,
                name: p.name,
                avatar_emoji: p.avatar_emoji,
                streak: p.streak,
                best_streak: p.best_streak,
                is_vip: p.is_vip ?? false,
                custom_title: p.custom_title ?? null,
                overall_pts: overall.pts,
                overall_correct: overall.correct,
                overall_scored: overall.scored,
                group_pts: group.pts,
                group_correct: group.correct,
                group_scored: group.scored,
                knockout_pts: knockout.pts,
                knockout_correct: knockout.correct,
                knockout_scored: knockout.scored,
            }
        })
        .filter(Boolean) as any[]

    const bets = (myBets ?? []).map(b => ({
        id: b.id,
        wager: b.wager,
        status: b.status,
        challenger_id: b.challenger_id,
        challenged_id: b.challenged_id,
        winner_id: b.winner_id,
        match: b.match as any,
        challenger: b.challenger as any,
        challenged: b.challenged as any,
    }))

    return (
        <AppShell>
            <GroupLeaderboardClient
                group={{ id: group.id, name: group.name, code: group.code }}
                entries={entries}
                currentUserId={user.id}
                userCoins={profile?.coins ?? 0}
                upcomingMatches={(upcomingMatches ?? []) as any}
                bets={bets}
            />
        </AppShell>
    )
}