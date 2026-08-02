/**
 * The five destinations, defined once so the desktop bar and the mobile bottom
 * bar can never drift apart.
 *
 * Five is the whole map — there are no hidden sections and nothing lives behind
 * the avatar. Rate history sits inside Convertir, and the monthly summary sits
 * inside Mi mes, rather than becoming destinations of their own.
 */
import type { ReactElement } from 'react'

import {
  CalendarIcon,
  ExchangeIcon,
  HelpIcon,
  HomeIcon,
  ListIcon,
  type IconProps,
} from './icons'

export interface NavItem {
  href: string
  label: string
  /** Fits the 5-up mobile bar, where "Movimientos" would wrap. */
  shortLabel: string
  icon: (props: IconProps) => ReactElement
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', label: 'Inicio', shortLabel: 'Inicio', icon: HomeIcon },
  { href: '/mi-mes', label: 'Mi mes', shortLabel: 'Mi mes', icon: CalendarIcon },
  {
    href: '/movimientos',
    label: 'Movimientos',
    shortLabel: 'Movim.',
    icon: ListIcon,
  },
  { href: '/convertir', label: 'Convertir', shortLabel: 'Convertir', icon: ExchangeIcon },
  { href: '/ayuda', label: 'Ayuda', shortLabel: 'Ayuda', icon: HelpIcon },
]

/** Marks the active tab, treating "/" as exact so it isn't always on. */
export function isActivePath(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}
