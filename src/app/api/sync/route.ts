import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { fetchAllMatches, normalizeMatch } from '@/lib/football-api'
import { formatInTimeZone } from 'date-fns-tz'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const matches = await fetchAllMatches()
    const supabase = createServiceClient()
    const normalized = matches.map(normalizeMatch).filter(m => m.home_team && m.away_team)

    const { error } = await supabase
      .from('matches')
      .upsert(normalized, { onConflict: 'id' })

    if (error) throw error

    // Score any finished matches
    const finished = normalized.filter(m => m.status === 'FINISHED')
    const finishedDatesBD = new Set<string>()

    for (const m of finished) {
      await supabase.rpc('calculate_prediction_points', { p_match_id: m.id })
      const bdDate = formatInTimeZone(new Date(m.kickoff_utc), 'Asia/Dhaka', 'yyyy-MM-dd')
      finishedDatesBD.add(bdDate)
    }

    // For each date that had a finished match, check if ALL matches that day are done.
    // If so, calculate the daily winner for that date.
    let dailyWinnersCalculated = 0
    for (const date of Array.from(finishedDatesBD)) {
      const { data: dayMatches } = await supabase
        .from('matches')
        .select('status, kickoff_utc')

      const matchesOnDate = (dayMatches ?? []).filter(m =>
        formatInTimeZone(new Date(m.kickoff_utc), 'Asia/Dhaka', 'yyyy-MM-dd') === date
      )
      const allDone = matchesOnDate.length > 0 && matchesOnDate.every(m => m.status === 'FINISHED')

      if (allDone) {
        await supabase.rpc('calculate_daily_winner', { p_date: date })
        dailyWinnersCalculated++
      }
    }

    return NextResponse.json({
      ok: true,
      synced: normalized.length,
      scored: finished.length,
      dailyWinnersChecked: dailyWinnersCalculated,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}