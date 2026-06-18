'use client'
import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Reaction } from '@/types'

const EMOJIS = ['😂', '🔥', '😬', '🤦', '👏', '😤', '💀', '🎯']

interface Props {
  predictionId: string
  reactions: Reaction[]
  currentUserId: string
}

export default function Reactions({ predictionId, reactions, currentUserId }: Props) {
  const [localReactions, setLocalReactions] = useState<Reaction[]>(reactions)
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  // Group by emoji with counts
  const grouped = EMOJIS.map(emoji => ({
    emoji,
    count: localReactions.filter(r => r.emoji === emoji).length,
    hasReacted: localReactions.some(r => r.emoji === emoji && r.user_id === currentUserId),
  }))

  const toggle = (emoji: string) => {
    const existing = localReactions.find(r => r.emoji === emoji && r.user_id === currentUserId)

    startTransition(async () => {
      if (existing) {
        setLocalReactions(prev => prev.filter(r => r.id !== existing.id))
        await supabase.from('reactions').delete().eq('id', existing.id)
      } else {
        const tempId = `temp-${Date.now()}`
        const optimistic: Reaction = {
          id: tempId,
          prediction_id: predictionId,
          user_id: currentUserId,
          emoji,
          created_at: new Date().toISOString(),
        }
        setLocalReactions(prev => [...prev, optimistic])
        const { data } = await supabase
          .from('reactions')
          .insert({ prediction_id: predictionId, user_id: currentUserId, emoji })
          .select()
          .single()
        if (data) {
          setLocalReactions(prev => prev.map(r => r.id === tempId ? data : r))
        }
      }
    })
  }

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {grouped.map(({ emoji, count, hasReacted }) => (
        <button
          key={emoji}
          onClick={() => toggle(emoji)}
          disabled={isPending}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-all
            ${hasReacted
              ? 'bg-grass-500/20 border border-grass-500/40 text-grass-300'
              : 'bg-pitch-700/60 border border-pitch-600/40 text-chalk-400 hover:border-pitch-500'
            }`}
        >
          <span>{emoji}</span>
          {count > 0 && <span className="text-xs font-medium">{count}</span>}
        </button>
      ))}
    </div>
  )
}
