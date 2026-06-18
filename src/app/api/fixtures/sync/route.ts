import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { fetchAllMatches, fetchLiveMatches, normalizeMatch } from '@/lib/football-api'

// Call this route to sync matches from the API into your Supabase DB
// In production: set up a Vercel cron job or call manually
// GET /api/fixtures/sync  (add ?live=1 to only sync live matches)

export async function GET(req: NextRequest) {
  // Simple secret check so only you can trigger this
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.SYNC_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const liveOnly = req.nextUrl.searchParams.get('live') === '1'

  try {
    const apiMatches = liveOnly ? await fetchLiveMatches() : await fetchAllMatches()
    const normalized = apiMatches.map(normalizeMatch)

    const supabase = createServiceClient()

    // Upsert all matches
    const { error } = await supabase
      .from('matches')
      .upsert(normalized, { onConflict: 'id' })

    if (error) throw error

    // After syncing, calculate points for newly-finished matches
    const finished = normalized.filter(m => m.status === 'FINISHED')
    for (const m of finished) {
      await supabase.rpc('calculate_prediction_points', { p_match_id: m.id })
    }

    return NextResponse.json({
      ok: true,
      synced: normalized.length,
      finished: finished.length,
      liveOnly,
    })
  } catch (e: any) {
    console.error('Sync error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
