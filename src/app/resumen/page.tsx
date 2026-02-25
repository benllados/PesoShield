'use client'

import { useState } from 'react'
import Link from 'next/link'
import { subMonths, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { buildReportContext } from '@/lib/build-report-context'
import { buildReportShareMessage } from '@/lib/build-report-share-message'
import { FamilyHelpModal } from '@/components/FamilyHelpModal'
import type { RateDisplay } from '@/lib/fetch-rates'

const months = [0, 1, 2].map((offset) => {
  const d = subMonths(new Date(), offset)
  return {
    value: format(d, 'yyyy-MM'),
    label: format(d, 'MMMM yyyy', { locale: es }),
  }
})

export default function ResumenPage() {
  const [selectedMonth, setSelectedMonth] = useState(months[0].value)
  const [report, setReport] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [helpModalOpen, setHelpModalOpen] = useState(false)

  const selectedLabel = months.find((m) => m.value === selectedMonth)?.label || selectedMonth

  const generateReport = async () => {
    setLoading(true)
    setError(false)
    setReport(null)

    try {
      const ratesRes = await fetch('/api/rates')
      let rates: RateDisplay[] = []
      if (ratesRes.ok) {
        rates = await ratesRes.json()
      }

      const context = buildReportContext(rates, selectedMonth)

      if (context.transactionCount === 0 && context.totalPlanned === 0) {
        setReport(null)
        setError(false)
        setLoading(false)
        return
      }

      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context }),
      })

      if (!res.ok) throw new Error('Report generation failed')

      const { report: text } = await res.json()
      setReport(text)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value)
    setReport(null)
    setError(false)
  }

  const shareMessage = report
    ? buildReportShareMessage(report, selectedLabel)
    : ''

  return (
    <div className="flex flex-col gap-8">
      {/* Back link + Title */}
      <div className="flex flex-col gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium text-lg mb-2 transition-colors w-fit"
        >
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
          Volver al inicio
        </Link>
        <h2 className="text-4xl md:text-5xl font-bold text-text-primary tracking-tight capitalize">
          Resumen de {selectedLabel}
        </h2>
        <p className="text-xl text-text-secondary mt-1">
          Tu asistente prepara un resumen de tus finanzas del mes.
        </p>
      </div>

      {/* Month Selector */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {months.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => handleMonthChange(m.value)}
            className={`px-6 py-3 rounded-xl font-bold text-lg whitespace-nowrap transition-colors border-2 capitalize ${
              selectedMonth === m.value
                ? 'bg-primary text-white border-primary'
                : 'bg-surface text-text-secondary border-border hover:border-primary hover:text-primary'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Generate Button */}
      {!report && !loading && (
        <div className="bg-surface rounded-2xl border border-border shadow-[var(--shadow-soft)] p-8 md:p-12 flex flex-col items-center gap-6 text-center">
          <div className="bg-primary-light p-5 rounded-full">
            <span className="material-symbols-outlined text-primary text-5xl">auto_awesome</span>
          </div>
          <h3 className="text-2xl font-bold text-text-primary">
            Genera tu resumen mensual
          </h3>
          <p className="text-lg text-text-secondary max-w-md">
            El asistente va a analizar tus gastos, ingresos y presupuesto para darte un resumen claro del mes.
          </p>
          <button
            type="button"
            onClick={generateReport}
            className="inline-flex items-center gap-3 px-8 py-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xl transition-colors shadow-md hover:shadow-lg"
          >
            <span className="material-symbols-outlined text-2xl">auto_awesome</span>
            Generar resumen
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-surface rounded-2xl border border-border shadow-[var(--shadow-soft)] p-12 flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-primary text-5xl animate-spin">
            progress_activity
          </span>
          <p className="text-xl text-text-secondary">
            El asistente esta preparando tu resumen...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-surface rounded-2xl border border-border shadow-[var(--shadow-soft)] p-8 flex flex-col items-center gap-4 text-center">
          <div className="bg-ojo-bg p-4 rounded-full">
            <span className="material-symbols-outlined text-ojo text-4xl">error</span>
          </div>
          <h3 className="text-2xl font-bold text-text-primary">
            No pudimos generar el resumen
          </h3>
          <p className="text-lg text-text-secondary">
            Intenta de nuevo en unos momentos.
          </p>
          <button
            type="button"
            onClick={generateReport}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-lg transition-colors"
          >
            <span className="material-symbols-outlined text-xl">refresh</span>
            Intentar de nuevo
          </button>
        </div>
      )}

      {/* Report Display */}
      {report && (
        <div className="flex flex-col gap-4">
          <div className="bg-surface rounded-2xl border border-border shadow-[var(--shadow-soft)] p-6 md:p-8">
            <p className="text-lg text-text-primary leading-relaxed whitespace-pre-line">
              {report}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setHelpModalOpen(true)}
              className="inline-flex items-center justify-center gap-3 px-6 py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold text-lg transition-colors shadow-md hover:shadow-lg"
            >
              <span className="material-symbols-outlined text-xl">share</span>
              Compartir por WhatsApp
            </button>
            <button
              type="button"
              onClick={generateReport}
              className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-surface border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-xl font-bold text-lg transition-colors"
            >
              <span className="material-symbols-outlined text-xl">refresh</span>
              Generar de nuevo
            </button>
          </div>
        </div>
      )}

      <FamilyHelpModal
        open={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        message={shareMessage}
      />

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
