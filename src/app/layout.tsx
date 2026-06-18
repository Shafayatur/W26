import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WC26 · Ajke kar khela?',
  description: 'FIFA World Cup 2026 — Ajke kar khela?',
  themeColor: '#1478a7',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen pitch-bg">{children}</body>
    </html>
  )
}
