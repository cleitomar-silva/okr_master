import { memo, useCallback, useEffect, useRef, useState } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import UsersBadge from '../components/UsersBadge'
import EmptyState from '../components/EmptyState'
import ItemFormModal from '../components/ItemFormModal'
import AttachmentPopover from '../components/AttachmentPopover'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'

function SelectFilter({ value, onChange, options, placeholder }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-surface-container-low border border-outline-variant rounded-lg pl-3 pr-8 py-2 text-sm text-on-surface focus:outline-none focus:border-[#0f639d] cursor-pointer w-full md:w-auto"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[20px] pointer-events-none">
        expand_more
      </span>
    </div>
  )
}

const ActionRow = memo(function ActionRow({ action, canEdit, isAdmin, onForm, onDelete, onToggleInitiative, onToggleAction, togglingId }) {
  const [initiativesOpen, setInitiativesOpen] = useState(false)
  const done = action.progress === 100
  const hasInitiatives = action.initiatives?.length > 0

  return (
    <>
      <tr className="border-b border-outline-variant hover:bg-surface-container-low transition-colors align-top">
        <td className="p-4">
          <div className="flex flex-col">
            <span className="font-medium text-on-surface">{action.name}</span>
            <span className="text-sm text-on-surface-variant mt-1 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${done ? 'bg-green-500' : 'bg-blue-500'}`} />
              {done ? 'Concluído' : 'Em andamento'}
            </span>
            {action.attachments?.length > 0 && (
              <AttachmentPopover attachments={action.attachments} className="mt-1.5 w-fit" />
            )}
          </div>
        </td>
        <td className="p-4 align-middle w-40">
          {hasInitiatives ? (
            <div className="flex items-center gap-2">
              <div className="w-full bg-surface-container-high rounded-full h-1.5">
                <div className="bg-[#0f639d] h-1.5 rounded-full" style={{ width: `${action.progress}%` }} />
              </div>
              <span className="text-sm font-medium text-[#0f639d]">{action.progress}%</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {togglingId === action.id ? (
                <span className="material-symbols-outlined animate-spin text-[20px] text-[#0f639d]">progress_activity</span>
              ) : (
                <input
                  type="checkbox"
                  checked={!!action.completed}
                  onChange={() => onToggleAction(action)}
                  disabled={togglingId === action.id}
                  className="w-4 h-4 accent-[#0f639d] cursor-pointer"
                  title={action.completed ? 'Marcar como pendente' : 'Marcar como concluída'}
                />
              )}
              <div className="w-full bg-surface-container-high rounded-full h-1.5">
                <div className="bg-[#0f639d] h-1.5 rounded-full" style={{ width: `${action.progress}%` }} />
              </div>
              <span className="text-sm font-medium text-[#0f639d]">{action.progress}%</span>
            </div>
          )}
        </td>
        <td className="p-4 align-middle w-48">
          <UsersBadge users={action.users} />
        </td>
        <td className="p-4 align-middle text-right w-40">
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => onForm('iniciativa', action.id, null)}
              className="p-1 hover:bg-surface-container-high rounded-lg text-on-surface-variant transition-colors"
              title="Cadastrar Iniciativa"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
            </button>
            {canEdit && (
              <button
                onClick={() => onForm('acao', null, { id: action.id, name: action.name, users: action.users, attachments: action.attachments })}
                className="p-1 hover:bg-surface-container-high rounded-lg text-on-surface-variant transition-colors"
                title="Editar Ação"
              >
                <span className="material-symbols-outlined text-[20px]">edit</span>
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() =>
                  onDelete('acao', { id: action.id, name: action.name }, `Esta Ação possui ${action.initiatives?.length || 0} Iniciativa(s).`)
                }
                className="p-1 hover:bg-error-container rounded-lg text-on-surface-variant hover:text-error transition-colors"
                title="Excluir Ação"
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            )}
            <button
              onClick={() => setInitiativesOpen((v) => !v)}
              className="p-1 hover:bg-surface-container-high rounded-lg text-on-surface-variant transition-colors"
              title="Ver iniciativas"
            >
              <span className={`material-symbols-outlined text-[20px] transition-transform ${initiativesOpen ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>
          </div>
        </td>
      </tr>

      {initiativesOpen && (
        <tr className="border-b border-outline-variant bg-surface-container-low/40">
          <td colSpan={4} className="p-4 pl-6">
            <span className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">
              Iniciativas
            </span>
            {(!action.initiatives || action.initiatives.length === 0) && (
              <p className="text-sm text-on-surface-variant">
                Nenhuma iniciativa.{' '}
                <button
                  onClick={() => onForm('iniciativa', action.id, null)}
                  className="text-[#0f639d] font-medium"
                >
                  Adicionar
                </button>
              </p>
            )}
            <ul className="space-y-2">
              {action.initiatives?.map((initiative) => (
                <li
                  key={initiative.id}
                  className="flex items-center gap-3 group"
                >
                  <button
                    onClick={() => onToggleInitiative(initiative)}
                    disabled={togglingId === initiative.id}
                    className="flex items-center gap-2 text-left flex-1 py-1 hover:bg-surface-container-low rounded-lg px-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    title={initiative.completed ? 'Marcar como pendente' : 'Marcar como concluída'}
                  >
                    {togglingId === initiative.id ? (
                      <span className="material-symbols-outlined animate-spin text-[20px] text-[#0f639d]">progress_activity</span>
                    ) : (
                      <span
                        className={`material-symbols-outlined text-[20px] ${initiative.completed ? 'text-[#0f639d]' : 'text-on-surface-variant'}`}
                        data-weight={initiative.completed ? 'fill' : undefined}
                      >
                        {initiative.completed ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                    )}
                    <span className={`text-sm ${initiative.completed ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}>
                      {initiative.name}
                    </span>
                  </button>
                  <AttachmentPopover attachments={initiative.attachments} />
                  <UsersBadge users={initiative.users} />
                  {canEdit && (
                    <button
                      onClick={() => onForm('iniciativa', null, { id: initiative.id, name: initiative.name, users: initiative.users, attachments: initiative.attachments })}
                      className="p-1 hover:bg-surface-container-high rounded-lg text-on-surface-variant transition-colors"
                      title="Editar Iniciativa"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => onDelete('iniciativa', { id: initiative.id, name: initiative.name })}
                      className="p-1 hover:bg-error-container rounded-lg text-on-surface-variant hover:text-error transition-colors"
                      title="Excluir Iniciativa"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </td>
        </tr>
      )}
    </>
  )
})

const ObjectiveBlock = memo(function ObjectiveBlock({ objective, objIndex, canEdit, isAdmin, expanded, onToggle, onForm, onDelete, onToggleInitiative, onToggleAction, togglingId }) {
  const objOpen = expanded.has(`obj-${objective.id}`)
  const objProgress = objective.actions.length
    ? Math.round(objective.actions.reduce((s, a) => s + a.progress, 0) / objective.actions.length)
    : 0

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
      <div className="bg-surface p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#0f639d] text-on-primary font-label-sm text-label-sm px-2 py-1 rounded">
              OBJ-{String(objIndex + 1).padStart(2, '0')}
            </span>
            <h3 className="font-title-md text-title-md text-on-surface">{objective.name}</h3>
          </div>
        </div>
        <div className="w-full md:w-48 text-right">
          <div className="flex justify-end gap-2 mb-2">
            <button
              onClick={() => onForm('acao', objective.id, null)}
              className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant transition-colors"
              title="Cadastrar Ação"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
            </button>
            {canEdit && (
              <button
                onClick={() => onForm('objetivo', null, { id: objective.id, name: objective.name })}
                className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant transition-colors"
                title="Editar Objetivo"
              >
                <span className="material-symbols-outlined text-[20px]">edit</span>
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() =>
                  onDelete('objetivo', { id: objective.id, name: objective.name }, `Este Objetivo possui ${objective.actions.length} Ação(ões).`)
                }
                className="p-1.5 hover:bg-error-container rounded-lg text-on-surface-variant hover:text-error transition-colors"
                title="Excluir Objetivo"
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            )}
            <button
              onClick={() => onToggle(`obj-${objective.id}`)}
              className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant transition-colors"
              title={objOpen ? 'Recolher' : 'Expandir'}
            >
              <span className={`material-symbols-outlined text-[20px] transition-transform ${objOpen ? '' : '-rotate-90'}`}>
                expand_less
              </span>
            </button>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">Progresso</span>
            <span className="font-title-md text-title-md text-[#0f639d]">{objProgress}%</span>
          </div>
          <div className="w-full bg-surface-container-high rounded-full h-2">
            <div className="bg-[#0f639d] h-2 rounded-full" style={{ width: `${objProgress}%` }} />
          </div>
        </div>
      </div>

      {objOpen && objective.actions.length === 0 && (
        <div className="p-6">
          <EmptyState
            icon="task_alt"
            title="Nenhuma Ação cadastrada"
            description="Crie a primeira Ação deste Objetivo para começar a acompanhar o progresso."
            action={
              <button
                onClick={() => onForm('acao', objective.id, null)}
                className="mt-2 px-4 py-2 rounded-lg bg-[#0f639d] text-on-primary text-sm font-medium hover:bg-[#0c5182] transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">add</span> Cadastrar Ação
              </button>
            }
          />
        </div>
      )}

      {objOpen && objective.actions.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest border-b border-outline-variant">
                <th className="p-4 font-label-sm text-label-sm text-on-surface-variant font-medium">Ação (Key Result)</th>
                <th className="p-4 font-label-sm text-label-sm text-on-surface-variant font-medium w-40">Progresso</th>
                <th className="p-4 font-label-sm text-label-sm text-on-surface-variant font-medium w-48">Equipe</th>
                <th className="p-4 font-label-sm text-label-sm text-on-surface-variant font-medium w-44 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {objective.actions.map((action) => (
                <ActionRow
                  key={action.id}
                  action={action}
                  canEdit={canEdit}
                  isAdmin={isAdmin}
                  onForm={onForm}
                  onDelete={onDelete}
                  onToggleInitiative={onToggleInitiative}
                  onToggleAction={onToggleAction}
                  togglingId={togglingId}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
})

const AxisBlock = memo(function AxisBlock({ axis, canEdit, isAdmin, expanded, onToggle, onForm, onDelete, onToggleInitiative, onToggleAction, togglingId }) {
  const axisOpen = expanded.has(`axis-${axis.id}`)
  const axisProgress =
    axis.objectives.length > 0
      ? Math.round(
          axis.objectives.reduce(
            (acc, o) =>
              acc + (o.actions.length ? o.actions.reduce((s, a) => s + a.progress, 0) / o.actions.length : 0),
            0,
          ) / axis.objectives.length,
        )
      : 0

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between bg-surface-container-low px-4 py-1.5 rounded-xl border border-outline-variant/50">
        <div className="flex items-center gap-4">
          <span className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: '#0f639d' }} />
          <div>
            <h2 className="text-on-surface" style={{ fontSize: 20 }}>
              Eixo: {axis.name}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-title-md text-title-md font-bold text-[#0f639d]">
            {axisProgress}%
          </span>
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => onForm('objetivo', axis.id, null)}
              className="p-2 hover:bg-surface-container-high rounded-lg transition-colors text-on-surface-variant"
              title="Cadastrar Objetivo"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
            </button>
            {canEdit && (
              <button
                onClick={() => onForm('eixo', null, { id: axis.id, name: axis.name })}
                className="p-2 hover:bg-surface-container-high rounded-lg transition-colors text-on-surface-variant"
                title="Editar Eixo"
              >
                <span className="material-symbols-outlined text-[20px]">edit</span>
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() =>
                  onDelete('eixo', { id: axis.id, name: axis.name }, `Este Eixo possui ${axis.objectives.length} Objetivo(s).`)
                }
                className="p-2 hover:bg-error-container rounded-lg transition-colors text-on-surface-variant hover:text-error"
                title="Excluir Eixo"
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            )}
            <button
              onClick={() => onToggle(`axis-${axis.id}`)}
              className="p-2 hover:bg-surface-container-high rounded-lg transition-colors text-on-surface-variant"
              title={axisOpen ? 'Recolher' : 'Expandir'}
            >
              <span className={`material-symbols-outlined text-[20px] transition-transform ${axisOpen ? '' : '-rotate-90'}`}>
                expand_less
              </span>
            </button>
          </div>
        </div>
      </div>

      {axisOpen && (
        <div className="flex flex-col gap-gutter pl-4 sm:pl-6 border-l-2 border-outline-variant/30">
          {axis.objectives.length === 0 && (
            <div className="p-6">
              <EmptyState
                icon="flag"
                title="Nenhum Objetivo cadastrado"
                description="Crie o primeiro Objetivo deste Eixo para começar a acompanhar o progresso."
                action={
                  <button
                    onClick={() => onForm('objetivo', axis.id, null)}
                    className="mt-2 px-4 py-2 rounded-lg bg-[#0f639d] text-on-primary text-sm font-medium hover:bg-[#0c5182] transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]">add</span> Cadastrar Objetivo
                  </button>
                }
              />
            </div>
          )}
          {axis.objectives.map((objective, objIndex) => (
            <ObjectiveBlock
              key={objective.id}
              objective={objective}
              objIndex={objIndex}
              canEdit={canEdit}
              isAdmin={isAdmin}
              expanded={expanded}
              onToggle={onToggle}
              onForm={onForm}
              onDelete={onDelete}
              onToggleInitiative={onToggleInitiative}
              onToggleAction={onToggleAction}
              togglingId={togglingId}
            />
          ))}
        </div>
      )}
    </section>
  )
})

export default function Dashboard() {
  const { user, company, isAdmin } = useAuth()
  const { toast } = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterData, setFilterData] = useState({ axes: [], objectives: [], actions: [] })
  const [filters, setFilters] = useState({ axis_id: '', objective_id: '', action_id: '', mine: false })
  const [expanded, setExpanded] = useState(new Set())
  const [form, setForm] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const initializedRef = useRef(false)
  const knownKeysRef = useRef(new Set())

  const canEdit = isAdmin || user?.permission === 'gestor'

  const loadDashboard = useCallback(async () => {
    if (!company) return
    setLoading(true)
    try {
      const params = { company_id: company }
      if (filters.axis_id) params.axis_id = Number(filters.axis_id)
      if (filters.objective_id) params.objective_id = Number(filters.objective_id)
      if (filters.action_id) params.action_id = Number(filters.action_id)
      if (filters.mine) params.mine = 1
      const { data: res } = await api.get('/dashboard', { params })
      const tree = res.data?.axes ?? []
      const keys = new Set()
      tree.forEach((a) => {
        keys.add(`axis-${a.id}`)
        a.objectives.forEach((o) => keys.add(`obj-${o.id}`))
      })
      setData(res.data)
      setExpanded((prev) => {
        const next = new Set(prev)
        if (initializedRef.current) {
          keys.forEach((k) => {
            if (!knownKeysRef.current.has(k)) next.add(k)
          })
        } else {
          keys.forEach((k) => next.add(k))
        }
        return next
      })
      initializedRef.current = true
      knownKeysRef.current = keys
    } catch (err) {
      initializedRef.current = false
      toast(err.response?.data?.message || 'Erro ao carregar dados.', 'error')
    } finally {
      setLoading(false)
    }
  }, [company, filters, toast])

  const loadFilters = useCallback(async () => {
    if (!company) return
    try {
      const { data: res } = await api.get('/filters', { params: { company_id: company } })
      const payload = res.data
      setFilterData(payload && Array.isArray(payload.axes)
        ? payload
        : { axes: [], objectives: [], actions: [] })
    } catch {
      /* ignore */
    }
  }, [company])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    loadFilters()
  }, [company, loadFilters])

  const toggleExpand = (key) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const openForm = (type, parentId, item) => setForm({ type, parentId, item })
  const requestDelete = (type, item, impact) =>
    setConfirm({ type, item, impact, message: `Deseja realmente excluir "${item.name}"?` })

  const doDelete = async () => {
    const { type, item } = confirm
    const endpoints = {
      eixo: '/axes',
      objetivo: '/objectives',
      acao: '/actions',
      iniciativa: '/initiatives',
    }
    try {
      setDeleting(true)
      const { data: res } = await api.delete(`${endpoints[type]}/${item.id}`)
      toast(res.data?.impact?.message || `${item.name} foi excluído.`)
      setConfirm(null)
      loadDashboard()
    } catch (err) {
      toast(err.response?.data?.message || 'Erro ao excluir.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const toggleInitiative = async (initiative) => {
    setTogglingId(initiative.id)
    try {
      await api.patch(`/initiatives/${initiative.id}/toggle`)
      loadDashboard()
    } catch (err) {
      toast(err.response?.data?.message || 'Não foi possível atualizar a iniciativa.', 'error')
    } finally {
      setTogglingId(null)
    }
  }

  const toggleAction = async (action) => {
    setTogglingId(action.id)
    try {
      await api.patch(`/actions/${action.id}/toggle`)
      loadDashboard()
    } catch (err) {
      toast(err.response?.data?.message || 'Não foi possível atualizar a ação.', 'error')
    } finally {
      setTogglingId(null)
    }
  }

  // ---- Render ----

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-32">
        <span className="material-symbols-outlined animate-spin text-4xl text-[#0f639d]">progress_activity</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-28">
      {/* Filters */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <SelectFilter
            label="Eixo"
            placeholder="Eixos"
            value={filters.axis_id}
            onChange={(v) => setFilters((f) => ({ ...f, axis_id: v }))}
            options={filterData.axes}
          />
          <SelectFilter
            label="Objetivo"
            placeholder="Objetivos"
            value={filters.objective_id}
            onChange={(v) => setFilters((f) => ({ ...f, objective_id: v }))}
            options={filterData.objectives}
          />
          <SelectFilter
            label="Ação"
            placeholder="Ações"
            value={filters.action_id}
            onChange={(v) => setFilters((f) => ({ ...f, action_id: v }))}
            options={filterData.actions}
          />
          <button
            onClick={() => setFilters((f) => ({ ...f, mine: !f.mine }))}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              filters.mine
                ? 'bg-[#0f639d] text-on-primary border-[#0f639d]'
                : 'border-[#0f639d]/30 text-[#0f639d] hover:bg-[#0f639d]/10'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">person</span> Meus Itens
          </button>
        </div>
      </div>

      {/* Hierarchy */}
      {(!data?.axes || data.axes.length === 0) && (
        <EmptyState
          icon="flag"
          title="Nenhum Eixo cadastrado"
          description="Comece criando o primeiro Eixo para estruturar seus OKRs."
          action={
            <button
              onClick={() => openForm('eixo', company, null)}
              className="mt-2 px-5 py-2.5 rounded-lg bg-[#0f639d] text-on-primary text-sm font-medium hover:bg-[#0c5182] transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">add</span> Cadastrar Eixo
            </button>
          }
        />
      )}

      <div className="flex flex-col gap-gutter">
        {data?.axes?.map((axis) => (
          <AxisBlock
            key={axis.id}
            axis={axis}
            canEdit={canEdit}
            isAdmin={isAdmin}
            expanded={expanded}
            onToggle={toggleExpand}
            onForm={openForm}
            onDelete={requestDelete}
            onToggleInitiative={toggleInitiative}
            onToggleAction={toggleAction}
            togglingId={togglingId}
          />
        ))}
      </div>

      {form && (
        <ItemFormModal
          type={form.type}
          open={!!form}
          companyId={company}
          parentId={form.parentId}
          item={form.item}
          onClose={() => setForm(null)}
          onSaved={loadDashboard}
        />
      )}

      {confirm && (
        <ConfirmDialog
          open={!!confirm}
          title={`Excluir ${confirm.type}`}
          message={confirm.message}
          impact={confirm.impact}
          loading={deleting}
          onCancel={() => setConfirm(null)}
          onConfirm={doDelete}
        />
      )}

      {loading && data && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30">
          <div className="flex items-center gap-3 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl px-6 py-5">
            <span className="material-symbols-outlined animate-spin text-3xl text-[#0f639d]">progress_activity</span>
            <span className="text-sm font-medium text-on-surface">Atualizando...</span>
          </div>
        </div>
      )}

      <button
        onClick={() => openForm('eixo', company, null)}
<<<<<<< HEAD
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-[50%] bg-[#0f639d] text-on-primary shadow-lg shadow-[#0f639d]/30 hover:bg-[#0c5182] hover:scale-105 transition-all flex items-center justify-center"
=======
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-lg bg-[#0f639d] text-on-primary shadow-lg shadow-[#0f639d]/30 hover:bg-[#0c5182] hover:scale-105 transition-all flex items-center justify-center"
>>>>>>> origin/main
        title="Cadastrar Eixo"
      >
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>
    </div>
  )
}