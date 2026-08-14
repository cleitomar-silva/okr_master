import Modal from './Modal'

export default function ConfirmDialog({ open, title, message, impact, onCancel, onConfirm, loading }) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm text-on-surface">{message}</p>
      {impact && (
        <p className="mt-3 text-sm text-on-surface-variant bg-surface-container-low p-3 rounded-lg border border-outline-variant/50">
          <span className="material-symbols-outlined text-base align-middle mr-1">info</span>
          {impact}
        </p>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant text-sm font-medium hover:bg-surface-container-high transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-error text-on-error text-sm font-medium hover:bg-error/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
          Excluir
        </button>
      </div>
    </Modal>
  )
}