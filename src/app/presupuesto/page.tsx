'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { BUDGET_CATEGORIES, type CategoryKey } from '@/lib/types'
import {
  getPlannedBudget,
  savePlannedBudget,
  getSpentByCategory,
} from '@/lib/budget'
import { FamilyHelpButton } from '@/components/FamilyHelpButton'
import { FamilyHelpModal } from '@/components/FamilyHelpModal'
import { buildBudgetHelpMessage } from '@/lib/build-help-message'

const CATEGORY_BG: Record<CategoryKey, string> = {
  alimentos: 'bg-orange-100',
  servicios: 'bg-yellow-100',
  transporte: 'bg-blue-100',
  salud: 'bg-red-100',
  otros: 'bg-purple-100',
}

export default function PresupuestoPage() {
  const [planned, setPlanned] = useState<Record<CategoryKey, number> | null>(null)
  const [spent, setSpent] = useState<Record<CategoryKey, number> | null>(null)

  const now = new Date()
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const currentMonth = now.toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric',
  })

  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const daysLeft = endOfMonth.getDate() - now.getDate()

  // Load from localStorage on mount
  useEffect(() => {
    setPlanned(getPlannedBudget())
    setSpent(getSpentByCategory(currentYearMonth))
  }, [currentYearMonth])

  // Build lines from planned + spent for calculations
  const lines = useMemo(() => {
    if (!planned || !spent) return []
    return BUDGET_CATEGORIES.map((c) => ({
      category: c.key,
      label: c.label,
      icon: c.icon,
      bgColor: CATEGORY_BG[c.key],
      planned: planned[c.key] || 0,
      spent: spent[c.key] || 0,
    }))
  }, [planned, spent])

  const totalPlanned = lines.reduce((sum, l) => sum + l.planned, 0)
  const totalSpent = lines.reduce((sum, l) => sum + l.spent, 0)
  const remaining = totalPlanned - totalSpent
  const percentUsed = totalPlanned > 0 ? Math.round((totalSpent / totalPlanned) * 100) : 0
  const percentRemaining = 100 - percentUsed

  const updatePlanned = (key: CategoryKey, value: string) => {
    const cleaned = value.replace(/\./g, '').replace(/,/g, '')
    const num = parseFloat(cleaned) || 0
    setPlanned((prev) => {
      if (!prev) return prev
      const next = { ...prev, [key]: num }
      savePlannedBudget(next)
      return next
    })
  }

  const formatARS = (n: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(n)

  const formatInput = (n: number) =>
    n > 0
      ? new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(n)
      : ''

  const isHealthy = percentUsed < 80

  const [helpModalOpen, setHelpModalOpen] = useState(false)
  const helpMessage = buildBudgetHelpMessage({
    remaining,
    daysLeft,
    currentMonth,
    lines,
    percentUsed,
  })

  // Show nothing until hydrated from localStorage
  if (!planned || !spent) {
    return (
      <div className="max-w-5xl mx-auto flex flex-col gap-8 items-center justify-center min-h-[40vh]">
        <span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span>
        <p className="text-xl text-text-secondary">Cargando presupuesto…</p>
      </div>
    )
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
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary tracking-tight capitalize">
              Presupuesto de {currentMonth}
            </h2>
            <p className="text-xl text-text-secondary mt-2">
              Planificá tus gastos para estar tranquilo.
            </p>
          </div>
          <FamilyHelpButton onClick={() => setHelpModalOpen(true)} />
        </div>
      </div>

      <FamilyHelpModal
        open={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        message={helpMessage}
      />

      {/* Sync Info Banner */}
      <div className="bg-primary-light rounded-2xl px-6 py-4 flex items-center gap-4 border border-primary/20">
        <span className="material-symbols-outlined text-primary text-3xl shrink-0">sync</span>
        <p className="text-base text-primary font-medium">
          La columna <strong>"Gastado"</strong> se calcula automáticamente desde tus{' '}
          <Link href="/movimientos" className="underline hover:text-primary-dark font-bold">
            movimientos registrados
          </Link>
          . ¡Solo tenés que cargar tus gastos ahí!
        </p>
      </div>

      {/* Status Card */}
      {totalPlanned > 0 && (
        <div className="bg-surface rounded-2xl p-8 border border-border-light shadow-[var(--shadow-soft)] relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-2 h-full ${isHealthy ? 'bg-calm-green' : 'bg-ojo'}`} />
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between relative z-10">
            <div className="flex items-start gap-6">
              <div className={`${isHealthy ? 'bg-calm-green-light' : 'bg-ojo-bg'} p-4 rounded-full flex items-center justify-center shrink-0`}>
                <span className={`material-symbols-outlined ${isHealthy ? 'text-calm-green' : 'text-ojo'} text-5xl`}>
                  {isHealthy ? 'check_circle' : 'warning'}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-3xl font-bold text-text-primary">
                  {isHealthy
                    ? 'Tu presupuesto va bien este mes'
                    : 'Cuidado con los gastos este mes'}
                </h3>
                <p className={`text-xl ${isHealthy ? 'text-calm-green' : 'text-ojo'} font-medium`}>
                  {remaining >= 0
                    ? `+ Te quedan ${formatARS(remaining)} para los próximos ${daysLeft} días.`
                    : `Superaste el presupuesto por ${formatARS(Math.abs(remaining))}.`}
                </p>
              </div>
            </div>
            <div className="w-full md:w-1/3 flex flex-col gap-3">
              <div className="flex justify-between items-end">
                <span className="text-lg font-medium text-text-secondary">Gastado hasta ahora</span>
                <span className="text-2xl font-bold text-text-primary">{percentUsed}%</span>
              </div>
              <div className="h-6 w-full bg-border-light rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${isHealthy ? 'bg-calm-green' : 'bg-ojo'}`}
                  style={{ width: `${Math.min(percentUsed, 100)}%` }}
                />
              </div>
              <p className="text-right text-base text-text-muted">
                Te queda un {percentRemaining}% disponible
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Budget Table */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-8 py-6 text-left text-lg font-semibold text-text-secondary w-1/4">
                  Categoría
                </th>
                <th className="px-6 py-6 text-left text-lg font-semibold text-text-secondary w-1/4">
                  Presupuestado ($)
                </th>
                <th className="px-6 py-6 text-left text-lg font-semibold text-text-secondary w-1/4">
                  <div className="flex items-center gap-2">
                    Gastado ($)
                    <span className="material-symbols-outlined text-primary text-base" title="Calculado automáticamente">sync</span>
                  </div>
                </th>
                <th className="px-8 py-6 text-left text-lg font-semibold text-text-secondary w-1/4">
                  Queda ($)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light text-xl">
              {lines.map((line) => {
                const diff = line.planned - line.spent
                return (
                  <tr key={line.category} className="hover:bg-background/50 transition-colors">
                    <td className="px-8 py-6 text-text-primary font-medium">
                      <div className="flex items-center gap-4">
                        <span className={`${line.bgColor} p-3 rounded-lg text-2xl`}>
                          {line.icon}
                        </span>
                        {line.label}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                          $
                        </span>
                        <input
                          type="text"
                          value={formatInput(line.planned)}
                          onChange={(e) => updatePlanned(line.category as CategoryKey, e.target.value)}
                          placeholder="0"
                          className="w-full pl-8 pr-4 py-3 bg-background border border-border rounded-xl text-text-primary focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium text-lg"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-lg font-bold text-text-primary pl-1">
                          {formatARS(line.spent)}
                        </span>
                        <Link
                          href={`/movimientos?categoria=${line.category}`}
                          className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary-dark font-medium transition-colors pl-1"
                        >
                          Ver movimientos
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </Link>
                      </div>
                    </td>
                    <td className="px-8 py-6 font-bold text-2xl">
                      <span className={diff >= 0 ? 'text-calm-green' : 'text-ojo'}>
                        {formatARS(diff)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-background border-t-2 border-border">
              <tr>
                <td className="px-8 py-6 text-xl font-bold text-text-primary">
                  Totales
                </td>
                <td className="px-6 py-6 text-xl font-bold text-text-secondary">
                  {formatARS(totalPlanned)}
                </td>
                <td className="px-6 py-6 text-xl font-bold text-text-secondary">
                  {formatARS(totalSpent)}
                </td>
                <td className="px-8 py-6 text-3xl font-bold text-calm-green">
                  {formatARS(remaining)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Monthly Report CTA */}
      <Link
        href="/resumen"
        className="w-full flex items-center justify-center gap-3 bg-surface border-2 border-primary text-primary hover:bg-primary hover:text-white text-lg md:text-xl font-bold py-5 px-6 rounded-2xl shadow-sm hover:shadow-md transition-all"
      >
        <span className="material-symbols-outlined text-2xl">auto_awesome</span>
        Ver resumen del mes
      </Link>

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
