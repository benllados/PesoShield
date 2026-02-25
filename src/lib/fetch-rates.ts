export interface DolarRate {
  moneda: string
  casa: string
  nombre: string
  compra: number
  venta: number
  fechaActualizacion: string
}

export interface RateDisplay {
  type: string
  label: string
  buy: number
  sell: number
  source: string
  updatedAt: string
}

const RATE_LABELS: Record<string, string> = {
  oficial: 'Dólar Oficial',
  blue: 'Dólar Blue',
  bolsa: 'Dólar MEP (Bolsa)',
  contadoconliqui: 'Dólar CCL',
  tarjeta: 'Dólar Tarjeta',
  mayorista: 'Dólar Mayorista',
  cripto: 'Dólar Cripto',
}

export async function fetchAllRates(): Promise<RateDisplay[]> {
  try {
    const res = await fetch('https://dolarapi.com/v1/dolares', {
      next: { revalidate: 900 }, // 15 min ISR cache
    })

    if (!res.ok) {
      throw new Error(`DolarAPI responded with ${res.status}`)
    }

    const data: DolarRate[] = await res.json()

    return data.map((rate) => ({
      type: rate.casa,
      label: RATE_LABELS[rate.casa] || rate.nombre,
      buy: rate.compra,
      sell: rate.venta,
      source: 'dolarapi',
      updatedAt: rate.fechaActualizacion,
    }))
  } catch (error) {
    console.error('DolarAPI fetch failed, trying Bluelytics fallback:', error)
    return fetchBluelyticssFallback()
  }
}

async function fetchBluelyticssFallback(): Promise<RateDisplay[]> {
  try {
    const res = await fetch('https://api.bluelytics.com.ar/v2/latest')
    if (!res.ok) throw new Error(`Bluelytics responded with ${res.status}`)

    const data = await res.json()
    const now = new Date().toISOString()

    return [
      {
        type: 'oficial',
        label: 'Dólar Oficial',
        buy: data.oficial.value_buy,
        sell: data.oficial.value_sell,
        source: 'bluelytics',
        updatedAt: now,
      },
      {
        type: 'blue',
        label: 'Dólar Blue',
        buy: data.blue.value_buy,
        sell: data.blue.value_sell,
        source: 'bluelytics',
        updatedAt: now,
      },
    ]
  } catch (error) {
    console.error('Bluelytics fallback also failed:', error)
    return []
  }
}

// ---------- Historical rates ----------

export interface RateHistoryPoint {
  date: string
  source: 'Oficial' | 'Blue'
  buy: number
  sell: number
}

interface BluelyticsEvolution {
  date: string
  source: string
  value_buy: number
  value_sell: number
}

export async function fetchRateHistory(): Promise<RateHistoryPoint[]> {
  try {
    const res = await fetch('https://api.bluelytics.com.ar/v2/evolution.json', {
      next: { revalidate: 3600 }, // 1 hour cache
    })

    if (!res.ok) {
      throw new Error(`Bluelytics evolution responded with ${res.status}`)
    }

    const data: BluelyticsEvolution[] = await res.json()

    return data
      .filter((d) => d.source === 'Oficial' || d.source === 'Blue')
      .map((d) => ({
        date: d.date,
        source: d.source as 'Oficial' | 'Blue',
        buy: d.value_buy,
        sell: d.value_sell,
      }))
  } catch (error) {
    console.error('Rate history fetch failed:', error)
    return []
  }
}

// ---------- CPI ----------

export interface CPIData {
  period: string
  value: number
  previousValue?: number
  monthlyChange?: number
}

export async function fetchCPI(): Promise<CPIData | null> {
  try {
    // IPC Núcleo Nacional, Base dic 2016 - monthly index from INDEC
    const res = await fetch(
      'https://apis.datos.gob.ar/series/api/series/?ids=148.3_INUCLEONAL_DICI_M_19&last=2&format=json',
      { next: { revalidate: 86400 } } // 24h cache
    )

    if (!res.ok) throw new Error(`datos.gob.ar responded with ${res.status}`)

    const data = await res.json()
    const rows = data.data

    if (!rows || rows.length === 0) return null

    const latest = rows[rows.length - 1]
    const previous = rows.length > 1 ? rows[rows.length - 2] : null

    const result: CPIData = {
      period: latest[0],
      value: latest[1],
    }

    if (previous) {
      result.previousValue = previous[1]
      result.monthlyChange =
        Math.round(((latest[1] / previous[1] - 1) * 100) * 10) / 10
    }

    return result
  } catch (error) {
    console.error('CPI fetch failed:', error)
    return null
  }
}
