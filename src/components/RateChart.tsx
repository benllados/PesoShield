'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface ChartDataPoint {
  date: string
  oficial: number | null
  blue: number | null
}

interface RateChartProps {
  data: ChartDataPoint[]
}

function formatARS(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value)
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string; color: string }>
  label?: string
}) {
  if (!active || !payload || !label) return null

  let formattedDate = label
  try {
    formattedDate = format(parseISO(label), "d 'de' MMMM, yyyy", { locale: es })
  } catch {
    // fallback to raw date
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-4 shadow-lg">
      <p className="text-sm font-medium text-text-secondary mb-2 capitalize">
        {formattedDate}
      </p>
      {payload.map((entry) => (
        <p
          key={entry.dataKey}
          className="text-lg font-bold"
          style={{ color: entry.color }}
        >
          {entry.dataKey === 'oficial' ? 'Oficial' : 'Blue'}:{' '}
          {formatARS(entry.value)}
        </p>
      ))}
    </div>
  )
}

export function RateChart({ data }: RateChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-border p-12 text-center">
        <span className="material-symbols-outlined text-text-muted text-5xl mb-4 block">
          show_chart
        </span>
        <p className="text-xl text-text-secondary">
          No hay datos históricos disponibles.
        </p>
      </div>
    )
  }

  const formatXAxis = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'd MMM', { locale: es })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="bg-surface rounded-2xl border border-border p-6 md:p-8 shadow-sm">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            tick={{ fontSize: 13, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            interval="preserveStartEnd"
            minTickGap={50}
          />
          <YAxis
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 13, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={40}
            formatter={(value: string) =>
              value === 'oficial' ? 'Dólar Oficial' : 'Dólar Blue'
            }
            wrapperStyle={{ fontSize: '16px', fontWeight: 600 }}
          />
          <Line
            type="monotone"
            dataKey="oficial"
            stroke="#833cf6"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 2, fill: '#833cf6' }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="blue"
            stroke="#0d9488"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 2, fill: '#0d9488' }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
