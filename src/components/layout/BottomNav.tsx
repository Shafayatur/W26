'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, Trophy, Target, GitBranch, User, Users } from 'lucide-react'
import clsx from 'clsx'

const NAV_ITEMS = [
  { href: '/fixtures', label: 'Fixtures', icon: CalendarDays },
  { href: '/predict', label: 'Predict', icon: Target },
  { href: '/groups', label: 'Groups', icon: Users },
  { href: '/profile', label: 'Me', icon: User },
]

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-pitch-800/95 backdrop-blur-md border-t border-pitch-600/40 pb-safe">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href} className={clsx('nav-link', active && 'nav-link-active')}>
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
