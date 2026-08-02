'use client'

import { useMemo, useState } from 'react'

import { AlertTriangleIcon, TableIcon, TrendDownIcon, TrendUpIcon } from '@/components/icons'
import { Chip, Skeleton, cn } from '@/components/ui'
import { formatDayAndMonth, formatNumber, formatPercent, formatRate } from '@/lib/format'
import type { RateHistoryPoint } from '@/lib/fetch-rates'

/**
 * Rate history, drawn as one line.
 *
 * The chart is inline SVG rather than a charting library: the design calls for
 * a single thick line with real axis values and no decoration, which is a few
 * dozen elements — not worth shipping a plotting runtime to the browser for.
 *
 * Every chart is accompanied by the same information in words and, on request,
 * as a table. The graphic is labelled but marked decorative, because the text
 * summary beneath it is the accessible source of truth.
 */

type SeriesKey = 'Blue' | 'Oficial'

interface Period {
  key: string
  label: string
  days: number
}

const PERIODS: readonly Period[] = [
  { key: '30d', label: '30 días', days: 30 },
  { key: '90d', label: '90 días', days: 90 },
  { key: '6m', label: '6 meses', days: 182 },
  { key: '1y', label: '1 año', days: 365 },
]

/**
 * The upstream evolution feed carries only Oficial and Blue. MEP is offered on
 * the converter above, where live values exist, but it has no history series —
 * so it isn't listed here rather than being shown empty.
 */
const SERIES: readonly { key: SeriesKey; label: string }[] = [
  { key: 'Blue', label: 'Dólar blue' },
  { key: 'Oficial', label: 'Oficial' },
]

export function RateHistory({
  history,
  loading,
}: {
  history: RateHistoryPoint[] | undefined
  loading: boolean
}) {
  const [series, setSeries] = useState<SeriesKey>('Blue')
  const [period, setPeriod] = useState<Period>(PERIODS[0])
  const [asTable, setAsTable] = useState(false)

  const points = useMemo(() => {
    if (!history) return []

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - period.days)
    const cutoffISO = cutoff.toISOString().slice(0, 10)

    return history
      .filter((point) => point.source === series && point.date >= cutoffISO)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((point) => ({ date: point.date, value: point.sell }))
  }, [history, series, period])

  const stats = useMemo(() => {
    if (points.length < 2) return null

    const first = points[0]
    const last = points[points.length - 1]
    const values = points.map((p) => p.value)
    const highest = points[values.indexOf(Math.max(...values))]
    const lowest = points[values.indexOf(Math.min(...values))]
    const change = ((last.value - first.value) / first.value) * 100

    return { first, last, highest, lowest, change }
  }, [points])

  return (
    <section
      id="historial"
      className="overflow-hidden rounded-card border border-rule bg-surface shadow-card"
    >
      <div className="flex flex-col gap-4 px-5 pt-5 sm:px-8 sm:pt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-[1.5rem] font-bold">Evolución del dólar</h2>
          <span className="text-[0.9375rem] text-ink-muted">
            Fuente: Bluelytics · precio de venta
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          <div
            role="group"
            aria-label="Tipo de dólar"
            className="flex flex-wrap gap-1.5"
          >
            {SERIES.map((option) => (
              <Chip
                key={option.key}
                active={series === option.key}
                onClick={() => setSeries(option.key)}
              >
                {option.label}
              </Chip>
            ))}
          </div>

          <div
            role="group"
            aria-label="Período"
            className="flex flex-wrap gap-1.5 sm:ml-auto"
          >
            {PERIODS.map((option) => (
              <Chip
                key={option.key}
                active={period.key === option.key}
                onClick={() => setPeriod(option)}
              >
                {option.label}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="px-5 py-8 sm:px-8" aria-live="polite" aria-busy="true">
          <span className="sr-only">Cargando la evolución del dólar…</span>
          <Skeleton className="h-52 w-full" />
        </div>
      ) : !stats ? (
        <EmptyPeriod period={period} onPick={setPeriod} />
      ) : (
        <div className="grid md:grid-cols-[2fr_1fr]">
          <div className="px-5 py-5 sm:px-8">
            {asTable ? (
              <HistoryTable points={points} seriesLabel={seriesLabel(series)} />
            ) : (
              <LineChart points={points} />
            )}
          </div>

          <div className="flex flex-col gap-3.5 border-t border-rule-soft px-5 py-5 sm:px-8 md:border-l md:border-t-0">
            <div
              className={cn(
                'flex items-center gap-2 text-[1.0625rem] font-bold',
                stats.change >= 0 ? 'text-amber' : 'text-green',
              )}
            >
              {stats.change >= 0 ? <TrendUpIcon size={20} /> : <TrendDownIcon size={20} />}
              {stats.change >= 0 ? 'Subió' : 'Bajó'} {formatPercent(Math.abs(stats.change))} en{' '}
              {period.label}
            </div>

            <p className="text-[1rem] leading-relaxed text-ink-strong">
              El {seriesLabel(series).toLowerCase()} (venta) pasó de{' '}
              <strong>{formatRate(stats.first.value)}</strong> el{' '}
              {formatDayAndMonth(stats.first.date)} a{' '}
              <strong>{formatRate(stats.last.value)}</strong> hoy.
            </p>

            <dl className="flex flex-col gap-2 border-t border-rule-soft pt-3 text-[1rem]">
              <Stat label="Más alto" value={`${formatRate(stats.highest.value)} · ${formatDayAndMonth(stats.highest.date)}`} />
              <Stat label="Más bajo" value={`${formatRate(stats.lowest.value)} · ${formatDayAndMonth(stats.lowest.date)}`} />
              <Stat label="Actual" value={formatRate(stats.last.value)} />
            </dl>

            <button
              type="button"
              onClick={() => setAsTable((value) => !value)}
              aria-pressed={asTable}
              className="inline-flex h-12 items-center gap-2 self-start rounded-control border-2 border-violet px-4 text-[1rem] font-bold text-violet-deep transition-colors duration-150 hover:bg-violet-soft"
            >
              <TableIcon size={18} />
              {asTable ? 'Ver como gráfico' : 'Ver como tabla'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function seriesLabel(key: SeriesKey): string {
  return SERIES.find((option) => option.key === key)?.label ?? key
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-bold tabular">{value}</dd>
    </div>
  )
}

/* Chart -------------------------------------------------------------------- */

const CHART = { width: 640, height: 260, left: 60, right: 620, top: 20, bottom: 210 }

function LineChart({ points }: { points: { date: string; value: number }[] }) {
  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  // A flat series would divide by zero; give it a nominal band instead.
  const span = max - min || max * 0.01 || 1
  const padded = { min: min - span * 0.1, max: max + span * 0.1 }

  const x = (index: number) =>
    CHART.left +
    (index / Math.max(1, points.length - 1)) * (CHART.right - CHART.left)

  const y = (value: number) =>
    CHART.bottom -
    ((value - padded.min) / (padded.max - padded.min)) * (CHART.bottom - CHART.top)

  const path = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${x(index)} ${y(point.value)}`)
    .join(' ')

  const gridValues = [0, 1, 2, 3].map(
    (step) => padded.min + ((padded.max - padded.min) / 3) * step,
  )

  const last = points[points.length - 1]
  const middle = points[Math.floor(points.length / 2)]

  return (
    <svg
      viewBox={`0 0 ${CHART.width} ${CHART.height}`}
      className="h-auto w-full"
      // The summary and table beside this carry the same information.
      aria-hidden="true"
      focusable="false"
    >
      {gridValues.map((value) => (
        <g key={value}>
          <line
            x1={CHART.left}
            y1={y(value)}
            x2={CHART.right}
            y2={y(value)}
            stroke="var(--color-rule-soft)"
            strokeWidth={1}
          />
          <text
            x={CHART.left - 8}
            y={y(value) + 5}
            fontSize={14}
            fill="var(--color-ink-muted)"
            textAnchor="end"
          >
            {formatNumber(value)}
          </text>
        </g>
      ))}

      <line
        x1={CHART.left}
        y1={CHART.top}
        x2={CHART.left}
        y2={CHART.bottom}
        stroke="var(--color-rule)"
        strokeWidth={1}
      />

      <path
        d={path}
        fill="none"
        stroke="var(--color-violet)"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx={x(points.length - 1)} cy={y(last.value)} r={6} fill="var(--color-violet)" />
      <text
        x={CHART.right - 8}
        y={y(last.value) - 14}
        fontSize={16}
        fontWeight="bold"
        fill="var(--color-ink)"
        textAnchor="end"
      >
        {formatRate(last.value)}
      </text>

      <text x={CHART.left} y={CHART.height - 22} fontSize={14} fill="var(--color-ink-muted)">
        {formatDayAndMonth(points[0].date)}
      </text>
      <text
        x={(CHART.left + CHART.right) / 2}
        y={CHART.height - 22}
        fontSize={14}
        fill="var(--color-ink-muted)"
        textAnchor="middle"
      >
        {formatDayAndMonth(middle.date)}
      </text>
      <text
        x={CHART.right}
        y={CHART.height - 22}
        fontSize={14}
        fill="var(--color-ink-muted)"
        textAnchor="end"
      >
        hoy
      </text>
    </svg>
  )
}

/** The chart's data, verbatim. Long series are thinned so the table stays usable. */
function HistoryTable({
  points,
  seriesLabel,
}: {
  points: { date: string; value: number }[]
  seriesLabel: string
}) {
  const step = Math.max(1, Math.ceil(points.length / 30))
  const rows = points.filter((_, index) => index % step === 0 || index === points.length - 1)

  return (
    <div className="max-h-80 overflow-y-auto">
      <table className="w-full text-[1rem]">
        <caption className="sr-only">
          {seriesLabel}, precio de venta por fecha
        </caption>
        <thead className="sticky top-0 bg-surface">
          <tr className="border-b border-rule-soft text-left text-ink-muted">
            <th scope="col" className="py-2 font-normal">
              Fecha
            </th>
            <th scope="col" className="py-2 text-right font-normal">
              Venta
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.date} className="border-b border-rule-soft last:border-b-0">
              <td className="py-2">{formatDayAndMonth(row.date)}</td>
              <td className="py-2 text-right font-bold tabular">{formatRate(row.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * No empty chart frame — the space explains what is missing and offers the
 * nearest period that does have data.
 */
function EmptyPeriod({
  period,
  onPick,
}: {
  period: Period
  onPick: (period: Period) => void
}) {
  const fallback = PERIODS[Math.max(0, PERIODS.indexOf(period) - 1)]

  return (
    <div className="flex flex-col items-center gap-2.5 px-6 py-12 text-center">
      <AlertTriangleIcon size={26} className="text-ink-muted" />
      <strong className="text-[1.0625rem]">No hay datos de este período</strong>
      <p className="max-w-sm text-[1rem] text-ink-muted">
        Todavía no tenemos suficientes valores para mostrar {period.label.toLowerCase()}.
      </p>
      {fallback.key !== period.key ? (
        <button
          type="button"
          onClick={() => onPick(fallback)}
          className="text-[1rem] font-bold text-violet-deep underline underline-offset-4"
        >
          Ver {fallback.label.toLowerCase()}
        </button>
      ) : null}
    </div>
  )
}
