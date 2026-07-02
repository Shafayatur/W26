import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import MatchCard from '@/components/ui/MatchCard'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Zap } from 'lucide-react'
import WildcardSection from './WildcardSection'

export const revalidate = 60

export default async function PredictPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [{ data: matches }, { data: predictions }, { data: profile }, { data: finishedPreds }] = await Promise.all([
    supabase.from('matches').select('*').eq('status', 'SCHEDULED').order('kickoff_utc', { ascending: true }).limit(30),
    supabase.from('predictions').select('*').eq('user_id', user.id),
    supabase.from('profiles').select('coins, wildcard_used_matchdays').eq('id', user.id).single(),
    // Find up to 3 worst predictions from finished matchdays (exclude already wildcarded)
    supabase
      .from('predictions')
      .select('id, match_id, points_earned, predicted_home, predicted_away, matches(home_team, away_team, home_score, away_score, matchday, status)')
      .eq('user_id', user.id)
      .lt('points_earned', 0)
      .not('points_earned', 'is', null),
  ])

  const predMap = Object.fromEntries((predictions ?? []).map(p => [p.match_id, p]))
  const unpredicted = (matches ?? []).filter(m => !predMap[m.id])
  const predicted = (matches ?? []).filter(m => !!predMap[m.id])

  // Find up to 3 worst predictions from a finished matchday (exclude ones already wildcarded)
  const wildcardUsed: number[] = profile?.wildcard_used_matchdays ?? []
  const worstPreds = (finishedPreds ?? [])
    .filter(p => {
      const m = p.matches as any
      return m?.status === 'FINISHED' && m?.matchday && !wildcardUsed.includes(m.matchday)
    })
    .sort((a, b) => (a.points_earned ?? 0) - (b.points_earned ?? 0))
    .slice(0, 3)

  const worstOptions = worstPreds.map(wp => ({
    id: wp.id,
    match_id: wp.match_id,
    points_earned: wp.points_earned!,
    matchday: (wp.matches as any).matchday,
    home_team: (wp.matches as any).home_team,
    away_team: (wp.matches as any).away_team,
    predicted_home: wp.predicted_home,
    predicted_away: wp.predicted_away,
    home_score: (wp.matches as any).home_score,
    away_score: (wp.matches as any).away_score,
  }))

  return (
    <AppShell>
      <div className="pt-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-chalk-100" style={{ fontFamily: 'var(--font-display)' }}>
            Predictions
          </h1>
          <span className="text-xs text-chalk-400">{predicted.length}/{(matches ?? []).length} done</span>
        </div>

        {(matches ?? []).length > 0 && (
          <div className="h-1.5 bg-pitch-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-grass-500 rounded-full transition-all"
              style={{ width: `${(predicted.length / (matches ?? []).length) * 100}%` }}
            />
          </div>
        )}

        {/* Wildcard section */}
        {worstOptions.length > 0 && (
          <WildcardSection
            userId={user.id}
            userCoins={profile?.coins ?? 0}
            worstPredictions={worstOptions}
            wildcardUsedMatchdays={wildcardUsed}
          />
        )}

        {unpredicted.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-gold-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap size={12} /> Awaiting your prediction
            </h2>
            {unpredicted.map(match => (
              <Link key={match.id} href={`/predict/${match.id}`}>
                <MatchCard match={match} prediction={null} showPredictLink={false} />
              </Link>
            ))}
          </div>
        )}

        {predicted.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-semibold text-chalk-400 uppercase tracking-wider">Your picks</h2>
              <div className="flex-1 h-px bg-pitch-600/40" />
            </div>
            {predicted.map(match => (
              <Link key={match.id} href={`/predict/${match.id}`}>
                <MatchCard match={match} prediction={predMap[match.id]} showPredictLink={false} />
              </Link>
            ))}
          </div>
        )}

        {(matches ?? []).length === 0 && (
          <div className="text-center py-16 text-chalk-400">
            <div className="text-4xl mb-3">🎉</div>
            <p className="font-medium">All upcoming matches predicted!</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}