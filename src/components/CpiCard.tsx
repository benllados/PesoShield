interface CpiCardProps {
  period: string
  value: number
  previousValue?: number
}

export function CpiCard({ period, value, previousValue }: CpiCardProps) {
  const monthName = getMonthName(period)
  const monthlyChange = previousValue
    ? ((value / previousValue - 1) * 100).toFixed(1)
    : null

  return (
    <div className="bg-primary-10 rounded-lg p-6 border border-primary-20 shadow-sm flex flex-col justify-between">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-primary text-2xl">
          monitoring
        </span>
        <h4 className="text-lg font-bold text-primary">Inflación (IPC)</h4>
      </div>
      <div>
        {monthlyChange ? (
          <>
            <p className="text-4xl font-extrabold text-text-primary mb-2">
              {monthlyChange}%
            </p>
            <p className="text-lg text-text-secondary font-medium">
              Variación mensual en {monthName}
            </p>
          </>
        ) : (
          <>
            <p className="text-4xl font-extrabold text-text-primary mb-2">
              {value.toFixed(1)}
            </p>
            <p className="text-lg text-text-secondary font-medium">
              Índice de precios — {monthName}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

function getMonthName(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  } catch {
    return dateStr
  }
}
