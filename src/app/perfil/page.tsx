'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { getPreferences, savePreferences, type UserPreferences } from '@/lib/preferences'
import { exportUserData } from '@/lib/export'

interface Profile {
  display_name: string
  created_at: string
}

export default function PerfilPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences>(getPreferences())
  const [loading, setLoading] = useState(true)

  // Edit name state
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [savingName, setSavingName] = useState(false)

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!url || !url.startsWith('http')) {
        router.push('/login')
        return
      }

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name, created_at')
        .eq('id', user.id)
        .single()

      setUser(user)
      setProfile(profileData)
      setNewName(profileData?.display_name ?? '')
      setPreferences(getPreferences())
      setLoading(false)
    }

    loadProfile()
  }, [router])

  const handleSaveName = async () => {
    if (!user || !newName.trim()) return
    setSavingName(true)

    const supabase = createClient()
    const trimmed = newName.trim()

    await supabase.from('profiles').update({ display_name: trimmed }).eq('id', user.id)
    await supabase.auth.updateUser({ data: { display_name: trimmed } })

    setProfile((prev) => (prev ? { ...prev, display_name: trimmed } : prev))
    setEditingName(false)
    setSavingName(false)
  }

  const handlePreferenceChange = (key: keyof UserPreferences, value: UserPreferences[keyof UserPreferences]) => {
    const updated = { ...preferences, [key]: value }
    setPreferences(updated)
    savePreferences(updated)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'ELIMINAR') return
    setDeleting(true)

    const supabase = createClient()
    await supabase.rpc('delete_own_account')
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-8 items-center justify-center min-h-[40vh]">
        <span className="material-symbols-outlined text-primary text-5xl animate-spin">
          progress_activity
        </span>
        <p className="text-xl text-text-secondary">Cargando perfil…</p>
      </div>
    )
  }

  const initial = (profile?.display_name ?? 'U').charAt(0).toUpperCase()
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('es-AR', {
        month: 'long',
        year: 'numeric',
      })
    : ''

  return (
    <div className="flex flex-col gap-8">
      {/* Back link + Title */}
      <div className="flex flex-col gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium text-lg transition-colors w-fit mb-2"
        >
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
          Volver al inicio
        </Link>
        <h2 className="text-4xl md:text-5xl font-bold text-text-primary tracking-tight">
          Mi perfil
        </h2>
        <p className="text-xl text-text-secondary mt-1">
          Gestioná tu cuenta y preferencias.
        </p>
      </div>

      {/* Section 1: User Info */}
      <div className="bg-surface rounded-2xl border border-border shadow-[var(--shadow-soft)] p-6 md:p-8 flex flex-col gap-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="material-symbols-outlined text-primary text-2xl">person</span>
          <h3 className="text-2xl font-bold text-text-primary">Información personal</h3>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-3xl">{initial}</span>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-4 flex-1 w-full">
            {/* Display Name */}
            <div className="flex flex-col gap-1">
              <label className="text-base text-text-muted font-medium">Nombre</label>
              {editingName ? (
                <div className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 px-4 py-3 bg-background border border-border rounded-xl text-text-primary text-lg font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleSaveName}
                    disabled={savingName || !newName.trim()}
                    className="px-5 py-3 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {savingName ? (
                      <span className="material-symbols-outlined text-xl animate-spin">
                        progress_activity
                      </span>
                    ) : (
                      'Guardar'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingName(false)
                      setNewName(profile?.display_name ?? '')
                    }}
                    className="p-3 rounded-xl text-text-muted hover:text-text-primary hover:bg-background transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">close</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <p className="text-xl font-medium text-text-primary">
                    {profile?.display_name}
                  </p>
                  <button
                    type="button"
                    onClick={() => setEditingName(true)}
                    className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary-light transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">edit</span>
                  </button>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-base text-text-muted font-medium">Email</label>
              <p className="text-xl font-medium text-text-primary">{user?.email}</p>
            </div>

            {/* Member since */}
            <div className="flex flex-col gap-1">
              <label className="text-base text-text-muted font-medium">Miembro desde</label>
              <p className="text-lg text-text-secondary capitalize">{memberSince}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Preferences */}
      <div className="bg-surface rounded-2xl border border-border shadow-[var(--shadow-soft)] p-6 md:p-8 flex flex-col gap-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="material-symbols-outlined text-primary text-2xl">tune</span>
          <h3 className="text-2xl font-bold text-text-primary">Preferencias</h3>
        </div>

        {/* Currency Display */}
        <div className="flex flex-col gap-2">
          <label className="text-lg font-medium text-text-secondary">
            Moneda de referencia
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handlePreferenceChange('currencyDisplay', 'ARS')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-lg transition-colors border-2 ${
                preferences.currencyDisplay === 'ARS'
                  ? 'bg-primary-light border-primary text-primary'
                  : 'bg-background border-border text-text-muted hover:border-primary'
              }`}
            >
              $ ARS
            </button>
            <button
              type="button"
              onClick={() => handlePreferenceChange('currencyDisplay', 'USD')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-lg transition-colors border-2 ${
                preferences.currencyDisplay === 'USD'
                  ? 'bg-primary-light border-primary text-primary'
                  : 'bg-background border-border text-text-muted hover:border-primary'
              }`}
            >
              US$ USD
            </button>
          </div>
        </div>

        {/* Notification Toggles */}
        <div className="flex flex-col gap-4">
          <label className="text-lg font-medium text-text-secondary">
            Notificaciones
          </label>

          <button
            type="button"
            onClick={() =>
              handlePreferenceChange('notifyRateSpike', !preferences.notifyRateSpike)
            }
            className="flex items-center justify-between p-4 bg-background rounded-xl border border-border hover:border-primary-20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-2xl">
                trending_up
              </span>
              <div className="text-left">
                <p className="text-lg font-medium text-text-primary">
                  Alertas de tipo de cambio
                </p>
                <p className="text-base text-text-muted">
                  Avisarte cuando el dólar suba mucho
                </p>
              </div>
            </div>
            <div
              className={`w-12 h-7 rounded-full transition-colors flex items-center px-0.5 ${
                preferences.notifyRateSpike ? 'bg-primary' : 'bg-border'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${
                  preferences.notifyRateSpike ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              handlePreferenceChange(
                'notifyBudgetThreshold',
                !preferences.notifyBudgetThreshold
              )
            }
            className="flex items-center justify-between p-4 bg-background rounded-xl border border-border hover:border-primary-20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-2xl">
                account_balance_wallet
              </span>
              <div className="text-left">
                <p className="text-lg font-medium text-text-primary">
                  Alertas de presupuesto
                </p>
                <p className="text-base text-text-muted">
                  Avisarte cuando te acerques al límite
                </p>
              </div>
            </div>
            <div
              className={`w-12 h-7 rounded-full transition-colors flex items-center px-0.5 ${
                preferences.notifyBudgetThreshold ? 'bg-primary' : 'bg-border'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${
                  preferences.notifyBudgetThreshold ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Section 3: Account Actions */}
      <div className="bg-surface rounded-2xl border border-border shadow-[var(--shadow-soft)] p-6 md:p-8 flex flex-col gap-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="material-symbols-outlined text-primary text-2xl">
            settings
          </span>
          <h3 className="text-2xl font-bold text-text-primary">Cuenta</h3>
        </div>

        <div className="flex flex-col gap-4">
          {/* Export Data */}
          <button
            type="button"
            onClick={exportUserData}
            className="flex items-center gap-3 p-4 bg-background rounded-xl border border-border hover:border-primary hover:text-primary transition-colors text-left"
          >
            <span className="material-symbols-outlined text-2xl">download</span>
            <div>
              <p className="text-lg font-medium">Exportar mis datos</p>
              <p className="text-base text-text-muted">
                Descargar transacciones y presupuesto en JSON
              </p>
            </div>
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 p-4 bg-background rounded-xl border border-border hover:border-text-secondary transition-colors text-left"
          >
            <span className="material-symbols-outlined text-2xl">logout</span>
            <div>
              <p className="text-lg font-medium">Cerrar sesión</p>
              <p className="text-base text-text-muted">
                Salir de tu cuenta en este dispositivo
              </p>
            </div>
          </button>

          {/* Delete Account */}
          <div className="border-t border-border pt-4 mt-2">
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-3 p-4 bg-background rounded-xl border border-red-200 hover:border-red-400 text-red-500 transition-colors text-left w-full"
              >
                <span className="material-symbols-outlined text-2xl">
                  delete_forever
                </span>
                <div>
                  <p className="text-lg font-medium">Eliminar mi cuenta</p>
                  <p className="text-base text-red-300">
                    Esta acción es permanente y no se puede deshacer
                  </p>
                </div>
              </button>
            ) : (
              <div className="p-5 bg-red-50 border border-red-200 rounded-xl flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-red-500 text-2xl shrink-0">
                    warning
                  </span>
                  <div>
                    <p className="text-lg font-bold text-red-600">
                      ¿Estás seguro?
                    </p>
                    <p className="text-base text-red-500 mt-1">
                      Se van a eliminar todos tus datos de forma permanente.
                      Escribí <strong>ELIMINAR</strong> para confirmar.
                    </p>
                  </div>
                </div>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Escribí ELIMINAR"
                  className="w-full px-4 py-3 bg-white border border-red-200 rounded-xl text-text-primary text-lg font-medium focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== 'ELIMINAR' || deleting}
                    className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold text-lg hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {deleting ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="material-symbols-outlined text-xl animate-spin">
                          progress_activity
                        </span>
                        Eliminando…
                      </span>
                    ) : (
                      'Eliminar cuenta'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeleteConfirmText('')
                    }}
                    className="px-6 py-3 bg-white border border-border rounded-xl font-bold text-lg text-text-secondary hover:bg-background transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
