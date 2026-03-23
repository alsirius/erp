import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Providers from '../components/Providers'
import { appConfig } from '../config/app-content'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: appConfig.app.title,
  description: appConfig.app.description,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
