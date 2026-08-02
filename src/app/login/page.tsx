'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

import { ChevronLeftIcon, ShieldMark } from '@/components/icons'
import { Button, Callout, Card, Field, Skeleton, cn, fieldBorder, fieldShell } from '@/components/ui'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackError = searchParams.get('error') === 'auth'

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(
    callbackError ? 'Hubo un error al confirmar tu cuenta. Intentá de nuevo.' : '',
  )
  const [signupSuccess, setSignupSuccess] = useState(false)

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError('Email o contraseña incorrectos.')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  async function handleSignup(event: React.FormEvent) {
    event.preventDefault()
    setError('')

    if (!displayName.trim()) {
      setError('Ingresá tu nombre.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      setError('No se pudo crear la cuenta. Intentá con otro email.')
      setLoading(false)
      return
    }

    setSignupSuccess(true)
    setLoading(false)
  }

  function switchMode(next: 'login' | 'signup') {
    setMode(next)
    setError('')
    setSignupSuccess(false)
  }

  const isSignup = mode === 'signup'

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <Link
        href="/"
        className="inline-flex h-12 w-fit items-center gap-1.5 text-[1.0625rem] font-bold text-violet-deep hover:underline"
      >
        <ChevronLeftIcon size={20} />
        Volver al inicio
      </Link>

      <Card className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <span className="text-violet">
            <ShieldMark size={48} />
          </span>
          <h1 className="text-[1.75rem] font-bold">PesoShield</h1>
          <p className="text-[1.0625rem] text-ink-muted">Tu plata, clara y en orden</p>
        </div>

        {/* Creating an account is optional — the app works without one, so this
            says so rather than letting the form imply a wall. */}
        <p className="rounded-control bg-surface-sunk px-4 py-3 text-[1rem] leading-relaxed text-ink-strong">
          No hace falta una cuenta para usar PesoShield. Sirve para guardar tu nombre y tus
          preferencias.
        </p>

        <div role="group" aria-label="Elegí una opción" className="flex gap-3">
          {(
            [
              ['login', 'Iniciar sesión'],
              ['signup', 'Crear cuenta'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => switchMode(value)}
              className={cn(
                'h-12 flex-1 rounded-control border-2 text-[1.0625rem] font-bold transition-colors duration-150',
                mode === value
                  ? 'border-violet bg-violet-soft text-violet-deep'
                  : 'border-rule-field bg-surface text-ink-muted hover:bg-surface-sunk',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {signupSuccess ? (
          <Callout tone="success" title="Revisá tu email">
            Te enviamos un mensaje de confirmación. Abrilo para activar tu cuenta.
          </Callout>
        ) : null}

        {error ? <Callout tone="error" title={error} /> : null}

        {!signupSuccess ? (
          <form
            onSubmit={isSignup ? handleSignup : handleLogin}
            className="flex flex-col gap-5"
          >
            {isSignup ? (
              <Field label="Nombre" htmlFor="nombre">
                <input
                  id="nombre"
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Tu nombre"
                  required
                  autoComplete="name"
                  className={cn(fieldShell, fieldBorder(false))}
                />
              </Field>
            ) : null}

            <Field label="Email" htmlFor="email">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@email.com"
                required
                autoComplete="email"
                className={cn(fieldShell, fieldBorder(false))}
              />
            </Field>

            <Field
              label="Contraseña"
              htmlFor="password"
              hint={isSignup ? 'Mínimo 6 caracteres' : undefined}
            >
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={isSignup ? 'Mínimo 6 caracteres' : 'Tu contraseña'}
                required
                minLength={isSignup ? 6 : undefined}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                className={cn(fieldShell, fieldBorder(false))}
              />
            </Field>

            <Button type="submit" full loading={loading}>
              {loading
                ? isSignup
                  ? 'Creando cuenta…'
                  : 'Ingresando…'
                : isSignup
                  ? 'Crear cuenta'
                  : 'Iniciar sesión'}
            </Button>
          </form>
        ) : null}
      </Card>
    </div>
  )
}

function LoginSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6" aria-live="polite" aria-busy="true">
      <span className="sr-only">Cargando…</span>
      <Card className="flex flex-col gap-5">
        <Skeleton className="mx-auto h-12 w-12 rounded-full" />
        <Skeleton className="mx-auto h-7 w-40" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </Card>
    </div>
  )
}
