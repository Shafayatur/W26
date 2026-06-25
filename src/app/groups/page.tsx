import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import { redirect } from 'next/navigation'
import GroupsClient from './GroupsClient'

export const revalidate = 0

export default async function GroupsPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth')
    

    const { data: memberships } = await supabase
        .from('group_members')
        .select('*, groups(id, name, code, created_by)')
        .eq('user_id', user.id)

    const groups = (memberships ?? []).map(m => m.groups).filter(Boolean)

    return (
        <AppShell>
            <GroupsClient groups={groups as any} userId={user.id} />
        </AppShell>
    )
}