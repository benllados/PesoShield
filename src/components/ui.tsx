/**
 * Design-system primitives.
 *
 * Sizes come straight from the handoff: 56px primary controls (48px in compact
 * contexts), 12px radius on controls, 16px on cards, 48px minimum touch target
 * on anything tappable. Focus rings are inherited from globals.css so every
 * control gets the same 3px ink ring.
 */
import Link from 'next/link'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

import {
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
  SpinnerIcon,
  type IconProps,
} from './icons'

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/* Buttons ------------------------------------------------------------------ */

type ButtonTone = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'lg' | 'md'

const TONE_STYLES: Record<ButtonTone, string> = {
  primary: 'bg-violet text-white hover:bg-violet-deep',
  secondary:
    'bg-surface text-violet-deep border-2 border-violet hover:bg-violet-soft',
  ghost: 'bg-transparent text-violet-deep underline underline-offset-4 hover:bg-violet-soft',
  danger: 'bg-surface text-red border-2 border-red hover:bg-red-soft',
}

const SIZE_STYLES: Record<ButtonSize, string> = {
  lg: 'h-14 px-7 text-[1.1875rem]',
  md: 'h-12 px-5 text-[1rem]',
}

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2.5 rounded-control font-bold ' +
  'transition-colors duration-150 disabled:cursor-not-allowed ' +
  'disabled:bg-disabled disabled:text-ink-subtle disabled:border-transparent'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ButtonTone
  size?: ButtonSize
  /** Shows a spinner and blocks input. Keep the label — never blank it out. */
  loading?: boolean
  full?: boolean
}

export function Button({
  tone = 'primary',
  size = 'lg',
  loading = false,
  full = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        BUTTON_BASE,
        TONE_STYLES[tone],
        SIZE_STYLES[size],
        full && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <SpinnerIcon size={22} className="animate-spin" /> : null}
      {children}
    </button>
  )
}

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  tone?: ButtonTone
  size?: ButtonSize
  full?: boolean
}

export function ButtonLink({
  href,
  tone = 'primary',
  size = 'lg',
  full = false,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  const classes = cn(
    BUTTON_BASE,
    TONE_STYLES[tone],
    SIZE_STYLES[size],
    full && 'w-full',
    className,
  )

  if (href.startsWith('http') || href.startsWith('mailto:')) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  )
}

/* Surfaces ----------------------------------------------------------------- */

export function Card({
  featured = false,
  padded = true,
  className,
  children,
  ...rest
}: {
  /** At most one per screen — marks the primary answer. */
  featured?: boolean
  padded?: boolean
  className?: string
  children: ReactNode
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-card border border-rule bg-surface shadow-card',
        featured && 'outline-2 -outline-offset-2 outline-violet',
        padded && 'p-6 sm:px-8',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

/** Header row inside a card: title on the left, an optional action on the right. */
export function CardHeader({
  title,
  meta,
  action,
  as: Tag = 'h2',
}: {
  title: ReactNode
  meta?: ReactNode
  action?: ReactNode
  as?: 'h1' | 'h2' | 'h3'
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <div>
        <Tag className="text-[1.375rem] font-bold">{title}</Tag>
        {meta ? <p className="mt-1 text-[0.9375rem] text-ink-muted">{meta}</p> : null}
      </div>
      {action}
    </div>
  )
}

/* Chips -------------------------------------------------------------------- */

export function Chip({
  active = false,
  className,
  children,
  ...rest
}: { active?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'inline-flex h-12 items-center gap-2 rounded-full border px-[1.125rem] text-base transition-colors duration-150',
        active
          ? 'border-violet-line bg-violet-soft font-bold text-violet-deep'
          : 'border-rule-field bg-surface text-ink-strong hover:bg-surface-sunk',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

/* Progress ----------------------------------------------------------------- */

export type ProgressTone = 'normal' | 'warning' | 'over'

const PROGRESS_FILL: Record<ProgressTone, string> = {
  normal: 'bg-violet',
  warning: 'bg-amber-bar',
  over: 'bg-red',
}

export function ProgressBar({
  percent,
  tone = 'normal',
  height = 20,
  label,
}: {
  percent: number
  tone?: ProgressTone
  height?: number
  /** Accessible name. The visible readout beside the bar usually repeats it. */
  label: string
}) {
  const clamped = Math.max(0, Math.min(100, percent))

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="w-full overflow-hidden rounded-full bg-track"
      style={{ height }}
    >
      <div
        className={cn('h-full rounded-full', PROGRESS_FILL[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

/* Callouts ----------------------------------------------------------------- */

export type CalloutTone = 'warning' | 'error' | 'success' | 'info'

const CALLOUT_STYLES: Record<
  CalloutTone,
  { box: string; text: string; icon: (p: IconProps) => React.ReactElement }
> = {
  warning: {
    box: 'bg-amber-soft border-amber-line',
    text: 'text-amber-deep',
    icon: AlertTriangleIcon,
  },
  error: {
    box: 'bg-red-soft border-red-line',
    text: 'text-red-deep',
    icon: AlertCircleIcon,
  },
  success: {
    box: 'bg-green-soft border-green-line',
    text: 'text-green-deep',
    icon: CheckCircleIcon,
  },
  info: {
    box: 'bg-violet-soft border-violet-line',
    text: 'text-[#3A3170]',
    icon: InfoIcon,
  },
}

/**
 * Every alert carries an icon, a title, and a concrete explanation — the
 * handoff forbids conveying state through colour alone. Errors announce
 * themselves; everything else is polite.
 */
export function Callout({
  tone,
  title,
  children,
  action,
  className,
}: {
  tone: CalloutTone
  title: ReactNode
  children?: ReactNode
  action?: ReactNode
  className?: string
}) {
  const style = CALLOUT_STYLES[tone]
  const Icon = style.icon

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex flex-col gap-3 rounded-card border p-4 sm:flex-row sm:items-start sm:gap-3.5 sm:px-6 sm:py-4.5',
        style.box,
        className,
      )}
    >
      <Icon size={24} className={cn('mt-0.5 shrink-0', style.text)} />
      <div className={cn('flex-1', style.text)}>
        <strong className="block text-[1.125rem]">{title}</strong>
        {children ? <div className="mt-1 text-[1.0625rem]">{children}</div> : null}
      </div>
      {action ? <div className="shrink-0 sm:self-center">{action}</div> : null}
    </div>
  )
}

/* Fields ------------------------------------------------------------------- */

/**
 * The label stays visible while typing — placeholders alone are not labels.
 * Errors sit under the field with an icon and a sentence, and are wired to the
 * control with aria-describedby by the caller.
 */
export function Field({
  label,
  hint,
  error,
  htmlFor,
  optional = false,
  children,
}: {
  label: ReactNode
  hint?: ReactNode
  error?: string | null
  htmlFor: string
  optional?: boolean
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-[1.0625rem] font-bold">
        {label}
        {optional ? <span className="font-normal text-ink-muted"> (opcional)</span> : null}
      </label>
      {children}
      {error ? (
        <p
          id={`${htmlFor}-error`}
          className="flex items-center gap-1.5 text-[1rem] font-bold text-red"
        >
          <AlertTriangleIcon size={18} className="shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-[0.9375rem] text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/** Shared input chrome so text fields, selects and the amount field all match. */
export const fieldShell =
  'flex h-14 w-full items-center gap-2.5 rounded-control border-2 bg-surface px-4 text-[1.0625rem]'

export function fieldBorder(hasError?: boolean): string {
  return hasError ? 'border-red bg-[#FFFBFA]' : 'border-rule-field'
}

/* Empty + loading ---------------------------------------------------------- */

/**
 * Empty states explain what is missing and offer the action that fixes it.
 * The handoff is explicit that a blank container is never acceptable.
 */
export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode
  title: ReactNode
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <span className="flex size-18 items-center justify-center rounded-full bg-surface-sunk text-ink-muted">
        {icon}
      </span>
      <strong className="text-[1.3125rem]">{title}</strong>
      {children ? (
        <p className="max-w-sm text-[1.0625rem] leading-relaxed text-ink-muted">{children}</p>
      ) : null}
      {action}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('h-5 rounded-md bg-track', className)} />
}

/** Money rendered with its currency code, per the design system. */
export function Money({
  children,
  code,
  className,
  codeClassName,
}: {
  children: ReactNode
  code: 'ARS' | 'USD'
  className?: string
  codeClassName?: string
}) {
  return (
    <span className={cn('tabular', className)}>
      {children}{' '}
      <span className={cn('font-normal text-ink-muted', codeClassName)}>{code}</span>
    </span>
  )
}
