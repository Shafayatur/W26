'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Crown, Smile, Tag } from 'lucide-react'
import clsx from 'clsx'

const AVATARS = ['⚽', '🏆', '🥇', '🎯', '🔥', '⚡', '🦁', '🐯', '🦅', '🇧🇷', '🇦🇷', '🇫🇷', '🇩🇪', '🇪🇸', '🇵🇹', '🇮🇹']
const TITLES = [
    { key: 'the_oracle', label: 'The Oracle', emoji: '🔮' },
    { key: 'upset_king', label: 'Upset King', emoji: '👑' },
    { key: 'penalty_expert', label: 'Penalty Expert', emoji: '🥅' },
    { key: 'the_banker', label: 'The Banker', emoji: '💰' },
    { key: 'lucky_charm', label: 'Lucky Charm', emoji: '🍀' },
    { key: 'dark_horse', label: 'Dark Horse', emoji: '🐴' },
]

interface Props {
    userId: string
    userCoins: number
    isVip: boolean
    customTitle: string | null
    unlockedAvatars: string[]
    currentAvatar: string
}

export default function ShopSection({ userId, userCoins, isVip, customTitle, unlockedAvatars, currentAvatar }: Props) {
    const [coins, setCoins] = useState(userCoins)
    const [vip, setVip] = useState(isVip)
    const [title, setTitle] = useState(customTitle)
    const [unlocked, setUnlocked] = useState<string[]>(unlockedAvatars)
    const [avatar, setAvatar] = useState(currentAvatar)
    const [tab, setTab] = useState<'vip' | 'avatars' | 'titles'>('vip')
    const [isPending, startTransition] = useTransition()
    const [msg, setMsg] = useState<string | null>(null)
    const router = useRouter()

    const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 2500) }

    const spend = async (amount: number, reason: string, meta: object) => {
        const supabase = createClient()
        const { error } = await supabase.rpc('award_coins', {
            p_user_id: userId,
            p_amount: -amount,
            p_reason: reason,
            p_meta: meta,
        })
        if (!error) setCoins(c => c - amount)
        return !error
    }

    const buyVip = () => {
        if (vip) return flash('You already have VIP!')
        if (coins < 5) return flash('Need 5 🪙 for VIP')
        startTransition(async () => {
            const supabase = createClient()
            const ok = await spend(5, 'vip_purchase', {})
            if (ok) {
                await supabase.from('profiles').update({ is_vip: true }).eq('id', userId)
                setVip(true)
                flash('👑 VIP activated!')
                router.refresh()
            }
        })
    }

    const buyAvatar = (emoji: string) => {
        if (unlocked.includes(emoji)) {
            // Just equip it
            startTransition(async () => {
                const supabase = createClient()
                await supabase.from('profiles').update({ avatar_emoji: emoji }).eq('id', userId)
                setAvatar(emoji)
                flash('Avatar updated!')
                router.refresh()
            })
            return
        }
        if (coins < 7) return flash('Need 7 🪙 to unlock this avatar')
        startTransition(async () => {
            const supabase = createClient()
            const ok = await spend(7, 'avatar_unlock', { emoji })
            if (ok) {
                const newUnlocked = [...unlocked, emoji]
                await supabase.from('profiles').update({
                    unlocked_avatars: newUnlocked,
                    avatar_emoji: emoji,
                }).eq('id', userId)
                setUnlocked(newUnlocked)
                setAvatar(emoji)
                flash('Avatar unlocked & equipped!')
                router.refresh()
            }
        })
    }

    const buyTitle = (key: string, label: string) => {
        if (title === label) return flash('Already using this title!')
        if (coins < 7) return flash('Need 7 🪙 to unlock a title')
        startTransition(async () => {
            const supabase = createClient()
            const ok = await spend(7, 'title_unlock', { title: label })
            if (ok) {
                await supabase.from('profiles').update({ custom_title: label }).eq('id', userId)
                setTitle(label)
                flash(`Title "${label}" equipped!`)
                router.refresh()
            }
        })
    }

    return (
        <div className="card p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-chalk-400 uppercase tracking-wider">🛍️ Shop</h3>
                <span className="text-xs text-gold-400 bg-gold-500/10 border border-gold-500/20 px-2 py-0.5 rounded-full">
                    🪙 {coins} coins
                </span>
            </div>

            {/* Flash message */}
            {msg && (
                <div className="text-xs text-center text-chalk-100 bg-pitch-700 border border-pitch-600/40 rounded-xl px-3 py-2">
                    {msg}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1.5">
                {([['vip', '👑 VIP', Crown], ['avatars', '😀 Avatars', Smile], ['titles', '🏷️ Titles', Tag]] as const).map(([key, label, Icon]) => (
                    <button key={key} onClick={() => setTab(key)}
                        className={clsx('flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                            tab === key
                                ? 'bg-gold-500/20 border-gold-500/40 text-gold-400'
                                : 'bg-pitch-700/50 border-pitch-600/30 text-chalk-400')}>
                        {label}
                    </button>
                ))}
            </div>

            {/* VIP tab */}
            {tab === 'vip' && (
                <div className="space-y-3">
                    <div className="bg-pitch-900/60 rounded-xl p-4 text-center space-y-2">
                        <div className="text-3xl">👑</div>
                        <p className="text-sm font-semibold text-chalk-100">VIP Crown</p>
                        <p className="text-xs text-chalk-400">Shows a 👑 crown next to your name on the leaderboard for the rest of the tournament.</p>
                        {vip ? (
                            <div className="text-xs text-gold-400 font-semibold bg-gold-500/10 border border-gold-500/20 rounded-lg py-2">
                                ✓ VIP Active
                            </div>
                        ) : (
                            <button onClick={buyVip} disabled={isPending || coins < 5}
                                className="w-full py-2 rounded-xl border border-gold-500/40 bg-gold-500/10 text-gold-400 text-sm font-semibold hover:bg-gold-500/20 transition-all disabled:opacity-40">
                                Unlock for 5 🪙
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Avatars tab */}
            {tab === 'avatars' && (
                <div className="space-y-2">
                    <p className="text-xs text-chalk-400">Tap to unlock (7 🪙) or equip if already unlocked.</p>
                    <div className="grid grid-cols-4 gap-2">
                        {AVATARS.map(emoji => {
                            const isUnlocked = unlocked.includes(emoji) || emoji === '⚽' // ⚽ is default free
                            const isEquipped = avatar === emoji
                            return (
                                <button key={emoji} onClick={() => buyAvatar(emoji)} disabled={isPending}
                                    className={clsx('aspect-square rounded-xl border text-2xl flex items-center justify-center transition-all',
                                        isEquipped
                                            ? 'bg-gold-500/20 border-gold-500/50'
                                            : isUnlocked
                                                ? 'bg-pitch-700/60 border-pitch-600/40 hover:border-chalk-400'
                                                : 'bg-pitch-900/40 border-pitch-700/30 opacity-60 hover:opacity-100')}>
                                    {emoji}
                                    {!isUnlocked && <span className="absolute text-[8px] text-gold-400 translate-y-3">7🪙</span>}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Titles tab */}
            {tab === 'titles' && (
                <div className="space-y-2">
                    <p className="text-xs text-chalk-400">Unlock a title shown next to your name (7 🪙 each).</p>
                    {TITLES.map(({ key, label, emoji }) => {
                        const isEquipped = title === label
                        return (
                            <button key={key} onClick={() => buyTitle(key, label)} disabled={isPending}
                                className={clsx('w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all',
                                    isEquipped
                                        ? 'bg-gold-500/20 border-gold-500/40 text-gold-400'
                                        : 'bg-pitch-700/50 border-pitch-600/30 text-chalk-300 hover:border-chalk-400')}>
                                <span className="text-xl">{emoji}</span>
                                <span className="flex-1 text-left">{label}</span>
                                {isEquipped
                                    ? <span className="text-xs text-gold-400">Equipped ✓</span>
                                    : <span className="text-xs text-chalk-500">7 🪙</span>}
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}