import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import { redirect } from 'next/navigation'
import { formatBDDay } from '@/lib/time'

export const revalidate = 60

export default async function DailyWinnersPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth')

    const { data: winners } = await supabase
        .from('daily_winners')
        .select('*, profiles(name, avatar_emoji)')
        .order('winner_date', { ascending: false })
        .limit(30)

    return (
        <AppShell>
            <div className="pt-6 space-y-5">
                <div>
                    <h1 className="text-2xl font-bold text-chalk-100" style={{ fontFamily: 'var(--font-display)' }}>
                        Daily Winners
                    </h1>
                    <p className="text-xs text-chalk-400 mt-0.5">Best predictor of each match day</p>
                </div>

                {(winners ?? []).length === 0 && (
                    <div className="text-center py-16 text-chalk-400">
                        <div className="text-4xl mb-3">🏅</div>
                        <p>No daily winners yet. Check back after today's matches finish!</p>
                    </div>
                )}

                <div className="space-y-3">
                    {(winners ?? []).map(w => (
                        <div key={w.id} className="card p-4 flex items-center gap-3 animate-in">
                            <div className="text-3xl">{w.profiles?.avatar_emoji ?? '⚽'}</div>
                            <div className="flex-1">
                                <div className="font-semibold text-chalk-100 flex items-center gap-1.5">
                                    {w.profiles?.name}
                                    <span className="text-xs bg-gold-500/20 border border-gold-500/30 text-gold-400 px-2 py-0.5 rounded-full">
                                        🏅 Day winner
                                    </span>
                                </div>
                                <div className="text-xs text-chalk-400 mt-0.5">{formatBDDay(w.winner_date)}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-bold text-gold-400">{w.day_points}</div>
                                <div className="text-xs text-chalk-400">day pts</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AppShell>
    )
}