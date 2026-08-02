'use client'

import { useEffect, useMemo, useState } from 'react'

import { HeartIcon, WhatsAppIcon } from '@/components/icons'
import { Field, cn, fieldBorder, fieldShell } from '@/components/ui'
import {
  buildBudgetLines,
  getMonthTotals,
  getPlannedBudget,
  getSpentByCategory,
} from '@/lib/budget'
import {
  currentMonthKey,
  daysLeftInMonth,
  formatARS,
  formatMonthLabel,
  formatWholePercent,
} from '@/lib/format'
import { getPreferences, savePreferences } from '@/lib/preferences'

/**
 * Asking family for help.
 *
 * The consent rule is the point of this component: the financial summary is
 * attached only when the box is ticked, the box starts unticked, and whatever
 * would be sent is shown in full underneath first. Nothing about someone's
 * money leaves this screen without them having read the exact words.
 *
 * The contact is stored locally and never transmitted — the WhatsApp handoff
 * happens in the user's own client via a wa.me link.
 */
export function FamilyHelpCard() {
  const monthKey = currentMonthKey()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [includeSummary, setIncludeSummary] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const prefs = getPreferences()
    setName(prefs.familyName)
    setPhone(prefs.familyPhone)
    setMessage(
      `Hola${prefs.familyName ? ` ${prefs.familyName}` : ''}, ¿me das una mano con los gastos de este mes cuando puedas? Gracias.`,
    )
    setLoaded(true)
  }, [])

  function persistContact(nextName: string, nextPhone: string) {
    savePreferences({ ...getPreferences(), familyName: nextName, familyPhone: nextPhone })
  }

  /** Built fresh each render so the preview can never drift from what is sent. */
  const summary = useMemo(() => {
    if (!includeSummary || !loaded) return ''

    const lines = buildBudgetLines(getPlannedBudget(monthKey), getSpentByCategory(monthKey))
    const totals = getMonthTotals(monthKey)
    const planned = lines.reduce((sum, line) => sum + line.planned, 0)
    const spent = lines.reduce((sum, line) => sum + line.spent, 0)
    const daysLeft = daysLeftInMonth(monthKey)

    const parts = [
      `Mi resumen de ${formatMonthLabel(monthKey)}:`,
      `• Ingresos: ${formatARS(totals.income)} ARS`,
      `• Gastado: ${formatARS(totals.spent)} ARS`,
      `• Disponible: ${formatARS(totals.available)} ARS`,
    ]

    if (planned > 0) {
      parts.push(
        `• Usé el ${formatWholePercent((spent / planned) * 100)} del presupuesto${
          daysLeft > 0 ? `, quedan ${daysLeft} días` : ''
        }`,
      )
    }

    return parts.join('\n')
  }, [includeSummary, loaded, monthKey])

  const fullMessage = summary ? `${message}\n\n${summary}` : message

  const waHref = useMemo(() => {
    const digits = phone.replace(/\D/g, '')
    const text = encodeURIComponent(fullMessage)
    return digits ? `https://wa.me/${digits}?text=${text}` : `https://wa.me/?text=${text}`
  }, [phone, fullMessage])

  return (
    <section className="flex flex-col gap-4 rounded-card border border-rule bg-surface p-5 shadow-card sm:p-7">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-control bg-green-soft text-green">
          <HeartIcon size={22} />
        </span>
        <h2 className="text-[1.375rem] font-bold">Pedir ayuda a tu familia</h2>
      </div>

      <p className="text-[1rem] leading-relaxed text-ink-muted">
        Le mandamos un mensaje por WhatsApp a quien elijas. Podés editarlo antes de enviar.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" htmlFor="familia-nombre" optional>
          <input
            id="familia-nombre"
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              persistContact(event.target.value, phone)
            }}
            placeholder="Ej.: Carla"
            className={cn(fieldShell, fieldBorder(false))}
          />
        </Field>

        <Field
          label="WhatsApp"
          htmlFor="familia-telefono"
          hint="Con código de país, ej.: 54 9 11 …"
          optional
        >
          <input
            id="familia-telefono"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value)
              persistContact(name, event.target.value)
            }}
            placeholder="54 9 11 …"
            className={cn(fieldShell, fieldBorder(false))}
          />
        </Field>
      </div>

      <Field label="Tu mensaje" htmlFor="familia-mensaje" hint="Podés editarlo antes de enviar">
        <textarea
          id="familia-mensaje"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
          className="w-full rounded-control border-2 border-rule-field bg-surface px-4 py-3 text-[1.0625rem] leading-relaxed"
        />
      </Field>

      <label className="flex cursor-pointer items-start gap-3 rounded-control bg-surface-sunk px-4 py-3.5">
        <input
          type="checkbox"
          checked={includeSummary}
          onChange={(event) => setIncludeSummary(event.target.checked)}
          className="mt-0.5 size-6 shrink-0 accent-violet"
        />
        <span className="text-[1rem] leading-relaxed text-ink-strong">
          Incluir mi resumen del mes (ingresos, gastos y disponible).{' '}
          <strong>Solo se comparte si marcás esta casilla.</strong>
        </span>
      </label>

      {/* Exactly what will be sent, shown before it is sent. */}
      {includeSummary ? (
        <div className="rounded-control border border-rule bg-paper px-4 py-3">
          <strong className="text-[0.9375rem] text-ink-muted">Se va a compartir esto:</strong>
          <pre className="mt-2 whitespace-pre-wrap font-sans text-[1rem] leading-relaxed text-ink">
            {summary}
          </pre>
        </div>
      ) : null}

      <a
        href={waHref}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-14 items-center justify-center gap-2.5 rounded-control bg-green px-6 text-[1.125rem] font-bold text-white transition-colors duration-150 hover:bg-green-deep"
      >
        <WhatsAppIcon size={22} />
        Enviar por WhatsApp
      </a>
    </section>
  )
}
