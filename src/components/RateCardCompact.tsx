interface RateCardCompactProps {
  label: string
  price: number
  priceLabel?: string
  icon: string
}

export function RateCardCompact({
  label,
  price,
  priceLabel = 'Referencia',
  icon,
}: RateCardCompactProps) {
  const formatARS = (n: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n)

  return (
    <div className="bg-surface rounded-lg p-6 border border-border shadow-sm">
      <h4 className="text-lg font-bold text-text-secondary mb-4">{label}</h4>
      <div className="flex justify-between items-end">
        <div>
          <p className="text-sm text-text-muted mb-1">{priceLabel}</p>
          <p className="text-2xl font-bold text-text-primary">{formatARS(price)}</p>
        </div>
        <span className="material-symbols-outlined text-border text-4xl">
          {icon}
        </span>
      </div>
    </div>
  )
}
