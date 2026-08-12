import { useEffect, useState } from 'react'
import api from '../api'
import Modal from './Modal'
import { useToast } from './Toast'

const CONFIGS = {
  eixo: {
    title: 'Eixo',
    fields: ['name'],
    label: 'Nome do Eixo',
    parentField: 'company_id',
    api: '/axes',
    icon: 'health_and_safety',
  },
  objetivo: {
    title: 'Objetivo',
    fields: ['name'],
    label: 'Nome do Objetivo',
    parentField: 'axis_id',
    api: '/objectives',
    icon: 'flag',
  },
  acao: {
    title: 'Ação',
    fields: ['name', 'users'],
    label: 'Nome da Ação',
    parentField: 'objective_id',
    api: '/actions',
    icon: 'task_alt',
  },
  iniciativa: {
    title: 'Iniciativa',
    fields: ['name', 'users'],
    label: 'Nome da Iniciativa',
    parentField: 'action_id',
    api: '/initiatives',
    icon: 'check_circle',
  },
}

export default function ItemFormModal({ type, open, companyId, parentId, item, onClose, onSaved }) {
  const { toast } = useToast()
  const cfg = CONFIGS[type]
  const [name, setName] = useState(item?.name || '')
  const [users, setUsers] = useState([])
  const [available, setAvailable] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userError, setUserError] = useState('')

  useEffect(() => {
    if (!open) return
    setName(item?.name || '')
    setUsers(item?.users?.map((u) => u.id) || [])
    if (cfg.fields.includes('users')) {
      setLoadingUsers(true)
      setAvailable([])
      api
        .get('/linkable-users', { params: { company_id: companyId } })
        .then((res) => setAvailable(res.data.data.users))
        .catch(() => {})
        .finally(() => setLoadingUsers(false))
    }
  }, [open, item, companyId, cfg])

  if (!open) return null

  const toggleUser = (id) => {
    setUsers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    if (cfg.fields.includes('users') && users.length === 0) {
      setUserError('Selecione ao menos um responsável.')
      return
    }
    setUserError('')
    setLoading(true)
    const payload = { name: name.trim() }
    if (parentId) payload[cfg.parentField] = parentId
    if (cfg.fields.includes('users')) payload.user_ids = users
    try {
      const url = item ? `${cfg.api}/${item.id}` : cfg.api
      const method = item ? 'put' : 'post'
      await api[method](url, payload)
      toast(item ? `${cfg.title} atualizado com sucesso.` : `${cfg.title} criado com sucesso.`)
      onSaved()
      onClose()
    } catch (err) {
      toast(err.response?.data?.message || 'Erro ao salvar.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`${item ? 'Editar' : 'Cadastrar'} ${cfg.title}`} wide={cfg.fields.includes('users')}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{cfg.label}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-[#0f639d]"
            autoFocus
            required
          />
        </label>

        {cfg.fields.includes('users') && (
          <div>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Responsáveis <span className="text-error">*</span>
              <span className="text-xs font-normal normal-case text-on-surface-variant ml-1">(pode selecionar um ou vários)</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {loadingUsers ? (
                <div className="sm:col-span-2 flex items-center justify-center gap-2 py-6 text-on-surface-variant">
                  <span className="material-symbols-outlined animate-spin text-2xl text-[#0f639d]">progress_activity</span>
                  <span className="text-sm">Carregando responsáveis...</span>
                </div>
              ) : (
                available.map((u) => {
                const checked = users.includes(u.id)
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleUser(u.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors min-w-0 ${
                      checked
                        ? 'border-[#0f639d] bg-[#0f639d]/5'
                        : 'border-outline-variant hover:bg-surface-container-low'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-sm shrink-0 ${checked ? 'text-[#0f639d]' : 'text-on-surface-variant'}`}
                      data-weight={checked ? 'fill' : undefined}
                    >
                      {checked ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span className="flex flex-col min-w-0">
                      <span className="text-sm text-on-surface truncate">{u.name}</span>
                      <span className="text-xs text-on-surface-variant truncate" title={u.email}>
                        {u.email}
                      </span>
                    </span>
                  </button>
                )
              })
              )}
            </div>
            {available.length === 0 && !loadingUsers && (
              <p className="text-sm text-on-surface-variant mt-2">
                Nenhum usuário vinculado a esta empresa.
              </p>
            )}
            {userError && <p className="text-error text-xs mt-2">{userError}</p>}
          </div>
        )}

        <div className="mt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant text-sm font-medium hover:bg-surface-container-high transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-[#0f639d] text-on-primary text-sm font-medium hover:bg-[#0c5182] transition-colors disabled:opacity-60"
          >
            {loading ? 'Gravando...' : 'Gravar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}