import { useMemo, useState } from 'react'
import { KeyRound, Plus, Copy, Trash2, Check, Play, Code2, Lock, Eye, EyeOff } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { PageHead, Card, CardBody, CardHeader, Badge, Button, Input, Textarea, Modal, useToast, DataTable, type Column } from '../components/ui'
import { fmtDateTime } from '../lib/format'
import { useI18n } from '../i18n'
import type { ApiKey } from '../lib/types'

export default function Api() {
  const { data, add, remove, update } = useApp()
  const { push } = useToast()
  const { t } = useI18n()
  const uid = () =>
    typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `key-${Date.now().toString(36)}`

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState('')

  const [testKey, setTestKey] = useState('')
  const [testResult, setTestResult] = useState<null | { status: number; body: string }>(null)

  const baseUrl = 'https://api.tax-office.example.com/v1'
  const activeKeys = data.apiKeys.filter((k) => k.status === 'active').length

  const revoke = (id: string) => {
    remove('apiKeys', id)
    push('success', t('pgSystem.api.toast.revoked'))
  }

  const copy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(id)
      push('success', t('pgSystem.api.toast.copied'))
      setTimeout(() => setCopied(''), 1500)
    })
  }

  const saveKey = () => {
    if (!name.trim()) {
      push('error', t('pgSystem.api.toast.nameRequired'))
      return
    }
    add('apiKeys', {
      id: uid(),
      name: name.trim(),
      key: 'tk_' + Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 12),
      status: 'active',
      lastUsed: '',
      created: new Date().toISOString(),
      notes: notes.trim(),
    })
    setName('')
    setNotes('')
    setOpen(false)
    push('success', t('pgSystem.api.toast.created'))
  }

  const testKeyCall = () => {
    if (!testKey.trim()) {
      push('error', t('pgSystem.api.toast.keyRequired'))
      return
    }
    const found = data.apiKeys.find((k) => k.key === testKey.trim())
    if (!found) {
      setTestResult({ status: 401, body: '{"error":{"message":"Invalid API key","code":"invalid_api_key"}}' })
      return
    }
    if (found.status !== 'active') {
      setTestResult({ status: 403, body: '{"error":{"message":"API key is revoked","code":"key_revoked"}}' })
      return
    }
    update('apiKeys', found.id, { lastUsed: new Date().toISOString() })
    const summary = {
      taxpayer_count: data.taxpayers.length,
      invoice_count: data.invoices.length,
      declared_rows: data.monthlyRows.filter((r) => r.declared).length,
      collection_total: data.invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + (i.amount || 0), 0),
      last_synced: new Date().toISOString(),
    }
    setTestResult({ status: 200, body: JSON.stringify(summary, null, 2) })
  }

  const columns: Column<ApiKey>[] = [
    { key: 'name', title: t('pgSystem.api.col.name'), render: (k) => <span className="font-semibold text-ink-800">{k.name}</span> },
    {
      key: 'key',
      title: t('pgSystem.api.col.key'),
      render: (k) => (
        <code className="rounded bg-ink-100 px-2 py-0.5 font-mono text-xs text-ink-700" dir="ltr">
          {revealed[k.id] ? k.key : '•'.repeat(Math.min(16, k.key.length))}
        </code>
      ),
    },
    {
      key: 'status',
      title: t('pgSystem.api.col.status'),
      render: (k) => (k.status === 'active' ? <Badge tone="green">{t('pgSystem.api.status.active')}</Badge> : <Badge tone="red">{t('pgSystem.api.status.revoked')}</Badge>),
    },
    {
      key: 'lastUsed',
      title: t('pgSystem.api.col.lastUsed'),
      render: (k) => <span className="text-xs text-ink-500">{k.lastUsed ? fmtDateTime(k.lastUsed) : t('pgSystem.api.lastUsedNever')}</span>,
    },
    {
      key: 'actions',
      title: '',
      render: (k) => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" title={t('pgSystem.api.action.showHide')} onClick={() => setRevealed((r) => ({ ...r, [k.id]: !r[k.id] }))}>
            {revealed[k.id] ? <EyeOff size={14} /> : <Eye size={14} />}
          </Button>
          <Button size="sm" variant="ghost" title={t('pgSystem.api.action.copy')} onClick={() => copy(k.key, k.id)}>
            {copied === k.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
          </Button>
          <Button size="sm" variant="ghost" className="text-ink-400 hover:text-red-600" title={t('pgSystem.api.action.revoke')} onClick={() => revoke(k.id)}>
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHead
        title={t('pgSystem.api.page.title')}
        desc={t('pgSystem.api.page.desc')}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> {t('pgSystem.api.page.newKey')}
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-ink-500"><KeyRound size={15} className="text-brand-600" /> {t('pgSystem.api.stat.activeKeys')}</div>
          <div className="mt-1 text-xl font-bold text-ink-800">{activeKeys}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-ink-500"><Lock size={15} className="text-teal-600" /> {t('pgSystem.api.stat.auth')}</div>
          <div className="mt-1 text-xl font-bold text-ink-800" dir="ltr">Bearer Token</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-ink-500"><Code2 size={15} className="text-violet-600" /> {t('pgSystem.api.stat.endpoint')}</div>
          <div className="mt-1 truncate font-mono text-xs text-ink-700" dir="ltr">{baseUrl}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title={t('pgSystem.api.list.title')} subtitle={t('pgSystem.api.list.subtitle')} />
          <CardBody className="p-0">
            <DataTable columns={columns} rows={data.apiKeys} dense empty={t('pgSystem.api.list.empty')} />
          </CardBody>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader title={t('pgSystem.api.test.title')} subtitle={t('pgSystem.api.test.subtitle')} />
            <CardBody>
              <Input
                value={testKey}
                onChange={(e) => setTestKey(e.target.value)}
                placeholder={t('pgSystem.api.test.placeholder')}
                dir="ltr"
                className="mb-2 font-mono"
              />
              <Button className="mb-3 w-full" variant="secondary" onClick={testKeyCall}>
                <Play size={15} /> {t('pgSystem.api.test.button')}
              </Button>
              {testResult && (
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-bold text-ink-500">{t('pgSystem.api.test.result')}</span>
                    <Badge tone={testResult.status === 200 ? 'green' : 'red'}>
                      HTTP {testResult.status}
                    </Badge>
                  </div>
                  <pre className="max-h-40 overflow-auto rounded-lg bg-ink-900 p-3 font-mono text-[11px] text-emerald-300" dir="ltr">
                    {testResult.body}
                  </pre>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t('pgSystem.api.example.title')} subtitle={t('pgSystem.api.example.subtitle')} />
            <CardBody>
              <pre className="overflow-auto rounded-lg bg-ink-900 p-3 font-mono text-[11px] leading-relaxed text-emerald-300" dir="ltr">
{`GET ${baseUrl}/clients
Authorization: Bearer {YOUR_KEY}

{
  "success": true,
  "data": [
    { "id": 1, "name": "${data.taxpayers[0]?.name ?? '...'}" }
  ]
}`}
              </pre>
              <p className="mt-3 flex items-start gap-1.5 text-[11px] text-ink-500">
                <Lock size={12} className="mt-0.5 shrink-0 text-ink-400" />
                {t('pgSystem.api.example.note')}
              </p>
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={t('pgSystem.api.modal.title')}>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-600">{t('pgSystem.api.modal.name')}</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('pgSystem.api.modal.namePlaceholder')} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-600">{t('pgSystem.api.modal.notes')}</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder={t('pgSystem.api.modal.notesPlaceholder')} />
          </div>
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {t('pgSystem.api.modal.warning')}
          </p>
          <Button className="w-full" onClick={saveKey}>{t('pgSystem.api.modal.create')}</Button>
        </div>
      </Modal>
    </div>
  )
}
