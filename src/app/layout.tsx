import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'
import MainLayout from '@/components/main-layout'

const montserrat = Montserrat({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-montserrat',
})

export const metadata: Metadata = {
  title: 'RAG Assistant - AI-Powered Knowledge Base',
  description: 'AI-powered RAG chatbot with PostgreSQL vector storage for intelligent document search and retrieval',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} font-sans`}>
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  )
}