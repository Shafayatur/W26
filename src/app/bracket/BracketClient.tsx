'use client'
import { useState, useMemo } from 'react'
import type { Match } from '@/types'
import { flagEmoji } from '@/lib/football-api'
import { formatBDTime, formatBDDay } from '@/lib/time'
import { List, GitBranch, BarChart2 } from 'lucide-react'
import clsx from 'clsx'

interface Props { matches: Match[] }

const STAGE_ORDER = ['GROUP_STAGE', 'LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'THIRD_PLACE', 'FINAL']
const STAGE_LABEL: Record<string, string> = {
    GROUP_STAGE: 'Group Stage',
    LAST_32: 'Round of 32',
    LAST_16: 'Round of 16',
    QUARTER_FINALS: 'Quarter Finals',
    SEMI_FINALS: 'Semi Finals',
    THIRD_PLACE: '3rd Place',
    FINAL: 'Final 🏆',
}

const KNOCKOUT_MAP: Record<string, { label: string, lName: string, rName: string }> = {
    '537417': { label: 'M73', lName: '2A', rName: '2B' },
    '537415': { label: 'M74', lName: '1E', rName: '3 A/B/C/D/F' },
    '537423': { label: 'M75', lName: '1F', rName: '2C' },
    '537418': { label: 'M76', lName: '1C', rName: '2F' },
    '537424': { label: 'M77', lName: '1I', rName: '3 C/D/F/G/H' },
    '537416': { label: 'M78', lName: '2E', rName: '2I' },
    '537425': { label: 'M79', lName: '1A', rName: '3 C/E/F/H/I' },
    '537422': { label: 'M80', lName: '1L', rName: '3 E/H/I/J/K' },
    '537421': { label: 'M81', lName: '1D', rName: '3 B/E/F/I/J' },
    '537420': { label: 'M82', lName: '1G', rName: '3 A/E/H/I/J' },
    '537426': { label: 'M83', lName: '2K', rName: '2L' },
    '537419': { label: 'M84', lName: '1H', rName: '2J' },
    '537429': { label: 'M85', lName: '1B', rName: '3 E/F/G/I/J' },
    '537427': { label: 'M86', lName: '1J', rName: '2H' },
    '537428': { label: 'M87', lName: '1K', rName: '3 D/E/I/J/L' },
    '537430': { label: 'M88', lName: '2D', rName: '2G' },
    '537376': { label: 'M89', lName: 'W74', rName: 'W77' },
    '537375': { label: 'M90', lName: 'W73', rName: 'W75' },
    '537377': { label: 'M91', lName: 'W76', rName: 'W78' },
    '537378': { label: 'M92', lName: 'W79', rName: 'W80' },
    '537379': { label: 'M93', lName: 'W83', rName: 'W84' },
    '537380': { label: 'M94', lName: 'W81', rName: 'W82' },
    '537381': { label: 'M95', lName: 'W86', rName: 'W88' },
    '537382': { label: 'M96', lName: 'W85', rName: 'W87' },
    '537383': { label: 'M97', lName: 'W89', rName: 'W90' },
    '537384': { label: 'M98', lName: 'W93', rName: 'W94' },
    '537385': { label: 'M99', lName: 'W91', rName: 'W92' },
    '537386': { label: 'M100', lName: 'W95', rName: 'W96' },
    '537387': { label: 'M101', lName: 'W97', rName: 'W98' },
    '537388': { label: 'M102', lName: 'W99', rName: 'W100' },
    '537389': { label: 'M103', lName: 'L101', rName: 'L102' },
    '537390': { label: 'M104', lName: 'W101', rName: 'W102' }
}

const LEFT_BRACKET = {
    LAST_32: ['537415', '537424', '537417', '537423', '537426', '537419', '537421', '537420'],
    LAST_16: ['537376', '537375', '537379', '537380'],
    QUARTER_FINALS: ['537383', '537384'],
    SEMI_FINALS: ['537387']
}

const RIGHT_BRACKET = {
    SEMI_FINALS: ['537388'],
    QUARTER_FINALS: ['537385', '537386'],
    LAST_16: ['537377', '537378', '537381', '537382'],
    LAST_32: ['537418', '537416', '537425', '537422', '537427', '537430', '537429', '537428']
}

interface TeamStat {
    team: string
    code: string
    mp: number
    w: number
    d: number
    l: number
    gf: number
    ga: number
    gd: number
    pts: number
}

function computeStandings(matches: Match[]): Record<string, TeamStat[]> {
    const groups: Record<string, Record<string, TeamStat>> = {}
    const groupMatches = matches.filter(m => m.stage === 'GROUP_STAGE' && m.group_name)

    for (const m of groupMatches) {
        const g = m.group_name!
        if (!groups[g]) groups[g] = {}

        const ensureTeam = (team: string, code: string) => {
            if (!groups[g][team]) {
                groups[g][team] = { team, code, mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 }
            }
        }

        ensureTeam(m.home_team, m.home_team_code)
        ensureTeam(m.away_team, m.away_team_code)

        if (m.status === 'FINISHED' && m.home_score !== null && m.away_score !== null) {
            const h = groups[g][m.home_team]
            const a = groups[g][m.away_team]

            h.mp++; a.mp++
            h.gf += m.home_score; h.ga += m.away_score
            a.gf += m.away_score; a.ga += m.home_score

            if (m.home_score > m.away_score) {
                h.w++; h.pts += 3; a.l++
            } else if (m.home_score < m.away_score) {
                a.w++; a.pts += 3; h.l++
            } else {
                h.d++; h.pts += 1; a.d++; a.pts += 1
            }

            h.gd = h.gf - h.ga
            a.gd = a.gf - a.ga
        }
    }

    const result: Record<string, TeamStat[]> = {}
    for (const [g, teams] of Object.entries(groups)) {
        result[g] = Object.values(teams).sort((a, b) =>
            b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.localeCompare(b.team)
        )
    }
    return result
}

export default function BracketClient({ matches }: Props) {
    const [view, setView] = useState<'list' | 'bracket' | 'standings'>('list')

    const byStage = useMemo(() => {
        return STAGE_ORDER.reduce((acc, s) => {
            const ms = matches.filter(m => m.stage === s)
            if (ms.length) acc[s] = ms
            return acc
        }, {} as Record<string, Match[]>)
    }, [matches])

    const standings = useMemo(() => computeStandings(matches), [matches])

    return (
        <div className="pt-6 space-y-4 pb-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-chalk-100" style={{ fontFamily: 'var(--font-display)' }}>
                    Bracket
                </h1>
                <div className="flex gap-1 bg-pitch-800/80 p-1 rounded-xl border border-pitch-600/30">
                    <button onClick={() => setView('list')}
                        className={clsx('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                            view === 'list' ? 'bg-pitch-700 text-chalk-100' : 'text-chalk-400')}>
                        <List size={13} /> List
                    </button>
                    <button onClick={() => setView('bracket')}
                        className={clsx('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                            view === 'bracket' ? 'bg-pitch-700 text-chalk-100' : 'text-chalk-400')}>
                        <GitBranch size={13} /> Tree
                    </button>
                    <button onClick={() => setView('standings')}
                        className={clsx('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                            view === 'standings' ? 'bg-pitch-700 text-chalk-100' : 'text-chalk-400')}>
                        <BarChart2 size={13} /> Table
                    </button>
                </div>
            </div>

            {view === 'list' && <ListView byStage={byStage} />}
            {view === 'bracket' && <BracketView byStage={byStage} />}
            {view === 'standings' && <StandingsView standings={standings} />}
        </div>
    )
}

// ── List View ──────────────────────────────────────────────
function ListView({ byStage }: { byStage: Record<string, Match[]> }) {
    return (
        <div className="space-y-5">
            {STAGE_ORDER.filter(s => byStage[s]).map(stage => {
                const ms = byStage[stage]
                if (stage === 'GROUP_STAGE') {
                    const groups = ms.reduce((acc, m) => {
                        const g = m.group_name ?? 'Unknown'
                        if (!acc[g]) acc[g] = []
                        acc[g].push(m)
                        return acc
                    }, {} as Record<string, Match[]>)

                    return (
                        <div key={stage} className="space-y-3">
                            <h2 className="text-xs font-semibold text-chalk-400 uppercase tracking-wider">Group Stage</h2>
                            {Object.entries(groups).sort().map(([group, gms]) => (
                                <div key={group} className="card p-3 space-y-1">
                                    <div className="text-xs font-bold text-gold-400 px-1 mb-2">{group}</div>
                                    {gms.map(m => <MatchRow key={m.id} m={m} />)}
                                </div>
                            ))}
                        </div>
                    )
                }
                return (
                    <div key={stage} className="space-y-2">
                        <h2 className="text-xs font-semibold text-chalk-400 uppercase tracking-wider">
                            {STAGE_LABEL[stage]}
                        </h2>
                        <div className="card p-3 space-y-1">
                            {ms.map(m => <MatchRow key={m.id} m={m} />)}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function MatchRow({ m }: { m: Match }) {
    const live = ['IN_PLAY', 'PAUSED', 'LIVE'].includes(m.status)
    const done = m.status === 'FINISHED'
    return (
        <div className="flex items-center gap-2 py-2 px-1 rounded-lg hover:bg-pitch-700/40 transition-colors">
            <div className="flex-1 flex items-center justify-end gap-1.5">
                <span className="text-sm text-chalk-200 font-medium truncate max-w-[90px]">{m.home_team}</span>
                <span>{flagEmoji(m.home_team_code)}</span>
            </div>
            <div className="text-center min-w-[72px]">
                {done || live ? (
                    <span className={clsx('font-mono font-bold text-sm', live ? 'text-red-400' : 'text-chalk-100')}>
                        {m.home_score} – {m.away_score}
                    </span>
                ) : (
                    <div className="text-center">
                        <div className="text-xs text-chalk-400">{formatBDDay(m.kickoff_utc)}</div>
                        <div className="text-xs text-gold-400">{formatBDTime(m.kickoff_utc)}</div>
                    </div>
                )}
            </div>
            <div className="flex-1 flex items-center gap-1.5">
                <span>{flagEmoji(m.away_team_code)}</span>
                <span className="text-sm text-chalk-200 font-medium truncate max-w-[90px]">{m.away_team}</span>
            </div>
        </div>
    )
}

// ── Standings View ─────────────────────────────────────────
function StandingsView({ standings }: { standings: Record<string, TeamStat[]> }) {
    const groups = Object.entries(standings).sort(([a], [b]) => a.localeCompare(b))

    if (groups.length === 0) {
        return (
            <div className="text-center py-16 text-chalk-400">
                <div className="text-4xl mb-3">📊</div>
                <p className="font-medium">Standings available once group stage begins</p>
            </div>
        )
    }

    // Compute best 8 third-placed teams across all 12 groups
    const allThirdPlace = groups
        .filter(([, teams]) => teams.length >= 3)
        .map(([, teams]) => teams[2])
        .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.localeCompare(b.team))
    const best8Third = new Set(allThirdPlace.slice(0, 8).map(t => t.team))

    return (
        <div className="space-y-3">
            {groups.map(([groupName, teams]) => {
                const totalMatchesPlayed = teams.reduce((sum, t) => sum + t.mp, 0) / 2
                const groupComplete = totalMatchesPlayed >= 6
                const hasStarted = teams.some(t => t.mp > 0)

                return (
                    <div key={groupName} className="card overflow-hidden">
                        {/* Group header */}
                        <div className="bg-pitch-700/60 px-3 py-2 flex items-center justify-between">
                            <span className="text-xs font-bold text-gold-400">{groupName}</span>
                            <span className="text-[10px] text-chalk-400">
                                {groupComplete ? 'Final standings' : hasStarted ? 'In progress' : 'Not started'}
                            </span>
                        </div>

                        <div className="divide-y divide-pitch-600/30">
                            {/* Header row */}
                            <div className="grid px-3 py-1.5 text-[10px] text-chalk-400 font-medium grid-cols-[1fr_2rem_2.8rem_2.4rem] sm:grid-cols-[1fr_2rem_2rem_2rem_2rem_2rem_2rem_2.8rem_2.4rem]">
                                <div>Team</div>
                                <div className="text-center">P</div>
                                <div className="text-center hidden sm:block">W</div>
                                <div className="text-center hidden sm:block">D</div>
                                <div className="text-center hidden sm:block">L</div>
                                <div className="text-center hidden sm:block">GF</div>
                                <div className="text-center hidden sm:block">GA</div>
                                <div className="text-center">GD</div>
                                <div className="text-center font-bold">Pts</div>
                            </div>

                            {/* Team rows */}
                            {teams.map((t, i) => {
                                const isTop2 = i < 2
                                const isBest8Third = i === 2 && best8Third.has(t.team)
                                const isThrough = isTop2 || isBest8Third
                                const isEliminated = !isThrough && groupComplete

                                return (
                                    <div key={t.team}
                                        className={clsx('grid px-3 py-2 text-xs items-center transition-opacity grid-cols-[1fr_2rem_2.8rem_2.4rem] sm:grid-cols-[1fr_2rem_2rem_2rem_2rem_2rem_2rem_2.8rem_2.4rem]',
                                            isTop2 && i === 0 ? 'bg-grass-500/10' :
                                                isTop2 ? 'bg-grass-500/5' :
                                                    isBest8Third ? 'bg-gold-500/5' :
                                                        isEliminated ? 'opacity-50' : ''
                                        )}>

                                        {/* Team name */}
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0',
                                                isTop2 ? 'bg-grass-500' :
                                                    isBest8Third ? 'bg-gold-400' :
                                                        isEliminated ? 'bg-red-500/60' : 'bg-pitch-600')} />
                                            <span className="text-base leading-none flex-shrink-0 hidden sm:inline-block">{flagEmoji(t.code)}</span>
                                            <span className={clsx('truncate',
                                                isTop2 ? 'text-chalk-100 font-medium' :
                                                    isBest8Third ? 'text-chalk-100 font-medium' :
                                                        'text-chalk-400')}>
                                                {t.team}
                                            </span>
                                        </div>

                                        <span className="text-center text-chalk-400">{t.mp}</span>
                                        <span className="text-center text-chalk-300 hidden sm:block">{t.w}</span>
                                        <span className="text-center text-chalk-400 hidden sm:block">{t.d}</span>
                                        <span className="text-center text-chalk-400 hidden sm:block">{t.l}</span>
                                        <span className="text-center text-chalk-400 hidden sm:block">{t.gf}</span>
                                        <span className="text-center text-chalk-400 hidden sm:block">{t.ga}</span>
                                        <span className={clsx('text-center font-mono text-[11px]',
                                            t.gd > 0 ? 'text-grass-400' :
                                                t.gd < 0 ? 'text-red-400' : 'text-chalk-400')}>
                                            {t.gd > 0 ? `+${t.gd}` : t.gd}
                                        </span>
                                        <span className={clsx('text-center font-bold',
                                            isTop2 ? 'text-grass-400' :
                                                isBest8Third ? 'text-gold-400' : 'text-chalk-300')}>
                                            {t.pts}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Footer */}
                        <div className="px-3 py-1.5 text-[10px] text-chalk-400 bg-pitch-900/40 space-y-0.5">
                            <div>
                                <span className="inline-block w-2 h-2 rounded-full bg-grass-500 mr-1" />
                                Top 2 advance
                            </div>
                            <div>
                                <span className="inline-block w-2 h-2 rounded-full bg-gold-400 mr-1" />
                                Best 8 third places advance
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// ── Bracket / Tree View ────────────────────────────────────
function BracketView({ byStage }: { byStage: Record<string, Match[]> }) {
    const matchById = useMemo(() => {
        const map: Record<string, Match> = {}
        Object.values(byStage).flat().forEach(m => map[m.id] = m)
        return map
    }, [byStage])

    const renderColumn = (stage: string, ids: string[], align: 'left' | 'right') => (
        <div className="flex flex-col justify-around gap-2.5" style={{ minWidth: '140px' }}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-center text-chalk-400 mb-1">
                {STAGE_LABEL[stage]}
            </div>
            {ids.map(id => {
                const m = matchById[id]
                return m ? <BracketMatch key={id} m={m} align={align} /> : <PlaceholderMatch key={id} />
            })}
        </div>
    )

    return (
        <div className="overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide">
            <div className="flex items-stretch justify-center gap-4 min-w-max">
                {renderColumn('LAST_32', LEFT_BRACKET.LAST_32, 'left')}
                {renderColumn('LAST_16', LEFT_BRACKET.LAST_16, 'left')}
                {renderColumn('QUARTER_FINALS', LEFT_BRACKET.QUARTER_FINALS, 'left')}
                {renderColumn('SEMI_FINALS', LEFT_BRACKET.SEMI_FINALS, 'left')}

                <div className="flex flex-col justify-center items-center gap-8 mx-2" style={{ minWidth: '150px' }}>
                    <div className="w-full">
                        <div className="text-center text-xs font-bold text-gold-400 mb-2 tracking-wider">FINAL 🏆</div>
                        {matchById['537390'] ? <BracketMatch m={matchById['537390']} align="center" highlight /> : <PlaceholderMatch />}
                    </div>
                    <div className="w-full">
                        <div className="text-center text-[10px] font-bold text-chalk-400 mb-2 tracking-wider uppercase">3rd Place</div>
                        {matchById['537389'] ? <BracketMatch m={matchById['537389']} align="center" /> : <PlaceholderMatch />}
                    </div>
                </div>

                {renderColumn('SEMI_FINALS', RIGHT_BRACKET.SEMI_FINALS, 'right')}
                {renderColumn('QUARTER_FINALS', RIGHT_BRACKET.QUARTER_FINALS, 'right')}
                {renderColumn('LAST_16', RIGHT_BRACKET.LAST_16, 'right')}
                {renderColumn('LAST_32', RIGHT_BRACKET.LAST_32, 'right')}
            </div>
        </div>
    )
}

function PlaceholderMatch() {
    return (
        <div className="rounded-xl border border-pitch-600/20 bg-pitch-800/40 opacity-40 h-[52px]"></div>
    )
}

function BracketMatch({ m, compact = false, highlight = false, align = 'left' }: { m: Match; compact?: boolean; highlight?: boolean; align?: 'left' | 'right' | 'center' }) {
    const done = m.status === 'FINISHED'
    const live = ['IN_PLAY', 'PAUSED', 'LIVE'].includes(m.status)
    const homeWon = done && m.home_score !== null && m.away_score !== null && m.home_score > m.away_score
    const awayWon = done && m.home_score !== null && m.away_score !== null && m.away_score > m.home_score

    const mapping = KNOCKOUT_MAP[m.id]

    const getTeamDisplay = (team: string, code: string, placeholder: string) => {
        if (team === 'TBD') {
            return (
                <div className="flex items-center gap-1.5 opacity-60 flex-1 min-w-0">
                    <span className="text-[10px] italic text-chalk-400 truncate">{placeholder}</span>
                </div>
            )
        }
        return (
            <div className={clsx("flex items-center gap-1.5 flex-1 min-w-0", align === 'right' && 'flex-row-reverse')}>
                <span className="text-xs leading-none flex-shrink-0">{flagEmoji(code)}</span>
                <span className={clsx('truncate', (homeWon || awayWon) ? 'text-chalk-100 font-bold' : 'text-chalk-300')}>
                    {team}
                </span>
            </div>
        )
    }

    const formatTeam = (isHome: boolean, team: string, code: string, isWinner: boolean) => {
        const placeholder = mapping ? (isHome ? mapping.lName : mapping.rName) : 'TBD'
        return (
            <div className={clsx('flex items-center justify-between px-2 py-1 gap-1',
                isWinner ? 'bg-grass-500/15' : 'bg-pitch-800',
            )}>
                {getTeamDisplay(team, code, placeholder)}
                {(done || live) && (
                    <span className={clsx('font-mono font-bold flex-shrink-0',
                        isWinner ? 'text-grass-400' : live ? 'text-red-400' : 'text-chalk-400')}>
                        {isHome ? m.home_score : m.away_score}
                    </span>
                )}
            </div>
        )
    }

    return (
        <div className={clsx('group rounded-xl border overflow-hidden relative shadow-sm h-[52px] flex flex-col justify-center',
            compact ? 'text-[11px]' : 'text-[11px]',
            live ? 'border-red-500/40' : highlight ? 'border-gold-500/40' : 'border-pitch-600/40',
            align === 'center' ? 'w-full' : ''
        )}>
            {mapping && (
                <div className={clsx("absolute top-0 px-1 py-[1px] bg-pitch-900/90 text-[8px] text-chalk-500 z-10",
                    align === 'right' ? 'left-0 rounded-br-lg' : 'right-0 rounded-bl-lg'
                )}>
                    {mapping.label}
                </div>
            )}

            {formatTeam(true, m.home_team, m.home_team_code, homeWon)}
            <div className="h-px bg-pitch-600/40" />
            {formatTeam(false, m.away_team, m.away_team_code, awayWon)}

            {!done && !live && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="bg-pitch-900/95 px-2 py-0.5 rounded text-center text-[9px] text-chalk-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatBDDay(m.kickoff_utc)}<br />{formatBDTime(m.kickoff_utc)}
                    </div>
                </div>
            )}
        </div>
    )
}