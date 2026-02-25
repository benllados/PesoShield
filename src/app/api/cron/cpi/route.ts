import { fetchCPI } from '@/lib/fetch-rates'
import { NextResponse } from 'next/server'

export async function GET() {
  const cpi = await fetchCPI()

  if (!cpi) {
    return NextResponse.json(
      { error: 'No se pudo obtener datos del IPC' },
      { status: 502 }
    )
  }

  return NextResponse.json(cpi)
}
