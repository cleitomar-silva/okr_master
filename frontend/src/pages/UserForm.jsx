import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api'
import { useToast } from '../components/Toast'

const PERMISSION_INFO = [
  {
    id: 'admin',
    label: 'Administrador',
    icon: 'admin_panel_settings',
    description: 'Acesso total à plataforma.',
    items: [
      'Gerencia usuários e empresas',
      'Cria e edita Eixos, Objetivos, Ações e Iniciativas',
      'Exclui qualquer item do OKR',
      'Visualiza todas as empresas vinculadas',
    ],
  },
  {
    id: 'gestor',
    label: 'Gestor',
    icon: 'manage_accounts',
    description: 'Gerencia os OKRs da sua área.',
    items: [
      'Cria e edita Eixos, Objetivos, Ações e Iniciativas',
      'Vincula responsáveis às Ações e Iniciativas',
      'Visualiza os dashboards das empresas',
      'Não pode excluir itens do OKR',
    ],
  },
  {
    id: 'colaborador',
    label: 'Colaborador',
    icon: 'group',
    description: 'Acompanha e executa as iniciativas.',
    items: [
      'Visualiza os dashboards e OKRs',
      'Conclui as Iniciativas vinculadas a ele',
      'Sem permissão para criar, editar ou excluir',
    ],
  },
]

const FIELD_CLASS =
  'rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-[#0f639d]'

export default function UserForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const isEdit = Boolean(id)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [companies, setCompanies] = useState([])
  const [companyError, setCompanyError] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    permission: 'colaborador',
    password: '',
    company_ids: [],
    active: true,
  })

  useEffect(() => {
    api
      .get('/companies')
      .then((res) => setCompanies(res.data.data.companies))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!id) return
    api
      .get(`/users/${id}`)
      .then((res) => {
        const u = res.data.data.user
        setForm({
          name: u.name,
          email: u.email,
          permission: u.permission,
          password: '',
          company_ids: (u.companies || []).map((c) => c.id),
          active: u.active !== false,
        })
      })
      .catch((err) => {
        toast(err.response?.data?.message || 'Erro ao carregar usuário.', 'error')
        navigate('/users')
      })
      .finally(() => setLoading(false))
  }, [id, navigate, toast])

  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const toggleCompany = (companyId) => {
    setForm((f) => {
      const ids = f.company_ids.includes(companyId)
        ? f.company_ids.filter((x) => x !== companyId)
        : [...f.company_ids, companyId]
      return { ...f, company_ids: ids }
    })
    setCompanyError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    if (form.company_ids.length === 0) {
      setCompanyError('Selecione ao menos uma empresa.')
      return
    }
    setCompanyError('')
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        email: form.email,
        permission: form.permission,
        company_ids: form.company_ids,
        active: form.active,
      }
      if (form.password) payload.password = form.password
      if (isEdit) {
        await api.put(`/users/${id}`, payload)
        toast('Usuário atualizado com sucesso.')
      } else {
        await api.post('/users', payload)
        toast('Usuário criado com sucesso.')
      }
      navigate('/users')
    } catch (err) {
      toast(err.response?.data?.message || 'Erro ao salvar usuário.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-gutter">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/users')}
          className="p-2 -ml-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
          title="Voltar"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface font-bold" style={{ fontSize: 35 }}>
            {isEdit ? 'Editar Usuário' : 'Cadastrar Usuário'}
          </h2>
          <p className="text-on-surface-variant text-sm mt-1">
            {isEdit ? 'Atualize os dados e permissões do usuário.' : 'Preencha os dados para criar um novo usuário.'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined animate-spin text-4xl text-[#0f639d]">progress_activity</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[600px_340px] gap-4 items-start">
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden max-w-2xl">
            <div className="px-6 py-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#0f639d]">badge</span>
              <h3 className="font-title-md text-title-md text-on-surface">Dados do usuário</h3>
            </div>
            <form onSubmit={submit} className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Nome</span>
                  <input
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                    className={FIELD_CLASS}
                    required
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">E-mail</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    className={FIELD_CLASS}
                    required
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Permissão</span>
                  <select
                    value={form.permission}
                    onChange={(e) => setField('permission', e.target.value)}
                    className={FIELD_CLASS}
                  >
                    <option value="colaborador">Colaborador</option>
                    <option value="gestor">Gestor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Senha {isEdit && <em className="normal-case">(temporário - deixe vazio para manter)</em>}
                  </span>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setField('password', e.target.value)}
                    placeholder={isEdit ? '••••••' : ''}
                    className={FIELD_CLASS}
                    minLength={isEdit ? undefined : 6}
                    required={!isEdit}
                  />
                </label>
                <label className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-gray-50 cursor-pointer">
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Usuário ativo
                    </span>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Desative para bloquear o acesso deste usuário ao sistema.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.active}
                    onClick={() => setField('active', !form.active)}
                    className={`relative w-11 h-6 shrink-0 rounded-full transition-colors ${
                      form.active ? 'bg-[#0f639d]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        form.active ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </label>
              </div>

              <div>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Empresas vinculadas <span className="text-error">*</span>
                </span>
                <div className="flex flex-col gap-2 mt-2">
                  {companies.map((c) => (
                    <label
                      key={c.id}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                        form.company_ids.includes(c.id)
                          ? 'bg-[#0f639d]/5'
                          : 'hover:bg-surface-container-low'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.company_ids.includes(c.id)}
                        onChange={() => toggleCompany(c.id)}
                        className="accent-[#0f639d]"
                      />
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="text-sm text-on-surface">{c.name}</span>
                    </label>
                  ))}
                </div>
                {companyError && <p className="text-error text-xs mt-2">{companyError}</p>}
              </div>

              <div className="mt-2 flex justify-end gap-3 border-t border-outline-variant pt-5">
                <button
                  type="button"
                  onClick={() => navigate('/users')}
                  className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant text-sm font-medium hover:bg-surface-container-high transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-[#0f639d] text-on-primary text-sm font-medium hover:bg-[#0c5182] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                  {saving ? 'Gravando...' : 'Gravar'}
                </button>
              </div>
            </form>
          </div>

          <aside className="bg-surface-container-lowest rounded-xl overflow-hidden sticky top-4">
            <div className="px-5 py-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#0f639d]">shield</span>
              <div>
                <h3 className="font-title-md text-title-md text-on-surface">Níveis de acesso</h3>
                <p className="text-xs text-on-surface-variant">O que cada perfil pode fazer</p>
              </div>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {PERMISSION_INFO.map((p) => {
                const active = form.permission === p.id
                return (
                  <div
                    key={p.id}
                    className={`rounded-lg bg-white p-3 border-l-4 border-[#0f639d] transition-colors ${
                      active ? 'ring-2 ring-[#0f639d]/40' : 'opacity-80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-on-surface-variant">{p.icon}</span>
                      <span className="text-sm font-semibold text-on-surface">{p.label}</span>
                      {active && (
                        <span className="ml-auto text-[10px] font-medium uppercase tracking-wider bg-[#0f639d] text-on-primary px-2 py-0.5 rounded-full">
                          Selecionado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">{p.description}</p>
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {p.items.map((item) => (
                        <li key={item} className="flex items-start gap-1.5 text-xs text-on-surface">
                          <span className="material-symbols-outlined text-sm text-green-600 mt-[1px]">check</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}