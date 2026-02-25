import type { Transaction } from './types'

const STORAGE_KEY = 'pesoshield-transactions'

export function getTransactions(): Transaction[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Transaction[]) : []
  } catch {
    return []
  }
}

export function saveTransactions(txs: Transaction[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(txs))
}

export function addTransaction(tx: Transaction): Transaction[] {
  const txs = getTransactions()
  txs.push(tx)
  saveTransactions(txs)
  return txs
}

export function deleteTransaction(id: string): Transaction[] {
  const txs = getTransactions().filter((t) => t.id !== id)
  saveTransactions(txs)
  return txs
}
