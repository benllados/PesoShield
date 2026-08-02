import Link from 'next/link'

import type { RateDisplay } from '@/lib/fetch-rates'
import { formatRate, formatUpdatedAt } from '@/lib/format'

/**
 * The rates module.
 *
 * Demoted from the hero of the old dashboard to a supporting panel: someone's
 * own money is the headline, and the dollar is context for it. Kept as a server
 * component — it is a table of numbers and ships no client JavaScript.
 *
 * Every figure carries its source and the time it was read, and the compra /
 * venta distinction is spelled out in a fixed line beneath the table rather
 * than assumed.
 */

const ROWS: readonly { type: string; name: string; note: string }[] = [
  { type: 'oficial', name: 'Dólar oficial', note: 'Banco Nación' },
  { type: 'blue', name: 'Dólar blue', note: 'Informal · referencia' },
  { type: 'bolsa', name: 'Dólar MEP', note: 'Bolsa · legal' },
]

export function RatesPanel({ rates }: { rates: RateDisplay[] }) {
  const shown = ROWS.map((row) => ({
    ...row,
    rate: rates.find((rate) => rate.type === row.type),
  })).filter((row) => row.rate)

  return (
    <section className="overflow-hidden rounded-card border border-rule bg-surface shadow-card">
      <div className="flex flex-col gap-1 px-5 pb-3 pt-5 sm:px-7">
        <h2 className="text-[1.375rem] font-bold">Cotizaciones de hoy</h2>
        <span className="text-[0.9375rem] text-ink-muted">
          Pesos (ARS) por 1 dólar (USD) · Fuente: fuentes públicas
          {shown[0]?.rate ? ` · ${formatUpdatedAt(shown[0].rate.updatedAt)}` : ''}
        </span>
      </div>

      {shown.length === 0 ? (
        <p className="px-5 py-6 text-[1.0625rem] text-ink-muted sm:px-7">
          No pudimos traer las cotizaciones en este momento. Probá recargar la página en unos
          minutos.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-[1.3fr_1fr_1fr] border-b border-rule-soft px-5 py-2 text-[0.9375rem] text-ink-muted sm:px-7">
            <span />
            <span className="text-right">Compra</span>
            <span className="text-right">Venta</span>
          </div>

          {shown.map((row) => (
            <div
              key={row.type}
              className="grid grid-cols-[1.3fr_1fr_1fr] items-center border-b border-rule-soft px-5 py-3.5 sm:px-7"
            >
              <div>
                <div className="text-[1.125rem] font-bold">{row.name}</div>
                <div className="text-[0.875rem] text-ink-muted">{row.note}</div>
              </div>
              <span className="text-right text-[1.1875rem] font-bold tabular">
                {formatRate(row.rate!.buy)}
              </span>
              <span className="text-right text-[1.1875rem] font-bold tabular">
                {formatRate(row.rate!.sell)}
              </span>
            </div>
          ))}

          <div className="flex flex-col gap-2 px-5 py-4 sm:px-7">
            <span className="text-[0.9375rem] text-ink-muted">
              <strong className="text-ink">Compra</strong> es lo que te pagan si vendés dólares;{' '}
              <strong className="text-ink">venta</strong> es lo que pagás si comprás.
            </span>
            <Link
              href="/convertir"
              className="text-[1.0625rem] font-bold text-violet-deep hover:underline"
            >
              Ver todas las cotizaciones →
            </Link>
          </div>
        </>
      )}
    </section>
  )
}
