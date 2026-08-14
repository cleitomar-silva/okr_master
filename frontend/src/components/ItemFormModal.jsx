import { useEffect, useState } from 'react'
import api from '../api'
import Modal from './Modal'
import ConfirmDialog from './ConfirmDialog'
import { useToast } from './Toast'
import { downloadAttachment, formatSize, openAttachmentInTab } from './AttachmentPopover'

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
    responseKey: 'action',
  },
  iniciativa: {
    title: 'Iniciativa',
    fields: ['name', 'users'],
    label: 'Nome da Iniciativa',
    parentField: 'action_id',
    api: '/initiatives',
    icon: 'check_circle',
    responseKey: 'initiative',
  },
}

const ACCEPTED_MIME = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/bmp',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/csv',
]
<<<<<<< HEAD
const MAX_FILE_SIZE = 50 * 1024 * 1024
=======
const MAX_FILE_SIZE = 10 * 1024 * 1024
>>>>>>> origin/main

export default function ItemFormModal({ type, open, companyId, parentId, item, onClose, onSaved }) {
  const { toast } = useToast()
  const cfg = CONFIGS[type]
  const canAttach = type === 'acao' || type === 'iniciativa'
  const [name, setName] = useState(item?.name || '')
  const [users, setUsers] = useState([])
  const [available, setAvailable] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userError, setUserError] = useState('')
  const [attachments, setAttachments] = useState([])
  const [pendingFiles, setPendingFiles] = useState([])
  const [attachmentsError, setAttachmentsError] = useState('')
  const [busy, setBusy] = useState(null)
<<<<<<< HEAD
  const [confirmDelete, setConfirmDelete] = useState(null)
=======
>>>>>>> origin/main

  useEffect(() => {
    if (!open) return
    setName(item?.name || '')
    setUsers(item?.users?.map((u) => u.id) || [])
    setAttachments(item?.attachments || [])
    setPendingFiles([])
    setAttachmentsError('')
<<<<<<< HEAD
    setConfirmDelete(null)
=======
>>>>>>> origin/main
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

  const onFilesChange = (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (files.length === 0) return
    const invalid = files.filter((f) => !ACCEPTED_MIME.includes(f.type) || f.size > MAX_FILE_SIZE)
    if (invalid.length > 0) {
<<<<<<< HEAD
      setAttachmentsError('Apenas arquivos PDF, imagens e planilhas, com no máximo 50MB cada.')
=======
      setAttachmentsError('Apenas arquivos PDF, imagens e planilhas, com no máximo 10MB cada.')
>>>>>>> origin/main
      return
    }
    setAttachmentsError('')
    setPendingFiles((prev) => [...prev, ...files])
  }

  const removePending = (index) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const openInTab = async (att) => {
    if (busy) return
    setBusy({ id: att.id, action: 'tab' })
    try {
      await openAttachmentInTab(att, toast)
    } finally {
      setBusy(null)
    }
  }

  const downloadAttachmentRow = async (att) => {
    if (busy) return
    setBusy({ id: att.id, action: 'download' })
    try {
      await downloadAttachment(att, toast)
    } finally {
      setBusy(null)
    }
  }

  const removeAttachment = async (att) => {
<<<<<<< HEAD
    setBusy({ id: att.id, action: 'delete' })
=======
>>>>>>> origin/main
    try {
      await api.delete(`/attachments/${att.id}`)
      setAttachments((prev) => prev.filter((a) => a.id !== att.id))
      toast('Anexo removido.')
<<<<<<< HEAD
      onSaved()
    } catch (err) {
      toast(err.response?.data?.message || 'Erro ao remover o anexo.', 'error')
    } finally {
      setBusy(null)
    }
  }

  const confirmRemoveAttachment = async () => {
    const att = confirmDelete
    setConfirmDelete(null)
    await removeAttachment(att)
  }

=======
    } catch (err) {
      toast(err.response?.data?.message || 'Erro ao remover o anexo.', 'error')
    }
  }

>>>>>>> origin/main
  const uploadPending = async (targetId) => {
    if (pendingFiles.length === 0) return
    const formData = new FormData()
    formData.append('attachable_type', type === 'acao' ? 'action' : 'initiative')
    formData.append('attachable_id', targetId)
    pendingFiles.forEach((f) => formData.append('files[]', f))
    await api.post('/attachments', formData)
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
      const res = await api[method](url, payload)
      const savedId = item ? item.id : res.data?.data?.[cfg.responseKey]?.id
      if (canAttach && pendingFiles.length > 0 && savedId) {
        await uploadPending(savedId)
      }
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

        {canAttach && (
          <div className="flex flex-col gap-3">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Anexos
              <span className="text-xs font-normal normal-case text-on-surface-variant ml-1">
<<<<<<< HEAD
                (PDF, imagens e planilhas — máx. 50MB por arquivo)
=======
                (PDF, imagens e planilhas — máx. 10MB por arquivo)
>>>>>>> origin/main
              </span>
            </span>
            <label className="flex items-center justify-center gap-2 px-4 py-6 rounded-lg border border-dashed border-outline-variant text-on-surface-variant hover:bg-surface-container-low cursor-pointer transition-colors">
              <input
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.bmp,.xls,.xlsx,.csv"
                className="hidden"
                onChange={onFilesChange}
              />
              <span className="material-symbols-outlined text-[20px]">attach_file</span>
              <span className="text-sm">Selecionar arquivos</span>
            </label>
            {attachmentsError && <p className="text-error text-xs">{attachmentsError}</p>}
            {pendingFiles.length > 0 && (
              <ul className="flex flex-col gap-2">
                {pendingFiles.map((f, i) => (
                  <li
                    key={`${f.name}-${i}`}
                    className="flex items-center gap-2 bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2"
                  >
                    <span className="material-symbols-outlined text-[20px] text-on-surface-variant">description</span>
                    <span className="flex-1 min-w-0 text-sm text-on-surface truncate">{f.name}</span>
                    <span className="text-xs text-on-surface-variant shrink-0">{formatSize(f.size)}</span>
                    <button
                      type="button"
                      onClick={() => removePending(i)}
                      className="p-1 rounded-lg text-on-surface-variant hover:text-error transition-colors"
                      title="Remover"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {attachments.length > 0 && (
              <ul className="flex flex-col gap-2">
                {attachments.map((att) => (
                  <li
                    key={att.id}
                    className="flex items-center gap-2 bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2"
                  >
                    {busy?.id === att.id && busy.action === 'tab' ? (
                      <span className="material-symbols-outlined animate-spin text-[20px] text-[#0f639d]">
                        progress_activity
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-[20px] text-[#0f639d]">attach_file</span>
                    )}
                    <button
                      type="button"
                      onClick={() => openInTab(att)}
                      className="flex-1 min-w-0 text-sm text-on-surface truncate text-left hover:underline"
                      title="Abrir em nova aba"
                    >
                      {att.name}
                    </button>
                    <span className="text-xs text-on-surface-variant shrink-0">{formatSize(att.size)}</span>
                    <button
                      type="button"
                      onClick={() => downloadAttachmentRow(att)}
                      className="p-1 rounded-lg text-on-surface-variant hover:text-[#0f639d] transition-colors"
                      title="Baixar"
                    >
                      {busy?.id === att.id && busy.action === 'download' ? (
                        <span className="material-symbols-outlined animate-spin text-[20px] text-[#0f639d]">
                          progress_activity
                        </span>
                      ) : (
                        <span className="material-symbols-outlined text-[20px]">file_download</span>
                      )}
                    </button>
                    <button
                      type="button"
<<<<<<< HEAD
                      onClick={() => setConfirmDelete(att)}
=======
                      onClick={() => removeAttachment(att)}
>>>>>>> origin/main
                      className="p-1 rounded-lg text-on-surface-variant hover:text-error transition-colors"
                      title="Excluir"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
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

      <ConfirmDialog
        open={!!confirmDelete}
        title="Excluir anexo"
        message={`Deseja realmente excluir "${confirmDelete?.name}"?`}
        loading={busy?.action === 'delete'}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmRemoveAttachment}
      />
    </Modal>
  )
}