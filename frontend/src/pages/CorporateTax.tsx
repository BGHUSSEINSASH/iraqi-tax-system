import { useMemo, useState } from 'react'
import { Landmark, Plus, Pencil, Trash2, FileSpreadsheet, FileText, Calculator } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { PageHead, Card, CardHeader, CardBody, Button, Badge, IconBtn, Modal, Field, Input, Select, MoneyInput, Textarea, DataTable, useToast, ConfirmDialog, Tabs, type Column } from '../components/ui'
import { useI18n } from '../i18n'
import type { CorporateReturn } from '../lib/types'
import { fmt, money, nowYear, uid } from '../lib/format'
import { calcCorporate } from '../lib/tax'
import { exportExcel, exportPdf } from '../lib/export'
import CorporateProfitStatement from './CorporateProfitStatement'

interface FormState {
  year: number
  type: 'general' | 'oil'
  profits: number
  exemptions: number
  rate: number
  paid: number
  notes: string
}

export default function CorporateTax() {
  const { data, currentCompany, add, update, remove } = useApp()
  const { t } = useI18n()
  const { push } = useToast()
  const year = nowYear()
  const cid = data.activeCompanyId
  const cfg = data.config

  const [tab, setTab] = useState<'returns' | 'statement'>('returns')
  const [selYear, setSelYear] = useState(year)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CorporateReturn | null>(null)
  const [form, setForm] = useState<FormState>({ year, type: 'general', profits: 0, exemptions: 0, rate: cfg.corporateRate, paid: 0, notes: '' })
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const list = useMemo(
    () =>
      data.corporateReturns
        .filter((r) => r.companyId === cid && r.year === selYear)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [data.corporateReturns, cid, selYear],
  )

  const total = list.reduce((s, r) => s + r.tax, 0)
  const paid = list.reduce((s, r) => s + r.paid, 0)

  const hdr = [
    t('pgTax.corporate.colType'),
    t('pgTax.corporate.colProfits'),
    t('pgTax.corporate.colExemptions'),
    t('pgTax.corporate.colTaxable'),
    t('pgTax.corporate.colRate'),
    t('pgTax.corporate.colTax'),
    t('pgTax.corporate.colPaid'),
  ]

  const openNew = () => {
    setEditing(null)
    setForm({ year: selYear, type: 'general', profits: 0, exemptions: 0, rate: cfg.corporateRate, paid: 0, notes: '' })
    setModalOpen(true)
  }

  const openEdit = (r: CorporateReturn) => {
    setEditing(r)
    setForm({ year: r.year, type: r.type, profits: r.profits, exemptions: r.exemptions, rate: r.rate, paid: r.paid, notes: r.notes })
    setModalOpen(true)
  }

  const calc = calcCorporate(form.profits, form.exemptions, form.rate)

  const save = () => {
    if (form.profits < 0 || form.rate < 0) {
      push('error', t('pgTax.corporate.checkValues'))
      return
    }
    const payload = {
      ...form,
      taxable: calc.taxable,
      tax: calc.tax,
    }
    if (editing) {
      update('corporateReturns', editing.id, payload)
      push('success', t('pgTax.corporate.updated'))
    } else {
      add('corporateReturns', { id: uid(), companyId: cid, createdAt: new Date().toISOString(), ...payload })
      push('success', t('pgTax.corporate.added'))
    }
    setModalOpen(false)
  }

  const columns: Column<CorporateReturn>[] = [
    {
      key: 'type',
      title: t('pgTax.corporate.colType'),
      render: (r) => <Badge tone={r.type === 'general' ? 'brand' : 'amber'}>{r.type === 'general' ? t('pgTax.corporate.general15') : t('pgTax.corporate.oil35')}</Badge>,
    },
    { key: 'profits', title: t('pgTax.corporate.colProfits'), total: (rs) => rs.reduce((s, r) => s + r.profits, 0), render: (r) => <span className="text-xs">{money(r.profits)}</span> },
    { key: 'exemptions', title: t('pgTax.corporate.colExemptions'), total: (rs) => rs.reduce((s, r) => s + r.exemptions, 0), render: (r) => <span className="text-xs text-ink-500">{money(r.exemptions)}</span> },
    { key: 'taxable', title: t('pgTax.corporate.colTaxable'), total: (rs) => rs.reduce((s, r) => s + r.taxable, 0), render: (r) => <span className="text-xs font-semibold">{money(r.taxable)}</span> },
    { key: 'rate', title: t('pgTax.corporate.colRate'), render: (r) => <span className="text-xs">{fmt(r.rate * 100)}%</span> },
    { key: 'tax', title: t('pgTax.corporate.colTax'), total: (rs) => rs.reduce((s, r) => s + r.tax, 0), render: (r) => <span className="text-xs font-bold text-brand-700">{money(r.tax)}</span> },
    { key: 'paid', title: t('pgTax.corporate.colPaid'), total: (rs) => rs.reduce((s, r) => s + r.paid, 0), render: (r) => <span className="text-xs">{money(r.paid)}</span> },
    {
      key: 'balance',
      title: t('pgTax.corporate.colBalance'),
      total: (rs) => rs.reduce((s, r) => s + Math.max(0, r.tax - r.paid), 0),
      render: (r) => {
        const b = r.tax - r.paid
        return b <= 0 ? <Badge tone="green">{t('pgTax.corporate.settled')}</Badge> : <Badge tone="red">{money(b)}</Badge>
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
        title={t('pgTax.corporate.title')}
        desc={t('pgTax.corporate.desc')}
        actions={
          tab === 'returns' ? (
            <>
              <Select className="max-w-[140px]" value={selYear} onChange={(e) => setSelYear(Number(e.target.value))}>
                {[year - 2, year - 1, year, year + 1].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
              <Button onClick={openNew}>
                <Plus size={16} /> {t('pgTax.corporate.newReturn')}
              </Button>
            </>
          ) : null
        }
      />

      <div className="mb-5">
        <Tabs
          items={[
            { id: 'returns', label: t('pgTax.corporate.title') },
            { id: 'statement', label: t('pgTax.corporate.statement.title') },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'statement' && <CorporateProfitStatement />}

      {tab === 'returns' && (
      <>
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs text-ink-500">{t('pgTax.corporate.statReturns')}</div>
          <div className="mt-1 text-xl font-bold text-ink-800">{fmt(list.length)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-ink-500">{t('pgTax.corporate.statProfits')}</div>
          <div className="mt-1 text-xl font-bold text-ink-800">{money(list.reduce((s, r) => s + r.profits, 0))}</div>
        </Card>
        <Card className="p-4 bg-brand-600 text-white">
          <div className="text-xs text-emerald-100">{t('pgTax.corporate.statYearTax')}</div>
          <div className="mt-1 text-xl font-bold">{money(total)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-ink-500">{t('pgTax.corporate.statBalance')}</div>
          <div className="mt-1 text-xl font-bold text-red-600">{money(total - paid)}</div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title={t('pgTax.corporate.tableTitle', { year: selYear })}
          subtitle={t('pgTax.corporate.tableSubtitle')}
          action={
            <>
              <Button variant="secondary" size="sm" onClick={() => {
                const headers = [...hdr, t('pgTax.common.notes')]
                const body = list.map((r) => [r.type === 'general' ? t('pgTax.corporate.general') : t('pgTax.corporate.oil'), r.profits, r.exemptions, r.taxable, fmt(r.rate * 100) + '%', r.tax, r.paid, r.notes])
                body.push([t('pgTax.common.total'), '', '', list.reduce((s, r) => s + r.taxable, 0), '', total, paid, ''])
                exportExcel(`${t('pgTax.corporate.title').replace(/ /g, '-')}-${selYear}.xlsx`, t('pgTax.corporate.excelSheet'), headers, body)
                push('success', t('pgTax.corporate.exportExcel'))
              }}>
                <FileSpreadsheet size={15} /> {t('pgTax.common.excel')}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => {
                const body = list.map((r) => [r.type === 'general' ? t('pgTax.corporate.general') : t('pgTax.corporate.oil'), fmt(r.profits), fmt(r.exemptions), fmt(r.taxable), fmt(r.rate * 100) + '%', fmt(r.tax), fmt(r.paid)])
                body.push([t('pgTax.common.total'), '', '', fmt(list.reduce((s, r) => s + r.taxable, 0)), '', fmt(total), fmt(paid)])
                exportPdf({ title: t('pgTax.corporate.pdfTitle'), subtitle: t('pgTax.corporate.pdfSubtitle', { year: selYear }), company: currentCompany, headers: hdr, rows: body })
              }}>
                <FileText size={15} /> {t('pgTax.common.pdf')}
              </Button>
            </>
          }
        />
        <CardBody className="p-0">
          <DataTable columns={columns} rows={list} dense empty={t('pgTax.corporate.tableEmpty')} />
        </CardBody>
      </Card>
      </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t('pgTax.corporate.editTitle') : t('pgTax.corporate.addTitle')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              {t('pgTax.common.cancel')}
            </Button>
            <Button onClick={save}>{editing ? t('pgTax.common.saveChanges') : t('pgTax.common.add')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('pgTax.corporate.fiscalYear')}>
              <Select value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}>
                {[year - 2, year - 1, year, year + 1].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('pgTax.corporate.taxType')}>
              <Select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as 'general' | 'oil', rate: e.target.value === 'oil' ? cfg.corporateOilRate : cfg.corporateRate })
                }
              >
                <option value="general">{t('pgTax.corporate.generalOpt', { pct: fmt(cfg.corporateRate * 100) })}</option>
                <option value="oil">{t('pgTax.corporate.oilOpt', { pct: fmt(cfg.corporateOilRate * 100) })}</option>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('pgTax.corporate.netProfits')}>
              <MoneyInput value={form.profits} onChange={(v) => setForm({ ...form, profits: v })} />
            </Field>
            <Field label={t('pgTax.corporate.exemptions')}>
              <MoneyInput value={form.exemptions} onChange={(v) => setForm({ ...form, exemptions: v })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('pgTax.corporate.ratePct')}>
              <Input
                type="number"
                dir="ltr"
                step={0.01}
                value={form.rate * 100}
                onChange={(e) => setForm({ ...form, rate: Math.max(0, Number(e.target.value)) / 100 })}
              />
            </Field>
            <Field label={t('pgTax.corporate.paid')}>
              <MoneyInput value={form.paid} onChange={(v) => setForm({ ...form, paid: v })} />
            </Field>
          </div>
          <Field label={t('pgTax.corporate.notes')}>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <div className="flex items-center justify-between rounded-xl bg-brand-50 p-4">
            <span className="flex items-center gap-2 text-sm font-bold text-brand-800">
              <Calculator size={16} /> {t('pgTax.corporate.taxDue')}
            </span>
            <span className="text-2xl font-black text-brand-700">{money(calc.tax)}</span>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={confirmId !== null} onClose={() => setConfirmId(null)} onConfirm={() => { if (confirmId) { remove('corporateReturns', confirmId); setConfirmId(null); push('success', t('pgTax.corporate.deleted')) } }} title={t('pgTax.corporate.deleteTitle')} message={t('pgTax.corporate.deleteMessage')} />
    </div>
  )
}

