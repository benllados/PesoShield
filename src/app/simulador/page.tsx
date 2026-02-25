'use client'

import { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { ConversionResult } from '@/components/ConversionResult'
import type { RateDisplay } from '@/lib/fetch-rates'

type Direction = 'usd-to-ars' | 'ars-to-usd'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const RATE_ORDER = ['oficial', 'blue', 'bolsa', 'contadoconliqui', 'tarjeta', 'cripto']

function formatInputNumber(n: number) {
  return n > 0
    ? new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(n)
    : ''
}

export default function SimuladorPage() {
  const [amount, setAmount] = useState(0)
  const [direction, setDirection] = useState<Direction>('usd-to-ars')

  const { data: rates, isLoading, error } = useSWR<RateDisplay[]>(
    '/api/rates',
    fetcher,
    { refreshInterval: 300_000 }
  )

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/\./g, '').replace(/,/g, '')
    setAmount(parseFloat(cleaned) || 0)
  }

  const toggleDirection = () => {
    setDirection((d) => (d === 'usd-to-ars' ? 'ars-to-usd' : 'usd-to-ars'))
  }

  const sortedRates = rates
    ? [...rates].sort(
        (a, b) => RATE_ORDER.indexOf(a.type) - RATE_ORDER.indexOf(b.type)
      )
    : []

  return (
    <div className="flex flex-col gap-8">
      {/* Back link + Title */}
      <div className="flex flex-col gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium text-lg mb-2 transition-colors w-fit"
        >
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
          Volver al inicio
        </Link>
        <h2 className="text-4xl md:text-5xl font-bold text-text-primary tracking-tight">
          Simulador de conversion
        </h2>
        <p className="text-xl text-text-secondary mt-1">
          Compara cuanto sale un monto en las distintas cotizaciones del dolar.
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-surface rounded-2xl border border-border shadow-[var(--shadow-soft)] p-6 md:p-8 flex flex-col gap-6">
        {/* Amount Input */}
        <div className="flex flex-col gap-2">
          <label className="text-lg font-medium text-text-secondary">
            {direction === 'usd-to-ars' ? 'Monto en dolares (USD)' : 'Monto en pesos (ARS)'}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-2xl font-bold">
              {direction === 'usd-to-ars' ? 'US$' : '$'}
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={formatInputNumber(amount)}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0"
              className="w-full pl-16 pr-4 py-4 bg-background border border-border rounded-xl text-text-primary text-3xl font-bold focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Direction Toggle */}
        <button
          type="button"
          onClick={toggleDirection}
          className="self-center flex items-center gap-3 px-6 py-3 bg-primary-light text-primary border-2 border-primary/20 rounded-xl font-bold text-lg hover:bg-primary hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">swap_horiz</span>
          {direction === 'usd-to-ars'
            ? 'Tengo dolares, quiero ver en pesos'
            : 'Tengo pesos, quiero ver en dolares'}
        </button>
      </div>

      {/* Results */}
      {isLoading && (
        <div className="flex flex-col gap-4 items-center justify-center min-h-[20vh]">
          <span className="material-symbols-outlined text-primary text-5xl animate-spin">
            progress_activity
          </span>
          <p className="text-xl text-text-secondary">Cargando cotizaciones...</p>
        </div>
      )}

      {error && (
        <div className="bg-surface rounded-lg border border-border p-8">
          <p className="text-lg text-text-secondary">
            No pudimos cargar los tipos de cambio. Intenta recargar la pagina.
          </p>
        </div>
      )}

      {sortedRates.length > 0 && amount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedRates.map((rate) => (
            <ConversionResult
              key={rate.type}
              label={rate.label}
              buy={rate.buy}
              sell={rate.sell}
              amount={amount}
              direction={direction}
              highlighted={rate.type === 'blue'}
            />
          ))}
        </div>
      )}

      {sortedRates.length > 0 && amount === 0 && (
        <div className="bg-surface rounded-2xl border border-border shadow-[var(--shadow-soft)] p-12 flex flex-col items-center gap-4 text-center">
          <div className="bg-primary-light p-5 rounded-full">
            <span className="material-symbols-outlined text-primary text-5xl">calculate</span>
          </div>
          <h3 className="text-2xl font-bold text-text-primary">
            Ingresa un monto para comparar
          </h3>
          <p className="text-lg text-text-secondary max-w-md">
            Escribi un monto arriba y vas a ver cuanto equivale en cada tipo de dolar.
          </p>
        </div>
      )}

      {/* Bottom back button */}
      <div className="flex justify-center pb-10">
        <Link
          href="/"
          className="inline-flex items-center gap-3 px-8 py-4 bg-surface border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-2xl font-bold text-xl transition-all duration-300 shadow-sm hover:shadow-md"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
