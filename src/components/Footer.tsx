/**
 * The footer carries the two things the handoff asks to be stated plainly and
 * permanently: where the rates come from, and that none of this is financial
 * advice.
 */
export function Footer() {
  return (
    <footer className="border-t border-rule bg-surface">
      <div className="mx-auto flex max-w-[1160px] flex-col gap-2 px-4 py-5 text-[0.9375rem] text-ink-muted sm:flex-row sm:justify-between sm:px-6">
        <span>PesoShield 2026 · Hecho para las familias argentinas</span>
        <span>Cotizaciones de fuentes públicas · No es asesoramiento financiero</span>
      </div>
    </footer>
  )
}
