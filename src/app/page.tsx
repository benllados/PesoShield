import Link from 'next/link'
import { RateCard } from '@/components/RateCard'
import { RateCardCompact } from '@/components/RateCardCompact'
import { CpiCard } from '@/components/CpiCard'
import { AlertsSection } from '@/components/AlertsSection'
import { DashboardHelpButton } from '@/components/DashboardHelpButton'
import { fetchAllRates, fetchCPI } from '@/lib/fetch-rates'

export const revalidate = 900 // 15 minutes ISR

export default async function Dashboard() {
  const [rates, cpi] = await Promise.all([fetchAllRates(), fetchCPI()])

  // Top row: 3 main rates
  const oficial = rates.find((r) => r.type === 'oficial')
  const blue = rates.find((r) => r.type === 'blue')
  const mep = rates.find((r) => r.type === 'bolsa')

  // Bottom row: compact cards
  const ccl = rates.find((r) => r.type === 'contadoconliqui')
  const tarjeta = rates.find((r) => r.type === 'tarjeta')

  return (
    <div>
      {/* Greeting */}
      <section className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
            ¡Hola! Así está todo hoy...
          </h2>
          <DashboardHelpButton />
        </div>
      </section>

      {/* Smart Alerts */}
      <AlertsSection rates={rates} />

      {/* Exchange Rates Section */}
      <section className="mb-12 mt-10">
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-primary text-3xl">
            currency_exchange
          </span>
          <h3 className="text-2xl font-bold text-text-primary">
            Tipos de cambio
          </h3>
        </div>

        {rates.length === 0 ? (
          <div className="bg-surface rounded-lg border border-border p-8">
            <p className="text-lg text-text-secondary">
              No pudimos cargar los tipos de cambio. Intentá recargar la página.
            </p>
          </div>
        ) : (
          <>
            {/* Top row: 3 main rate cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {oficial && (
                <RateCard
                  label="Dólar Oficial"
                  buy={oficial.buy}
                  sell={oficial.sell}
                  source={oficial.source}
                  updatedAt={oficial.updatedAt}
                  badge="Banco Nación"
                />
              )}
              {blue && (
                <RateCard
                  label="Dólar Blue"
                  buy={blue.buy}
                  sell={blue.sell}
                  source={blue.source}
                  updatedAt={blue.updatedAt}
                  highlighted={true}
                />
              )}
              {mep && (
                <RateCard
                  label="Dólar MEP"
                  buy={mep.buy}
                  sell={mep.sell}
                  source={mep.source}
                  updatedAt={mep.updatedAt}
                  badge="Bolsa"
                />
              )}
            </div>

            {/* Bottom row: compact cards + CPI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ccl && (
                <RateCardCompact
                  label="Contado con Liqui (CCL)"
                  price={(ccl.buy + ccl.sell) / 2}
                  icon="trending_flat"
                />
              )}
              {tarjeta && (
                <RateCardCompact
                  label="Dólar Tarjeta / Turista"
                  price={tarjeta.sell}
                  priceLabel="Venta"
                  icon="credit_card"
                />
              )}
              {cpi && (
                <CpiCard
                  period={cpi.period}
                  value={cpi.value}
                  previousValue={cpi.previousValue}
                />
              )}
            </div>
          </>
        )}
      </section>

      {/* CTA Buttons */}
      <section className="mt-12 flex flex-col gap-4">
        <Link
          href="/presupuesto"
          className="group relative w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary-dark text-white text-xl md:text-2xl font-bold py-6 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
        >
          <span>Ver mi presupuesto personal</span>
          <span className="material-symbols-outlined text-3xl transition-transform group-hover:translate-x-2">
            arrow_forward
          </span>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/simulador"
            className="group flex items-center justify-center gap-3 bg-surface border-2 border-primary text-primary hover:bg-primary hover:text-white text-lg md:text-xl font-bold py-5 px-6 rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            <span className="material-symbols-outlined text-2xl">calculate</span>
            <span>Simulador de conversion</span>
          </Link>
          <Link
            href="/resumen"
            className="group flex items-center justify-center gap-3 bg-surface border-2 border-primary text-primary hover:bg-primary hover:text-white text-lg md:text-xl font-bold py-5 px-6 rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            <span className="material-symbols-outlined text-2xl">auto_awesome</span>
            <span>Resumen mensual</span>
          </Link>
        </div>

        <p className="text-center text-text-secondary mt-2 text-lg">
          Revise sus gastos y ahorros con tranquilidad.
        </p>
      </section>
    </div>
  )
}
