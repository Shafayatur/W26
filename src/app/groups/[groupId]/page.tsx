import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import { redirect, notFound } from 'next/navigation'
import GroupLeaderboardClient from './GroupLeaderboardClient'

export const revalidate = 60

export default async function GroupLeaderboardPage({ params }: { params: { groupId: string } }) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth')

    const [{ data: group }, { data: members }] = await Promise.all([
        supabase.from('groups').select('*').eq('id', params.groupId).single(),
        supabase
            .from('group_members')
            .select(`
                *,
                profiles(
                    id, name, avatar_emoji, streak, best_streak,
                    predictions(
                        id, points_earned,
                        matches(stage)
                    )
                )
            `)
            .eq('group_id', params.groupId),
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

    return (
        <AppShell>
            <GroupLeaderboardClient
                group={{ id: group.id, name: group.name, code: group.code }}
                entries={entries}
                currentUserId={user.id}
            />
        </AppShell>
    )
}