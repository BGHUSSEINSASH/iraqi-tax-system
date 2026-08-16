import { useMemo, useState } from 'react'
import { FileText, FileSpreadsheet, FileCheck2, CalendarClock, Download, Scale } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { useI18n } from '../i18n'
import { PageHead, Card, CardHeader, CardBody, Button, Badge, Tabs, DataTable, useToast, Select, type Column } from '../components/ui'
import { fmt, money, monthName, nowYear, fmtDate, moneyShort } from '../lib/format'
import { exportExcel, exportPdf } from '../lib/export'

interface MonthGroup {
  id: string
  year: number
  month: number
  count: number
  taxed: number
  exempt: number
  gross: number
  tax: number
  declared: boolean
}

export default function Declarations() {
  const { data, currentCompany } = useApp()
  const { t, months: langMonths } = useI18n()
  const mn = (m: number) => langMonths[m - 1] ?? monthName(m)
  const { push } = useToast()
  const year = nowYear()
  const cid = data.activeCompanyId
  const [selYear, setSelYear] = useState(year)
  const [tab, setTab] = useState<'monthly' | 'annual'>('monthly')

  const months = useMemo(() => {
    const rows = data.monthlyRows.filter((r) => r.companyId === cid && r.year === selYear)
    const map = new Map<string, MonthGroup>()
    for (const r of rows) {
      const k = `${r.year}-${r.month}`
      const g = map.get(k) ?? { id: k, year: r.year, month: r.month, count: 0, taxed: 0, exempt: 0, gross: 0, tax: 0, declared: false }
      g.count++
      g.gross += r.gross
      g.tax += r.adjusted
      if (r.taxable > 0) g.taxed++
      else g.exempt++
      if (r.declared) g.declared = true
      map.set(k, g)
    }
    return Array.from(map.values()).sort((a, b) => a.month - b.month)
  }, [data.monthlyRows, cid, selYear])

  const annualRows = useMemo(
    () => data.annualRows.filter((r) => r.companyId === cid && r.year === selYear),
    [data.annualRows, cid, selYear],
  )

  const columns: Column<MonthGroup>[] = [
    {
      key: 'period',
      title: t('pgDocs.declarations.colPeriod'),
      render: (g) => (
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <CalendarClock size={17} />
          </div>
          <div>
            <div className="font-semibold text-ink-800">{mn(g.month)} {g.year}</div>
            <div className="text-xs text-ink-400">{g.declared ? t('pgDocs.declarations.declared') : t('pgDocs.declarations.notDeclared')}</div>
          </div>
        </div>
      ),
    },
    { key: 'count', title: t('pgDocs.declarations.colEmployees'), render: (g) => <span className="text-xs">{fmt(g.count)}</span> },
    { key: 'taxed', title: t('pgDocs.declarations.colTaxed'), render: (g) => <Badge tone="brand">{fmt(g.taxed)}</Badge> },
    { key: 'exempt', title: t('pgDocs.declarations.colExempt'), render: (g) => <Badge tone="slate">{fmt(g.exempt)}</Badge> },
    { key: 'gross', title: t('pgDocs.declarations.grossIncome'), total: (gs) => gs.reduce((s, g) => s + g.gross, 0), render: (g) => <span className="text-xs">{money(g.gross)}</span> },
    { key: 'tax', title: t('pgDocs.declarations.tax'), total: (gs) => gs.reduce((s, g) => s + g.tax, 0), render: (g) => <span className="text-xs font-bold text-brand-700">{money(g.tax)}</span> },
    {
      key: 'status',
      title: t('pgDocs.declarations.colStatus'),
      render: (g) => (g.declared ? <Badge tone="green">{t('pgDocs.declarations.badgeDeclared')}</Badge> : <Badge tone="amber">{t('pgDocs.declarations.badgePending')}</Badge>),
    },
    {
      key: 'actions',
      title: '',
      render: (g) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="secondary" onClick={() => exportMonthExcel(g)}>
            <FileSpreadsheet size={14} />
          </Button>
          <Button size="sm" variant="secondary" onClick={() => exportMonthPdf(g)}>
            <FileText size={14} />
          </Button>
        </div>
      ),
    },
  ]

  const monthRows = (g: MonthGroup) => data.monthlyRows.filter((r) => r.companyId === cid && r.year === g.year && r.month === g.month)

  const exportMonthExcel = (g: MonthGroup) => {
    const headers = [t('pgDocs.declarations.employeeName'), t('pgDocs.declarations.nationalId'), t('pgDocs.declarations.grossIncome'), t('pgDocs.declarations.deductions'), t('pgDocs.declarations.taxableBase'), t('pgDocs.declarations.tax')]
    const body = monthRows(g).map((r) => {
      const e = data.employees.find((x) => x.id === r.employeeId)
      return [e?.name ?? '', e?.nationalId ?? '', r.gross, r.deductions, r.taxable, r.adjusted]
    })
    exportExcel(t('pgDocs.declarations.exportMonthFile', { month: mn(g.month), year: g.year }), t('pgDocs.declarations.exportMonthSheet'), headers, body)
    push('success', t('pgDocs.declarations.exportMonthSuccess', { month: mn(g.month), year: g.year }))
  }

  const exportMonthPdf = (g: MonthGroup) => {
    const headers = [t('pgDocs.declarations.employee'), t('pgDocs.declarations.nationalId'), t('pgDocs.declarations.grossIncome'), t('pgDocs.declarations.deductions'), t('pgDocs.declarations.taxableBase'), t('pgDocs.declarations.tax')]
    const body = monthRows(g).map((r) => {
      const e = data.employees.find((x) => x.id === r.employeeId)
      return [e?.name ?? '', e?.nationalId ?? '', fmt(r.gross), fmt(r.deductions), fmt(r.taxable), fmt(r.adjusted)]
    })
    exportPdf({
      title: t('pgDocs.declarations.pdfMonthTitle'),
      subtitle: t('pgDocs.declarations.pdfMonthSubtitle', { month: mn(g.month), year: g.year }),
      company: currentCompany,
      headers,
      rows: body,
      footers: [t('pgDocs.declarations.pdfFooter')],
    })
  }

  const exportAnnualRoster = () => {
    const headers = [t('pgDocs.declarations.userName'), t('pgDocs.declarations.nationalId'), t('pgDocs.declarations.annualIncome'), t('pgDocs.declarations.deductions'), t('pgDocs.declarations.taxableBase'), t('pgDocs.declarations.annualTax'), t('pgDocs.declarations.paid'), t('pgDocs.declarations.difference')]
    const body = annualRows.map((r) => {
      const e = data.employees.find((x) => x.id === r.employeeId)
      return [e?.name ?? '', e?.nationalId ?? '', r.gross, r.deductions, r.taxable, r.annualTax, r.paidTax, r.difference]
    })
    exportExcel(t('pgDocs.declarations.annualFile', { year: selYear }), t('pgDocs.declarations.annualSheet'), headers, body)
    push('success', t('pgDocs.declarations.annualExportSuccess', { year: selYear }))
  }

  const exportAnnualPdf = () => {
    const headers = [t('pgDocs.declarations.employee'), t('pgDocs.declarations.nationalId'), t('pgDocs.declarations.annualIncome'), t('pgDocs.declarations.deductions'), t('pgDocs.declarations.taxableBase'), t('pgDocs.declarations.annualTax'), t('pgDocs.declarations.paid'), t('pgDocs.declarations.difference')]
    const body = annualRows.map((r) => {
      const e = data.employees.find((x) => x.id === r.employeeId)
      return [e?.name ?? '', e?.nationalId ?? '', fmt(r.gross), fmt(r.deductions), fmt(r.taxable), fmt(r.annualTax), fmt(r.paidTax), fmt(r.difference)]
    })
    exportPdf({
      title: t('pgDocs.declarations.pdfAnnualTitle'),
      subtitle: t('pgDocs.declarations.pdfAnnualSubtitle', { year: selYear }),
      company: currentCompany,
      headers,
      rows: body,
      orientation: 'landscape',
    })
  }

  const annualTotals = {
    tax: annualRows.reduce((s, r) => s + r.annualTax, 0),
    paid: annualRows.reduce((s, r) => s + r.paidTax, 0),
    diff: annualRows.reduce((s, r) => s + r.difference, 0),
  }

  const annualColumns: Column<(typeof annualRows)[number]>[] = [
    {
      key: 'employee',
      title: t('pgDocs.declarations.employee'),
      render: (r) => {
        const e = data.employees.find((x) => x.id === r.employeeId)
        return <span className="font-semibold text-ink-800">{e?.name ?? '—'}</span>
      },
    },
    { key: 'gross', title: t('pgDocs.declarations.annualIncome'), render: (r) => <span className="text-xs">{money(r.gross)}</span> },
    { key: 'taxable', title: t('pgDocs.declarations.taxableBase'), render: (r) => <span className="text-xs">{money(r.taxable)}</span> },
    { key: 'annualTax', title: t('pgDocs.declarations.annualTax'), render: (r) => <span className="text-xs font-bold text-brand-700">{money(r.annualTax)}</span> },
    { key: 'paidTax', title: t('pgDocs.declarations.paid'), render: (r) => <span className="text-xs">{money(r.paidTax)}</span> },
    {
      key: 'difference',
      title: t('pgDocs.declarations.difference'),
      render: (r) =>
        Math.abs(r.difference) < 1 ? <Badge tone="green">{t('pgDocs.declarations.settled')}</Badge> : r.difference > 0 ? <Badge tone="red">{t('pgDocs.declarations.dueAmount', { amount: money(r.difference) })}</Badge> : <Badge tone="amber">{t('pgDocs.declarations.refundAmount', { amount: money(Math.abs(r.difference)) })}</Badge>,
    },
  ]

  const declaredMonths = months.filter((m) => m.declared)

  return (
    <div>
      <PageHead
        title={t('pgDocs.declarations.pageTitle')}
        desc={t('pgDocs.declarations.pageDesc')}
        actions={
          <div className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm text-ink-600">
            <Scale size={16} className="text-brand-600" />
            {currentCompany?.name}
          </div>
        }
      />

      <div className="mb-5">
        <Tabs
          items={[
            { id: 'monthly', label: t('pgDocs.declarations.tabMonthly') },
            { id: 'annual', label: t('pgDocs.declarations.tabAnnual') },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'monthly' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs text-ink-500"><FileCheck2 size={15} className="text-brand-600" /> {t('pgDocs.declarations.declaredMonths')}</div>
              <div className="mt-1 text-xl font-bold text-ink-800">{fmt(declaredMonths.length)} / {fmt(months.length)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-ink-500">{t('pgDocs.declarations.totalAnnualTax')}</div>
              <div className="mt-1 text-xl font-bold text-brand-700">{money(months.reduce((s, g) => s + g.tax, 0))}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-ink-500">{t('pgDocs.declarations.declaredGrossIncome')}</div>
              <div className="mt-1 text-xl font-bold text-ink-800">{moneyShort(months.filter((m) => m.declared).reduce((s, g) => s + g.gross, 0))}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-ink-500">{t('pgDocs.declarations.date')}</div>
              <div className="mt-1 text-xl font-bold text-ink-800">{fmtDate(new Date().toISOString())}</div>
            </Card>
          </div>

          <Card>
            <CardHeader
              title={t('pgDocs.declarations.monthlyTitle', { year: selYear })}
              subtitle={t('pgDocs.declarations.monthlySubtitle')}
              action={
                <Select className="max-w-[130px]" value={selYear} onChange={(e) => setSelYear(Number(e.target.value))}>
                  {[year - 1, year, year + 1].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Select>
              }
            />
            <CardBody className="p-0">
              <DataTable columns={columns} rows={months} dense empty={t('pgDocs.declarations.monthlyEmpty')} />
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'annual' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card className="p-4"><div className="text-xs text-ink-500">{t('pgDocs.declarations.annualTax')}</div><div className="mt-1 text-xl font-bold text-brand-700">{money(annualTotals.tax)}</div></Card>
            <Card className="p-4"><div className="text-xs text-ink-500">{t('pgDocs.declarations.paidDuringYear')}</div><div className="mt-1 text-xl font-bold text-ink-800">{money(annualTotals.paid)}</div></Card>
            <Card className="p-4"><div className="text-xs text-ink-500">{t('pgDocs.declarations.difference')}</div><div className="mt-1 text-xl font-bold text-red-600">{money(annualTotals.diff)}</div></Card>
            <Card className="p-4 bg-brand-600 text-white">
              <div className="text-xs text-emerald-100">{t('pgDocs.declarations.employeeCount')}</div>
              <div className="mt-1 text-xl font-bold">{fmt(annualRows.length)}</div>
            </Card>
          </div>

          <Card>
            <CardHeader
              title={t('pgDocs.declarations.annualTitle', { year: selYear })}
              subtitle={t('pgDocs.declarations.annualSubtitle')}
              action={
                <div className="flex items-center gap-2">
                  <Select className="max-w-[130px]" value={selYear} onChange={(e) => setSelYear(Number(e.target.value))}>
                    {[year - 2, year - 1, year].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </Select>
                  <Button size="sm" variant="secondary" onClick={exportAnnualRoster}>
                    <FileSpreadsheet size={15} /> Excel
                  </Button>
                  <Button size="sm" variant="secondary" onClick={exportAnnualPdf}>
                    <FileText size={15} /> PDF
                  </Button>
                </div>
              }
            />
            <CardBody className="p-0">
              <DataTable columns={annualColumns} rows={annualRows} dense empty={t('pgDocs.declarations.annualEmpty')} />
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  )
}
