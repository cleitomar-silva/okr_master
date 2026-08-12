import { useCallback, useEffect, useState } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'

const PERMISSION_LABEL = {
  admin: 'Administrador',
  gestor: 'Gestor',
  colaborador: 'Colaborador',
}

function PermissionBadge({ permission }) {
  const map = {
    admin: 'bg-primary-container/30 text-primary',
    gestor: 'bg-secondary-container text-on-secondary-container',
    colaborador: 'bg-surface-container-high text-on-surface-variant',
  }
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${map[permission]}`}>{PERMISSION_LABEL[permission]}</span>
  )
}

export default function Users() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/users')
      setUsers(data.data.users)
    } catch (err) {
      toast(err.response?.data?.message || 'Erro ao carregar usuários.', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
    api
      .get('/companies')
      .then((res) => setCompanies(res.data.data.companies))
      .catch(() => {})
  }, [load])

  const initialFormState = () => ({
    id: null,
    name: '',
    email: '',
    permission: 'colaborador',
    password: '',
    company_ids: [],
  })

  const openCreate = () => setForm(initialFormState())
  const openEdit = (u) =>
    setForm({
      id: u.id,
      name: u.name,
      email: u.email,
      permission: u.permission,
      password: '',
      company_ids: (u.companies || []).map((c) => c.id),
    })

  const toggleCompany = (id) => {
    setForm((f) => {
      const ids = f.company_ids.includes(id) ? f.company_ids.filter((x) => x !== id) : [...f.company_ids, id]
      return { ...f, company_ids: ids }
    })
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        email: form.email,
        permission: form.permission,
        company_ids: form.company_ids,
      }
      if (form.password) payload.password = form.password
      if (form.id) {
        await api.put(`/users/${form.id}`, payload)
        toast('Usuário atualizado com sucesso.')
      } else {
        await api.post('/users', payload)
        toast('Usuário criado com sucesso.')
      }
      setForm(null)
      load()
    } catch (err) {
      toast(err.response?.data?.message || 'Erro ao salvar usuário.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const doDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/users/${confirm.id}`)
      toast('Usuário excluído.')
      setConfirm(null)
      load()
    } catch (err) {
      toast(err.response?.data?.message || 'Erro ao excluir usuário.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-gutter">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface font-bold">Usuários</h2>
          <p className="text-on-surface-variant text-sm mt-1">Cadastro global de usuários e permissões.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0f639d] text-on-primary text-sm font-medium hover:bg-[#0c5182] transition-colors"
        >
          <span className="material-symbols-outlined text-sm">add</span> Cadastrar Usuário
        </button>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-4xl text-[#0f639d]">progress_activity</span>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/60">group</span>
            <h3 className="font-title-md text-title-md text-on-surface">Nenhum usuário cadastrado</h3>
            <button
              onClick={openCreate}
              className="px-4 py-2 rounded-full bg-[#0f639d] text-on-primary text-sm font-medium hover:bg-[#0c5182] transition-colors"
            >
              + Cadastrar Usuário
            </button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest border-b border-outline-variant">
                <th className="p-4 font-label-sm text-label-sm text-on-surface-variant font-medium">Nome</th>
                <th className="p-4 font-label-sm text-label-sm text-on-surface-variant font-medium">E-mail</th>
                <th className="p-4 font-label-sm text-label-sm text-on-surface-variant font-medium">Permissão</th>
                <th className="p-4 font-label-sm text-label-sm text-on-surface-variant font-medium">Empresas</th>
                <th className="p-4 font-label-sm text-label-sm text-on-surface-variant font-medium w-32">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-outline-variant last:border-b-0 hover:bg-surface-container-low transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-primary-container text-on-primary-fixed-variant flex items-center justify-center font-bold text-sm">
                        {u.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="font-medium text-on-surface">
                        {u.name}
                        {u.id === user?.id && <span className="text-xs text-on-surface-variant font-normal ml-2">(você)</span>}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-on-surface-variant">{u.email}</td>
                  <td className="p-4">
                    <PermissionBadge permission={u.permission} />
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1.5">
                      {(u.companies || []).map((c) => (
                        <span key={c.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-xs text-on-surface">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                          {c.name}
                        </span>
                      ))}
                      {u.companies?.length === 0 && <span className="text-xs text-on-surface-variant">Sem empresas</span>}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 hover:bg-surface-container-high rounded-full text-on-surface-variant transition-colors"
                        title="Editar"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button
                        onClick={() => setConfirm({ id: u.id, name: u.name })}
                        className="p-1.5 hover:bg-error-container rounded-full text-on-surface-variant hover:text-error transition-colors"
                        title="Excluir"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? 'Editar Usuário' : 'Cadastrar Usuário'} wide>
        {form && (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Nome</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-[#0f639d]"
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">E-mail</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-[#0f639d]"
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Permissão</span>
                <select
                  value={form.permission}
                  onChange={(e) => setForm({ ...form, permission: e.target.value })}
                  className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-[#0f639d]"
                >
                  <option value="colaborador">Colaborador</option>
                  <option value="gestor">Gestor</option>
                  <option value="admin">Administrador</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Senha {form.id && <em className="normal-case">(temporário - deixe vazio para manter)</em>}
                </span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={form.id ? '••••••' : ''}
                  className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-[#0f639d]"
                  minLength={form.id ? undefined : 6}
                  required={!form.id}
                />
              </label>
            </div>
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Empresas vinculadas</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {companies.map((c) => (
                  <label
                    key={c.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                      form.company_ids.includes(c.id)
                        ? 'border-[#0f639d] bg-[#0f639d]/5'
                        : 'border-outline-variant hover:bg-surface-container-low'
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
            </div>
            <div className="mt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setForm(null)}
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
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        title="Excluir usuário"
        message={`Deseja realmente excluir "${confirm?.name}"?`}
        loading={deleting}
        onCancel={() => setConfirm(null)}
        onConfirm={doDelete}
      />
    </div>
  )
}