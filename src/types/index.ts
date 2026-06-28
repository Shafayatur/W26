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
  et_home_score: number | null
  et_away_score: number | null
  penalty_winner: string | null
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
  pred_et_home: number | null
  pred_et_away: number | null
  pred_penalty_winner: string | null
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


export interface Group {
  id: string
  name: string
  code: string
  created_by: string
  created_at: string
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  joined_at: string
  profiles?: Profile
}
export interface DailyWinner {
  id: string
  winner_date: string
  user_id: string
  day_points: number
  created_at: string
  profiles?: Profile
}

export type TournamentCategory =
  | 'CHAMPION' | 'RUNNER_UP'
  | 'SEMIFINALIST_1' | 'SEMIFINALIST_2' | 'SEMIFINALIST_3' | 'SEMIFINALIST_4'
  | 'GOLDEN_BOOT' | 'GOLDEN_GLOVE'

export interface TournamentPrediction {
  id: string
  user_id: string
  category: TournamentCategory
  pick_value: string
  locked_days_remaining: number | null
  points_earned: number | null
  is_correct: boolean | null
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface TournamentResult {
  category: TournamentCategory
  actual_value: string | null
  resolved_at: string | null
  event_date: string
}

export const TOURNAMENT_CATEGORY_LABELS: Record<TournamentCategory, string> = {
  CHAMPION: '🏆 Champion',
  RUNNER_UP: '🥈 Runner-up',
  SEMIFINALIST_1: '🏟️ Semifinalist',
  SEMIFINALIST_2: '🏟️ Semifinalist',
  SEMIFINALIST_3: '🏟️ Semifinalist',
  SEMIFINALIST_4: '🏟️ Semifinalist',
  GOLDEN_BOOT: '⚽ Golden Boot',
  GOLDEN_GLOVE: '🧤 Golden Glove',
}