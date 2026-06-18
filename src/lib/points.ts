import type { Match, Prediction } from '@/types'

export interface PointsBreakdown {
  base: number
  multiplier: number
  total: number
  reason: string
}

export function calculatePoints(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number,
  isBanker: boolean
): PointsBreakdown {
  let base = 0
  let reason = 'No points'
  const multiplier = isBanker ? 2 : 1

  const actualWinner = actualHome > actualAway ? 'HOME' : actualHome < actualAway ? 'AWAY' : 'DRAW'
  const predWinner = predHome > predAway ? 'HOME' : predHome < predAway ? 'AWAY' : 'DRAW'

  if (predHome === actualHome && predAway === actualAway) {
    base = 5
    reason = 'Exact score! 🎯'
  } else if (predWinner === actualWinner) {
    base = 2
    reason = 'Correct result ✓'
    const predDiff = predHome - predAway
    const actualDiff = actualHome - actualAway
    if (predDiff === actualDiff) {
      base += 1
      reason = 'Correct result + goal diff ✓✓'
    }
  }

  return { base, multiplier, total: base > 0 ? base * multiplier : 0, reason }
}

export function getPointsColor(points: number | null): string {
  if (points === null) return 'text-chalk-400'
  if (points >= 5) return 'text-gold-400'
  if (points >= 2) return 'text-grass-400'
  return 'text-red-400'
}

export function getStreakBadge(streak: number): { emoji: string; label: string } | null {
  if (streak >= 5) return { emoji: '🌋', label: 'Volcanic' }
  if (streak >= 3) return { emoji: '🔥', label: 'On Fire' }
  return null
}

export function getFormIndicators(predictions: Prediction[]): Array<{ won: boolean; points: number }> {
  return predictions
    .filter(p => p.points_earned !== null)
    .slice(-5)
    .map(p => ({ won: (p.points_earned ?? 0) > 0, points: p.points_earned ?? 0 }))
}
