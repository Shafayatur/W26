'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Shield } from 'lucide-react'
import clsx from 'clsx'

interface WorstPrediction {
    id: string
    match_id: string
    points_earned: number
    matchday: number
    home_team: string
    away_team: string
    predicted_home: number
    predicted_away: number
    home_score: number
    away_score: number
}

interface Props {
    userId: string
    userCoins: number
    worstPredictions: WorstPrediction[]
    wildcardUsedMatchdays: number[]
}

export default function WildcardSection({ userId, userCoins, worstPredictions, wildcardUsedMatchdays }: Props) {
    const [selectedId, setSelectedId] = useState<string | null>(worstPredictions[0]?.id ?? null)
    const [used, setUsed] = useState(false)
    const [coins, setCoins] = useState(userCoins)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    if (worstPredictions.length === 0) return null

    const selected = worstPredictions.find(p => p.id === selectedId) ?? worstPredictions[0]
    const canAfford = coins >= 10

    const useWildcard = () => {
        if (!selected || coins < 10) return
        startTransition(async () => {
            const supabase = createClient()

            const { error } = await supabase.rpc('use_wildcard', {
                p_user_id: userId,
                p_prediction_id: selected.id,
                p_matchday: selected.matchday,
                p_points_to_recover: Math.abs(selected.points_earned),
            })

            if (error) return
            setCoins(c => c - 10)
            setUsed(true)
            router.refresh()
        })
    }

    if (used) {
        return (
            <div className="card p-4 text-center space-y-1 border-green-500/30 bg-green-500/5">
                <div className="text-2xl">🛡️</div>
                <p className="text-sm font-semibold text-green-400">Wildcard used!</p>
                <p className="text-xs text-chalk-400">Your selected result has been nullified.</p>
            </div>
        )
    }

    return (
        <div className="card p-4 space-y-3 border-blue-500/20">
            <div className="flex items-center gap-2">
                <Shield size={15} className="text-blue-400" />
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Wildcard available</p>
                <span className="ml-auto text-xs text-chalk-400">🪙 {coins} coins</span>
            </div>

            <p className="text-xs text-chalk-300">
                Spend <span className="text-blue-400 font-semibold">10 coins</span> to nullify one of your worst results below.
            </p>

            {/* Pick from up to 3 worst predictions */}
            <div className="space-y-2">
                {worstPredictions.map(wp => {
                    const isSelected = selected?.id === wp.id
                    return (
                        <button
                            key={wp.id}
                            onClick={() => setSelectedId(wp.id)}
                            className={clsx(
                                'w-full text-left rounded-xl px-4 py-3 flex items-center justify-between border transition-all',
                                isSelected
                                    ? 'bg-red-500/15 border-red-500/40'
                                    : 'bg-pitch-700/40 border-pitch-600/30 hover:border-chalk-400'
                            )}
                        >
                            <div>
                                <p className="text-xs text-chalk-400">
                                    {wp.home_team} vs {wp.away_team}
                                    <span className="text-chalk-500"> · Matchday {wp.matchday}</span>
                                </p>
                                <p className="text-xs text-chalk-500 mt-0.5">
                                    Your pick: {wp.predicted_home}–{wp.predicted_away} ·
                                    Actual: {wp.home_score}–{wp.away_score}
                                </p>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                                <p className={clsx('text-base font-bold', isSelected ? 'text-red-400' : 'text-chalk-300')}>
                                    {wp.points_earned} pts
                                </p>
                                {isSelected && <p className="text-xs text-chalk-500">→ 0 pts</p>}
                            </div>
                        </button>
                    )
                })}
            </div>

            {canAfford ? (
                <button
                    onClick={useWildcard}
                    disabled={isPending || !selected}
                    className="w-full py-2.5 rounded-xl border border-blue-500/40 bg-blue-500/10 text-blue-400 text-sm font-semibold transition-all hover:bg-blue-500/20 disabled:opacity-50">
                    {isPending ? 'Applying...' : '🛡️ Use Wildcard on selected result (10 🪙)'}
                </button>
            ) : (
                <p className="text-xs text-chalk-400 text-center">Need 10 🪙 to use wildcard (you have {coins}).</p>
            )}
        </div>
    )
}