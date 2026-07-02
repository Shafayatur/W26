'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'

interface Bet {
    id: string
    wager: number
    status: string
    challenger_id: string
    challenged_id: string
    winner_id: string | null
    match: { home_team: string; away_team: string; kickoff_utc: string }
    challenger: { name: string; avatar_emoji: string }
    challenged: { name: string; avatar_emoji: string }
}

interface Props {
    userId: string
    bets: Bet[]
    userCoins: number
}

export default function SideBetsPanel({ userId, bets, userCoins }: Props) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const respond = (betId: string, accept: boolean, wager: number) => {
        if (accept && userCoins < wager) return
        startTransition(async () => {
            const supabase = createClient()
            if (accept) {
                await supabase.rpc('accept_side_bet', { p_bet_id: betId, p_challenged_id: userId })
            } else {
                await supabase.from('side_bets').update({ status: 'DECLINED' }).eq('id', betId)
            }
            router.refresh()
        })
    }

    const cancel = (betId: string) => {
        startTransition(async () => {
            const supabase = createClient()
            await supabase.from('side_bets').update({ status: 'CANCELLED' }).eq('id', betId)
            router.refresh()
        })
    }

    if (bets.length === 0) return null

    return (
        <div className="card p-4 space-y-3">
            <p className="text-xs font-semibold text-chalk-400 uppercase tracking-wider">🎰 Side Bets</p>

            {bets.map(bet => {
                const iAmChallenger = bet.challenger_id === userId
                const iAmChallenged = bet.challenged_id === userId
                const opponent = iAmChallenger ? bet.challenged : bet.challenger
                const matchDate = new Date(bet.match.kickoff_utc).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

                return (
                    <div key={bet.id} className={clsx('rounded-xl border p-3 space-y-2',
                        bet.status === 'PENDING' ? 'border-gold-500/30 bg-gold-500/5' :
                            bet.status === 'ACCEPTED' ? 'border-green-500/30 bg-green-500/5' :
                                'border-pitch-600/30 bg-pitch-900/40')}>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{opponent.avatar_emoji}</span>
                                <div>
                                    <p className="text-xs font-semibold text-chalk-100">
                                        {iAmChallenger ? `You challenged ${opponent.name}` : `${opponent.name} challenged you`}
                                    </p>
                                    <p className="text-xs text-chalk-500">
                                        {bet.match.home_team} vs {bet.match.away_team} · {matchDate}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-gold-400">{bet.wager} 🪙</p>
                                <p className={clsx('text-xs',
                                    bet.status === 'PENDING' ? 'text-gold-400' :
                                        bet.status === 'ACCEPTED' ? 'text-green-400' :
                                            bet.status === 'RESOLVED' ? 'text-chalk-400' : 'text-red-400')}>
                                    {bet.status === 'PENDING' ? 'Pending' :
                                        bet.status === 'ACCEPTED' ? 'Active' :
                                            bet.status === 'RESOLVED' ? (bet.winner_id === userId ? '🏆 Won' : '💸 Lost') :
                                                bet.status === 'DECLINED' ? 'Declined' : 'Cancelled'}
                                </p>
                            </div>
                        </div>

                        {/* Pending + I am challenged → accept/decline */}
                        {bet.status === 'PENDING' && iAmChallenged && (
                            <div className="flex gap-2">
                                <button onClick={() => respond(bet.id, false, bet.wager)}
                                    disabled={isPending}
                                    className="flex-1 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/10 transition-all">
                                    Decline
                                </button>
                                <button onClick={() => respond(bet.id, true, bet.wager)}
                                    disabled={isPending || userCoins < bet.wager}
                                    className="flex-1 py-1.5 rounded-lg border border-green-500/30 text-green-400 text-xs font-semibold hover:bg-green-500/10 transition-all disabled:opacity-40">
                                    {userCoins < bet.wager ? `Need ${bet.wager} 🪙` : 'Accept'}
                                </button>
                            </div>
                        )}

                        {/* Pending + I am challenger → can cancel */}
                        {bet.status === 'PENDING' && iAmChallenger && (
                            <button onClick={() => cancel(bet.id)} disabled={isPending}
                                className="w-full py-1.5 rounded-lg border border-pitch-600/30 text-chalk-500 text-xs font-semibold hover:border-red-500/30 hover:text-red-400 transition-all">
                                Cancel challenge
                            </button>
                        )}
                    </div>
                )
            })}
        </div>
    )
}