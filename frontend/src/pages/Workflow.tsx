import { useMemo, useState } from 'react'
import { useApp } from '../store/AppContext'
import type { WorkflowItem } from '../lib/types'
import {
  PageHead,
  Button,
  Field,
  Input,
  Select,
  Modal,
  Badge,
  useToast,
} from '../components/ui'
import { Plus, Kanban, User, Calendar, ChevronLeft, Trash2 } from 'lucide-react'
import { useI18n } from '../i18n'

const columns = [
  { id: 'new', labelKey: 'pgSecondary.workflow.status.new', bg: 'bg-ink-100 border-ink-200' },
  { id: 'review', labelKey: 'pgSecondary.workflow.status.review', bg: 'bg-amber-50/40 border-amber-200/50' },
  { id: 'approved', labelKey: 'pgSecondary.workflow.status.approved', bg: 'bg-sky-50/40 border-sky-200/50' },
  { id: 'completed', labelKey: 'pgSecondary.workflow.status.completed', bg: 'bg-emerald-50/40 border-emerald-200/50' },
]

export default function Workflow() {
  const { data, add, update, remove } = useApp()
  const { push } = useToast()
  const { t } = useI18n()

  const [openAdd, setOpenAdd] = useState(false)
  const [form, setForm] = useState<Partial<WorkflowItem>>({
    title: '',
    assignee: 'محمد أحمد',
    priority: 'medium',
    status: 'new',
    date: new Date().toISOString().slice(0, 10),
  })

  const resetForm = () => {
    setForm({
      title: '',
      assignee: 'محمد أحمد',
      priority: 'medium',
      status: 'new',
      date: new Date().toISOString().slice(0, 10),
    })
  }

  const handleAdd = () => {
    if (!form.title) {
      push('error', t('pgSecondary.workflow.toast.titleRequired'))
      return
    }
    const newId = 'WF-' + Date.now()
    const item: WorkflowItem = {
      id: newId,
      title: form.title || '',
      assignee: form.assignee || 'محمد أحمد',
      priority: form.priority || 'medium',
      status: form.status || 'new',
      date: form.date || new Date().toISOString().slice(0, 10),
    }
    add('workflows', item)
    push('success', t('pgSecondary.workflow.toast.added'))
    setOpenAdd(false)
    resetForm()
  }

  const handleAdvance = (wf: WorkflowItem) => {
    const order: WorkflowItem['status'][] = ['new', 'review', 'approved', 'completed']
    const idx = order.indexOf(wf.status)
    if (idx < order.length - 1) {
      const nextStatus = order[idx + 1]
      update('workflows', wf.id, { status: nextStatus })
      push('success', t('pgSecondary.workflow.toast.advanced'))
    }
  }

  const handleRollback = (wf: WorkflowItem) => {
    const order: WorkflowItem['status'][] = ['new', 'review', 'approved', 'completed']
    const idx = order.indexOf(wf.status)
    if (idx > 0) {
      const prevStatus = order[idx - 1]
      update('workflows', wf.id, { status: prevStatus })
      push('success', t('pgSecondary.workflow.toast.rolledBack'))
    }
  }

  const handleDelete = (id: string) => {
    remove('workflows', id)
    push('success', t('pgSecondary.workflow.toast.deleted'))
  }

  const grouped = useMemo(() => {
    const items = data.workflows || []
    return {
      new: items.filter((x) => x.status === 'new'),
      review: items.filter((x) => x.status === 'review'),
      approved: items.filter((x) => x.status === 'approved'),
      completed: items.filter((x) => x.status === 'completed'),
    }
  }, [data.workflows])

  const priorityBadge = (prio: WorkflowItem['priority']) => {
    if (prio === 'urgent') return <Badge tone="red">{t('pgSecondary.workflow.priority.urgent')}</Badge>
    if (prio === 'high') return <Badge tone="amber">{t('pgSecondary.workflow.priority.high')}</Badge>
    if (prio === 'medium') return <Badge tone="blue">{t('pgSecondary.workflow.priority.medium')}</Badge>
    return <Badge tone="slate">{t('pgSecondary.workflow.priority.low')}</Badge>
  }

  return (
    <div className="space-y-6">
      <PageHead
        title={t('pgSecondary.workflow.page.title')}
        desc={t('pgSecondary.workflow.page.desc')}
        actions={
          <Button onClick={() => setOpenAdd(true)}>
            <Plus size={16} className="ml-1.5" />
            {t('pgSecondary.workflow.page.add')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const list = grouped[col.id as keyof typeof grouped] || []
          return (
            <div key={col.id} className="flex flex-col min-w-[260px] rounded-xl border border-ink-200 bg-white shadow-sm p-4">
              <div className="flex items-center justify-between border-b border-ink-100 pb-3 mb-4">
                <span className="font-bold text-ink-800 text-sm flex items-center gap-1.5">
                  <Kanban size={14} className="text-brand-600" />
                  {t(col.labelKey)}
                </span>
                <span className="text-xs bg-ink-100 text-ink-600 font-bold px-2 py-0.5 rounded-full">
                  {list.length}
                </span>
              </div>

              <div className="flex-1 space-y-3 min-h-[350px]">
                {list.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-ink-200 rounded-xl text-center text-ink-400">
                    <span className="text-xs">{t('pgSecondary.workflow.empty.col')}</span>
                  </div>
                ) : (
                  list.map((item) => (
                    <div
                      key={item.id}
                      className="group relative rounded-xl border border-ink-200 bg-ink-50 hover:bg-white p-4 transition duration-200 shadow-sm"
                    >
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="absolute left-2 top-2 p-1 text-ink-400 hover:text-red-600 rounded opacity-0 group-hover:opacity-100 transition"
                        title={t('pgSecondary.workflow.action.delete')}
                      >
                        <Trash2 size={13} />
                      </button>

                      <h4 className="font-bold text-ink-800 text-sm leading-snug mb-3 ml-4">{item.title}</h4>

                      <div className="flex items-center justify-between border-b border-ink-100 pb-2 mb-2">
                        <div className="flex items-center gap-1 text-[11px] text-ink-500">
                          <User size={12} />
                          <span>{item.assignee}</span>
                        </div>
                        {priorityBadge(item.priority)}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[10px] text-ink-400">
                          <Calendar size={11} />
                          <span>{item.date}</span>
                        </div>
                        <div className="flex gap-1">
                          {item.status !== 'new' && (
                            <button
                              onClick={() => handleRollback(item)}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-ink-200 bg-white text-ink-500 hover:bg-ink-100 transition"
                              title={t('pgSecondary.workflow.action.rollback')}
                            >
                              <ChevronLeft size={12} className="rotate-180" />
                            </button>
                          )}
                          {item.status !== 'completed' && (
                            <button
                              onClick={() => handleAdvance(item)}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-brand-200 bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white transition"
                              title={t('pgSecondary.workflow.action.advance')}
                            >
                              <ChevronLeft size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Modal */}
      <Modal open={openAdd} onClose={() => setOpenAdd(false)} title={t('pgSecondary.workflow.modal.title')}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label={t('pgSecondary.workflow.modal.taskTitle')} required>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={t('pgSecondary.workflow.modal.taskTitlePlaceholder')}
              />
            </Field>
          </div>
          <Field label={t('pgSecondary.workflow.modal.assignee')}>
            <Input
              value={form.assignee}
              onChange={(e) => setForm({ ...form, assignee: e.target.value })}
            />
          </Field>
          <Field label={t('pgSecondary.workflow.modal.priority')}>
            <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as any })}>
              <option value="low">{t('pgSecondary.workflow.modal.priorityLow')}</option>
              <option value="medium">{t('pgSecondary.workflow.modal.priorityMedium')}</option>
              <option value="high">{t('pgSecondary.workflow.modal.priorityHigh')}</option>
              <option value="urgent">{t('pgSecondary.workflow.modal.priorityUrgent')}</option>
            </Select>
          </Field>
          <Field label={t('pgSecondary.workflow.modal.initialStatus')}>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
              <option value="new">{t('pgSecondary.workflow.status.new')}</option>
              <option value="review">{t('pgSecondary.workflow.status.review')}</option>
              <option value="approved">{t('pgSecondary.workflow.status.approved')}</option>
              <option value="completed">{t('pgSecondary.workflow.status.completed')}</option>
            </Select>
          </Field>
          <Field label={t('pgSecondary.workflow.modal.startDate')}>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpenAdd(false)}>{t('pgSecondary.common.cancel')}</Button>
          <Button onClick={handleAdd}>{t('pgSecondary.workflow.modal.submit')}</Button>
        </div>
      </Modal>
    </div>
  )
}
