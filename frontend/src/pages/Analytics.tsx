import { useMemo, useState } from 'react'
import {
  Wallet,
  FileText,
  Users,
  UserCheck,
  Receipt,
  Scale,
  AlertTriangle,
  Gauge,
  ArrowUp,
  ArrowDown,
  Banknote,
} from 'lucide-react'
import { useApp } from '../store/AppContext'
import { PageHead, Card, CardBody, CardHeader, Badge, DataTable, type Column } from '../components/ui'
import { fmtMoney, nowYear } from '../lib/format'
import { taxNumber as clientTaxNumber, clientName, currentMonthIndex } from '../lib/clientProfile'
import { useI18n } from '../i18n'

type Comparison = {
  key: string
  label: string
  icon: React.ReactNode
  color: string
  values: { month: string; value: number }[]
  format: (n: number) => string
}

export default function Analytics() {
  const { data } = useApp()
  const { t, months } = useI18n()
  const year = nowYear()

  const paidByMonth = useMemo(() => {
    const arr = Array.from({ length: 12 }, () => 0)
    data.invoices
      .filter((i) => i.status === 'paid' && i.date?.startsWith(`${year}-`))
      .forEach((i) => {
        const m = parseInt(i.date.slice(5, 7), 10)
        if (m >= 1 && m <= 12) arr[m - 1] += i.amount || 0
      })
    return arr
  }, [data.invoices, year])

  const invoicesByMonth = useMemo(() => {
    const arr = Array.from({ length: 12 }, () => 0)
    data.invoices
      .filter((i) => i.date?.startsWith(`${year}-`))
      .forEach((i) => {
        const m = parseInt(i.date.slice(5, 7), 10)
        if (m >= 1 && m <= 12) arr[m - 1] += 1
      })
    return arr
  }, [data.invoices, year])

  const declaredByMonth = useMemo(() => {
    const arr = Array.from({ length: 12 }, () => 0)
    data.monthlyRows
      .filter((r) => r.declared && r.year === year)
      .forEach((r) => {
        if (r.month >= 1 && r.month <= 12) arr[r.month - 1] += 1
      })
    return arr
  }, [data.monthlyRows, year])

  const withholdingByMonth = useMemo(() => {
    const arr = Array.from({ length: 12 }, () => 0)
    data.monthlyRows
      .filter((r) => r.year === year)
      .forEach((r) => {
        if (r.month >= 1 && r.month <= 12) arr[r.month - 1] += r.adjusted || 0
      })
    return arr
  }, [data.monthlyRows, year])

  const comparisons: Comparison[] = useMemo(
    () => [
      {
        key: 'collections',
        label: t('pgAnalytics.analytics.comp.collections'),
        icon: <Wallet size={16} />,
        color: '#059669',
        values: months.map((m, i) => ({ month: m, value: paidByMonth[i] })),
        format: fmtMoney,
      },
      {
        key: 'withholding',
        label: t('pgAnalytics.analytics.comp.withholding'),
        icon: <Banknote size={16} />,
        color: '#7c3aed',
        values: months.map((m, i) => ({ month: m, value: withholdingByMonth[i] })),
        format: fmtMoney,
      },
      {
        key: 'invoices',
        label: t('pgAnalytics.analytics.comp.invoices'),
        icon: <Receipt size={16} />,
        color: '#0f766e',
        values: months.map((m, i) => ({ month: m, value: invoicesByMonth[i] })),
        format: (n) => String(n),
      },
      {
        key: 'declarations',
        label: t('pgAnalytics.analytics.comp.declarations'),
        icon: <FileText size={16} />,
        color: '#b45309',
        values: months.map((m, i) => ({ month: m, value: declaredByMonth[i] })),
        format: (n) => String(n),
      },
    ],
    [months, paidByMonth, withholdingByMonth, invoicesByMonth, declaredByMonth, t],
  )

  const [selected, setSelected] = useState('collections')
  const active = comparisons.find((c) => c.key === selected)!

  const first = active.values[0]?.value ?? 0
  const last = active.values[11]?.value ?? 0
  const trend = first === 0 ? 0 : Math.round(((last - first) / first) * 100)
  const trendUp = trend >= 0

  const maxV = Math.max(1, ...active.values.map((v) => v.value))
  const minV = Math.min(...active.values.map((v) => v.value))
  const peakV = Math.max(...active.values.map((v) => v.value))
  const peakIdx = active.values.findIndex((v) => v.value === peakV)
  const peakLabel = peakIdx >= 0 ? active.values[peakIdx].month : ''

  const totalTaxpayers = data.taxpayers.length
  const taxpayersWithTax = data.taxpayers.filter((c) => c.taxId).length
  const taxpayersWithTaxPct = totalTaxpayers ? Math.round((taxpayersWithTax / totalTaxpayers) * 100) : 0
  const avgInvoice = data.invoices.length ? Math.round(data.invoices.reduce((s, i) => s + (i.amount || 0), 0) / data.invoices.length) : 0
  const avgWithholding = data.monthlyRows.length ? Math.round(data.monthlyRows.reduce((s, r) => s + (r.adjusted || 0), 0) / Math.max(1, data.monthlyRows.length)) : 0

  const missingInfo = data.taxpayers.filter((t) => !t.email || !t.phone).length
  const overdue = data.invoices.filter((i) => i.status === 'overdue').length
  const declaredCount = data.monthlyRows.filter((r) => r.declared).length

  const topClients = useMemo(
    () =>
      Object.entries(
        data.invoices.reduce<Record<string, number>>((acc, i) => {
          acc[i.client] = (acc[i.client] || 0) + (i.amount || 0)
          return acc
        }, {}),
      )
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5),
    [data.invoices],
  )
  const maxTop = Math.max(1, ...topClients.map((c) => c.total))

  const rows = active.values.map((v, i) => ({ id: `r-${i}`, month: v.month, value: v.value }))

  const columns: Column<(typeof rows)[number]>[] = [
    { key: 'month', title: t('pgAnalytics.analytics.table.month'), render: (r) => <span className="font-semibold text-ink-700">{r.month}</span> },
    {
      key: 'bar',
      title: t('pgAnalytics.analytics.table.value'),
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.max(3, (r.value / maxV) * 100)}%`, backgroundColor: active.color }}
            />
          </div>
          <span className="w-28 text-end text-xs font-bold text-ink-700">{active.format(r.value)}</span>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHead
        title={t('pgAnalytics.analytics.page.title')}
        desc={t('pgAnalytics.analytics.page.desc', { year, org: clientName, taxNo: clientTaxNumber })}
      />

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-ink-500"><Gauge size={15} className="text-brand-600" /> {t('pgAnalytics.analytics.stat.avgInvoice')}</div>
          <div className="mt-1 text-xl font-bold text-ink-800">{fmtMoney(avgInvoice)}</div>
          <div className="mt-1 text-xs text-emerald-600">{t('pgAnalytics.analytics.stat.totalInvoices', { count: data.invoices.length })}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-ink-500"><Banknote size={15} className="text-violet-600" /> {t('pgAnalytics.analytics.stat.avgWithholding')}</div>
          <div className="mt-1 text-xl font-bold text-ink-800">{fmtMoney(avgWithholding)}</div>
          <div className="mt-1 text-xs text-ink-400">{t('pgAnalytics.analytics.stat.upToMonth', { month: months[currentMonthIndex - 1] })}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-ink-500"><UserCheck size={15} className="text-sky-600" /> {t('pgAnalytics.analytics.stat.registeredTaxNo')}</div>
          <div className="mt-1 text-xl font-bold text-ink-800">{t('pgAnalytics.analytics.stat.ofTotal', { a: taxpayersWithTax, b: totalTaxpayers })}</div>
          <div className="mt-1 text-xs text-sky-600">{t('pgAnalytics.analytics.stat.pctOfTaxpayers', { pct: taxpayersWithTaxPct })}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-ink-500"><AlertTriangle size={15} className="text-amber-600" /> {t('pgAnalytics.analytics.stat.alerts')}</div>
          <div className="mt-1 text-xl font-bold text-ink-800">{missingInfo + overdue}</div>
          <div className="mt-1 text-xs text-amber-600">{t('pgAnalytics.analytics.stat.alertsDesc', { missing: missingInfo, overdue })}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title={t('pgAnalytics.analytics.comp.title')}
            subtitle={t('pgAnalytics.analytics.comp.subtitle')}
            action={
              <div className="flex flex-wrap gap-1.5">
                {comparisons.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setSelected(c.key)}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                      selected === c.key
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
                    }`}
                  >
                    <span className="ml-1 inline-flex align-middle">{c.icon}</span>
                    {c.label}
                  </button>
                ))}
              </div>
            }
          />
          <CardBody>
            <div className="mb-4 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-ink-50 p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-ink-500">
                  {trendUp ? <ArrowUp size={13} className="text-emerald-600" /> : <ArrowDown size={13} className="text-red-600" />}
                  {t('pgAnalytics.analytics.comp.vsMonth', { month: months[0] })}
                </div>
                <div className={`mt-1 text-lg font-bold ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
                  {trendUp ? '+' : ''}{trend}%
                </div>
              </div>
              <div className="rounded-xl bg-ink-50 p-3 text-center">
                <div className="text-xs text-ink-500">{t('pgAnalytics.analytics.comp.min')}</div>
                <div className="mt-1 text-lg font-bold text-ink-800">{active.format(minV)}</div>
              </div>
              <div className="rounded-xl bg-ink-50 p-3 text-center">
                <div className="text-xs text-ink-500">{t('pgAnalytics.analytics.comp.max', { month: peakLabel })}</div>
                <div className="mt-1 text-lg font-bold text-brand-700">{active.format(peakV)}</div>
              </div>
            </div>
            <DataTable columns={columns} rows={rows} dense empty={t('pgAnalytics.analytics.table.empty')} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('pgAnalytics.analytics.topClients.title')} subtitle={t('pgAnalytics.analytics.topClients.subtitle')} />
          <CardBody>
            {topClients.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-400">{t('pgAnalytics.analytics.topClients.empty')}</p>
            ) : (
              <div className="space-y-3">
                {topClients.map((c, i) => (
                  <div key={i}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-semibold text-ink-700">{i + 1}. {c.name}</span>
                      <span className="text-xs font-bold text-ink-600">{fmtMoney(c.total)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(c.total / maxTop) * 100}%`, background: ['#7c3aed', '#0f766e', '#059669', '#b45309', '#e11d48'][i] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-5 space-y-2 border-t border-ink-100 pt-4 text-xs text-ink-500">
              <div className="flex justify-between"><span>{t('pgAnalytics.analytics.topClients.countTaxpayers')}</span><b className="text-ink-700">{data.taxpayers.length}</b></div>
              <div className="flex justify-between"><span>{t('pgAnalytics.analytics.topClients.totalInvoices')}</span><b className="text-ink-700">{data.invoices.length}</b></div>
              <div className="flex justify-between"><span>{t('pgAnalytics.analytics.topClients.declarations')}</span><b className="text-ink-700">{declaredCount}</b></div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
