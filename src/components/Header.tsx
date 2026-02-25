'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/presupuesto', label: 'Presupuesto' },
  { href: '/simulador', label: 'Simulador' },
  { href: '/historial', label: 'Historial' },
  { href: '/movimientos', label: 'Movimientos' },
  { href: '/ayuda', label: 'Ayuda' },
]

export function Header() {
  const pathname = usePathname()

  return (
    <header className="w-full bg-surface border-b border-border sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-primary text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              shield_moon
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              PesoShield
            </h1>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-lg font-medium px-1 py-1 transition-colors ${
                  pathname === link.href
                    ? 'text-primary font-bold border-b-2 border-primary'
                    : 'text-text-secondary hover:text-primary'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Profile Avatar */}
          <div className="w-12 h-12 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
            <span className="material-symbols-outlined text-slate-400 text-2xl">
              person
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
