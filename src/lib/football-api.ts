// football-data.org API wrapper
// Free tier: 10 req/min, enough for our family app
// WC 2026 competition code: WC (FIFA World Cup)

const BASE_URL = 'https://api.football-data.org/v4'
const API_KEY = process.env.FOOTBALL_DATA_API_KEY!
const WC_ID = 2000 // FIFA World Cup competition ID

interface APIMatch {
  id: number
  utcDate: string
  status: string
  stage: string
  group: string | null
  matchday: number | null
  homeTeam: { shortName: string; tla: string; name: string }
  awayTeam: { shortName: string; tla: string; name: string }
  score: {
    fullTime: { home: number | null; away: number | null }
    regularTime?: { home: number | null; away: number | null }
    halfTime?: { home: number | null; away: number | null }
    extraTime?: { home: number | null; away: number | null }
    penalties?: { home: number | null; away: number | null }
    winner: string | null
  }
  venue: string | null
}

async function apiGet(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'X-Auth-Token': API_KEY },
    next: { revalidate: 60 }, // cache 60s
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json()
}

export async function fetchAllMatches(): Promise<APIMatch[]> {
  const data = await apiGet(`/competitions/${WC_ID}/matches`)
  return data.matches
}

export async function fetchLiveMatches(): Promise<APIMatch[]> {
  const data = await apiGet(`/competitions/${WC_ID}/matches?status=IN_PLAY,PAUSED`)
  return data.matches
}

export async function fetchMatchById(matchId: string): Promise<APIMatch> {
  const data = await apiGet(`/matches/${matchId}`)
  return data
}

export function normalizeMatch(m: APIMatch) {
  // VERIFIED against real football-data.org response (match 537415):
  // fullTime folds regularTime + penalties together for shootout matches
  // (e.g. regularTime 1-1, penalties 3-4 → fullTime incorrectly shows 4-5).
  // regularTime is the genuine 90-minute score — always use this when present.
  const home90 = m.score.regularTime?.home ?? m.score.fullTime.home
  const away90 = m.score.regularTime?.away ?? m.score.fullTime.away

  // extraTime is confirmed to be goals scored DURING extra time only
  // (e.g. 0-0 means no ET goals, not "ET ended 0-0"). Cumulative AET score
  // = regularTime + extraTime. This correctly produces "1-1 AET" when
  // 90 min was 1-1 and no one scored in extra time.
  let etHome: number | null = null
  let etAway: number | null = null
  if (m.score.extraTime?.home != null && m.score.extraTime?.away != null) {
    etHome = (home90 ?? 0) + m.score.extraTime.home
    etAway = (away90 ?? 0) + m.score.extraTime.away
  }

  // VERIFIED bug: score.winner from the API reflects the OVERALL match
  // outcome (including penalties for shootout matches) — same root issue
  // as fullTime. For match 537418 (Netherlands vs Morocco), regularTime
  // was 1-1 but score.winner said "AWAY_TEAM" (Morocco's penalty win).
  // We must derive winner from the 90-minute score ourselves so it always
  // reflects the regular-time result, consistent with home_score/away_score.
  let derivedWinner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null = null
  if (home90 != null && away90 != null) {
    derivedWinner = home90 > away90 ? 'HOME_TEAM' : home90 < away90 ? 'AWAY_TEAM' : 'DRAW'
  }

  return {
    id: String(m.id),
    home_team: m.homeTeam.shortName || m.homeTeam.name || m.homeTeam.tla || 'TBD',
    away_team: m.awayTeam.shortName || m.awayTeam.name || m.awayTeam.tla || 'TBD',
    home_team_code: m.homeTeam.tla || 'TBD',
    away_team_code: m.awayTeam.tla || 'TBD',
    home_score: home90,
    away_score: away90,
    et_home_score: etHome,
    et_away_score: etAway,
    penalty_winner: m.score.penalties?.home != null && m.score.penalties?.away != null
      ? (m.score.penalties.home > m.score.penalties.away
        ? m.homeTeam.shortName || m.homeTeam.name
        : m.awayTeam.shortName || m.awayTeam.name)
      : null,
    status: (m.status === 'TIMED' ? 'SCHEDULED' : m.status) as any,
    stage: m.stage,
    group_name: m.group,
    matchday: m.matchday,
    kickoff_utc: m.utcDate,
    venue: m.venue,
    winner: derivedWinner,
    updated_at: new Date().toISOString(),
  }
}

// Flag emoji from country code
export function flagEmoji(tla: string): string {
  const flags: Record<string, string> = {
    BRA: '🇧🇷', FRA: '🇫🇷', ARG: '🇦🇷', ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', GER: '🇩🇪',
    ESP: '🇪🇸', POR: '🇵🇹', NED: '🇳🇱', BEL: '🇧🇪', ITA: '🇮🇹',
    URU: '🇺🇾', COL: '🇨🇴', MEX: '🇲🇽', USA: '🇺🇸', CAN: '🇨🇦',
    MAR: '🇲🇦', SEN: '🇸🇳', NGR: '🇳🇬', CMR: '🇨🇲', GHA: '🇬🇭',
    JPN: '🇯🇵', KOR: '🇰🇷', AUS: '🇦🇺', IRN: '🇮🇷', SAU: '🇸🇦',
    CRO: '🇭🇷', SRB: '🇷🇸', SUI: '🇨🇭', DEN: '🇩🇰', POL: '🇵🇱',
    ECU: '🇪🇨', QAT: '🇶🇦', TUN: '🇹🇳', CRC: '🇨🇷', PAN: '🇵🇦',
    HON: '🇭🇳', SLV: '🇸🇻', JAM: '🇯🇲', TRI: '🇹🇹', CUB: '🇨🇺',
    VEN: '🇻🇪', CHI: '🇨🇱', PER: '🇵🇪', PAR: '🇵🇾', BOL: '🇧🇴',
    ALG: '🇩🇿', EGY: '🇪🇬', CIV: '🇨🇮', GAB: '🇬🇦', MZB: '🇲🇿',
    NZL: '🇳🇿', IDN: '🇮🇩', THA: '🇹🇭', VIE: '🇻🇳', CHN: '🇨🇳',
    IRQ: '🇮🇶', JOR: '🇯🇴', UAE: '🇦🇪', KWT: '🇰🇼', BHR: '🇧🇭',
    AUT: '🇦🇹', SVK: '🇸🇰', SVN: '🇸🇮', HUN: '🇭🇺', ROU: '🇷🇴',
    UKR: '🇺🇦', GRE: '🇬🇷', TUR: '🇹🇷', SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', WAL: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
    NOR: '🇳🇴', SWE: '🇸🇪', FIN: '🇫🇮', ISL: '🇮🇸', IRL: '🇮🇪',
  }
  return flags[tla] ?? '🏳️'
}