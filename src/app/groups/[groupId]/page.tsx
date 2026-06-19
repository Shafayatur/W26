import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import { redirect, notFound } from 'next/navigation'
import { getStreakBadge } from '@/lib/points'
import { ArrowLeft, Copy } from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'

export const revalidate = 60

export default async function GroupLeaderboardPage({ params }: { params: { groupId: string } }) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth')

    const { data: group } = await supabase
        .from('groups')
        .select('*')
        .eq('id', params.groupId)
        .single()

    if (!group) notFound()

    const { data: members } = await supabase
        .from('group_members')
        .select('*, profiles(id, name, avatar_emoji, total_points, streak, best_streak, predictions(id, points_earned))')
        .eq('group_id', params.groupId)

    const entries = (members ?? [])
        .map(m => {
            const p = m.profiles as any
            if (!p) return null
            const preds = (p.predictions ?? []) as any[]
            const scored = preds.filter((pr: any) => pr.points_earned !== null)
            const correct = scored.filter((pr: any) => pr.points_earned > 0)
            return {
                id: p.id,
                name: p.name,
                avatar_emoji: p.avatar_emoji,
                total_points: p.total_points,
                streak: p.streak,
                best_streak: p.best_streak,
                scored_count: scored.length,
                correct_count: correct.length,
                accuracy: scored.length > 0 ? Math.round((correct.length / scored.length) * 100) : 0,
            }
        })
        .filter(Boolean)
        .sort((a, b) => (b!.total_points - a!.total_points)) as any[]

    const RANK_MEDALS = ['🥇', '🥈', '🥉']

    return (
        <AppShell>
            <div className="pt-4 space-y-5">
                <Link href="/groups" className="flex items-center gap-1.5 text-chalk-400 hover:text-chalk-100 transition-colors text-sm">
                    <ArrowLeft size={16} /> My Groups
                </Link>

                <div className="card p-4 space-y-1">
                    <h1 className="text-xl font-bold text-chalk-100">{group.name}</h1>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-chalk-400">Invite code:</span>
                        <span className="font-mono font-bold text-gold-400 tracking-widest">{group.code}</span>
                    </div>
                    <p className="text-xs text-chalk-400">{entries.length} member{entries.length !== 1 ? 's' : ''}</p>
                </div>

                {/* Podium */}
                {entries.length >= 1 && (
                    <div className="flex items-end justify-center gap-3 py-2">
                        {[entries[1], entries[0], entries[2]].filter(Boolean).map((entry, i) => {
                            const heights = ['h-20', 'h-28', 'h-16']
                            const realRank = i === 0 ? 1 : i === 1 ? 0 : 2
                            return (
                                <div key={entry.id} className="flex flex-col items-center gap-1">
                                    <span className="text-xl">{entry.avatar_emoji}</span>
                                    <span className="text-xs font-semibold text-chalk-200 text-center max-w-[60px] truncate">{entry.name}</span>
                                    <span className="text-xs font-bold text-gold-400">{entry.total_points} pts</span>
                                    <div className={clsx('w-16 rounded-t-xl flex items-center justify-center text-lg font-bold', heights[i],
                                        i === 1 ? 'bg-gold-500/20 border border-gold-500/40' :
                                            i === 0 ? 'bg-chalk-300/10 border border-chalk-300/20' : 'bg-amber-700/20 border border-amber-700/30')}>
                                        {RANK_MEDALS[realRank]}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Full table */}
                <div className="space-y-2">
                    {entries.map((entry, idx) => {
                        const streakBadge = getStreakBadge(entry.streak)
                        const isMe = entry.id === user.id
                        return (
                            <div key={entry.id} className={clsx('card p-4 flex items-center gap-3', isMe && 'border-grass-500/30 bg-grass-500/5')}>
                                <div className={clsx('text-lg font-bold w-7 text-center flex-shrink-0',
                                    idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : 'text-chalk-400')}>
                                    {idx < 3 ? RANK_MEDALS[idx] : `${idx + 1}`}
                                </div>
                                <span className="text-xl">{entry.avatar_emoji}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-chalk-100 flex items-center gap-1.5 flex-wrap">
                                        {entry.name}
                                        {isMe && <span className="text-xs text-grass-400">(you)</span>}
                                        {streakBadge && (
                                            <span className="text-xs bg-red-500/20 border border-red-500/30 text-red-300 px-1.5 py-0.5 rounded-full">
                                                {streakBadge.emoji} {streakBadge.label}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-chalk-400 mt-0.5">
                                        {entry.correct_count}/{entry.scored_count} correct · {entry.accuracy}% accuracy
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <div className="text-lg font-bold text-gold-400">{entry.total_points}</div>
                                    <div className="text-xs text-chalk-400">pts</div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Points guide */}
                <div className="card p-4 space-y-2">
                    <h3 className="text-xs font-semibold text-chalk-400 uppercase tracking-wider">Points guide</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        {[['🎯 Exact score', '5 pts'], ['✓ Correct result', '3 pts'], ['~ Right goal diff', '+1 bonus'], ['💰 Banker correct', '×2 pts'], ['✗ Wrong prediction', '-1 pts'], ['💀 Wrong banker', '-5 pts']].map(([label, pts]) => (
                            <div key={label} className="flex items-center justify-between bg-pitch-900/40 rounded-lg px-3 py-2">
                                <span className="text-chalk-300">{label}</span>
                                <span className="font-bold text-gold-400">{pts}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppShell>
    )
}