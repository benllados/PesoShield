import { HomeOverview, RecentMovements } from '@/components/HomeOverview'
import { RatesPanel } from '@/components/RatesPanel'
import { fetchAllRates } from '@/lib/fetch-rates'

/**
 * Inicio.
 *
 * The hierarchy is the central change of the redesign: this page used to open
 * with exchange rates, and now opens with the reader's own money. Rates are
 * still here, below, because they matter — just not more than the question
 * "how much do I have left?".
 *
 * Rates are fetched on the server and revalidated every 15 minutes; the
 * personal panels are client components because budgets and movements live in
 * the browser.
 */
export const revalidate = 900

export default async function Inicio() {
  const rates = await fetchAllRates()

  return (
    <div className="flex flex-col gap-7">
      <HomeOverview />

      <div className="grid items-start gap-6 lg:grid-cols-[1.2fr_1fr]">
        <RecentMovements />
        <RatesPanel rates={rates} />
      </div>
    </div>
  )
}
