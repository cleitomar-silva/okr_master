import { useState } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'

const PERMISSION_LABEL = {
  admin: 'Administrador',
  gestor: 'Gestor',
  colaborador: 'Colaborador',
}

const PASSWORD_REQUIREMENTS = [
  'Mínimo de 6 caracteres',
  'Use uma combinação de letras e números',
  'Evite informações pessoais (nome, data de nascimento)',
  'Não utilize a mesma senha de outros serviços',
]

const SECURITY_TIPS = [
  'Não compartilhe sua senha com outros colaboradores',
  'Altere a senha sempre que suspeitar de uso indevido',
  'Mantenha seus dados de contato sempre atualizados',
]

const FIELD_CLASS =
  'rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-[#0f639d]'

export default function Perfil() {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (password) {
      if (!currentPassword) {
        toast('Informe sua senha atual para alterar a senha.', 'error')
        return
      }
      if (password !== passwordConfirmation) {
        toast('As senhas não conferem.', 'error')
        return
      }
    }
    setSaving(true)
    try {
      if (name !== user?.name || email !== user?.email) {
        const { data } = await api.put('/profile', { name, email })
        await refreshUser(data.data.user)
      }
      if (password) {
        await api.put('/change-password', { current_password: currentPassword, password })
        setCurrentPassword('')
        setPassword('')
        setPasswordConfirmation('')
      }
      toast('Perfil atualizado com sucesso.')
    } catch (err) {
      toast(err.response?.data?.message || 'Erro ao atualizar o perfil.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-gutter">
      <div>
        <h2 className="font-display-lg text-display-lg text-on-surface font-bold" style={{ fontSize: 35 }}>Perfil</h2>
        <p className="text-on-surface-variant text-sm mt-1">Suas informações, conta e segurança.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        <div className="flex flex-col gap-6 min-w-0">
          <form
            onSubmit={submit}
            className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col gap-4"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#0f639d]">badge</span>
              <h3 className="font-title-md text-title-md text-on-surface">Meus dados</h3>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Nome</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={FIELD_CLASS}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">E-mail</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={FIELD_CLASS}
                required
              />
            </label>
            <div className="border-t border-outline-variant/60 pt-4 flex flex-col gap-4">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                Alterar senha
              </span>
              <label className="flex flex-col gap-1.5">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Senha atual</span>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={FIELD_CLASS}
                  autoComplete="current-password"
                />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Nova senha</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={FIELD_CLASS}
                    autoComplete="new-password"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Confirmar nova senha</span>
                  <input
                    type="password"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    className={FIELD_CLASS}
                    autoComplete="new-password"
                  />
                </label>
              </div>
            </div>
            <div className="flex justify-end border-t border-outline-variant/60 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-lg bg-[#0f639d] text-on-primary text-sm font-medium hover:bg-[#0c5182] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </form>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[20px] text-[#0f639d]">key</span>
              <h3 className="font-title-md text-title-md text-on-surface">Requisitos da senha</h3>
            </div>
            <ul className="flex flex-col gap-2">
              {PASSWORD_REQUIREMENTS.map((req) => (
                <li key={req} className="flex items-start gap-2 text-sm text-on-surface">
                  <span className="material-symbols-outlined text-base text-[#0f639d] mt-[1px]">check</span>
                  {req}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[20px] text-[#0f639d]">verified_user</span>
              <h3 className="font-title-md text-title-md text-on-surface">Status da Conta</h3>
            </div>
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="w-20 h-20 rounded-full bg-[#f2f4f5] border-2 border-gray-400 flex items-center justify-center font-bold text-3xl text-on-surface">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
              <div>
                <p className="font-medium text-on-surface">{user?.name}</p>
                <p className="text-sm text-on-surface-variant">{user?.email}</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#0f639d] text-on-primary">
                {PERMISSION_LABEL[user?.permission] || user?.permission}
              </span>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[20px] text-[#0f639d]">shield</span>
              <h3 className="font-title-md text-title-md text-on-surface">Dicas de Segurança</h3>
            </div>
            <ul className="flex flex-col gap-2.5">
              {SECURITY_TIPS.map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-sm text-on-surface">
                  <span className="material-symbols-outlined text-base text-[#0f639d] mt-[1px]">info</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}