import { getTransactions } from './transactions'
import { BUDGET_CATEGORIES, type CategoryKey } from './types'

/**
 * Budget storage.
 *
 * Plans are kept per month. The previous version stored a single global plan,
 * which made the month selector dishonest — moving to July would have shown
 * August's numbers. Legacy data is migrated into the month it was written for
 * the first time it is read, so nobody loses a plan they already entered.
 */
const PLANNED_KEY = 'pesoshield-budget-planned-v2'
const LEGACY_PLANNED_KEY = 'pesoshield-budget-planned'

export type PlannedByCategory = Record<CategoryKey, number>
type PlannedByMonth = Record<string, PlannedByCategory>

export function emptyPlan(): PlannedByCategory {
  return Object.fromEntries(BUDGET_CATEGORIES.map((c) => [c.key, 0])) as PlannedByCategory
}

/** Fills in any category missing from stored data, so new categories appear. */
function normalise(raw: Partial<Record<string, number>> | undefined): PlannedByCategory {
  const plan = emptyPlan()
  if (!raw) return plan
  for (const key of Object.keys(plan) as CategoryKey[]) {
    const value = raw[key]
    if (typeof value === 'number' && Number.isFinite(value)) plan[key] = value
  }
  return plan
}

function readAll(): PlannedByMonth {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(PLANNED_KEY)
    return raw ? (JSON.parse(raw) as PlannedByMonth) : {}
  } catch {
    return {}
  }
}

/**
 * Moves a pre-month-aware plan into the given month, once. Returns the
 * migrated plan if there was one.
 */
function migrateLegacy(monthKey: string): PlannedByCategory | null {
  if (typeof window === 'undefined') return null
  try {
    const legacy = localStorage.getItem(LEGACY_PLANNED_KEY)
    if (!legacy) return null

    const plan = normalise(JSON.parse(legacy) as Record<string, number>)
    const all = readAll()
    all[monthKey] = plan
    localStorage.setItem(PLANNED_KEY, JSON.stringify(all))
    localStorage.removeItem(LEGACY_PLANNED_KEY)
    return plan
  } catch {
    return null
  }
}

export function getPlannedBudget(monthKey: string): PlannedByCategory {
  if (typeof window === 'undefined') return emptyPlan()

  const all = readAll()
  if (all[monthKey]) return normalise(all[monthKey])

  const migrated = migrateLegacy(monthKey)
  return migrated ?? emptyPlan()
}

export function savePlannedBudget(monthKey: string, plan: PlannedByCategory): void {
  if (typeof window === 'undefined') return
  const all = readAll()
  all[monthKey] = plan
  localStorage.setItem(PLANNED_KEY, JSON.stringify(all))
}

/**
 * Every stored plan, keyed by month. Used by the data export, which has to
 * carry all of someone's history rather than whichever month is on screen.
 */
export function getAllPlannedBudgets(): PlannedByMonth {
  return readAll()
}

/** True once any category in any month has a number in it. */
export function hasAnyPlan(): boolean {
  const all = readAll()
  return Object.values(all).some((plan) =>
    Object.values(plan ?? {}).some((value) => value > 0),
  )
}

/* Derived from transactions ------------------------------------------------ */

export function getSpentByCategory(monthKey: string): PlannedByCategory {
  const spent = emptyPlan()

  for (const tx of getTransactions()) {
    if (tx.type === 'gasto' && tx.date.startsWith(monthKey)) {
      spent[tx.category] = (spent[tx.category] ?? 0) + tx.amount
    }
  }

  return spent
}

export interface MonthTotals {
  income: number
  spent: number
  /** Income minus spending — what actually stayed. */
  available: number
  transactionCount: number
}

export function getMonthTotals(monthKey: string): MonthTotals {
  let income = 0
  let spent = 0
  let transactionCount = 0

  for (const tx of getTransactions()) {
    if (!tx.date.startsWith(monthKey)) continue
    transactionCount += 1
    if (tx.type === 'ingreso') income += tx.amount
    else spent += tx.amount
  }

  return { income, spent, available: income - spent, transactionCount }
}

/* Category status ---------------------------------------------------------- */

export type CategoryStatus = 'normal' | 'near' | 'over'

/** Warn at 85% of plan, flag as exceeded past 100% — the handoff's thresholds. */
export const NEAR_LIMIT_THRESHOLD = 85

export function categoryStatus(planned: number, spent: number): CategoryStatus {
  if (planned <= 0) return 'normal'
  const percent = (spent / planned) * 100
  if (percent > 100) return 'over'
  if (percent >= NEAR_LIMIT_THRESHOLD) return 'near'
  return 'normal'
}

export interface BudgetLine {
  category: CategoryKey
  label: string
  planned: number
  spent: number
  remaining: number
  percent: number
  status: CategoryStatus
}

export function buildBudgetLines(
  planned: PlannedByCategory,
  spent: PlannedByCategory,
): BudgetLine[] {
  return BUDGET_CATEGORIES.map((category) => {
    const plannedAmount = planned[category.key] ?? 0
    const spentAmount = spent[category.key] ?? 0

    return {
      category: category.key,
      label: category.label,
      planned: plannedAmount,
      spent: spentAmount,
      remaining: plannedAmount - spentAmount,
      percent: plannedAmount > 0 ? (spentAmount / plannedAmount) * 100 : 0,
      status: categoryStatus(plannedAmount, spentAmount),
    }
  })
}
