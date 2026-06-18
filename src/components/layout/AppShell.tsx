import BottomNav from '@/components/layout/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto">
      <main className="flex-1 pb-24 px-4">{children}</main>
      <BottomNav />
    </div>
  )
}
