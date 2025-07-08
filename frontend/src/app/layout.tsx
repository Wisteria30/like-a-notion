import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import MainLayout from '@/components/layout/MainLayout'
import '../styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Like a Notion',
  description: 'A Notion-like collaborative workspace',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <MainLayout>
          {children}
        </MainLayout>
      </body>
    </html>
  )
}