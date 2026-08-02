'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import {
  ArrowDownIcon,
  ArrowUpIcon,
  BanknoteIcon,
  CalendarIcon,
  CATEGORY_ICONS,
  ClockIcon,
  ExchangeIcon,
  HeartIcon,
  PlusIcon,
} from '@/components/icons'
import { Button, ButtonLink, Callout, Card, ProgressBar, Skeleton, cn } from '@/components/ui'
import { TransactionDialog } from '@/components/TransactionDialog'
import {
  buildBudgetLines,
  getMonthTotals,
  getPlannedBudget,
  getSpentByCategory,
  type BudgetLine,
  type MonthTotals,
} from '@/lib/budget'
import {
  currentMonthKey,
  daysLeftInMonth,
  formatARS,
  formatMonthLabel,
  formatRelativeDay,
  formatSignedARS,
  formatWholePercent,
} from '@/lib/format'
import { addTransaction, getTransactions } from '@/lib/transactions'
import { BUDGET_CATEGORIES, type CategoryKey, type Transaction } from '@/lib/types'
import { createClient } from '@/lib/supabase'

/**
 * The personal half of Inicio.
 *
 * The page answers three questions in order, and this component owns the first
 * two: how much is left, and whether anything needs attention. Alerts only
 * appear when a calculation supports them — there is no cheerful "all good"
 * banner, because a reassurance nobody can check is worth nothing.
 */
export function HomeOverview() {
  const [name, setName] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[] | null>(null)
  const [lines, setLines] = useState<BudgetLine[]>([])
  const [totals, setTotals] = useState<MonthTotals | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const monthKey = currentMonthKey()
  const daysLeft = daysLeftInMonth(monthKey)

  function load() {
    const planned = getPlannedBudget(monthKey)
    const spent = getSpentByCategory(monthKey)
    setLines(buildBudgetLines(planned, spent))
    setTotals(getMonthTotals(monthKey))
    setTransactions(getTransactions())
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey])

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url || !url.startsWith('http')) return

    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      const display = user?.user_metadata?.display_name
      if (display) setName(String(display).split(' ')[0])
    })
  }, [])

  const loading = transactions === null || totals === null

  if (loading) {
    return (
      <div className="flex flex-col gap-6" aria-live="polite" aria-busy="true">
        <span className="sr-only">Cargando tu resumen del mes…</span>
        <Card className="flex flex-col gap-4">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-5 w-full" />
        </Card>
      </div>
    )
  }

  const totalPlanned = lines.reduce((sum, line) => sum + line.planned, 0)
  const hasPlan = totalPlanned > 0
  const hasTransactions = (transactions?.length ?? 0) > 0
  const configured = hasPlan || hasTransactions

  const percentUsed = hasPlan ? (totals.spent / totalPlanned) * 100 : 0
  const available = totals.available

  /* Alerts, each backed by an arithmetic reason. */
  const over = lines.filter((line) => line.status === 'over')
  const near = lines.filter((line) => line.status === 'near')

  return (
    <>
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[2rem] font-bold">
            {name ? `Hola, ${name}` : 'Hola'}
          </h1>
          <span className="flex items-center gap-2 text-[1.0625rem] text-ink-muted">
            <ClockIcon size={18} />
            {formatMonthLabel(monthKey)}
            {daysLeft > 0 ? ` · Quedan ${daysLeft} días` : ''}
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setDialogOpen(true)}>
            <PlusIcon size={22} />
            Agregar gasto
          </Button>
          <ButtonLink href="/convertir" tone="secondary">
            <ExchangeIcon size={20} />
            Convertir moneda
          </ButtonLink>
          <ButtonLink href="/ayuda" tone="secondary">
            <HeartIcon size={20} />
            Pedir ayuda
          </ButtonLink>
        </div>
      </header>

      {configured ? (
        <section className="overflow-hidden rounded-card border border-rule bg-surface shadow-card">
          <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pb-2 pt-5 sm:px-8">
            <h2 className="text-[1.5rem] font-bold">Este mes</h2>
            <Link
              href="/mi-mes"
              className="text-[1.0625rem] font-bold text-violet-deep hover:underline"
            >
              Ver Mi mes →
            </Link>
          </div>

          <div className="grid gap-4 px-5 py-4 sm:grid-cols-3 sm:gap-0 sm:px-8">
            <Figure
              label="Ingresos"
              icon={<ArrowUpIcon size={18} className="text-green" />}
              amount={totals.income}
            />
            <Figure
              label="Gastado"
              icon={<ArrowDownIcon size={18} />}
              amount={totals.spent}
              divided
            />
            <Figure
              label="Disponible hasta fin de mes"
              icon={<BanknoteIcon size={18} className="text-violet-deep" />}
              amount={available}
              divided
              large
              tone={available >= 0 ? 'positive' : 'negative'}
            />
          </div>

          {hasPlan ? (
            <div className="flex flex-col gap-2.5 px-5 pb-6 sm:px-8">
              <div className="flex flex-wrap justify-between gap-2 text-[1.0625rem]">
                <span className="font-bold">
                  Usaste el {formatWholePercent(percentUsed)} de tu presupuesto
                </span>
                {daysLeft > 0 ? (
                  <span className="text-ink-muted">
                    Quedan {daysLeft} días de{' '}
                    {formatMonthLabel(monthKey).split(' ')[0].toLowerCase()}
                  </span>
                ) : null}
              </div>
              <ProgressBar
                percent={percentUsed}
                tone={percentUsed > 100 ? 'over' : percentUsed >= 85 ? 'warning' : 'normal'}
                height={22}
                label={`${formatWholePercent(percentUsed)} del presupuesto usado`}
              />
            </div>
          ) : (
            <p className="px-5 pb-6 text-[1.0625rem] text-ink-muted sm:px-8">
              Todavía no armaste un presupuesto.{' '}
              <Link href="/mi-mes" className="font-bold text-violet-deep hover:underline">
                Armalo en Mi mes
              </Link>{' '}
              y te avisamos si alguna categoría se pasa.
            </p>
          )}
        </section>
      ) : (
        <FirstUse onAddExpense={() => setDialogOpen(true)} />
      )}

      {/* Only rendered when a category actually crossed a line. */}
      {over.map((line) => (
        <Callout
          key={line.category}
          tone="warning"
          title={`Atención: ${shortLabel(line.category)} superó lo planeado`}
          action={
            <ButtonLink href="/mi-mes" tone="secondary" size="md">
              Revisar Mi mes
            </ButtonLink>
          }
        >
          Gastaste {formatARS(line.spent)} de los {formatARS(line.planned)} previstos para{' '}
          {formatMonthLabel(monthKey).split(' ')[0].toLowerCase()}.
        </Callout>
      ))}

      {over.length === 0 &&
        near.map((line) => (
          <Callout
            key={line.category}
            tone="warning"
            title={`${shortLabel(line.category)} está cerca del límite`}
            action={
              <ButtonLink href="/mi-mes" tone="secondary" size="md">
                Revisar Mi mes
              </ButtonLink>
            }
          >
            Llevás {formatWholePercent(line.percent)} de lo previsto
            {daysLeft > 0 ? ` y todavía quedan ${daysLeft} días` : ''}.
          </Callout>
        ))}

      <TransactionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={(transaction) => {
          addTransaction(transaction)
          load()
        }}
      />
    </>
  )
}

function shortLabel(key: CategoryKey): string {
  return BUDGET_CATEGORIES.find((c) => c.key === key)?.label.split(' (')[0] ?? key
}

function Figure({
  label,
  icon,
  amount,
  divided = false,
  large = false,
  tone,
}: {
  label: string
  icon: React.ReactNode
  amount: number
  divided?: boolean
  large?: boolean
  tone?: 'positive' | 'negative'
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1',
        divided && 'sm:border-l sm:border-rule-soft sm:pl-8',
      )}
    >
      <span className="flex items-center gap-2 text-[1.0625rem] text-ink-muted">
        {icon}
        {label}
      </span>
      <span
        className={cn(
          'font-bold tabular',
          large ? 'text-[2.25rem]' : 'text-[1.875rem]',
          tone === 'positive' && 'text-green',
          tone === 'negative' && 'text-red',
        )}
      >
        {formatARS(amount)}{' '}
        <span className="text-[1rem] font-normal text-ink-muted">ARS</span>
      </span>
    </div>
  )
}

/**
 * First run. No invented figures and no empty progress bars — two concrete
 * starting points, and the rates below already work without any setup.
 */
function FirstUse({ onAddExpense }: { onAddExpense: () => void }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[1.625rem] font-bold">Bienvenido a PesoShield</h2>
        <p className="text-[1.0625rem] leading-relaxed text-ink-muted">
          Tu plata, clara y en orden. Empezá con uno de estos dos pasos — te lleva menos de dos
          minutos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card featured className="flex flex-col items-start gap-3">
          <span className="flex size-12 items-center justify-center rounded-control bg-violet-soft text-violet-deep">
            <CalendarIcon size={24} />
          </span>
          <strong className="text-[1.25rem]">Armá tu presupuesto</strong>
          <p className="text-[1rem] leading-relaxed text-ink-muted">
            Decinos cuánto pensás gastar por categoría. Después te avisamos si algo se pasa.
          </p>
          <ButtonLink href="/mi-mes" full className="mt-auto">
            Empezar mi presupuesto
          </ButtonLink>
        </Card>

        <Card className="flex flex-col items-start gap-3">
          <span className="flex size-12 items-center justify-center rounded-control bg-surface-sunk text-ink-muted">
            <PlusIcon size={24} />
          </span>
          <strong className="text-[1.25rem]">Anotá tu primer gasto</strong>
          <p className="text-[1rem] leading-relaxed text-ink-muted">
            Sin presupuesto también sirve: anotá lo que gastás y armamos el resumen del mes.
          </p>
          <Button tone="secondary" full className="mt-auto" onClick={onAddExpense}>
            Agregar un gasto
          </Button>
        </Card>
      </div>
    </section>
  )
}

/* Recent movements --------------------------------------------------------- */

export function RecentMovements() {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null)

  useEffect(() => {
    setTransactions(getTransactions())
  }, [])

  const recent = (transactions ?? [])
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4)

  return (
    <section className="overflow-hidden rounded-card border border-rule bg-surface shadow-card">
      <div className="flex items-center justify-between border-b border-rule-soft px-5 py-4 sm:px-7">
        <h2 className="text-[1.375rem] font-bold">Últimos movimientos</h2>
        <Link
          href="/movimientos"
          className="text-[1rem] font-bold text-violet-deep hover:underline"
        >
          Ver todos →
        </Link>
      </div>

      {transactions === null ? (
        <div className="flex flex-col gap-3 px-5 py-5 sm:px-7">
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-6 w-3/5" />
        </div>
      ) : recent.length === 0 ? (
        <p className="px-5 py-6 text-[1.0625rem] text-ink-muted sm:px-7">
          Todavía no anotaste movimientos. Cuando cargues el primero, va a aparecer acá.
        </p>
      ) : (
        recent.map((tx) => {
          const Icon = CATEGORY_ICONS[tx.category]
          const isIncome = tx.type === 'ingreso'

          return (
            <div
              key={tx.id}
              className="flex items-center gap-3.5 border-b border-rule-soft px-5 py-3.5 last:border-b-0 sm:px-7"
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
                  {tx.description || shortLabel(tx.category)}
                </div>
                <div className="text-[0.9375rem] text-ink-muted">
                  {shortLabel(tx.category)} · {formatRelativeDay(tx.date)}
                </div>
              </div>

              <div className="text-right">
                <div
                  className={cn('text-[1.125rem] font-bold tabular', isIncome && 'text-green')}
                >
                  {formatSignedARS(isIncome ? tx.amount : -tx.amount)}
                </div>
                <div className="text-[0.875rem] text-ink-muted">
                  ARS · {isIncome ? 'ingreso' : 'gasto'}
                </div>
              </div>
            </div>
          )
        })
      )}
    </section>
  )
}
