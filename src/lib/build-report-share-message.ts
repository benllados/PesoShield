export function buildReportShareMessage(
  report: string,
  month: string
): string {
  return [
    'Hola familia \u{1f44b}',
    `Les comparto mi resumen financiero de ${month} desde PesoShield:`,
    '',
    report,
    '',
    '\u{1f6e1}\ufe0f Generado por PesoShield',
  ].join('\n')
}
