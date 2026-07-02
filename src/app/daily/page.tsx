import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import { redirect } from 'next/navigation'
import { formatBDDay } from '@/lib/time'
import TriviaCard from './TriviaCard'

export const revalidate = 60

export default async function DailyWinnersPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth')

    // Get today's date in BD timezone (UTC+6)
    const nowBD = new Date(Date.now() + 6 * 60 * 60 * 1000)
    const todayBD = nowBD.toISOString().slice(0, 10)

    const [{ data: winners }, { data: todayTrivia }] = await Promise.all([
        supabase
            .from('daily_winners')
            .select('*, profiles(name, avatar_emoji)')
            .order('winner_date', { ascending: false })
            .limit(30),

        supabase
            .from('trivia_questions')
            .select('*')
            .eq('active_date', todayBD)
            .maybeSingle(),
    ])

    // Only fetch the user's answer if a question actually exists today
    const { data: myAnswer } = todayTrivia
        ? await supabase
            .from('trivia_answers')
            .select('*')
            .eq('user_id', user.id)
            .eq('question_id', todayTrivia.id)
            .maybeSingle()
        : { data: null }

    return (
        <AppShell>
            <div className="pt-6 space-y-5">
                <div>
                    <h1 className="text-2xl font-bold text-chalk-100" style={{ fontFamily: 'var(--font-display)' }}>
                        Daily
                    </h1>
                    <p className="text-xs text-chalk-400 mt-0.5">Trivia + best predictor each match day</p>
                </div>

                {/* Trivia card */}
                {todayTrivia && (
                    <TriviaCard
                        question={todayTrivia}
                        existingAnswer={myAnswer ?? null}
                        userId={user.id}
                    />
                )}

                {/* Daily winners */}
                <div>
                    <p className="text-xs font-semibold text-chalk-400 uppercase tracking-wider mb-3">🏅 Daily Winners</p>

                    {(winners ?? []).length === 0 && (
                        <div className="text-center py-12 text-chalk-400">
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
            </div>
        </AppShell>
    )
}