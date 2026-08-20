import { useState } from 'react'
import api from '../api'
import Modal from './Modal'

export const formatSize = (bytes) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`

export const openAttachmentInTab = async (att, toast) => {
  try {
    const res = await api.get(`/attachments/${att.id}/download`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    window.open(url, '_blank', 'noopener')
  } catch (err) {
    toast?.(err.response?.data?.message || 'Erro ao abrir o anexo.', 'error')
  }
}

export const downloadAttachment = async (att, toast) => {
  try {
    const res = await api.get(`/attachments/${att.id}/download`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = att.name
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    toast?.(err.response?.data?.message || 'Erro ao baixar o anexo.', 'error')
  }
}

export default function AttachmentPopover({ attachments, className = '' }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(null)

  const openInTab = async (att) => {
    if (busy) return
    setBusy({ id: att.id, action: 'tab' })
    try {
      await openAttachmentInTab(att)
    } finally {
      setBusy(null)
    }
  }

  const download = async (att) => {
    if (busy) return
    setBusy({ id: att.id, action: 'download' })
    try {
      await downloadAttachment(att)
    } finally {
      setBusy(null)
    }
  }

  if (!attachments || attachments.length === 0) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1 text-xs text-[#0f639d] bg-[#0f639d]/10 rounded-lg px-2 py-0.5 hover:bg-[#0f639d]/20 transition-colors ${className}`}
        title={`${attachments.length} anexo(s)`}
      >
        <span className="material-symbols-outlined text-[16px]">attach_file</span>
        {attachments.length}
      </button>
      {open && (
        <Modal open={open} onClose={() => setOpen(false)} title="Anexos">
          <div className="flex flex-col gap-2">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2"
              >
                {busy?.id === att.id && busy.action === 'tab' ? (
                  <span className="material-symbols-outlined animate-spin text-[20px] text-[#0f639d] shrink-0">
                    progress_activity
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-[20px] text-[#0f639d] shrink-0">attach_file</span>
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
                  onClick={() => download(att)}
                  className="p-1 rounded-lg text-on-surface-variant hover:text-[#0f639d] transition-colors shrink-0"
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
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  )
}