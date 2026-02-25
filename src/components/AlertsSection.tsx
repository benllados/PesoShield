'use client'

import { useState, useEffect } from 'react'
import type { RateDisplay } from '@/lib/fetch-rates'
import { checkAllAlerts } from '@/lib/alerts'
import { buildAlertMessage } from '@/lib/build-alert-message'
import { AlertBanner } from './AlertBanner'
import { StatusBanner } from './StatusBanner'
import { FamilyHelpModal } from './FamilyHelpModal'
import type { Alert } from '@/lib/types'

const PREV_RATES_KEY = 'pesoshield-prev-rates'
const DISMISSED_KEY = 'pesoshield-dismissed-alerts'

function getDismissedAlerts(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as { ids: string[]; date: string }
    // Reset dismissals daily
    if (parsed.date !== new Date().toISOString().slice(0, 10)) {
      localStorage.removeItem(DISMISSED_KEY)
      return new Set()
    }
    return new Set(parsed.ids)
  } catch {
    return new Set()
  }
}

function saveDismissedAlert(id: string) {
  const current = getDismissedAlerts()
  current.add(id)
  localStorage.setItem(
    DISMISSED_KEY,
    JSON.stringify({
      ids: Array.from(current),
      date: new Date().toISOString().slice(0, 10),
    })
  )
}

function getPreviousRates(): RateDisplay[] | null {
  try {
    const raw = localStorage.getItem(PREV_RATES_KEY)
    if (!raw) return null
    return JSON.parse(raw) as RateDisplay[]
  } catch {
    return null
  }
}

function savePreviousRates(rates: RateDisplay[]) {
  localStorage.setItem(PREV_RATES_KEY, JSON.stringify(rates))
}

interface AlertsSectionProps {
  rates: RateDisplay[]
}

export function AlertsSection({ rates }: AlertsSectionProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [showAll, setShowAll] = useState(false)
  const [helpModalOpen, setHelpModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const previousRates = getPreviousRates()
    const allAlerts = checkAllAlerts(rates, previousRates)
    setAlerts(allAlerts)
    setDismissed(getDismissedAlerts())

    // Save current rates for next visit comparison
    if (rates.length > 0) {
      savePreviousRates(rates)
    }
    setMounted(true)
  }, [rates])

  const handleDismiss = (id: string) => {
    saveDismissedAlert(id)
    setDismissed((prev) => new Set(prev).add(id))
  }

  if (!mounted) return null

  const visibleAlerts = alerts.filter((a) => !dismissed.has(a.id))
  const displayAlerts = showAll ? visibleAlerts : visibleAlerts.slice(0, 3)

  if (visibleAlerts.length === 0) {
    return (
      <StatusBanner
        budgetHealthy={true}
        title="Todo tranquilo"
        message="No hay alertas por ahora. Tu presupuesto y los tipos de cambio estan estables."
      />
    )
  }

  const alertMessage = buildAlertMessage(visibleAlerts)

  return (
    <div className="flex flex-col gap-3">
      {displayAlerts.map((alert) => (
        <AlertBanner key={alert.id} alert={alert} onDismiss={handleDismiss} />
      ))}

      {visibleAlerts.length > 3 && !showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="self-center text-primary hover:text-primary-dark font-medium text-lg transition-colors"
        >
          Ver todas las alertas ({visibleAlerts.length})
        </button>
      )}

      <button
        type="button"
        onClick={() => setHelpModalOpen(true)}
        className="self-start inline-flex items-center gap-2 px-5 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold text-base transition-colors shadow-sm mt-1"
      >
        <span className="material-symbols-outlined text-xl">share</span>
        Compartir alertas por WhatsApp
      </button>

      <FamilyHelpModal
        open={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        message={alertMessage}
      />
    </div>
  )
}
