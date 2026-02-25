interface ConversionResultProps {
  label: string
  buy: number
  sell: number
  amount: number
  direction: 'usd-to-ars' | 'ars-to-usd'
  highlighted?: boolean
}

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n)
}

function formatUSD(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

export function ConversionResult({
  label,
  buy,
  sell,
  amount,
  direction,
  highlighted = false,
}: ConversionResultProps) {
  let result: number
  let rateUsed: number
  let resultFormatted: string
  let rateLabel: string

  if (direction === 'usd-to-ars') {
    rateUsed = sell
    result = amount * sell
    resultFormatted = formatARS(result)
    rateLabel = `1 USD = ${formatARS(sell)}`
  } else {
    rateUsed = buy > 0 ? buy : sell
    result = rateUsed > 0 ? amount / rateUsed : 0
    resultFormatted = formatUSD(result)
    rateLabel = `1 USD = ${formatARS(rateUsed)}`
  }

  const hasRate = rateUsed > 0

  return (
    <div
      className={`bg-surface rounded-lg p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden ${
        highlighted
          ? 'border-2 border-primary-30 shadow-md'
          : 'border border-border'
      }`}
    >
      {highlighted && (
        <div className="absolute top-0 right-0 bg-primary-10 text-primary font-bold px-4 py-1 rounded-bl-lg text-sm">
          Mas consultado
        </div>
      )}

      <h4
        className={`text-xl font-bold mb-4 ${
          highlighted ? 'text-primary' : 'text-text-primary'
        }`}
      >
        {label}
      </h4>

      {hasRate ? (
        <>
          <p
            className={`font-bold tracking-tight mb-2 ${
              highlighted
                ? 'text-4xl text-primary'
                : 'text-3xl text-text-primary'
            }`}
          >
            {resultFormatted}
          </p>
          <p className="text-base text-text-secondary">{rateLabel}</p>
        </>
      ) : (
        <p className="text-lg text-text-muted">Cotizacion no disponible</p>
      )}
    </div>
  )
}
