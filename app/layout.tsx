// app/layout.tsx
import './globals.css'  

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sarqyn Food',
  description: 'Спасай еду со скидкой до 70%',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}