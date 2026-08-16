import { useMemo, useState } from 'react'
import { ShoppingCart, Plus, Pencil, Trash2, FileSpreadsheet, FileText, Calculator } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { PageHead, Card, CardHeader, CardBody, Button, Badge, IconBtn, Modal, Field, Input, Select, MoneyInput, Textarea, DataTable, useToast, ConfirmDialog, type Column } from '../components/ui'
import { useI18n } from '../i18n'
import type { SalesRecord } from '../lib/types'
import { fmt, fmtDate, money, todayIso, uid } from '../lib/format'
import { calcSales } from '../lib/tax'
import { exportExcel, exportPdf } from '../lib/export'

interface FormState {
  date: string
  invoiceNo: string
  description: string
  typeId: string
  amount: number
  rate: number
  paid: number
  notes: string
}

export default function SalesTax() {
  const { data, currentCompany, add, update, remove } = useApp()
  const { t } = useI18n()
  const { push } = useToast()
  const cid = data.activeCompanyId
  const cfg = data.config
  const defaultType = cfg.salesTypes.find((t) => t.id === cfg.salesDefaultId) ?? cfg.salesTypes[0]

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SalesRecord | null>(null)
  const [form, setForm] = useState<FormState>({ date: todayIso(), invoiceNo: '', description: '', typeId: defaultType?.id ?? '', amount: 0, rate: defaultType?.rate ?? 0.1, paid: 0, notes: '' })
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const list = useMemo(
    () => data.sales.filter((r) => r.companyId === cid).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [data.sales, cid],
  )

  const total = list.reduce((s, r) => s + r.tax, 0)
  const paid = list.reduce((s, r) => s + r.paid, 0)
  const totalAmount = list.reduce((s, r) => s + r.amount, 0)

  const hdr = [
    t('pgTax.sales.colInvoiceNo'),
    t('pgTax.sales.colDate'),
    t('pgTax.sales.colDescription'),
    t('pgTax.sales.fieldCategory'),
    t('pgTax.sales.colSales'),
    t('pgTax.sales.colRate'),
    t('pgTax.sales.colTax'),
    t('pgTax.sales.colPaid'),
  ]

  const openNew = () => {
    setEditing(null)
    setForm({ date: todayIso(), invoiceNo: '', description: '', typeId: defaultType?.id ?? '', amount: 0, rate: defaultType?.rate ?? 0.1, paid: 0, notes: '' })
    setModalOpen(true)
  }

  const openEdit = (r: SalesRecord) => {
    setEditing(r)
    setForm({ date: r.date, invoiceNo: r.invoiceNo, description: r.description, typeId: r.typeId, amount: r.amount, rate: r.rate, paid: r.paid, notes: r.notes })
    setModalOpen(true)
  }

  const onTypeChange = (typeId: string) => {
    const tp = cfg.salesTypes.find((x) => x.id === typeId)
    setForm({ ...form, typeId, rate: tp?.rate ?? form.rate })
  }

  const tax = calcSales(form.amount, form.rate)

  const save = () => {
    if (form.amount <= 0) {
      push('error', t('pgTax.sales.amountRequired'))
      return
    }
    const payload = { ...form, tax }
    if (editing) {
      update('sales', editing.id, payload)
      push('success', t('pgTax.sales.updated'))
    } else {
      add('sales', { id: uid(), companyId: cid, ...payload })
      push('success', t('pgTax.sales.added'))
    }
    setModalOpen(false)
  }

  const columns: Column<SalesRecord>[] = [
    { key: 'invoiceNo', title: t('pgTax.sales.colInvoiceNo'), render: (r) => <span dir="ltr" className="text-xs font-semibold">{r.invoiceNo || '—'}</span> },
    { key: 'date', title: t('pgTax.sales.colDate'), render: (r) => <span className="text-xs">{fmtDate(r.date)}</span> },
    {
      key: 'description',
      title: t('pgTax.sales.colDescription'),
      render: (r) => (
        <div>
          <div className="font-semibold text-ink-800">{r.description || '—'}</div>
          <div className="text-xs text-ink-400">{cfg.salesTypes.find((t) => t.id === r.typeId)?.label}</div>
        </div>
      ),
    },
    { key: 'amount', title: t('pgTax.sales.colSales'), total: (rs) => rs.reduce((s, r) => s + r.amount, 0), render: (r) => <span className="text-xs">{money(r.amount)}</span> },
    { key: 'rate', title: t('pgTax.sales.colRate'), render: (r) => <Badge tone={r.rate >= 0.2 ? 'red' : r.rate >= 0.15 ? 'amber' : 'brand'}>{fmt(r.rate * 100)}%</Badge> },
    { key: 'tax', title: t('pgTax.sales.colTax'), total: (rs) => rs.reduce((s, r) => s + r.tax, 0), render: (r) => <span className="text-xs font-bold text-brand-700">{money(r.tax)}</span> },
    { key: 'paid', title: t('pgTax.sales.colPaid'), total: (rs) => rs.reduce((s, r) => s + r.paid, 0), render: (r) => <span className="text-xs">{money(r.paid)}</span> },
    {
      key: 'balance',
      title: t('pgTax.sales.colBalance'),
      render: (r) => {
        const b = r.tax - r.paid
        return b <= 0 ? <Badge tone="green">{t('pgTax.sales.settled')}</Badge> : <Badge tone="red">{money(b)}</Badge>
      },
    },
    {
      key: 'actions',
      title: '',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <IconBtn title={t('pgTax.common.edit')} onClick={() => openEdit(r)}>
            <Pencil size={16} />
          </IconBtn>
          <IconBtn title={t('pgTax.common.delete')} tone="danger" onClick={() => setConfirmId(r.id)}>
            <Trash2 size={16} />
          </IconBtn>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHead
        title={t('pgTax.sales.title')}
        desc={t('pgTax.sales.desc')}
        actions={
          <Button onClick={openNew}>
            <Plus size={16} /> {t('pgTax.sales.newInvoice')}
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4"><div className="text-xs text-ink-500">{t('pgTax.sales.statInvoices')}</div><div className="mt-1 text-xl font-bold text-ink-800">{fmt(list.length)}</div></Card>
        <Card className="p-4"><div className="text-xs text-ink-500">{t('pgTax.sales.statSalesValue')}</div><div className="mt-1 text-xl font-bold text-ink-800">{money(totalAmount)}</div></Card>
        <Card className="p-4 bg-brand-600 text-white"><div className="text-xs text-emerald-100">{t('pgTax.sales.statSalesTax')}</div><div className="mt-1 text-xl font-bold">{money(total)}</div></Card>
        <Card className="p-4"><div className="text-xs text-ink-500">{t('pgTax.sales.statBalance')}</div><div className="mt-1 text-xl font-bold text-red-600">{money(total - paid)}</div></Card>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {cfg.salesTypes.map((st) => (
          <div key={st.id} className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-center">
            <div className="text-[11px] text-ink-500">{st.label}</div>
            <div className="text-sm font-black text-brand-700">{fmt(st.rate * 100)}%</div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader
          title={t('pgTax.sales.tableTitle')}
          subtitle={t('pgTax.sales.tableSubtitle')}
          action={
            <>
              <Button variant="secondary" size="sm" onClick={() => {
                const body = list.map((r) => [r.invoiceNo, r.date, r.description, cfg.salesTypes.find((t) => t.id === r.typeId)?.label ?? '', r.amount, fmt(r.rate * 100) + '%', r.tax, r.paid])
                body.push(['', '', t('pgTax.common.total'), '', totalAmount, '', total, paid])
                exportExcel(`${t('pgTax.sales.title').replace(/ /g, '-')}.xlsx`, t('pgTax.sales.excelSheet'), hdr, body)
                push('success', t('pgTax.sales.exportExcelMsg'))
              }}>
                <FileSpreadsheet size={15} /> {t('pgTax.common.excel')}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => {
                const body = list.map((r) => [r.invoiceNo, fmtDate(r.date), r.description, cfg.salesTypes.find((t) => t.id === r.typeId)?.label ?? '', fmt(r.amount), fmt(r.rate * 100) + '%', fmt(r.tax), fmt(r.paid)])
                body.push(['', '', t('pgTax.common.total'), '', fmt(totalAmount), '', fmt(total), fmt(paid)])
                exportPdf({ title: t('pgTax.sales.pdfTitle'), company: currentCompany, headers: hdr, rows: body })
              }}>
                <FileText size={15} /> {t('pgTax.common.pdf')}
              </Button>
            </>
          }
        />
        <CardBody className="p-0">
          <DataTable columns={columns} rows={list} dense empty={t('pgTax.sales.tableEmpty')} />
        </CardBody>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t('pgTax.sales.editTitle') : t('pgTax.sales.addTitle')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>{t('pgTax.common.cancel')}</Button>
            <Button onClick={save}>{editing ? t('pgTax.common.saveChanges') : t('pgTax.common.add')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('pgTax.sales.fieldInvoiceNo')}>
              <Input dir="ltr" value={form.invoiceNo} onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })} placeholder={t('pgTax.sales.invoiceNoPlaceholder')} />
            </Field>
            <Field label={t('pgTax.sales.fieldDate')}>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </Field>
          </div>
          <Field label={t('pgTax.sales.fieldCategory')}>
            <Select value={form.typeId} onChange={(e) => onTypeChange(e.target.value)}>
              {cfg.salesTypes.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.label} — {fmt(st.rate * 100)}%
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('pgTax.sales.fieldDescription')}>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t('pgTax.sales.descPlaceholder')} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('pgTax.sales.fieldSalesValue')}>
              <MoneyInput value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} />
            </Field>
            <Field label={t('pgTax.sales.fieldRate')}>
              <Input type="number" dir="ltr" step={0.1} value={form.rate * 100} onChange={(e) => setForm({ ...form, rate: Math.max(0, Number(e.target.value)) / 100 })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('pgTax.sales.fieldPaid')}>
              <MoneyInput value={form.paid} onChange={(v) => setForm({ ...form, paid: v })} />
            </Field>
            <Field label={t('pgTax.sales.fieldNotes')}>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-brand-50 p-4">
            <span className="flex items-center gap-2 text-sm font-bold text-brand-800">
              <Calculator size={16} /> {t('pgTax.sales.salesTaxFooter')}
            </span>
            <span className="text-2xl font-black text-brand-700">{money(tax)}</span>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={confirmId !== null} onClose={() => setConfirmId(null)} onConfirm={() => { if (confirmId) { remove('sales', confirmId); setConfirmId(null); push('success', t('pgTax.sales.deleted')) } }} title={t('pgTax.sales.deleteTitle')} message={t('pgTax.sales.deleteMessage')} />
    </div>
  )
}
