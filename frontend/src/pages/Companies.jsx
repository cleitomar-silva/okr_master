import { useCallback, useEffect, useState } from 'react'
import api from '../api'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'

const PRESET_COLORS = ['#0f639d', '#00a859', '#4f378a', '#765b00', '#ba1a1a', '#1e88e5']

export default function Companies() {
  const { toast } = useToast()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/companies')
      setCompanies(data.data.companies)
    } catch (err) {
      toast(err.response?.data?.message || 'Erro ao carregar empresas.', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const initialFormState = () => ({ id: null, name: '', cnpj: '', color: '#0f639d' })

  const openEdit = (c) => setForm({ id: c.id, name: c.name, cnpj: c.cnpj, color: c.color })

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (form.id) {
        await api.put(`/companies/${form.id}`, form)
        toast('Empresa atualizada com sucesso.')
      } else {
        await api.post('/companies', form)
        toast('Empresa criada com sucesso.')
      }
      setForm(null)
      load()
    } catch (err) {
      toast(err.response?.data?.message || 'Erro ao salvar empresa.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const doDelete = async () => {
    setDeleting(true)
    try {
      const { data } = await api.delete(`/companies/${confirm.id}`)
      toast(data.data?.impact?.message || 'Empresa excluída.')
      setConfirm(null)
      load()
    } catch (err) {
      toast(err.response?.data?.message || 'Erro ao excluir empresa.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-gutter">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface font-bold" style={{ fontSize: 35 }}>Configurações de Empresas</h2>
          <p className="text-on-surface-variant text-sm mt-1">Gerencie as empresas cadastradas no sistema e adicione novas.</p>
        </div>
        <button
          onClick={() => setForm(initialFormState())}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0f639d] text-on-primary text-sm font-medium hover:bg-[#0c5182] transition-colors"
        >
          <span className="material-symbols-outlined text-sm">add</span> Cadastrar Empresa
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined animate-spin text-4xl text-[#0f639d]">progress_activity</span>
        </div>
      ) : companies.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center bg-surface-container-lowest border border-dashed border-outline-variant rounded-xl">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/60">business</span>
          <h3 className="font-title-md text-title-md text-on-surface">Nenhuma empresa cadastrada</h3>
          <button
            onClick={() => setForm(initialFormState())}
            className="px-4 py-2 rounded-lg bg-[#0f639d] text-on-primary text-sm font-medium hover:bg-[#0c5182] transition-colors"
          >
            + Cadastrar Empresa
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {companies.map((c) => (
            <div key={c.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
              <div className="flex items-center gap-4 p-6 border-l-[4px]" style={{ borderLeftColor: c.color }}>
                <div className="flex-1 min-w-0">
                  <h3 className="font-title-md text-title-md text-[#0f639d] truncate">{c.name}</h3>
                  <p className="text-sm text-on-surface-variant mt-1">CNPJ: {c.cnpj}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="w-10 h-10 rounded-[9999px]" style={{ backgroundColor: c.color }} />
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Cor Primária
                    </span>
                    <span className="text-xs text-on-surface font-medium">{c.color}</span>
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-end gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(c)}
                    className="p-2 hover:bg-surface-container-high rounded-lg text-on-surface-variant transition-colors"
                    title="Editar"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button
                    onClick={() => setConfirm({ id: c.id, name: c.name })}
                    className="p-2 hover:bg-error-container rounded-lg text-on-surface-variant hover:text-error transition-colors"
                    title="Excluir"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? 'Editar Empresa' : 'Cadastrar Empresa'}>
        {form && (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Nome da empresa</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-[#0f639d]"
                required
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">CNPJ</span>
              <input
                value={form.cnpj}
                onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-[#0f639d]"
                required
              />
            </label>
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Cor</span>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-9 h-9 rounded-lg border-2 transition-transform ${form.color === c ? 'ring-2 ring-offset-2 ring-[#0f639d] scale-105' : 'border-outline-variant'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-9 h-9 rounded-lg cursor-pointer border border-outline-variant"
                  />
                  <span className="text-xs text-on-surface-variant">{form.color}</span>
                </label>
              </div>
            </div>
            <div className="mt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setForm(null)}
                className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant text-sm font-medium hover:bg-surface-container-high transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-[#0f639d] text-on-primary text-sm font-medium hover:bg-[#0c5182] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                {saving ? 'Gravando...' : 'Gravar'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        title="Excluir empresa"
        message={`Deseja realmente excluir "${confirm?.name}"?`}
        impact="Os dados de OKR vinculados serão preservados (exclusão lógica)."
        loading={deleting}
        onCancel={() => setConfirm(null)}
        onConfirm={doDelete}
      />
    </div>
  )
}