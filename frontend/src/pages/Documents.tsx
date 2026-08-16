import { useMemo, useState } from 'react'
import { useApp } from '../store/AppContext'
import { useI18n } from '../i18n'
import type { DocumentRecord } from '../lib/types'
import {
  PageHead,
  Card,
  CardBody,
  Button,
  DataTable,
  Badge,
  Field,
  Input,
  Select,
  Modal,
  ConfirmDialog,
  StatCard,
  useToast,
} from '../components/ui'
import { Plus, UploadCloud, FileText, Trash2, FolderOpen, Database, FileCheck } from 'lucide-react'

export default function Documents() {
  const { data, add, remove, currentCompany } = useApp()
  const { t } = useI18n()
  const { push } = useToast()

  const [openAdd, setOpenAdd] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Form State
  const [form, setForm] = useState<Partial<DocumentRecord>>({
    name: '',
    category: 'تأسيس',
    size: '1.5 MB',
  })

  const resetForm = () => {
    setForm({
      name: '',
      category: 'تأسيس',
      size: '1.5 MB',
    })
  }

  const list = useMemo(() => {
    const arr = data.documents || []
    return arr.filter((x) => x.companyId === data.activeCompanyId)
  }, [data.documents, data.activeCompanyId])

  const stats = useMemo(() => {
    const totalCount = list.length
    // sum up sizes
    let totalSize = 0.0
    list.forEach((x) => {
      const clean = x.size.replace(/[^\d.]/g, '')
      const f = parseFloat(clean)
      if (!isNaN(f)) totalSize += f
    })
    return {
      totalCount,
      totalSize: totalSize.toFixed(1) + ' MB',
    }
  }, [list])

  const handleUploadSimulate = () => {
    if (!form.name) {
      push('error', t('pgDocs.documents.nameRequired'))
      return
    }
    const newId = 'DOC-' + Date.now()
    const item: DocumentRecord = {
      id: newId,
      companyId: data.activeCompanyId,
      name: form.name || '',
      category: form.category || 'تأسيس',
      size: form.size || '1.5 MB',
      date: new Date().toISOString().slice(0, 10),
      url: '#',
    }
    add('documents', item)
    push('success', t('pgDocs.documents.uploadSuccess'))
    setOpenAdd(false)
    resetForm()
  }

  const handleDelete = () => {
    if (!deleteId) return
    remove('documents', deleteId)
    push('success', t('pgDocs.documents.deleteSuccess'))
    setDeleteId(null)
  }

  const columns = [
    {
      key: 'name',
      title: t('pgDocs.documents.colFileName'),
      render: (r: DocumentRecord) => (
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-brand-600" />
          <span className="font-semibold text-ink-800">{r.name}</span>
        </div>
      ),
    },
    { key: 'category', title: t('pgDocs.documents.colCategory') },
    { key: 'size', title: t('pgDocs.documents.colFileSize'), className: 'font-mono text-xs text-ink-500' },
    { key: 'date', title: t('pgDocs.documents.colUploadDate'), className: 'font-mono text-xs text-ink-500' },
    {
      key: 'actions',
      title: t('pgDocs.common.actions'),
      render: (r: DocumentRecord) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setDeleteId(r.id)} className="text-red-600 hover:bg-red-50" title={t('pgDocs.common.delete')}>
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHead
        title={t('pgDocs.documents.pageTitle')}
        desc={t('pgDocs.documents.pageDesc', { company: currentCompany?.name ?? t('pgDocs.documents.noCompany') })}
        actions={
          <Button onClick={() => setOpenAdd(true)}>
            <Plus size={16} className="ml-1.5" />
            {t('pgDocs.documents.uploadNew')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<FolderOpen size={22} />} label={t('pgDocs.documents.totalUploaded')} value={stats.totalCount} tone="brand" />
        <StatCard icon={<Database size={22} />} label={t('pgDocs.documents.storageUsed')} value={stats.totalSize} tone="amber" />
        <StatCard icon={<FileCheck size={22} />} label={t('pgDocs.documents.securityStatus')} value={t('pgDocs.documents.secureCloud')} tone="green" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Upload Box (Simulation) */}
        <div className="lg:col-span-4">
          <Card className="h-full border-2 border-dashed border-ink-300">
            <CardBody className="flex flex-col items-center justify-center p-8 text-center h-full">
              <UploadCloud size={48} className="text-brand-500 animate-bounce mb-3" />
              <h4 className="font-bold text-ink-800 text-sm">{t('pgDocs.documents.dragDrop')}</h4>
              <p className="text-xs text-ink-400 mt-1.5 max-w-[200px] leading-relaxed">
                {t('pgDocs.documents.dragDropHint')}
              </p>
              <div className="mt-5 w-full">
                <Button onClick={() => setOpenAdd(true)} className="w-full">
                  {t('pgDocs.documents.browseFiles')}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Documents Table */}
        <div className="lg:col-span-8">
          <Card>
            <CardBody>
              <h3 className="text-sm font-bold text-ink-800 border-b border-ink-100 pb-2.5 mb-4 flex items-center gap-1.5">
                <FileText size={15} className="text-brand-600" />
                {t('pgDocs.documents.recordTitle')}
              </h3>
              <DataTable columns={columns} rows={list} />
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Add Modal */}
      <Modal open={openAdd} onClose={() => setOpenAdd(false)} title={t('pgDocs.documents.uploadModalTitle')}>
        <div className="grid grid-cols-1 gap-4">
          <Field label={t('pgDocs.documents.docName')} required>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t('pgDocs.documents.docNamePlaceholder')}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('pgDocs.documents.docCategory')}>
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="تأسيس">{t('pgDocs.documents.catFoundation')}</option>
                <option value="ميزانية">{t('pgDocs.documents.catBudget')}</option>
                <option value="عقارات">{t('pgDocs.documents.catRealEstate')}</option>
                <option value="عقود">{t('pgDocs.documents.catContracts')}</option>
                <option value="أخرى">{t('pgDocs.documents.catOther')}</option>
              </Select>
            </Field>
            <Field label={t('pgDocs.documents.defaultFileSize')}>
              <Select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })}>
                <option value="1.2 MB">{t('pgDocs.documents.sizeMedium', { size: '1.2 MB' })}</option>
                <option value="2.5 MB">{t('pgDocs.documents.sizeLarge', { size: '2.5 MB' })}</option>
                <option value="4.1 MB">{t('pgDocs.documents.sizeCombined', { size: '4.1 MB' })}</option>
                <option value="512 KB">{t('pgDocs.documents.sizeLight', { size: '512 KB' })}</option>
              </Select>
            </Field>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpenAdd(false)}>{t('pgDocs.common.cancel')}</Button>
          <Button onClick={handleUploadSimulate}>{t('pgDocs.documents.confirmUpload')}</Button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t('pgDocs.documents.deleteConfirmTitle')}
        message={t('pgDocs.documents.deleteConfirmMessage')}
      />
    </div>
  )
}
