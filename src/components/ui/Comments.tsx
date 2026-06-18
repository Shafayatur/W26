'use client'
import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Comment } from '@/types'
import { Send, Trash2 } from 'lucide-react'
import { formatBDTime } from '@/lib/time'

interface Props {
  predictionId: string
  comments: Comment[]
  currentUserId: string
}

export default function Comments({ predictionId, comments: initial, currentUserId }: Props) {
  const [comments, setComments] = useState<Comment[]>(initial)
  const [text, setText] = useState('')
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  const submit = () => {
    if (!text.trim() || isPending) return
    const trimmed = text.trim().slice(0, 200)
    setText('')
    startTransition(async () => {
      const { data } = await supabase
        .from('comments')
        .insert({ prediction_id: predictionId, user_id: currentUserId, text: trimmed })
        .select('*, profiles(name, avatar_emoji)')
        .single()
      if (data) setComments(prev => [...prev, data])
    })
  }

  const remove = (id: string) => {
    startTransition(async () => {
      setComments(prev => prev.filter(c => c.id !== id))
      await supabase.from('comments').delete().eq('id', id)
    })
  }

  return (
    <div className="mt-3 space-y-2">
      {comments.map(c => (
        <div key={c.id} className="flex gap-2 items-start">
          <span className="text-lg leading-none mt-0.5">{c.profiles?.avatar_emoji ?? '⚽'}</span>
          <div className="flex-1 bg-pitch-900/60 rounded-xl px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-chalk-300">{c.profiles?.name}</span>
              <span className="text-xs text-chalk-400">{formatBDTime(c.created_at)}</span>
            </div>
            <p className="text-sm text-chalk-200 mt-0.5">{c.text}</p>
          </div>
          {c.user_id === currentUserId && (
            <button onClick={() => remove(c.id)} className="text-chalk-400 hover:text-red-400 mt-1 transition-colors">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      ))}

      {/* Input */}
      <div className="flex gap-2 mt-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          maxLength={200}
          placeholder="Trash talk here… 😏"
          className="flex-1 bg-pitch-900/60 border border-pitch-600/40 rounded-xl px-3 py-2
                     text-sm text-chalk-100 placeholder:text-chalk-400 focus:outline-none
                     focus:border-grass-500/50 transition-colors"
        />
        <button
          onClick={submit}
          disabled={!text.trim() || isPending}
          className="btn-primary py-2 px-3"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  )
}
