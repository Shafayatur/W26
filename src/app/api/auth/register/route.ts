import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    const { username, pin, name, avatar_emoji } = await req.json()
    const supabase = createServiceClient()

    // Check username taken
    const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase().trim())
        .maybeSingle()

    if (existing) {
        return NextResponse.json({ error: 'Username taken' }, { status: 400 })
    }

    const fakeEmail = `${username.toLowerCase().trim()}@wc26.internal`
    const fakePassword = `wc26_${pin}_${username.toLowerCase().trim()}_secret`

    // Create real auth account
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: fakeEmail,
        password: fakePassword,
        options: {
            data: { username, name, avatar_emoji },
        }
    })

    if (signUpError || !signUpData.user) {
        return NextResponse.json({ error: signUpError?.message ?? 'Failed to create user' }, { status: 500 })
    }

    // Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
        id: signUpData.user.id,
        name: name.trim(),
        username: username.toLowerCase().trim(),
        pin,
        avatar_emoji,
    })

    if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Sign in to get session
    const { data: session } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: fakePassword,
    })

    if (!session?.session) {
        return NextResponse.json({ error: 'Could not create session' }, { status: 500 })
    }

    return NextResponse.json({
        access_token: session.session.access_token,
        refresh_token: session.session.refresh_token,
    })
}