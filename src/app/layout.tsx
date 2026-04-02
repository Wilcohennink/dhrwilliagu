import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import { Sidebar } from '@/components/sidebar'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Wiliagu Holding — Command Center',
  description: 'AI-gestuurd holding dashboard voor alle bedrijven',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex">
        <Sidebar />
        <main className="flex-1 ml-60 min-h-screen p-6">
          {children}
        </main>
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  )
}
