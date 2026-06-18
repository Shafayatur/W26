import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import { redirect } from 'next/navigation'
import { flagEmoji } from '@/lib/football-api'
import { formatBDTime, formatBDDay } from '@/lib/time'
import type { Match } from '@/types'

export const revalidate = 60

const STAGE_ORDER = ['GROUP_STAGE','ROUND_OF_16','QUARTER_FINALS','SEMI_FINALS','THIRD_PLACE','FINAL']
const STAGE_LABEL: Record<string,string> = {
  GROUP_STAGE:'Group Stage', ROUND_OF_16:'Round of 16',
  QUARTER_FINALS:'Quarter Finals', SEMI_FINALS:'Semi Finals',
  THIRD_PLACE:'3rd Place', FINAL:'Final'
}

export default async function BracketPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: matches } = await supabase.from('matches').select('*').order('kickoff_utc')
  const all = (matches ?? []) as Match[]

  const byStage = STAGE_ORDER.reduce((acc, s) => {
    const ms = all.filter(m => m.stage === s)
    if (ms.length) acc[s] = ms
    return acc
  }, {} as Record<string, Match[]>)

  return (
    <AppShell>
      <div className="pt-6 space-y-6">
        <h1 className="text-2xl font-bold text-chalk-100" style={{fontFamily:'var(--font-display)'}}>Bracket</h1>
        {Object.keys(byStage).length === 0 && (
          <div className="text-center py-16 text-chalk-400">
            <div className="text-4xl mb-3">📋</div>
            <p>Fixtures not loaded yet. Run the sync API first.</p>
          </div>
        )}
        {STAGE_ORDER.filter(s => byStage[s]).map(stage => {
          const ms = byStage[stage]
          // Group stage: group by group_name
          if (stage === 'GROUP_STAGE') {
            const groups = ms.reduce((acc, m) => {
              const g = m.group_name ?? 'Unknown'
              if (!acc[g]) acc[g] = []
              acc[g].push(m)
              return acc
            }, {} as Record<string, Match[]>)
            return (
              <div key={stage} className="space-y-4">
                <h2 className="text-xs font-semibold text-chalk-400 uppercase tracking-wider">Group Stage</h2>
                {Object.entries(groups).sort().map(([group, gms]) => (
                  <div key={group} className="card p-3 space-y-2">
                    <div className="text-xs font-bold text-gold-400 px-1">{group}</div>
                    {gms.map(m => <MatchRow key={m.id} m={m} />)}
                  </div>
                ))}
              </div>
            )
          }
          return (
            <div key={stage} className="space-y-2">
              <h2 className="text-xs font-semibold text-chalk-400 uppercase tracking-wider">{STAGE_LABEL[stage]}</h2>
              <div className="card p-3 space-y-2">
                {ms.map(m => <MatchRow key={m.id} m={m} />)}
              </div>
            </div>
          )
        })}
      </div>
    </AppShell>
  )
}

function MatchRow({ m }: { m: Match }) {
  const live = ['IN_PLAY','PAUSED','LIVE'].includes(m.status)
  const done = m.status === 'FINISHED'
  return (
    <div className="flex items-center gap-2 py-1.5 px-1 rounded-lg hover:bg-pitch-700/40 transition-colors">
      <div className="flex-1 flex items-center justify-end gap-1.5 text-sm">
        <span className="text-chalk-200 font-medium truncate">{m.home_team}</span>
        <span className="text-base">{flagEmoji(m.home_team_code)}</span>
      </div>
      <div className="text-center min-w-[64px]">
        {done || live ? (
          <span className={`font-mono font-bold text-sm ${live ? 'text-red-400' : 'text-chalk-100'}`}>
            {m.home_score} – {m.away_score}
          </span>
        ) : (
          <span className="text-xs text-chalk-400">{formatBDDay(m.kickoff_utc)}<br/>{formatBDTime(m.kickoff_utc)}</span>
        )}
      </div>
      <div className="flex-1 flex items-center gap-1.5 text-sm">
        <span className="text-base">{flagEmoji(m.away_team_code)}</span>
        <span className="text-chalk-200 font-medium truncate">{m.away_team}</span>
      </div>
    </div>
  )
}
