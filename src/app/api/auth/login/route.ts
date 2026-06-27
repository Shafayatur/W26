import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    const { username, pin } = await req.json()
    const supabase = createServiceClient()

    // Verify credentials
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_emoji')
        .eq('username', username.toLowerCase().trim())
        .eq('pin', pin)
        .single()

    if (!profile) {
        return NextResponse.json({ error: 'Wrong username or PIN' }, { status: 401 })
    }

    const fakeEmail = `${username.toLowerCase().trim()}@wc26.internal`
    const fakePassword = `wc26_${pin}_${username.toLowerCase().trim()}_secret`

    // Try signing in first (returning user)
    const { data: signInData } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: fakePassword,
    })

    if (signInData?.session) {
        // Existing auth account found
        // Reassign if UUID changed somehow
        if (signInData.user.id !== profile.id) {
            await supabase.rpc('reassign_profile', {
                p_old_id: profile.id,
                p_new_id: signInData.user.id
            })
        }
        return NextResponse.json({
            access_token: signInData.session.access_token,
            refresh_token: signInData.session.refresh_token,
        })
    }

    // First time — create real auth account via signUp
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: fakeEmail,
        password: fakePassword,
        options: {
            data: { username, name: profile.name },
        }
    })

    if (signUpError || !signUpData.user) {
        return NextResponse.json({ error: signUpError?.message ?? 'Signup failed' }, { status: 500 })
    }

    // Reassign all data from old anon id to new permanent id
    if (signUpData.user.id !== profile.id) {
        const { error: reassignError } = await supabase.rpc('reassign_profile', {
            p_old_id: profile.id,
            p_new_id: signUpData.user.id
        })
        if (reassignError) {
            return NextResponse.json({ error: reassignError.message }, { status: 500 })
        }
    }

    // Sign in to get session
    const { data: finalSession } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: fakePassword,
    })

    if (!finalSession?.session) {
        return NextResponse.json({ error: 'Could not create session' }, { status: 500 })
    }

    return NextResponse.json({
        access_token: finalSession.session.access_token,
        refresh_token: finalSession.session.refresh_token,
    })
}