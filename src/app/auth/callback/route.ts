import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && user) {
      // Upsert profile (creates on first login, ignores on subsequent)
      const meta = user.user_metadata
      await supabase.from('profiles').upsert({
        id: user.id,
        name: meta?.name ?? user.email?.split('@')[0] ?? 'Player',
        avatar_emoji: meta?.avatar_emoji ?? '⚽',
      }, { onConflict: 'id', ignoreDuplicates: true })

      return NextResponse.redirect(`${origin}/fixtures`)
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=auth_failed`)
}
