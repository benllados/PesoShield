import { getTransactions } from './transactions'
import { getAllPlannedBudgets } from './budget'
import { getPreferences } from './preferences'

export function exportUserData() {
  const data = {
    exportedAt: new Date().toISOString(),
    app: 'PesoShield',
    transactions: getTransactions(),
    // Every month's plan, not just the current one.
    budget: getAllPlannedBudgets(),
    preferences: getPreferences(),
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pesoshield-datos-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
