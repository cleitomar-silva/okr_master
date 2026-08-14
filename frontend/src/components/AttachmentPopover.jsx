import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import api from '../api'

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

const MENU_WIDTH = 288
const MENU_OFFSET = 8

export default function AttachmentPopover({ attachments, className = '' }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const [busy, setBusy] = useState(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

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

  const updatePos = () => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    let left = rect.left
    if (left + MENU_WIDTH > window.innerWidth - MENU_OFFSET) {
      left = window.innerWidth - MENU_WIDTH - MENU_OFFSET
    }
    setPos({ top: rect.bottom + MENU_OFFSET, left: Math.max(MENU_OFFSET, left) })
  }

  useEffect(() => {
    if (!open) return
    updatePos()
    const onClick = (e) => {
      if (triggerRef.current?.contains(e.target)) return
      if (menuRef.current?.contains(e.target)) return
      setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', updatePos, true)
    window.addEventListener('resize', updatePos)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', updatePos, true)
      window.removeEventListener('resize', updatePos)
    }
  }, [open])

  if (!attachments || attachments.length === 0) return null

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1 text-xs text-[#0f639d] bg-[#0f639d]/10 rounded-lg px-2 py-0.5 hover:bg-[#0f639d]/20 transition-colors ${className}`}
        title={`${attachments.length} anexo(s)`}
      >
        <span className="material-symbols-outlined text-[16px]">attach_file</span>
        {attachments.length}
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[100] w-72 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl p-2"
            style={{ top: pos.top, left: pos.left }}
          >
            <span className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider px-2 py-1">
              Anexos
            </span>
            <ul className="flex flex-col gap-1">
              {attachments.map((att) => (
                <li key={att.id} className="flex items-center gap-2 rounded-lg hover:bg-surface-container-low px-2 py-1.5">
<button
                  type="button"
                  onClick={() => openInTab(att)}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left"
                  title="Abrir em nova aba"
                >
                  {busy?.id === att.id && busy.action === 'tab' ? (
                    <span className="material-symbols-outlined animate-spin text-[20px] text-[#0f639d] shrink-0">
                      progress_activity
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-[20px] text-[#0f639d] shrink-0">attach_file</span>
                  )}
                  <span className="flex flex-col min-w-0">
                    <span className="text-sm text-on-surface truncate">{att.name}</span>
                    <span className="text-xs text-on-surface-variant">{formatSize(att.size)}</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => download(att)}
                  className="p-1 rounded-lg text-on-surface-variant hover:text-[#0f639d] transition-colors"
                  title="Baixar"
                >
                  {busy?.id === att.id && busy.action === 'download' ? (
                    <span className="material-symbols-outlined animate-spin text-[20px] text-[#0f639d]">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-[20px]">file_download</span>
                  )}
                </button>
                </li>
              ))}
            </ul>
          </div>,
          document.body,
        )}
    </>
  )
}