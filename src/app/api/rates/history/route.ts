import { fetchRateHistory } from '@/lib/fetch-rates'
import { NextResponse } from 'next/server'

export const revalidate = 3600 // 1 hour

export async function GET() {
  const history = await fetchRateHistory()
  return NextResponse.json(history, {
    headers: {
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200',
    },
  })
}
