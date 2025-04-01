import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/components/auth-provider'
import { Montserrat, Inter } from 'next/font/google'

// Initialize the fonts
const montserrat = Montserrat({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
})

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Duval Asphalt | Order Online',
  description: 'Order asphalt products online with pre-authorization payment model',
  generator: 'Next.js',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${montserrat.variable} ${inter.variable}`}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
