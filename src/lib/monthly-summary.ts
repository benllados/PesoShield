import { type BudgetLine, getMonthTotals, getSpentByCategory } from './budget'
import {
  currentMonthKey,
  daysLeftInMonth,
  formatARS,
  formatWholePercent,
  monthName,
  shiftMonth,
  todayISO,
} from './format'
import { BUDGET_CATEGORIES } from './types'

/**
 * The monthly summary.
 *
 * Deliberately deterministic: the same inputs always produce the same words.
 * This replaced a model-generated report, because a summary of someone's money
 * that quietly rephrases itself on every visit is hard to trust and impossible
 * to check. Every sentence below is derived arithmetic, and every figure in it
 * is one the user can find elsewhere on the page.
 */

/** Below this, there isn't enough of a month to describe honestly. */
export const MIN_TRANSACTIONS = 3

export interface SummaryStat {
  label: string
  value: string
  /** Colours the value where the design calls for it. */
  tone?: 'positive' | 'negative'
  /** Only the month-over-month comparison carries a direction arrow. */
  trend?: 'up' | 'down'
}

export interface SummaryAction {
  label: string
  href: string
}

export type MonthlySummary =
  | {
      ready: false
      /** What is still missing, phrased for the user. */
      reason: string
      needsPlan: boolean
      transactionCount: number
    }
  | {
      ready: true
      stats: SummaryStat[]
      highlights: string[]
      actions: SummaryAction[]
    }

function largestCategory(lines: BudgetLine[], totalSpent: number) {
  const ranked = [...lines].sort((a, b) => b.spent - a.spent)
  const top = ranked[0]
  if (!top || top.spent <= 0 || totalSpent <= 0) return null
  return { label: top.label, share: (top.spent / totalSpent) * 100 }
}

/**
 * The previous month, with enough context to decide whether comparing against
 * it is meaningful. A month containing two stray movements is not a baseline —
 * comparing to it produces figures like "3787% más", which is arithmetically
 * true and completely useless.
 */
function previousMonth(monthKey: string) {
  const key = shiftMonth(monthKey, -1)
  const spent = getSpentByCategory(key)
  const total = Object.values(spent).reduce((sum, value) => sum + value, 0)

  return {
    key,
    total,
    comparable: getMonthTotals(key).transactionCount >= MIN_TRANSACTIONS && total > 0,
  }
}

/**
 * Days that have to elapse before a daily-average projection means anything.
 * Extrapolating a whole month from day one turns a single large bill into a
 * catastrophic forecast.
 */
const MIN_DAYS_FOR_PROJECTION = 7

/** Short category name for sentences — "Servicios (luz, gas, agua)" is a mouthful. */
function shortLabel(line: BudgetLine): string {
  const category = BUDGET_CATEGORIES.find((c) => c.key === line.category)
  return category ? category.label.split(' (')[0] : line.label
}

export function buildMonthlySummary(
  monthKey: string,
  lines: BudgetLine[],
  now: Date = new Date(),
): MonthlySummary {
  const totals = getMonthTotals(monthKey)
  const totalPlanned = lines.reduce((sum, line) => sum + line.planned, 0)
  const totalSpent = lines.reduce((sum, line) => sum + line.spent, 0)

  const needsPlan = totalPlanned <= 0
  const tooFewTransactions = totals.transactionCount < MIN_TRANSACTIONS

  if (needsPlan || tooFewTransactions) {
    const parts: string[] = []
    if (needsPlan) parts.push('tu presupuesto')
    if (tooFewTransactions) {
      parts.push(
        `al menos ${MIN_TRANSACTIONS} movimientos de ${monthName(monthKey)}` +
          ` (tenés ${totals.transactionCount})`,
      )
    }

    return {
      ready: false,
      reason: `Para calcularlo necesitamos ${parts.join(' y ')}.`,
      needsPlan,
      transactionCount: totals.transactionCount,
    }
  }

  const isCurrentMonth = monthKey === currentMonthKey(now)
  const daysLeft = daysLeftInMonth(monthKey, now)
  const dayOfMonth = isCurrentMonth ? Number(todayISO(now).split('-')[2]) : 0

  /* Stats ------------------------------------------------------------------ */

  const top = largestCategory(lines, totalSpent)
  const inPlan = lines.filter((line) => line.planned > 0 && line.status !== 'over').length
  const planned = lines.filter((line) => line.planned > 0).length
  const previous = previousMonth(monthKey)

  const stats: SummaryStat[] = [
    { label: 'Ingresos', value: `${formatARS(totals.income)} ARS` },
    { label: 'Gastos', value: `${formatARS(totalSpent)} ARS` },
    {
      label: isCurrentMonth ? 'Ahorrado hasta hoy' : 'Ahorrado',
      value: `${totals.available >= 0 ? '+ ' : '− '}${formatARS(Math.abs(totals.available))} ARS`,
      tone: totals.available >= 0 ? 'positive' : 'negative',
    },
  ]

  if (top) {
    stats.push({
      label: 'Categoría mayor',
      value: `${top.label.split(' (')[0]} (${formatWholePercent(top.share)})`,
    })
  }

  if (planned > 0) {
    stats.push({
      label: 'Cumplimiento del plan',
      value: `${inPlan} de ${planned} categorías en plan`,
    })
  }

  if (previous.comparable) {
    const change = ((totalSpent - previous.total) / previous.total) * 100
    const spentLess = change < 0
    stats.push({
      label: `Contra ${monthName(previous.key)}`,
      value: `Gastaste ${formatWholePercent(Math.abs(change))} ${spentLess ? 'menos' : 'más'}`,
      tone: spentLess ? 'positive' : 'negative',
      trend: spentLess ? 'down' : 'up',
    })
  }

  /* Highlights ------------------------------------------------------------- */

  const highlights: string[] = []

  // 1. Where the month is heading, at the pace set so far — but only once
  //    enough of it has happened for a pace to exist.
  if (isCurrentMonth && dayOfMonth >= MIN_DAYS_FOR_PROJECTION && daysLeft > 0) {
    const dailyRate = totalSpent / dayOfMonth
    const projectedSpend = dailyRate * (dayOfMonth + daysLeft)
    const projected = totals.income - projectedSpend

    highlights.push(
      projected >= 0
        ? `Vas camino a terminar ${monthName(monthKey)} con unos ${formatARS(
            Math.round(projected / 1000) * 1000,
          )} ARS a favor si mantenés el ritmo actual.`
        : `Si mantenés el ritmo actual, ${monthName(monthKey)} termina con unos ${formatARS(
            Math.round(Math.abs(projected) / 1000) * 1000,
          )} ARS de más gastados que ingresados.`,
    )
  } else if (isCurrentMonth) {
    // Too early to forecast; report what has actually happened instead.
    highlights.push(
      totals.available >= 0
        ? `Hasta ahora llevás ${formatARS(totals.available)} ARS a favor en ${monthName(monthKey)}.`
        : `Hasta ahora llevás ${formatARS(Math.abs(totals.available))} ARS gastados de más en ${monthName(monthKey)}.`,
    )
  } else {
    highlights.push(
      totals.available >= 0
        ? `${monthName(monthKey).replace(/^./, (c) => c.toUpperCase())} cerró con ${formatARS(
            totals.available,
          )} ARS a favor.`
        : `${monthName(monthKey).replace(/^./, (c) => c.toUpperCase())} cerró con ${formatARS(
            Math.abs(totals.available),
          )} ARS gastados de más.`,
    )
  }

  // 2. Anything that has already gone past its plan, with the exact overage.
  for (const line of lines.filter((l) => l.status === 'over')) {
    highlights.push(
      `${shortLabel(line)} ya se pasó ${formatARS(Math.abs(line.remaining))} ARS del plan.`,
    )
  }

  // 3. Anything close to its limit, with the time still to cover.
  for (const line of lines.filter((l) => l.status === 'near')) {
    // Floored: a category that is close to plan but not over must not read
    // as "100% del plan", which would contradict the row above it.
    const percent = Math.floor(line.percent)
    highlights.push(
      daysLeft > 0
        ? `${shortLabel(line)} está al ${percent}% del plan y todavía quedan ${daysLeft} días.`
        : `${shortLabel(line)} terminó al ${percent}% del plan.`,
    )
  }

  /* Actions ---------------------------------------------------------------- */

  const actions: SummaryAction[] = []
  const over = lines.find((line) => line.status === 'over')
  const near = lines.find((line) => line.status === 'near')

  if (over) actions.push({ label: `Ajustar plan de ${shortLabel(over)}`, href: '#por-categoria' })
  if (near) {
    actions.push({
      label: `Ver gastos de ${shortLabel(near)}`,
      href: `/movimientos?categoria=${near.category}`,
    })
  }

  return { ready: true, stats, highlights, actions }
}
