import { useCallback, useEffect, useState } from 'react'
import api from '../api'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import { useToast } from '../components/Toast'

const ACTION_META = {
  inclusao: { label: 'Inclusão', icon: 'add_circle', cls: 'bg-[#d3efea] text-[#006b5e]' },
  edicao: { label: 'Edição', icon: 'edit_circle', cls: 'bg-[#d9edff] text-[#006494]' },
  exclusao: { label: 'Exclusão', icon: 'delete', cls: 'bg-[#ffdad9] text-[#b2261e]' },
}

const FILTER_PLACEHOLDER = 'Todos'

const FIELD_LABELS = {
  id: 'ID',
  name: 'Nome',
  email: 'E-mail',
  password: 'Senha',
  permission: 'Permissão',
  active: 'Ativo',
  cnpj: 'CNPJ',
  color: 'Cor',
  year: 'Ano',
  company_id: 'Empresa',
  axis_id: 'Eixo',
  objective_id: 'Objetivo',
  action_id: 'Ação',
  attachable_type: 'Tipo do anexo',
  attachable_id: 'ID do anexo',
  followupable_type: 'Vinculado a',
  followupable_id: 'ID do vínculo',
  mime_type: 'Tipo',
  size: 'Tamanho',
  completed: 'Concluído',
  meeting_at: 'Data/Hora da Reunião',
  minutes: 'Ata da Reunião',
  responsaveis: 'Responsáveis',
  empresas: 'Empresas',
}

const CONTENT_EXCLUDED_KEYS = new Set(['id', 'company_id', 'axis_id', 'objective_id', 'action_id', 'attachable_type', 'attachable_id', 'followupable_type', 'followupable_id'])

function contentEntries(content) {
  return Object.entries(content || {}).filter(([key]) => !CONTENT_EXCLUDED_KEYS.has(key))
}

function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function fmtVal(value) {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não'
  return String(value)
}

function FieldLabel({ label }) {
  return (
    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
      {FIELD_LABELS[label] || label}
    </span>
  )
}

function FieldValue({ className, children }) {
  return <span className={`text-sm text-on-surface break-all ${className || ''}`}>{children}</span>
}

function DiffRow({ field, change }) {
  if (change?.hidden) {
    return (
      <div className="flex flex-col gap-1 py-3 border-b border-outline-variant/60 last:border-b-0">
        <FieldLabel label={field} />
        <span className="text-sm text-on-surface-variant italic">Valor oculto (registro sensível)</span>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-1 py-3 border-b border-outline-variant/60 last:border-b-0">
      <FieldLabel label={field} />
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2 rounded-lg bg-[#ffebee] px-3 py-1.5 min-w-0">
          <span className="material-symbols-outlined text-[18px] text-[#b2261e] shrink-0">remove</span>
          <span className="text-sm text-[#b2261e] line-through break-all">{fmtVal(change?.old)}</span>
        </div>
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant rotate-90 sm:rotate-0 shrink-0 self-start sm:self-auto">
          arrow_forward
        </span>
        <div className="flex items-center gap-2 rounded-lg bg-[#d7efdc] px-3 py-1.5 min-w-0">
          <span className="material-symbols-outlined text-[18px] text-[#006b5e] shrink-0">add</span>
          <span className="text-sm text-[#006b5e] font-medium break-all">{fmtVal(change?.new)}</span>
        </div>
      </div>
    </div>
  )
}

function ActionBadge({ actionType }) {
  const meta = ACTION_META[actionType] || { label: actionType, icon: 'info', cls: 'bg-[#e1e3e4] text-[#424753]' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[12px] text-xs font-medium ${meta.cls}`}>
      <span className="material-symbols-outlined text-[16px]">{meta.icon}</span>
      {meta.label}
    </span>
  )
}

function DetailSection({ title, children }) {
  return (
    <section className="flex flex-col gap-3">
      <h4 className="font-title-sm text-title-sm text-on-surface">{title}</h4>
      {children}
    </section>
  )
}

function formatSize(bytes) {
  if (bytes === null || bytes === undefined) return ''
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`
}

function AttachmentPreview({ attachment }) {
  const { toast } = useToast()
  const [src, setSrc] = useState(null)
  const [failed, setFailed] = useState(false)
  const attachmentId = attachment?.id
  const mimeType = attachment?.mime_type || ''
  const isImage = String(mimeType).startsWith('image/')

  useEffect(() => {
    if (!attachmentId || !isImage) return
    let objectUrl = null
    let cancel = false
    setFailed(false)
    setSrc(null)
    api
      .get(`/attachments/${attachmentId}/download`, { responseType: 'blob' })
      .then((res) => {
        if (cancel) return
        objectUrl = URL.createObjectURL(res.data)
        setSrc(objectUrl)
      })
      .catch(() => {
        if (!cancel) setFailed(true)
      })
    return () => {
      cancel = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [attachmentId, isImage])

  const openInTab = async () => {
    if (!attachmentId) return
    try {
      const res = await api.get(`/attachments/${attachmentId}/download`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      window.open(url, '_blank', 'noopener')
    } catch (err) {
      toast(err.response?.data?.message || 'Erro ao abrir o anexo.', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {isImage ? (
        failed || !attachmentId ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-surface-container-low border border-dashed border-outline-variant py-10 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/60">image_not_supported</span>
            <p className="text-sm text-on-surface-variant">Imagem indisponível (arquivo não está mais acessível).</p>
          </div>
        ) : src ? (
          <div className="rounded-xl overflow-hidden border border-outline-variant/60 bg-surface-container-low">
            <img src={src} alt={attachment?.name || 'Anexo'} className="max-h-[360px] w-full object-contain" />
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-xl bg-surface-container-low border border-outline-variant/60 py-10">
            <span className="material-symbols-outlined animate-spin text-4xl text-[#0f639d]">progress_activity</span>
          </div>
        )
      ) : (
        <div className="flex items-center gap-3 rounded-xl bg-surface-container-low border border-outline-variant/60 px-4 py-3">
          <span className="material-symbols-outlined text-[24px] text-[#0f639d] shrink-0">attach_file</span>
          <div className="flex-1 min-w-0">
            <span className="block text-sm text-on-surface truncate">{attachment?.name || 'Anexo'}</span>
            <span className="block text-xs text-on-surface-variant">{attachment?.mime_type} · {formatSize(attachment?.size)}</span>
          </div>
          <button
            type="button"
            onClick={openInTab}
            className="px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant text-sm font-medium hover:bg-surface-container-high transition-colors shrink-0"
          >
            Abrir
          </button>
        </div>
      )}
    </div>
  )
}

export default function AuditLogs() {
  const { toast } = useToast()
  const [logs, setLogs] = useState([])
  const [pagination, setPagination] = useState({ current_page: 1, per_page: 25, total: 0, last_page: 1 })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    user_id: '',
    action_type: '',
    company_id: '',
    per_page: 25,
  })
  const [users, setUsers] = useState([])
  const [companies, setCompanies] = useState([])
  const [verify, setVerify] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [selected, setSelected] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.date_from) params.date_from = filters.date_from
      if (filters.date_to) params.date_to = filters.date_to
      if (filters.user_id) params.user_id = filters.user_id
      if (filters.action_type) params.action_type = filters.action_type
      if (filters.company_id) params.company_id = filters.company_id
      params.per_page = filters.per_page
      if (filters.page && filters.page > 1) params.page = filters.page

      const { data } = await api.get('/audit-logs', { params })
      const { audit_logs, pagination: pag } = data.data
      setLogs(audit_logs)
      setPagination({
        current_page: pag.current_page,
        per_page: pag.per_page,
        total: pag.total,
        last_page: pag.last_page,
      })
    } catch (err) {
      toast(err.response?.data?.message || 'Erro ao carregar registros de auditoria.', 'error')
    } finally {
      setLoading(false)
    }
  }, [filters, toast])

  const loadOptions = useCallback(async () => {
    try {
      const [usersRes, companiesRes] = await Promise.all([api.get('/users'), api.get('/companies')])
      setUsers(usersRes.data.data.users || [])
      setCompanies(companiesRes.data.data.companies || [])
    } catch {
      // opções de filtro são apenas facilitadores; a listagem principal segue funcionando
    }
  }, [])

  const verifyIntegrity = useCallback(async () => {
    setVerifying(true)
    try {
      const { data } = await api.get('/audit-logs/verify')
      setVerify(data.data)
    } catch (err) {
      toast(err.response?.data?.message || 'Erro ao verificar a integridade dos registros.', 'error')
    } finally {
      setVerifying(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    loadOptions()
    verifyIntegrity()
  }, [loadOptions, verifyIntegrity])

  const updateFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value, page: 1 }))
  }

  const applyFilters = (e) => {
    e.preventDefault()
    setFilters((f) => ({ ...f, page: 1 }))
  }

  const clearFilters = () => {
    setFilters({ date_from: '', date_to: '', user_id: '', action_type: '', company_id: '', per_page: 25, page: 1 })
  }

  const goToPage = (page) => {
    if (page < 1 || page > pagination.last_page) return
    setFilters((f) => ({ ...f, page }))
  }

  return (
    <div className="flex flex-col gap-6 pb-gutter">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface font-bold" style={{ fontSize: 35 }}>
            Auditoria
          </h2>
          <p className="text-on-surface-variant text-sm mt-1">Histórico de inclusões, edições e exclusões no sistema.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={verifyIntegrity}
            disabled={verifying}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant text-sm font-medium hover:bg-surface-container-high transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {verifying ? (
              <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
            ) : (
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  verify === null ? 'bg-gray-400' : verify.valid ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
            )}
            {verify ? `Integridade: ${verify.valid ? 'OK' : 'Quebrada'} (${verify.checked} registros)` : 'Verificando...'}
          </button>
          {verify && !verify.valid && (
            <span className="text-sm text-[#b2261e] font-medium">A cadeia de hash foi quebrada. Investigar alterações indevidas.</span>
          )}
        </div>
      </div>

      <form onSubmit={applyFilters} className="flex flex-col gap-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <label className="flex flex-col gap-1.5">
            <FieldLabel label="De" />
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => updateFilter('date_from', e.target.value)}
              className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-[#0f639d]"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <FieldLabel label="Até" />
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => updateFilter('date_to', e.target.value)}
              className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-[#0f639d]"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <FieldLabel label="Usuário" />
            <select
              value={filters.user_id}
              onChange={(e) => updateFilter('user_id', e.target.value)}
              className="appearance-none bg-surface-container-low border border-outline-variant rounded-lg pl-3 pr-8 py-2 text-sm text-on-surface focus:outline-none focus:border-[#0f639d] cursor-pointer w-full"
            >
              <option value="">{FILTER_PLACEHOLDER}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <FieldLabel label="Tipo de ação" />
            <select
              value={filters.action_type}
              onChange={(e) => updateFilter('action_type', e.target.value)}
              className="appearance-none bg-surface-container-low border border-outline-variant rounded-lg pl-3 pr-8 py-2 text-sm text-on-surface focus:outline-none focus:border-[#0f639d] cursor-pointer w-full"
            >
              <option value="">{FILTER_PLACEHOLDER}</option>
              {Object.entries(ACTION_META).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <FieldLabel label="Empresa" />
            <select
              value={filters.company_id}
              onChange={(e) => updateFilter('company_id', e.target.value)}
              className="appearance-none bg-surface-container-low border border-outline-variant rounded-lg pl-3 pr-8 py-2 text-sm text-on-surface focus:outline-none focus:border-[#0f639d] cursor-pointer w-full"
            >
              <option value="">{FILTER_PLACEHOLDER}</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-on-surface-variant">Registros por página</span>
            <select
              value={filters.per_page}
              onChange={(e) => updateFilter('per_page', e.target.value)}
              className="appearance-none bg-surface-container-low border border-outline-variant rounded-lg pl-3 pr-8 py-1.5 text-sm text-on-surface focus:outline-none focus:border-[#0f639d] cursor-pointer"
            >
              {[10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant text-sm font-medium hover:bg-surface-container-high transition-colors"
            >
              Limpar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#0f639d] text-on-primary text-sm font-medium hover:bg-[#0c5182] transition-colors"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      </form>

      <div className="bg-surface-container-lowest border border-[#f2f4f5] !border-[#f2f4f5] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-4xl text-[#0f639d]">progress_activity</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon="fact_check"
              title="Nenhum registro encontrado"
              description="Ajuste os filtros ou aguarde novas alterações no sistema para que a trilha de auditoria seja preenchida."
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f2f4f5] border-b border-[#f2f4f5]">
                    <th className="p-4 font-label-sm text-label-sm text-on-surface-variant font-bold" style={{ fontSize: 15 }}>Data/Hora</th>
                    <th className="p-4 font-label-sm text-label-sm text-on-surface-variant font-bold" style={{ fontSize: 15 }}>Tipo</th>
                    <th className="p-4 font-label-sm text-label-sm text-on-surface-variant font-bold" style={{ fontSize: 15 }}>Usuário</th>
                    <th className="p-4 font-label-sm text-label-sm text-on-surface-variant font-bold" style={{ fontSize: 15 }}>Registro</th>
                    <th className="p-4 font-label-sm text-label-sm text-on-surface-variant font-bold" style={{ fontSize: 15 }}>Empresa</th>
                    <th className="p-4 font-label-sm text-label-sm text-on-surface-variant font-bold w-24" style={{ fontSize: 15 }}>Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelected(log)}
                      className="border-b border-[#f2f4f5] last:border-b-0 hover:bg-surface-container-low transition-colors cursor-pointer"
                    >
                      <td className="p-4 whitespace-nowrap text-sm text-on-surface-variant">{formatDateTime(log.created_at)}</td>
                      <td className="p-4">
                        <ActionBadge actionType={log.action_type} />
                      </td>
                      <td className="p-4 text-sm text-on-surface">{log.user_name || '—'}</td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-xs">{log.entity_name}</span>
                          <span className="text-sm font-medium text-on-surface">{log.record_label || '—'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-on-surface-variant">{log.company_name || '—'}</td>
                      <td className="p-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelected(log)
                          }}
                          className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant transition-colors"
                          title="Ver detalhes"
                        >
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#f2f4f5]">
              <span className="text-sm text-on-surface-variant">
                Exibindo {pagination.total === 0 ? 0 : ((pagination.current_page - 1) * pagination.per_page) + 1}–
                {Math.min(pagination.current_page * pagination.per_page, pagination.total)} de {pagination.total} registros
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(pagination.current_page - 1)}
                  disabled={pagination.current_page <= 1}
                  className="px-3 py-1.5 rounded-lg border border-outline-variant text-sm text-on-surface-variant font-medium hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-sm text-on-surface-variant">
                  Página {pagination.current_page} de {pagination.last_page}
                </span>
                <button
                  onClick={() => goToPage(pagination.current_page + 1)}
                  disabled={pagination.current_page >= pagination.last_page}
                  className="px-3 py-1.5 rounded-lg border border-outline-variant text-sm text-on-surface-variant font-medium hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detalhes do registro" wide>
        {selected && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1 rounded-xl bg-surface-container-low border border-outline-variant/60 p-4">
              <div className="flex items-center gap-3 flex-wrap">
                <ActionBadge actionType={selected.action_type} />
                <span className="text-sm font-medium text-on-surface">
                  {selected.entity_name} — {selected.record_label || '#' + selected.id}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 text-sm">
                <div>
                  <FieldLabel label="Data/Hora" />
                  <FieldValue className="block">{formatDateTime(selected.created_at)}</FieldValue>
                </div>
                <div>
                  <FieldLabel label="Usuário" />
                  <FieldValue className="block">{selected.user_name || '—'}</FieldValue>
                </div>
                <div>
                  <FieldLabel label="Empresa" />
                  <FieldValue className="block">{selected.company_name || '—'}</FieldValue>
                </div>
              </div>
              {selected.entity_name !== 'Anexo' &&
                (() => {
                  const content = selected.action_type === 'exclusao' ? selected.old_content : selected.new_content
                  const entries = contentEntries(content)
                  if (entries.length === 0) return null
                  return (
                    <div className="mt-3 pt-3 border-t border-outline-variant/40">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                        {entries.map(([key, value]) => (
                          <div key={key} className="flex flex-col gap-0.5">
                            <FieldLabel label={key} />
                            <FieldValue>{fmtVal(value)}</FieldValue>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
            </div>

            {selected.entity_name === 'Anexo' && (
              <DetailSection title="Visualização do anexo">
                <AttachmentPreview attachment={selected.new_content || selected.old_content} />
              </DetailSection>
            )}

            {selected.action_type === 'edicao' && (
              <DetailSection title="Alterações">
                <div className="rounded-xl bg-surface-container-low border border-outline-variant/60 px-4">
                  {Object.keys(selected.changes || {}).length === 0 ? (
                    <p className="py-3 text-sm text-on-surface-variant">Nenhuma alteração de conteúdo registrada.</p>
                  ) : (
                    Object.entries(selected.changes || {}).map(([field, change]) => (
                      <DiffRow key={field} field={field} change={change} />
                    ))
                  )}
                </div>
              </DetailSection>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}