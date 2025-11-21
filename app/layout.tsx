import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ChewTube - Video plays while you chew',
  description: 'Video plays only while chewing is detected using face detection',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-white">{children}</body>
    </html>
  )
}

