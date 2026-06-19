'use client'
import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Group } from '@/types'
import { Plus, LogIn, Copy, Check, Users, Trash2 } from 'lucide-react'
import clsx from 'clsx'

interface Props {
    groups: Group[]
    userId: string
}

function generateCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function GroupsClient({ groups: initial, userId }: Props) {
    const [groups, setGroups] = useState<Group[]>(initial)
    const [mode, setMode] = useState<null | 'create' | 'join'>(null)
    const [groupName, setGroupName] = useState('')
    const [joinCode, setJoinCode] = useState('')
    const [error, setError] = useState('')
    const [copiedCode, setCopiedCode] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const supabase = createClient()
    const router = useRouter()

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code)
        setCopiedCode(code)
        setTimeout(() => setCopiedCode(null), 2000)
    }

    const createGroup = () => {
        if (!groupName.trim()) return
        startTransition(async () => {
            setError('')
            const code = generateCode()
            const { data: group, error: err } = await supabase
                .from('groups')
                .insert({ name: groupName.trim(), code, created_by: userId })
                .select()
                .single()

            if (err || !group) { setError(err?.message ?? 'Failed to create group'); return }

            await supabase.from('group_members').insert({ group_id: group.id, user_id: userId })
            setGroups(prev => [...prev, group])
            setGroupName('')
            setMode(null)
        })
    }

    const joinGroup = () => {
        if (!joinCode.trim()) return
        startTransition(async () => {
            setError('')
            const { data: group, error: err } = await supabase
                .from('groups')
                .select('*')
                .eq('code', joinCode.trim().toUpperCase())
                .single()

            if (err || !group) { setError('Group not found. Check the code.'); return }

            const already = groups.find(g => g.id === group.id)
            if (already) { setError('You are already in this group!'); return }

            const { error: joinErr } = await supabase
                .from('group_members')
                .insert({ group_id: group.id, user_id: userId })

            if (joinErr) { setError(joinErr.message); return }

            setGroups(prev => [...prev, group])
            setJoinCode('')
            setMode(null)
        })
    }

    const leaveGroup = (groupId: string) => {
        startTransition(async () => {
            await supabase.from('group_members')
                .delete()
                .eq('group_id', groupId)
                .eq('user_id', userId)
            setGroups(prev => prev.filter(g => g.id !== groupId))
        })
    }

    return (
        <div className="pt-6 space-y-5">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-chalk-100" style={{ fontFamily: 'var(--font-display)' }}>
                    My Groups
                </h1>
                <div className="flex gap-2">
                    <button onClick={() => { setMode('join'); setError('') }}
                        className="btn-ghost flex items-center gap-1.5 text-sm py-2 px-3">
                        <LogIn size={14} /> Join
                    </button>
                    <button onClick={() => { setMode('create'); setError('') }}
                        className="btn-primary flex items-center gap-1.5 text-sm py-2 px-3">
                        <Plus size={14} /> New
                    </button>
                </div>
            </div>

            {/* Create form */}
            {mode === 'create' && (
                <div className="card p-4 space-y-3 animate-in">
                    <h2 className="text-sm font-semibold text-chalk-300">Create a group</h2>
                    <input
                        value={groupName}
                        onChange={e => setGroupName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && createGroup()}
                        placeholder="e.g. Rahman Family 🏆"
                        maxLength={40}
                        className="w-full bg-pitch-900/60 border border-pitch-600/40 rounded-xl px-4 py-3
                       text-chalk-100 placeholder:text-chalk-400 focus:outline-none
                       focus:border-grass-500/60 transition-colors text-sm"
                    />
                    {error && <p className="text-red-400 text-xs">{error}</p>}
                    <div className="flex gap-2">
                        <button onClick={() => { setMode(null); setError('') }} className="btn-ghost flex-1 text-sm py-2">Cancel</button>
                        <button onClick={createGroup} disabled={isPending || !groupName.trim()} className="btn-primary flex-1 text-sm py-2">
                            {isPending ? 'Creating…' : 'Create'}
                        </button>
                    </div>
                </div>
            )}

            {/* Join form */}
            {mode === 'join' && (
                <div className="card p-4 space-y-3 animate-in">
                    <h2 className="text-sm font-semibold text-chalk-300">Join with invite code</h2>
                    <input
                        value={joinCode}
                        onChange={e => setJoinCode(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === 'Enter' && joinGroup()}
                        placeholder="e.g. RAFI26"
                        maxLength={6}
                        className="w-full bg-pitch-900/60 border border-pitch-600/40 rounded-xl px-4 py-3
                       text-chalk-100 placeholder:text-chalk-400 focus:outline-none
                       focus:border-grass-500/60 transition-colors text-sm font-mono tracking-widest uppercase"
                    />
                    {error && <p className="text-red-400 text-xs">{error}</p>}
                    <div className="flex gap-2">
                        <button onClick={() => { setMode(null); setError('') }} className="btn-ghost flex-1 text-sm py-2">Cancel</button>
                        <button onClick={joinGroup} disabled={isPending || !joinCode.trim()} className="btn-primary flex-1 text-sm py-2">
                            {isPending ? 'Joining…' : 'Join'}
                        </button>
                    </div>
                </div>
            )}

            {/* Group list */}
            {groups.length === 0 && !mode && (
                <div className="text-center py-16 text-chalk-400">
                    <div className="text-4xl mb-3">👨‍👩‍👧‍👦</div>
                    <p className="font-medium">No groups yet</p>
                    <p className="text-sm mt-1">Create one and invite your family!</p>
                </div>
            )}

            {groups.map(group => (
                <div key={group.id} className="card p-4 space-y-3">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="font-bold text-chalk-100">{group.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="font-mono text-sm font-bold text-gold-400 tracking-widest">{group.code}</span>
                                <button onClick={() => copyCode(group.code)}
                                    className="text-chalk-400 hover:text-chalk-100 transition-colors">
                                    {copiedCode === group.code ? <Check size={13} className="text-grass-400" /> : <Copy size={13} />}
                                </button>
                                <span className="text-xs text-chalk-400">
                                    {copiedCode === group.code ? 'Copied!' : 'Copy invite code'}
                                </span>
                            </div>
                        </div>
                        <button onClick={() => leaveGroup(group.id)}
                            className="text-chalk-400 hover:text-red-400 transition-colors p-1">
                            <Trash2 size={15} />
                        </button>
                    </div>

                    <button
                        onClick={() => router.push(`/groups/${group.id}`)}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl
                       bg-grass-500/10 border border-grass-500/30 text-grass-400 text-sm
                       font-medium hover:bg-grass-500/20 transition-colors">
                        <Users size={14} /> View leaderboard
                    </button>
                </div>
            ))}
        </div>
    )
}