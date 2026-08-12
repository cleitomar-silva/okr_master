import { memo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const AVATAR_COLORS = ['bg-primary-container', 'bg-secondary-container', 'bg-tertiary-container', 'bg-surface-container-highest']

function UsersBadge({ users = [] }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef(null)
  if (!users || users.length === 0) return null

  const visible = users.slice(0, 2)
  const rest = users.length - visible.length

  let pos = null
  if (open && btnRef.current) {
    const rect = btnRef.current.getBoundingClientRect()
    const listMaxH = Math.max(72, window.innerHeight - 160)
    const estHeight = 76 + Math.min(users.length * 28, listMaxH)
    const gap = 8
    const placeAbove = rect.top - gap - estHeight > 0
    pos = {
      left: Math.min(Math.max(rect.left, 8), window.innerWidth - 236),
      top: placeAbove ? rect.top - gap - estHeight : rect.bottom + gap,
      listMaxH,
    }
  }

  return (
    <>
      <span className="inline-flex">
        <button
          ref={btnRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setOpen((v) => !v)
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="flex -space-x-2 cursor-pointer items-center"
          title="Usuários vinculados"
        >
          <span className="material-symbols-outlined text-base text-on-surface-variant mr-1.5 group pointer-events-none">
            group
          </span>
          {visible.map((u, i) => (
            <span
              key={u.id}
              className={`w-7 h-7 rounded-full border-2 border-surface-container-lowest flex items-center justify-center text-xs font-medium text-on-surface ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
            >
              {u.name ? u.name.charAt(0).toUpperCase() : '?'}
            </span>
          ))}
          {rest > 0 && (
            <span className="w-7 h-7 rounded-full border-2 border-surface-container-lowest bg-surface-container-highest flex items-center justify-center text-xs font-medium text-on-surface">
              +{rest}
            </span>
          )}
        </button>
      </span>
      {open && pos &&
        createPortal(
          <div
            className="fixed w-[220px] bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl p-3"
            style={{ left: pos.left, top: pos.top, zIndex: 200 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <span className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">
              Responsáveis
            </span>
            <div className="flex flex-col gap-1.5 overflow-y-auto" style={{ maxHeight: pos.listMaxH }}>
              {users.map((u) => (
                <span key={u.id} className="flex items-center gap-2 text-sm text-on-surface">
                  <span
                    className={`w-6 h-6 rounded-full ${AVATAR_COLORS[u.id % AVATAR_COLORS.length]} flex items-center justify-center text-xs font-medium text-on-surface`}
                  >
                    {u.name ? u.name.charAt(0).toUpperCase() : '?'}
                  </span>
                  {u.name}
                </span>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

export default memo(UsersBadge)