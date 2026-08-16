import { useMemo, useState } from 'react'
import { ShieldCheck, ShieldAlert, Monitor, MapPin, User, Search, Trash2 } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { PageHead, Card, CardHeader, CardBody, Badge, Button, SearchInput, Select, DataTable, useToast, type Column } from '../components/ui'
import type { LoginEntry } from '../lib/types'
import { useI18n } from '../i18n'
export default function LoginHistory() {
  const { data, remove } = useApp()
  const { push } = useToast()
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | 'success' | 'failed'>('all')

  const entries = useMemo(
    () =>
      data.loginHistory
        .filter((l) => (status === 'all' ? true : l.status === status))
        .filter(
          (l) =>
            !query ||
            l.user.toLowerCase().includes(query.toLowerCase()) ||
            l.ip.includes(query) ||
            l.location.includes(query),
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [data.loginHistory, query, status],
  )

  const success = data.loginHistory.filter((l) => l.status === 'success').length
  const failed = data.loginHistory.filter((l) => l.status === 'failed').length
  const successRate = data.loginHistory.length > 0 ? Math.round((success / data.loginHistory.length) * 100) : 0

  const columns: Column<LoginEntry>[] = [
    {
      key: 'date',
      title: t('pgAnalytics.loginHistory.col.date'),
      render: (l) => <span className="text-xs font-semibold text-ink-700" dir="ltr">{l.date}</span>,
    },
    {
      key: 'user',
      title: t('pgAnalytics.loginHistory.col.user'),
      render: (l) => (
        <span className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-100 text-ink-600"><User size={13} /></span>
          <span className="font-semibold text-ink-800" dir="ltr">{l.user}</span>
        </span>
      ),
    },
    {
      key: 'ip',
      title: t('pgAnalytics.loginHistory.col.ip'),
      render: (l) => <code className="rounded bg-ink-100 px-2 py-0.5 text-xs text-ink-700" dir="ltr">{l.ip}</code>,
    },
    {
      key: 'browser',
      title: t('pgAnalytics.loginHistory.col.browser'),
      render: (l) => (
        <span className="flex items-center gap-1.5 text-xs text-ink-600">
          <Monitor size={13} className="text-ink-400" /> {l.browser}
        </span>
      ),
    },
    {
      key: 'location',
      title: t('pgAnalytics.loginHistory.col.location'),
      render: (l) => (
        <span className="flex items-center gap-1.5 text-xs text-ink-600">
          <MapPin size={13} className="text-ink-400" /> {l.location}
        </span>
      ),
    },
    {
      key: 'status',
      title: t('pgAnalytics.loginHistory.col.status'),
      render: (l) =>
        l.status === 'success' ? <Badge tone="green">{t('pgAnalytics.loginHistory.col.success')}</Badge> : <Badge tone="red">{t('pgAnalytics.loginHistory.col.failed')}</Badge>,
    },
    {
      key: 'actions',
      title: '',
      render: (l) => (
        <Button
          size="sm"
          variant="ghost"
          className="text-ink-400 hover:text-red-600"
          onClick={() => {
            remove('loginHistory', l.id)
            push('success', t('pgAnalytics.loginHistory.toast.deleted'))
          }}
          title={t('pgAnalytics.loginHistory.col.delete')}
        >
          <Trash2 size={14} />
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHead
        title={t('pgAnalytics.loginHistory.page.title')}
        desc={t('pgAnalytics.loginHistory.page.desc')}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-ink-500"><Monitor size={15} className="text-brand-600" /> {t('pgAnalytics.loginHistory.stat.total')}</div>
          <div className="mt-1 text-xl font-bold text-ink-800">{data.loginHistory.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-ink-500"><ShieldCheck size={15} className="text-emerald-600" /> {t('pgAnalytics.loginHistory.stat.success')}</div>
          <div className="mt-1 text-xl font-bold text-emerald-700">{success}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-ink-500"><ShieldAlert size={15} className="text-red-600" /> {t('pgAnalytics.loginHistory.stat.failed')}</div>
          <div className="mt-1 text-xl font-bold text-red-600">{failed}</div>
        </Card>
        <Card className="p-4 bg-brand-600 text-white">
          <div className="text-xs text-emerald-100">{t('pgAnalytics.loginHistory.stat.successRate')}</div>
          <div className="mt-1 text-xl font-bold">{successRate}%</div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title={t('pgAnalytics.loginHistory.table.title')}
          subtitle={t('pgAnalytics.loginHistory.table.subtitle')}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput value={query} onChange={setQuery} placeholder={t('pgAnalytics.loginHistory.table.searchPlaceholder')} className="w-56" />
              <Select className="max-w-[130px]" value={status} onChange={(e) => setStatus(e.target.value as 'all' | 'success' | 'failed')}>
                <option value="all">{t('pgAnalytics.loginHistory.table.all')}</option>
                <option value="success">{t('pgAnalytics.loginHistory.table.success')}</option>
                <option value="failed">{t('pgAnalytics.loginHistory.table.failed')}</option>
              </Select>
            </div>
          }
        />
        <CardBody className="p-0">
          <DataTable columns={columns} rows={entries} dense empty={t('pgAnalytics.loginHistory.table.empty')} />
        </CardBody>
      </Card>
    </div>
  )
}
