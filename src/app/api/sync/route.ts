import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { fetchAllMatches, normalizeMatch } from '@/lib/football-api'

// Call this route to sync matches from football-data.org into Supabase
// Set up a Vercel Cron Job to hit GET /api/sync every 5 minutes during the tournament
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
    for (const m of finished) {
      await supabase.rpc('calculate_prediction_points', { p_match_id: m.id })
    }

    return NextResponse.json({ ok: true, synced: normalized.length, scored: finished.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
