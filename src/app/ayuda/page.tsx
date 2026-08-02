'use client'

import { useChat } from '@ai-sdk/react'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

import { FamilyHelpCard } from '@/components/FamilyHelpCard'
import {
  AlertCircleIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExchangeIcon,
  PlusIcon,
  SearchIcon,
  SendIcon,
  ShieldMark,
} from '@/components/icons'
import { Button, Card, Chip, cn } from '@/components/ui'

/**
 * Ayuda.
 *
 * Ordered by how often each thing actually resolves the question: the FAQ
 * first, the assistant second, a real person third. The previous version led
 * with the chat box, which made every small doubt into a conversation.
 */

interface Faq {
  question: string
  answer: React.ReactNode
  /** Plain text, so search doesn't have to walk the rendered answer. */
  text: string
}

const FAQS: readonly Faq[] = [
  {
    question: '¿Qué diferencia hay entre compra y venta?',
    text: 'compra venta precio banco casa de cambio comisión diferencia',
    answer: (
      <>
        El banco o la casa de cambio siempre tiene dos precios. Te <strong>compra</strong> tus
        dólares a un precio, y te los <strong>vende</strong> a otro un poco más alto. Esa
        diferencia es su comisión. Si vas a vender dólares, mirá la columna{' '}
        <strong>compra</strong>; si vas a comprarlos, mirá <strong>venta</strong>.
      </>
    ),
  },
  {
    question: '¿Qué es el dólar blue? ¿Es legal usarlo?',
    text: 'blue informal legal mep paralelo',
    answer: (
      <>
        Es el dólar que se compra y se vende fuera de los canales oficiales. Lo mostramos porque
        es una referencia que se usa mucho, pero comprarlo o venderlo así no está regulado. La
        alternativa legal con un precio parecido es el dólar MEP, que se opera a través de un
        banco o un broker.{' '}
        <Link href="/convertir" className="font-bold text-violet-deep hover:underline">
          Ver cotizaciones →
        </Link>
      </>
    ),
  },
  {
    question: '¿Qué es el dólar MEP?',
    text: 'mep bolsa legal broker banco',
    answer: (
      <>
        Es un dólar legal que se compra a través de la bolsa: se compran bonos en pesos y se
        venden en dólares. Lo hacés desde tu banco o un broker, queda registrado a tu nombre, y
        el precio suele estar cerca del blue.
      </>
    ),
  },
  {
    question: '¿Cómo armo mi presupuesto del mes?',
    text: 'presupuesto categorias plan mi mes armar',
    answer: (
      <>
        Entrá a{' '}
        <Link href="/mi-mes" className="font-bold text-violet-deep hover:underline">
          Mi mes
        </Link>{' '}
        y escribí cuánto pensás gastar en cada categoría. No hace falta que sea exacto. A medida
        que cargues movimientos, la columna “Gastado” se completa sola y te avisamos si una
        categoría se acerca al límite o se pasa.
      </>
    ),
  },
  {
    question: '¿Cómo cargo un gasto?',
    text: 'cargar gasto ingreso movimiento agregar anotar',
    answer: (
      <>
        Desde{' '}
        <Link href="/movimientos" className="font-bold text-violet-deep hover:underline">
          Movimientos
        </Link>
        , tocá “Agregar movimiento”. Elegí si es un gasto o un ingreso, escribí el monto, la
        categoría y la fecha. La descripción es opcional. Si te equivocás, después de guardar
        tenés unos segundos para deshacerlo.
      </>
    ),
  },
  {
    question: '¿Mis datos están seguros? ¿Quién los ve?',
    text: 'datos seguros privacidad quien ve familia compartir',
    answer: (
      <>
        Tu presupuesto y tus movimientos se guardan en este dispositivo. No los publicamos ni los
        vendemos. Si pedís ayuda a tu familia, tu resumen se comparte{' '}
        <strong>solamente</strong> si marcás la casilla correspondiente, y antes de enviarlo te
        mostramos exactamente qué texto se va a mandar.
      </>
    ),
  },
]

const SUGGESTED = [
  '¿Qué es el dólar MEP?',
  '¿Cómo cargo un gasto?',
  '¿Cómo voy este mes?',
]

function messageText(parts: Array<{ type: string; text?: string }>): string {
  return parts
    .filter((part) => part.type === 'text' && part.text)
    .map((part) => part.text)
    .join('')
}

export default function AyudaPage() {
  const [query, setQuery] = useState('')
  const [openFaq, setOpenFaq] = useState<string | null>(FAQS[1].question)

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return FAQS
    return FAQS.filter(
      (faq) =>
        faq.question.toLowerCase().includes(needle) || faq.text.includes(needle),
    )
  }, [query])

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-[2rem] font-bold">¿En qué te podemos ayudar?</h1>
        <p className="text-[1.125rem] text-ink-muted">
          Buscá una respuesta, preguntale al asistente o pedí ayuda a tu familia.
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-4">
            <h2 className="text-[1.375rem] font-bold">Preguntas frecuentes</h2>

            <div className="flex h-13 items-center gap-2.5 rounded-control border-2 border-rule-field bg-surface px-4">
              <SearchIcon size={20} className="shrink-0 text-ink-muted" />
              <label htmlFor="buscar-faq" className="sr-only">
                Buscar en las preguntas frecuentes
              </label>
              <input
                id="buscar-faq"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar en las preguntas… ej.: “dólar blue”"
                className="w-full bg-transparent text-[1.0625rem] outline-none"
              />
            </div>

            <p aria-live="polite" className="sr-only">
              {results.length} preguntas
            </p>

            {results.length === 0 ? (
              <p className="py-4 text-[1.0625rem] text-ink-muted">
                No encontramos una pregunta con esas palabras. Probá con otras, o preguntale al
                asistente más abajo.
              </p>
            ) : (
              <div className="flex flex-col">
                {results.map((faq) => {
                  const open = openFaq === faq.question
                  return (
                    <div key={faq.question} className="border-b border-rule-soft last:border-b-0">
                      <h3>
                        <button
                          type="button"
                          aria-expanded={open}
                          onClick={() => setOpenFaq(open ? null : faq.question)}
                          className="flex w-full items-center justify-between gap-3 py-4 text-left"
                        >
                          <span
                            className={cn(
                              'text-[1.125rem] font-bold',
                              open && 'text-violet-deep',
                            )}
                          >
                            {faq.question}
                          </span>
                          {open ? (
                            <ChevronUpIcon size={20} className="shrink-0 text-violet-deep" />
                          ) : (
                            <ChevronDownIcon size={20} className="shrink-0 text-ink-strong" />
                          )}
                        </button>
                      </h3>
                      {open ? (
                        <p className="pb-4 text-[1.0625rem] leading-relaxed text-ink-strong">
                          {faq.answer}
                        </p>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Assistant />
        </div>

        <div className="flex flex-col gap-6">
          <FamilyHelpCard />

          <Card className="flex flex-col gap-3">
            <h2 className="text-[1.375rem] font-bold">Accesos rápidos</h2>
            <QuickLink href="/convertir" icon={<ExchangeIcon size={20} />}>
              Ver cotizaciones de hoy
            </QuickLink>
            <QuickLink href="/mi-mes" icon={<CalendarIcon size={20} />}>
              Ir a Mi mes
            </QuickLink>
            <QuickLink href="/movimientos" icon={<PlusIcon size={20} />}>
              Agregar un movimiento
            </QuickLink>
          </Card>
        </div>
      </div>
    </div>
  )
}

function QuickLink({
  href,
  icon,
  children,
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex h-13 items-center gap-3 rounded-control border border-rule px-4 text-[1.0625rem] font-bold transition-colors duration-150 hover:bg-surface-sunk"
    >
      <span className="text-violet-deep">{icon}</span>
      {children}
    </Link>
  )
}

/* Assistant ---------------------------------------------------------------- */

function Assistant() {
  const { messages, sendMessage, status, error } = useChat()
  const [input, setInput] = useState('')
  const [failures, setFailures] = useState(0)
  const endRef = useRef<HTMLDivElement>(null)

  const thinking = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, thinking])

  useEffect(() => {
    if (error) setFailures((count) => count + 1)
  }, [error])

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || thinking) return
    setInput('')
    await sendMessage({ text: trimmed })
  }

  return (
    <section className="overflow-hidden rounded-card border border-rule bg-surface shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule-soft px-5 py-4 sm:px-7">
        <h2 className="text-[1.375rem] font-bold">Preguntale al asistente</h2>
        <span className="text-[0.9375rem] text-ink-muted">
          Respuestas sobre la app y tus números
        </span>
      </div>

      <div className="flex flex-col gap-4 bg-paper px-5 py-5 sm:px-7">
        <Bubble from="assistant">
          Hola. Podés preguntarme sobre el dólar, tu presupuesto o cómo usar la app. No te puedo
          decir si conviene comprar o vender — eso depende de tus planes — pero sí te muestro los
          datos.
        </Bubble>

        {messages.map((message) => (
          <Bubble key={message.id} from={message.role === 'user' ? 'user' : 'assistant'}>
            {messageText(message.parts)}
          </Bubble>
        ))}

        {thinking ? (
          <div role="status" className="flex items-center gap-2.5 pl-13 text-[1rem] text-ink-muted">
            <span className="flex gap-1" aria-hidden="true">
              <Dot delay="0ms" />
              <Dot delay="150ms" />
              <Dot delay="300ms" />
            </span>
            Pensando…
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="flex flex-col gap-2 rounded-card border border-red-line bg-red-soft p-4"
          >
            <span className="flex items-center gap-2 text-[1rem] font-bold text-red-deep">
              <AlertCircleIcon size={18} />
              No pude responder esta vez
            </span>
            <p className="text-[0.9375rem] text-red-deep">
              Probá de nuevo o buscá en las preguntas frecuentes de arriba.
              {failures >= 2
                ? ' Si sigue fallando, pedile ayuda a tu familia con la tarjeta de al lado.'
                : ''}
            </p>
          </div>
        ) : null}

        {messages.length === 0 && !thinking ? (
          <div className="flex flex-wrap gap-2 pl-13">
            {SUGGESTED.map((question) => (
              <Chip key={question} onClick={() => send(question)}>
                {question}
              </Chip>
            ))}
          </div>
        ) : null}

        <div ref={endRef} />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          void send(input)
        }}
        className="flex gap-3 border-t border-rule-soft px-5 py-4 sm:px-7"
      >
        <label htmlFor="pregunta" className="sr-only">
          Escribí tu pregunta
        </label>
        <input
          id="pregunta"
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Escribí tu pregunta…"
          className="h-14 flex-1 rounded-control border-2 border-rule-field bg-surface px-4 text-[1.0625rem]"
        />
        <Button type="submit" disabled={!input.trim()} loading={thinking}>
          {!thinking ? <SendIcon size={20} /> : null}
          Enviar
        </Button>
      </form>
    </section>
  )
}

function Bubble({ from, children }: { from: 'user' | 'assistant'; children: React.ReactNode }) {
  const isUser = from === 'user'

  return (
    <div className={cn('flex items-start gap-3', isUser && 'flex-row-reverse')}>
      {!isUser ? (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-soft text-violet-deep">
          <ShieldMark size={20} />
        </span>
      ) : null}
      <div
        className={cn(
          'max-w-[32rem] px-4 py-3 text-[1.0625rem] leading-relaxed',
          isUser
            ? 'rounded-[16px_4px_16px_16px] border border-violet-line bg-violet-soft'
            : 'rounded-[4px_16px_16px_16px] border border-rule bg-surface',
        )}
      >
        {children}
      </div>
    </div>
  )
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="size-1.5 animate-bounce rounded-full bg-ink-subtle"
      style={{ animationDelay: delay }}
    />
  )
}
