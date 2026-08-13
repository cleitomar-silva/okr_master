import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'

const PERMISSION_LABEL = {
  admin: 'Administrador',
  gestor: 'Gestor',
  colaborador: 'Colaborador',
}

function PermissionBadge({ permission }) {
  const map = {
    admin: 'bg-[#0c3347] text-white',
    gestor: 'bg-[#91efef] text-[#006e6e]',
    colaborador: 'bg-[#e1e3e4] text-[#424753]',
  }
  return (
    <span className={`px-2 py-1 rounded-[12px] text-xs font-medium ${map[permission]}`}>{PERMISSION_LABEL[permission]}</span>
  )
}

export default function Users() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState(null)
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
  }, [load])

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
          <h2 className="font-display-lg text-display-lg text-on-surface font-bold" style={{ fontSize: 35 }}>Usuários</h2>
          <p className="text-on-surface-variant text-sm mt-1">Cadastro global de usuários e permissões.</p>
        </div>
        <button
          onClick={() => navigate('/users/novo')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0f639d] text-on-primary text-sm font-medium hover:bg-[#0c5182] transition-colors"
        >
          <span className="material-symbols-outlined text-sm" style={{fontSize:20}}>add</span> Novo Usuário
        </button>
      </div>

      <div className="bg-surface-container-lowest border border-[#f2f4f5] !border-[#f2f4f5] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-4xl text-[#0f639d]">progress_activity</span>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/60">group</span>
            <h3 className="font-title-md text-title-md text-on-surface">Nenhum usuário cadastrado</h3>
            <button
              onClick={() => navigate('/users/novo')}
              className="px-4 py-2 rounded-lg bg-[#0f639d] text-on-primary text-sm font-medium hover:bg-[#0c5182] transition-colors"
            >
              + Cadastrar Usuário
            </button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f2f4f5] border-b border-[#f2f4f5]">
                <th className="p-4 font-label-sm text-label-sm text-on-surface-variant font-bold" style={{ fontSize: 15 }}>Nome</th>
                <th className="p-4 font-label-sm text-label-sm text-on-surface-variant font-bold" style={{ fontSize: 15 }}>E-mail</th>
                <th className="p-4 font-label-sm text-label-sm text-on-surface-variant font-bold" style={{ fontSize: 15 }}>Permissão</th>
                <th className="p-4 font-label-sm text-label-sm text-on-surface-variant font-bold" style={{ fontSize: 15 }}>Empresas</th>
                <th className="p-4 font-label-sm text-label-sm text-on-surface-variant font-bold" style={{ fontSize: 15 }}>Status</th>
                <th className="p-4 font-label-sm text-label-sm text-on-surface-variant font-bold w-32" style={{ fontSize: 15 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[#f2f4f5] last:border-b-0 hover:bg-surface-container-low transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-[#0f639d] text-white flex items-center justify-center font-bold text-sm">
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
                        <span key={c.id} className="flex items-center px-2.5 py-1 rounded-[12px] text-xs font-medium text-white" style={{ backgroundColor: c.color }}>
                          {c.name}
                        </span>
                      ))}
                      {u.companies?.length === 0 && <span className="text-xs text-on-surface-variant">Sem empresas</span>}
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[12px] text-xs font-medium ${
                        u.active === false
                          ? 'bg-gray-200 text-gray-600'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${u.active === false ? 'bg-gray-400' : 'bg-green-500'}`} />
                      {u.active === false ? 'Inativo' : 'Ativo'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/users/${u.id}/editar`)}
                        className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant transition-colors"
                        title="Editar"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button
                        onClick={() => setConfirm({ id: u.id, name: u.name })}
                        className="p-1.5 hover:bg-error-container rounded-lg text-on-surface-variant hover:text-error transition-colors"
                        title="Excluir"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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