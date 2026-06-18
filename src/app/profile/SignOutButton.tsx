'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()
  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }
  return (
    <button onClick={signOut} className="btn-ghost w-full flex items-center justify-center gap-2 text-red-400 border-red-500/20 hover:border-red-500/40">
      <LogOut size={16} /> Sign out
    </button>
  )
}
