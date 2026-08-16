import { useMemo, useState } from 'react'
import { Home, Plus, Pencil, Trash2, FileSpreadsheet, FileText, Calculator, CheckCircle2 } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { PageHead, Card, CardHeader, CardBody, Button, Badge, IconBtn, Modal, Field, Input, Select, MoneyInput, Textarea, Toggle, DataTable, useToast, ConfirmDialog, type Column } from '../components/ui'
import { useI18n } from '../i18n'
import type { PropertyRecord } from '../lib/types'
import { fmt, money, nowYear, uid } from '../lib/format'
import { calcPropertyForm } from '../lib/tax'
import { exportExcel, exportPdf } from '../lib/export'
import PropertyWizard from '../components/PropertyWizard'

interface FormState {
  year: number
  name: string
  location: string
  nature: string
  familyHome: boolean
  isNew: boolean
  buildDate: string
  isEmpty: boolean
  emptyMonths: number
  annualRent: number
  paid: number
  penaltyMonths: number
  penaltyDelay: boolean
  penaltyFalseInfo: boolean
  penaltyFakeEmpty: boolean
  penaltyUseChange: boolean
  notes: string
}

function ResultRow({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-600">{label}</span>
        <strong className="text-sm font-bold text-ink-800">{value}</strong>
      </div>
      {note && <p className="mt-0.5 pr-4 text-[11px] leading-snug text-ink-400">{note}</p>}
    </div>
  )
}

export default function PropertyTax() {
  const { data, currentCompany, add, update, remove } = useApp()
  const { t } = useI18n()
  const { push } = useToast()
  const year = nowYear()
  const cid = data.activeCompanyId
  const cfg = data.config

  const [selYear, setSelYear] = useState(year)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PropertyRecord | null>(null)
  const [form, setForm] = useState<FormState>({ year, name: '', location: '', nature: 'none', familyHome: false, isNew: false, buildDate: '', isEmpty: false, emptyMonths: 0, annualRent: 0, paid: 0, penaltyMonths: 0, penaltyDelay: false, penaltyFalseInfo: false, penaltyFakeEmpty: false, penaltyUseChange: false, notes: '' })
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const list = useMemo(
    () => data.properties.filter((r) => r.companyId === cid && r.year === selYear).sort((a, b) => a.name.localeCompare(b.name)),
    [data.properties, cid, selYear],
  )

  const totalTax = list.reduce((s, r) => s + r.tax, 0)
  const totalPenalty = list.reduce((s, r) => s + r.penalty, 0)
  const totalDue = list.reduce((s, r) => s + r.totalDue, 0)
  const totalPaid = list.reduce((s, r) => s + r.paid, 0)

  const hdr = [
    t('pgTax.property.colProperty'),
    t('pgTax.common.location'),
    t('pgTax.property.colAnnualRent'),
    t('pgTax.property.colTaxable'),
    t('pgTax.property.colTax'),
    t('pgTax.property.colPenalty'),
    t('pgTax.property.colTotalDue'),
    t('pgTax.property.colPaid'),
  ]

  const penLabels: Record<string, string> = {
    'غرامة تأخير': t('pgTax.property.penDelayLabel'),
    'إخفاء معلومات': t('pgTax.property.penFalseInfoLabel'),
    'خلو وهمي': t('pgTax.property.penFakeEmptyLabel'),
    'تغيير استعمال العقار بدون إخبار': t('pgTax.property.penUseChangeLabel'),
    'غرامة تأخير شهرية': t('pgTax.property.penMonthlyLabel'),
  }

  const penLaws: Record<string, string> = {
    'غرامة تأخير': t('pgTax.property.penDelayLaw'),
    'إخفاء معلومات': t('pgTax.property.penFalseInfoLaw'),
    'خلو وهمي': t('pgTax.property.penFakeEmptyLaw'),
    'تغيير استعمال العقار بدون إخبار': t('pgTax.property.penUseChangeLaw'),
    'غرامة تأخير شهرية': t('pgTax.property.penMonthlyLaw', { months: form.penaltyMonths }),
  }

  const result = useMemo(
    () =>
      calcPropertyForm({
        annualRent: form.annualRent,
        nature: form.nature,
        familyHome: form.familyHome,
        isNew: form.isNew,
        buildDate: form.buildDate,
        isEmpty: form.isEmpty,
        emptyMonths: form.emptyMonths,
        rate: cfg.propertyRate,
        penaltyDelay: form.penaltyDelay,
        penaltyFalseInfo: form.penaltyFalseInfo,
        penaltyFakeEmpty: form.penaltyFakeEmpty,
        penaltyUseChange: form.penaltyUseChange,
        penaltyMonths: form.penaltyMonths,
        monthlyPenaltyRate: cfg.propertyPenaltyRate,
      }),
    [form, cfg.propertyRate, cfg.propertyPenaltyRate],
  )

  const needsRent = form.nature === 'none' && !form.familyHome
  const balance = result.finalTax - form.paid

  const openNew = () => {
    setEditing(null)
    setForm({ year: selYear, name: '', location: '', nature: 'none', familyHome: false, isNew: false, buildDate: '', isEmpty: false, emptyMonths: 0, annualRent: 0, paid: 0, penaltyMonths: 0, penaltyDelay: false, penaltyFalseInfo: false, penaltyFakeEmpty: false, penaltyUseChange: false, notes: '' })
    setModalOpen(true)
  }

  const openEdit = (r: PropertyRecord) => {
    setEditing(r)
    setForm({
      year: r.year,
      name: r.name,
      location: r.location,
      nature: r.nature ?? 'none',
      familyHome: r.familyHome ?? false,
      isNew: r.isNew ?? false,
      buildDate: r.buildDate ?? '',
      isEmpty: r.isEmpty ?? false,
      emptyMonths: r.emptyMonths ?? 0,
      annualRent: r.annualRent,
      paid: r.paid,
      penaltyMonths: r.penaltyMonths ?? 0,
      penaltyDelay: r.penaltyDelay ?? false,
      penaltyFalseInfo: r.penaltyFalseInfo ?? false,
      penaltyFakeEmpty: r.penaltyFakeEmpty ?? false,
      penaltyUseChange: r.penaltyUseChange ?? false,
      notes: r.notes,
    })
    setModalOpen(true)
  }

  const save = () => {
    if (!form.name.trim()) {
      push('error', t('pgTax.property.nameRequired'))
      return
    }
    if (!result.exempt && result.rent <= 0) {
      push('error', t('pgTax.property.rentRequired'))
      return
    }
    const payload = {
      year: form.year,
      name: form.name,
      location: form.location,
      annualRent: form.annualRent,
      exemptAmount: 0,
      rate: cfg.propertyRate,
      taxable: result.taxable,
      tax: result.baseTax,
      paid: form.paid,
      penaltyMonths: form.penaltyMonths,
      penalty: result.penalty,
      totalDue: result.finalTax,
      notes: form.notes,
      nature: form.nature,
      familyHome: form.familyHome,
      isNew: form.isNew,
      buildDate: form.buildDate,
      isEmpty: form.isEmpty,
      emptyMonths: form.emptyMonths,
      maintenance: result.maintenance,
      exempt: result.exempt,
      exemptReason: result.exemptReason,
      penaltyDelay: form.penaltyDelay,
      penaltyFalseInfo: form.penaltyFalseInfo,
      penaltyFakeEmpty: form.penaltyFakeEmpty,
      penaltyUseChange: form.penaltyUseChange,
    }
    if (editing) {
      update('properties', editing.id, payload)
      push('success', t('pgTax.property.updated'))
    } else {
      add('properties', { id: uid(), companyId: cid, ...payload })
      push('success', t('pgTax.property.added'))
    }
    setModalOpen(false)
  }

  const columns: Column<PropertyRecord>[] = [
    {
      key: 'name',
      title: t('pgTax.property.colProperty'),
      render: (r) => (
        <div>
          <div className="font-semibold text-ink-800">{r.name}</div>
          <div className="text-xs text-ink-400">{r.location}</div>
        </div>
      ),
    },
    { key: 'annualRent', title: t('pgTax.property.colAnnualRent'), total: (rs) => rs.reduce((s, r) => s + r.annualRent, 0), render: (r) => (r.exempt ? <Badge tone="green">{t('pgTax.property.exempt')}</Badge> : <span className="text-xs">{money(r.annualRent)}</span>) },
    { key: 'taxable', title: t('pgTax.property.colTaxable'), total: (rs) => rs.reduce((s, r) => s + r.taxable, 0), render: (r) => <span className="text-xs">{money(r.taxable)}</span> },
    { key: 'tax', title: t('pgTax.property.colTax'), total: (rs) => rs.reduce((s, r) => s + r.tax, 0), render: (r) => <span className="text-xs font-bold text-brand-700">{money(r.tax)}</span> },
    { key: 'penalty', title: t('pgTax.property.colPenalty'), total: (rs) => rs.reduce((s, r) => s + r.penalty, 0), render: (r) => (r.penalty > 0 ? <Badge tone="amber">{money(r.penalty)}</Badge> : <span className="text-xs text-ink-400">—</span>) },
    { key: 'totalDue', title: t('pgTax.property.colTotalDue'), total: (rs) => rs.reduce((s, r) => s + r.totalDue, 0), render: (r) => <span className="text-xs font-semibold">{money(r.totalDue)}</span> },
    { key: 'paid', title: t('pgTax.property.colPaid'), total: (rs) => rs.reduce((s, r) => s + r.paid, 0), render: (r) => <span className="text-xs">{money(r.paid)}</span> },
    {
      key: 'balance',
      title: t('pgTax.property.colBalance'),
      render: (r) => {
        const b = r.totalDue - r.paid
        return b <= 0 ? <Badge tone="green">{t('pgTax.property.settled')}</Badge> : <Badge tone="red">{money(b)}</Badge>
      },
    },
    {
      key: 'actions',
      title: '',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <IconBtn title={t('pgTax.property.edit')} onClick={() => openEdit(r)}>
            <Pencil size={16} />
          </IconBtn>
          <IconBtn title={t('pgTax.property.delete')} tone="danger" onClick={() => setConfirmId(r.id)}>
            <Trash2 size={16} />
          </IconBtn>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHead
        title={t('pgTax.property.title')}
        desc={t('pgTax.property.desc', { law: t('pgTax.property.law') })}
        actions={
          <>
            <Select className="max-w-[140px]" value={selYear} onChange={(e) => setSelYear(Number(e.target.value))}>
              {[year - 1, year, year + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
            <Button onClick={openNew}>
              <Plus size={16} /> {t('pgTax.property.addProperty')}
            </Button>
          </>
        }
      />

      <PropertyWizard
        defaultYear={selYear}
        onSave={(payload) => {
          add('properties', { id: uid(), companyId: cid, ...payload })
        }}
      />
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Card className="p-4"><div className="text-xs text-ink-500">{t('pgTax.property.statProperties')}</div><div className="mt-1 text-xl font-bold text-ink-800">{fmt(list.length)}</div></Card>
        <Card className="p-4"><div className="text-xs text-ink-500">{t('pgTax.property.statRevenue')}</div><div className="mt-1 text-xl font-bold text-ink-800">{money(list.reduce((s, r) => s + r.annualRent, 0))}</div></Card>
        <Card className="p-4"><div className="text-xs text-ink-500">{t('pgTax.property.statTax')}</div><div className="mt-1 text-xl font-bold text-brand-700">{money(totalTax)}</div></Card>
        <Card className="p-4"><div className="text-xs text-ink-500">{t('pgTax.property.statPenalties')}</div><div className="mt-1 text-xl font-bold text-amber-600">{money(totalPenalty)}</div></Card>
        <Card className="p-4"><div className="text-xs text-ink-500">{t('pgTax.property.statBalance')}</div><div className="mt-1 text-xl font-bold text-red-600">{money(totalDue - totalPaid)}</div></Card>
      </div>

      <Card>
        <CardHeader
          title={t('pgTax.property.tableTitle', { year: selYear })}
          subtitle={t('pgTax.property.tableSubtitle')}
          action={
            <>
              <Button variant="secondary" size="sm" onClick={() => {
                const body = list.map((r) => [r.name, r.location, r.annualRent, r.taxable, r.tax, r.penalty, r.totalDue, r.paid])
                body.push([t('pgTax.common.total'), '', list.reduce((s, r) => s + r.annualRent, 0), list.reduce((s, r) => s + r.taxable, 0), totalTax, totalPenalty, totalDue, totalPaid])
                exportExcel(`${t('pgTax.property.title').replace(/ /g, '-')}-${selYear}.xlsx`, t('pgTax.property.excelSheet'), hdr, body)
                push('success', t('pgTax.property.exportExcelMsg'))
              }}>
                <FileSpreadsheet size={15} /> {t('pgTax.common.excel')}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => {
                const body = list.map((r) => [r.name, r.location, fmt(r.annualRent), fmt(r.taxable), fmt(r.tax), fmt(r.penalty), fmt(r.totalDue), fmt(r.paid)])
                body.push([t('pgTax.common.total'), '', fmt(list.reduce((s, r) => s + r.annualRent, 0)), fmt(list.reduce((s, r) => s + r.taxable, 0)), fmt(totalTax), fmt(totalPenalty), fmt(totalDue), fmt(totalPaid)])
                exportPdf({ title: t('pgTax.property.pdfTitle'), subtitle: t('pgTax.property.pdfSubtitle', { year: selYear }), company: currentCompany, headers: hdr, rows: body })
              }}>
                <FileText size={15} /> {t('pgTax.common.pdf')}
              </Button>
            </>
          }
        />
        <CardBody className="p-0">
          <DataTable columns={columns} rows={list} dense empty={t('pgTax.property.tableEmpty')} />
        </CardBody>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t('pgTax.property.editTitle') : t('pgTax.property.addTitle')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>{t('pgTax.common.cancel')}</Button>
            <Button onClick={save}>{editing ? t('pgTax.common.saveChanges') : t('pgTax.common.add')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('pgTax.property.fieldName')} required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t('pgTax.property.namePlaceholder')} />
            </Field>
            <Field label={t('pgTax.property.fieldLocation')}>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </Field>
          </div>

          <div className="rounded-xl border border-ink-200 bg-ink-50/50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-ink-800">
              <Home size={15} className="text-brand-600" /> {t('pgTax.property.sectionTitle')}
            </div>
            <Field label={t('pgTax.property.fieldNature')}>
              <Select value={form.nature} onChange={(e) => setForm({ ...form, nature: e.target.value })}>
                <option value="none">{t('pgTax.property.natureTaxable')}</option>
                <option value="state">{t('pgTax.property.natureState')}</option>
                <option value="religious">{t('pgTax.property.natureReligious')}</option>
                <option value="diplomatic">{t('pgTax.property.natureDiplomatic')}</option>
              </Select>
            </Field>
            {form.nature === 'none' && (
              <div className="mt-3">
                <Field label={t('pgTax.property.familyHomeField')}>
                  <Select value={form.familyHome ? 'family' : 'no'} onChange={(e) => setForm({ ...form, familyHome: e.target.value === 'family' })}>
                    <option value="no">{t('pgTax.property.familyNo')}</option>
                    <option value="family">{t('pgTax.property.familyYes')}</option>
                  </Select>
                </Field>
              </div>
            )}
            {needsRent && (
              <div className="mt-3">
                <div className="grid grid-cols-2 gap-4">
                  <Field label={t('pgTax.property.isNewField')}>
                    <Select value={form.isNew ? 'yes' : 'no'} onChange={(e) => setForm({ ...form, isNew: e.target.value === 'yes' })}>
                      <option value="no">{t('pgTax.property.no')}</option>
                      <option value="yes">{t('pgTax.property.yes')}</option>
                    </Select>
                  </Field>
                  <Field label={t('pgTax.property.isEmptyField')}>
                    <Select value={form.isEmpty ? 'yes' : 'no'} onChange={(e) => setForm({ ...form, isEmpty: e.target.value === 'yes' })}>
                      <option value="no">{t('pgTax.property.no')}</option>
                      <option value="yes">{t('pgTax.property.yes')}</option>
                    </Select>
                  </Field>
                </div>
                {form.isNew && (
                  <div className="mt-3">
                    <Field label={t('pgTax.property.buildDateField')}>
                      <Input type="date" dir="ltr" value={form.buildDate} onChange={(e) => setForm({ ...form, buildDate: e.target.value })} />
                    </Field>
                  </div>
                )}
                {form.isEmpty && (
                  <div className="mt-3">
                    <Field label={t('pgTax.property.emptyMonthsField')}>
                      <Input type="number" min={0} value={form.emptyMonths || ''} onChange={(e) => setForm({ ...form, emptyMonths: Math.max(0, Number(e.target.value)) })} />
                    </Field>
                  </div>
                )}
              </div>
            )}
          </div>

          {needsRent && (
            <Field label={t('pgTax.property.annualRentField')}>
              <MoneyInput value={form.annualRent} onChange={(v) => setForm({ ...form, annualRent: v })} />
            </Field>
          )}

          {needsRent && result.rent > 0 && (
            <div className="rounded-xl border border-ink-200 bg-ink-50/50 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-brand-800">
                <Calculator size={15} /> {t('pgTax.property.calcDetails')}
              </div>
              <div className="space-y-2">
                <ResultRow label={t('pgTax.property.rowRent')} value={money(result.rent)} note={t('pgTax.property.rowRentNote')} />
                <ResultRow label={t('pgTax.property.rowMaintenance')} value={money(result.maintenance)} note={t('pgTax.property.rowMaintenanceNote')} />
                {result.emptyDeduction > 0 && (
                  <ResultRow label={t('pgTax.property.rowEmptyDeduction', { months: form.emptyMonths })} value={money(result.emptyDeduction)} note={t('pgTax.property.rowEmptyDeductionNote')} />
                )}
                <ResultRow label={t('pgTax.property.rowTaxable')} value={money(result.taxable)} />
                <ResultRow label={t('pgTax.property.rowBaseTax')} value={money(result.baseTax)} note={t('pgTax.property.rowBaseTaxNote')} />
                {result.penalties.map((p) => (
                  <ResultRow key={p.label} label={penLabels[p.label] ?? p.label} value={money(p.amount)} note={penLaws[p.label] ?? p.law} />
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-gradient-to-l from-brand-700 to-brand-500 px-4 py-3 text-white">
                <span className="text-sm font-bold">{t('pgTax.property.finalTaxLabel')}</span>
                <span className="text-xl font-black">{money(result.finalTax)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-ink-500">{t('pgTax.property.paidNow')}</span>
                <span className={balance > 0 ? 'font-bold text-red-600' : 'font-bold text-emerald-600'}>
                  {balance > 0 ? t('pgTax.property.remaining', { amount: money(balance) }) : t('pgTax.property.fullyPaid')}
                </span>
              </div>
            </div>
          )}

          {result.exempt && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
              <p className="text-sm font-bold leading-relaxed text-emerald-800">{t('pgTax.property.reason_' + result.exemptKey, { law: t('pgTax.property.law') })}</p>
            </div>
          )}

          {needsRent && result.rent > 0 && !result.exempt && (
            <div className="rounded-xl border border-ink-200 p-4">
              <div className="mb-3 text-sm font-bold text-ink-800">{t('pgTax.property.penaltyTitle')}</div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Toggle checked={form.penaltyDelay} onChange={(v) => setForm({ ...form, penaltyDelay: v })} label={t('pgTax.property.penaltyDelay')} />
                <Toggle checked={form.penaltyFalseInfo} onChange={(v) => setForm({ ...form, penaltyFalseInfo: v })} label={t('pgTax.property.penaltyFalseInfo')} />
                <Toggle checked={form.penaltyFakeEmpty} onChange={(v) => setForm({ ...form, penaltyFakeEmpty: v })} label={t('pgTax.property.penaltyFakeEmpty')} />
                <Toggle checked={form.penaltyUseChange} onChange={(v) => setForm({ ...form, penaltyUseChange: v })} label={t('pgTax.property.penaltyUseChange')} />
              </div>
              <div className="mt-3">
                <Field label={t('pgTax.property.penaltyMonthly')}>
                  <Input type="number" min={0} value={form.penaltyMonths || ''} onChange={(e) => setForm({ ...form, penaltyMonths: Math.max(0, Number(e.target.value)) })} />
                </Field>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label={t('pgTax.property.fieldPaid')}>
              <MoneyInput value={form.paid} onChange={(v) => setForm({ ...form, paid: v })} />
            </Field>
            <Field label={t('pgTax.property.fieldNotes')}>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={confirmId !== null} onClose={() => setConfirmId(null)} onConfirm={() => { if (confirmId) { remove('properties', confirmId); setConfirmId(null); push('success', t('pgTax.property.deleted')) } }} title={t('pgTax.property.deleteTitle')} message={t('pgTax.property.deleteMessage')} />
    </div>
  )
}
