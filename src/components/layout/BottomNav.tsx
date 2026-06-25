'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, Target, Users, Trophy, User, GitBranch, Swords, Medal, BarChart2, Megaphone } from 'lucide-react'
import clsx from 'clsx'
import { useState, useRef, useEffect } from 'react'


const NAV_MAIN = [
  { href: '/fixtures', label: 'Fixtures', icon: CalendarDays },
  { href: '/bracket', label: 'Bracket', icon: GitBranch },
  { href: '/predict', label: 'Predict', icon: Target },
  { href: '/tournament', label: 'Trophies', icon: Trophy },
  { href: '/profile', label: 'Me', icon: User },
]

const NAV_MORE = [
  { href: '/groups', label: 'Groups', icon: Users },
  { href: '/daily', label: 'Daily', icon: Medal },
  { href: '/h2h', label: 'H2H', icon: Swords },
  { href: '/recap', label: 'Recap', icon: BarChart2 },
  { href: '/announcements', label: 'News', icon: Megaphone },
]

export default function BottomNav() {
  const pathname = usePathname()
  const isOnMorePage = NAV_MORE.some(n => pathname === n.href || pathname.startsWith(n.href + '/'))
  const [page, setPage] = useState(isOnMorePage ? 1 : 0)
  const touchStartX = useRef<number | null>(null)

  // Auto-switch page when navigating directly to a route on either nav
  useEffect(() => {
    const onMore = NAV_MORE.some(n => pathname === n.href || pathname.startsWith(n.href + '/'))
    const onMain = NAV_MAIN.some(n => pathname === n.href || pathname.startsWith(n.href + '/'))
    if (onMore) setPage(1)
    else if (onMain) setPage(0)
  }, [pathname])

  const currentNav = page === 0 ? NAV_MAIN : NAV_MORE

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 70) {
      if (diff > 0) setPage(1)  // swipe left → more
      else setPage(0)            // swipe right → main
    }
    touchStartX.current = null
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-pitch-800/95 backdrop-blur-md border-t border-pitch-600/40 pb-safe"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe indicator dots — clickable for desktop */}
      <div className="flex justify-center gap-1.5 pt-1.5">
        <button onClick={() => setPage(0)}
          className={clsx('h-1.5 rounded-full transition-all duration-300',
            page === 0 ? 'bg-grass-400 w-3' : 'bg-pitch-600 w-1.5')} />
        <button onClick={() => setPage(1)}
          className={clsx('h-1.5 rounded-full transition-all duration-300',
            page === 1 ? 'bg-grass-400 w-3' : 'bg-pitch-600 w-1.5')} />
      </div>

      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1">
        {currentNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
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