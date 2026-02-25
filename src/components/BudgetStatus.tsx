interface BudgetStatusProps {
  totalPlanned: number
  totalSpent: number
  daysLeft: number
}

export function BudgetStatus({ totalPlanned, totalSpent, daysLeft }: BudgetStatusProps) {
  const remaining = totalPlanned - totalSpent
  const percentUsed = totalPlanned > 0 ? (totalSpent / totalPlanned) * 100 : 0
  const isOk = percentUsed < 80
  const isWarning = percentUsed >= 80 && percentUsed < 100
  const isOver = percentUsed >= 100

  const formattedRemaining = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Math.abs(remaining))

  return (
    <div
      className={`rounded-2xl border p-6 shadow-sm ${
        isOk
          ? 'bg-bien-bg border-bien/30'
          : isWarning
          ? 'bg-ojo-bg border-ojo/30'
          : 'bg-ojo-bg border-ojo/30'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">
          {isOk ? '✓' : '⚠'}
        </span>
        <div>
          <p className="text-xl font-semibold text-text-primary">
            {isOk && `Tu presupuesto va bien este mes`}
            {isWarning && `Cuidado: ya usaste el ${Math.round(percentUsed)}% del presupuesto`}
            {isOver && `Superaste el presupuesto del mes`}
          </p>
          <p className="text-lg text-text-secondary mt-1">
            {remaining >= 0
              ? `Te queda ${formattedRemaining} para los próximos ${daysLeft} días.`
              : `Gastaste ${formattedRemaining} de más.`}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-3 rounded-full bg-white/50 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isOk ? 'bg-bien' : 'bg-ojo'
          }`}
          style={{ width: `${Math.min(percentUsed, 100)}%` }}
        />
      </div>
    </div>
  )
}
