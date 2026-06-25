'use client'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import type { Match, Prediction } from '@/types'
import MatchCard from '@/components/ui/MatchCard'
import { formatInTimeZone } from 'date-fns-tz'
import { BD_TIMEZONE, getTodayBD } from '@/lib/time'
import { Zap, Clock, CheckCircle, CalendarDays, Search, X, Bell } from 'lucide-react'
import clsx from 'clsx'

type Tab = 'today' | 'live' | 'upcoming' | 'results'

interface Props {
  matches: Match[]
  predictions: Prediction[]
  userId: string
  pinnedAnnouncement?: { title: string; body: string; emoji: string } | null
}

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'today', label: 'Today', icon: <CalendarDays size={14} /> },
  { key: 'live', label: 'Live', icon: <Zap size={14} /> },
  { key: 'upcoming', label: 'Next', icon: <Clock size={14} /> },
  { key: 'results', label: 'Results', icon: <CheckCircle size={14} /> },
]

export default function FixturesClient({ matches, predictions, userId, pinnedAnnouncement }: Props) {
  const [tab, setTab] = useState<Tab>('today')
  const [query, setQuery] = useState('')
  const today = getTodayBD()

  const predMap = useMemo(() =>
    Object.fromEntries(predictions.map(p => [p.match_id, p])), [predictions])

  const liveCount = matches.filter(m => ['IN_PLAY', 'PAUSED', 'LIVE'].includes(m.status)).length
  const isSearching = query.trim().length > 0

  const searchResults = useMemo(() => {
    if (!isSearching) return []
    const q = query.trim().toLowerCase()
    return matches.filter(m => {
      const bdDate = formatInTimeZone(new Date(m.kickoff_utc), BD_TIMEZONE, 'd MMM yyyy EEEE MMMM').toLowerCase()
      const bdShort = formatInTimeZone(new Date(m.kickoff_utc), BD_TIMEZONE, 'd/M M/d').toLowerCase()
      return (
        m.home_team.toLowerCase().includes(q) ||
        m.away_team.toLowerCase().includes(q) ||
        m.home_team_code.toLowerCase().includes(q) ||
        m.away_team_code.toLowerCase().includes(q) ||
        m.group_name?.toLowerCase().includes(q) ||
        m.stage.toLowerCase().replace(/_/g, ' ').includes(q) ||
        bdDate.includes(q) ||
        bdShort.includes(q)
      )
    }).sort((a, b) => new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime())
  }, [query, matches, isSearching])

  const tabFiltered = useMemo(() => {
    switch (tab) {
      case 'today':
        return matches.filter(m =>
          formatInTimeZone(new Date(m.kickoff_utc), BD_TIMEZONE, 'yyyy-MM-dd') === today)
      case 'live':
        return matches.filter(m => ['IN_PLAY', 'PAUSED', 'LIVE'].includes(m.status))
      case 'upcoming':
        return matches.filter(m => m.status === 'SCHEDULED')
      case 'results':
        return matches.filter(m => m.status === 'FINISHED').slice().reverse().slice(0, 40)
      default: return []
    }
  }, [tab, matches, today])

  const displayMatches = isSearching ? searchResults : tabFiltered

  const grouped = useMemo(() => {
    if (!isSearching && tab === 'live') return { 'Live Now': displayMatches }
    return displayMatches.reduce((acc, m) => {
      const day = formatInTimeZone(new Date(m.kickoff_utc), BD_TIMEZONE, 'EEEE, d MMM')
      if (!acc[day]) acc[day] = []
      acc[day].push(m)
      return acc
    }, {} as Record<string, Match[]>)
  }, [displayMatches, tab, isSearching])

  const popularTeams = ['Brazil', 'France', 'Argentina', 'England', 'Germany', 'Spain', 'Portugal']

  return (
    <div className="pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-chalk-100" style={{ fontFamily: 'var(--font-display)' }}>
          Ajke kar khela?
        </h1>
        <span className="text-xs text-chalk-400">All times in BD</span>
      </div>
      {/* Pinned announcement banner */}
      {pinnedAnnouncement && (
        <Link href="/announcements" className="flex items-start gap-2.5 bg-gold-500/10 border border-gold-500/25
          rounded-xl p-3 hover:bg-gold-500/15 transition-colors">
          <span className="text-xl flex-shrink-0">{pinnedAnnouncement.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-gold-400 flex items-center gap-1">
              <Bell size={10} /> Announcement
            </div>
            <div className="text-sm font-medium text-chalk-100 truncate">{pinnedAnnouncement.title}</div>
          </div>
          <span className="text-chalk-400 text-xs mt-0.5">→</span>
        </Link>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-chalk-400" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search team, group, date (e.g. Jun 15)…"
          className="w-full bg-pitch-800 border border-pitch-600/40 rounded-xl pl-9 pr-9 py-2.5
                     text-sm text-chalk-100 placeholder:text-chalk-400 focus:outline-none
                     focus:border-grass-500/50 transition-colors"
        />
        {query && (
          <button onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-chalk-400 hover:text-chalk-100">
            <X size={15} />
          </button>
        )}
      </div>

      {!isSearching && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {popularTeams.map(team => (
            <button key={team} onClick={() => setQuery(team)}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-pitch-700/60 border border-pitch-600/40
                         text-chalk-400 hover:text-chalk-100 hover:border-pitch-500 transition-all">
              {team}
            </button>
          ))}
        </div>
      )}

      {isSearching && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-chalk-400">
            {searchResults.length} match{searchResults.length !== 1 ? 'es' : ''} for
            <span className="text-chalk-200 font-medium"> "{query}"</span>
          </span>
          <button onClick={() => setQuery('')} className="text-xs text-grass-400 hover:underline">Clear</button>
        </div>
      )}

      {!isSearching && (
        <div className="flex gap-1.5 bg-pitch-800/80 p-1 rounded-2xl border border-pitch-600/30">
          {TABS.map(({ key, label, icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={clsx('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all',
                tab === key ? 'bg-pitch-700 text-chalk-100 shadow' : 'text-chalk-400 hover:text-chalk-200')}>
              {icon}{label}
              {key === 'live' && liveCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {liveCount}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 text-chalk-400">
          <div className="text-4xl mb-3">{isSearching ? '🔍' : tab === 'live' ? '😴' : '📅'}</div>
          <p className="font-medium">
            {isSearching ? `No matches found for "${query}"` :
              tab === 'live' ? 'No matches live right now' :
                tab === 'today' ? 'No matches today' : 'Nothing here yet'}
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([day, dayMatches]) => (
          <div key={day} className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-chalk-400 uppercase tracking-wider">{day}</span>
              <div className="flex-1 h-px bg-pitch-600/40" />
              <span className="text-xs text-chalk-400">{dayMatches.length} match{dayMatches.length !== 1 ? 'es' : ''}</span>
            </div>
            {dayMatches.map(match => (
              <MatchCard key={match.id} match={match} prediction={predMap[match.id]} showPredictLink={true} />
            ))}
          </div>
        ))
      )}
    </div>
  )
}