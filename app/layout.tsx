import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'S3 File Manager',
  description: 'Simple file manager for AWS S3',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}


