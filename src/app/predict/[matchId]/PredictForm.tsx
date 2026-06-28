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

const isKnockout = (stage: string) => !['GROUP_STAGE'].includes(stage)

export default function PredictForm({ match, existingPrediction, userId, isLocked }: Props) {
  const [homeScore, setHomeScore] = useState(existingPrediction?.predicted_home ?? 1)
  const [awayScore, setAwayScore] = useState(existingPrediction?.predicted_away ?? 1)
  const [isBanker, setIsBanker] = useState(existingPrediction?.is_banker ?? false)
  const [goesToET, setGoesToET] = useState(existingPrediction?.pred_et_home != null)
  const [etHome, setEtHome] = useState(existingPrediction?.pred_et_home ?? 0)
  const [etAway, setEtAway] = useState(existingPrediction?.pred_et_away ?? 0)
  const [goesToPens, setGoesToPens] = useState(existingPrediction?.pred_penalty_winner != null)
  const [penWinner, setPenWinner] = useState(existingPrediction?.pred_penalty_winner ?? '')
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const supabase = createClient()

  const knockout = isKnockout(match.stage)
  const isFinished = match.status === 'FINISHED'
  const hasExisting = !!existingPrediction
  const noChange = hasExisting &&
    existingPrediction.predicted_home === homeScore &&
    existingPrediction.predicted_away === awayScore &&
    existingPrediction.is_banker === isBanker

  const pointsBreakdown = isFinished && match.home_score !== null
    ? calculatePoints(homeScore, awayScore, match.home_score!, match.away_score!, isBanker)
    : null

  const adjust = (team: 'home' | 'away' | 'etHome' | 'etAway', delta: number) => {
    if (isLocked) return
    if (team === 'home') setHomeScore(v => Math.max(0, Math.min(20, v + delta)))
    else if (team === 'away') setAwayScore(v => Math.max(0, Math.min(20, v + delta)))
    else if (team === 'etHome') setEtHome(v => Math.max(0, Math.min(20, v + delta)))
    else setEtAway(v => Math.max(0, Math.min(20, v + delta)))
  }

  const save = () => {
    startTransition(async () => {
      const payload: any = {
        predicted_home: homeScore,
        predicted_away: awayScore,
        is_banker: isBanker,
        pred_et_home: knockout && goesToET ? etHome : null,
        pred_et_away: knockout && goesToET ? etAway : null,
        pred_penalty_winner: knockout && goesToPens ? penWinner : null,
      }

      if (hasExisting) {
        await supabase.from('predictions').update(payload).eq('id', existingPrediction.id)
      } else {
        await supabase.from('predictions').insert({ user_id: userId, match_id: match.id, ...payload })
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

      {/* 90 min score */}
      <div>
        {knockout && <p className="text-xs text-chalk-400 mb-2 text-center">90 minute score</p>}
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
      </div>

      {/* Knockout extra options */}
      {knockout && !isLocked && (
        <div className="space-y-4 border-t border-pitch-600/40 pt-4">
          <p className="text-xs text-gold-400 font-semibold uppercase tracking-wider">⚡ Knockout bonuses</p>

          {/* Goes to ET? */}
          <div className="space-y-3">
            <button onClick={() => { setGoesToET(v => !v); if (goesToET) { setGoesToPens(false); setPenWinner('') } }}
              className={clsx('w-full py-2.5 rounded-xl border text-sm font-semibold transition-all',
                goesToET ? 'bg-gold-500/20 border-gold-500/50 text-gold-400' : 'bg-pitch-700/50 border-pitch-600/40 text-chalk-400 hover:border-chalk-400')}>
              {goesToET ? '⏱ Goes to Extra Time ✓' : '⏱ Predict Extra Time? (+2 pts)'}
            </button>

            {/* ET score */}
            {goesToET && (
              <div>
                <p className="text-xs text-chalk-400 mb-2 text-center">Extra time score (full 120 min)</p>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 flex items-center justify-center gap-2">
                    <button onClick={() => adjust('etHome', -1)} disabled={etHome === 0}
                      className="w-8 h-8 rounded-full bg-pitch-700 border border-pitch-600/60 flex items-center justify-center text-chalk-300 hover:bg-pitch-600 disabled:opacity-30 transition-all">
                      <Minus size={12} />
                    </button>
                    <span className="score-display text-chalk-100 w-8 text-center text-2xl">{etHome}</span>
                    <button onClick={() => adjust('etHome', 1)}
                      className="w-8 h-8 rounded-full bg-pitch-700 border border-pitch-600/60 flex items-center justify-center text-chalk-300 hover:bg-pitch-600 transition-all">
                      <Plus size={12} />
                    </button>
                  </div>
                  <span className="text-chalk-400 font-bold">–</span>
                  <div className="flex-1 flex items-center justify-center gap-2">
                    <button onClick={() => adjust('etAway', -1)} disabled={etAway === 0}
                      className="w-8 h-8 rounded-full bg-pitch-700 border border-pitch-600/60 flex items-center justify-center text-chalk-300 hover:bg-pitch-600 disabled:opacity-30 transition-all">
                      <Minus size={12} />
                    </button>
                    <span className="score-display text-chalk-100 w-8 text-center text-2xl">{etAway}</span>
                    <button onClick={() => adjust('etAway', 1)}
                      className="w-8 h-8 rounded-full bg-pitch-700 border border-pitch-600/60 flex items-center justify-center text-chalk-300 hover:bg-pitch-600 transition-all">
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-chalk-400 text-center mt-1">+3 pts if exact · +2 pts if correct winner</p>
              </div>
            )}

            {/* Goes to Penalties? */}
            {goesToET && etHome === etAway && (
              <div className="space-y-2">
                <button onClick={() => setGoesToPens(v => !v)}
                  className={clsx('w-full py-2.5 rounded-xl border text-sm font-semibold transition-all',
                    goesToPens ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-pitch-700/50 border-pitch-600/40 text-chalk-400 hover:border-chalk-400')}>
                  {goesToPens ? '🥅 Goes to Penalties ✓' : '🥅 Predict Penalties? (+3 pts)'}
                </button>

                {goesToPens && (
                  <div className="grid grid-cols-2 gap-2">
                    {[match.home_team, match.away_team].map(team => (
                      <button key={team} onClick={() => setPenWinner(team)}
                        className={clsx('py-2.5 rounded-xl border text-sm font-semibold transition-all',
                          penWinner === team
                            ? 'bg-grass-500/20 border-grass-500/40 text-grass-400'
                            : 'bg-pitch-700/50 border-pitch-600/40 text-chalk-400 hover:border-chalk-400')}>
                        {flagEmoji(penWinner === team ? match.home_team_code : match.away_team_code)} {team}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Show result after match */}
      {knockout && isFinished && (
        <div className="border-t border-pitch-600/40 pt-4 space-y-2">
          {match.et_home_score !== null && (
            <div className="text-xs text-center text-chalk-400">
              AET: {match.et_home_score} – {match.et_away_score}
            </div>
          )}
          {match.penalty_winner && (
            <div className="text-xs text-center text-gold-400">
              🥅 {match.penalty_winner} win on penalties
            </div>
          )}
        </div>
      )}

      {/* Banker toggle */}
      {!isLocked && (
        <button onClick={() => setIsBanker(v => !v)}
          className={clsx('w-full py-2.5 rounded-xl border text-sm font-semibold transition-all',
            isBanker ? 'bg-gold-500/20 border-gold-500/50 text-gold-400' : 'bg-pitch-700/50 border-pitch-600/40 text-chalk-400 hover:border-chalk-400')}>
          {isBanker ? '💰 Banker — doubles your points!' : '💰 Mark as Banker (doubles points if correct)'}
        </button>
      )}
      {isLocked && isBanker && <div className="banker-tag justify-center w-full py-2">💰 Banker pick</div>}

      {/* Points breakdown */}
      {pointsBreakdown && existingPrediction && (
        <div className={clsx('rounded-xl p-4 text-center space-y-1 border',
          pointsBreakdown.total > 0 ? 'bg-grass-500/10 border-grass-500/30' : 'bg-red-500/10 border-red-500/20')}>
          <div className={clsx('text-2xl font-bold', pointsBreakdown.total > 0 ? 'text-grass-400' : 'text-red-400')}>
            {pointsBreakdown.total > 0 ? `+${pointsBreakdown.total}` : pointsBreakdown.total} pts
          </div>
          <div className="text-sm text-chalk-300">{pointsBreakdown.reason}</div>
          {pointsBreakdown.multiplier > 1 && pointsBreakdown.base > 0 && (
            <div className="text-xs text-gold-400">({pointsBreakdown.base} x {pointsBreakdown.multiplier} banker)</div>
          )}
        </div>
      )}

      {/* Save button */}
      {!isLocked && (
        <button onClick={save} disabled={isPending || noChange}
          className={clsx('btn-primary w-full flex items-center justify-center gap-2', saved && 'bg-grass-400')}>
          {saved ? <><CheckCircle size={16} /> Saved!</> : isPending ? 'Saving...' : hasExisting ? 'Update prediction' : 'Lock in prediction →'}
        </button>
      )}
    </div>
  )
}