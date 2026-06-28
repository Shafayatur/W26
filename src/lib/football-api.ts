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
  return {
    id: String(m.id),
    home_team: m.homeTeam.shortName || m.homeTeam.name || m.homeTeam.tla || 'TBD',
    away_team: m.awayTeam.shortName || m.awayTeam.name || m.awayTeam.tla || 'TBD',
    home_team_code: m.homeTeam.tla || 'TBD',
    away_team_code: m.awayTeam.tla || 'TBD',
    home_score: m.score.fullTime.home,
    away_score: m.score.fullTime.away,
    et_home_score: m.score.extraTime?.home ?? null,
    et_away_score: m.score.extraTime?.away ?? null,
    penalty_winner: m.score.penalties?.home != null
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
    winner: m.score.winner as 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null,
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
