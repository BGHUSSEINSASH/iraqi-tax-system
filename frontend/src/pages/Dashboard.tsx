import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  CalendarClock,
  Landmark,
  ArrowLeft,
  FileSignature,
  Home,
  Map,
  Briefcase,
  FileSpreadsheet,
  CircleDollarSign,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from 'recharts'
import { useApp } from '../store/AppContext'
import { StatCard, Card, CardHeader, CardBody, Badge, cx } from '../components/ui'
import { fmt, money, moneyShort, nowYear, nowMonth, fmtDate } from '../lib/format'
import { useI18n } from '../i18n'

const PIE_COLORS = ['#059669', '#f59e0b', '#0ea5e9', '#8b5cf6', '#ef4444', '#64748b']

export default function Dashboard() {
  const { data, currentCompany } = useApp()
  const { t, months } = useI18n()
  const year = nowYear()
  const month = nowMonth()
  const cid = data.activeCompanyId

  const monthLabel = (m: number) => months[m - 1] ?? ''

  const employees = data.employees.filter((e) => e.companyId === cid)
  const monthly = data.monthlyRows.filter((r) => r.companyId === cid)
  const annual = data.annualRows.filter((r) => r.companyId === cid)
  const corp = data.corporateReturns.filter((r) => r.companyId === cid)
  const contracts = data.contracts.filter((r) => r.companyId === cid)
  const properties = data.properties.filter((r) => r.companyId === cid)
  const lands = data.lands.filter((r) => r.companyId === cid)
  const professions = data.professions.filter((r) => r.companyId === cid)

  const thisMonthRows = monthly.filter((r) => r.year === year && r.month === month)
  const thisMonthTax = thisMonthRows.reduce((s, r) => s + r.adjusted, 0)

  const byMonth = useMemo(() => {
    const arr = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, total: 0 }))
    monthly
      .filter((r) => r.year === year)
      .forEach((r) => {
        arr[r.month - 1].total += r.adjusted
      })
    return arr
  }, [monthly, year])

  const yearTaxPie = useMemo(() => {
    const s = (arr: { tax: number }[]) => arr.reduce((a, x) => a + x.tax, 0)
    return [
      { name: t('tax.corporate.title'), value: s(corp.filter((x) => x.year === year)) },
      { name: t('tax.monthly.title'), value: monthly.filter((r) => r.year === year).reduce((a, r) => a + r.adjusted, 0) },
      { name: t('tax.contracts.title'), value: s(contracts) },
      { name: t('tax.property.title'), value: s(properties.filter((x) => x.year === year)) },
      { name: t('tax.land.title'), value: s(lands.filter((x) => x.year === year)) },
      { name: t('tax.profession.title'), value: s(professions.filter((x) => x.year === year)) },
    ].filter((x) => x.value > 0)
  }, [corp, monthly, contracts, properties, lands, professions, year, t])

  const totalOutstanding =
    corp.filter((r) => r.year === year).reduce((a, r) => a + Math.max(0, r.tax - r.paid), 0) +
    contracts.reduce((a, r) => a + Math.max(0, r.tax - r.paid), 0) +
    properties.filter((r) => r.year === year).reduce((a, r) => a + Math.max(0, r.totalDue - r.paid), 0) +
    lands.filter((r) => r.year === year).reduce((a, r) => a + Math.max(0, r.tax - r.paid), 0) +
    professions.filter((r) => r.year === year).reduce((a, r) => a + Math.max(0, r.tax - r.paid), 0)

  const totalTaxYear =
    yearTaxPie.reduce((a, x) => a + x.value, 0)

  const annualTaxYear = annual.filter((r) => r.year === year - 1).reduce((a, r) => a + r.annualTax, 0)

  const recent = useMemo(() => {
    const items: { date: string; label: string; amount: number; kind: string }[] = [
      ...contracts.map((r) => ({ date: r.date, label: `${t('dashboard.contractLabel')}: ${r.party}`, amount: r.tax, kind: 'contract' })),
      ...properties.map((r) => ({ date: `${r.year}-06-01`, label: `${t('dashboard.propertyLabel')}: ${r.name}`, amount: r.tax, kind: 'property' })),
    ]
    return items
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 6)
  }, [contracts, properties, t])

  const quick = [
    { to: '/tax/monthly', label: t('tax.monthly.title'), icon: <CalendarClock size={22} />, tone: 'bg-brand-50 text-brand-600' },
    { to: '/tax/annual', label: t('tax.annual.title'), icon: <FileSpreadsheet size={22} />, tone: 'bg-emerald-50 text-emerald-600' },
    { to: '/tax/corporate', label: t('tax.corporate.title'), icon: <Landmark size={22} />, tone: 'bg-sky-50 text-sky-600' },
    { to: '/tax/contracts', label: t('tax.contracts.title'), icon: <FileSignature size={22} />, tone: 'bg-violet-50 text-violet-600' },
    { to: '/tax/property', label: t('tax.property.title'), icon: <Home size={22} />, tone: 'bg-amber-50 text-amber-600' },
    { to: '/tax/land', label: t('tax.land.title'), icon: <Map size={22} />, tone: 'bg-red-50 text-red-600' },
    { to: '/tax/profession', label: t('tax.profession.title'), icon: <Briefcase size={22} />, tone: 'bg-purple-50 text-purple-600' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">{t('dashboard.title')}</h1>
          <p className="mt-1 text-sm text-ink-500">{t('dashboard.greeting')}</p>
        </div>
        <Link
          to="/declarations"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700"
        >
          {t('dashboard.viewDeclarations')}
          <ArrowLeft size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<CalendarClock size={22} />}
          label={`${t('dashboard.monthlyDeduction')} ${monthLabel(month)} ${year}`}
          value={money(thisMonthTax)}
          sub={`${thisMonthRows.filter((r) => r.declared).length} ${t('dashboard.declared')}`}
          tone="brand"
        />
        <StatCard
          icon={<Users size={22} />}
          label={t('dashboard.activeEmployees')}
          value={fmt(employees.filter((e) => e.active).length)}
          sub={`${t('dashboard.totalMonthlySalaries')} ${moneyShort(employees.reduce((a, e) => a + e.basicSalary + e.allowances, 0))}`}
          tone="blue"
        />
        <StatCard
          icon={<Landmark size={22} />}
          label={`${t('dashboard.corporateTax')} ${year}`}
          value={money(corp.filter((r) => r.year === year).reduce((a, r) => a + r.tax, 0))}
          sub={`${t('dashboard.paid')} ${money(corp.filter((r) => r.year === year).reduce((a, r) => a + r.paid, 0))}`}
          tone="purple"
        />
        <StatCard
          icon={<AlertCircle size={22} />}
          label={t('dashboard.outstanding')}
          value={money(totalOutstanding)}
          sub={t('dashboard.dueNow')}
          tone={totalOutstanding > 0 ? 'red' : 'green'}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title={t('dashboard.monthlyWithholdingChart')}
            subtitle={`${t('dashboard.totalWithheldFor')} ${year}: ${money(byMonth.reduce((a, m) => a + m.total, 0))}`}
            action={
              <Badge tone="brand">
                <TrendingUp size={12} /> {t('dashboard.total')} {moneyShort(byMonth.reduce((a, m) => a + m.total, 0))}
              </Badge>
            }
          />
          <CardBody>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byMonth} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(m) => monthLabel(Number(m))}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => moneyShort(Number(v))}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    width={70}
                  />
                  <Tooltip formatter={(v) => money(Number(v))} labelFormatter={(m) => monthLabel(Number(m))} />
                  <Bar dataKey="total" name={t('common.tax')} fill="#059669" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('dashboard.annualDistribution')} subtitle={`${t('dashboard.total')} ${money(totalTaxYear)}`} />
          <CardBody>
            {yearTaxPie.length === 0 ? (
              <div className="py-10 text-center text-sm text-ink-400">{t('dashboard.noData')}</div>
            ) : (
              <>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={yearTaxPie}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={2}
                      >
                        {yearTaxPie.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => money(Number(v))} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  {yearTaxPie.map((x, i) => (
                    <div key={x.name} className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-1.5">
                      <span className="flex items-center gap-1.5 text-xs text-ink-600">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {x.name}
                      </span>
                      <span className="text-xs font-bold text-ink-800">{moneyShort(x.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title={t('dashboard.quickActions')} subtitle={t('dashboard.quickActionsDesc')} />
          <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">
            {quick.map((q) => (
              <Link
                key={q.to}
                to={q.to}
                className={cx(
                  'flex flex-col items-center gap-2 rounded-xl border border-ink-100 bg-white p-4 text-center transition hover:border-brand-300 hover:shadow-cardlg',
                )}
              >
                <div className={cx('flex h-11 w-11 items-center justify-center rounded-xl', q.tone)}>{q.icon}</div>
                <span className="text-xs font-semibold text-ink-700">{q.label}</span>
              </Link>
            ))}
          </CardBody>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader
            title={t('dashboard.latestOperations')}
            action={
              <Link to="/reports" className="text-xs font-medium text-brand-600 hover:underline">
                {t('dashboard.viewReports')}
              </Link>
            }
          />
          <CardBody className="p-0">
            <div className="divide-y divide-ink-100">
              {recent.map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cx(
                        'flex h-9 w-9 items-center justify-center rounded-lg',
                        r.kind === 'contract' && 'bg-violet-50 text-violet-600',
                        r.kind === 'property' && 'bg-amber-50 text-amber-600',
                      )}
                    >
                      {r.kind === 'contract' ? <FileSignature size={17} /> : <Home size={17} />}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-ink-800">{r.label}</div>
                      <div className="text-xs text-ink-400">{fmtDate(r.date)}</div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-ink-800">{money(r.amount)}</div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title={t('dashboard.annualEmployeeTax')} subtitle={`${t('dashboard.settlementFor')} ${year - 1}`} />
        <CardBody>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-ink-100 p-4">
              <div className="flex items-center gap-2 text-xs text-ink-500">
                <CircleDollarSign size={16} className="text-brand-600" /> {t('dashboard.totalAnnualTax')}
              </div>
              <div className="mt-1 text-xl font-bold text-ink-800">{money(annualTaxYear)}</div>
            </div>
            <div className="rounded-xl border border-ink-100 p-4">
              <div className="flex items-center gap-2 text-xs text-ink-500">
                <CircleDollarSign size={16} className="text-emerald-600" /> {t('dashboard.paidDuringYear')}
              </div>
              <div className="mt-1 text-xl font-bold text-ink-800">
                {money(annual.filter((r) => r.year === year - 1).reduce((a, r) => a + r.paidTax, 0))}
              </div>
            </div>
            <div className="rounded-xl border border-ink-100 p-4">
              <div className="flex items-center gap-2 text-xs text-ink-500">
                <CircleDollarSign size={16} className="text-red-600" /> {t('dashboard.differenceDueOrRefund')}
              </div>
              <div className="mt-1 text-xl font-bold text-ink-800">
                {money(annual.filter((r) => r.year === year - 1).reduce((a, r) => a + r.difference, 0))}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
