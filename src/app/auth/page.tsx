'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const AVATAR_OPTIONS = ['⚽', '🏆', '🦁', '🐯', '🦅', '🔥', '⚡', '🌟', '🎯', '👑', '💀', '🙂']

export default function AuthPage() {
  const [mode, setMode] = useState<'join' | 'login'>('join')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState('⚽')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const sanitize = (v: string) => v.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20)

  const handleJoin = async () => {
    if (!name.trim() || !username.trim()) return
    setLoading(true); setError('')
    try {
      const { data: existing } = await supabase
        .from('profiles').select('id').eq('username', username).maybeSingle()
      if (existing) { setError('Username taken, pick another'); setLoading(false); return }

      const { data: { user }, error: signInError } = await supabase.auth.signInAnonymously()
      if (signInError || !user) throw signInError

      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        name: name.trim(),
        username,
        avatar_emoji: avatar,
      })
      if (profileError) throw profileError

      router.push('/fixtures')
      router.refresh()
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!username.trim()) return
    setLoading(true); setError('')
    try {
      const { data: profile } = await supabase
        .from('profiles').select('id').eq('username', username).maybeSingle()
      if (!profile) { setError('Username not found'); setLoading(false); return }

      const { data: { user }, error: signInError } = await supabase.auth.signInAnonymously()
      if (signInError || !user) throw signInError

      const { data: myProfile } = await supabase
        .from('profiles').select('id').eq('id', user.id).maybeSingle()

      if (!myProfile) {
        setError('To log in on a new device, ask the app owner to reset your session in Supabase.')
        await supabase.auth.signOut()
      } else {
        router.push('/fixtures')
        router.refresh()
      }
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6 animate-in">
      <div className="text-center space-y-2">
        <div className="text-5xl mb-3">🏆</div>
        <h1 className="text-3xl font-bold text-chalk-100" style={{ fontFamily: 'var(--font-display)' }}>
          WC26 Match Predictor
        </h1>
        <p className="text-chalk-400 text-sm">FIFA World Cup 2026 · Match prediction game</p>
      </div>

      <div className="flex gap-1 bg-pitch-800/80 p-1 rounded-2xl border border-pitch-600/30">
        {(['join', 'login'] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); setError('') }}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all
              ${mode === m ? 'bg-pitch-700 text-chalk-100' : 'text-chalk-400 hover:text-chalk-200'}`}>
            {m === 'join' ? '🆕 Join' : '👋 Login'}
          </button>
        ))}
      </div>

      <div className="card p-6 space-y-5">
        {mode === 'join' && (
          <>
            <div>
              <label className="text-xs font-medium text-chalk-400 uppercase tracking-wider block mb-2">Pick your avatar</label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map(a => (
                  <button key={a} onClick={() => setAvatar(a)}
                    className={`text-2xl w-10 h-10 rounded-xl flex items-center justify-center transition-all
                      ${avatar === a ? 'bg-grass-500/20 border-2 border-grass-500 scale-110' : 'bg-pitch-700/60 border border-pitch-600/40 hover:border-pitch-500'}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-chalk-400 uppercase tracking-wider block mb-1.5">Your name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Alishba, Miftah, Maryam..." maxLength={30}
                className="w-full bg-pitch-900/60 border border-pitch-600/40 rounded-xl px-4 py-3 text-chalk-100 placeholder:text-chalk-400 focus:outline-none focus:border-grass-500/60 transition-colors" />
            </div>
          </>
        )}

        <div>
          <label className="text-xs font-medium text-chalk-400 uppercase tracking-wider block mb-1.5">Username</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-chalk-400 font-medium">@</span>
            <input
              value={username}
              onChange={e => setUsername(sanitize(e.target.value))}
              onKeyDown={e => e.key === 'Enter' && (mode === 'join' ? handleJoin() : handleLogin())}
              placeholder="e.g. cr7"
              maxLength={20}
              className="w-full bg-pitch-900/60 border border-pitch-600/40 rounded-xl pl-8 pr-4 py-3 text-chalk-100 placeholder:text-chalk-400 focus:outline-none focus:border-grass-500/60 transition-colors font-mono"
            />
          </div>
          <p className="text-xs text-chalk-400 mt-1">Lowercase letters, numbers, underscores only</p>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={mode === 'join' ? handleJoin : handleLogin}
          disabled={loading || !username.trim() || (mode === 'join' && !name.trim())}
          className="btn-primary w-full text-base">
          {loading ? 'Please wait…' : mode === 'join' ? 'Join the game →' : 'Enter →'}
        </button>

        {mode === 'join' && (
          <p className="text-xs text-chalk-400 text-center">
            Already joined? Switch to <button onClick={() => setMode('login')} className="text-grass-400 underline">Login</button>
          </p>
        )}
      </div>
    </div>
  )
}