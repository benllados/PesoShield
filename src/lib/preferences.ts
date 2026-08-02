const PREFS_KEY = 'pesoshield-preferences'

export interface UserPreferences {
  currencyDisplay: 'ARS' | 'USD'
  notifyRateSpike: boolean
  notifyBudgetThreshold: boolean
  /** Who "pedir ayuda" writes to. Stored locally; never sent anywhere. */
  familyName: string
  familyPhone: string
}

const DEFAULT_PREFERENCES: UserPreferences = {
  currencyDisplay: 'ARS',
  notifyRateSpike: true,
  notifyBudgetThreshold: true,
  familyName: '',
  familyPhone: '',
}

export function getPreferences(): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return DEFAULT_PREFERENCES
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_PREFERENCES
  }
}

export function savePreferences(prefs: UserPreferences): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}
