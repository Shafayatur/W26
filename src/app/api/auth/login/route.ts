import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    const { username, pin } = await req.json()
    const supabase = createServiceClient()

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_emoji')
        .eq('username', username.toLowerCase().trim())
        .eq('pin', pin)
        .single()

    if (!profile) {
        return NextResponse.json({ error: 'Wrong username or PIN' }, { status: 401 })
    }

    const { data: { user, session }, error } = await supabase.auth.signInAnonymously()

    if (error || !user || !session) {
        return NextResponse.json({ error: 'Auth failed' }, { status: 500 })
    }

    if (user.id !== profile.id) {
        const { error: reassignError } = await supabase.rpc('reassign_profile', {
            p_old_id: profile.id,
            p_new_id: user.id
        })
        if (reassignError) {
            return NextResponse.json({ error: reassignError.message }, { status: 500 })
        }
    }

    return NextResponse.json({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
    })
}