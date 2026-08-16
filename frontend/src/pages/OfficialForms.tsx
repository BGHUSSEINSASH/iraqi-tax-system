import { useMemo, useState } from 'react'
import {
  FileText,
  FileSpreadsheet,
  Printer,
  FileCheck2,
  Users,
  Landmark,
  Eye,
  CalendarClock,
  Scale,
  ScrollText,
} from 'lucide-react'
import { useApp } from '../store/AppContext'
import { useI18n } from '../i18n'
import {
  PageHead,
  Card,
  CardHeader,
  CardBody,
  Button,
  Badge,
  Tabs,
  Select,
  useToast,
  Modal,
  DataTable,
  type Column,
} from '../components/ui'
import { fmt, money, monthName, nowYear, fmtDate, moneyShort } from '../lib/format'
import { exportExcel } from '../lib/export'
import {
  buildEmployeeDD14Html,
  buildAnnualStatementHtml,
  buildMonthlyDeclarationHtml,
  buildMonthlyRegisterHtml,
  buildAnnualStatementExcel,
  computeEmployeeAnnual,
  openFormPrintWindow,
  FORM_PRINT_CSS,
} from '../lib/officialForms'

const FORM_DOC_CSS = `@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');`

export default function OfficialForms() {
  const { data, currentCompany } = useApp()
  const { t, months: langMonths } = useI18n()
  const mn = (m: number) => langMonths[m - 1] ?? monthName(m)
  const { push } = useToast()
  const year = nowYear()
  const cid = data.activeCompanyId
  const [tab, setTab] = useState<'monthly' | 'dd14' | 'annual'>('monthly')
  const [selYear, setSelYear] = useState(year)
  const [selMonth, setSelMonth] = useState(new Date().getMonth() + 1)
  const [preview, setPreview] = useState<{ title: string; html: string } | null>(null)

  const employees = useMemo(
    () => data.employees.filter((e) => e.companyId === cid),
    [data.employees, cid],
  )

  const monthRows = useMemo(
    () =>
      data.monthlyRows.filter(
        (r) => r.companyId === cid && r.year === selYear && r.month === selMonth,
      ),
    [data.monthlyRows, cid, selYear, selMonth],
  )

  const months = useMemo(() => {
    const map = new Map<number, { count: number; tax: number; gross: number }>()
    data.monthlyRows
      .filter((r) => r.companyId === cid && r.year === selYear)
      .forEach((r) => {
        const g = map.get(r.month) ?? { count: 0, tax: 0, gross: 0 }
        g.count++
        g.tax += r.adjusted
        g.gross += r.gross
        map.set(r.month, g)
      })
    return Array.from(map.entries())
      .map(([m, g]) => ({ id: `m-${m}`, month: m, ...g }))
      .sort((a, b) => a.month - b.month)
  }, [data.monthlyRows, cid, selYear])

  const annualRows = useMemo(
    () => employees.map((e) => ({ id: e.id, emp: e, math: computeEmployeeAnnual(e, data.config, selYear, data) })),
    [employees, data.config, selYear, data],
  )

  const monthTotalTax = monthRows.reduce((s, r) => s + r.adjusted, 0)
  const monthTotalGross = monthRows.reduce((s, r) => s + r.gross, 0)
  const taxedCount = monthRows.filter((r) => r.adjusted > 0).length

  const openPreview = (title: string, html: string) => {
    setPreview({ title, html: `<style>${FORM_DOC_CSS}${FORM_PRINT_CSS}</style>${html}` })
  }

  const printDD14Employee = (empId: string) => {
    const emp = employees.find((e) => e.id === empId)
    if (!emp) return
    const html = buildEmployeeDD14Html(emp, currentCompany, data.config, selYear, data)
    openFormPrintWindow(t('pgDocs.forms.dd14ForEmployee', { name: emp.name }), html)
    push('success', t('pgDocs.forms.dd14OpenSuccess', { name: emp.name }))
  }

  const printAllDD14 = () => {
    if (employees.length === 0) {
      push('error', t('pgDocs.forms.noEmployees'))
      return
    }
    const html = employees
      .map((e) => buildEmployeeDD14Html(e, currentCompany, data.config, selYear, data))
      .join('')
    openFormPrintWindow(t('pgDocs.forms.dd14ListTitle', { year: selYear }), html)
    push('success', t('pgDocs.forms.dd14PrintSuccess', { count: employees.length }))
  }

  const printMonthly = (withDeclaration = true) => {
    if (monthRows.length === 0) {
      push('error', t('pgDocs.forms.noMonthData', { month: mn(selMonth), year: selYear }))
      return
    }
    const register = buildMonthlyRegisterHtml(currentCompany, selYear, selMonth, data)
    const declaration = buildMonthlyDeclarationHtml(currentCompany, selYear, selMonth, data)
    openFormPrintWindow(
      t('pgDocs.forms.registerTitle', { month: mn(selMonth), year: selYear }),
      register + (withDeclaration ? declaration : ''),
    )
    push('success', t('pgDocs.forms.registerOpenSuccess'))
  }

  const exportAnnualExcel = () => {
    const rows = buildAnnualStatementExcel(employees, currentCompany, selYear, data)
    const headers = Array(15).fill('')
    exportExcel(t('pgDocs.forms.annualFile', { year: selYear }), t('pgDocs.forms.annualSheet', { year: selYear }), headers, rows)
    push('success', t('pgDocs.forms.annualExcelSuccess', { year: selYear }))
  }

  const printAnnual = () => {
    if (employees.length === 0) {
      push('error', t('pgDocs.forms.noEmployees'))
      return
    }
    const html = buildAnnualStatementHtml(employees, currentCompany, selYear, data)
    openFormPrintWindow(t('pgDocs.forms.annualStatementTitle', { year: selYear }), html)
    push('success', t('pgDocs.forms.annualOpenSuccess', { year: selYear }))
  }

  const printAnnualWithForms = () => {
    if (employees.length === 0) {
      push('error', t('pgDocs.forms.noEmployees'))
      return
    }
    const html =
      buildAnnualStatementHtml(employees, currentCompany, selYear, data) +
      employees.map((e) => buildEmployeeDD14Html(e, currentCompany, data.config, selYear, data)).join('')
    openFormPrintWindow(t('pgDocs.forms.annualWithFormsTitle', { year: selYear }), html)
    push('success', t('pgDocs.forms.annualWithFormsSuccess'))
  }

  const annualColumns: Column<(typeof annualRows)[number]>[] = [
    {
      key: 'emp',
      title: t('pgDocs.forms.employee'),
      render: (r) => <span className="font-semibold text-ink-800">{r.emp.name}</span>,
    },
    { key: 'months', title: t('pgDocs.forms.months'), render: (r) => <Badge tone="blue">{r.math.months}</Badge> },
    { key: 'gross', title: t('pgDocs.forms.annualIncome'), render: (r) => <span className="text-xs">{money(r.math.gross)}</span> },
    { key: 'ded', title: t('pgDocs.forms.deductions'), render: (r) => <span className="text-xs">{money(r.math.deductions)}</span> },
    { key: 'taxable', title: t('pgDocs.forms.taxableBase'), render: (r) => <span className="text-xs">{money(r.math.taxable)}</span> },
    { key: 'tax', title: t('pgDocs.forms.annualTax'), render: (r) => <span className="text-xs font-bold text-brand-700">{money(r.math.tax)}</span> },
    { key: 'paid', title: t('pgDocs.forms.paid'), render: (r) => <span className="text-xs">{money(r.math.paidTax)}</span> },
    {
      key: 'diff',
      title: t('pgDocs.forms.difference'),
      render: (r) => {
        const d = r.math.tax - r.math.paidTax
        return Math.abs(d) < 1 ? <Badge tone="green">{t('pgDocs.forms.settled')}</Badge> : d > 0 ? <Badge tone="red">{t('pgDocs.forms.dueAmount', { amount: money(d) })}</Badge> : <Badge tone="amber">{t('pgDocs.forms.refundAmount', { amount: money(Math.abs(d)) })}</Badge>
      },
    },
    {
      key: 'actions',
      title: '',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="secondary" onClick={() => openPreview(t('pgDocs.forms.dd14ForEmployee', { name: r.emp.name }), buildEmployeeDD14Html(r.emp, currentCompany, data.config, selYear, data))}>
            <Eye size={13} /> {t('pgDocs.forms.form')}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => printDD14Employee(r.emp.id)}>
            <Printer size={13} />
          </Button>
        </div>
      ),
    },
  ]

  const monthColumns: Column<(typeof months)[number]>[] = [
    {
      key: 'month',
      title: t('pgDocs.forms.month'),
      render: (m) => (
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <CalendarClock size={16} />
          </div>
          <span className="font-semibold text-ink-800">{mn(m.month)} {selYear}</span>
        </div>
      ),
    },
    { key: 'count', title: t('pgDocs.forms.employees'), render: (m) => <span className="text-xs">{fmt(m.count)}</span> },
    { key: 'gross', title: t('pgDocs.forms.grossIncome'), render: (m) => <span className="text-xs">{money(m.gross)}</span> },
    { key: 'tax', title: t('pgDocs.forms.monthTax'), render: (m) => <span className="text-xs font-bold text-brand-700">{money(m.tax)}</span> },
    {
      key: 'actions',
      title: '',
      render: (m) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSelMonth(m.month)
              const html = buildMonthlyRegisterHtml(currentCompany, selYear, m.month, data) + buildMonthlyDeclarationHtml(currentCompany, selYear, m.month, data)
              openPreview(t('pgDocs.forms.registerWithDeclTitle', { month: mn(m.month), year: selYear }), html)
            }}
          >
            <Eye size={13} /> {t('pgDocs.forms.preview')}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => {
            setSelMonth(m.month)
            printMonthly(true)
          }}>
            <Printer size={13} />
          </Button>
        </div>
      ),
    },
  ]

  const monthDetailColumns: Column<(typeof monthRows)[number]>[] = [
    {
      key: 'emp',
      title: t('pgDocs.forms.employee'),
      render: (r) => {
        const e = employees.find((x) => x.id === r.employeeId)
        return <span className="font-semibold text-ink-800">{e?.name ?? '—'}</span>
      },
    },
    { key: 'gross', title: t('pgDocs.forms.salaryAllowances'), render: (r) => <span className="text-xs">{money(r.gross)}</span> },
    { key: 'ded', title: t('pgDocs.forms.deductions'), render: (r) => <span className="text-xs">{money(r.deductions)}</span> },
    { key: 'taxable', title: t('pgDocs.forms.taxableBase'), render: (r) => <span className="text-xs">{money(r.taxable)}</span> },
    { key: 'tax', title: t('pgDocs.forms.monthTax'), render: (r) => <span className="text-xs font-bold text-brand-700">{money(r.adjusted)}</span> },
    {
      key: 'declared',
      title: t('pgDocs.forms.declaration'),
      render: (r) => (r.declared ? <Badge tone="green">{t('pgDocs.forms.declaredBadge')}</Badge> : <Badge tone="amber">{t('pgDocs.forms.notDeclaredBadge')}</Badge>),
    },
  ]

  const annualTotals = {
    gross: annualRows.reduce((s, r) => s + r.math.gross, 0),
    taxable: annualRows.reduce((s, r) => s + r.math.taxable, 0),
    tax: annualRows.reduce((s, r) => s + r.math.tax, 0),
    paid: annualRows.reduce((s, r) => s + r.math.paidTax, 0),
  }

  return (
    <div>
      <PageHead
        title={t('pgDocs.forms.pageTitle')}
        desc={t('pgDocs.forms.pageDesc')}
        actions={
          <div className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm text-ink-600">
            <Scale size={16} className="text-brand-600" />
            {currentCompany?.name}
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Tabs
          items={[
            { id: 'monthly', label: t('pgDocs.forms.tabMonthlyDeclaration') },
            { id: 'dd14', label: t('pgDocs.forms.tabDD14') },
            { id: 'annual', label: t('pgDocs.forms.tabAnnual') },
          ]}
          value={tab}
          onChange={setTab}
        />
        <div className="mr-auto flex items-center gap-2">
          <Select className="max-w-[130px]" value={selYear} onChange={(e) => setSelYear(Number(e.target.value))}>
            {[year - 3, year - 2, year - 1, year, year + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
          {tab === 'monthly' && (
            <Select className="max-w-[130px]" value={selMonth} onChange={(e) => setSelMonth(Number(e.target.value))}>
              {months.length === 0
                ? Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{mn(m)}</option>)
                : months.map((m) => <option key={m.month} value={m.month}>{mn(m.month)}</option>)}
            </Select>
          )}
        </div>
      </div>

      {tab === 'monthly' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs text-ink-500"><Users size={15} className="text-brand-600" /> {t('pgDocs.forms.monthEmployees')}</div>
              <div className="mt-1 text-xl font-bold text-ink-800">{fmt(monthRows.length)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-ink-500">{t('pgDocs.forms.subjectToWithholding')}</div>
              <div className="mt-1 text-xl font-bold text-brand-700">{fmt(taxedCount)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-ink-500">{t('pgDocs.forms.monthGrossIncome')}</div>
              <div className="mt-1 text-xl font-bold text-ink-800">{moneyShort(monthTotalGross)}</div>
            </Card>
            <Card className="p-4 bg-brand-600 text-white">
              <div className="text-xs text-emerald-100">{t('pgDocs.forms.monthWithheldTax')}</div>
              <div className="mt-1 text-xl font-bold">{money(monthTotalTax)}</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <Card>
              <CardHeader
                title={t('pgDocs.forms.monthlyRegister')}
                subtitle={t('pgDocs.forms.monthlyRegisterSubtitle', { month: mn(selMonth), year: selYear })}
                action={
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => printMonthly(false)}>
                      <FileText size={14} /> {t('pgDocs.forms.registerOnly')}
                    </Button>
                    <Button size="sm" onClick={() => printMonthly(true)}>
                      <Printer size={14} /> {t('pgDocs.forms.registerAndDeclaration')}
                    </Button>
                  </div>
                }
              />
              <CardBody className="p-0">
                <DataTable columns={monthDetailColumns} rows={monthRows} dense empty={t('pgDocs.forms.monthDetailEmpty')} />
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title={t('pgDocs.forms.monthlyDeclaration')}
                subtitle={t('pgDocs.forms.monthlyDeclarationSubtitle')}
                action={
                  <Button size="sm" variant="secondary" onClick={() => {
                    if (monthRows.length === 0) { push('error', t('pgDocs.forms.noDataForMonth')); return }
                    openPreview(t('pgDocs.forms.monthlyDeclPreviewTitle', { month: mn(selMonth), year: selYear }), buildMonthlyDeclarationHtml(currentCompany, selYear, selMonth, data))
                  }}>
                    <Eye size={14} /> {t('pgDocs.forms.previewDeclaration')}
                  </Button>
                }
              />
              <CardBody>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-ink-50 p-3">
                    <div className="text-xs text-ink-500">{t('pgDocs.forms.box6Income')}</div>
                    <div className="mt-1 font-bold text-ink-800">{money(monthTotalGross)}</div>
                  </div>
                  <div className="rounded-lg bg-ink-50 p-3">
                    <div className="text-xs text-ink-500">{t('pgDocs.forms.box7Tax')}</div>
                    <div className="mt-1 font-bold text-brand-700">{money(monthTotalTax)}</div>
                  </div>
                  <div className="rounded-lg bg-ink-50 p-3">
                    <div className="text-xs text-ink-500">{t('pgDocs.forms.box8Count')}</div>
                    <div className="mt-1 font-bold text-ink-800">{fmt(monthRows.length)}</div>
                  </div>
                  <div className="rounded-lg bg-ink-50 p-3">
                    <div className="text-xs text-ink-500">{t('pgDocs.forms.box9TaxedCount')}</div>
                    <div className="mt-1 font-bold text-ink-800">{fmt(taxedCount)}</div>
                  </div>
                </div>
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
                  <strong>{t('pgDocs.forms.legalNoteTitle')}</strong> {t('pgDocs.forms.legalNoteBody')}
                </div>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader
              title={t('pgDocs.forms.monthlyOfYear', { year: selYear })}
              subtitle={t('pgDocs.forms.monthlyOfYearSubtitle')}
            />
            <CardBody className="p-0">
              <DataTable columns={monthColumns} rows={months} dense empty={t('pgDocs.forms.noYearData')} />
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'dd14' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs text-ink-500"><Users size={15} className="text-brand-600" /> {t('pgDocs.forms.employeeCount')}</div>
              <div className="mt-1 text-xl font-bold text-ink-800">{fmt(employees.length)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-ink-500">{t('pgDocs.forms.financialYear')}</div>
              <div className="mt-1 text-xl font-bold text-ink-800">{selYear}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-ink-500">{t('pgDocs.forms.totalAnnualTax')}</div>
              <div className="mt-1 text-xl font-bold text-brand-700">{money(annualTotals.tax)}</div>
            </Card>
            <Card className="p-4 bg-brand-600 text-white">
              <div className="text-xs text-emerald-100">{t('pgDocs.forms.totalTaxableBase')}</div>
              <div className="mt-1 text-xl font-bold">{moneyShort(annualTotals.taxable)}</div>
            </Card>
          </div>

          <Card>
            <CardHeader
              title={t('pgDocs.forms.dd14ListTitle', { year: selYear })}
              subtitle={t('pgDocs.forms.dd14ListSubtitle')}
              action={
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={printAllDD14}>
                    <Printer size={14} /> {t('pgDocs.forms.printAll')}
                  </Button>
                  <Button size="sm" onClick={() => {
                    if (employees.length === 0) { push('error', t('pgDocs.forms.noEmployeesShort')); return }
                    openPreview(t('pgDocs.forms.dd14ListTitle', { year: selYear }), employees.map((e) => buildEmployeeDD14Html(e, currentCompany, data.config, selYear, data)).join(''))
                  }}>
                    <Eye size={14} /> {t('pgDocs.forms.previewAll')}
                  </Button>
                </div>
              }
            />
            <CardBody className="p-0">
              <DataTable columns={annualColumns} rows={annualRows} dense empty={t('pgDocs.forms.noEmployees')} />
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'annual' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs text-ink-500"><Landmark size={15} className="text-brand-600" /> {t('pgDocs.forms.employeeCount')}</div>
              <div className="mt-1 text-xl font-bold text-ink-800">{fmt(annualRows.length)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-ink-500">{t('pgDocs.forms.totalAnnualIncome')}</div>
              <div className="mt-1 text-xl font-bold text-ink-800">{moneyShort(annualTotals.gross)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-ink-500">{t('pgDocs.forms.annualTaxDue')}</div>
              <div className="mt-1 text-xl font-bold text-brand-700">{money(annualTotals.tax)}</div>
            </Card>
            <Card className="p-4 bg-brand-600 text-white">
              <div className="text-xs text-emerald-100">{t('pgDocs.forms.paidDuringYear')}</div>
              <div className="mt-1 text-xl font-bold">{money(annualTotals.paid)}</div>
            </Card>
          </div>

          <Card>
            <CardHeader
              title={t('pgDocs.forms.annualStatementCardTitle', { year: selYear })}
              subtitle={t('pgDocs.forms.annualStatementSubtitle')}
              action={
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={exportAnnualExcel}>
                    <FileSpreadsheet size={14} /> Excel
                  </Button>
                  <Button size="sm" variant="secondary" onClick={printAnnual}>
                    <FileText size={14} /> {t('pgDocs.forms.printStatement')}
                  </Button>
                  <Button size="sm" onClick={printAnnualWithForms}>
                    <ScrollText size={14} /> {t('pgDocs.forms.statementAndForms')}
                  </Button>
                </div>
              }
            />
            <CardBody className="p-0">
              <DataTable columns={annualColumns} rows={annualRows} dense empty={t('pgDocs.forms.noEmployees')} />
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
                <FileCheck2 size={18} className="mt-0.5 shrink-0" />
                <div>
                  <strong>{t('pgDocs.forms.infoBoxTitle')}</strong> {t('pgDocs.forms.infoBoxBody')}
                  <div className="mt-1 text-xs text-sky-700">{t('pgDocs.forms.reportDateNote', { date: fmtDate(new Date().toISOString()) })}</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview?.title ?? ''}
        size="xl"
      >
        {preview && (
          <>
            <iframe
              title={preview.title}
              className="h-[75vh] w-full rounded-xl border border-ink-200 bg-white"
              srcDoc={`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"/><style>body{font-family:'Tajawal','Segoe UI',sans-serif;background:#e2e8f0;}${preview.html}</style></head><body>${preview.html}</body></html>`}
            />
            <div className="mt-3 flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  const html = preview.html.replace(/<style>[\s\S]*?<\/style>/, '').trim()
                  openFormPrintWindow(preview.title, html)
                }}
              >
                <Printer size={14} /> {t('pgDocs.forms.printSavePdf')}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
