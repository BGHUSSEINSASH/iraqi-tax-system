import { useMemo, useState } from 'react'
import { useApp } from '../store/AppContext'
import type { AuditEntry } from '../lib/types'
import {
  PageHead,
  Card,
  CardBody,
  Button,
  DataTable,
  SearchInput,
  StatCard,
  useToast,
  ConfirmDialog,
} from '../components/ui'
import { History, Shield, Trash2, ShieldCheck, Activity } from 'lucide-react'
import { useI18n } from '../i18n'

export default function AuditLog() {
  const { data, replace } = useApp()
  const { push } = useToast()
  const { t } = useI18n()

  const [q, setQ] = useState('')
  const [openClear, setOpenClear] = useState(false)

  const list = useMemo(() => {
    const arr = [...(data.auditLogs || [])]
    // reverse to show newest first
    arr.reverse()
    return arr.filter((x) =>
      x.action.toLowerCase().includes(q.toLowerCase()) ||
      x.user.toLowerCase().includes(q.toLowerCase()) ||
      x.details.toLowerCase().includes(q.toLowerCase())
    )
  }, [data.auditLogs, q])

  const stats = useMemo(() => {
    const arr = data.auditLogs || []
    return {
      total: arr.length,
      adminCount: arr.filter((x) => x.user.includes('مدير') || x.user === 'admin').length,
      actionsCount: arr.filter((x) => x.action !== 'تسجيل دخول').length,
    }
  }, [data.auditLogs])

  const handleClear = () => {
    replace('auditLogs', [])
    push('success', t('pgAnalytics.auditLog.toast.cleared'))
    setOpenClear(false)
  }

  const columns = [
    { key: 'id', title: t('pgAnalytics.auditLog.col.id'), className: 'font-mono text-xs text-ink-500' },
    { key: 'action', title: t('pgAnalytics.auditLog.col.action'), className: 'font-bold text-ink-800' },
    { key: 'user', title: t('pgAnalytics.auditLog.col.user') },
    { key: 'details', title: t('pgAnalytics.auditLog.col.details'), className: 'text-xs text-ink-500 max-w-sm truncate' },
    { key: 'time', title: t('pgAnalytics.auditLog.col.time'), className: 'font-mono text-xs text-ink-500' },
  ]

  return (
    <div className="space-y-6">
      <PageHead
        title={t('pgAnalytics.auditLog.page.title')}
        desc={t('pgAnalytics.auditLog.page.desc')}
        actions={
          <Button variant="danger" onClick={() => setOpenClear(true)} disabled={list.length === 0}>
            <Trash2 size={16} className="ml-1.5" />
            {t('pgAnalytics.auditLog.clear')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<History size={22} />} label={t('pgAnalytics.auditLog.stat.total')} value={stats.total} tone="brand" />
        <StatCard icon={<Shield size={22} />} label={t('pgAnalytics.auditLog.stat.admin')} value={stats.adminCount} tone="green" />
        <StatCard icon={<Activity size={22} />} label={t('pgAnalytics.auditLog.stat.actions')} value={stats.actionsCount} tone="amber" />
      </div>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SearchInput className="w-full max-w-xs" value={q} onChange={setQ} placeholder={t('pgAnalytics.auditLog.searchPlaceholder')} />
            
            <div className="text-xs text-ink-400 font-semibold flex items-center gap-1">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>{t('pgAnalytics.auditLog.sslNote')}</span>
            </div>
          </div>

          <DataTable columns={columns} rows={list} />
        </CardBody>
      </Card>

      {/* Clear Confirm */}
      <ConfirmDialog
        open={openClear}
        onClose={() => setOpenClear(false)}
        onConfirm={handleClear}
        title={t('pgAnalytics.auditLog.confirm.title')}
        message={t('pgAnalytics.auditLog.confirm.message')}
      />
    </div>
  )
}
