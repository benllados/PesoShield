'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'

import {
  ArrowDownIcon,
  ArrowUpIcon,
  BanknoteIcon,
  CATEGORY_ICONS,
  ListIcon,
  PlusIcon,
  SearchIcon,
} from '@/components/icons'
import { TransactionDialog } from '@/components/TransactionDialog'
import { Button, Card, Chip, EmptyState, Skeleton, cn } from '@/components/ui'
import {
  currentMonthKey,
  formatARS,
  formatDayGroup,
  formatMonthLabel,
  formatSignedARS,
} from '@/lib/format'
import { addTransaction, deleteTransaction, getTransactions } from '@/lib/transactions'
import { BUDGET_CATEGORIES, type CategoryKey, type Transaction } from '@/lib/types'

/**
 * Movimientos — the full ledger, newest first, grouped by day.
 *
 * Income and expense are distinguished four ways at once: the sign, the colour,
 * the word, and the icon. Any one of them alone would fail somebody.
 */

/** How long the undo offer stays up after saving, per the handoff. */
const UNDO_MS = 8000

type TypeFilter = 'todos' | 'gasto' | 'ingreso'

export default function MovimientosPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <MovimientosContent />
    </Suspense>
  )
}

function MovimientosContent() {
  const searchParams = useSearchParams()

  // Mi mes links here with ?categoria=…; anything unrecognised is ignored
  // rather than silently filtering everything out.
  const categoryParam = searchParams.get('categoria')
  const initialCategory = BUDGET_CATEGORIES.some((c) => c.key === categoryParam)
    ? (categoryParam as CategoryKey)
    : null

  const [transactions, setTransactions] = useState<Transaction[] | null>(null)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('todos')
  const [categoryFilter, setCategoryFilter] = useState<CategoryKey | null>(initialCategory)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [lastSaved, setLastSaved] = useState<Transaction | null>(null)
  const undoTimer = useRef<number | null>(null)

  const monthKey = currentMonthKey()
  const monthWord = formatMonthLabel(monthKey).split(' ')[0].toLowerCase()

  useEffect(() => {
    setTransactions(getTransactions())
  }, [])

  useEffect(
    () => () => {
      if (undoTimer.current) window.clearTimeout(undoTimer.current)
    },
    [],
  )

  /* Totals describe the whole month, regardless of the filters below them. */
  const totals = useMemo(() => {
    const inMonth = (transactions ?? []).filter((tx) => tx.date.startsWith(monthKey))
    const income = inMonth
      .filter((tx) => tx.type === 'ingreso')
      .reduce((sum, tx) => sum + tx.amount, 0)
    const spent = inMonth
      .filter((tx) => tx.type === 'gasto')
      .reduce((sum, tx) => sum + tx.amount, 0)
    return { income, spent, balance: income - spent }
  }, [transactions, monthKey])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()

    return (transactions ?? [])
      .filter((tx) => (typeFilter === 'todos' ? true : tx.type === typeFilter))
      .filter((tx) => (categoryFilter ? tx.category === categoryFilter : true))
      .filter((tx) => {
        if (!needle) return true
        const label = BUDGET_CATEGORIES.find((c) => c.key === tx.category)?.label ?? ''
        return (
          tx.description.toLowerCase().includes(needle) ||
          label.toLowerCase().includes(needle)
        )
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [transactions, query, typeFilter, categoryFilter])

  const groups = useMemo(() => {
    const byDay = new Map<string, Transaction[]>()
    for (const tx of filtered) {
      const list = byDay.get(tx.date) ?? []
      list.push(tx)
      byDay.set(tx.date, list)
    }
    return [...byDay.entries()]
  }, [filtered])

  function handleSave(transaction: Transaction) {
    setTransactions(addTransaction(transaction))
    setLastSaved(transaction)

    if (undoTimer.current) window.clearTimeout(undoTimer.current)
    undoTimer.current = window.setTimeout(() => setLastSaved(null), UNDO_MS)
  }

  function handleUndo() {
    if (!lastSaved) return
    setTransactions(deleteTransaction(lastSaved.id))
    setLastSaved(null)
    if (undoTimer.current) window.clearTimeout(undoTimer.current)
  }

  function clearFilters() {
    setQuery('')
    setTypeFilter('todos')
    setCategoryFilter(null)
  }

  const loading = transactions === null
  const hasAny = (transactions?.length ?? 0) > 0

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-[2rem] font-bold">Movimientos</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <PlusIcon size={22} />
          Agregar movimiento
        </Button>
      </header>

      {loading ? (
        <ListSkeleton />
      ) : (
        <>
          <Card className="grid gap-4 sm:grid-cols-3 sm:gap-0">
            <Total
              label={`Ingresos de ${monthWord}`}
              amount={totals.income}
              icon={<ArrowUpIcon size={16} className="text-green" />}
              tone="positive"
            />
            <Total
              label={`Gastos de ${monthWord}`}
              amount={-totals.spent}
              icon={<ArrowDownIcon size={16} />}
              divided
            />
            <Total
              label="Balance"
              amount={totals.balance}
              icon={<BanknoteIcon size={16} />}
              tone={totals.balance >= 0 ? 'positive' : 'negative'}
              divided
            />
          </Card>

          {hasAny ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-13 min-w-[16rem] flex-1 items-center gap-2.5 rounded-control border-2 border-rule-field bg-surface px-4">
                <SearchIcon size={20} className="shrink-0 text-ink-muted" />
                <label htmlFor="buscar" className="sr-only">
                  Buscar por comercio o descripción
                </label>
                <input
                  id="buscar"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar por comercio o descripción…"
                  className="w-full bg-transparent text-[1.0625rem] outline-none"
                />
              </div>

              <div role="group" aria-label="Filtrar por tipo" className="flex gap-1.5">
                {(
                  [
                    ['todos', 'Todos'],
                    ['gasto', 'Gastos'],
                    ['ingreso', 'Ingresos'],
                  ] as const
                ).map(([value, label]) => (
                  <Chip
                    key={value}
                    active={typeFilter === value}
                    onClick={() => setTypeFilter(value)}
                  >
                    {label}
                  </Chip>
                ))}
              </div>

              <label htmlFor="filtro-categoria" className="sr-only">
                Filtrar por categoría
              </label>
              <select
                id="filtro-categoria"
                value={categoryFilter ?? ''}
                onChange={(event) =>
                  setCategoryFilter((event.target.value || null) as CategoryKey | null)
                }
                className="h-12 rounded-full border border-rule-field bg-surface px-4 text-base text-ink-strong"
              >
                <option value="">Todas las categorías</option>
                {BUDGET_CATEGORIES.map((category) => (
                  <option key={category.key} value={category.key}>
                    {category.label}
                  </option>
                ))}
              </select>

              <p aria-live="polite" className="sr-only">
                {filtered.length} resultados
              </p>
            </div>
          ) : null}

          {!hasAny ? (
            <Card padded={false}>
              <EmptyState
                icon={<ListIcon size={34} />}
                title="Todavía no anotaste movimientos"
                action={
                  <Button onClick={() => setDialogOpen(true)}>
                    <PlusIcon size={20} />
                    Agregar mi primer movimiento
                  </Button>
                }
              >
                Anotá tu primer gasto o ingreso y acá vas a ver la lista completa, agrupada por
                día.
              </EmptyState>
            </Card>
          ) : filtered.length === 0 ? (
            <Card padded={false}>
              <EmptyState
                icon={<SearchIcon size={34} />}
                title="No encontramos movimientos"
                action={
                  <Button tone="secondary" size="md" onClick={clearFilters}>
                    Limpiar filtros
                  </Button>
                }
              >
                Probá con otra búsqueda o quitá los filtros para ver todo de nuevo.
              </EmptyState>
            </Card>
          ) : (
            <section className="overflow-hidden rounded-card border border-rule bg-surface shadow-card">
              {groups.map(([date, items]) => (
                <div key={date}>
                  <h2 className="bg-surface-sunk px-5 py-3 text-[1rem] font-bold text-ink-strong sm:px-8">
                    {formatDayGroup(date)}
                  </h2>
                  {items.map((tx) => (
                    <TransactionRow
                      key={tx.id}
                      transaction={tx}
                      highlighted={tx.id === lastSaved?.id}
                    />
                  ))}
                </div>
              ))}
            </section>
          )}
        </>
      )}

      <TransactionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />

      {/* Saved confirmation with the handoff's 8-second undo window. */}
      {lastSaved ? (
        <div
          role="status"
          className="fixed inset-x-4 bottom-24 z-40 mx-auto flex max-w-lg items-center gap-3 rounded-card border border-green-line bg-green-soft px-4 py-3.5 shadow-raised md:bottom-6"
        >
          <span className="flex-1 text-[1rem] text-green-deep">
            {lastSaved.type === 'gasto' ? 'Gasto' : 'Ingreso'} guardado ·{' '}
            {lastSaved.description || categoryLabel(lastSaved.category)}{' '}
            {formatARS(lastSaved.amount)} ARS
          </span>
          <button
            type="button"
            onClick={handleUndo}
            className="shrink-0 text-[1rem] font-bold text-green-deep underline underline-offset-4"
          >
            Deshacer
          </button>
        </div>
      ) : null}
    </div>
  )
}

function categoryLabel(key: CategoryKey): string {
  return BUDGET_CATEGORIES.find((c) => c.key === key)?.label.split(' (')[0] ?? key
}

function TransactionRow({
  transaction,
  highlighted,
}: {
  transaction: Transaction
  highlighted: boolean
}) {
  const Icon = CATEGORY_ICONS[transaction.category]
  const isIncome = transaction.type === 'ingreso'

  return (
    <div
      className={cn(
        'flex items-center gap-3.5 border-b border-rule-soft px-5 py-4 last:border-b-0 sm:px-8',
        highlighted && 'bg-green-soft',
      )}
    >
      <span
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-control',
          isIncome ? 'bg-green-soft text-green' : 'bg-surface-sunk text-ink-muted',
        )}
      >
        {isIncome ? <ArrowUpIcon size={22} /> : <Icon size={22} />}
      </span>

      <div className="min-w-0 flex-1">
        <div className="truncate text-[1.125rem] font-bold">
          {transaction.description || categoryLabel(transaction.category)}
        </div>
        <div className="text-[0.9375rem] text-ink-muted">
          {categoryLabel(transaction.category)}
        </div>
      </div>

      <div className="text-right">
        <div className={cn('text-[1.1875rem] font-bold tabular', isIncome && 'text-green')}>
          {formatSignedARS(isIncome ? transaction.amount : -transaction.amount)}
        </div>
        <div className="text-[0.875rem] text-ink-muted">
          ARS · {isIncome ? 'ingreso' : 'gasto'}
        </div>
      </div>
    </div>
  )
}

function Total({
  label,
  amount,
  icon,
  tone,
  divided = false,
}: {
  label: string
  amount: number
  icon: React.ReactNode
  tone?: 'positive' | 'negative'
  divided?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-0.5',
        divided && 'sm:border-l sm:border-rule-soft sm:pl-8',
      )}
    >
      <span className="flex items-center gap-2 text-[1rem] text-ink-muted">
        {icon}
        {label}
      </span>
      <span
        className={cn(
          'text-[1.625rem] font-bold tabular',
          tone === 'positive' && 'text-green',
          tone === 'negative' && 'text-red',
        )}
      >
        {formatSignedARS(amount)}{' '}
        <span className="text-[0.875rem] font-normal text-ink-muted">ARS</span>
      </span>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-live="polite" aria-busy="true">
      <span className="sr-only">Cargando tus movimientos…</span>
      <Card className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </Card>
      <Card className="flex flex-col gap-4">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="h-6 w-3/5" />
      </Card>
    </div>
  )
}
