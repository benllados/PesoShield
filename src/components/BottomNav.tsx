'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { NAV_ITEMS, isActivePath } from '@/components/nav-items'
import { cn } from '@/components/ui'

/**
 * Persistent mobile navigation.
 *
 * The previous build dropped its navigation entirely below the desktop
 * breakpoint, which left phone users with no way between sections. All five
 * destinations stay visible here, each with an icon and a word, and the bar
 * clears the iOS home indicator via safe-area padding.
 */
export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="flex">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href)
          const Icon = item.icon

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-[3.5rem] flex-col items-center gap-1 py-2.5 text-[0.8125rem]',
                  active ? 'text-violet-deep' : 'text-ink-strong',
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-11 items-center justify-center rounded-full transition-colors duration-150',
                    active && 'bg-violet-soft',
                  )}
                >
                  <Icon size={22} />
                </span>
                <span className={cn(active && 'font-bold')}>{item.shortLabel}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
