'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-8 items-center justify-center min-h-[40vh]">
          <span className="material-symbols-outlined text-primary text-5xl animate-spin">
            progress_activity
          </span>
          <p className="text-xl text-text-secondary">Cargando…</p>
        </div>
      }
    >
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
  const [error, setError] = useState(callbackError ? 'Hubo un error al confirmar tu cuenta. Intentá de nuevo.' : '')
  const [signupSuccess, setSignupSuccess] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email o contraseña incorrectos.')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError('No se pudo crear la cuenta. Intentá con otro email.')
      setLoading(false)
      return
    }

    setSignupSuccess(true)
    setLoading(false)
  }

  const switchMode = (newMode: 'login' | 'signup') => {
    setMode(newMode)
    setError('')
    setSignupSuccess(false)
  }

  return (
    <div className="flex flex-col gap-8 items-center">
      {/* Back link */}
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium text-lg transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
          Volver al inicio
        </Link>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-surface rounded-2xl border border-border shadow-[var(--shadow-soft)] p-8 flex flex-col gap-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <span
            className="material-symbols-outlined text-primary text-5xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            shield_moon
          </span>
          <h2 className="text-3xl font-bold text-text-primary tracking-tight">
            PesoShield
          </h2>
          <p className="text-lg text-text-secondary">
            Tu plata, clara y protegida
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-lg transition-colors border-2 ${
              mode === 'login'
                ? 'bg-primary-light border-primary text-primary'
                : 'bg-background border-border text-text-muted hover:border-primary'
            }`}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-lg transition-colors border-2 ${
              mode === 'signup'
                ? 'bg-primary-light border-primary text-primary'
                : 'bg-background border-border text-text-muted hover:border-primary'
            }`}
          >
            Crear cuenta
          </button>
        </div>

        {/* Signup Success */}
        {signupSuccess && (
          <div className="bg-calm-green-light border border-calm-green rounded-xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-calm-green text-2xl shrink-0">
              check_circle
            </span>
            <p className="text-base font-medium text-calm-green">
              Te enviamos un email de confirmación. Revisá tu bandeja de entrada
              para activar tu cuenta.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-ojo-bg border border-ojo rounded-xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-ojo text-2xl shrink-0">
              error
            </span>
            <p className="text-base font-medium text-ojo">{error}</p>
          </div>
        )}

        {/* Login Form */}
        {mode === 'login' && !signupSuccess && (
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-lg font-medium text-text-secondary">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary text-lg font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-lg font-medium text-text-secondary">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                required
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary text-lg font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="material-symbols-outlined text-xl animate-spin">
                    progress_activity
                  </span>
                  Ingresando…
                </span>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>
        )}

        {/* Signup Form */}
        {mode === 'signup' && !signupSuccess && (
          <form onSubmit={handleSignup} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-lg font-medium text-text-secondary">
                Nombre
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tu nombre"
                required
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary text-lg font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-lg font-medium text-text-secondary">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary text-lg font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-lg font-medium text-text-secondary">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary text-lg font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="material-symbols-outlined text-xl animate-spin">
                    progress_activity
                  </span>
                  Creando cuenta…
                </span>
              ) : (
                'Crear cuenta'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
