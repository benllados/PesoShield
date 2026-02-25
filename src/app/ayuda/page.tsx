'use client'

import { useChat } from '@ai-sdk/react'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { FamilyHelpButton } from '@/components/FamilyHelpButton'
import { FamilyHelpModal } from '@/components/FamilyHelpModal'
import { buildGenericHelpMessage } from '@/lib/build-help-message'

const SUGGESTED_QUESTIONS = [
  '¿Qué es el dólar blue?',
  '¿Cómo armo mi presupuesto?',
  '¿Qué es el dólar MEP?',
  '¿Cómo pido ayuda a mi familia?',
]

const QUICK_LINKS = [
  { href: '/', label: 'Ver tipos de cambio', icon: 'currency_exchange' },
  { href: '/presupuesto', label: 'Ir al presupuesto', icon: 'receipt_long' },
  { href: '/historial', label: 'Ver historial', icon: 'timeline' },
]

const WELCOME_MESSAGE =
  '¡Hola! Soy tu asistente de PesoShield. Preguntame lo que necesites sobre la app, el dólar, o tu presupuesto — estoy acá para ayudarte. 😊'

/** Extract plain text from a UIMessage's parts array */
function getMessageText(parts: Array<{ type: string; text?: string }>): string {
  return parts
    .filter((p) => p.type === 'text' && p.text)
    .map((p) => p.text)
    .join('')
}

export default function AyudaPage() {
  const { messages, sendMessage, status } = useChat()
  const [input, setInput] = useState('')
  const [helpModalOpen, setHelpModalOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const helpMessage = buildGenericHelpMessage()

  const isLoading = status === 'streaming' || status === 'submitted'

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    const text = input.trim()
    setInput('')
    await sendMessage({ text })
  }

  const handleSuggestedQuestion = async (question: string) => {
    await sendMessage({ text: question })
  }

  const hasUserMessages = messages.length > 0

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-text-secondary hover:text-primary transition-colors text-lg w-fit"
      >
        <span className="material-symbols-outlined text-xl">arrow_back</span>
        Volver al inicio
      </Link>

      {/* Page Title */}
      <div className="flex items-center gap-3">
        <div className="bg-primary-light p-3 rounded-xl">
          <span className="material-symbols-outlined text-primary text-3xl">help</span>
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
            ¿En qué te podemos ayudar?
          </h1>
          <p className="text-lg text-text-secondary mt-1">
            Preguntale al asistente o pedí ayuda a tu familia
          </p>
        </div>
      </div>

      {/* Main layout: Chat + Sidebar */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Chat Section */}
        <div className="flex-1 min-w-0">
          <div
            className="bg-surface rounded-2xl border border-border shadow-[var(--shadow-soft)] flex flex-col overflow-hidden"
            style={{ height: '520px' }}
          >
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4">
              {/* Welcome message (always shown) */}
              <div className="flex gap-3 items-start">
                <div className="bg-primary-light p-2 rounded-full shrink-0">
                  <span className="material-symbols-outlined text-primary text-lg">smart_toy</span>
                </div>
                <div className="bg-background border border-border-light rounded-2xl rounded-tl-md px-4 py-3 max-w-[85%]">
                  <p className="text-text-primary text-lg leading-relaxed">{WELCOME_MESSAGE}</p>
                </div>
              </div>

              {/* Suggested questions (only when no messages yet) */}
              {!hasUserMessages && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleSuggestedQuestion(q)}
                      className="px-4 py-2.5 rounded-xl bg-primary-light text-primary border border-purple-100 font-medium text-base hover:bg-purple-100 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat messages */}
              {messages.map((msg) => {
                const text = getMessageText(msg.parts as Array<{ type: string; text?: string }>)
                if (!text && msg.role === 'assistant' && isLoading) return null // skip empty streaming msg, show dots instead
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 items-start ${
                      msg.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="bg-primary-light p-2 rounded-full shrink-0">
                        <span className="material-symbols-outlined text-primary text-lg">
                          smart_toy
                        </span>
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-3 max-w-[85%] ${
                        msg.role === 'user'
                          ? 'bg-primary text-white rounded-tr-md'
                          : 'bg-background border border-border-light rounded-tl-md'
                      }`}
                    >
                      <p
                        className={`text-lg leading-relaxed whitespace-pre-wrap ${
                          msg.role === 'user' ? 'text-white' : 'text-text-primary'
                        }`}
                      >
                        {text}
                      </p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="bg-primary-20 p-2 rounded-full shrink-0">
                        <span className="material-symbols-outlined text-primary text-lg">
                          person
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex gap-3 items-start">
                  <div className="bg-primary-light p-2 rounded-full shrink-0">
                    <span className="material-symbols-outlined text-primary text-lg">
                      smart_toy
                    </span>
                  </div>
                  <div className="bg-background border border-border-light rounded-2xl rounded-tl-md px-4 py-3">
                    <div className="flex gap-1.5 items-center py-1">
                      <span
                        className="w-2.5 h-2.5 bg-primary-30 rounded-full animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      />
                      <span
                        className="w-2.5 h-2.5 bg-primary-30 rounded-full animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      />
                      <span
                        className="w-2.5 h-2.5 bg-primary-30 rounded-full animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="border-t border-border p-4">
              <form onSubmit={handleSubmit} className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribí tu pregunta acá..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-text-primary text-lg placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-30 focus:border-primary disabled:opacity-50 transition-colors"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="px-5 py-3 bg-primary text-white rounded-xl font-medium text-lg hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-xl">send</span>
                  <span className="hidden sm:inline">Enviar</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-72 flex flex-col gap-4">
          {/* Family Help Card */}
          <div className="bg-surface rounded-2xl border border-border shadow-[var(--shadow-soft)] p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl">family_star</span>
              <h3 className="text-xl font-bold text-text-primary">Ayuda familiar</h3>
            </div>
            <p className="text-text-secondary text-base leading-relaxed">
              Si necesitás ayuda con los gastos, mandales un mensaje a tu familia por WhatsApp.
            </p>
            <FamilyHelpButton onClick={() => setHelpModalOpen(true)} />
          </div>

          {/* Quick Links Card */}
          <div className="bg-surface rounded-2xl border border-border shadow-[var(--shadow-soft)] p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl">explore</span>
              <h3 className="text-xl font-bold text-text-primary">Accesos rápidos</h3>
            </div>
            <div className="flex flex-col gap-2">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-background transition-colors text-text-secondary hover:text-primary group"
                >
                  <span className="material-symbols-outlined text-xl text-text-muted group-hover:text-primary transition-colors">
                    {link.icon}
                  </span>
                  <span className="text-lg font-medium">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Family Help Modal */}
      <FamilyHelpModal
        open={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        message={helpMessage}
      />
    </div>
  )
}
