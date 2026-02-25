import type { RateDisplay } from './fetch-rates'
import { BUDGET_CATEGORIES } from './types'
import { getPlannedBudget, getSpentByCategory } from './budget'
import { getTransactions } from './transactions'

export interface ReportContext {
  month: string
  yearMonth: string
  daysInMonth: number
  daysPassed: number
  categories: Array<{
    label: string
    icon: string
    planned: number
    spent: number
    percentUsed: number
  }>
  totalPlanned: number
  totalSpent: number
  totalIncome: number
  balance: number
  transactionCount: number
  topExpenses: Array<{
    description: string
    amount: number
    category: string
  }>
  rates: Array<{
    label: string
    sell: number
  }>
  previousMonthSpent: Record<string, number>
}

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

export function buildReportContext(
  rates: RateDisplay[],
  yearMonth?: string
): ReportContext {
  const now = new Date()
  const ym = yearMonth || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [yearStr, monthStr] = ym.split('-')
  const year = parseInt(yearStr)
  const monthIdx = parseInt(monthStr) - 1

  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate()
  const isCurrentMonth = ym === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const daysPassed = isCurrentMonth ? now.getDate() : daysInMonth

  const monthName = `${MONTH_NAMES[monthIdx]} ${year}`

  const planned = getPlannedBudget()
  const spent = getSpentByCategory(ym)

  // Previous month
  const prevDate = new Date(year, monthIdx - 1, 1)
  const prevYM = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
  const prevSpent = getSpentByCategory(prevYM)

  // Build category data
  const categories = BUDGET_CATEGORIES.map((c) => {
    const p = planned[c.key] || 0
    const s = spent[c.key] || 0
    return {
      label: c.label,
      icon: c.icon,
      planned: p,
      spent: s,
      percentUsed: p > 0 ? Math.round((s / p) * 100) : 0,
    }
  })

  const totalPlanned = categories.reduce((sum, c) => sum + c.planned, 0)
  const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0)

  // Transactions for income and top expenses
  const allTxs = getTransactions().filter((t) => t.date.startsWith(ym))
  const totalIncome = allTxs
    .filter((t) => t.type === 'ingreso')
    .reduce((sum, t) => sum + t.amount, 0)

  const topExpenses = allTxs
    .filter((t) => t.type === 'gasto')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)
    .map((t) => {
      const cat = BUDGET_CATEGORIES.find((c) => c.key === t.category)
      return {
        description: t.description,
        amount: t.amount,
        category: cat?.label || t.category,
      }
    })

  return {
    month: monthName,
    yearMonth: ym,
    daysInMonth,
    daysPassed,
    categories,
    totalPlanned,
    totalSpent,
    totalIncome,
    balance: totalIncome - totalSpent,
    transactionCount: allTxs.length,
    topExpenses,
    rates: rates.map((r) => ({ label: r.label, sell: r.sell })),
    previousMonthSpent: prevSpent as Record<string, number>,
  }
}
