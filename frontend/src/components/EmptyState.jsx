import { memo } from 'react'

function EmptyState({ icon = 'flag', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center bg-surface-container-lowest border border-dashed border-outline-variant rounded-xl">
      <span className="material-symbols-outlined text-5xl text-on-surface-variant/60">{icon}</span>
      <div>
        <h3 className="font-title-md text-title-md text-on-surface">{title}</h3>
        <p className="text-sm text-on-surface-variant mt-1 max-w-md">{description}</p>
      </div>
      {action}
    </div>
  )
}

export default memo(EmptyState)