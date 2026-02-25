export interface Budget {
  id: string
  user_id: string
  month: string
  created_at: string
}

export interface BudgetItem {
  id: string
  budget_id: string
  category: string
  planned: number
  spent: number
  created_at: string
}

export const BUDGET_CATEGORIES = [
  { key: 'alimentos', label: 'Alimentos', icon: '🛒' },
  { key: 'servicios', label: 'Servicios (luz, gas, agua)', icon: '💡' },
  { key: 'transporte', label: 'Transporte', icon: '🚌' },
  { key: 'salud', label: 'Salud y medicamentos', icon: '💊' },
  { key: 'otros', label: 'Otros gastos', icon: '📦' },
] as const

export type CategoryKey = typeof BUDGET_CATEGORIES[number]['key']

export interface RateHistoryPoint {
  date: string
  source: 'Oficial' | 'Blue'
  buy: number
  sell: number
}

export interface Transaction {
  id: string
  date: string // ISO date string (YYYY-MM-DD)
  description: string
  amount: number // always positive
  type: 'gasto' | 'ingreso'
  category: CategoryKey
}

export interface Alert {
  id: string
  type: 'rate-spike' | 'budget-threshold' | 'spending-pattern'
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  icon: string
  category?: CategoryKey
}
