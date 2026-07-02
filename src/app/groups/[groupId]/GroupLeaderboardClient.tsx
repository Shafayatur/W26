'use client'
import { useState, useRef } from 'react'
import { getStreakBadge } from '@/lib/points'
import { ArrowLeft, Swords } from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'
import SideBetModal from './SideBetModal'
import SideBetsPanel from './SideBetsPanel'

type Tab = 'overall' | 'group' | 'knockout'

interface Entry {
    id: string
    name: string
    avatar_emoji: string
    streak: number
    best_streak: number
    is_vip: boolean
    custom_title: string | null
    overall_pts: number
    group_pts: number
    knockout_pts: number
    overall_correct: number
    overall_scored: number
    group_correct: number
    group_scored: number
    knockout_correct: number
    knockout_scored: number
}

interface Match {
    id: string
    home_team: string
    away_team: string
    kickoff_utc: string
}

interface Bet {
    id: string
    wager: number
    status: string
    challenger_id: string
    challenged_id: string
    winner_id: string | null
    match: { home_team: string; away_team: string; kickoff_utc: string }
    challenger: { name: string; avatar_emoji: string }
    challenged: { name: string; avatar_emoji: string }
}

interface Props {
    group: { id: string; name: string; code: string }
    entries: Entry[]
    currentUserId: string
    userCoins: number
    upcomingMatches: Match[]
    bets: Bet[]
}

const TABS: { key: Tab; label: string }[] = [
    { key: 'overall', label: 'Overall' },
    { key: 'group', label: 'Group Stage' },
    { key: 'knockout', label: 'Knockouts' },
]

const RANK_MEDALS = ['🥇', '🥈', '🥉']

export default function GroupLeaderboardClient({ group, entries, currentUserId, userCoins, upcomingMatches, bets }: Props) {
    const [tab, setTab] = useState<Tab>('overall')
    const [challengeTarget, setChallengeTarget] = useState<Entry | null>(null)
    const touchStartX = useRef<number | null>(null)

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX
    }
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return
        const diff = touchStartX.current - e.changedTouches[0].clientX
        if (Math.abs(diff) > 50) {
            const idx = TABS.findIndex(t => t.key === tab)
            if (diff > 0 && idx < TABS.length - 1) setTab(TABS[idx + 1].key)
            else if (diff < 0 && idx > 0) setTab(TABS[idx - 1].key)
        }
        touchStartX.current = null
    }

    const getPoints = (e: Entry) => tab === 'overall' ? e.overall_pts : tab === 'group' ? e.group_pts : e.knockout_pts
    const getCorrect = (e: Entry) => tab === 'overall' ? e.overall_correct : tab === 'group' ? e.group_correct : e.knockout_correct
    const getScored = (e: Entry) => tab === 'overall' ? e.overall_scored : tab === 'group' ? e.group_scored : e.knockout_scored

    const sorted = [...entries].sort((a, b) => getPoints(b) - getPoints(a))

    return (
        <div
            className="pt-4 space-y-5 pb-4"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <div className="flex items-center relative">
                <Link href="/groups" className="flex items-center gap-1.5 text-chalk-400 hover:text-chalk-100 transition-colors text-sm absolute left-0">
                    <ArrowLeft size={16} /> Back
                </Link>
                <h1 className="text-xl font-bold text-chalk-100 text-center w-full">{group.name}</h1>
            </div>

            {/* Swipeable tab indicator */}
            <div className="space-y-2">
                <div className="flex gap-1 bg-pitch-800/80 p-1 rounded-2xl border border-pitch-600/30">
                    {TABS.map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className={clsx('flex-1 py-2 rounded-xl text-xs font-medium transition-all',
                                tab === t.key ? 'bg-pitch-700 text-chalk-100' : 'text-chalk-400 hover:text-chalk-200')}>
                            {t.label}
                        </button>
                    ))}
                </div>
                {/* Swipe dots */}
                <div className="flex justify-center gap-1.5">
                    {TABS.map(t => (
                        <div key={t.key} className={clsx('h-1 rounded-full transition-all duration-300',
                            tab === t.key ? 'bg-grass-400 w-4' : 'bg-pitch-600 w-1.5')} />
                    ))}
                </div>
                <p className="text-center text-[10px] text-chalk-400">Swipe or tap to switch</p>
            </div>

            {/* Tab description */}
            {tab === 'knockout' && entries.every(e => e.knockout_scored === 0) && (
                <div className="text-center py-8 text-chalk-400">
                    <div className="text-3xl mb-2">⚡</div>
                    <p className="text-sm">Knockout stage hasn't started yet</p>
                    <p className="text-xs mt-1">Everyone starts fresh from Round of 32</p>
                </div>
            )}

            {/* Podium */}
            {sorted.length >= 1 && !(tab === 'knockout' && entries.every(e => e.knockout_scored === 0)) && (
                <div className="flex items-end justify-center gap-3 py-2">
                    {[sorted[1], sorted[0], sorted[2]].filter(Boolean).map((entry, i) => {
                        const heights = ['h-20', 'h-28', 'h-16']
                        const realRank = i === 0 ? 1 : i === 1 ? 0 : 2
                        return (
                            <div key={entry.id} className="flex flex-col items-center gap-1">
                                <span className="text-xl">{entry.avatar_emoji}</span>
                                <span className="text-xs font-semibold text-chalk-200 text-center max-w-[60px] truncate">{entry.name}</span>
                                <span className="text-xs font-bold text-gold-400">{getPoints(entry)} pts</span>
                                <div className={clsx('w-16 rounded-t-xl flex items-center justify-center text-lg font-bold', heights[i],
                                    i === 1 ? 'bg-gold-500/20 border border-gold-500/40' :
                                        i === 0 ? 'bg-chalk-300/10 border border-chalk-300/20' : 'bg-amber-700/20 border border-amber-700/30')}>
                                    {RANK_MEDALS[realRank]}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Full table */}
            {!(tab === 'knockout' && entries.every(e => e.knockout_scored === 0)) && (
                <div className="space-y-2">
                    {sorted.map((entry, idx) => {
                        const streakBadge = getStreakBadge(entry.streak)
                        const isMe = entry.id === currentUserId
                        const pts = getPoints(entry)
                        const correct = getCorrect(entry)
                        const scored = getScored(entry)
                        const accuracy = scored > 0 ? Math.round((correct / scored) * 100) : 0

                        return (
                            <div key={entry.id} className={clsx('card p-4 flex items-center gap-3', isMe && 'border-grass-500/30 bg-grass-500/5')}>
                                <div className={clsx('text-lg font-bold w-7 text-center flex-shrink-0',
                                    idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : 'text-chalk-400')}>
                                    {idx < 3 ? RANK_MEDALS[idx] : `${idx + 1}`}
                                </div>
                                <span className="text-xl">{entry.avatar_emoji}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-chalk-100 flex items-center gap-1.5 flex-wrap">
                                        {entry.is_vip && <span>👑</span>}
                                        {entry.name}
                                        {isMe && <span className="text-xs text-grass-400">(you)</span>}
                                        {streakBadge && (
                                            <span className="text-xs bg-red-500/20 border border-red-500/30 text-red-300 px-1.5 py-0.5 rounded-full">
                                                {streakBadge.emoji} {streakBadge.label}
                                            </span>
                                        )}
                                    </div>
                                    {entry.custom_title && (
                                        <div className="text-xs text-gold-400">{entry.custom_title}</div>
                                    )}
                                    <div className="text-xs text-chalk-400 mt-0.5">
                                        {correct}/{scored} correct · {accuracy}% accuracy
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <div className="text-lg font-bold text-gold-400">{pts}</div>
                                    <div className="text-xs text-chalk-400">pts</div>
                                </div>
                                {!isMe && (
                                    <button
                                        onClick={() => setChallengeTarget(entry)}
                                        className="flex-shrink-0 p-2 rounded-lg border border-pitch-600/40 text-chalk-400 hover:border-gold-500/40 hover:text-gold-400 transition-all"
                                        title={`Challenge ${entry.name}`}>
                                        <Swords size={14} />
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Side bets panel */}
            <SideBetsPanel userId={currentUserId} bets={bets} userCoins={userCoins} />

            {/* Group Stage Winner Banner */}
            {tab === 'group' && sorted.length >= 1 && sorted[0].group_scored > 0 && (
                <div className="card p-4 text-center space-y-1 border-gold-500/40 bg-gold-500/5">
                    <p className="text-xs text-chalk-400 uppercase tracking-wider font-semibold">Group Stage Winner</p>
                    <div className="text-3xl">{sorted[0].avatar_emoji}</div>
                    <p className="text-lg font-bold text-chalk-100">{sorted[0].name}</p>
                    <p className="text-gold-400 font-bold text-sm">{sorted[0].group_pts} pts</p>
                    <p className="text-xs text-chalk-400">
                        {sorted[0].group_correct}/{sorted[0].group_scored} correct
                    </p>
                </div>
            )}

            {/* Points guide */}
            <div className="card p-4 space-y-2">
                <h3 className="text-xs font-semibold text-chalk-400 uppercase tracking-wider">Points guide</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    {[
                        ['🎯 Exact score', '5 pts'],
                        ['✓ Correct result', '3 pts'],
                        ['~ Right goal diff', '+1 bonus'],
                        ['💰 Banker correct', '×2 pts'],
                        ['✗ Wrong prediction', '-1 pts'],
                        ['💀 Wrong banker', '-5 pts'],
                        ['⏱ Predict ET (correct)', '+2 pts'],
                        ['⏱ Exact ET score', '+3 bonus'],
                        ['⏱ Correct ET winner', '+2 bonus'],
                        ['⏱ Wrong ET result', '-1 pts'],
                        ['⏱ Predicted ET, no ET', '-2 pts'],
                        ['🥅 Correct pen winner', '+3 pts'],
                        ['🥅 Wrong pen winner', '-2 pts'],
                        ['🥅 Predicted pens, no pens', '-2 pts'],
                    ].map(([label, pts]) => (
                        <div key={label} className="flex flex-col gap-1 bg-pitch-900/40 rounded-xl px-3 py-2.5 border border-pitch-700/30">
                            <span className="text-chalk-300 text-xs leading-tight">{label}</span>
                            <span className={`font-bold text-sm ${pts.startsWith('-') ? 'text-red-400' : 'text-gold-400'}`}>{pts}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Challenge modal */}
            {challengeTarget && (
                <SideBetModal
                    challengerId={currentUserId}
                    challengedId={challengeTarget.id}
                    challengedName={challengeTarget.name}
                    challengedEmoji={challengeTarget.avatar_emoji}
                    userCoins={userCoins}
                    upcomingMatches={upcomingMatches}
                    onClose={() => setChallengeTarget(null)}
                />
            )}
        </div>
    )
}