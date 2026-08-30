import { useEffect, useState } from 'react'
import { Database, Download, Upload, Save, RotateCcw, Trash2, Clock, CheckCircle2, FileJson } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { PageHead, Card, CardHeader, CardBody, Button, Badge, useToast } from '../components/ui'
import { fmtDate, downloadText } from '../lib/format'
import { useI18n } from '../i18n'

const LS_BACKUPS = 'tax_iq_backups_v1'
const LS_AUTO = 'tax_iq_autobackup_v1'

interface BackupEntry {
  id: string
  date: string
  size: number
  records: number
}

export default function Backup() {
  const { data, replace, resetData } = useApp()
  const { push } = useToast()
  const { t } = useI18n()

  const [backups, setBackups] = useState<BackupEntry[]>([])
  const [autoBackup, setAutoBackup] = useState(false)

  useEffect(() => {
    try {
      setBackups(JSON.parse(localStorage.getItem(LS_BACKUPS) || '[]'))
      setAutoBackup(localStorage.getItem(LS_AUTO) === '1')
    } catch {
      /* ignore */
    }
  }, [])

  const persist = (list: BackupEntry[]) => {
    setBackups(list)
    localStorage.setItem(LS_BACKUPS, JSON.stringify(list))
  }

  const countRecords = () =>
    (data.companies.length || 0) +
    data.employees.length +
    data.monthlyRows.length +
    data.annualRows.length +
    data.invoices.length +
    data.tasks.length +
    data.tickets.length +
    data.appointments.length

  const createBackup = () => {
    const json = JSON.stringify(data)
    const entry: BackupEntry = {
      id: 'bk-' + Date.now().toString(36),
      date: new Date().toISOString(),
      size: new Blob([json]).size,
      records: countRecords(),
    }
    persist([entry, ...backups].slice(0, 20))
    localStorage.setItem(`tax_iq_snapshot_${entry.id}`, json)
    push('success', t('pgSystem.backup.toast.created'))
  }

  const restore = (entry: BackupEntry) => {
    try {
      const raw = localStorage.getItem(`tax_iq_snapshot_${entry.id}`)
      if (!raw) {
        push('error', t('pgSystem.backup.toast.notFound'))
        return
      }
      const parsed = JSON.parse(raw)
      replace('companies', parsed.companies ?? [])
      replace('employees', parsed.employees ?? [])
      replace('invoices', parsed.invoices ?? [])
      resetData()
      push('success', t('pgSystem.backup.toast.restored', { date: fmtDate(entry.date) }))
    } catch {
      push('error', t('pgSystem.backup.toast.corrupt'))
    }
  }

  const removeBackup = (entry: BackupEntry) => {
    persist(backups.filter((b) => b.id !== entry.id))
    localStorage.removeItem(`tax_iq_snapshot_${entry.id}`)
    push('success', t('pgSystem.backup.toast.deleted'))
  }

  const exportFile = () => {
    downloadText(`tax-iq-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), 'application/json')
    push('success', t('pgSystem.backup.toast.exported'))
  }

  const importFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        if (!parsed.companies || !Array.isArray(parsed.companies)) throw new Error('invalid')
        resetData()
        replace('companies', parsed.companies)
        replace('employees', parsed.employees ?? [])
        replace('invoices', parsed.invoices ?? [])
        push('success', t('pgSystem.backup.toast.imported'))
      } catch {
        push('error', t('pgSystem.backup.toast.invalidFile'))
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const toggleAuto = (v: boolean) => {
    setAutoBackup(v)
    localStorage.setItem(LS_AUTO, v ? '1' : '0')
    push('success', t(v ? 'pgSystem.backup.toast.autoOn' : 'pgSystem.backup.toast.autoOff'))
  }

  const fmtSize = (n: number) => {
    if (n < 1024) return n + ' B'
    if (n < 1048576) return (n / 1024).toFixed(1) + ' KB'
    return (n / 1048576).toFixed(2) + ' MB'
  }

  const lastBackupDate = backups[0]?.date

  return (
    <div>
      <PageHead title={t('pgSystem.backup.page.title')} desc={t('pgSystem.backup.page.desc')} />

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-ink-500"><Clock size={15} className="text-brand-600" /> {t('pgSystem.backup.stat.lastBackup')}</div>
          <div className="mt-1 text-lg font-bold text-ink-800">{lastBackupDate ? fmtDate(lastBackupDate) : t('pgSystem.backup.stat.lastBackupEmpty')}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-ink-500"><Database size={15} className="text-teal-600" /> {t('pgSystem.backup.stat.savedCount')}</div>
          <div className="mt-1 text-lg font-bold text-ink-800">{backups.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-ink-500"><FileJson size={15} className="text-violet-600" /> {t('pgSystem.backup.stat.archivedRecords')}</div>
          <div className="mt-1 text-lg font-bold text-ink-800">{backups[0]?.records ?? 0}</div>
        </Card>
      </div>

      <Card className="mb-5">
        <CardHeader title={t('pgSystem.backup.actions.title')} subtitle={t('pgSystem.backup.actions.subtitle')} />
        <CardBody>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={createBackup}><Save size={16} /> {t('pgSystem.backup.actions.createNow')}</Button>
            <Button variant="secondary" onClick={exportFile}><Download size={16} /> {t('pgSystem.backup.actions.exportJson')}</Button>
            <label className="cursor-pointer">
              <input type="file" accept="application/json" className="hidden" onChange={importFile} />
              <span className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100">
                <Upload size={16} /> {t('pgSystem.backup.actions.restoreFromFile')}
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink-600">
              <input
                type="checkbox"
                checked={autoBackup}
                onChange={(e) => toggleAuto(e.target.checked)}
                className="h-4 w-4 accent-brand-600"
              />
              {t('pgSystem.backup.actions.autoDaily')}
            </label>
          </div>
          <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-ink-50 px-3 py-2 text-xs leading-relaxed text-ink-500">
            <Database size={13} className="mt-0.5 shrink-0 text-ink-400" />
            {t('pgSystem.backup.actions.note')}
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t('pgSystem.backup.history.title')} subtitle={t('pgSystem.backup.history.subtitle')} />
        <CardBody className="p-0">
          {backups.length === 0 ? (
            <p className="py-14 text-center text-sm text-ink-400">{t('pgSystem.backup.history.empty')}</p>
          ) : (
            <div className="divide-y divide-ink-100">
              {backups.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-ink-50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-ink-800">{fmtDate(b.date)}</div>
                      <div className="text-xs text-ink-400">
                        {t('pgSystem.backup.history.records', { count: b.records, size: fmtSize(b.size) })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="green">{t('pgSystem.backup.history.valid')}</Badge>
                    <Button size="sm" variant="ghost" title={t('pgSystem.backup.history.restore')} onClick={() => restore(b)}>
                      <RotateCcw size={14} />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-ink-400 hover:text-red-600" title={t('pgSystem.backup.history.delete')} onClick={() => removeBackup(b)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
