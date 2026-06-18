export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'IN_PLAY' | 'PAUSED'
export type MatchWinner = 'HOME' | 'AWAY' | 'DRAW' | null

export interface Match {
  id: string
  home_team: string
  away_team: string
  home_team_code: string
  away_team_code: string
  home_score: number | null
  away_score: number | null
  status: MatchStatus
  stage: string
  group_name: string | null
  matchday: number | null
  kickoff_utc: string
  venue: string | null
  winner: MatchWinner
  updated_at: string
}

export interface Profile {
  id: string
  name: string
  avatar_emoji: string
  total_points: number
  streak: number
  best_streak: number
  created_at: string
}

export interface Prediction {
  id: string
  user_id: string
  match_id: string
  predicted_home: number
  predicted_away: number
  is_banker: boolean
  points_earned: number | null
  scored_at: string | null
  created_at: string
  profiles?: Profile
  matches?: Match
}

export interface Reaction {
  id: string
  prediction_id: string
  user_id: string
  emoji: string
  created_at: string
}

export interface Comment {
  id: string
  prediction_id: string
  user_id: string
  text: string
  created_at: string
  profiles?: { name: string; avatar_emoji: string }
}

export interface LeaderboardEntry {
  id: string
  name: string
  avatar_emoji: string
  total_points: number
  streak: number
  best_streak: number
  predictions_count: number
  correct_count: number
}

export const BADGE_DEFINITIONS = [
  { key: 'hot_streak_3', emoji: '🔥', label: 'On Fire', desc: '3 correct in a row' },
  { key: 'hot_streak_5', emoji: '🌋', label: 'Volcanic', desc: '5 correct in a row' },
  { key: 'exact_score', emoji: '🎯', label: 'Dead-Eye', desc: 'Exact scoreline prediction' },
  { key: 'banker_win', emoji: '💰', label: 'Banker', desc: 'Won a doubled banker pick' },
  { key: 'upset_caller', emoji: '😈', label: 'Upset King', desc: 'Predicted a major upset correctly' },
  { key: 'cold_streak', emoji: '🧊', label: 'Frozen', desc: '3 wrong in a row' },
] as const
