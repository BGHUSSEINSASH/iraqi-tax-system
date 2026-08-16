import { useMemo, useState } from 'react'
import { BarChart3, FileSpreadsheet, FileText, Filter } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import { useApp } from '../store/AppContext'
import { PageHead, Card, CardHeader, CardBody, Button, Select, Badge, DataTable, useToast, type Column } from '../components/ui'
import { fmt, money, moneyShort, nowYear, fmtDate } from '../lib/format'
import { exportExcel, exportPdf } from '../lib/export'
import { useI18n } from '../i18n'

interface TypeAgg {
  id: string
  label: string
  count: number
  base: number
  tax: number
  paid: number
  balance: number
}

export default function Reports() {
  const { data, currentCompany } = useApp()
  const { push } = useToast()
  const { t, months } = useI18n()
  const year = nowYear()
  const cid = data.activeCompanyId
  const [selYear, setSelYear] = useState(year)
  const [type, setType] = useState('all')

  const agg = useMemo(() => {
    const monthly = data.monthlyRows.filter((r) => r.companyId === cid && r.year === selYear)
    const corp = data.corporateReturns.filter((r) => r.companyId === cid && r.year === selYear)
    const contracts = data.contracts.filter((r) => r.companyId === cid)
    const properties = data.properties.filter((r) => r.companyId === cid && r.year === selYear)
    const lands = data.lands.filter((r) => r.companyId === cid && r.year === selYear)
    const professions = data.professions.filter((r) => r.companyId === cid && r.year === selYear)
    const sales = data.sales.filter((r) => r.companyId === cid)

    const s = (arr: { tax: number; paid: number }[]) => ({
      tax: arr.reduce((a, x) => a + x.tax, 0),
      paid: arr.reduce((a, x) => a + x.paid, 0),
    })

    const monthlyAgg = s(monthly.map((r) => ({ tax: r.adjusted, paid: r.adjusted * (r.declared ? 1 : 0) })))
    const corpAgg = s(corp)
    const contractsAgg = s(contracts)
    const propertyAgg = s(properties)
    const landAgg = s(lands)
    const professionAgg = s(professions)
    const salesAgg = s(sales)

    const aggList = [
      { id: 'monthly', label: t('pgAnalytics.reports.type.monthly'), count: monthly.length, base: monthly.reduce((a, r) => a + r.gross, 0), ...monthlyAgg },
      { id: 'corporate', label: t('pgAnalytics.reports.type.corporate'), count: corp.length, base: corp.reduce((a, r) => a + r.profits, 0), ...corpAgg },
      { id: 'contracts', label: t('pgAnalytics.reports.type.contracts'), count: contracts.length, base: contracts.reduce((a, r) => a + r.amount, 0), ...contractsAgg },
      { id: 'property', label: t('pgAnalytics.reports.type.property'), count: properties.length, base: properties.reduce((a, r) => a + r.annualRent, 0), ...propertyAgg },
      { id: 'land', label: t('pgAnalytics.reports.type.land'), count: lands.length, base: lands.reduce((a, r) => a + r.value, 0), ...landAgg },
      { id: 'profession', label: t('pgAnalytics.reports.type.profession'), count: professions.length, base: professions.reduce((a, r) => a + r.income, 0), ...professionAgg },
      { id: 'sales', label: t('pgAnalytics.reports.type.sales'), count: sales.length, base: sales.reduce((a, r) => a + r.amount, 0), ...salesAgg },
    ]

    const withBalance = aggList.map((row) => ({ ...row, balance: row.tax - row.paid }))
    return withBalance.filter((row) => (type === 'all' ? row.count > 0 || row.tax > 0 : row.id === type))
  }, [data, cid, selYear, type, t])

  const totals = useMemo(
    () => ({
      tax: agg.reduce((s, t) => s + t.tax, 0),
      paid: agg.reduce((s, t) => s + t.paid, 0),
      balance: agg.reduce((s, t) => s + t.balance, 0),
      count: agg.reduce((s, t) => s + t.count, 0),
    }),
    [agg],
  )

  const byMonth = useMemo(() => {
    const rows = data.monthlyRows.filter((r) => r.companyId === cid && r.year === selYear)
    return Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      total: rows.filter((r) => r.month === i + 1).reduce((s, r) => s + r.adjusted, 0),
    })).filter((m) => m.total > 0)
  }, [data.monthlyRows, cid, selYear])

  const columns: Column<TypeAgg>[] = [
    {
      key: 'label',
      title: t('pgAnalytics.reports.col.type'),
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <BarChart3 size={15} />
          </div>
          <span className="font-semibold text-ink-800">{row.label}</span>
        </div>
      ),
    },
    { key: 'count', title: t('pgAnalytics.reports.col.records'), render: (row) => <span className="text-xs">{fmt(row.count)}</span> },
    { key: 'base', title: t('pgAnalytics.reports.col.base'), total: (ts) => ts.reduce((s, r) => s + r.base, 0), render: (row) => <span className="text-xs">{moneyShort(row.base)}</span> },
    { key: 'tax', title: t('pgAnalytics.reports.col.tax'), total: (ts) => ts.reduce((s, r) => s + r.tax, 0), render: (row) => <span className="text-xs font-bold text-brand-700">{money(row.tax)}</span> },
    { key: 'paid', title: t('pgAnalytics.reports.col.paid'), total: (ts) => ts.reduce((s, r) => s + r.paid, 0), render: (row) => <span className="text-xs">{money(row.paid)}</span> },
    {
      key: 'balance',
      title: t('pgAnalytics.reports.col.balance'),
      total: (ts) => ts.reduce((s, r) => s + r.balance, 0),
      render: (row) => (row.balance <= 0 ? <Badge tone="green">{t('pgAnalytics.reports.col.settled')}</Badge> : <Badge tone="red">{money(row.balance)}</Badge>),
    },
  ]

  const exportRows = () => {
    const headers = [
      t('pgAnalytics.reports.export.hType'),
      t('pgAnalytics.reports.export.hRecords'),
      t('pgAnalytics.reports.export.hBase'),
      t('pgAnalytics.reports.export.hTax'),
      t('pgAnalytics.reports.export.hPaid'),
      t('pgAnalytics.reports.export.hBalance'),
    ]
    const body = agg.map((r) => [r.label, r.count, r.base, r.tax, r.paid, r.balance])
    body.push([t('pgAnalytics.reports.export.hTotal'), totals.count, totals.tax === 0 ? '' : agg.reduce((s, r) => s + r.base, 0), totals.tax, totals.paid, totals.balance])
    exportExcel(`${t('pgAnalytics.reports.export.filename')}-${selYear}.xlsx`, t('pgAnalytics.reports.export.sheet'), headers, body)
    push('success', t('pgAnalytics.reports.toast.exportedExcel'))
  }

  const exportPdfReport = () => {
    const headers = [
      t('pgAnalytics.reports.export.hType'),
      t('pgAnalytics.reports.export.hRecords'),
      t('pgAnalytics.reports.export.hBase'),
      t('pgAnalytics.reports.export.hTax'),
      t('pgAnalytics.reports.export.hPaid'),
      t('pgAnalytics.reports.export.hBalance'),
    ]
    const body = agg.map((r) => [r.label, fmt(r.count), fmt(r.base), fmt(r.tax), fmt(r.paid), fmt(r.balance)])
    body.push([t('pgAnalytics.reports.export.hTotal'), fmt(totals.count), fmt(agg.reduce((s, r) => s + r.base, 0)), fmt(totals.tax), fmt(totals.paid), fmt(totals.balance)])
    exportPdf({
      title: t('pgAnalytics.reports.export.pdfTitle'),
      subtitle: t('pgAnalytics.reports.export.pdfSubtitle', { year: selYear, date: fmtDate(new Date().toISOString()) }),
      company: currentCompany,
      headers,
      rows: body,
      footers: [t('pgAnalytics.reports.export.pdfFooter')],
    })
  }

  return (
    <div>
      <PageHead
        title={t('pgAnalytics.reports.page.title')}
        desc={t('pgAnalytics.reports.page.desc')}
        actions={
          <>
            <Button variant="secondary" onClick={exportRows}>
              <FileSpreadsheet size={16} /> Excel
            </Button>
            <Button variant="secondary" onClick={exportPdfReport}>
              <FileText size={16} /> PDF
            </Button>
          </>
        }
      />

      <Card className="mb-4">
        <CardBody className="flex flex-wrap items-center gap-3">
          <Filter size={16} className="text-ink-400" />
          <Select className="max-w-[140px]" value={selYear} onChange={(e) => setSelYear(Number(e.target.value))}>
            {[year - 2, year - 1, year, year + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
          <Select className="max-w-[220px]" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">{t('pgAnalytics.reports.filter.all')}</option>
            <option value="monthly">{t('pgAnalytics.reports.type.monthly')}</option>
            <option value="corporate">{t('pgAnalytics.reports.type.corporate')}</option>
            <option value="contracts">{t('pgAnalytics.reports.type.contracts')}</option>
            <option value="property">{t('pgAnalytics.reports.type.property')}</option>
            <option value="land">{t('pgAnalytics.reports.type.land')}</option>
            <option value="profession">{t('pgAnalytics.reports.type.profession')}</option>
            <option value="sales">{t('pgAnalytics.reports.type.sales')}</option>
          </Select>
        </CardBody>
      </Card>

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4"><div className="text-xs text-ink-500">{t('pgAnalytics.reports.stat.records')}</div><div className="mt-1 text-xl font-bold text-ink-800">{fmt(totals.count)}</div></Card>
        <Card className="p-4 bg-brand-600 text-white"><div className="text-xs text-emerald-100">{t('pgAnalytics.reports.stat.totalTax')}</div><div className="mt-1 text-xl font-bold">{money(totals.tax)}</div></Card>
        <Card className="p-4"><div className="text-xs text-ink-500">{t('pgAnalytics.reports.stat.paid')}</div><div className="mt-1 text-xl font-bold text-ink-800">{money(totals.paid)}</div></Card>
        <Card className="p-4"><div className="text-xs text-ink-500">{t('pgAnalytics.reports.stat.outstanding')}</div><div className="mt-1 text-xl font-bold text-red-600">{money(totals.balance)}</div></Card>
      </div>

      {type === 'all' && byMonth.length > 0 && (
        <Card className="mb-4">
          <CardHeader title={t('pgAnalytics.reports.type.monthly')} subtitle={t('pgAnalytics.reports.chart.subtitle', { year: selYear })} />
          <CardBody>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byMonth} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="month" tickFormatter={(m) => months[Number(m) - 1]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => moneyShort(Number(v))} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip formatter={(v) => money(Number(v))} labelFormatter={(m) => months[Number(m) - 1]} />
                  <Legend />
                  <Bar dataKey="total" name={t('pgAnalytics.reports.chart.bar')} fill="#059669" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          title={t('pgAnalytics.reports.summary.title', { year: selYear })}
          subtitle={t('pgAnalytics.reports.summary.subtitle')}
          action={
            <Badge tone="brand">
              {t('pgAnalytics.reports.summary.total', { total: moneyShort(totals.tax) })}
            </Badge>
          }
        />
        <CardBody className="p-0">
          <DataTable columns={columns} rows={agg} empty={t('pgAnalytics.reports.summary.empty')} />
        </CardBody>
      </Card>
    </div>
  )
}
