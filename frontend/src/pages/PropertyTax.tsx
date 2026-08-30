import { useMemo, useState } from 'react'
import { Home, Plus, Pencil, Trash2, FileSpreadsheet, FileText, Calculator, CheckCircle2 } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { PageHead, Card, CardHeader, CardBody, Button, Badge, IconBtn, Modal, Field, Input, Select, MoneyInput, Textarea, Toggle, DataTable, useToast, ConfirmDialog, Tabs, type Column } from '../components/ui'
import { useI18n } from '../i18n'
import type { PropertyRecord } from '../lib/types'
import { fmt, money, nowYear, uid } from '../lib/format'
import { exportExcel, exportPdf } from '../lib/export'

interface SaleForm {
  name: string
  area: number
  pricePerMeter: number
  notes: string
}

interface IncomeForm {
  name: string
  location: string
  annualRent: number
  exemptState: boolean
  exemptReligious: boolean
  exemptFamily: boolean
  paid: number
  notes: string
}

const emptySale: SaleForm = { name: '', area: 0, pricePerMeter: 0, notes: '' }
const emptyIncome: IncomeForm = { name: '', location: '', annualRent: 0, exemptState: false, exemptReligious: false, exemptFamily: false, paid: 0, notes: '' }

export default function PropertyTax() {
  const { data, currentCompany, add, update, remove } = useApp()
  const { t } = useI18n()
  const { push } = useToast()
  const year = nowYear()
  const cid = data.activeCompanyId
  const cfg = data.config

  const [tab, setTab] = useState<'sale' | 'income'>('sale')
  const [saleForm, setSaleForm] = useState<SaleForm>(emptySale)
  const [incomeForm, setIncomeForm] = useState<IncomeForm>(emptyIncome)
  const [incomeResultOpen, setIncomeResultOpen] = useState(false)
  const [editing, setEditing] = useState<PropertyRecord | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [editingTab, setEditingTab] = useState<'sale' | 'income'>('sale')

  const saleList = useMemo(
    () => data.properties.filter((r) => r.companyId === cid && r.year === year && r.nature === 'sale'),
    [data.properties, cid, year],
  )

  const incomeList = useMemo(
    () => data.properties.filter((r) => r.companyId === cid && r.year === year && r.nature !== 'sale'),
    [data.properties, cid, year],
  )

  const saleResult = useMemo(() => {
    const value = saleForm.area * saleForm.pricePerMeter
    const tax = value * cfg.propertyRate
    return { value, tax }
  }, [saleForm.area, saleForm.pricePerMeter, cfg.propertyRate])

  const incomeExempt = incomeForm.exemptState || incomeForm.exemptReligious || incomeForm.exemptFamily
  const incomeTax = incomeExempt ? 0 : incomeForm.annualRent * cfg.propertyRate
  const incomeBalance = incomeTax - incomeForm.paid

  const saveSale = () => {
    if (!saleForm.name.trim()) { push('error', 'يرجى إدخال اسم العقار'); return }
    if (saleForm.area <= 0 || saleForm.pricePerMeter <= 0) { push('error', 'يرجى إدخال المساحة والسعر'); return }
    const payload = {
      year, name: saleForm.name, location: '', nature: 'sale' as const,
      annualRent: 0, exemptAmount: 0, rate: cfg.propertyRate,
      taxable: saleResult.value, tax: saleResult.tax, paid: 0,
      penaltyMonths: 0, penalty: 0, totalDue: saleResult.tax,
      notes: saleForm.notes, familyHome: false, isNew: false, buildDate: '',
      isEmpty: false, emptyMonths: 0, maintenance: 0, exempt: false,
      exemptReason: '', penaltyDelay: false, penaltyFalseInfo: false,
      penaltyFakeEmpty: false, penaltyUseChange: false,
    }
    if (editing && editingTab === 'sale') {
      update('properties', editing.id, payload)
      push('success', 'تم تعديل العقار بنجاح')
    } else {
      add('properties', { id: uid(), companyId: cid, ...payload })
      push('success', 'تم إضافة العقار بنجاح')
    }
    setSaleForm(emptySale)
    setEditing(null)
  }

  const saveIncome = () => {
    if (!incomeForm.name.trim()) { push('error', 'يرجى إدخال اسم العقار'); return }
    if (incomeForm.annualRent <= 0 && !incomeExempt) { push('error', 'يرجى إدخال مبلغ الإيجار'); return }
    const exemptReason = incomeForm.exemptState ? 'state' : incomeForm.exemptReligious ? 'religious' : incomeForm.exemptFamily ? 'family' : ''
    const payload = {
      year, name: incomeForm.name, location: incomeForm.location,
      nature: incomeForm.exemptState ? 'state' : incomeForm.exemptReligious ? 'religious' : 'none',
      annualRent: incomeForm.annualRent, exemptAmount: 0, rate: cfg.propertyRate,
      taxable: incomeExempt ? 0 : incomeForm.annualRent, tax: incomeTax,
      paid: incomeForm.paid, penaltyMonths: 0, penalty: 0, totalDue: incomeTax,
      notes: incomeForm.notes, familyHome: incomeForm.exemptFamily, isNew: false,
      buildDate: '', isEmpty: false, emptyMonths: 0, maintenance: 0,
      exempt: incomeExempt, exemptReason, penaltyDelay: false, penaltyFalseInfo: false,
      penaltyFakeEmpty: false, penaltyUseChange: false,
    }
    if (editing && editingTab === 'income') {
      update('properties', editing.id, payload)
      push('success', 'تم تعديل العقار بنجاح')
    } else {
      add('properties', { id: uid(), companyId: cid, ...payload })
      push('success', 'تم إضافة العقار بنجاح')
    }
    setIncomeForm(emptyIncome)
    setEditing(null)
  }

  const openEditSale = (r: PropertyRecord) => {
    setEditing(r)
    setEditingTab('sale')
    setSaleForm({ name: r.name, area: 0, pricePerMeter: r.taxable > 0 && r.tax > 0 ? r.tax / r.taxable * 100 / cfg.propertyRate : 0, notes: r.notes })
    setModalOpen(true)
  }

  const openEditIncome = (r: PropertyRecord) => {
    setEditing(r)
    setEditingTab('income')
    setIncomeForm({
      name: r.name, location: r.location, annualRent: r.annualRent,
      exemptState: r.nature === 'state', exemptReligious: r.nature === 'religious',
      exemptFamily: r.familyHome ?? false, paid: r.paid, notes: r.notes,
    })
    setModalOpen(true)
  }

  const saleColumns: Column<PropertyRecord>[] = [
    { key: 'name', title: 'العقار', render: (r) => <div><div className="font-semibold text-ink-800">{r.name}</div><div className="text-xs text-ink-400">{r.location}</div></div> },
    { key: 'taxable', title: 'قيمة العقار', total: (rs) => rs.reduce((s, r) => s + r.taxable, 0), render: (r) => <span className="text-xs">{money(r.taxable)}</span> },
    { key: 'tax', title: 'الضريبة', total: (rs) => rs.reduce((s, r) => s + r.tax, 0), render: (r) => <span className="text-xs font-bold text-brand-700">{money(r.tax)}</span> },
    { key: 'paid', title: 'المسدد', total: (rs) => rs.reduce((s, r) => s + r.paid, 0), render: (r) => <span className="text-xs">{money(r.paid)}</span> },
    { key: 'balance', title: 'الرصيد', render: (r) => { const b = r.totalDue - r.paid; return b <= 0 ? <Badge tone="green">مسدد</Badge> : <Badge tone="red">{money(b)}</Badge> } },
    { key: 'actions', title: '', render: (r) => (
      <div className="flex items-center justify-end gap-1">
        <IconBtn title="تعديل" onClick={() => openEditSale(r)}><Pencil size={16} /></IconBtn>
        <IconBtn title="حذف" tone="danger" onClick={() => setConfirmId(r.id)}><Trash2 size={16} /></IconBtn>
      </div>
    )},
  ]

  const incomeColumns: Column<PropertyRecord>[] = [
    { key: 'name', title: 'العقار', render: (r) => <div><div className="font-semibold text-ink-800">{r.name}</div><div className="text-xs text-ink-400">{r.location}</div></div> },
    { key: 'annualRent', title: 'الإيجار السنوي', total: (rs) => rs.reduce((s, r) => s + r.annualRent, 0), render: (r) => r.exempt ? <Badge tone="green">معفي</Badge> : <span className="text-xs">{money(r.annualRent)}</span> },
    { key: 'tax', title: 'الضريبة', total: (rs) => rs.reduce((s, r) => s + r.tax, 0), render: (r) => <span className="text-xs font-bold text-brand-700">{money(r.tax)}</span> },
    { key: 'paid', title: 'المسدد', total: (rs) => rs.reduce((s, r) => s + r.paid, 0), render: (r) => <span className="text-xs">{money(r.paid)}</span> },
    { key: 'balance', title: 'الرصيد', render: (r) => { const b = r.totalDue - r.paid; return b <= 0 ? <Badge tone="green">مسدد</Badge> : <Badge tone="red">{money(b)}</Badge> } },
    { key: 'actions', title: '', render: (r) => (
      <div className="flex items-center justify-end gap-1">
        <IconBtn title="تعديل" onClick={() => openEditIncome(r)}><Pencil size={16} /></IconBtn>
        <IconBtn title="حذف" tone="danger" onClick={() => setConfirmId(r.id)}><Trash2 size={16} /></IconBtn>
      </div>
    )},
  ]

  return (
    <div>
      <PageHead
        title={t('pgTax.property.title')}
        desc={t('pgTax.property.desc', { law: t('pgTax.property.law') })}
      />

      <div className="mb-5">
        <Tabs
          items={[
            { id: 'sale', label: 'بيع العقار' },
            { id: 'income', label: 'إيراد العقار (إيجار)' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'sale' && (
        <Card className="mb-4">
          <CardHeader title="حاسبة ضريبة بيع العقار" subtitle="أدخل مساحة العقار وسعر المتر لحساب الضريبة" />
          <CardBody>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="اسم العقار" required>
                  <Input value={saleForm.name} onChange={(e) => setSaleForm({ ...saleForm, name: e.target.value })} placeholder="اسم العقار" />
                </Field>
                <Field label="مساحة العقار (م²)">
                  <Input type="number" dir="ltr" min={0} value={saleForm.area || ''} onChange={(e) => setSaleForm({ ...saleForm, area: Math.max(0, Number(e.target.value)) })} />
                </Field>
                <Field label="سعر المتر (دينار)">
                  <MoneyInput value={saleForm.pricePerMeter} onChange={(v) => setSaleForm({ ...saleForm, pricePerMeter: v })} />
                </Field>
              </div>
              {saleForm.area > 0 && saleForm.pricePerMeter > 0 && (
                <div className="rounded-xl border border-brand-200 bg-gradient-to-b from-brand-50 to-white p-5">
                  <div className="mb-3 text-sm font-bold text-brand-700">نتيجة الحساب</div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-ink-200 bg-white p-3">
                      <div className="text-xs text-ink-500">قيمة العقار</div>
                      <div className="mt-1 text-lg font-bold">{money(saleResult.value)}</div>
                    </div>
                    <div className="rounded-lg border border-ink-200 bg-white p-3">
                      <div className="text-xs text-ink-500">نسبة الضريبة</div>
                      <div className="mt-1 text-lg font-bold">{fmt(cfg.propertyRate * 100)}%</div>
                    </div>
                    <div className="rounded-lg border border-brand-600 bg-brand-600 p-3 text-white">
                      <div className="text-xs text-emerald-100">الضريبة المستحقة</div>
                      <div className="mt-1 text-xl font-black">{money(saleResult.tax)}</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Field label="ملاحظات">
                      <Textarea value={saleForm.notes} onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })} />
                    </Field>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button onClick={saveSale}><Plus size={16} /> حفظ السجل</Button>
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {tab === 'income' && (
        <Card className="mb-4">
          <CardHeader title="حاسبة ضريبة إيراد العقار" subtitle="أدخل مبلغ الإيجار السنوي لحساب الضريبة" />
          <CardBody>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="اسم العقار" required>
                  <Input value={incomeForm.name} onChange={(e) => setIncomeForm({ ...incomeForm, name: e.target.value })} placeholder="اسم العقار" />
                </Field>
                <Field label="الموقع">
                  <Input value={incomeForm.location} onChange={(e) => setIncomeForm({ ...incomeForm, location: e.target.value })} />
                </Field>
                <Field label="الإيجار السنوي (دينار)">
                  <MoneyInput value={incomeForm.annualRent} onChange={(v) => setIncomeForm({ ...incomeForm, annualRent: v })} />
                </Field>
              </div>
              <div className="rounded-xl border border-ink-200 bg-ink-50/50 p-4">
                <div className="mb-2 text-sm font-bold text-ink-800">الإعفاءات</div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={incomeForm.exemptState} onChange={(e) => setIncomeForm({ ...incomeForm, exemptState: e.target.checked, exemptReligious: false, exemptFamily: false })} className="h-4 w-4 rounded border-ink-300 text-brand-600" />
                    معفي — ملكية حكومية
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={incomeForm.exemptReligious} onChange={(e) => setIncomeForm({ ...incomeForm, exemptReligious: e.target.checked, exemptState: false, exemptFamily: false })} className="h-4 w-4 rounded border-ink-300 text-brand-600" />
                    معفي — أماكن دينية
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={incomeForm.exemptFamily} onChange={(e) => setIncomeForm({ ...incomeForm, exemptFamily: e.target.checked, exemptState: false, exemptReligious: false })} className="h-4 w-4 rounded border-ink-300 text-brand-600" />
                    معفي — سكن عائلي
                  </label>
                </div>
              </div>
              {incomeForm.annualRent > 0 && (
                <div className="flex justify-center">
                  <Button onClick={() => setIncomeResultOpen(true)}>
                    <Calculator size={16} /> احتساب الضريبة
                  </Button>
                </div>
              )}
              {incomeExempt && (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                  <p className="text-sm font-bold text-emerald-800">العقار معفي من الضريبة وفقاً للقانون</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4"><div className="text-xs text-ink-500">{tab === 'sale' ? 'عقارات البيع' : 'عقارات الإيجار'}</div><div className="mt-1 text-xl font-bold text-ink-800">{fmt(tab === 'sale' ? saleList.length : incomeList.length)}</div></Card>
        <Card className="p-4"><div className="text-xs text-ink-500">إجمالي القيمة</div><div className="mt-1 text-xl font-bold text-ink-800">{money((tab === 'sale' ? saleList : incomeList).reduce((s, r) => s + (tab === 'sale' ? r.taxable : r.annualRent), 0))}</div></Card>
        <Card className="p-4 bg-brand-600 text-white"><div className="text-xs text-emerald-100">الضريبة</div><div className="mt-1 text-xl font-bold">{money((tab === 'sale' ? saleList : incomeList).reduce((s, r) => s + r.tax, 0))}</div></Card>
        <Card className="p-4"><div className="text-xs text-ink-500">الرصيد</div><div className="mt-1 text-xl font-bold text-red-600">{money((tab === 'sale' ? saleList : incomeList).reduce((s, r) => s + Math.max(0, r.totalDue - r.paid), 0))}</div></Card>
      </div>

      <Card>
        <CardHeader
          title={tab === 'sale' ? 'سجل عقارات البيع' : 'سجل عقارات الإيجار'}
          action={
            <>
              <Button variant="secondary" size="sm" onClick={() => {
                const list = tab === 'sale' ? saleList : incomeList
                const hdrs = tab === 'sale' ? ['العقار', 'القيمة', 'الضريبة', 'المسدد'] : ['العقار', 'الإيجار', 'الضريبة', 'المسدد']
                const body = list.map((r) => tab === 'sale' ? [r.name, r.taxable, r.tax, r.paid] : [r.name, r.annualRent, r.tax, r.paid])
                exportExcel(`${t('pgTax.property.title').replace(/ /g, '-')}-${year}.xlsx`, tab === 'sale' ? 'عقارات البيع' : 'عقارات الإيجار', hdrs, body)
                push('success', 'تم التصدير بنجاح')
              }}>
                <FileSpreadsheet size={15} /> {t('pgTax.common.excel')}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => {
                const list = tab === 'sale' ? saleList : incomeList
                const hdrs = tab === 'sale' ? ['العقار', 'القيمة', 'الضريبة', 'المسدد'] : ['العقار', 'الإيجار', 'الضريبة', 'المسدد']
                const body = list.map((r) => tab === 'sale' ? [r.name, fmt(r.taxable), fmt(r.tax), fmt(r.paid)] : [r.name, fmt(r.annualRent), fmt(r.tax), fmt(r.paid)])
                exportPdf({ title: tab === 'sale' ? 'عقارات البيع' : 'عقارات الإيجار', subtitle: `السنة ${year}`, company: currentCompany, headers: hdrs, rows: body })
              }}>
                <FileText size={15} /> {t('pgTax.common.pdf')}
              </Button>
            </>
          }
        />
        <CardBody className="p-0">
          <DataTable columns={tab === 'sale' ? saleColumns : incomeColumns} rows={tab === 'sale' ? saleList : incomeList} dense empty="لا توجد سجلات" />
        </CardBody>
      </Card>

      {/* Income calculation result modal */}
      <Modal open={incomeResultOpen} onClose={() => setIncomeResultOpen(false)} title="نتيجة احتساب ضريبة إيراد العقار">
        <div className="space-y-4">
          <div className="rounded-xl border border-ink-200 bg-ink-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-600">مبلغ الإيجار السنوي</span>
              <strong className="text-sm font-bold text-ink-800">{money(incomeForm.annualRent)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-600">نسبة الضريبة</span>
              <strong className="text-sm font-bold text-ink-800">{fmt(cfg.propertyRate * 100)}%</strong>
            </div>
            {incomeExempt && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-600 font-bold">العقار معفي</span>
                <Badge tone="green">معفي</Badge>
              </div>
            )}
            <div className="border-t border-ink-200 pt-3 flex items-center justify-between">
              <span className="text-sm font-bold text-ink-800">الضريبة المستحقة</span>
              <strong className="text-xl font-black text-brand-700">{money(incomeTax)}</strong>
            </div>
          </div>
          <Field label="المسدد حالياً">
            <MoneyInput value={incomeForm.paid} onChange={(v) => setIncomeForm({ ...incomeForm, paid: v })} />
          </Field>
          {incomeTax > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-500">الرصيد المتبقي</span>
              <span className={incomeBalance > 0 ? 'font-bold text-red-600' : 'font-bold text-emerald-600'}>
                {incomeBalance > 0 ? `المتبقي: ${money(incomeBalance)}` : 'مسدد بالكامل'}
              </span>
            </div>
          )}
          <Field label="ملاحظات">
            <Textarea value={incomeForm.notes} onChange={(e) => setIncomeForm({ ...incomeForm, notes: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIncomeResultOpen(false)}>إغلاق</Button>
            <Button onClick={() => { saveIncome(); setIncomeResultOpen(false) }}><Plus size={16} /> حفظ السجل</Button>
          </div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        title="تعديل بيانات العقار"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModalOpen(false); setEditing(null) }}>إلغاء</Button>
            <Button onClick={editingTab === 'sale' ? saveSale : saveIncome}>حفظ التعديلات</Button>
          </>
        }
      >
        {editingTab === 'sale' ? (
          <div className="space-y-4">
            <Field label="اسم العقار" required>
              <Input value={saleForm.name} onChange={(e) => setSaleForm({ ...saleForm, name: e.target.value })} />
            </Field>
            <Field label="ملاحظات">
              <Textarea value={saleForm.notes} onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })} />
            </Field>
          </div>
        ) : (
          <div className="space-y-4">
            <Field label="اسم العقار" required>
              <Input value={incomeForm.name} onChange={(e) => setIncomeForm({ ...incomeForm, name: e.target.value })} />
            </Field>
            <Field label="الموقع">
              <Input value={incomeForm.location} onChange={(e) => setIncomeForm({ ...incomeForm, location: e.target.value })} />
            </Field>
            <Field label="الإيجار السنوي">
              <MoneyInput value={incomeForm.annualRent} onChange={(v) => setIncomeForm({ ...incomeForm, annualRent: v })} />
            </Field>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={incomeForm.exemptState} onChange={(e) => setIncomeForm({ ...incomeForm, exemptState: e.target.checked, exemptReligious: false, exemptFamily: false })} className="h-4 w-4 rounded border-ink-300 text-brand-600" />
                معفي — ملكية حكومية
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={incomeForm.exemptReligious} onChange={(e) => setIncomeForm({ ...incomeForm, exemptReligious: e.target.checked, exemptState: false, exemptFamily: false })} className="h-4 w-4 rounded border-ink-300 text-brand-600" />
                معفي — أماكن دينية
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={incomeForm.exemptFamily} onChange={(e) => setIncomeForm({ ...incomeForm, exemptFamily: e.target.checked, exemptState: false, exemptReligious: false })} className="h-4 w-4 rounded border-ink-300 text-brand-600" />
                معفي — سكن عائلي
              </label>
            </div>
            <Field label="المسدد">
              <MoneyInput value={incomeForm.paid} onChange={(v) => setIncomeForm({ ...incomeForm, paid: v })} />
            </Field>
            <Field label="ملاحظات">
              <Textarea value={incomeForm.notes} onChange={(e) => setIncomeForm({ ...incomeForm, notes: e.target.value })} />
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) { remove('properties', confirmId); setConfirmId(null); push('success', 'تم الحذف بنجاح') }
        }}
        title="تأكيد الحذف"
        message="هل أنت متأكد من حذف هذا السجل؟ لا يمكن التراجع عن هذا الإجراء."
      />
    </div>
  )
}
