'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { RateChart } from '@/components/RateChart'
import type { RateHistoryPoint } from '@/lib/types'
import { format, parseISO, subDays, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'

type Period = '30D' | '90D' | '6M' | '1Y'

const PERIODS: { key: Period; label: string }[] = [
  { key: '30D', label: '30 días' },
  { key: '90D', label: '90 días' },
  { key: '6M', label: '6 meses' },
  { key: '1Y', label: '1 año' },
]

function getCutoffDate(period: Period): Date {
  const now = new Date()
  switch (period) {
    case '30D':
      return subDays(now, 30)
    case '90D':
      return subDays(now, 90)
    case '6M':
      return subMonths(now, 6)
    case '1Y':
      return subMonths(now, 12)
  }
}

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function HistorialPage() {
  const [rawData, setRawData] = useState<RateHistoryPoint[]>([])
  const [period, setPeriod] = useState<Period>('90D')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/rates/history')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then((data: RateHistoryPoint[]) => {
        setRawData(data)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  // Filter data by period and merge Oficial/Blue into single date rows
  const chartData = useMemo(() => {
    const cutoff = getCutoffDate(period)

    // Group by date
    const byDate = new Map<string, { oficial: number | null; blue: number | null }>()

    for (const point of rawData) {
      const pointDate = parseISO(point.date)
      if (pointDate < cutoff) continue

      if (!byDate.has(point.date)) {
        byDate.set(point.date, { oficial: null, blue: null })
      }

      const entry = byDate.get(point.date)!
      if (point.source === 'Oficial') {
        entry.oficial = point.sell
      } else if (point.source === 'Blue') {
        entry.blue = point.sell
      }
    }

    // Sort by date and convert to array
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, rates]) => ({
        date,
        oficial: rates.oficial,
        blue: rates.blue,
      }))
  }, [rawData, period])

  // Summary stats
  const stats = useMemo(() => {
    if (chartData.length === 0) return null

    const oficialValues = chartData.map((d) => d.oficial).filter(Boolean) as number[]
    const blueValues = chartData.map((d) => d.blue).filter(Boolean) as number[]

    if (oficialValues.length === 0 || blueValues.length === 0) return null

    const lastOficial = oficialValues[oficialValues.length - 1]
    const firstOficial = oficialValues[0]
    const lastBlue = blueValues[blueValues.length - 1]
    const firstBlue = blueValues[0]

    return {
      oficial: {
        current: lastOficial,
        min: Math.min(...oficialValues),
        max: Math.max(...oficialValues),
        change: Math.round(((lastOficial - firstOficial) / firstOficial) * 1000) / 10,
      },
      blue: {
        current: lastBlue,
        min: Math.min(...blueValues),
        max: Math.max(...blueValues),
        change: Math.round(((lastBlue - firstBlue) / firstBlue) * 1000) / 10,
      },
    }
  }, [chartData])

  const lastUpdated = chartData.length > 0 ? chartData[chartData.length - 1].date : null
  let formattedLastUpdated = ''
  if (lastUpdated) {
    try {
      formattedLastUpdated = format(parseISO(lastUpdated), "d 'de' MMMM, yyyy", {
        locale: es,
      })
    } catch {
      formattedLastUpdated = lastUpdated
    }
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      {/* Back link + Title */}
      <div className="flex flex-col gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium text-lg mb-2 transition-colors w-fit"
        >
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
          Volver al inicio
        </Link>
        <h2 className="text-4xl md:text-5xl font-bold text-text-primary tracking-tight">
          Historial de cotizaciones
        </h2>
        <p className="text-xl text-text-secondary">
          Mirá cómo se movieron los tipos de cambio.
        </p>
      </div>

      {/* Period Selector */}
      <div className="flex flex-wrap gap-3">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-5 py-2.5 rounded-xl font-semibold text-lg transition-all ${
              period === p.key
                ? 'bg-primary text-white shadow-md'
                : 'bg-surface border border-border text-text-secondary hover:border-primary hover:text-primary'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      {loading ? (
        <div className="bg-surface rounded-2xl border border-border p-8 animate-pulse">
          <div className="h-[400px] bg-border-light rounded-xl" />
        </div>
      ) : error ? (
        <div className="bg-surface rounded-2xl border border-border p-12 text-center">
          <span className="material-symbols-outlined text-ojo text-5xl mb-4 block">
            error
          </span>
          <p className="text-xl text-text-secondary">
            No pudimos cargar los datos históricos. Intentá recargar la página.
          </p>
        </div>
      ) : (
        <RateChart data={chartData} />
      )}

      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Oficial Stats */}
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <h3 className="text-xl font-bold text-text-primary">Dólar Oficial</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-text-muted">Actual</p>
                <p className="text-2xl font-bold text-text-primary">
                  {formatARS(stats.oficial.current)}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Variación</p>
                <p
                  className={`text-2xl font-bold ${
                    stats.oficial.change >= 0 ? 'text-ojo' : 'text-calm-green'
                  }`}
                >
                  {stats.oficial.change >= 0 ? '+' : ''}
                  {stats.oficial.change}%
                </p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Mínimo</p>
                <p className="text-lg font-semibold text-text-secondary">
                  {formatARS(stats.oficial.min)}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Máximo</p>
                <p className="text-lg font-semibold text-text-secondary">
                  {formatARS(stats.oficial.max)}
                </p>
              </div>
            </div>
          </div>

          {/* Blue Stats */}
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-calm-green" />
              <h3 className="text-xl font-bold text-text-primary">Dólar Blue</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-text-muted">Actual</p>
                <p className="text-2xl font-bold text-text-primary">
                  {formatARS(stats.blue.current)}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Variación</p>
                <p
                  className={`text-2xl font-bold ${
                    stats.blue.change >= 0 ? 'text-ojo' : 'text-calm-green'
                  }`}
                >
                  {stats.blue.change >= 0 ? '+' : ''}
                  {stats.blue.change}%
                </p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Mínimo</p>
                <p className="text-lg font-semibold text-text-secondary">
                  {formatARS(stats.blue.min)}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Máximo</p>
                <p className="text-lg font-semibold text-text-secondary">
                  {formatARS(stats.blue.max)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Last updated */}
      {formattedLastUpdated && (
        <p className="text-center text-text-muted text-base">
          Última actualización: {formattedLastUpdated}
        </p>
      )}

      {/* Bottom back button */}
      <div className="flex justify-center pb-10">
        <Link
          href="/"
          className="inline-flex items-center gap-3 px-8 py-4 bg-surface border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-2xl font-bold text-xl transition-all duration-300 shadow-sm hover:shadow-md"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
