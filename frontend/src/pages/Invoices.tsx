import { useMemo, useState } from 'react'
import { useApp } from '../store/AppContext'
import type { Invoice } from '../lib/types'
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
  ConfirmDialog,
  SearchInput,
  StatCard,
  useToast,
  MoneyInput,
} from '../components/ui'
import { Plus, Receipt, FileCheck, AlertCircle, FileX, Trash2, Printer, CheckCircle } from 'lucide-react'
import { fmt } from '../lib/format'
import { useI18n } from '../i18n'

export default function Invoices() {
  const { data, add, update, remove } = useApp()
  const { push } = useToast()
  const { t } = useI18n()

  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [openAdd, setOpenAdd] = useState(false)
  const [printInv, setPrintInv] = useState<Invoice | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Form State
  const [form, setForm] = useState<Partial<Invoice>>({
    client: '',
    taxType: 'ضريبة دخل الشركات',
    taxRate: 0.15,
    amount: 0,
    taxAmount: 0,
    date: new Date().toISOString().slice(0, 10),
    due: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    period: new Date().toISOString().slice(0, 7),
    relatedEntityId: '',
    status: 'pending',
    notes: '',
  })

  const resetForm = () => {
    setForm({
      client: '',
      taxType: 'ضريبة دخل الشركات',
      taxRate: 0.15,
      amount: 0,
      taxAmount: 0,
      date: new Date().toISOString().slice(0, 10),
      due: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      period: new Date().toISOString().slice(0, 7),
      relatedEntityId: '',
      status: 'pending',
      notes: '',
    })
  }

  const list = useMemo(() => {
    return (data.invoices || []).filter((x) => {
      const matchQ =
        x.client.toLowerCase().includes(q.toLowerCase()) ||
        x.id.toLowerCase().includes(q.toLowerCase()) ||
        x.taxType.toLowerCase().includes(q.toLowerCase())
      const matchStatus = statusFilter === 'all' || x.status === statusFilter
      return matchQ && matchStatus
    })
  }, [data.invoices, q, statusFilter])

  const stats = useMemo(() => {
    const invs = data.invoices || []
    return {
      total: invs.length,
      paid: invs.filter((x) => x.status === 'paid').length,
      pending: invs.filter((x) => x.status === 'pending').length,
      overdue: invs.filter((x) => x.status === 'overdue').length,
      totalAmount: invs.reduce((sum, x) => sum + x.amount, 0),
    }
  }, [data.invoices])

  const handleAdd = () => {
    if (!form.client || !form.amount) {
      push('error', t('pgSecondary.invoices.toast.required'))
      return
    }
    const newId = 'INV-' + String((data.invoices || []).length + 1).padStart(3, '0')
    const item: Invoice = {
      id: newId,
      client: form.client || '',
      taxType: form.taxType || 'ضريبة دخل الشركات',
      taxRate: form.taxRate || 0.15,
      amount: form.amount || 0,
      taxAmount: form.taxAmount || form.amount * (form.taxRate || 0.15),
      date: form.date || new Date().toISOString().slice(0, 10),
      due: form.due || '',
      period: form.period || new Date().toISOString().slice(0, 7),
      relatedEntityId: form.relatedEntityId || '',
      status: form.status || 'pending',
      notes: form.notes || '',
    }
    add('invoices', item)
    push('success', t('pgSecondary.invoices.toast.added'))
    setOpenAdd(false)
    resetForm()
  }

  const handlePay = (inv: Invoice) => {
    update('invoices', inv.id, { status: 'paid' })
    push('success', t('pgSecondary.invoices.toast.paid'))
  }

  const handleDelete = () => {
    if (!deleteId) return
    remove('invoices', deleteId)
    push('success', t('pgSecondary.invoices.toast.deleted'))
    setDeleteId(null)
  }

  const handlePrint = (inv: Invoice) => {
    setPrintInv(inv)
    setTimeout(() => {
      window.print()
    }, 300)
  }

  const columns = [
    { key: 'id', title: t('pgSecondary.invoices.col.id'), className: 'font-mono' },
    { key: 'client', title: t('pgSecondary.invoices.col.client') },
    { key: 'taxType', title: t('pgSecondary.invoices.col.taxType') },
    {
      key: 'amount',
      title: t('pgSecondary.invoices.col.amount'),
      render: (r: Invoice) => (
        <span className="font-semibold text-brand-700">{t('pgSecondary.invoices.col.amountValue', { amount: fmt(r.amount) })}</span>
      ),
    },
    { key: 'date', title: t('pgSecondary.invoices.col.date'), className: 'font-mono text-xs' },
    { key: 'due', title: t('pgSecondary.invoices.col.due'), className: 'font-mono text-xs' },
    {
      key: 'status',
      title: t('pgSecondary.invoices.col.status'),
      render: (r: Invoice) => {
        if (r.status === 'paid') return <Badge tone="green">{t('pgSecondary.invoices.badge.paid')}</Badge>
        if (r.status === 'pending') return <Badge tone="amber">{t('pgSecondary.invoices.badge.pending')}</Badge>
        return <Badge tone="red">{t('pgSecondary.invoices.badge.overdue')}</Badge>
      },
    },
    {
      key: 'actions',
      title: t('pgSecondary.invoices.col.actions'),
      render: (r: Invoice) => (
        <div className="flex items-center gap-1">
          {r.status !== 'paid' && (
            <Button variant="ghost" size="sm" onClick={() => handlePay(r)} className="text-emerald-600 hover:bg-emerald-50" title={t('pgSecondary.invoices.action.pay')}>
              <CheckCircle size={14} />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => handlePrint(r)} title={t('pgSecondary.invoices.action.print')}>
            <Printer size={14} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteId(r.id)} className="text-red-600 hover:bg-red-50" title={t('pgSecondary.invoices.action.delete')}>
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <PageHead
          title={t('pgSecondary.invoices.page.title')}
          desc={t('pgSecondary.invoices.page.desc')}
          actions={
            <Button onClick={() => setOpenAdd(true)}>
              <Plus size={16} className="ml-1.5" />
              {t('pgSecondary.invoices.page.add')}
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <StatCard
            icon={<Receipt size={20} />}
            label={t('pgSecondary.invoices.stat.total')}
            value={t('pgSecondary.invoices.stat.totalCount', { count: stats.total })}
            sub={t('pgSecondary.invoices.stat.totalAmount', { amount: fmt(stats.totalAmount) })}
            tone="brand"
          />
          <StatCard icon={<FileCheck size={20} />} label={t('pgSecondary.invoices.stat.paid')} value={stats.paid} tone="green" />
          <StatCard icon={<AlertCircle size={20} />} label={t('pgSecondary.invoices.stat.pending')} value={stats.pending} tone="amber" />
          <StatCard icon={<FileX size={20} />} label={t('pgSecondary.invoices.stat.overdue')} value={stats.overdue} tone="red" />
        </div>

        <Card className="mt-6">
          <CardBody className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <SearchInput className="w-full max-w-xs" value={q} onChange={setQ} placeholder={t('pgSecondary.invoices.search.placeholder')} />
              
              <Select className="w-40 py-1.5 text-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">{t('pgSecondary.invoices.filter.all')}</option>
                <option value="paid">{t('pgSecondary.invoices.filter.paid')}</option>
                <option value="pending">{t('pgSecondary.invoices.filter.pending')}</option>
                <option value="overdue">{t('pgSecondary.invoices.filter.overdue')}</option>
              </Select>
            </div>

            <DataTable columns={columns} rows={list} />
          </CardBody>
        </Card>
      </div>

      {/* Print View container */}
      {printInv && (
        <div className="hidden print:block p-10 bg-white text-ink-900 leading-relaxed font-sans" dir="rtl">
          <div className="border-b-2 border-brand-700 pb-5 mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-extrabold text-brand-800">{t('pgSecondary.invoices.print.title')}</h1>
              <p className="text-xs text-ink-500 mt-1">{t('pgSecondary.invoices.print.subtitle')}</p>
            </div>
            <div className="text-left">
              <div className="text-lg font-bold text-ink-800">{t('pgSecondary.invoices.print.invoiceNo', { id: printInv.id })}</div>
              <div className="text-xs text-ink-500 font-mono mt-1">{t('pgSecondary.invoices.print.date', { date: printInv.date })}</div>
              <div className="text-xs text-ink-500 font-mono">{t('pgSecondary.invoices.print.due', { due: printInv.due })}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8 border border-ink-200 rounded-xl p-5 bg-ink-50">
            <div>
              <h3 className="font-bold text-brand-800 border-b border-ink-200 pb-2 mb-2">{t('pgSecondary.invoices.print.issuer')}</h3>
              <p className="font-semibold">{t('pgSecondary.invoices.print.issuerName')}</p>
              <p className="text-xs text-ink-500">{t('pgSecondary.invoices.print.issuerDesc')}</p>
            </div>
            <div>
              <h3 className="font-bold text-brand-800 border-b border-ink-200 pb-2 mb-2">{t('pgSecondary.invoices.print.taxpayer')}</h3>
              <p className="font-semibold">{printInv.client}</p>
              <p className="text-xs text-ink-500">{t('pgSecondary.invoices.print.taxpayerDesc')}</p>
            </div>
          </div>

          <table className="w-full border-collapse border border-ink-200 mb-8">
            <thead>
              <tr className="bg-brand-50 border-b border-ink-200">
                <th className="p-3 text-right font-bold text-brand-800">{t('pgSecondary.invoices.print.colDesc')}</th>
                <th className="p-3 text-left font-bold text-brand-800">{t('pgSecondary.invoices.print.colAmount')}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-ink-200">
                <td className="p-3">
                  <div className="font-bold">{printInv.taxType}</div>
                  <div className="text-xs text-ink-500">{printInv.notes || t('pgSecondary.invoices.print.notesDefault')}</div>
                </td>
                <td className="p-3 text-left font-mono font-bold text-lg">{t('pgSecondary.invoices.print.totalValue', { amount: fmt(printInv.amount) })}</td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-between items-center bg-brand-50 border border-brand-200 rounded-xl p-5 mb-10">
            <div>
              <div className="text-xs text-brand-600 font-bold uppercase tracking-wider">{t('pgSecondary.invoices.print.statusLabel')}</div>
              <div className="text-2xl font-black text-brand-800 mt-1">{printInv.status === 'paid' ? t('pgSecondary.invoices.print.paid') : t('pgSecondary.invoices.print.duePending')}</div>
            </div>
            <div className="text-left">
              <div className="text-xs text-ink-500">{t('pgSecondary.invoices.print.totalLabel')}</div>
              <div className="text-3xl font-black text-brand-800 mt-0.5">{t('pgSecondary.invoices.print.totalValue', { amount: fmt(printInv.amount) })}</div>
            </div>
          </div>

          <div className="border-t border-ink-200 pt-5 text-center text-xs text-ink-400">
            {t('pgSecondary.invoices.print.footer')}
          </div>
        </div>
      )}

      {/* Add Modal */}
      <Modal open={openAdd} onClose={() => setOpenAdd(false)} title={t('pgSecondary.invoices.modal.title')}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('pgSecondary.invoices.modal.client')} required>
            <Input
              value={form.client}
              onChange={(e) => setForm({ ...form, client: e.target.value })}
              placeholder={t('pgSecondary.invoices.modal.clientPlaceholder')}
            />
          </Field>
          <Field label={t('pgSecondary.invoices.modal.taxType')}>
            <Select value={form.taxType} onChange={(e) => setForm({ ...form, taxType: e.target.value })}>
              <option value="ضريبة دخل الشركات">{t('pgSecondary.invoices.taxType.corporate')}</option>
              <option value="ضريبة الاستقطاع المباشر">{t('pgSecondary.invoices.taxType.withholding')}</option>
              <option value="ضريبة العقار">{t('pgSecondary.invoices.taxType.property')}</option>
              <option value="ضريبة العرصات">{t('pgSecondary.invoices.taxType.land')}</option>
              <option value="ضريبة المهن">{t('pgSecondary.invoices.taxType.profession')}</option>
              <option value="ضريبة المبيعات">{t('pgSecondary.invoices.taxType.sales')}</option>
              <option value="ضريبة العقود الرسمية">{t('pgSecondary.invoices.taxType.contracts')}</option>
            </Select>
          </Field>
          <Field label={t('pgSecondary.invoices.modal.amount')} required>
            <MoneyInput
              value={form.amount || 0}
              onChange={(v) => setForm({ ...form, amount: v })}
            />
          </Field>
          <Field label={t('pgSecondary.invoices.modal.issueDate')}>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </Field>
          <Field label={t('pgSecondary.invoices.modal.dueDate')}>
            <Input
              type="date"
              value={form.due}
              onChange={(e) => setForm({ ...form, due: e.target.value })}
            />
          </Field>
          <Field label={t('pgSecondary.invoices.modal.status')}>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
              <option value="pending">{t('pgSecondary.invoices.modal.statusPending')}</option>
              <option value="paid">{t('pgSecondary.invoices.modal.statusPaid')}</option>
              <option value="overdue">{t('pgSecondary.invoices.modal.statusOverdue')}</option>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label={t('pgSecondary.invoices.modal.notes')}>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder={t('pgSecondary.invoices.modal.notesPlaceholder')}
              />
            </Field>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpenAdd(false)}>{t('pgSecondary.common.cancel')}</Button>
          <Button onClick={handleAdd}>{t('pgSecondary.invoices.modal.submit')}</Button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t('pgSecondary.invoices.confirm.title')}
        message={t('pgSecondary.invoices.confirm.message')}
      />
    </div>
  )
}
