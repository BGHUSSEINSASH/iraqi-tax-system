import { useState } from 'react'
import { PenLine, Upload, CheckCircle2, FileCheck2, FileSignature, AlertTriangle, X } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { PageHead, Card, CardBody, CardHeader, Badge, Button, Input, Modal, useToast, DataTable, type Column } from '../components/ui'
import { fmtDate } from '../lib/format'
import { useI18n } from '../i18n'
import { clientName, taxNumber, phone, email } from '../lib/clientProfile'

type SignState = {
  signatureData: string | null
  name: string
  position: string
  timestamp: string
}

export default function ESignature() {
  const { data } = useApp()
  const { push } = useToast()
  const { t } = useI18n()

  const [open, setOpen] = useState(false)
  const [canvasKey, setCanvasKey] = useState(0)
  const [drawing, setDrawing] = useState(false)
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [signerName, setSignerName] = useState('')
  const [position, setPosition] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [signs, setSigns] = useState<Record<string, SignState>>({})
  const [certNote, setCertNote] = useState(false)

  const pending = data.invoices.filter((i) => i.status === 'pending')
  const signedCount = Object.keys(signs).length

  const getCoords = (e: React.PointerEvent) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const startDraw = (e: React.PointerEvent) => {
    const canvas = e.target as HTMLCanvasElement
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    setDrawing(true)
    const { x, y } = getCoords(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1e293b'
    ;(canvas as HTMLCanvasElement & { _last?: { x: number; y: number } })._last = { x, y }
  }

  const draw = (e: React.PointerEvent) => {
    if (!drawing) return
    const canvas = e.target as HTMLCanvasElement
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const last = (canvas as HTMLCanvasElement & { _last?: { x: number; y: number } })._last
    const { x, y } = getCoords(e)
    if (last) {
      ctx.beginPath()
      ctx.moveTo(last.x, last.y)
      ctx.lineTo(x, y)
      ctx.stroke()
    }
    ;(canvas as HTMLCanvasElement & { _last?: { x: number; y: number } })._last = { x, y }
  }

  const endDraw = (e: React.PointerEvent) => {
    if (!drawing) return
    setDrawing(false)
    const canvas = e.target as HTMLCanvasElement
    setSignatureData(canvas.toDataURL('image/png'))
  }

  const clearCanvas = () => {
    setSignatureData(null)
    setCanvasKey((k) => k + 1)
  }

  const openSign = (id: string) => {
    setPendingId(id)
    setSignatureData(null)
    setSignerName('')
    setPosition('')
    setCertNote(false)
    setCanvasKey((k) => k + 1)
    setOpen(true)
  }

  const confirmSign = () => {
    if (!signatureData) {
      push('error', t('pgSystem.eSignature.toast.drawFirst'))
      return
    }
    if (!signerName.trim()) {
      push('error', t('pgSystem.eSignature.toast.nameRequired'))
      return
    }
    if (pendingId) {
      setSigns((s) => ({
        ...s,
        [pendingId]: {
          signatureData,
          name: signerName.trim(),
          position: position.trim(),
          timestamp: new Date().toISOString(),
        },
      }))
    }
    setOpen(false)
    setPendingId(null)
    setCertNote(true)
    push('success', t('pgSystem.eSignature.toast.signed'))
  }

  const columns: Column<(typeof pending)[number]>[] = [
    {
      key: 'num',
      title: t('pgSystem.eSignature.col.num'),
      render: (r) => <span className="text-xs font-bold text-ink-700" dir="ltr">{r.id.slice(0, 8)}</span>,
    },
    { key: 'client', title: t('pgSystem.eSignature.col.client'), render: (r) => <span className="font-semibold text-ink-800">{r.client}</span> },
    {
      key: 'amount',
      title: t('pgSystem.eSignature.col.amount'),
      render: (r) => <span className="text-xs font-bold text-ink-700">{r.amount.toLocaleString('en-US')} د.ع</span>,
    },
    {
      key: 'date',
      title: t('pgSystem.eSignature.col.date'),
      render: (r) => <span className="text-xs text-ink-500">{r.date ? fmtDate(r.date) : '—'}</span>,
    },
    { key: 'status', title: t('pgSystem.eSignature.col.status'), render: () => <Badge tone="amber">{t('pgSystem.eSignature.status.pending')}</Badge> },
    {
      key: 'actions',
      title: '',
      render: (r) =>
        signs[r.id] ? (
          <Badge tone="green"><CheckCircle2 size={12} /> {t('pgSystem.eSignature.status.signed')}</Badge>
        ) : (
          <Button size="sm" onClick={() => openSign(r.id)}>
            <PenLine size={13} /> {t('pgSystem.eSignature.action.sign')}
          </Button>
        ),
    },
  ]

  return (
    <div>
      <PageHead
        title={t('pgSystem.eSignature.page.title')}
        desc={t('pgSystem.eSignature.page.desc', { clientName })}
      />

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-ink-500"><FileSignature size={15} className="text-brand-600" /> {t('pgSystem.eSignature.stat.pending')}</div>
          <div className="mt-1 text-xl font-bold text-ink-800">{pending.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-ink-500"><CheckCircle2 size={15} className="text-emerald-600" /> {t('pgSystem.eSignature.stat.signed')}</div>
          <div className="mt-1 text-xl font-bold text-emerald-700">{signedCount}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-ink-500"><FileCheck2 size={15} className="text-teal-600" /> {t('pgSystem.eSignature.stat.format')}</div>
          <div className="mt-1 text-xl font-bold text-ink-800">{t('pgSystem.eSignature.format.drawn')}</div>
          <div className="mt-0.5 text-xs text-ink-400">{t('pgSystem.eSignature.format.type')}</div>
        </Card>
        <Card className="p-4 bg-brand-600 text-white">
          <div className="text-xs text-emerald-100">{t('pgSystem.eSignature.stat.signedBy')}</div>
          <div className="mt-1 truncate text-sm font-bold" dir="ltr">{taxNumber}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title={t('pgSystem.eSignature.list.title')} subtitle={t('pgSystem.eSignature.list.subtitle')} />
          <CardBody className="p-0">
            <DataTable columns={columns} rows={pending} dense empty={t('pgSystem.eSignature.list.empty')} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('pgSystem.eSignature.cert.title')} subtitle={t('pgSystem.eSignature.cert.subtitle')} />
          <CardBody>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2">
                <span className="text-ink-500">{t('pgSystem.eSignature.cert.issuer')}</span>
                <span className="font-bold text-ink-700" dir="ltr">TAX-DSP</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2">
                <span className="text-ink-500">{t('pgSystem.eSignature.cert.entityName')}</span>
                <span className="font-bold text-ink-700">{clientName}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2">
                <span className="text-ink-500">{t('pgSystem.eSignature.cert.taxNo')}</span>
                <span className="font-bold text-ink-700" dir="ltr">{taxNumber}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2">
                <span className="text-ink-500">{t('pgSystem.eSignature.cert.validUntil')}</span>
                <span className="font-bold text-ink-700">2027-01-01</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2">
                <span className="text-ink-500">{t('pgSystem.eSignature.cert.status')}</span>
                <Badge tone="green">{t('pgSystem.eSignature.cert.active')}</Badge>
              </div>
            </div>
            <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-ink-50 px-3 py-2 text-[11px] leading-relaxed text-ink-500">
              <Upload size={13} className="mt-0.5 shrink-0 text-ink-400" />
              {t('pgSystem.eSignature.cert.note')}
            </p>
          </CardBody>
        </Card>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={t('pgSystem.eSignature.modal.title')}>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <span>{t('pgSystem.eSignature.modal.hint')}</span>
            <X size={14} className="cursor-pointer" onClick={clearCanvas} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-600">{t('pgSystem.eSignature.modal.signerName')}</label>
            <Input value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder={t('pgSystem.eSignature.modal.signerPlaceholder')} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-600">{t('pgSystem.eSignature.modal.position')}</label>
            <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder={t('pgSystem.eSignature.modal.positionPlaceholder')} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-600">{t('pgSystem.eSignature.modal.drawHere')}</label>
            <div className="relative">
              <canvas
                key={canvasKey}
                width={440}
                height={150}
                onPointerDown={startDraw}
                onPointerMove={draw}
                onPointerUp={endDraw}
                onPointerLeave={endDraw}
                className="w-full touch-none rounded-xl border-2 border-dashed border-ink-300 bg-white"
                style={{ touchAction: 'none' }}
              />
              {!signatureData && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-ink-300">
                  {t('pgSystem.eSignature.modal.drawHint')}
                </div>
              )}
            </div>
            <Button size="sm" variant="ghost" onClick={clearCanvas}>{t('pgSystem.eSignature.modal.clear')}</Button>
          </div>

          <div className="rounded-lg bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
            {t('pgSystem.eSignature.modal.confirmText')}
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-2 text-[11px] text-ink-500">
            <AlertTriangle size={13} className="shrink-0 text-amber-500" />
            {t('pgSystem.eSignature.modal.entityData', { clientName, email, phone })}
          </div>

          <Button className="w-full" onClick={confirmSign}>
            <PenLine size={16} /> {t('pgSystem.eSignature.modal.confirm')}
          </Button>
        </div>
      </Modal>

      {certNote && (
        <div className="fixed inset-x-0 bottom-4 z-40 mx-auto w-fit rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {t('pgSystem.eSignature.banner.signed')}
        </div>
      )}
    </div>
  )
}
