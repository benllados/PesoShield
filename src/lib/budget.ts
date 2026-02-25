import { BUDGET_CATEGORIES, type CategoryKey } from './types'
import { getTransactions } from './transactions'

const PLANNED_KEY = 'pesoshield-budget-planned'

function defaultPlanned(): Record<CategoryKey, number> {
  return Object.fromEntries(
    BUDGET_CATEGORIES.map((c) => [c.key, 0])
  ) as Record<CategoryKey, number>
}

export function getPlannedBudget(): Record<CategoryKey, number> {
  if (typeof window === 'undefined') return defaultPlanned()
  try {
    const raw = localStorage.getItem(PLANNED_KEY)
    if (!raw) return defaultPlanned()
    const parsed = JSON.parse(raw) as Record<string, number>
    // Merge with defaults so new categories are always present
    const result = defaultPlanned()
    for (const key of Object.keys(result)) {
      if (key in parsed) {
        result[key as CategoryKey] = parsed[key]
      }
    }
    return result
  } catch {
    return defaultPlanned()
  }
}

export function savePlannedBudget(planned: Record<CategoryKey, number>): void {
  localStorage.setItem(PLANNED_KEY, JSON.stringify(planned))
}

export function getSpentByCategory(yearMonth: string): Record<CategoryKey, number> {
  const txs = getTransactions()
  const result = defaultPlanned() // all zeros

  for (const tx of txs) {
    if (tx.type === 'gasto' && tx.date.startsWith(yearMonth)) {
      result[tx.category] = (result[tx.category] || 0) + tx.amount
    }
  }

  return result
}
