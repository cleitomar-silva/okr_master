import { useCallback, useEffect, useState } from 'react'
import api from '../api'
import Modal from './Modal'
import { useToast } from './Toast'

export default function TransferYearPopover({ axis, open, onClose, onTransferred }) {
  const { toast } = useToast()
  const [years, setYears] = useState([])
  const [selected, setSelected] = useState(null)
  const [addingYear, setAddingYear] = useState(false)
  const [newYear, setNewYear] = useState('')
  const [transferring, setTransferring] = useState(false)

  const loadYears = useCallback(async () => {
    try {
      const { data: res } = await api.get('/years')
      setYears(res.data?.years ?? [])
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (!open) return
    setAddingYear(false)
    setNewYear('')
    setSelected(null)
    loadYears()
  }, [open, loadYears])

  const addYear = async () => {
    const y = Number(newYear)
    if (!y || y < 2000 || y > 2100) return
    try {
      const { data: res } = await api.post('/years', { year: y })
      setYears(res.data?.years ?? (Array.from(new Set([...years, y])).sort((a, b) => b - a)))
      setSelected(y)
      setAddingYear(false)
      setNewYear('')
    } catch (err) {
      toast(err.response?.data?.message || 'Não foi possível adicionar o ano.', 'error')
    }
  }

  const transfer = async () => {
    if (!selected || selected === axis.year || transferring) return
    setTransferring(true)
    try {
      await api.patch(`/axes/${axis.id}/year`, { year: selected })
      toast(`Eixo "${axis.name}" transferido para ${selected}.`)
      onTransferred?.()
      onClose?.()
    } catch (err) {
      toast(err.response?.data?.message || 'Não foi possível transferir o eixo.', 'error')
    } finally {
      setTransferring(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Transferir Eixo">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-on-surface-variant flex items-start gap-2">
          <span className="material-symbols-outlined text-[20px] text-[#0f639d] shrink-0">swap_horiz</span>
          O eixo <strong className="text-on-surface">“{axis?.name}”</strong> será transferido para outro ano.
          Objetivos, ações e iniciativas serão preservados.
        </p>

        <div>
          <span className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">
            Selecione o ano de destino
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {years.map((y) => {
              const isCurrent = y === axis?.year
              const isSelected = y === selected
              return (
                <button
                  key={y}
                  type="button"
                  disabled={isCurrent}
                  onClick={() => setSelected(y)}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                    isCurrent
                      ? 'border-outline-variant/40 bg-surface-container-low text-on-surface-variant cursor-not-allowed'
                      : isSelected
                        ? 'border-[#0f639d] bg-[#0f639d]/10 text-[#0f639d] font-semibold'
                        : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:border-[#0f639d]/50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">event</span>
                    {y}
                  </span>
                  {isCurrent ? (
                    <span className="text-[11px] uppercase tracking-wide bg-surface-container-high px-1.5 py-0.5 rounded">Atual</span>
                  ) : (
                    isSelected && <span className="material-symbols-outlined text-[18px]">check</span>
                  )}
                </button>
              )
            })}
            {years.length === 0 && (
              <span className="text-sm text-on-surface-variant col-span-full">Nenhum ano cadastrado.</span>
            )}
          </div>
        </div>

        {addingYear ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="2000"
              max="2100"
              value={newYear}
              onChange={(e) => setNewYear(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addYear()
                }
              }}
              placeholder="Ex: 2027"
              autoFocus
              className="flex-1 min-w-0 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-[#0f639d]"
            />
            <button
              type="button"
              onClick={addYear}
              className="px-3 py-2 rounded-lg bg-[#0f639d] text-on-primary text-sm font-medium hover:bg-[#0c5182] transition-colors"
            >
              Adicionar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingYear(true)}
            className="flex items-center gap-2 text-sm text-[#0f639d] hover:underline transition-colors w-fit"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Adicionar novo ano
          </button>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={transfer}
            disabled={!selected || selected === axis?.year || transferring}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f639d] text-on-primary text-sm font-medium hover:bg-[#0c5182] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {transferring ? (
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
            )}
            Transferir
          </button>
        </div>
      </div>
    </Modal>
  )
}