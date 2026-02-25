interface RateCardProps {
  label: string
  buy: number
  sell: number
  source: string
  updatedAt: string
  badge?: string
  highlighted?: boolean
}

export function RateCard({
  label,
  buy,
  sell,
  badge,
  highlighted = false,
}: RateCardProps) {
  const formatARS = (n: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n)

  return (
    <div
      className={`bg-surface rounded-lg p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden ${
        highlighted
          ? 'border-2 border-primary-30 shadow-md'
          : 'border border-border'
      }`}
    >
      {/* "Más consultado" badge for Blue */}
      {highlighted && (
        <div className="absolute top-0 right-0 bg-primary-10 text-primary font-bold px-4 py-1 rounded-bl-lg text-sm">
          Más consultado
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h4
          className={`text-xl font-bold ${
            highlighted ? 'text-primary' : 'text-text-primary'
          }`}
        >
          {label}
        </h4>
        {badge && !highlighted && (
          <span className="bg-background text-text-secondary px-3 py-1 rounded-full text-sm font-medium">
            {badge}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <p className="text-text-secondary text-lg mb-1">Compra</p>
          <p
            className={`font-bold tracking-tight ${
              highlighted
                ? 'text-4xl text-primary'
                : 'text-3xl text-text-primary'
            }`}
          >
            {formatARS(buy)}
          </p>
        </div>
        <div className="h-px w-full bg-border-light" />
        <div>
          <p className="text-text-secondary text-lg mb-1">Venta</p>
          <p
            className={`font-bold tracking-tight ${
              highlighted
                ? 'text-4xl text-primary'
                : 'text-3xl text-text-primary'
            }`}
          >
            {formatARS(sell)}
          </p>
        </div>
      </div>
    </div>
  )
}
