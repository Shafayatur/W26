'use client'
import Link from 'next/link'
import clsx from 'clsx'
import type { Match, Prediction } from '@/types'
import { formatBDTime, formatBDDay, getCountdown, isMatchSoon } from '@/lib/time'
import { flagEmoji } from '@/lib/football-api'
import { getPointsColor } from '@/lib/points'
import { Zap } from 'lucide-react'

interface Props {
  match: Match
  prediction?: Prediction | null
  showPredictLink?: boolean
}

export default function MatchCard({ match, prediction, showPredictLink = true }: Props) {
  const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED' || match.status === 'LIVE'
  const isFinished = match.status === 'FINISHED'
  const isScheduled = match.status === 'SCHEDULED'
  const soon = isScheduled && isMatchSoon(match.kickoff_utc)

  return (
    <div className={clsx('card p-4 animate-in', isLive && 'border-red-500/30 bg-red-500/5')}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isLive && <span className="live-dot" />}
          <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full',
            isLive ? 'status-live' :
              soon ? 'status-soon' :
                isFinished ? 'status-finished' : 'status-scheduled'
          )}>
            {isLive ? '● LIVE' : soon ? `⚡ ${getCountdown(match.kickoff_utc)}` :
              isFinished ? 'Full Time' : formatBDTime(match.kickoff_utc)}
          </span>
          {match.group_name && (
            <span className="text-xs text-chalk-400">{match.group_name}</span>
          )}
        </div>
        <span className="text-xs text-chalk-400">{formatBDDay(match.kickoff_utc)}</span>
      </div>

      {/* Teams + Score */}
      <div className="flex items-center justify-between gap-2">
        {/* Home */}
        <div className="flex-1 text-right">
          <div className="text-lg font-semibold text-chalk-100 leading-tight">
            {flagEmoji(match.home_team_code)} {match.home_team}
          </div>
          <div className="text-xs text-chalk-400 mt-0.5">{match.home_team_code}</div>
        </div>

        {/* Score / VS */}
        <div className="flex items-center gap-1 min-w-[72px] justify-center">
          {(isLive || isFinished) && match.home_score !== null ? (
            <div className="score-display text-chalk-100 flex items-center gap-1">
              <span>{match.home_score}</span>
              <span className="text-chalk-400 text-2xl">–</span>
              <span>{match.away_score}</span>
            </div>
          ) : (
            <div className="text-chalk-400 text-sm font-medium">vs</div>
          )}
        </div>

        {/* Away */}
        <div className="flex-1 text-left">
          <div className="text-lg font-semibold text-chalk-100 leading-tight">
            {match.away_team} {flagEmoji(match.away_team_code)}
          </div>
          <div className="text-xs text-chalk-400 mt-0.5">{match.away_team_code}</div>
        </div>
      </div>

      {/* Prediction row */}
      {prediction && (
        <div className="mt-3 pt-3 border-t border-pitch-600/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-chalk-400">Your pick:</span>
            <span className="font-mono text-sm font-bold text-chalk-200">
              {prediction.predicted_home} – {prediction.predicted_away}
            </span>
            {prediction.is_banker && <span className="banker-tag">💰 Banker</span>}
          </div>
          {prediction.points_earned !== null && (
            <span className={clsx('text-sm font-bold', getPointsColor(prediction.points_earned))}>
              {prediction.points_earned > 0 ? `+${prediction.points_earned} pts` : `${prediction.points_earned} pts`}
            </span>
          )}
        </div>
      )}

      {/* Predict CTA */}
      {showPredictLink && isScheduled && !prediction && (
        <Link
          href={`/predict/${match.id}`}
          className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg
                     bg-grass-500/10 border border-grass-500/30 text-grass-400 text-sm
                     font-medium hover:bg-grass-500/20 transition-colors"
        >
          <Zap size={14} /> Make prediction
        </Link>
      )}
    </div>
  )
}
