import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import { redirect } from 'next/navigation'
import { formatBDFull } from '@/lib/time'
import { Pin } from 'lucide-react'
import clsx from 'clsx'

export const revalidate = 300

export default async function AnnouncementsPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth')
    


    const { data: announcements } = await supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

    return (
        <AppShell>
            <div className="pt-6 space-y-4 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-chalk-100" style={{ fontFamily: 'var(--font-display)' }}>
                        Announcements
                    </h1>
                    <p className="text-xs text-chalk-400 mt-0.5">Updates and news from the app</p>
                </div>

                {(announcements ?? []).length === 0 && (
                    <div className="text-center py-16 text-chalk-400">
                        <div className="text-4xl mb-3">📢</div>
                        <p>No announcements yet</p>
                    </div>
                )}

                <div className="space-y-3">
                    {(announcements ?? []).map(a => (
                        <div key={a.id} className={clsx(
                            'card p-4 space-y-2 animate-in',
                            a.is_pinned && 'border-gold-500/30 bg-gold-500/5'
                        )}>
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{a.emoji}</span>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <h2 className="font-bold text-chalk-100">{a.title}</h2>
                                            {a.is_pinned && (
                                                <Pin size={12} className="text-gold-400 flex-shrink-0" />
                                            )}
                                        </div>
                                        <div className="text-xs text-chalk-400 mt-0.5">
                                            {formatBDFull(a.created_at)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1.5 whitespace-pre-wrap text-sm text-chalk-300 leading-relaxed">
                                {a.body}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AppShell>
    )
}