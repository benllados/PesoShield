'use client'

import { Suspense, useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { BUDGET_CATEGORIES, type CategoryKey, type Transaction } from '@/lib/types'
import {
  getTransactions,
  addTransaction,
  deleteTransaction,
} from '@/lib/transactions'

const ALL_FILTER = 'todos' as const

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n)
}

function formatInputNumber(n: number) {
  return n > 0
    ? new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(n)
    : ''
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function getCategoryInfo(key: CategoryKey) {
  return BUDGET_CATEGORIES.find((c) => c.key === key) ?? BUDGET_CATEGORIES[4]
}

const CATEGORY_BG: Record<CategoryKey, string> = {
  alimentos: 'bg-orange-100',
  servicios: 'bg-yellow-100',
  transporte: 'bg-blue-100',
  salud: 'bg-red-100',
  otros: 'bg-purple-100',
}

export default function MovimientosPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col gap-8 items-center justify-center min-h-[40vh]">
        <span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span>
        <p className="text-xl text-text-secondary">Cargando movimientos…</p>
      </div>
    }>
      <MovimientosContent />
    </Suspense>
  )
}

function MovimientosContent() {
  const searchParams = useSearchParams()
  const categoriaParam = searchParams.get('categoria') as CategoryKey | null
  const validCategoria = BUDGET_CATEGORIES.some((c) => c.key === categoriaParam)
    ? categoriaParam
    : null

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<typeof ALL_FILTER | CategoryKey>(
    validCategoria ?? ALL_FILTER
  )

  // Form state
  const [formType, setFormType] = useState<'gasto' | 'ingreso'>('gasto')
  const [formAmount, setFormAmount] = useState(0)
  const [formCategory, setFormCategory] = useState<CategoryKey>('alimentos')
  const [formDescription, setFormDescription] = useState('')
  const [formDate, setFormDate] = useState(todayISO())

  // Load from localStorage on mount
  useEffect(() => {
    setTransactions(getTransactions())
  }, [])

  const now = new Date()
  const currentMonth = now.toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric',
  })
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Filter to current month
  const monthTransactions = useMemo(
    () => transactions.filter((t) => t.date.startsWith(currentYearMonth)),
    [transactions, currentYearMonth]
  )

  // Apply category filter
  const filteredTransactions = useMemo(() => {
    const list =
      filter === ALL_FILTER
        ? monthTransactions
        : monthTransactions.filter((t) => t.category === filter)
    return [...list].sort((a, b) => b.date.localeCompare(a.date))
  }, [monthTransactions, filter])

  // Summary stats
  const totalGastos = useMemo(
    () =>
      monthTransactions
        .filter((t) => t.type === 'gasto')
        .reduce((sum, t) => sum + t.amount, 0),
    [monthTransactions]
  )
  const totalIngresos = useMemo(
    () =>
      monthTransactions
        .filter((t) => t.type === 'ingreso')
        .reduce((sum, t) => sum + t.amount, 0),
    [monthTransactions]
  )
  const balance = totalIngresos - totalGastos

  // Handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formAmount <= 0 || !formDescription.trim()) return

    const tx: Transaction = {
      id: crypto.randomUUID(),
      date: formDate,
      description: formDescription.trim(),
      amount: formAmount,
      type: formType,
      category: formCategory,
    }

    const updated = addTransaction(tx)
    setTransactions(updated)
    resetForm()
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    if (!window.confirm('¿Estás seguro de que querés eliminar este movimiento?')) return
    const updated = deleteTransaction(id)
    setTransactions(updated)
  }

  const resetForm = () => {
    setFormType('gasto')
    setFormAmount(0)
    setFormCategory('alimentos')
    setFormDescription('')
    setFormDate(todayISO())
  }

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/\./g, '').replace(/,/g, '')
    setFormAmount(parseFloat(cleaned) || 0)
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Back link + Title */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium text-lg transition-colors w-fit"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
            Volver al inicio
          </Link>
          {validCategoria && (
            <>
              <span className="text-text-muted">|</span>
              <Link
                href="/presupuesto"
                className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium text-lg transition-colors w-fit"
              >
                <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
                Volver al presupuesto
              </Link>
            </>
          )}
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-text-primary tracking-tight capitalize">
          Movimientos de {currentMonth}
        </h2>
        <p className="text-xl text-text-secondary mt-1">
          Registrá tus gastos e ingresos del mes.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Gastos */}
        <div className="bg-surface rounded-2xl border border-border shadow-[var(--shadow-soft)] p-6 flex items-center gap-4">
          <div className="bg-ojo-bg p-3 rounded-xl shrink-0">
            <span className="material-symbols-outlined text-ojo text-3xl">trending_down</span>
          </div>
          <div>
            <p className="text-base text-text-secondary font-medium">Total Gastos</p>
            <p className="text-2xl font-bold text-ojo">{formatARS(totalGastos)}</p>
          </div>
        </div>

        {/* Total Ingresos */}
        <div className="bg-surface rounded-2xl border border-border shadow-[var(--shadow-soft)] p-6 flex items-center gap-4">
          <div className="bg-bien-bg p-3 rounded-xl shrink-0">
            <span className="material-symbols-outlined text-bien text-3xl">trending_up</span>
          </div>
          <div>
            <p className="text-base text-text-secondary font-medium">Total Ingresos</p>
            <p className="text-2xl font-bold text-bien">{formatARS(totalIngresos)}</p>
          </div>
        </div>

        {/* Balance */}
        <div className="bg-surface rounded-2xl border border-border shadow-[var(--shadow-soft)] p-6 flex items-center gap-4">
          <div className="bg-primary-light p-3 rounded-xl shrink-0">
            <span className="material-symbols-outlined text-primary text-3xl">account_balance</span>
          </div>
          <div>
            <p className="text-base text-text-secondary font-medium">Balance Neto</p>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-bien' : 'text-ojo'}`}>
              {balance >= 0 ? '+' : ''}
              {formatARS(balance)}
            </p>
          </div>
        </div>
      </div>

      {/* Add Transaction Form */}
      <div className="bg-surface rounded-2xl border border-border shadow-[var(--shadow-soft)] overflow-hidden">
        <button
          type="button"
          onClick={() => {
            setShowForm(!showForm)
            if (!showForm) resetForm()
          }}
          className="w-full flex items-center justify-between px-6 py-5 hover:bg-background transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl">
              {showForm ? 'close' : 'add_circle'}
            </span>
            <span className="text-xl font-bold text-text-primary">
              {showForm ? 'Cerrar formulario' : 'Agregar movimiento'}
            </span>
          </div>
          <span className="material-symbols-outlined text-text-muted text-2xl transition-transform" style={{ transform: showForm ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            expand_more
          </span>
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} className="px-6 pb-6 flex flex-col gap-5 border-t border-border-light pt-5">
            {/* Type Toggle */}
            <div className="flex flex-col gap-2">
              <label className="text-lg font-medium text-text-secondary">Tipo</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormType('gasto')}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-lg transition-colors border-2 ${
                    formType === 'gasto'
                      ? 'bg-ojo-bg border-ojo text-ojo'
                      : 'bg-background border-border text-text-muted hover:border-ojo'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl align-middle mr-1">trending_down</span>
                  Gasto
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('ingreso')}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-lg transition-colors border-2 ${
                    formType === 'ingreso'
                      ? 'bg-bien-bg border-bien text-bien'
                      : 'bg-background border-border text-text-muted hover:border-bien'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl align-middle mr-1">trending_up</span>
                  Ingreso
                </button>
              </div>
            </div>

            {/* Amount + Category row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-lg font-medium text-text-secondary">Monto</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-lg">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatInputNumber(formAmount)}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-3 bg-background border border-border rounded-xl text-text-primary text-lg font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-lg font-medium text-text-secondary">Categoría</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as CategoryKey)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary text-lg font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none cursor-pointer"
                >
                  {BUDGET_CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.icon} {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description + Date row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-lg font-medium text-text-secondary">Descripción</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ej: Compra del supermercado"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary text-lg placeholder:text-text-muted focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-lg font-medium text-text-secondary">Fecha</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary text-lg font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={formAmount <= 0 || !formDescription.trim()}
              className="self-start px-8 py-3 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-xl align-middle mr-2">save</span>
              Guardar movimiento
            </button>
          </form>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFilter(ALL_FILTER)}
          className={`px-5 py-2.5 rounded-xl font-medium text-base whitespace-nowrap transition-colors border ${
            filter === ALL_FILTER
              ? 'bg-primary text-white border-primary'
              : 'bg-surface text-text-secondary border-border hover:border-primary hover:text-primary'
          }`}
        >
          Todos
        </button>
        {BUDGET_CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setFilter(c.key)}
            className={`px-5 py-2.5 rounded-xl font-medium text-base whitespace-nowrap transition-colors border ${
              filter === c.key
                ? 'bg-primary text-white border-primary'
                : 'bg-surface text-text-secondary border-border hover:border-primary hover:text-primary'
            }`}
          >
            {c.icon} {c.label.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      <div className="flex flex-col gap-3">
        {filteredTransactions.length === 0 ? (
          /* Empty State */
          <div className="bg-surface rounded-2xl border border-border shadow-[var(--shadow-soft)] p-12 flex flex-col items-center gap-4 text-center">
            <div className="bg-primary-light p-5 rounded-full">
              <span className="material-symbols-outlined text-primary text-5xl">receipt_long</span>
            </div>
            <h3 className="text-2xl font-bold text-text-primary">
              {filter !== ALL_FILTER
                ? 'No hay movimientos en esta categoría'
                : 'No tenés movimientos este mes'}
            </h3>
            <p className="text-lg text-text-secondary max-w-md">
              {filter !== ALL_FILTER
                ? 'Probá con otra categoría o agregá un nuevo movimiento.'
                : '¡Empezá registrando tu primer gasto o ingreso!'}
            </p>
            {!showForm && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-2 inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary-dark transition-colors"
              >
                <span className="material-symbols-outlined text-xl">add_circle</span>
                Agregar movimiento
              </button>
            )}
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const cat = getCategoryInfo(tx.category)
            const bg = CATEGORY_BG[tx.category]
            const isGasto = tx.type === 'gasto'
            return (
              <div
                key={tx.id}
                className="bg-surface rounded-2xl border border-border shadow-[var(--shadow-soft)] px-5 py-4 flex items-center gap-4 hover:border-primary-20 transition-colors"
              >
                {/* Category Icon */}
                <div className={`${bg} p-3 rounded-xl text-2xl shrink-0`}>
                  {cat.icon}
                </div>

                {/* Description + Date */}
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-medium text-text-primary truncate">
                    {tx.description}
                  </p>
                  <p className="text-base text-text-muted">
                    {format(parseISO(tx.date), "d 'de' MMMM", { locale: es })}
                    {' · '}
                    <span className="capitalize">{cat.label.split(' ')[0]}</span>
                  </p>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                  <p className={`text-xl font-bold ${isGasto ? 'text-ojo' : 'text-bien'}`}>
                    {isGasto ? '−' : '+'}
                    {formatARS(tx.amount)}
                  </p>
                  <p className={`text-sm font-medium ${isGasto ? 'text-ojo' : 'text-bien'} opacity-70`}>
                    {isGasto ? 'Gasto' : 'Ingreso'}
                  </p>
                </div>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDelete(tx.id)}
                  className="p-2 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                  aria-label="Eliminar movimiento"
                >
                  <span className="material-symbols-outlined text-xl">delete</span>
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* Bottom back button */}
      {filteredTransactions.length > 3 && (
        <div className="flex justify-center pb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-3 px-8 py-4 bg-surface border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-2xl font-bold text-xl transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Volver al inicio
          </Link>
        </div>
      )}
    </div>
  )
}
