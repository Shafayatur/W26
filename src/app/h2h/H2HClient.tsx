'use client'
import { useState, useMemo } from 'react'
import clsx from 'clsx'
import { formatBDDay } from '@/lib/time'
import { getPointsColor } from '@/lib/points'
import { Swords, Check } from 'lucide-react'

interface Member {
    id: string
    name: string
    avatar_emoji: string
    total_points: number
}

interface Prediction {
    id: string
    user_id: string
    predicted_home: number
    predicted_away: number
    pred_et_home: number | null
    pred_et_away: number | null
    pred_penalty_winner: string | null
    points_earned: number
    is_banker: boolean
    is_super_banker?: boolean
    scored_at: string
    matches: {
        id: string
        home_team: string
        away_team: string
        home_score: number
        away_score: number
        et_home_score: number | null
        et_away_score: number | null
        penalty_winner: string | null
        kickoff_utc: string
        status: string
        stage: string
    }
}

interface Props {
    currentUserId: string
    members: Member[]
    predictions: Prediction[]
}

export default function H2HClient({ currentUserId, members, predictions }: Props) {
    const [selected, setSelected] = useState<string[]>([currentUserId])

    const memberMap = useMemo(() =>
        Object.fromEntries(members.map(m => [m.id, m])), [members])

    const toggle = (id: string) => {
        setSelected(prev =>
            prev.includes(id)
                ? prev.length > 1 ? prev.filter(x => x !== id) : prev // keep at least 1
                : [...prev, id]
        )
    }

    const predByUser = useMemo(() => {
        return predictions.reduce((acc, p) => {
            if (!acc[p.user_id]) acc[p.user_id] = {}
            if (p.matches?.id) acc[p.user_id][p.matches.id] = p
            return acc
        }, {} as Record<string, Record<string, Prediction>>)
    }, [predictions])

    // Matches where ALL selected users predicted
    const sharedMatchIds = useMemo(() => {
        if (selected.length === 0) return []
        const sets = selected.map(uid => new Set(Object.keys(predByUser[uid] ?? {})))
        const first = Array.from(sets[0])
        return first.filter(id => sets.every(s => s.has(id)))
    }, [selected, predByUser])

    const sharedPredictions = useMemo(() => {
        return sharedMatchIds
            .map(matchId => ({
                matchId,
                match: predByUser[selected[0]]?.[matchId]?.matches,
                preds: selected.map(uid => ({
                    uid,
                    pred: predByUser[uid]?.[matchId],
                })),
            }))
            .filter(p => p.match)
            .sort((a, b) => new Date(b.match.kickoff_utc).getTime() - new Date(a.match.kickoff_utc).getTime())
    }, [sharedMatchIds, selected, predByUser])

    // Per-user stats across shared matches
    const userStats = useMemo(() => {
        return selected.map(uid => {
            let pts = 0, wins = 0, correct = 0
            sharedPredictions.forEach(({ preds }) => {
                const mine = preds.find(p => p.uid === uid)?.pred
                const myPts = mine?.points_earned ?? 0
                pts += myPts
                if (myPts > 0) correct++
                const maxPts = Math.max(...preds.map(p => p.pred?.points_earned ?? 0))
                if (myPts === maxPts && myPts > 0) wins++
            })
            return { uid, pts, wins, correct }
        }).sort((a, b) => b.pts - a.pts)
    }, [selected, sharedPredictions])

    return (
        <div className="pt-6 space-y-5 pb-4">
            <div>
                <h1 className="text-2xl font-bold text-chalk-100 flex items-center gap-2"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    <Swords size={22} className="text-gold-400" /> Head to Head
                </h1>
                <p className="text-xs text-chalk-400 mt-0.5">Select members to compare — tap to toggle</p>
            </div>

            {/* Member multi-select */}
            <div className="flex flex-wrap gap-2">
                {members.map(m => {
                    const isSelected = selected.includes(m.id)
                    return (
                        <button
                            key={m.id}
                            onClick={() => toggle(m.id)}
                            className={clsx(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all',
                                isSelected
                                    ? 'bg-grass-500/20 border-grass-500/40 text-grass-300'
                                    : 'bg-pitch-700/60 border-pitch-600/40 text-chalk-400 hover:border-pitch-500'
                            )}
                        >
                            {isSelected && <Check size={12} />}
                            {m.avatar_emoji} {m.name}
                        </button>
                    )
                })}
            </div>

            {/* Standings among selected */}
            {sharedPredictions.length > 0 && (
                <div className="card p-4 space-y-2">
                    <h2 className="text-xs font-semibold text-chalk-400 uppercase tracking-wider">
                        Standings — {sharedPredictions.length} shared matches
                    </h2>
                    {userStats.map((s, idx) => {
                        const member = memberMap[s.uid]
                        return (
                            <div key={s.uid} className="flex items-center gap-3">
                                <span className="text-sm font-bold text-chalk-400 w-4">{idx + 1}</span>
                                <span className="text-lg">{member?.avatar_emoji}</span>
                                <div className="flex-1">
                                    <div className="text-sm font-semibold text-chalk-100">{member?.name}</div>
                                    <div className="text-xs text-chalk-400">{s.correct} correct · {s.wins} match wins</div>
                                </div>
                                <div className="text-right">
                                    <div className={clsx('text-sm font-bold', s.pts > 0 ? 'text-gold-400' : 'text-chalk-400')}>
                                        {s.pts > 0 ? `+${s.pts}` : s.pts} pts
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Match by match */}
            {sharedPredictions.length === 0 ? (
                <div className="text-center py-16 text-chalk-400">
                    <div className="text-4xl mb-3">🤝</div>
                    <p>{selected.length < 2 ? 'Select at least 2 members to compare' : 'No shared scored predictions yet'}</p>
                </div>
            ) : (
                <div className="space-y-2">
                    <h2 className="text-xs font-semibold text-chalk-400 uppercase tracking-wider">Match by match</h2>
                    {sharedPredictions.map(({ matchId, match, preds }) => {
                        const maxPts = Math.max(...preds.map(p => p.pred?.points_earned ?? 0))
                        return (
                            <div key={matchId} className="card p-3 space-y-2">
                                <div className="text-xs text-chalk-400 text-center font-medium">
                                    {match.home_team} {match.home_score} – {match.away_score} {match.away_team}
                                    <span className="ml-2 text-chalk-400">· {formatBDDay(match.kickoff_utc)}</span>
                                </div>
                                {match.et_home_score !== null && (
                                    <div className="text-xs text-chalk-500 text-center">
                                        AET: {match.et_home_score}–{match.et_away_score}
                                        {match.penalty_winner && <span> · 🥅 {match.penalty_winner} won on penalties</span>}
                                    </div>
                                )}

                                <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${preds.length}, 1fr)` }}>
                                    {preds.map(({ uid, pred }) => {
                                        const pts = pred?.points_earned ?? 0
                                        const isWinner = pts === maxPts && pts > 0
                                        return (
                                            <div key={uid} className={clsx(
                                                'rounded-lg p-2 text-center border',
                                                isWinner ? 'bg-grass-500/10 border-grass-500/30' :
                                                    pts < 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-pitch-700/40 border-pitch-600/30'
                                            )}>
                                                <div className="text-base">{memberMap[uid]?.avatar_emoji}</div>
                                                <div className="font-mono text-xs font-bold text-chalk-200">
                                                    {pred ? `${pred.predicted_home}–${pred.predicted_away}` : '—'}
                                                    {pred?.is_super_banker && ' ⚡'}
                                                    {pred?.is_banker && !pred?.is_super_banker && ' 💰'}
                                                </div>
                                                {pred?.pred_et_home != null && (
                                                    <div className="font-mono text-[10px] text-chalk-500">
                                                        ET: {pred.pred_et_home}–{pred.pred_et_away}
                                                    </div>
                                                )}
                                                {pred?.pred_penalty_winner && (
                                                    <div className="text-[10px] text-chalk-500">
                                                        🥅 {pred.pred_penalty_winner}
                                                    </div>
                                                )}
                                                <div className={clsx('text-xs font-bold', getPointsColor(pts))}>
                                                    {pts > 0 ? `+${pts}` : pts} pts
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}