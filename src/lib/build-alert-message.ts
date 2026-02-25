import type { Alert } from './types'

const SEVERITY_EMOJI: Record<Alert['severity'], string> = {
  critical: '\u{1f6a8}',
  warning: '\u{26a0}\ufe0f',
  info: '\u{1f4ca}',
}

export function buildAlertMessage(alerts: Alert[]): string {
  if (alerts.length === 0) return ''

  const greeting = 'Hola familia \u{1f44b}'
  const intro = 'Les escribo desde PesoShield con algunas alertas:'

  const alertLines = alerts
    .map((a) => `${SEVERITY_EMOJI[a.severity]} ${a.title}`)
    .join('\n')

  const closing = '\u00bfPueden estar atentos? Gracias! \u{1f64f}'

  return [greeting, intro, '', alertLines, '', closing].join('\n')
}
