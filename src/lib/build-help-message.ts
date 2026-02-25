interface BudgetLine {
  label: string
  icon: string
  planned: number
  spent: number
}

interface BudgetHelpParams {
  remaining: number
  daysLeft: number
  currentMonth: string
  lines: BudgetLine[]
  percentUsed: number
}

function formatARS(n: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n)
}

export function buildBudgetHelpMessage({
  remaining,
  daysLeft,
  currentMonth,
  lines,
  percentUsed,
}: BudgetHelpParams): string {
  const greeting = 'Hola familia \u{1f44b}'
  const intro = 'Les escribo desde PesoShield.'

  const status =
    remaining >= 0
      ? `Este mes (${currentMonth}) me quedan ${formatARS(remaining)} para los pr\u00f3ximos ${daysLeft} d\u00edas.`
      : `Este mes (${currentMonth}) me pas\u00e9 del presupuesto por ${formatARS(Math.abs(remaining))}.`

  const percent = `Gast\u00e9 el ${percentUsed}% del presupuesto.`

  // Show categories where the user still has remaining budget (needs help buying)
  const categoriesWithRemaining = lines
    .filter((l) => l.planned > 0 && l.planned - l.spent > 0)
    .sort((a, b) => (b.planned - b.spent) - (a.planned - a.spent))
    .slice(0, 3)

  let categorySection = ''
  if (categoriesWithRemaining.length > 0) {
    categorySection =
      '\nDonde m\u00e1s necesito ayuda:\n' +
      categoriesWithRemaining
        .map((l) => `${l.icon} ${l.label}: me quedan ${formatARS(l.planned - l.spent)}`)
        .join('\n')
  }

  const closing = '\n\u00bfMe pueden dar una mano? \u{1f64f}'

  return [greeting, intro, status, percent, categorySection, closing]
    .filter(Boolean)
    .join('\n')
}

export function buildGenericHelpMessage(): string {
  return [
    'Hola familia \u{1f44b}',
    'Les escribo desde PesoShield.',
    'Necesito una mano con los gastos este mes.',
    '\u00bfMe pueden ayudar? \u{1f64f}',
  ].join('\n')
}
