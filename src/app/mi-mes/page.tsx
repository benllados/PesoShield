'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  AlertCircleIcon,
  AlertTriangleIcon,
  CATEGORY_ICONS,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InfoIcon,
  PlusIcon,
  TrendDownIcon,
  TrendUpIcon,
} from '@/components/icons'
import {
  ButtonLink,
  Card,
  ProgressBar,
  Skeleton,
  cn,
  type ProgressTone,
} from '@/components/ui'
import {
  buildBudgetLines,
  getPlannedBudget,
  getSpentByCategory,
  savePlannedBudget,
  type BudgetLine,
  type CategoryStatus,
  type PlannedByCategory,
} from '@/lib/budget'
import {
  currentMonthKey,
  daysLeftInMonth,
  formatARS,
  formatMonthLabel,
  formatNumber,
  formatTime,
  formatWholePercent,
  shiftMonth,
} from '@/lib/format'
import { buildMonthlySummary } from '@/lib/monthly-summary'
import type { CategoryKey } from '@/lib/types'

/**
 * Mi mes — the budget and the monthly summary in one destination.
 *
 * Previously these were two screens (/presupuesto and /resumen) that described
 * the same month without ever appearing together. Merging them means the
 * summary can cite the very rows sitting above it.
 */

const STATUS_TONE: Record<CategoryStatus, ProgressTone> = {
  normal: 'normal',
  near: 'warning',
  over: 'over',
}

/** Row tint per state. Colour is a reinforcement here, never the only signal. */
const STATUS_ROW: Record<CategoryStatus, string> = {
  normal: '',
  near: 'bg-amber-tint',
  over: 'bg-red-tint',
}

export default function MiMesPage() {
  const [monthKey, setMonthKey] = useState(() => currentMonthKey())
  const [planned, setPlanned] = useState<PlannedByCategory | null>(null)
  const [spent, setSpent] = useState<PlannedByCategory | null>(null)
  const [savedAt, setSavedAt] = useState<Date | null>(null)

  const thisMonth = currentMonthKey()
  const isFutureBlocked = shiftMonth(monthKey, 1) > thisMonth

  useEffect(() => {
    setPlanned(getPlannedBudget(monthKey))
    setSpent(getSpentByCategory(monthKey))
  }, [monthKey])

  const lines = useMemo(
    () => (planned && spent ? buildBudgetLines(planned, spent) : []),
    [planned, spent],
  )

  const totalPlanned = lines.reduce((sum, line) => sum + line.planned, 0)
  const totalSpent = lines.reduce((sum, line) => sum + line.spent, 0)
  const remaining = totalPlanned - totalSpent
  const percentUsed = totalPlanned > 0 ? (totalSpent / totalPlanned) * 100 : 0
  const daysLeft = daysLeftInMonth(monthKey)

  const summary = useMemo(
    () => (planned && spent ? buildMonthlySummary(monthKey, lines) : null),
    [monthKey, lines, planned, spent],
  )

  const updatePlanned = useCallback(
    (key: CategoryKey, raw: string) => {
      const digits = raw.replace(/\D/g, '')
      const value = digits ? Number(digits) : 0

      setPlanned((previous) => {
        if (!previous) return previous
        const next = { ...previous, [key]: value }
        savePlannedBudget(monthKey, next)
        return next
      })
      setSavedAt(new Date())
    },
    [monthKey],
  )

  const loading = !planned || !spent

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-3">
          <h1 className="text-[2rem] font-bold">Mi mes</h1>
          <MonthSelector
            monthKey={monthKey}
            onChange={setMonthKey}
            nextDisabled={isFutureBlocked}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {savedAt ? (
            <span
              role="status"
              className="flex items-center gap-2 text-base text-green"
            >
              <CheckCircleIcon size={18} />
              Guardado automático {formatTime(savedAt)}
            </span>
          ) : null}
          <ButtonLink href="/movimientos" size="md">
            <PlusIcon size={20} />
            Agregar movimiento
          </ButtonLink>
        </div>
      </header>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <Card className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-3 sm:gap-0">
              <Total label="Planificado" amount={totalPlanned} />
              <Total label="Gastado" amount={totalSpent} divided />
              <Total
                label="Restante del plan"
                amount={remaining}
                divided
                tone={remaining >= 0 ? 'positive' : 'negative'}
              />
            </div>

            {totalPlanned > 0 ? (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-[1.0625rem]">
                  <span className="font-bold">
                    {formatWholePercent(percentUsed)} del plan usado
                  </span>
                  <span className="text-ink-muted">
                    {daysLeft > 0
                      ? `Quedan ${daysLeft} días de ${formatMonthLabel(monthKey).split(' ')[0].toLowerCase()}`
                      : 'Mes cerrado'}
                  </span>
                </div>
                <ProgressBar
                  percent={percentUsed}
                  tone={percentUsed > 100 ? 'over' : percentUsed >= 85 ? 'warning' : 'normal'}
                  label={`${formatWholePercent(percentUsed)} del plan usado`}
                />
              </div>
            ) : (
              <p className="text-[1.0625rem] text-ink-muted">
                Todavía no armaste el plan de este mes. Escribí cuánto pensás gastar en cada
                categoría y te avisamos si algo se pasa.
              </p>
            )}
          </Card>

          <CategoryTable
            lines={lines}
            monthKey={monthKey}
            onChange={updatePlanned}
            daysLeft={daysLeft}
          />

          <SummarySection monthKey={monthKey} summary={summary} />
        </>
      )}
    </div>
  )
}

/* Month selector ----------------------------------------------------------- */

function MonthSelector({
  monthKey,
  onChange,
  nextDisabled,
}: {
  monthKey: string
  onChange: (next: string) => void
  nextDisabled: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(shiftMonth(monthKey, -1))}
        aria-label="Mes anterior"
        className="flex size-12 items-center justify-center rounded-control border border-rule-field bg-surface text-ink-strong transition-colors duration-150 hover:bg-surface-sunk"
      >
        <ChevronLeftIcon size={20} />
      </button>

      <span
        aria-live="polite"
        className="flex h-12 items-center rounded-control border border-rule-field bg-surface px-5 text-[1.125rem] font-bold"
      >
        {formatMonthLabel(monthKey)}
      </span>

      <button
        type="button"
        onClick={() => onChange(shiftMonth(monthKey, 1))}
        disabled={nextDisabled}
        aria-label="Mes siguiente"
        // Disabled rather than hidden, with the reason spoken — a future month
        // has no data to show yet.
        title={nextDisabled ? 'Todavía no empezó' : undefined}
        className="flex size-12 items-center justify-center rounded-control border border-rule bg-surface text-ink-strong transition-colors duration-150 hover:bg-surface-sunk disabled:cursor-not-allowed disabled:bg-surface-sunk disabled:text-ink-subtle"
      >
        <ChevronRightIcon size={20} />
      </button>

      {/* Hidden on phones, where it wraps and crowds the selector; the
          disabled control and its title still explain why. */}
      {nextDisabled ? (
        <span className="hidden text-[0.9375rem] text-ink-muted sm:inline">
          Todavía no empezó
        </span>
      ) : null}
    </div>
  )
}

function Total({
  label,
  amount,
  divided = false,
  tone,
}: {
  label: string
  amount: number
  divided?: boolean
  tone?: 'positive' | 'negative'
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-0.5',
        divided && 'sm:border-l sm:border-rule-soft sm:pl-8',
      )}
    >
      <span className="text-[1.0625rem] text-ink-muted">{label}</span>
      <span
        className={cn(
          'text-[1.75rem] font-bold tabular',
          tone === 'positive' && 'text-green',
          tone === 'negative' && 'text-red',
        )}
      >
        {formatARS(amount)} <span className="text-[0.9375rem] font-normal text-ink-muted">ARS</span>
      </span>
    </div>
  )
}

/* Categories --------------------------------------------------------------- */

function CategoryTable({
  lines,
  monthKey,
  onChange,
  daysLeft,
}: {
  lines: BudgetLine[]
  monthKey: string
  onChange: (key: CategoryKey, raw: string) => void
  daysLeft: number
}) {
  return (
    <section id="por-categoria" className="overflow-hidden rounded-card border border-rule bg-surface shadow-card">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule-soft px-5 py-5 sm:px-8">
        <h2 className="text-[1.5rem] font-bold">Por categoría</h2>
        <span className="text-[0.9375rem] text-ink-muted">Los cambios se guardan solos</span>
      </div>

      {/* Desktop: one row per category. */}
      <div className="hidden md:block">
        <div className="grid grid-cols-[minmax(11rem,1fr)_1.2fr_9rem_9rem_9rem] items-center gap-4 border-b border-rule-soft px-8 py-3 text-[0.9375rem] text-ink-muted">
          <span>Categoría</span>
          <span>Progreso</span>
          <span className="text-right">Planificado</span>
          <span className="text-right">Gastado</span>
          <span className="text-right">Restante</span>
        </div>

        {lines.map((line) => {
          const Icon = CATEGORY_ICONS[line.category]
          return (
            <div
              key={line.category}
              className={cn(
                'grid grid-cols-[minmax(11rem,1fr)_1.2fr_9rem_9rem_9rem] items-center gap-4 border-b border-rule-soft px-8 py-4 last:border-b-0',
                STATUS_ROW[line.status],
              )}
            >
              <span className="flex items-center gap-3 text-[1.125rem] font-bold">
                <CategoryBadge status={line.status}>
                  <Icon size={20} />
                </CategoryBadge>
                {line.label.split(' (')[0]}
              </span>

              <div className="flex flex-col gap-1.5">
                <ProgressBar
                  percent={line.percent}
                  tone={STATUS_TONE[line.status]}
                  height={14}
                  label={`${line.label}: ${formatWholePercent(line.percent)} usado`}
                />
                <StatusNote line={line} daysLeft={daysLeft} />
              </div>

              <PlannedInput line={line} monthKey={monthKey} onChange={onChange} />

              <span className="text-right text-[1.125rem] tabular">
                {formatARS(line.spent)}
              </span>

              <span
                className={cn(
                  'text-right text-[1.125rem] font-bold tabular',
                  line.remaining >= 0 ? 'text-green' : 'text-red',
                )}
              >
                {line.remaining < 0 ? '− ' : ''}
                {formatARS(Math.abs(line.remaining))}
              </span>
            </div>
          )
        })}
      </div>

      {/* Mobile: the same rows as stacked cards — no horizontal scrolling. */}
      <div className="flex flex-col gap-4 p-4 md:hidden">
        {lines.map((line) => {
          const Icon = CATEGORY_ICONS[line.category]
          return (
            <div
              key={line.category}
              className={cn(
                'flex flex-col gap-2.5 rounded-card border p-4',
                line.status === 'over'
                  ? 'border-red-line bg-red-tint'
                  : line.status === 'near'
                    ? 'border-amber-line bg-amber-tint'
                    : 'border-rule bg-surface',
              )}
            >
              <div className="flex items-center gap-2.5">
                <CategoryBadge status={line.status}>
                  <Icon size={18} />
                </CategoryBadge>
                <strong className="flex-1 text-[1.125rem]">
                  {line.label.split(' (')[0]}
                </strong>
                <StatusNote line={line} daysLeft={daysLeft} compact />
              </div>

              <ProgressBar
                percent={line.percent}
                tone={STATUS_TONE[line.status]}
                height={12}
                label={`${line.label}: ${formatWholePercent(line.percent)} usado`}
              />

              <div className="flex items-end gap-3 text-[0.875rem] text-ink-muted">
                <div className="flex-1">
                  <span className="block">Plan</span>
                  <PlannedInput line={line} monthKey={monthKey} onChange={onChange} compact />
                </div>
                <div className="flex-1">
                  <span className="block">Gastado</span>
                  <strong className="text-[1rem] text-ink tabular">
                    {formatARS(line.spent)}
                  </strong>
                </div>
                <div className="flex-1">
                  <span className="block">Queda</span>
                  <strong
                    className={cn(
                      'text-[1rem] tabular',
                      line.remaining >= 0 ? 'text-green' : 'text-red',
                    )}
                  >
                    {line.remaining < 0 ? '− ' : ''}
                    {formatARS(Math.abs(line.remaining))}
                  </strong>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function CategoryBadge({
  status,
  children,
}: {
  status: CategoryStatus
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-tile',
        status === 'over'
          ? 'bg-red-soft text-red'
          : status === 'near'
            ? 'bg-amber-soft text-amber'
            : 'bg-surface-sunk text-ink-muted',
      )}
    >
      {children}
    </span>
  )
}

/**
 * The written half of a category's state. Paired with the bar's colour and an
 * icon, so the status survives greyscale and colour blindness alike.
 */
function StatusNote({
  line,
  daysLeft,
  compact = false,
}: {
  line: BudgetLine
  daysLeft: number
  compact?: boolean
}) {
  if (line.status === 'over') {
    return (
      <span className="flex items-center gap-1.5 text-[0.875rem] font-bold text-red">
        <AlertCircleIcon size={14} />
        {compact
          ? `se pasó ${formatARS(Math.abs(line.remaining))}`
          : `${formatWholePercent(line.percent)} · se pasó ${formatARS(Math.abs(line.remaining))} ARS`}
      </span>
    )
  }

  if (line.status === 'near') {
    return (
      <span className="flex items-center gap-1.5 text-[0.875rem] font-bold text-amber">
        <AlertTriangleIcon size={14} />
        {/* Floored, so a category under plan never reads as "100%". */}
        {compact
          ? 'cerca del límite'
          : `${Math.floor(line.percent)}% · cerca del límite${daysLeft > 0 ? `, quedan ${daysLeft} días` : ''}`}
      </span>
    )
  }

  if (line.planned <= 0) {
    return <span className="text-[0.875rem] text-ink-muted">{compact ? '' : 'Sin plan'}</span>
  }

  return (
    <span className="text-[0.875rem] text-ink-muted">
      {compact ? formatWholePercent(line.percent) : `${formatWholePercent(line.percent)} usado`}
    </span>
  )
}

/** Inline, autosaving plan amount. The label above the column names it. */
function PlannedInput({
  line,
  monthKey,
  onChange,
  compact = false,
}: {
  line: BudgetLine
  monthKey: string
  onChange: (key: CategoryKey, raw: string) => void
  compact?: boolean
}) {
  const id = `plan-${monthKey}-${line.category}`

  return (
    <div className={cn('relative', compact ? 'mt-0.5' : 'justify-self-end')}>
      <label htmlFor={id} className="sr-only">
        Planificado para {line.label} en {formatMonthLabel(monthKey)}, en pesos
      </label>
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted',
          compact && 'text-[0.9375rem]',
        )}
      >
        $
      </span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={line.planned > 0 ? formatNumber(line.planned) : ''}
        onChange={(event) => onChange(line.category, event.target.value)}
        placeholder="0"
        className={cn(
          'w-full rounded-control border-2 border-rule-field bg-surface pl-7 pr-3 text-right tabular',
          compact ? 'h-11 text-[1rem]' : 'h-12 text-[1.0625rem]',
        )}
      />
    </div>
  )
}

/* Summary ------------------------------------------------------------------ */

function SummarySection({
  monthKey,
  summary,
}: {
  monthKey: string
  summary: ReturnType<typeof buildMonthlySummary> | null
}) {
  if (!summary) return null

  const monthLabel = formatMonthLabel(monthKey)

  if (!summary.ready) {
    return (
      <Card className="flex flex-col items-center gap-4 py-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-surface-sunk text-ink-muted">
          <InfoIcon size={24} />
        </span>
        <strong className="text-[1.25rem]">Falta poco para tu resumen</strong>
        <p className="max-w-md text-[1.0625rem] text-ink-muted">{summary.reason}</p>
        <div className="flex flex-wrap justify-center gap-3">
          {summary.needsPlan ? (
            <ButtonLink href="#por-categoria" size="md" tone="secondary">
              Configurar presupuesto
            </ButtonLink>
          ) : null}
          <ButtonLink href="/movimientos" size="md">
            <PlusIcon size={20} />
            Agregar movimiento
          </ButtonLink>
        </div>
      </Card>
    )
  }

  return (
    <section className="overflow-hidden rounded-card border border-rule bg-surface shadow-card">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule-soft px-5 py-5 sm:px-8">
        <h2 className="text-[1.5rem] font-bold">Resumen de {monthLabel.split(' ')[0]}</h2>
        <span className="text-[0.9375rem] text-ink-muted">
          Calculado con tus movimientos
        </span>
      </div>

      <div className="grid md:grid-cols-[1fr_1.3fr]">
        <dl className="flex flex-col gap-4 border-b border-rule-soft px-5 py-6 sm:px-8 md:border-b-0 md:border-r">
          {summary.stats.map((stat) => (
            <div key={stat.label} className="flex justify-between gap-4 text-[1.0625rem]">
              <dt className="text-ink-muted">{stat.label}</dt>
              <dd
                className={cn(
                  'text-right font-bold tabular',
                  stat.tone === 'positive' && 'text-green',
                  stat.tone === 'negative' && 'text-red',
                )}
              >
                {stat.trend === 'down' ? (
                  <TrendDownIcon size={16} className="mr-1 inline align-[-2px]" />
                ) : stat.trend === 'up' ? (
                  <TrendUpIcon size={16} className="mr-1 inline align-[-2px]" />
                ) : null}
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col gap-3.5 px-5 py-6 sm:px-8">
          <strong className="text-[1.125rem]">En pocas palabras</strong>
          <ul className="flex flex-col gap-2.5">
            {summary.highlights.map((highlight) => (
              <li key={highlight} className="flex gap-3 text-[1.0625rem] leading-relaxed">
                <span
                  aria-hidden="true"
                  className="mt-2.5 size-1.5 shrink-0 rounded-full bg-violet/60"
                />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>

          {summary.actions.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-3">
              {summary.actions.map((action) => (
                <ButtonLink key={action.label} href={action.href} tone="secondary" size="md">
                  {action.label}
                </ButtonLink>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-6" aria-live="polite" aria-busy="true">
      <span className="sr-only">Cargando tu presupuesto…</span>
      <Card className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-5 w-full" />
      </Card>
      <Card className="flex flex-col gap-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-5 w-3/5" />
      </Card>
    </div>
  )
}
