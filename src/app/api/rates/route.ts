import { fetchAllRates } from '@/lib/fetch-rates'
import { NextResponse } from 'next/server'

export const revalidate = 300

export async function GET() {
  const rates = await fetchAllRates()
  return NextResponse.json(rates, {
    headers: {
      'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
    },
  })
}
