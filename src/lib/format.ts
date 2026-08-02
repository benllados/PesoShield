/**
 * Number, money and date formatting.
 *
 * Two rules from the design system are enforced here rather than left to each
 * call site:
 *
 *   1. Argentine convention — "." groups thousands, "," marks decimals.
 *   2. Money is never just "$". The currency is always named, so ARS and USD
 *      can't be confused. The helpers return the symbol; callers render the
 *      code (ARS / USD) alongside it.
 *
 * Everything date-related resolves in Buenos Aires time. The people using this
 * are there, and "today" has to mean their today regardless of where the
 * server runs.
 */
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'

export const AR_TIME_ZONE = 'America/Argentina/Buenos_Aires'

/** U+2212. A real minus sign, not a hyphen — it aligns with digits. */
export const MINUS = '−'

const numberFormatters = new Map<number, Intl.NumberFormat>()

function numberFormatter(decimals: number): Intl.NumberFormat {
  let formatter = numberFormatters.get(decimals)
  if (!formatter) {
    formatter = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
    numberFormatters.set(decimals, formatter)
  }
  return formatter
}

/** 1240000 -> "1.240.000" */
export function formatNumber(value: number, decimals = 0): string {
  return numberFormatter(decimals).format(value)
}

/** 1240000 -> "$ 1.240.000". Render "ARS" next to it. */
export function formatARS(value: number, decimals = 0): string {
  return `$ ${formatNumber(value, decimals)}`
}

/** 500 -> "US$ 500". Render "USD" next to it. */
export function formatUSD(value: number, decimals = 0): string {
  return `US$ ${formatNumber(value, decimals)}`
}

/**
 * Signed amounts for transaction lists: "+ $ 890.000" / "− $ 48.300".
 * The sign is a second signal alongside the word and the icon, so colour is
 * never doing the work on its own.
 */
export function formatSignedARS(value: number, decimals = 0): string {
  const sign = value < 0 ? MINUS : '+'
  return `${sign} ${formatARS(Math.abs(value), decimals)}`
}

/** Rates carry two decimals when they have them, none when they don't. */
export function formatRate(value: number): string {
  return formatARS(value, Number.isInteger(value) ? 0 : 2)
}

/** 4.13 -> "4,1%" */
export function formatPercent(value: number, decimals = 1): string {
  return `${formatNumber(value, decimals)}%`
}

/** Whole-number percentage for progress readouts: 66 -> "66%" */
export function formatWholePercent(value: number): string {
  return `${Math.round(value)}%`
}

/* Dates -------------------------------------------------------------------- */

/** "2026-08-01" for today in Buenos Aires. */
export function todayISO(now: Date = new Date()): string {
  return formatInTimeZone(now, AR_TIME_ZONE, 'yyyy-MM-dd')
}

/** "2026-08" for the current month in Buenos Aires. */
export function currentMonthKey(now: Date = new Date()): string {
  return formatInTimeZone(now, AR_TIME_ZONE, 'yyyy-MM')
}

/** "10:32" in Buenos Aires. */
export function formatTime(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return formatInTimeZone(date, AR_TIME_ZONE, 'HH:mm')
}

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const

/** "2026-08" -> "Agosto 2026" */
export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  const name = MONTHS[(month ?? 1) - 1] ?? ''
  return `${name} ${year}`
}

/** "2026-08" -> "agosto", for use mid-sentence. */
export function monthName(monthKey: string): string {
  const month = Number(monthKey.split('-')[1])
  return (MONTHS[month - 1] ?? '').toLowerCase()
}

/** Shifts a month key by whole months: ("2026-08", -1) -> "2026-07" */
export function shiftMonth(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split('-').map(Number)
  const base = new Date(Date.UTC(year, month - 1 + delta, 1))
  return `${base.getUTCFullYear()}-${String(base.getUTCMonth() + 1).padStart(2, '0')}`
}

/** Days remaining in the given month, counting from today. Zero once it's past. */
export function daysLeftInMonth(monthKey: string, now: Date = new Date()): number {
  const today = todayISO(now)
  if (!today.startsWith(monthKey)) return 0

  const [year, month] = monthKey.split('-').map(Number)
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const dayOfMonth = Number(today.split('-')[2])
  return Math.max(0, daysInMonth - dayOfMonth)
}

/** "2026-07-28" -> "28 de julio" */
export function formatDayAndMonth(iso: string): string {
  const [, month, day] = iso.split('-').map(Number)
  return `${day} de ${(MONTHS[month - 1] ?? '').toLowerCase()}`
}

/**
 * Day headings for the transaction list: "Hoy · viernes 1 de agosto".
 * Recent days get a plain-language prefix, older ones just read as a date.
 */
export function formatDayGroup(iso: string, now: Date = new Date()): string {
  const today = todayISO(now)
  const yesterday = todayISO(new Date(toZonedTime(now, AR_TIME_ZONE).getTime() - 86_400_000))

  const weekday = formatInTimeZone(new Date(`${iso}T12:00:00Z`), 'UTC', 'EEEE')
  const weekdayEs = WEEKDAYS[weekday] ?? ''
  const dayAndMonth = formatDayAndMonth(iso)

  if (iso === today) return `Hoy · ${weekdayEs} ${dayAndMonth}`
  if (iso === yesterday) return `Ayer · ${weekdayEs} ${dayAndMonth}`
  return `${weekdayEs.charAt(0).toUpperCase()}${weekdayEs.slice(1)} ${dayAndMonth}`
}

const WEEKDAYS: Record<string, string> = {
  Monday: 'lunes',
  Tuesday: 'martes',
  Wednesday: 'miércoles',
  Thursday: 'jueves',
  Friday: 'viernes',
  Saturday: 'sábado',
  Sunday: 'domingo',
}

/** "hoy" / "ayer" / "28 de julio" — the compact form used in dense lists. */
export function formatRelativeDay(iso: string, now: Date = new Date()): string {
  const today = todayISO(now)
  const yesterday = todayISO(new Date(toZonedTime(now, AR_TIME_ZONE).getTime() - 86_400_000))

  if (iso === today) return 'hoy'
  if (iso === yesterday) return 'ayer'
  return formatDayAndMonth(iso)
}

/** "Actualizado hoy a las 10:32" / "Actualizado ayer a las 18:40" */
export function formatUpdatedAt(value: Date | string, now: Date = new Date()): string {
  const date = typeof value === 'string' ? new Date(value) : value
  const iso = formatInTimeZone(date, AR_TIME_ZONE, 'yyyy-MM-dd')
  const time = formatTime(date)
  const relative = formatRelativeDay(iso, now)

  return relative === 'hoy' || relative === 'ayer'
    ? `${relative} a las ${time}`
    : `el ${relative} a las ${time}`
}

/**
 * Data older than this is flagged as stale, with the exact time it came from.
 *
 * The design specified one hour. In practice the rate feeds only publish while
 * the market is open, so an hour would raise a warning every evening and all
 * weekend — and a banner that is always on stops being read. Twelve hours flags
 * genuinely stale data instead. The exact timestamp is shown next to the rates
 * either way, so the freshness is never hidden, only the alarm is rationed.
 */
export const STALE_AFTER_MS = 12 * 60 * 60 * 1000

export function isStale(value: Date | string, now: Date = new Date()): boolean {
  const date = typeof value === 'string' ? new Date(value) : value
  return now.getTime() - date.getTime() > STALE_AFTER_MS
}
