'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'

import { ClockIcon } from '@/components/icons'
import { RateHistory } from '@/components/RateHistory'
import { Button, Callout, Card, Skeleton, cn } from '@/components/ui'
import type { RateDisplay, RateHistoryPoint } from '@/lib/fetch-rates'
import { formatARS, formatNumber, formatRate, formatUpdatedAt, isStale } from '@/lib/format'

/**
 * Convertir — currency conversion and rate history in one destination.
 *
 * The old simulator had a single toggle labelled "tengo dólares", which never
 * said which side of the spread it was using. Here the direction is chosen
 * explicitly and each option states its own rule: selling uses the buy price,
 * buying uses the sell price. That distinction is the thing people actually get
 * caught by, so it is written where the choice is made rather than in a footnote.
 */

type Direction = 'sell' | 'buy'

/** Only the three rates most people actually transact at. */
const SHOWN_RATES = ['blue', 'bolsa', 'oficial'] as const

const RATE_META: Record<string, { name: string; note: string }> = {
  blue: { name: 'Dólar blue', note: 'Informal, valor de referencia' },
  bolsa: { name: 'Dólar MEP', note: 'Legal, vía banco o broker' },
  oficial: { name: 'Dólar oficial', note: 'Banco Nación' },
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ConvertirPage() {
  const [direction, setDirection] = useState<Direction>('sell')
  const [amount, setAmount] = useState(500)

  const {
    data: rates,
    isLoading,
    error,
    mutate,
  } = useSWR<RateDisplay[]>('/api/rates', fetcher, { refreshInterval: 300_000 })

  const { data: history, isLoading: historyLoading } = useSWR<RateHistoryPoint[]>(
    '/api/rates/history',
    fetcher,
  )

  const available = useMemo(() => {
    if (!rates?.length) return []

    return SHOWN_RATES.map((type) => rates.find((rate) => rate.type === type)).filter(
      (rate): rate is RateDisplay => Boolean(rate),
    )
  }, [rates])

  /**
   * Selling, the best rate is the highest buy price — you receive more pesos.
   * Buying, it's the lowest sell price. Results are ordered accordingly, so
   * the top row is always the one that favours the user.
   */
  const results = useMemo(() => {
    const priced = available.map((rate) => {
      const price = direction === 'sell' ? rate.buy : rate.sell
      return { rate, price, total: price * amount }
    })

    return priced.sort((a, b) =>
      direction === 'sell' ? b.total - a.total : a.total - b.total,
    )
  }, [available, direction, amount])

  const gap = useMemo(() => {
    const blue = results.find((result) => result.rate.type === 'blue')
    const oficial = results.find((result) => result.rate.type === 'oficial')
    if (!blue || !oficial) return null
    return Math.abs(blue.total - oficial.total)
  }, [results])

  const updatedAt = available[0]?.updatedAt
  const stale = updatedAt ? isStale(updatedAt) : false

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-[2rem] font-bold">Convertir moneda</h1>
        {updatedAt && !isLoading ? (
          <p className="flex items-center gap-2 text-[1.0625rem] text-ink-muted">
            <ClockIcon size={18} />
            Cotizaciones de fuentes públicas · Actualizadas {formatUpdatedAt(updatedAt)}
          </p>
        ) : null}
      </header>

      {error ? (
        <Callout
          tone="error"
          title="No pudimos actualizar las cotizaciones"
          action={
            <Button tone="danger" size="md" onClick={() => mutate()}>
              Reintentar ahora
            </Button>
          }
        >
          Revisá tu conexión a internet. Mientras tanto no podemos mostrarte valores nuevos.
        </Callout>
      ) : null}

      {stale && !error ? (
        <Callout tone="warning" title={`Estos valores son de ${formatUpdatedAt(updatedAt!)}`}>
          Todavía no pudimos traer los de ahora. Los cálculos usan el último valor guardado.
        </Callout>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-start">
        <Card className="flex flex-col gap-6">
          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-2.5 text-[1.0625rem] font-bold">¿Qué querés hacer?</legend>

            <DirectionOption
              checked={direction === 'sell'}
              onChange={() => setDirection('sell')}
              title="Vendo dólares (USD) → recibo pesos (ARS)"
              rule={
                <>
                  Se usa el precio de <strong>compra</strong>: lo que te pagan por tus dólares.
                </>
              }
            />
            <DirectionOption
              checked={direction === 'buy'}
              onChange={() => setDirection('buy')}
              title="Compro dólares (USD) → pago pesos (ARS)"
              rule={
                <>
                  Se usa el precio de <strong>venta</strong>: lo que pagás por cada dólar.
                </>
              }
            />
          </fieldset>

          <div className="flex flex-col gap-2">
            <label htmlFor="monto" className="text-[1.0625rem] font-bold">
              {direction === 'sell' ? 'Monto a vender (USD)' : 'Monto a comprar (USD)'}
            </label>
            <div className="flex h-15 items-center gap-2.5 rounded-control border-2 border-rule-field bg-surface px-4 focus-within:border-violet">
              <span aria-hidden="true" className="text-[1.375rem] text-ink-muted">
                US$
              </span>
              <input
                id="monto"
                type="text"
                inputMode="numeric"
                value={amount > 0 ? formatNumber(amount) : ''}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, '')
                  setAmount(digits ? Number(digits) : 0)
                }}
                placeholder="0"
                className="w-full bg-transparent text-[1.5rem] font-bold tabular outline-none"
              />
              <span className="rounded-md bg-surface-sunk px-2.5 py-1 text-[0.9375rem] font-bold text-ink-muted">
                USD
              </span>
            </div>
          </div>

          <p className="rounded-control bg-surface-sunk px-4 py-3.5 text-[1rem] leading-relaxed text-ink-strong">
            <strong className="text-ink">¿Compra o venta?</strong> El banco o la casa de cambio
            siempre tiene dos precios: te <strong>compra</strong> tus dólares a un precio, y te
            los <strong>vende</strong> a otro un poco más alto. Esa diferencia es su comisión.
          </p>
        </Card>

        <section className="overflow-hidden rounded-card border border-rule bg-surface shadow-card">
          <div className="flex flex-col gap-0.5 px-5 pb-3 pt-5 sm:px-8">
            <h2 className="text-[1.375rem] font-bold">
              {amount > 0
                ? direction === 'sell'
                  ? `Si vendés US$ ${formatNumber(amount)} recibís…`
                  : `Comprar US$ ${formatNumber(amount)} te cuesta…`
                : 'Ingresá un monto para comparar'}
            </h2>
            <span className="text-[0.9375rem] text-ink-muted">
              Según el precio de {direction === 'sell' ? 'compra' : 'venta'} de cada mercado
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-3 px-5 py-5 sm:px-8" aria-live="polite" aria-busy="true">
              <span className="sr-only">Buscando cotizaciones…</span>
              <Skeleton className="h-6 w-4/5" />
              <Skeleton className="h-6 w-3/5" />
              <Skeleton className="h-6 w-2/3" />
            </div>
          ) : results.length === 0 ? (
            <p className="px-5 py-8 text-[1.0625rem] text-ink-muted sm:px-8">
              No tenemos cotizaciones para mostrar en este momento.
            </p>
          ) : (
            <>
              {results.map((result, index) => (
                <div
                  key={result.rate.type}
                  className={cn(
                    'flex items-center gap-4 border-t border-rule-soft px-5 py-4 sm:px-8',
                    index === 0 && 'bg-violet-soft',
                  )}
                >
                  <div className="flex-1">
                    <div className="text-[1.1875rem] font-bold">
                      {RATE_META[result.rate.type]?.name ?? result.rate.label}
                    </div>
                    <div
                      className={cn(
                        'text-[0.9375rem]',
                        index === 0 ? 'text-violet-deep' : 'text-ink-muted',
                      )}
                    >
                      {direction === 'sell' ? 'Compra' : 'Venta'} {formatRate(result.price)} ·{' '}
                      {RATE_META[result.rate.type]?.note}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[1.625rem] font-bold tabular">
                      {formatARS(result.total)}
                    </div>
                    <div className="text-[0.875rem] text-ink-muted">ARS</div>
                  </div>
                </div>
              ))}

              {gap !== null && gap > 0 ? (
                <p className="border-t border-rule-soft px-5 py-4 text-[0.9375rem] text-ink-muted sm:px-8">
                  Diferencia entre blue y oficial: {formatARS(gap)} ARS
                </p>
              ) : null}
            </>
          )}
        </section>
      </div>

      <RateHistory history={history} loading={historyLoading} />
    </div>
  )
}

/**
 * A full-size radio row. The whole card is the label, so the target is far
 * larger than the control itself, and the compra/venta rule lives inside the
 * option it applies to.
 */
function DirectionOption({
  checked,
  onChange,
  title,
  rule,
}: {
  checked: boolean
  onChange: () => void
  title: string
  rule: React.ReactNode
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3.5 rounded-control border-2 px-4 py-4 transition-colors duration-150',
        checked ? 'border-violet bg-violet-soft' : 'border-rule-field bg-surface hover:bg-surface-sunk',
      )}
    >
      <input
        type="radio"
        name="direccion"
        checked={checked}
        onChange={onChange}
        className="mt-1 size-6 shrink-0 accent-violet"
      />
      <span>
        <span className="block text-[1.0625rem] font-bold">{title}</span>
        <span
          className={cn(
            'mt-0.5 block text-[0.9375rem]',
            checked ? 'text-violet-deep' : 'text-ink-muted',
          )}
        >
          {rule}
        </span>
      </span>
    </label>
  )
}
