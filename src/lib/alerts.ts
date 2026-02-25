import type { RateDisplay } from './fetch-rates'
import type { Alert, CategoryKey } from './types'
import { BUDGET_CATEGORIES } from './types'
import { getPlannedBudget, getSpentByCategory } from './budget'

const RATE_LABELS: Record<string, string> = {
  oficial: 'Oficial',
  blue: 'Blue',
  bolsa: 'MEP',
  contadoconliqui: 'CCL',
  tarjeta: 'Tarjeta',
  cripto: 'Cripto',
}

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  alimentos: 'Alimentos',
  servicios: 'Servicios',
  transporte: 'Transporte',
  salud: 'Salud',
  otros: 'Otros',
}

function checkRateAlerts(
  currentRates: RateDisplay[],
  previousRates: RateDisplay[] | null
): Alert[] {
  if (!previousRates || previousRates.length === 0) return []

  const alerts: Alert[] = []

  for (const current of currentRates) {
    const prev = previousRates.find((r) => r.type === current.type)
    if (!prev || prev.sell === 0 || current.sell === 0) continue

    const change = ((current.sell - prev.sell) / prev.sell) * 100
    const absChange = Math.abs(change)

    if (absChange < 5) continue

    const label = RATE_LABELS[current.type] || current.label
    const direction = change > 0 ? 'subio' : 'bajo'
    const severity = absChange >= 10 ? 'critical' : 'warning'

    alerts.push({
      id: `rate-${current.type}-${Date.now()}`,
      type: 'rate-spike',
      severity,
      title: `El dolar ${label} ${direction} un ${Math.round(absChange)}%`,
      message: change > 0
        ? `Paso de $${Math.round(prev.sell)} a $${Math.round(current.sell)}. Tene cuidado con compras en dolares.`
        : `Paso de $${Math.round(prev.sell)} a $${Math.round(current.sell)}.`,
      icon: change > 0 ? 'trending_up' : 'trending_down',
    })
  }

  return alerts
}

function checkBudgetAlerts(
  planned: Record<CategoryKey, number>,
  spent: Record<CategoryKey, number>
): Alert[] {
  const alerts: Alert[] = []

  for (const cat of BUDGET_CATEGORIES) {
    const p = planned[cat.key] || 0
    const s = spent[cat.key] || 0
    if (p <= 0) continue

    const percent = Math.round((s / p) * 100)

    if (percent >= 100) {
      alerts.push({
        id: `budget-over-${cat.key}`,
        type: 'budget-threshold',
        severity: 'critical',
        title: `Superaste el presupuesto de ${CATEGORY_LABELS[cat.key]}`,
        message: `Gastaste ${percent}% del presupuesto de esta categoria.`,
        icon: 'warning',
        category: cat.key,
      })
    } else if (percent >= 80) {
      alerts.push({
        id: `budget-warn-${cat.key}`,
        type: 'budget-threshold',
        severity: 'warning',
        title: `${CATEGORY_LABELS[cat.key]}: ya usaste el ${percent}%`,
        message: `Te queda poco presupuesto en esta categoria. Ojo con los gastos.`,
        icon: 'account_balance_wallet',
        category: cat.key,
      })
    }
  }

  return alerts
}

function checkSpendingPatternAlerts(
  currentSpent: Record<CategoryKey, number>,
  previousSpent: Record<CategoryKey, number>
): Alert[] {
  const alerts: Alert[] = []

  for (const cat of BUDGET_CATEGORIES) {
    const current = currentSpent[cat.key] || 0
    const previous = previousSpent[cat.key] || 0

    if (previous <= 0 || current <= 0) continue

    const increase = ((current - previous) / previous) * 100
    const absoluteIncrease = current - previous

    if (increase >= 30 && absoluteIncrease > 5000) {
      alerts.push({
        id: `pattern-${cat.key}`,
        type: 'spending-pattern',
        severity: 'info',
        title: `${CATEGORY_LABELS[cat.key]}: gastas un ${Math.round(increase)}% mas que el mes pasado`,
        message: `Este mes llevas mas gasto en esta categoria comparado con el anterior.`,
        icon: 'insights',
        category: cat.key,
      })
    }
  }

  return alerts
}

const SEVERITY_ORDER: Record<Alert['severity'], number> = {
  critical: 0,
  warning: 1,
  info: 2,
}

export function checkAllAlerts(
  rates: RateDisplay[],
  previousRates: RateDisplay[] | null
): Alert[] {
  const planned = getPlannedBudget()
  const now = new Date()
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevYM = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
  const spent = getSpentByCategory(currentYM)
  const prevSpent = getSpentByCategory(prevYM)

  return [
    ...checkRateAlerts(rates, previousRates),
    ...checkBudgetAlerts(planned, spent),
    ...checkSpendingPatternAlerts(spent, prevSpent),
  ]
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
    .slice(0, 5)
}
