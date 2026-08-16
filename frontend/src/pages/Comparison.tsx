import { useMemo, useState } from 'react'
import { BarChart3, GitCompareArrows, TrendingUp, TrendingDown } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import { useApp } from '../store/AppContext'
import { PageHead, Card, CardHeader, CardBody, Button, Select, Badge, DataTable, type Column } from '../components/ui'
import { fmt, money, moneyShort, nowYear, monthName } from '../lib/format'
import { useI18n } from '../i18n'

const TYPES = [
  { id: 'monthly', labelKey: 'monthly' },
  { id: 'corporate', labelKey: 'corporate' },
  { id: 'contracts', labelKey: 'contracts' },
  { id: 'property', labelKey: 'property' },
  { id: 'land', labelKey: 'land' },
  { id: 'profession', labelKey: 'profession' },
  { id: 'sales', labelKey: 'sales' },
]

export default function Comparison() {
  const { data } = useApp()
  const { t } = useI18n()
  const year = nowYear()
  const y = Array.from(new Set([year - 2, year - 1, year, year + 1]))
  const [y1, setY1] = useState(year)
  const [y2, setY2] = useState(year - 1)

  const cmpRows = useMemo(() => {
    const cid = data.activeCompanyId
    return TYPES.map((tp) => {
      let v1 = 0
      let v2 = 0
      const taxOf = (rec: { tax?: number }) => rec.tax ?? 0
      if (tp.id === 'monthly') {
        v1 = data.monthlyRows.filter((r) => r.companyId === cid && r.year === y1).reduce((s, r) => s + r.adjusted, 0)
        v2 = data.monthlyRows.filter((r) => r.companyId === cid && r.year === y2).reduce((s, r) => s + r.adjusted, 0)
      } else if (tp.id === 'corporate') {
        v1 = data.corporateReturns.filter((r) => r.companyId === cid && r.year === y1).reduce((s, r) => s + taxOf(r), 0)
        v2 = data.corporateReturns.filter((r) => r.companyId === cid && r.year === y2).reduce((s, r) => s + taxOf(r), 0)
      } else if (tp.id === 'contracts') {
        v1 = data.contracts.filter((r) => r.companyId === cid && r.date?.startsWith(`${y1}-`)).reduce((s, r) => s + taxOf(r), 0)
        v2 = data.contracts.filter((r) => r.companyId === cid && r.date?.startsWith(`${y2}-`)).reduce((s, r) => s + taxOf(r), 0)
      } else if (tp.id === 'property') {
        v1 = data.properties.filter((r) => r.companyId === cid && r.year === y1).reduce((s, r) => s + taxOf(r), 0)
        v2 = data.properties.filter((r) => r.companyId === cid && r.year === y2).reduce((s, r) => s + taxOf(r), 0)
      } else if (tp.id === 'land') {
        v1 = data.lands.filter((r) => r.companyId === cid && r.year === y1).reduce((s, r) => s + taxOf(r), 0)
        v2 = data.lands.filter((r) => r.companyId === cid && r.year === y2).reduce((s, r) => s + taxOf(r), 0)
      } else if (tp.id === 'profession') {
        v1 = data.professions.filter((r) => r.companyId === cid && r.year === y1).reduce((s, r) => s + taxOf(r), 0)
        v2 = data.professions.filter((r) => r.companyId === cid && r.year === y2).reduce((s, r) => s + taxOf(r), 0)
      } else if (tp.id === 'sales') {
        v1 = data.sales.filter((r) => r.companyId === cid && r.date?.startsWith(`${y1}-`)).reduce((s, r) => s + taxOf(r), 0)
        v2 = data.sales.filter((r) => r.companyId === cid && r.date?.startsWith(`${y2}-`)).reduce((s, r) => s + taxOf(r), 0)
      }
      const diff = v1 - v2
      const pct = v2 === 0 ? (v1 > 0 ? 100 : 0) : Math.round((diff / v2) * 100)
      return { id: tp.id, label: t(`pgAnalytics.comparison.type.${tp.labelKey}`), v1, v2, diff, pct }
    })
  }, [data, y1, y2, t])

  const totals = useMemo(
    () => ({
      v1: cmpRows.reduce((s, r) => s + r.v1, 0),
      v2: cmpRows.reduce((s, r) => s + r.v2, 0),
    }),
    [cmpRows],
  )
  const totalDiff = totals.v1 - totals.v2
  const totalPct = totals.v2 === 0 ? (totals.v1 > 0 ? 100 : 0) : Math.round((totalDiff / totals.v2) * 100)

  const chartData = cmpRows
    .filter((r) => r.v1 > 0 || r.v2 > 0)
    .map((r) => ({ label: r.label, [`y_${y1}`]: r.v1, [`y_${y2}`]: r.v2 } as Record<string, string | number>))
    .sort((a, b) => (Number(b[`y_${y1}`]) + Number(b[`y_${y2}`])) - (Number(a[`y_${y1}`]) + Number(a[`y_${y2}`])))

  const columns: Column<(typeof cmpRows)[number]>[] = [
    {
      key: 'label',
      title: t('pgAnalytics.comparison.col.type'),
      render: (r) => <span className="font-semibold text-ink-800">{r.label}</span>,
    },
    {
      key: 'v2',
      title: t('pgAnalytics.comparison.col.year', { year: y2 }),
      render: (r) => <span className="text-xs font-bold text-ink-600">{money(r.v2)}</span>,
    },
    {
      key: 'v1',
      title: t('pgAnalytics.comparison.col.year', { year: y1 }),
      render: (r) => <span className="text-xs font-bold text-ink-800">{money(r.v1)}</span>,
    },
    {
      key: 'diff',
      title: t('pgAnalytics.comparison.col.change'),
      render: (r) => (
        <span className={`text-xs font-bold ${r.diff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {r.diff >= 0 ? '+' : ''}{money(r.diff)}
        </span>
      ),
    },
    {
      key: 'pct',
      title: t('pgAnalytics.comparison.col.percent'),
      render: (r) =>
        r.v2 === 0 && r.v1 > 0 ? (
          <Badge tone="amber">{t('pgAnalytics.comparison.col.new')}</Badge>
        ) : r.pct === 0 ? (
          <span className="text-xs text-ink-400">{t('pgAnalytics.common.steady')}</span>
        ) : r.pct > 0 ? (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600"><TrendingUp size={12} /> +{r.pct}%</span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-bold text-red-600"><TrendingDown size={12} /> {r.pct}%</span>
        ),
    },
  ]

  return (
    <div>
      <PageHead
        title={t('pgAnalytics.comparison.page.title')}
        desc={t('pgAnalytics.comparison.page.desc')}
      />

      <Card className="mb-5">
        <CardHeader title={t('pgAnalytics.comparison.setup.title')} subtitle={t('pgAnalytics.comparison.setup.subtitle')} />
        <CardBody>
          <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-600">{t('pgAnalytics.comparison.setup.firstYear')}</label>
              <Select value={y1} onChange={(e) => setY1(Number(e.target.value))}>
                {y.map((yy) => <option key={yy} value={yy}>{yy}</option>)}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-600">{t('pgAnalytics.comparison.setup.secondYear')}</label>
              <Select value={y2} onChange={(e) => setY2(Number(e.target.value))}>
                {y.map((yy) => <option key={yy} value={yy}>{yy}</option>)}
              </Select>
            </div>
            <Button variant="secondary" onClick={() => { setY1(y1); setY2(y2) }} className="md:col-span-1">
              <GitCompareArrows size={16} /> {t('pgAnalytics.comparison.setup.update')}
            </Button>
            <div className="md:col-span-1">
              {y1 === y2 && (
                <p className="text-xs text-amber-600">{t('pgAnalytics.comparison.setup.different')}</p>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs text-ink-500">{t('pgAnalytics.comparison.stat.total', { year: y1 })}</div>
          <div className="mt-1 text-lg font-bold text-ink-800">{moneyShort(totals.v1)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-ink-500">{t('pgAnalytics.comparison.stat.total', { year: y2 })}</div>
          <div className="mt-1 text-lg font-bold text-ink-800">{moneyShort(totals.v2)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-ink-500">{t('pgAnalytics.comparison.stat.netChange')}</div>
          <div className={`mt-1 text-lg font-bold ${totalDiff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {totalDiff >= 0 ? '+' : ''}{moneyShort(totalDiff)}
          </div>
        </Card>
        <Card className="p-4 bg-brand-600 text-white">
          <div className="text-xs text-emerald-100">{t('pgAnalytics.comparison.stat.totalPct')}</div>
          <div className="mt-1 text-lg font-bold">
            {totalPct === 0 ? t('pgAnalytics.common.steady') : `${totalPct > 0 ? '+' : ''}${totalPct}%`}
          </div>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card className="mb-5">
          <CardHeader title={t('pgAnalytics.comparison.chart.title')} subtitle={t('pgAnalytics.comparison.chart.subtitle', { y1, y2 })} />
          <CardBody>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis tickFormatter={(v) => moneyShort(Number(v))} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip formatter={(v) => money(Number(v))} />
                  <Legend />
                  <Bar dataKey={`y_${y2}`} name={t('pgAnalytics.comparison.col.year', { year: y2 })} fill="#94a3b8" radius={[6, 6, 0, 0]} />
                  <Bar dataKey={`y_${y1}`} name={t('pgAnalytics.comparison.col.year', { year: y1 })} fill="#059669" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader title={t('pgAnalytics.comparison.results.title')} subtitle={t('pgAnalytics.comparison.results.subtitle')} />
        <CardBody className="p-0">
          <DataTable columns={columns} rows={cmpRows} dense empty={t('pgAnalytics.comparison.results.empty')} />
        </CardBody>
      </Card>
    </div>
  )
}
