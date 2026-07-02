'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import clsx from 'clsx'

interface Match {
    id: string
    home_team: string
    away_team: string
    kickoff_utc: string
}

interface Props {
    challengerId: string
    challengedId: string
    challengedName: string
    challengedEmoji: string
    userCoins: number
    upcomingMatches: Match[]
    onClose: () => void
}

export default function SideBetModal({
    challengerId, challengedId, challengedName, challengedEmoji,
    userCoins, upcomingMatches, onClose
}: Props) {
    const [selectedMatch, setSelectedMatch] = useState<string | null>(null)
    const [wager, setWager] = useState(1)
    const [sent, setSent] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState('')
    const router = useRouter()

    const sendChallenge = () => {
        if (!selectedMatch) return setError('Pick a match first')
        if (userCoins < wager) return setError(`You only have ${userCoins} 🪙`)
        startTransition(async () => {
            const supabase = createClient()
            const { error: err } = await supabase.from('side_bets').insert({
                challenger_id: challengerId,
                challenged_id: challengedId,
                match_id: selectedMatch,
                wager,
                status: 'PENDING',
            })
            if (err) return setError(err.message)
            setSent(true)
            router.refresh()
        })
    }

    if (sent) {
        return (
            <div className="fixed inset-0 bg-pitch-950/80 backdrop-blur-sm z-[100] flex items-end justify-center p-4">
                <div className="card p-6 w-full max-w-sm text-center space-y-3 animate-in mb-[env(safe-area-inset-bottom)]">
                    <div className="text-4xl">🎰</div>
                    <p className="text-lg font-bold text-chalk-100">Challenge sent!</p>
                    <p className="text-sm text-chalk-400">
                        {challengedEmoji} {challengedName} needs to accept the bet.
                    </p>
                    <button onClick={onClose} className="btn-primary w-full">Done</button>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-pitch-950/80 backdrop-blur-sm z-[100] flex items-end justify-center p-4">
            <div className="card p-5 w-full max-w-sm space-y-5 animate-in max-h-[85vh] overflow-y-auto mb-[env(safe-area-inset-bottom)]">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-chalk-400 uppercase tracking-wider font-semibold">Side Bet</p>
                        <p className="font-bold text-chalk-100 mt-0.5">
                            vs {challengedEmoji} {challengedName}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-chalk-400 hover:text-chalk-100 p-1">
                        <X size={18} />
                    </button>
                </div>

                {/* Pick a match */}
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-chalk-400 uppercase tracking-wider">Pick a match</p>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {upcomingMatches.length === 0 && (
                            <p className="text-xs text-chalk-400 text-center py-4">No upcoming matches available.</p>
                        )}
                        {upcomingMatches.map(m => (
                            <button key={m.id} onClick={() => setSelectedMatch(m.id)}
                                className={clsx('w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-all',
                                    selectedMatch === m.id
                                        ? 'bg-gold-500/20 border-gold-500/40 text-gold-400'
                                        : 'bg-pitch-700/50 border-pitch-600/30 text-chalk-300 hover:border-chalk-400')}>
                                {m.home_team} vs {m.away_team}
                                <span className="text-xs text-chalk-500 ml-2">
                                    {new Date(m.kickoff_utc).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Wager */}
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-chalk-400 uppercase tracking-wider">
                        Wager <span className="text-gold-400 normal-case font-normal">(you have {userCoins} 🪙)</span>
                    </p>
                    <div className="flex gap-2">
                        {[1, 2, 3].map(n => (
                            <button key={n} onClick={() => setWager(n)}
                                className={clsx('flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all',
                                    wager === n
                                        ? 'bg-gold-500/20 border-gold-500/40 text-gold-400'
                                        : 'bg-pitch-700/50 border-pitch-600/30 text-chalk-400 hover:border-chalk-400')}>
                                {n} 🪙
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-chalk-500 text-center">
                        Winner gets {wager * 2} 🪙 total · Loser loses {wager} 🪙
                    </p>
                </div>

                {error && <p className="text-xs text-red-400 text-center">{error}</p>}

                <button onClick={sendChallenge} disabled={isPending || !selectedMatch}
                    className="btn-primary w-full disabled:opacity-40">
                    {isPending ? 'Sending...' : `Send challenge (${wager} 🪙 at stake)`}
                </button>
            </div>
        </div>
    )
}