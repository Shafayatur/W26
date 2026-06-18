import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WC26 · Family Predictor',
  description: 'FIFA World Cup 2026 — Family prediction game',
  themeColor: '#0a1628',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen pitch-bg">{children}</body>
    </html>
  )
}
