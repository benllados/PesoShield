import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'

export const runtime = 'edge'

const REPORT_SYSTEM_PROMPT = `Sos el asistente financiero de PesoShield, una app para personas mayores en Argentina.
Tu tarea es generar un resumen mensual de finanzas personales.

Reglas:
- Escribi en espanol rioplatense (vos, tenes, podes)
- Se calido y claro, como hablandole a tu abuelo/a
- Usa emojis moderados para separar secciones
- NO des consejos de inversion
- NO inventes datos, usa SOLO los numeros que te paso
- Mantene un tono optimista pero honesto
- Maximo 400 palabras

Estructura del resumen:
1. Saludo y resumen general (1 oracion)
2. Estado del presupuesto por categoria (las que tienen datos)
3. Comparacion con el mes anterior (si hay datos)
4. Impacto del tipo de cambio (menciona el blue y oficial)
5. Un consejo practico para el proximo mes
6. Cierre motivacional`

export async function POST(req: Request) {
  try {
    const { context } = await req.json()

    const result = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: REPORT_SYSTEM_PROMPT,
      prompt: `Genera el resumen mensual con estos datos:\n${JSON.stringify(context, null, 2)}`,
      maxOutputTokens: 800,
    })

    return Response.json({ report: result.text })
  } catch (error) {
    console.error('Report generation failed:', error)
    return Response.json(
      { error: 'No se pudo generar el resumen' },
      { status: 500 }
    )
  }
}
