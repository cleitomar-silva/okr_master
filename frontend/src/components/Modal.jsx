export default function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={`relative bg-surface-container-lowest rounded-xl border border-outline-variant shadow-xl w-full ${
          wide ? 'max-w-3xl' : 'max-w-lg'
        } max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <h3 className="font-title-md text-title-md text-on-surface">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  )
}