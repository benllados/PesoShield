import type { Metadata, Viewport } from 'next'
import { Atkinson_Hyperlegible } from 'next/font/google'

import './globals.css'
import { BottomNav } from '@/components/BottomNav'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'

/**
 * Atkinson Hyperlegible, from the Braille Institute, is drawn to maximise the
 * difference between characters that are easy to confuse — 0/O, 1/l/I, 6/G.
 * That matters when the whole product is numbers. One family throughout;
 * hierarchy comes from size and weight, never from a second typeface.
 *
 * Self-hosted by next/font, so there is no render-blocking request to Google
 * and no flash of fallback text.
 */
const atkinson = Atkinson_Hyperlegible({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-atkinson',
})

export const metadata: Metadata = {
  title: 'PesoShield — Tu plata, clara y en orden',
  description:
    'Compañero de finanzas del hogar para familias argentinas. Presupuesto, movimientos y cotizaciones del dólar, explicados con claridad.',
}

export const viewport: Viewport = {
  themeColor: '#faf6ee',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={atkinson.variable}>
      {/* The bottom padding keeps the fixed mobile nav from covering the footer. */}
      <body
        className={`${atkinson.className} flex min-h-screen flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0`}
      >
        {/* First stop for keyboard and screen-reader users. */}
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-violet focus:px-5 focus:py-3 focus:font-bold focus:text-white"
        >
          Saltar al contenido
        </a>

        <Header />

        <main
          id="contenido"
          className="mx-auto w-full max-w-[1160px] flex-grow px-4 pb-12 pt-8 sm:px-6 md:pb-16 md:pt-10"
        >
          {children}
        </main>

        <Footer />
        <BottomNav />
      </body>
    </html>
  )
}
