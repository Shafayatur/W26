import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import { redirect } from 'next/navigation'
import { formatInTimeZone } from 'date-fns-tz'
import { startOfWeek, endOfWeek, subWeeks } from 'date-fns'
import { BD_TIMEZONE } from '@/lib/time'
import clsx from 'clsx'

export const revalidate = 3600

export default async function RecapPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth')
    

    // Get last 4 weeks of data
    const now = new Date()
    const weeks = [0, 1, 2, 3].map(i => ({
        start: startOfWeek(subWeeks(now, i), { weekStartsOn: 1 }),
        end: endOfWeek(subWeeks(now, i), { weekStartsOn: 1 }),
        label: i === 0 ? 'This Week' : i === 1 ? 'Last Week' : formatInTimeZone(startOfWeek(subWeeks(now, i), { weekStartsOn: 1 }), BD_TIMEZONE, 'd MMM'),
    }))

    const [{ data: profiles }, { data: allPreds }] = await Promise.all([
        supabase.from('profiles').select('id, name, avatar_emoji, streak'),
        supabase
            .from('predictions')
            .select('*, profiles(id, name, avatar_emoji), matches(kickoff_utc, home_team, away_team, home_score, away_score, status)')
            .not('points_earned', 'is', null),
    ])

    const buildWeekRecap = (start: Date, end: Date) => {
        const weekPreds = (allPreds ?? []).filter(p => {
            const kickoff = new Date(p.matches?.kickoff_utc ?? '')
            return kickoff >= start && kickoff <= end && p.matches?.status === 'FINISHED'
        })

        if (weekPreds.length === 0) return null

        // Points per user this week
        const userWeekPts: Record<string, { pts: number; correct: number; exact: number; name: string; avatar: string; bankerWins: number }> = {}
        for (const p of weekPreds) {
            const uid = p.user_id
            const profile = p.profiles as any
            if (!userWeekPts[uid]) {
                userWeekPts[uid] = { pts: 0, correct: 0, exact: 0, name: profile?.name ?? '', avatar: profile?.avatar_emoji ?? '⚽', bankerWins: 0 }
            }
            userWeekPts[uid].pts += p.points_earned ?? 0
            if ((p.points_earned ?? 0) > 0) userWeekPts[uid].correct++
            if ((p.points_earned ?? 0) >= 5) userWeekPts[uid].exact++
            if (p.is_banker && (p.points_earned ?? 0) > 0) userWeekPts[uid].bankerWins++
        }

        const ranked = Object.entries(userWeekPts).sort((a, b) => b[1].pts - a[1].pts)
        const winner = ranked[0]
        const loser = ranked[ranked.length - 1]

        // Most exact scores
        const mostExact = Object.entries(userWeekPts).sort((a, b) => b[1].exact - a[1].exact)[0]

        // Hot streak from profiles
        const hotStreak = (profiles ?? []).sort((a: any, b: any) => b.streak - a.streak)[0]

        // Biggest banker win
        const bankerKing = Object.entries(userWeekPts).sort((a, b) => b[1].bankerWins - a[1].bankerWins)[0]

        // Total goals predicted correctly (exact scores)
        const totalExact = weekPreds.filter(p => (p.points_earned ?? 0) >= 5).length

        return {
            ranked,
            winner,
            loser,
            mostExact,
            hotStreak,
            bankerKing,
            totalPredictions: weekPreds.length,
            totalExact,
            matchCount: new Set(weekPreds.map(p => p.match_id)).size,
        }
    }

    const recaps = weeks.map(w => ({
        ...w,
        data: buildWeekRecap(w.start, w.end),
    }))

    return (
        <AppShell>
            <div className="pt-6 space-y-6 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-chalk-100" style={{ fontFamily: 'var(--font-display)' }}>
                        Weekly Recap
                    </h1>
                    <p className="text-xs text-chalk-400 mt-0.5">How did the family do each week?</p>
                </div>

                {recaps.map(({ label, data, start, end }) => {
                    if (!data) return (
                        <div key={label} className="card p-4">
                            <h2 className="font-bold text-chalk-200 mb-2">{label}</h2>
                            <p className="text-xs text-chalk-400">No matches played yet this week.</p>
                        </div>
                    )

                    return (
                        <div key={label} className="space-y-3">
                            {/* Week header */}
                            <div className="flex items-center gap-3">
                                <h2 className="font-bold text-chalk-100">{label}</h2>
                                <div className="flex-1 h-px bg-pitch-600/40" />
                                <span className="text-xs text-chalk-400">{data.matchCount} matches</span>
                            </div>

                            {/* Winner banner */}
                            {data.winner && (
                                <div className="card p-4 bg-gold-500/5 border-gold-500/20 flex items-center gap-3">
                                    <div className="text-3xl">{data.winner[1].avatar}</div>
                                    <div className="flex-1">
                                        <div className="text-xs text-gold-400 font-semibold uppercase tracking-wider">Week Winner 🏅</div>
                                        <div className="font-bold text-chalk-100 text-lg">{data.winner[1].name}</div>
                                        <div className="text-xs text-chalk-400">
                                            {data.winner[1].pts > 0 ? `+${data.winner[1].pts}` : data.winner[1].pts} pts · {data.winner[1].correct} correct
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-gold-400">{data.winner[1].pts > 0 ? `+${data.winner[1].pts}` : data.winner[1].pts}</div>
                                </div>
                            )}

                            {/* Stats row */}
                            <div className="grid grid-cols-2 gap-2">
                                {data.mostExact && data.mostExact[1].exact > 0 && (
                                    <div className="card p-3">
                                        <div className="text-lg">{data.mostExact[1].avatar}</div>
                                        <div className="text-xs text-chalk-400 mt-1">🎯 Sharpshooter</div>
                                        <div className="font-semibold text-chalk-100 text-sm">{data.mostExact[1].name}</div>
                                        <div className="text-xs text-grass-400">{data.mostExact[1].exact} exact scores</div>
                                    </div>
                                )}

                                {data.hotStreak && data.hotStreak.streak > 1 && (
                                    <div className="card p-3">
                                        <div className="text-lg">{(profiles ?? []).find((p: any) => p.id === data.hotStreak?.id)?.avatar_emoji ?? '⚽'}</div>
                                        <div className="text-xs text-chalk-400 mt-1">🔥 On Fire</div>
                                        <div className="font-semibold text-chalk-100 text-sm">{data.hotStreak.name}</div>
                                        <div className="text-xs text-red-400">{data.hotStreak.streak} streak</div>
                                    </div>
                                )}

                                {data.bankerKing && data.bankerKing[1].bankerWins > 0 && (
                                    <div className="card p-3">
                                        <div className="text-lg">{data.bankerKing[1].avatar}</div>
                                        <div className="text-xs text-chalk-400 mt-1">💰 Banker King</div>
                                        <div className="font-semibold text-chalk-100 text-sm">{data.bankerKing[1].name}</div>
                                        <div className="text-xs text-gold-400">{data.bankerKing[1].bankerWins} banker wins</div>
                                    </div>
                                )}

                                {data.loser && data.ranked.length > 1 && (
                                    <div className="card p-3">
                                        <div className="text-lg">{data.loser[1].avatar}</div>
                                        <div className="text-xs text-chalk-400 mt-1">🧊 Cold Week</div>
                                        <div className="font-semibold text-chalk-100 text-sm">{data.loser[1].name}</div>
                                        <div className="text-xs text-blue-400">{data.loser[1].pts} pts this week</div>
                                    </div>
                                )}
                            </div>

                            {/* Full rankings */}
                            <div className="card overflow-hidden">
                                <div className="px-3 py-2 bg-pitch-700/40 text-xs font-semibold text-chalk-400 uppercase tracking-wider">
                                    Week Rankings
                                </div>
                                {data.ranked.map(([uid, stats], idx) => (
                                    <div key={uid} className={clsx(
                                        'flex items-center gap-3 px-3 py-2.5 border-t border-pitch-600/20',
                                        uid === user.id && 'bg-grass-500/5'
                                    )}>
                                        <span className={clsx('text-sm font-bold w-5 text-center',
                                            idx === 0 ? 'text-gold-400' : idx === 1 ? 'text-chalk-300' : idx === 2 ? 'text-amber-600' : 'text-chalk-400')}>
                                            {idx + 1}
                                        </span>
                                        <span className="text-lg">{stats.avatar}</span>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-chalk-100">
                                                {stats.name} {uid === user.id && <span className="text-xs text-grass-400">(you)</span>}
                                            </div>
                                            <div className="text-xs text-chalk-400">{stats.correct} correct · {stats.exact} exact</div>
                                        </div>
                                        <div className={clsx('text-sm font-bold',
                                            stats.pts > 0 ? 'text-gold-400' : stats.pts < 0 ? 'text-red-400' : 'text-chalk-400')}>
                                            {stats.pts > 0 ? `+${stats.pts}` : stats.pts} pts
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Fun fact */}
                            <div className="text-xs text-chalk-400 text-center">
                                {data.totalExact} exact score{data.totalExact !== 1 ? 's' : ''} called across {data.totalPredictions} predictions this week
                            </div>
                        </div>
                    )
                })}
            </div>
        </AppShell>
    )
}