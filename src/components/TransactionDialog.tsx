'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'

import { CheckIcon, CloseIcon } from '@/components/icons'
import { Button, Field, cn, fieldBorder, fieldShell } from '@/components/ui'
import { formatNumber, todayISO } from '@/lib/format'
import { BUDGET_CATEGORIES, type CategoryKey, type Transaction } from '@/lib/types'

/**
 * Adding a movement.
 *
 * One component, two presentations: a centred modal on desktop and a
 * full-screen sheet on mobile with the save action pinned where a thumb can
 * reach it above the keyboard. Focus is trapped while open, Escape closes, and
 * closing with something typed asks first rather than silently discarding it.
 */

export interface TransactionDraft {
  type: 'gasto' | 'ingreso'
  amount: number
  category: CategoryKey
  date: string
  description: string
}

interface FieldErrors {
  amount?: string
  category?: string
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function TransactionDialog({
  open,
  onClose,
  onSave,
  defaultType = 'gasto',
}: {
  open: boolean
  onClose: () => void
  onSave: (transaction: Transaction) => void
  defaultType?: 'gasto' | 'ingreso'
}) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const amountRef = useRef<HTMLInputElement>(null)
  const categoryRef = useRef<HTMLSelectElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)

  const [draft, setDraft] = useState<TransactionDraft>(() => blankDraft(defaultType))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState(false)

  const dirty =
    draft.amount > 0 || draft.description.trim().length > 0 || touched

  const reset = useCallback(() => {
    setDraft(blankDraft(defaultType))
    setErrors({})
    setTouched(false)
  }, [defaultType])

  const requestClose = useCallback(() => {
    if (dirty && !window.confirm('Tenés datos sin guardar. ¿Querés cerrar igual?')) return
    reset()
    onClose()
  }, [dirty, onClose, reset])

  /* Open/close side effects ------------------------------------------------ */

  useEffect(() => {
    if (!open) return

    restoreFocusRef.current = document.activeElement as HTMLElement | null
    reset()

    // The amount is the first thing anyone wants to type.
    const timer = window.setTimeout(() => amountRef.current?.focus(), 20)

    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    return () => {
      window.clearTimeout(timer)
      document.body.style.overflow = overflow
      restoreFocusRef.current?.focus()
    }
  }, [open, reset])

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        requestClose()
        return
      }

      if (event.key !== 'Tab' || !panelRef.current) return

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((element) => element.offsetParent !== null)

      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, requestClose])

  if (!open) return null

  /* Validation ------------------------------------------------------------- */

  function validate(): FieldErrors {
    const next: FieldErrors = {}
    if (draft.amount <= 0) next.amount = 'Ingresá un monto mayor a cero.'
    if (!draft.category) next.category = 'Elegí una categoría.'
    return next
  }

  function handleSave() {
    const found = validate()
    setErrors(found)

    // Send focus to the first thing that needs fixing.
    if (found.amount) {
      amountRef.current?.focus()
      return
    }
    if (found.category) {
      categoryRef.current?.focus()
      return
    }

    onSave({
      id: crypto.randomUUID(),
      date: draft.date,
      description: draft.description.trim(),
      amount: draft.amount,
      type: draft.type,
      category: draft.category,
    })

    reset()
    onClose()
  }

  const isExpense = draft.type === 'gasto'

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-ink/45 sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex w-full flex-col bg-surface sm:max-h-full sm:w-[35rem] sm:rounded-card sm:shadow-modal"
      >
        <div className="flex items-center justify-between border-b border-rule-soft px-5 py-4 sm:px-8 sm:py-6">
          <h2 id={titleId} className="text-[1.5rem] font-bold">
            Agregar movimiento
          </h2>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Cerrar"
            className="flex size-12 items-center justify-center rounded-control border border-rule-field text-ink-strong transition-colors duration-150 hover:bg-surface-sunk"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6">
          <div className="flex flex-col gap-2">
            <span className="text-[1.0625rem] font-bold" id="tipo-label">
              Tipo de movimiento
            </span>
            <div
              role="group"
              aria-labelledby="tipo-label"
              className="flex h-13 overflow-hidden rounded-control border-2 border-rule-field"
            >
              {(['gasto', 'ingreso'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={draft.type === type}
                  onClick={() => setDraft((d) => ({ ...d, type }))}
                  className={cn(
                    'flex-1 text-[1.125rem] font-bold transition-colors duration-150',
                    draft.type === type
                      ? 'bg-violet text-white'
                      : 'bg-surface text-ink-muted hover:bg-surface-sunk',
                  )}
                >
                  {type === 'gasto' ? 'Gasto' : 'Ingreso'}
                </button>
              ))}
            </div>
          </div>

          <Field label="Monto en pesos (ARS)" htmlFor="monto-mov" error={errors.amount}>
            <div className={cn(fieldShell, fieldBorder(Boolean(errors.amount)))}>
              <span aria-hidden="true" className="text-[1.1875rem] text-ink-muted">
                $
              </span>
              <input
                id="monto-mov"
                ref={amountRef}
                type="text"
                inputMode="numeric"
                value={draft.amount > 0 ? formatNumber(draft.amount) : ''}
                aria-invalid={Boolean(errors.amount)}
                aria-describedby={errors.amount ? 'monto-mov-error' : undefined}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, '')
                  setTouched(true)
                  setDraft((d) => ({ ...d, amount: digits ? Number(digits) : 0 }))
                  if (errors.amount) setErrors((e) => ({ ...e, amount: undefined }))
                }}
                onBlur={() => {
                  if (draft.amount <= 0 && touched) {
                    setErrors((e) => ({ ...e, amount: 'Ingresá un monto mayor a cero.' }))
                  }
                }}
                placeholder="0"
                className="w-full bg-transparent text-[1.1875rem] font-bold tabular outline-none"
              />
              <span className="rounded-md bg-surface-sunk px-2.5 py-1 text-[0.9375rem] font-bold text-ink-muted">
                ARS
              </span>
            </div>
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Categoría" htmlFor="categoria-mov" error={errors.category}>
              <select
                id="categoria-mov"
                ref={categoryRef}
                value={draft.category}
                aria-invalid={Boolean(errors.category)}
                onChange={(event) => {
                  setDraft((d) => ({ ...d, category: event.target.value as CategoryKey }))
                  if (errors.category) setErrors((e) => ({ ...e, category: undefined }))
                }}
                className={cn(fieldShell, fieldBorder(Boolean(errors.category)), 'appearance-none')}
              >
                {BUDGET_CATEGORIES.map((category) => (
                  <option key={category.key} value={category.key}>
                    {category.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Fecha" htmlFor="fecha-mov">
              <input
                id="fecha-mov"
                type="date"
                value={draft.date}
                max={todayISO()}
                onChange={(event) => setDraft((d) => ({ ...d, date: event.target.value }))}
                className={cn(fieldShell, fieldBorder(false))}
              />
            </Field>
          </div>

          <Field label="Descripción" htmlFor="descripcion-mov" optional>
            <input
              id="descripcion-mov"
              type="text"
              value={draft.description}
              onChange={(event) => setDraft((d) => ({ ...d, description: event.target.value }))}
              placeholder="Ej.: Farmacia, verdulería…"
              className={cn(fieldShell, fieldBorder(false))}
            />
          </Field>
        </div>

        {/* Pinned on mobile so it stays above the keyboard. */}
        <div className="flex gap-3 border-t border-rule-soft bg-surface px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:justify-end sm:px-8 sm:py-5 sm:pb-5">
          <Button tone="secondary" className="flex-1 sm:flex-none" onClick={requestClose}>
            Cancelar
          </Button>
          <Button className="flex-[1.4] sm:flex-none" onClick={handleSave}>
            <CheckIcon size={20} />
            Guardar {isExpense ? 'gasto' : 'ingreso'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function blankDraft(type: 'gasto' | 'ingreso'): TransactionDraft {
  return {
    type,
    amount: 0,
    category: BUDGET_CATEGORIES[0].key,
    date: todayISO(),
    description: '',
  }
}
