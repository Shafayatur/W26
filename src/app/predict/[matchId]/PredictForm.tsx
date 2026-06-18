'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Match, Prediction } from '@/types'
import { flagEmoji } from '@/lib/football-api'
import { calculatePoints } from '@/lib/points'
import { Minus, Plus, Lock, CheckCircle } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  match: Match
  existingPrediction: Prediction | null
  userId: string
  isLocked: boolean
}

export default function PredictForm({ match, existingPrediction, userId, isLocked }: Props) {
  const [homeScore, setHomeScore] = useState(existingPrediction?.predicted_home ?? 1)
  const [awayScore, setAwayScore] = useState(existingPrediction?.predicted_away ?? 1)
  const [isBanker, setIsBanker] = useState(existingPrediction?.is_banker ?? false)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const supabase = createClient()

  const isFinished = match.status === 'FINISHED'
  const hasExisting = !!existingPrediction
  const noChange = hasExisting &&
    existingPrediction.predicted_home === homeScore &&
    existingPrediction.predicted_away === awayScore &&
    existingPrediction.is_banker === isBanker

  const pointsBreakdown = isFinished && match.home_score !== null
    ? calculatePoints(homeScore, awayScore, match.home_score!, match.away_score!, isBanker)
    : null

  const adjust = (team: 'home' | 'away', delta: number) => {
    if (isLocked) return
    if (team === 'home') setHomeScore(v => Math.max(0, Math.min(20, v + delta)))
    else setAwayScore(v => Math.max(0, Math.min(20, v + delta)))
  }

  const save = () => {
    startTransition(async () => {
      if (hasExisting) {
        await supabase.from('predictions').update({ predicted_home: homeScore, predicted_away: awayScore, is_banker: isBanker }).eq('id', existingPrediction.id)
      } else {
        await supabase.from('predictions').insert({ user_id: userId, match_id: match.id, predicted_home: homeScore, predicted_away: awayScore, is_banker: isBanker })
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    })
  }

  if (isLocked && !hasExisting) {
    return (
      <div className="card p-5 text-center space-y-2">
        <Lock size={24} className="mx-auto text-chalk-400" />
        <p className="text-chalk-300 font-medium">Predictions locked</p>
        <p className="text-sm text-chalk-400">You did not predict this match before kickoff.</p>
      </div>
    )
  }

  return (
    <div className="card p-5 space-y-5">
      <h2 className="text-sm font-semibold text-chalk-300 uppercase tracking-wider">
        {isLocked ? 'Your prediction' : hasExisting ? 'Update prediction' : 'Make your prediction'}
      </h2>

      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 text-center space-y-2">
          <div className="text-sm font-medium text-chalk-300">{flagEmoji(match.home_team_code)} {match.home_team}</div>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => adjust('home', -1)} disabled={isLocked || homeScore === 0}
              className="w-9 h-9 rounded-full bg-pitch-700 border border-pitch-600/60 flex items-center justify-center text-chalk-300 hover:bg-pitch-600 disabled:opacity-30 transition-all active:scale-95">
              <Minus size={14} />
            </button>
            <span className="score-display text-chalk-100 w-10 text-center">{homeScore}</span>
            <button onClick={() => adjust('home', 1)} disabled={isLocked}
              className="w-9 h-9 rounded-full bg-pitch-700 border border-pitch-600/60 flex items-center justify-center text-chalk-300 hover:bg-pitch-600 disabled:opacity-30 transition-all active:scale-95">
              <Plus size={14} />
            </button>
          </div>
        </div>
        <div className="text-chalk-400 font-bold text-xl">–</div>
        <div className="flex-1 text-center space-y-2">
          <div className="text-sm font-medium text-chalk-300">{flagEmoji(match.away_team_code)} {match.away_team}</div>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => adjust('away', -1)} disabled={isLocked || awayScore === 0}
              className="w-9 h-9 rounded-full bg-pitch-700 border border-pitch-600/60 flex items-center justify-center text-chalk-300 hover:bg-pitch-600 disabled:opacity-30 transition-all active:scale-95">
              <Minus size={14} />
            </button>
            <span className="score-display text-chalk-100 w-10 text-center">{awayScore}</span>
            <button onClick={() => adjust('away', 1)} disabled={isLocked}
              className="w-9 h-9 rounded-full bg-pitch-700 border border-pitch-600/60 flex items-center justify-center text-chalk-300 hover:bg-pitch-600 disabled:opacity-30 transition-all active:scale-95">
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>

      {!isLocked && (
        <button onClick={() => setIsBanker(v => !v)}
          className={clsx('w-full py-2.5 rounded-xl border text-sm font-semibold transition-all',
            isBanker ? 'bg-gold-500/20 border-gold-500/50 text-gold-400' : 'bg-pitch-700/50 border-pitch-600/40 text-chalk-400 hover:border-chalk-400')}>
          {isBanker ? '💰 Banker — doubles your points!' : '💰 Mark as Banker (doubles points if correct)'}
        </button>
      )}
      {isLocked && isBanker && <div className="banker-tag justify-center w-full py-2">💰 Banker pick</div>}

      {pointsBreakdown && existingPrediction && (
        <div className={clsx('rounded-xl p-4 text-center space-y-1 border',
          pointsBreakdown.total > 0 ? 'bg-grass-500/10 border-grass-500/30' : 'bg-red-500/10 border-red-500/20')}>
          <div className={clsx('text-2xl font-bold', pointsBreakdown.total > 0 ? 'text-grass-400' : 'text-red-400')}>
            {pointsBreakdown.total > 0 ? `+${pointsBreakdown.total}` : '0'} pts
          </div>
          <div className="text-sm text-chalk-300">{pointsBreakdown.reason}</div>
          {pointsBreakdown.multiplier > 1 && pointsBreakdown.base > 0 && (
            <div className="text-xs text-gold-400">({pointsBreakdown.base} x {pointsBreakdown.multiplier} banker)</div>
          )}
        </div>
      )}

      {!isLocked && (
        <button onClick={save} disabled={isPending || noChange}
          className={clsx('btn-primary w-full flex items-center justify-center gap-2', saved && 'bg-grass-400')}>
          {saved ? <><CheckCircle size={16} /> Saved!</> : isPending ? 'Saving...' : hasExisting ? 'Update prediction' : 'Lock in prediction →'}
        </button>
      )}
    </div>
  )
}
