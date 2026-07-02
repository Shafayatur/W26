import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import PredictForm from './PredictForm'
import FamilyPicks from './FamilyPicks'
import { redirect, notFound } from 'next/navigation'
import { formatBDFull } from '@/lib/time'
import { flagEmoji } from '@/lib/football-api'
import type { Match } from '@/types'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 30

export default async function PredictMatchPage({ params }: { params: { matchId: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')


  // Get all groups this user belongs to
  const { data: myMemberships } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)

  const myGroupIds = (myMemberships ?? []).map(m => m.group_id)

  // Get all users in those groups
  const { data: groupMembers } = await supabase
    .from('group_members')
    .select('user_id')
    .in('group_id', myGroupIds.length > 0 ? myGroupIds : ['none'])

  const visibleUserIds = Array.from(new Set((groupMembers ?? []).map(m => m.user_id)))

  const [{ data: match }, { data: myPred }, { data: allPreds }, { data: profile }] = await Promise.all([
    supabase.from('matches').select('*').eq('id', params.matchId).single(),
    supabase.from('predictions').select('*').eq('match_id', params.matchId).eq('user_id', user.id).maybeSingle(),
    supabase.from('predictions')
      .select('*, profiles(id, name, avatar_emoji), reactions(*), comments(*, profiles(name, avatar_emoji))')
      .eq('match_id', params.matchId)
      .in('user_id', visibleUserIds.length > 0 ? visibleUserIds : [user.id]),
    supabase.from('profiles').select('coins').eq('id', user.id).single(),
  ])

  if (!match) notFound()
  const m = match as Match
  const isLocked = new Date(m.kickoff_utc) <= new Date()
  const isFinished = m.status === 'FINISHED'

  return (
    <AppShell>
      <div className="pt-4 space-y-5 pb-4">
        <Link href="/predict" className="flex items-center gap-1.5 text-chalk-400 hover:text-chalk-100 transition-colors text-sm">
          <ArrowLeft size={16} /> Back to predictions
        </Link>

        <div className="card p-5 text-center space-y-3">
          <div className="text-xs font-medium text-chalk-400 uppercase tracking-wider">
            {m.stage.replace(/_/g, ' ')} {m.group_name ? `· ${m.group_name}` : ''}
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-right space-y-1">
              <div className="text-3xl">{flagEmoji(m.home_team_code)}</div>
              <div className="font-bold text-chalk-100">{m.home_team}</div>
              <div className="text-xs text-chalk-400">{m.home_team_code}</div>
            </div>
            <div className="text-center">
              {isFinished && m.home_score !== null ? (
                <div className="score-display text-chalk-100">{m.home_score} – {m.away_score}</div>
              ) : (
                <div className="space-y-1">
                  <div className="text-chalk-400 text-xl font-light">vs</div>
                  <div className="text-xs text-gold-400 font-medium">{formatBDFull(m.kickoff_utc)}</div>
                </div>
              )}
            </div>
            <div className="flex-1 text-left space-y-1">
              <div className="text-3xl">{flagEmoji(m.away_team_code)}</div>
              <div className="font-bold text-chalk-100">{m.away_team}</div>
              <div className="text-xs text-chalk-400">{m.away_team_code}</div>
            </div>
          </div>
          {isLocked && !isFinished && (
            <div className="status-live text-xs px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
              <span className="live-dot" /> Match in progress — predictions locked
            </div>
          )}
        </div>

        <PredictForm match={m} existingPrediction={myPred} userId={user.id} isLocked={isLocked} userCoins={profile?.coins ?? 0} />
        {(allPreds ?? []).length > 0 && (
          <FamilyPicks predictions={allPreds ?? []} currentUserId={user.id} matchFinished={isFinished} actualHome={m.home_score} actualAway={m.away_score} />
        )}
      </div>
    </AppShell>
  )
}