import { useCallback, useEffect, useState } from 'react'
import api from '../api'
import Modal from './Modal'
import UsersBadge from './UsersBadge'
import { downloadAttachment, formatSize, openAttachmentInTab } from './AttachmentPopover'
import { useToast } from './Toast'

const ACCEPTED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'xls', 'xlsx', 'csv']
const MAX_FILE_SIZE = 50 * 1024 * 1024

const isAcceptedFile = (file) => {
  const ext = (file.name?.split('.').pop() || '').toLowerCase()
  return ACCEPTED_EXTENSIONS.includes(ext)
}

const toLocalInputValue = (d) => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const formatDateTime = (iso) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso || ''
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function FollowUpModal({ type, itemId, itemName, companyId, open, onClose, canEdit }) {
  const { toast } = useToast()
  const [meetingAt, setMeetingAt] = useState('')
  const [minutes, setMinutes] = useState('')
  const [users, setUsers] = useState([])
  const [available, setAvailable] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [pendingFiles, setPendingFiles] = useState([])
  const [filesError, setFilesError] = useState('')
  const [userError, setUserError] = useState('')
  const [records, setRecords] = useState([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState(null)

  const resetForm = () => {
    setMeetingAt(toLocalInputValue(new Date()))
    setMinutes('')
    setUsers([])
    setPendingFiles([])
    setFilesError('')
    setUserError('')
  }

  const loadRecords = useCallback(async () => {
    if (!open || !itemId) return
    setLoadingRecords(true)
    try {
      const { data: res } = await api.get('/follow-ups', {
        params: {
          followupable_type: type === 'acao' ? 'action' : 'initiative',
          followupable_id: itemId,
        },
      })
      setRecords(res.data?.follow_ups ?? [])
    } catch (err) {
      toast(err.response?.data?.message || 'Erro ao carregar os Follow-ups.', 'error')
    } finally {
      setLoadingRecords(false)
    }
  }, [open, itemId, type, toast])

  useEffect(() => {
    if (!open) return
    resetForm()
    setRecords([])
    if (canEdit) {
      setLoadingUsers(true)
      setAvailable([])
      api
        .get('/linkable-users', { params: { company_id: companyId } })
        .then((res) => setAvailable(res.data.data.users))
        .catch(() => {})
        .finally(() => setLoadingUsers(false))
    }
    loadRecords()
  }, [open, itemId, type, companyId, canEdit, loadRecords])

  if (!open) return null

  const toggleUser = (id) => {
    setUsers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const onFilesChange = (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (files.length === 0) return
    const invalid = files.filter((f) => !isAcceptedFile(f) || f.size > MAX_FILE_SIZE)
    if (invalid.length > 0) {
      setFilesError('Apenas arquivos PDF, imagens e planilhas, com no máximo 50MB cada.')
      return
    }
    setFilesError('')
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

  const download = async (att) => {
    if (busy) return
    setBusy({ id: att.id, action: 'download' })
    try {
      await downloadAttachment(att, toast)
    } finally {
      setBusy(null)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!meetingAt) {
      toast('Informe a data e hora da reunião.', 'error')
      return
    }
    if (!minutes.trim()) {
      toast('Preencha a ata da reunião.', 'error')
      return
    }
    if (users.length === 0) {
      setUserError('Selecione ao menos um participante.')
      return
    }
    if (!itemId) {
      toast('Não foi possível identificar o item do Follow-up.', 'error')
      return
    }
    setUserError('')
    setSaving(true)
    const formData = new FormData()
    formData.append('followupable_type', type === 'acao' ? 'action' : 'initiative')
    formData.append('followupable_id', itemId)
    formData.append('meeting_at', new Date(meetingAt).toISOString())
    formData.append('minutes', minutes.trim())
    users.forEach((id) => formData.append('user_ids[]', id))
    pendingFiles.forEach((f) => formData.append('files[]', f))
    try {
      await api.post('/follow-ups', formData)
      toast('Follow-up registrado com sucesso.')
      resetForm()
      loadRecords()
    } catch (err) {
      toast(err.response?.data?.message || 'Erro ao salvar o Follow-up.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Follow-up · ${itemName}`} wide>
      {canEdit && (
        <form onSubmit={submit} className="flex flex-col gap-5 border-b border-outline-variant pb-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                Data e hora da reunião <span className="text-error">*</span>
              </span>
              <input
                type="datetime-local"
                value={meetingAt}
                onChange={(e) => setMeetingAt(e.target.value)}
                className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-[#0f639d]"
                required
              />
            </label>
          </div>

          <div>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Participantes <span className="text-error">*</span>
              <span className="text-xs font-normal normal-case text-on-surface-variant ml-1">(pode selecionar um ou vários)</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {loadingUsers ? (
                <div className="sm:col-span-2 flex items-center justify-center gap-2 py-6 text-on-surface-variant">
                  <span className="material-symbols-outlined animate-spin text-2xl text-[#0f639d]">progress_activity</span>
                  <span className="text-sm">Carregando participantes...</span>
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
                        checked ? 'border-[#0f639d] bg-[#0f639d]/5' : 'border-outline-variant hover:bg-surface-container-low'
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
              <p className="text-sm text-on-surface-variant mt-2">Nenhum usuário vinculado a esta empresa.</p>
            )}
            {userError && <p className="text-error text-xs mt-2">{userError}</p>}
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Ata da Reunião <span className="text-error">*</span>
            </span>
            <textarea
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              rows={5}
              placeholder="Descreva o conteúdo da reunião..."
              className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-[#0f639d] resize-y"
              required
            />
          </label>

          <div className="flex flex-col gap-3">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Arquivos
              <span className="text-xs font-normal normal-case text-on-surface-variant ml-1">
                (PDF, imagens e planilhas — máx. 50MB por arquivo, opcional)
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
            {filesError && <p className="text-error text-xs">{filesError}</p>}
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
          </div>

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-[#0f639d] text-on-primary text-sm font-medium hover:bg-[#0c5182] transition-colors disabled:opacity-60"
            >
              {saving ? 'Gravando...' : 'Registrar Follow-up'}
            </button>
          </div>
        </form>
      )}

      <div>
        <span className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">
          Follow-ups ({records.length})
        </span>
        {loadingRecords ? (
          <div className="flex items-center justify-center gap-2 py-8 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-2xl text-[#0f639d]">progress_activity</span>
            <span className="text-sm">Carregando...</span>
          </div>
        ) : records.length === 0 ? (
          <p className="text-sm text-on-surface-variant py-4">Nenhum Follow-up registrado.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {records.map((r) => (
              <div
                key={r.id}
                className="border border-outline-variant rounded-xl p-4 bg-surface-container-lowest"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-on-surface">
                    <span className="material-symbols-outlined text-[18px] text-[#0f639d]">event</span>
                    {formatDateTime(r.meeting_at)}
                  </span>
                  <UsersBadge users={r.users} label="Participantes" />
                </div>
                <p className="text-sm text-on-surface whitespace-pre-wrap break-words">{r.minutes}</p>
                {r.attachments?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {r.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-1 bg-surface-container-low border border-outline-variant rounded-lg px-2 py-1"
                      >
                        <button
                          type="button"
                          onClick={() => openInTab(att)}
                          className="text-sm text-[#0f639d] hover:underline truncate max-w-[180px]"
                          title="Abrir em nova aba"
                        >
                          {busy?.id === att.id && busy.action === 'tab' ? '...' : att.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => download(att)}
                          className="p-0.5 rounded-lg text-on-surface-variant hover:text-[#0f639d] transition-colors"
                          title="Baixar"
                        >
                          <span className="material-symbols-outlined text-[16px]">file_download</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}