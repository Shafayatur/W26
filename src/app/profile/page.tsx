import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import { redirect } from 'next/navigation'
import { getStreakBadge, getPointsColor } from '@/lib/points'
import { formatBDDate } from '@/lib/time'
import { LogOut } from 'lucide-react'
import SignOutButton from './SignOutButton'
import clsx from 'clsx'

export const revalidate = 0

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, predictions(id, points_earned, is_banker, scored_at, matches(home_team, away_team, home_score, away_score))')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/auth')

  const preds = (profile.predictions ?? []) as any[]
  const scored = preds.filter(p => p.points_earned !== null)
  const correct = scored.filter(p => p.points_earned > 0)
  const exactScore = scored.filter(p => p.points_earned >= 5)
  const bankerWins = preds.filter(p => p.is_banker && p.points_earned > 0)
  const form = scored.slice(-5)
  const streakBadge = getStreakBadge(profile.streak)

  return (
    <AppShell>
      <div className="pt-6 space-y-5">
        {/* Profile card */}
        <div className="card p-5 text-center space-y-3">
          <div className="text-5xl">{profile.avatar_emoji}</div>
          <div>
            <h1 className="text-xl font-bold text-chalk-100">{profile.name}</h1>
            <p className="text-xs text-chalk-400 mt-0.5">{user.email}</p>
          </div>
          <div className="text-3xl font-bold text-gold-400">{profile.total_points} <span className="text-base font-normal text-chalk-400">pts</span></div>
          {streakBadge && (
            <div className="inline-flex items-center gap-1.5 text-sm bg-red-500/20 border border-red-500/30 text-red-300 px-3 py-1 rounded-full">
              {streakBadge.emoji} {streakBadge.label} — {profile.streak} in a row!
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Predictions', value: preds.length, emoji: '📋' },
            { label: 'Correct', value: correct.length, emoji: '✅' },
            { label: 'Exact scores', value: exactScore.length, emoji: '🎯' },
            { label: 'Banker wins', value: bankerWins.length, emoji: '💰' },
            { label: 'Best streak', value: profile.best_streak, emoji: '🔥' },
            { label: 'Accuracy', value: scored.length ? `${Math.round(correct.length/scored.length*100)}%` : '—', emoji: '📊' },
          ].map(({ label, value, emoji }) => (
            <div key={label} className="card p-4 text-center">
              <div className="text-2xl mb-1">{emoji}</div>
              <div className="text-xl font-bold text-chalk-100">{value}</div>
              <div className="text-xs text-chalk-400">{label}</div>
            </div>
          ))}
        </div>

        {/* Form guide */}
        {form.length > 0 && (
          <div className="card p-4 space-y-2">
            <h3 className="text-xs font-semibold text-chalk-400 uppercase tracking-wider">Recent form</h3>
            <div className="flex gap-2">
              {form.map((p: any, i: number) => (
                <div key={i} className={clsx('flex-1 h-10 rounded-lg flex items-center justify-center text-sm font-bold border',
                  p.points_earned >= 5 ? 'bg-gold-500/20 border-gold-500/40 text-gold-400' :
                  p.points_earned > 0  ? 'bg-grass-500/20 border-grass-500/40 text-grass-400' :
                                          'bg-red-500/10 border-red-500/20 text-red-400')}>
                  {p.points_earned >= 5 ? '🎯' : p.points_earned > 0 ? '✓' : '✗'}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent predictions */}
        {scored.length > 0 && (
          <div className="card p-4 space-y-3">
            <h3 className="text-xs font-semibold text-chalk-400 uppercase tracking-wider">Recent predictions</h3>
            {scored.slice(-8).reverse().map((p: any) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <div className="text-chalk-300 flex-1 truncate">
                  {p.matches?.home_team} vs {p.matches?.away_team}
                </div>
                <div className={clsx('font-bold ml-2', getPointsColor(p.points_earned))}>
                  {p.points_earned > 0 ? `+${p.points_earned}` : '0'} pts
                </div>
              </div>
            ))}
          </div>
        )}

        <SignOutButton />
      </div>
    </AppShell>
  )
}
