/**
 * The icon family.
 *
 * One set, drawn on a 24x24 grid with 2px round-capped strokes, inheriting
 * colour from the surrounding text. This replaces the Material Symbols webfont
 * (which cost a render-blocking Google Fonts request) and the emoji that were
 * standing in for category icons — emoji render differently on every platform
 * and are announced unpredictably by screen readers.
 *
 * Icons are decorative by default: they sit next to a word that carries the
 * same meaning, so they are hidden from assistive tech. Pass a `title` only
 * when an icon genuinely stands alone.
 */
import type { SVGProps } from 'react'

import type { CategoryKey } from '@/lib/types'

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  /** Pixel size for both dimensions. Defaults to 24. */
  size?: number
  /** Supplying this exposes the icon to assistive tech with an accessible name. */
  title?: string
}

function Svg({ size = 24, title, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  )
}

/* Brand ------------------------------------------------------------------- */

/** The shield is the one place violet is used as a fill rather than an action. */
export function ShieldMark({ size = 28, title, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M12 3l7 2.6v5.6c0 4.6-3 7.7-7 9.3-4-1.6-7-4.7-7-9.3V5.6L12 3z"
        className="fill-violet-soft"
      />
      <path d="M9.3 12.2l2 2 3.6-3.9" />
    </svg>
  )
}

/* Navigation -------------------------------------------------------------- */

export const HomeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 11l9-7 9 7" />
    <path d="M5 10v9h14v-9" />
  </Svg>
)

export const CalendarIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
  </Svg>
)

export const ListIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <circle cx="4" cy="6" r="1" fill="currentColor" />
    <circle cx="4" cy="12" r="1" fill="currentColor" />
    <circle cx="4" cy="18" r="1" fill="currentColor" />
  </Svg>
)

export const ExchangeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h13l-3-3M20 17H7l3 3" />
  </Svg>
)

export const HelpIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.2a2.6 2.6 0 1 1 3.6 2.4c-.8.35-1.1.8-1.1 1.9" />
    <path d="M12 17h.01" />
  </Svg>
)

/* Status ------------------------------------------------------------------ */

export const AlertTriangleIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3L2.5 20h19L12 3z" />
    <path d="M12 10v4M12 17h.01" />
  </Svg>
)

export const AlertCircleIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5M12 16.5h.01" />
  </Svg>
)

export const CheckCircleIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.5l2.5 2.5L16 9.5" />
  </Svg>
)

export const InfoIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </Svg>
)

export const ClockIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
)

/** Spinner geometry only — callers add the spin animation. */
export const SpinnerIcon = (p: IconProps) => (
  <Svg strokeWidth={2.4} {...p}>
    <path d="M12 3a9 9 0 1 0 9 9" />
  </Svg>
)

/* Movement ---------------------------------------------------------------- */

export const ArrowUpIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </Svg>
)

export const ArrowDownIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </Svg>
)

export const TrendUpIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M15 7h6v6" />
  </Svg>
)

export const TrendDownIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 7l6 6 4-4 8 8" />
    <path d="M15 17h6v-6" />
  </Svg>
)

/* Controls ---------------------------------------------------------------- */

export const PlusIcon = (p: IconProps) => (
  <Svg strokeWidth={2.2} {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
)

export const CloseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
)

export const CheckIcon = (p: IconProps) => (
  <Svg strokeWidth={2.2} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
)

export const ChevronDownIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 9l6 6 6-6" />
  </Svg>
)

export const ChevronUpIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M18 15l-6-6-6 6" />
  </Svg>
)

export const ChevronLeftIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15 6l-6 6 6 6" />
  </Svg>
)

export const ChevronRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
)

export const SearchIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M16.5 16.5L21 21" />
  </Svg>
)

export const FilterIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 5h16M7 12h10M10 19h4" />
  </Svg>
)

export const PencilIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1z" />
  </Svg>
)

export const TableIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 10h18M9 5v14" />
  </Svg>
)

export const SendIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 12l18-8-6 18-3.5-7L3 12z" />
  </Svg>
)

export const HeartIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 20s-7-4.6-9.2-9A5.2 5.2 0 0 1 12 6.7 5.2 5.2 0 0 1 21.2 11C19 15.4 12 20 12 20z" />
  </Svg>
)

export const WhatsAppIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M21 12a9 9 0 1 0-3.4 7L21 21l-1.3-3.7A8.9 8.9 0 0 0 21 12z" />
  </Svg>
)

export const UserIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
  </Svg>
)

export const BanknoteIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.5" y="7" width="19" height="10" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
  </Svg>
)

/* Budget categories ------------------------------------------------------- */

export const CartIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 7h14l-1.2 12.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 7z" />
    <path d="M8.5 7a3.5 3.5 0 0 1 7 0" />
  </Svg>
)

export const BoltIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M13 3l-8 11h6l-1 7 8-11h-6l1-7z" />
  </Svg>
)

export const BusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 16l3-8a2 2 0 0 1 2-1.3h8A2 2 0 0 1 18 8l3 8" />
    <rect x="3" y="16" width="18" height="4" rx="1.5" />
    <path d="M7 20v1.5M17 20v1.5" />
  </Svg>
)

export const PillIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3a4 4 0 0 1 4 4v2h2l1 11H5L6 9h2V7a4 4 0 0 1 4-4z" />
    <path d="M9 13h6" />
  </Svg>
)

export const BoxIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="8" width="18" height="12" rx="2" />
    <path d="M8 8V6a4 4 0 0 1 8 0v2M12 13v3" />
  </Svg>
)

/** Every budget category resolves to exactly one icon. */
export const CATEGORY_ICONS: Record<CategoryKey, (p: IconProps) => React.ReactElement> = {
  alimentos: CartIcon,
  servicios: BoltIcon,
  transporte: BusIcon,
  salud: PillIcon,
  otros: BoxIcon,
}
