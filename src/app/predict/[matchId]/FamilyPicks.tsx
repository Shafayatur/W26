'use client'
import type { Prediction, Reaction, Comment } from '@/types'
import Reactions from '@/components/ui/Reactions'
import CommentsComponent from '@/components/ui/Comments'
import { getPointsColor } from '@/lib/points'
import { useState } from 'react'
import clsx from 'clsx'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ExtendedPrediction extends Omit<Prediction, 'profiles'> {
  profiles?: { id: string; name: string; avatar_emoji: string }
  reactions?: Reaction[]
  comments?: Comment[]
}

interface Props {
  predictions: ExtendedPrediction[]
  currentUserId: string
  matchFinished: boolean
  actualHome: number | null
  actualAway: number | null
}

export default function FamilyPicks({ predictions, currentUserId, matchFinished, actualHome, actualAway }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold text-chalk-400 uppercase tracking-wider">
        Family predictions ({predictions.length})
      </h2>

      {predictions.map(pred => {
        const isMe = pred.user_id === currentUserId
        const isOpen = expanded === pred.id
        const profile = pred.profiles

        // Determine correctness for styling
        let resultClass = ''
        if (matchFinished && actualHome !== null && actualAway !== null) {
          if (pred.predicted_home === actualHome && pred.predicted_away === actualAway) {
            resultClass = 'border-gold-500/40 bg-gold-500/5'
          } else {
            const predWinner = pred.predicted_home > pred.predicted_away ? 'H' : pred.predicted_home < pred.predicted_away ? 'A' : 'D'
            const actualWinner = actualHome > actualAway ? 'H' : actualHome < actualAway ? 'A' : 'D'
            resultClass = predWinner === actualWinner ? 'border-grass-500/30' : 'border-pitch-600/30'
          }
        }

        return (
          <div key={pred.id} className={clsx('card p-4 transition-all', resultClass, isMe && 'border-grass-500/20')}>
            {/* Prediction header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{profile?.avatar_emoji ?? '⚽'}</span>
                <div>
                  <div className="text-sm font-semibold text-chalk-100 flex items-center gap-1.5">
                    {profile?.name ?? 'Someone'}
                    {isMe && <span className="text-xs text-grass-400">(you)</span>}
                    {pred.is_banker && <span className="banker-tag">💰</span>}
                  </div>
                  <div className="font-mono text-sm font-bold text-chalk-300 mt-0.5">
                    {pred.predicted_home} – {pred.predicted_away}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {pred.points_earned !== null && (
                  <span className={clsx('text-sm font-bold', getPointsColor(pred.points_earned))}>
                    {pred.points_earned > 0 ? `+${pred.points_earned}` : '0'} pts
                  </span>
                )}
                <button
                  onClick={() => setExpanded(isOpen ? null : pred.id)}
                  className="w-8 h-8 rounded-lg bg-pitch-700/60 flex items-center justify-center text-chalk-400 hover:text-chalk-100 transition-colors"
                >
                  {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>

            {/* Reactions (always visible) */}
            <Reactions
              predictionId={pred.id}
              reactions={pred.reactions ?? []}
              currentUserId={currentUserId}
            />

            {/* Expanded: comments */}
            {isOpen && (
              <CommentsComponent
                predictionId={pred.id}
                comments={pred.comments ?? []}
                currentUserId={currentUserId}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
