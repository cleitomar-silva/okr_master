import { useState } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'

const PERMISSION_LABEL = {
  admin: 'Administrador',
  gestor: 'Gestor',
  colaborador: 'Colaborador',
}

export default function Perfil() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (password !== passwordConfirmation) {
      toast('As senhas não conferem.', 'error')
      return
    }
    setSaving(true)
    try {
      await api.put('/change-password', { current_password: currentPassword, password })
      toast('Senha alterada com sucesso.')
      setCurrentPassword('')
      setPassword('')
      setPasswordConfirmation('')
    } catch (err) {
      toast(err.response?.data?.message || 'Erro ao alterar a senha.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-gutter max-w-2xl">
      <div>
        <h2 className="font-display-lg text-display-lg text-on-surface font-bold">Perfil</h2>
        <p className="text-on-surface-variant text-sm mt-1">Suas informações e alteração de senha.</p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex items-center gap-4">
        <span className="w-14 h-14 rounded-full bg-primary-container text-on-primary-fixed-variant flex items-center justify-center font-bold text-xl">
          {user?.name?.charAt(0)?.toUpperCase() || '?'}
        </span>
        <div>
          <h3 className="font-title-md text-title-md text-on-surface">{user?.name}</h3>
          <p className="text-sm text-on-surface-variant">{user?.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-primary-container/30 text-primary">
            {PERMISSION_LABEL[user?.permission] || user?.permission}
          </span>
        </div>
      </div>

      <form
        onSubmit={submit}
        className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col gap-4"
      >
        <h3 className="font-title-md text-title-md text-on-surface">Alterar senha</h3>
        <label className="flex flex-col gap-1.5">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Senha atual</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-[#0f639d]"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Nova senha</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-[#0f639d]"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Confirmar nova senha</span>
          <input
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            required
            minLength={6}
            className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-[#0f639d]"
          />
        </label>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-[#0f639d] text-on-primary text-sm font-medium hover:bg-[#0c5182] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
            {saving ? 'Salvando...' : 'Salvar senha'}
          </button>
        </div>
      </form>
    </div>
  )
}