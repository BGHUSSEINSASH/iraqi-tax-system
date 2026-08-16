import { useMemo, useState } from 'react'
import { useApp } from '../store/AppContext'
import type { Ticket } from '../lib/types'
import {
  PageHead,
  Card,
  CardBody,
  Button,
  DataTable,
  Badge,
  Field,
  Input,
  Select,
  Modal,
  StatCard,
  useToast,
  Textarea,
} from '../components/ui'
import { Plus, LifeBuoy, AlertCircle, RefreshCw, CheckCircle, Trash2 } from 'lucide-react'
import { useI18n } from '../i18n'

export default function Tickets() {
  const { data, add, update, remove } = useApp()
  const { push } = useToast()
  const { t } = useI18n()

  const [openAdd, setOpenAdd] = useState(false)
  const [q, setQ] = useState('')

  const [form, setForm] = useState<Partial<Ticket>>({
    subject: '',
    dept: 'الدعم الفني',
    priority: 'medium',
    desc: '',
  })

  const resetForm = () => {
    setForm({
      subject: '',
      dept: 'الدعم الفني',
      priority: 'medium',
      desc: '',
    })
  }

  const list = useMemo(() => {
    const arr = [...(data.tickets || []).reverse()]
    return arr.filter((x) =>
      x.subject.toLowerCase().includes(q.toLowerCase()) ||
      x.id.toLowerCase().includes(q.toLowerCase()) ||
      x.dept.toLowerCase().includes(q.toLowerCase())
    )
  }, [data.tickets, q])

  const stats = useMemo(() => {
    const arr = data.tickets || []
    return {
      total: arr.length,
      open: arr.filter((x) => x.status === 'open').length,
      progress: arr.filter((x) => x.status === 'progress').length,
      closed: arr.filter((x) => x.status === 'closed').length,
    }
  }, [data.tickets])

  const handleAdd = () => {
    if (!form.subject) {
      push('error', t('pgSystem.tickets.toast.subjectRequired'))
      return
    }
    const newId = 'TKT-' + String((data.tickets || []).length + 1).padStart(3, '0')
    const item: Ticket = {
      id: newId,
      subject: form.subject || '',
      dept: form.dept || 'الدعم الفني',
      priority: form.priority || 'medium',
      status: 'open',
      date: new Date().toISOString().slice(0, 10),
      desc: form.desc || '',
    }
    add('tickets', item)
    push('success', t('pgSystem.tickets.toast.opened'))
    setOpenAdd(false)
    resetForm()
  }

  const handleResolve = (id: string) => {
    update('tickets', id, { status: 'closed' })
    push('success', t('pgSystem.tickets.toast.closed'))
  }

  const handleDelete = (id: string) => {
    remove('tickets', id)
    push('success', t('pgSystem.tickets.toast.deleted'))
  }

  const priorityBadge = (prio: Ticket['priority']) => {
    if (prio === 'urgent') return <Badge tone="red">{t('pgSystem.tickets.priorityBadge.urgent')}</Badge>
    if (prio === 'high') return <Badge tone="red">{t('pgSystem.tickets.priorityBadge.high')}</Badge>
    if (prio === 'medium') return <Badge tone="amber">{t('pgSystem.tickets.priorityBadge.medium')}</Badge>
    return <Badge tone="slate">{t('pgSystem.tickets.priorityBadge.low')}</Badge>
  }

  const statusBadge = (status: Ticket['status']) => {
    if (status === 'open') return <Badge tone="amber">{t('pgSystem.tickets.statusBadge.open')}</Badge>
    if (status === 'progress') return <Badge tone="blue">{t('pgSystem.tickets.statusBadge.progress')}</Badge>
    return <Badge tone="green">{t('pgSystem.tickets.statusBadge.closed')}</Badge>
  }

  const columns = [
    { key: 'id', title: t('pgSystem.tickets.col.id'), className: 'font-mono text-xs' },
    { key: 'subject', title: t('pgSystem.tickets.col.subject'), className: 'font-semibold text-ink-800' },
    { key: 'dept', title: t('pgSystem.tickets.col.dept') },
    {
      key: 'priority',
      title: t('pgSystem.tickets.col.priority'),
      render: (r: Ticket) => priorityBadge(r.priority),
    },
    {
      key: 'status',
      title: t('pgSystem.tickets.col.status'),
      render: (r: Ticket) => statusBadge(r.status),
    },
    { key: 'date', title: t('pgSystem.tickets.col.date'), className: 'font-mono text-xs' },
    {
      key: 'actions',
      title: t('pgSystem.tickets.col.actions'),
      render: (r: Ticket) => (
        <div className="flex items-center gap-1">
          {r.status !== 'closed' && (
            <Button variant="ghost" size="sm" onClick={() => handleResolve(r.id)} className="text-emerald-600 hover:bg-emerald-50" title={t('pgSystem.tickets.action.close')}>
              <CheckCircle size={14} />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} className="text-red-600 hover:bg-red-50" title={t('pgSystem.tickets.action.delete')}>
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHead
        title={t('pgSystem.tickets.page.title')}
        desc={t('pgSystem.tickets.page.desc')}
        actions={
          <Button onClick={() => setOpenAdd(true)}>
            <Plus size={16} className="ml-1.5" />
            {t('pgSystem.tickets.page.newTicket')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard icon={<LifeBuoy size={21} />} label={t('pgSystem.tickets.stat.total')} value={stats.total} tone="brand" />
        <StatCard icon={<AlertCircle size={21} />} label={t('pgSystem.tickets.stat.open')} value={stats.open} tone="amber" />
        <StatCard icon={<RefreshCw size={21} />} label={t('pgSystem.tickets.stat.progress')} value={stats.progress} tone="blue" />
        <StatCard icon={<CheckCircle size={21} />} label={t('pgSystem.tickets.stat.closed')} value={stats.closed} tone="green" />
      </div>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="w-full max-w-xs">
              <input
                className="input text-xs"
                placeholder={t('pgSystem.tickets.searchPlaceholder')}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            
            <span className="text-[11px] font-semibold text-ink-400">{t('pgSystem.tickets.responseRate')}</span>
          </div>

          <DataTable columns={columns} rows={list} />
        </CardBody>
      </Card>

      {/* Add Modal */}
      <Modal open={openAdd} onClose={() => setOpenAdd(false)} title={t('pgSystem.tickets.modal.title')}>
        <div className="grid grid-cols-1 gap-4">
          <Field label={t('pgSystem.tickets.modal.subject')} required>
            <Input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder={t('pgSystem.tickets.modal.subjectPlaceholder')}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('pgSystem.tickets.modal.dept')}>
              <Select value={form.dept} onChange={(e) => setForm({ ...form, dept: e.target.value })}>
                <option value="الدعم الفني">{t('pgSystem.tickets.modal.deptOption1')}</option>
                <option value="الاشتراكات">{t('pgSystem.tickets.modal.deptOption2')}</option>
                <option value="المحاسبة">{t('pgSystem.tickets.modal.deptOption3')}</option>
              </Select>
            </Field>
            <Field label={t('pgSystem.tickets.modal.priority')}>
              <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as any })}>
                <option value="low">{t('pgSystem.tickets.priority.low')}</option>
                <option value="medium">{t('pgSystem.tickets.priority.medium')}</option>
                <option value="high">{t('pgSystem.tickets.priority.high')}</option>
                <option value="urgent">{t('pgSystem.tickets.priority.urgent')}</option>
              </Select>
            </Field>
          </div>
          <Field label={t('pgSystem.tickets.modal.desc')}>
            <Textarea
              value={form.desc}
              onChange={(e) => setForm({ ...form, desc: e.target.value })}
              placeholder={t('pgSystem.tickets.modal.descPlaceholder')}
            />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpenAdd(false)}>{t('pgSystem.tickets.modal.cancel')}</Button>
          <Button onClick={handleAdd}>{t('pgSystem.tickets.modal.submit')}</Button>
        </div>
      </Modal>
    </div>
  )
}
