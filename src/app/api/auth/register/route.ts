import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    const { username, pin, name, avatar_emoji } = await req.json()
    const supabase = createServiceClient()

    const { data: existing } = await supabase
        .from('profiles').select('id').eq('username', username.toLowerCase().trim()).maybeSingle()
    if (existing) {
        return NextResponse.json({ error: 'Username taken' }, { status: 400 })
    }

    const fakeEmail = `${username.toLowerCase().trim()}@wc26family.internal`
    const fakePassword = `wc26_${pin}_${username.toLowerCase().trim()}`

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: fakeEmail,
        password: fakePassword,
        email_confirm: true,
        user_metadata: { username, name, avatar_emoji },
    })

    if (authError || !authData.user) {
        return NextResponse.json({ error: authError?.message ?? 'Failed to create user' }, { status: 500 })
    }

    const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        name: name.trim(),
        username: username.toLowerCase().trim(),
        pin,
        avatar_emoji,
    })

    if (profileError) {
        await supabase.auth.admin.deleteUser(authData.user.id)
        return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    const { data: session } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: fakePassword,
    })

    return NextResponse.json({
        access_token: session?.session?.access_token,
        refresh_token: session?.session?.refresh_token,
    })
}