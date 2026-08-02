'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { ShieldMark, UserIcon } from '@/components/icons'
import { NAV_ITEMS, isActivePath } from '@/components/nav-items'
import { cn } from '@/components/ui'
import { createClient } from '@/lib/supabase'

/**
 * The top bar.
 *
 * On desktop it carries the five destinations. On mobile the destinations move
 * to the bottom bar (see BottomNav) and this shrinks to the mark plus the
 * account control — navigation is never hidden behind the avatar.
 */
export function Header() {
  const pathname = usePathname()
  const [displayName, setDisplayName] = useState<string | null>(null)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url || !url.startsWith('http')) return

    const supabase = createClient()

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setDisplayName(user ? (user.user_metadata?.display_name ?? 'Mi cuenta') : null)
    }

    loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setDisplayName(
        session?.user ? (session.user.user_metadata?.display_name ?? 'Mi cuenta') : null,
      )
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-surface">
      <div className="mx-auto flex h-[4.5rem] max-w-[1160px] items-center gap-8 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 text-violet"
          aria-label="PesoShield, ir al inicio"
        >
          <ShieldMark size={28} />
          <span className="text-[1.3125rem] font-bold text-ink">PesoShield</span>
        </Link>

        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex gap-1.5">
            {NAV_ITEMS.map((item) => {
              const active = isActivePath(pathname, item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'block rounded-tile px-4 py-2.5 text-[1.0625rem] transition-colors duration-150',
                      active
                        ? 'bg-violet-soft font-bold text-violet-deep'
                        : 'text-ink-strong hover:bg-surface-sunk',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <Link
          href={displayName ? '/perfil' : '/login'}
          className="ml-auto flex h-12 shrink-0 items-center gap-2 rounded-tile border border-rule px-3.5 text-base text-ink-strong transition-colors duration-150 hover:bg-surface-sunk"
        >
          <UserIcon size={20} />
          <span className="max-w-[9rem] truncate">{displayName ?? 'Entrar'}</span>
        </Link>
      </div>
    </header>
  )
}
