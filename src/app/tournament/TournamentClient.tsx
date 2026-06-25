'use client'
import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { TournamentPrediction, TournamentResult, TournamentCategory } from '@/types'
import { TOURNAMENT_CATEGORY_LABELS } from '@/types'
import { differenceInDays } from 'date-fns'
import clsx from 'clsx'
import { Lock, Trophy, Users } from 'lucide-react'

interface Props {
    userId: string
    myPredictions: TournamentPrediction[]
    results: TournamentResult[]
    allPredictions: (TournamentPrediction & { profiles?: { name: string; avatar_emoji: string } })[]
}

const SEMI_LOCK_DATE = new Date('2026-07-10T00:00:00Z')
const TROPHY_CATEGORIES: TournamentCategory[] = ['CHAMPION', 'RUNNER_UP', 'GOLDEN_BOOT', 'GOLDEN_GLOVE']
const SEMI_CATEGORIES: TournamentCategory[] = ['SEMIFINALIST_1', 'SEMIFINALIST_2', 'SEMIFINALIST_3', 'SEMIFINALIST_4']

export default function TournamentClient({ userId, myPredictions, results, allPredictions }: Props) {
    const [values, setValues] = useState<Record<string, string>>(
        Object.fromEntries(myPredictions.map(p => [p.category, p.pick_value]))
    )
    const [isPending, startTransition] = useTransition()
    const [saved, setSaved] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const isSemiLocked = new Date() >= SEMI_LOCK_DATE
    const resultMap = Object.fromEntries(results.map(r => [r.category, r]))
    const myPredMap = Object.fromEntries(myPredictions.map(p => [p.category, p]))

    const daysUntil = (eventDate: string) => {
        return Math.max(0, differenceInDays(new Date(eventDate), new Date()))
    }

    const save = (category: TournamentCategory) => {
        const value = values[category]?.trim()
        if (!value) return
        const isLocked = SEMI_CATEGORIES.includes(category) && isSemiLocked
        if (isLocked) return

        startTransition(async () => {
            const existing = myPredMap[category]
            if (existing) {
                await supabase
                    .from('tournament_predictions')
                    .update({ pick_value: value, updated_at: new Date().toISOString() })
                    .eq('id', existing.id)
            } else {
                await supabase
                    .from('tournament_predictions')
                    .insert({ user_id: userId, category, pick_value: value })
            }
            // Lock in days_remaining snapshot
            await supabase.rpc('lock_tournament_prediction', { p_user_id: userId, p_category: category })

            setSaved(category)
            setTimeout(() => setSaved(null), 2000)
            router.refresh()
        })
    }

    const renderCategory = (category: TournamentCategory) => {
        const result = resultMap[category]
        const myPred = myPredMap[category]
        const locked = SEMI_CATEGORIES.includes(category) && isSemiLocked
        const resolved = !!result?.actual_value
        const maxPoints = result ? daysUntil(result.event_date) : 0

        const others = allPredictions.filter(p => p.category === category && p.user_id !== userId)

        return (
            <div key={category} className="card p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-chalk-100">{TOURNAMENT_CATEGORY_LABELS[category]}</h3>
                    {!resolved && (
                        <span className="text-xs text-chalk-400">
                            Max {maxPoints} pts today
                        </span>
                    )}
                </div>

                {resolved ? (
                    <div className="space-y-2">
                        <div className="bg-pitch-900/60 rounded-lg p-3 text-center">
                            <span className="text-xs text-chalk-400">Actual winner:</span>
                            <div className="font-bold text-gold-400">{result.actual_value}</div>
                        </div>
                        {myPred && (
                            <div className={clsx('text-sm text-center font-medium',
                                myPred.is_correct ? 'text-grass-400' : 'text-red-400')}>
                                Your pick: {myPred.pick_value} {myPred.is_correct ? `✓ +${myPred.points_earned} pts` : '✗ 0 pts'}
                            </div>
                        )}
                    </div>
                ) : locked && !myPred ? (
                    <div className="flex items-center gap-2 text-chalk-400 text-sm">
                        <Lock size={14} /> Locked — predictions closed
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <input
                            value={values[category] ?? ''}
                            onChange={e => setValues(v => ({ ...v, [category]: e.target.value }))}
                            disabled={locked}
                            placeholder={category.includes('GOLDEN') ? 'Player name' : 'Team name'}
                            className="flex-1 bg-pitch-900/60 border border-pitch-600/40 rounded-xl px-3 py-2.5
                         text-sm text-chalk-100 placeholder:text-chalk-400 focus:outline-none
                         focus:border-grass-500/50 transition-colors disabled:opacity-50"
                        />
                        <button
                            onClick={() => save(category)}
                            disabled={isPending || locked || !values[category]?.trim()}
                            className={clsx('btn-primary px-4 text-sm', saved === category && 'bg-grass-400')}
                        >
                            {saved === category ? '✓' : myPred ? 'Update' : 'Save'}
                        </button>
                    </div>
                )}

                {myPred && !resolved && (
                    <p className="text-xs text-chalk-400">
                        Your pick: <span className="text-chalk-200 font-medium">{myPred.pick_value}</span>
                        {locked && myPred.locked_days_remaining !== null && (
                            <> · Locked at {myPred.locked_days_remaining} pts</>
                        )}
                    </p>
                )}

                {others.length > 0 && (
                    <div className="pt-2 border-t border-pitch-600/30">
                        <div className="flex items-center gap-1.5 text-xs text-chalk-400 mb-1.5">
                            <Users size={11} /> Family picks
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {others.map(o => (
                                <span key={o.id} className="text-xs bg-pitch-700/60 px-2 py-1 rounded-full text-chalk-300">
                                    {o.profiles?.avatar_emoji} {o.profiles?.name}: {o.pick_value}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="pt-6 space-y-6 pb-4">
            <div>
                <h1 className="text-2xl font-bold text-chalk-100 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                    <Trophy size={22} className="text-gold-400" /> Tournament Picks
                </h1>
                <p className="text-xs text-chalk-400 mt-0.5">
                    Earlier picks = more points. Change anytime before lock!
                </p>
            </div>

            <div className="card p-3 bg-gold-500/5 border-gold-500/20">
                <p className="text-xs text-chalk-300">
                    💡 Points = days remaining until result, calculated when you last save your pick.
                    Semifinalists lock <strong className="text-gold-400">July 10</strong>.
                </p>
            </div>

            <div className="space-y-3">
                <h2 className="text-xs font-semibold text-chalk-400 uppercase tracking-wider">🏟️ Semifinalists (pick 4 teams)</h2>
                {SEMI_CATEGORIES.map(renderCategory)}
            </div>

            <div className="space-y-3">
                <h2 className="text-xs font-semibold text-chalk-400 uppercase tracking-wider">🏆 Trophies</h2>
                {TROPHY_CATEGORIES.map(renderCategory)}
            </div>
        </div>
    )
}