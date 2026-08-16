import { useState } from 'react'
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { useI18n } from '../i18n'
import { PageHead, Card, CardHeader, CardBody, DataTable, Button, IconBtn, Badge, Modal, Field, Input, Select, Textarea, ConfirmDialog, useToast, EmptyState, type Column } from '../components/ui'
import type { Company } from '../lib/types'
import { fmtDate, uid } from '../lib/format'

const SECTORS: Company['sector'][] = ['private', 'public', 'mixed']

interface FormState {
  name: string
  taxId: string
  activity: string
  sector: Company['sector']
  address: string
  phone: string
  email: string
  notes: string
}

const emptyForm: FormState = {
  name: '',
  taxId: '',
  activity: '',
  sector: 'private',
  address: '',
  phone: '',
  email: '',
  notes: '',
}

export default function Companies() {
  const { data, add, update, remove, setActiveCompany, currentCompany } = useApp()
  const { t } = useI18n()
  const { push } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Company | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (c: Company) => {
    setEditing(c)
    setForm({
      name: c.name,
      taxId: c.taxId,
      activity: c.activity,
      sector: c.sector,
      address: c.address,
      phone: c.phone,
      email: c.email,
      notes: c.notes,
    })
    setModalOpen(true)
  }

  const save = () => {
    if (!form.name.trim()) {
      push('error', t('pgRegistry.companies.toast.nameRequired'))
      return
    }
    if (editing) {
      update('companies', editing.id, form)
      push('success', t('pgRegistry.companies.toast.updated'))
    } else {
      const c: Company = {
        id: uid(),
        ...form,
        createdAt: new Date().toISOString(),
      }
      add('companies', c)
      push('success', t('pgRegistry.companies.toast.added'))
    }
    setModalOpen(false)
  }

  const removeCompany = () => {
    if (!confirmId) return
    const wasActive = confirmId === data.activeCompanyId
    remove('companies', confirmId)
    if (wasActive) {
      const rest = data.companies.filter((c) => c.id !== confirmId)
      if (rest.length) setActiveCompany(rest[0].id)
    }
    setConfirmId(null)
    push('success', t('pgRegistry.companies.toast.deleted'))
  }

  const list = data.companies.filter((c) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return c.name.toLowerCase().includes(q) || c.taxId.includes(q) || c.activity.toLowerCase().includes(q)
  })

  const columns: Column<Company>[] = [
    {
      key: 'name',
      title: t('pgRegistry.companies.col.name'),
      render: (c) => (
        <div>
          <div className="font-semibold text-ink-800">{c.name}</div>
          <div className="text-xs text-ink-400">{c.activity}</div>
        </div>
      ),
    },
    { key: 'taxId', title: t('pgRegistry.companies.col.taxId'), render: (c) => <span dir="ltr">{c.taxId}</span> },
    {
      key: 'sector',
      title: t('pgRegistry.companies.col.sector'),
      render: (c) => <Badge tone={c.sector === 'private' ? 'brand' : c.sector === 'public' ? 'blue' : 'purple'}>{t(`pgRegistry.companies.sector.${c.sector}`)}</Badge>,
    },
    { key: 'address', title: t('pgRegistry.companies.col.address'), render: (c) => <span className="text-xs">{c.address || '—'}</span> },
    { key: 'phone', title: t('pgRegistry.companies.col.phone'), render: (c) => <span dir="ltr" className="text-xs">{c.phone || '—'}</span> },
    { key: 'createdAt', title: t('pgRegistry.companies.col.createdAt'), render: (c) => <span className="text-xs">{fmtDate(c.createdAt)}</span> },
    {
      key: 'active',
      title: t('pgRegistry.companies.col.status'),
      render: (c) => (c.id === data.activeCompanyId ? <Badge tone="green">{t('pgRegistry.companies.badge.active')}</Badge> : <Badge>{t('pgRegistry.companies.badge.inactive')}</Badge>),
    },
    {
      key: 'actions',
      title: '',
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          <IconBtn title={t('pgRegistry.companies.action.edit')} onClick={() => openEdit(c)}>
            <Pencil size={16} />
          </IconBtn>
          <IconBtn title={t('pgRegistry.companies.action.delete')} tone="danger" onClick={() => setConfirmId(c.id)}>
            <Trash2 size={16} />
          </IconBtn>
          {c.id !== data.activeCompanyId && (
            <Button size="sm" variant="secondary" onClick={() => setActiveCompany(c.id)}>
              {t('pgRegistry.companies.action.setActive')}
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHead
        title={t('pgRegistry.companies.page.title')}
        desc={t('pgRegistry.companies.page.desc')}
        actions={
          <Button onClick={openNew}>
            <Plus size={16} /> {t('pgRegistry.companies.page.add')}
          </Button>
        }
      />

      <Card>
        <CardHeader
          title={t('pgRegistry.companies.list.title')}
          subtitle={t('pgRegistry.companies.list.subtitle', { count: data.companies.length })}
          action={
            <input
              className="input max-w-[240px]"
              placeholder={t('pgRegistry.companies.search.placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          }
        />
        <CardBody className="p-0">
          {list.length === 0 ? (
            <EmptyState
              icon={<Building2 size={44} />}
              title={t('pgRegistry.companies.empty.title')}
              desc={t('pgRegistry.companies.empty.desc')}
              action={
                <Button onClick={openNew}>
                  <Plus size={16} /> {t('pgRegistry.companies.page.add')}
                </Button>
              }
            />
          ) : (
            <DataTable columns={columns} rows={list} />
          )}
        </CardBody>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t('pgRegistry.companies.modal.editTitle') : t('pgRegistry.companies.modal.addTitle')}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              {t('pgRegistry.common.cancel')}
            </Button>
            <Button onClick={save}>{editing ? t('pgRegistry.companies.modal.saveEdit') : t('pgRegistry.companies.modal.add')}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('pgRegistry.companies.modal.name')} required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t('pgRegistry.companies.modal.namePlaceholder')} />
          </Field>
          <Field label={t('pgRegistry.companies.modal.taxId')}>
            <Input dir="ltr" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} placeholder="4102012345" />
          </Field>
          <Field label={t('pgRegistry.companies.modal.activity')}>
            <Input value={form.activity} onChange={(e) => setForm({ ...form, activity: e.target.value })} placeholder={t('pgRegistry.companies.modal.activityPlaceholder')} />
          </Field>
          <Field label={t('pgRegistry.companies.modal.sector')}>
            <Select value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value as Company['sector'] })}>
              {SECTORS.map((id) => (
                <option key={id} value={id}>
                  {t(`pgRegistry.companies.sector.${id}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('pgRegistry.companies.modal.address')}>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder={t('pgRegistry.companies.modal.addressPlaceholder')} />
          </Field>
          <Field label={t('pgRegistry.companies.modal.phone')}>
            <Input dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="07xxxxxxxxx" />
          </Field>
          <Field label={t('pgRegistry.companies.modal.email')}>
            <Input dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="info@company.iq" />
          </Field>
          <Field label={t('pgRegistry.companies.modal.notes')}>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={t('pgRegistry.companies.modal.notesPlaceholder')} />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={removeCompany}
        title={t('pgRegistry.companies.confirm.title')}
        message={
          <>
            {t('pgRegistry.companies.confirm.message')}{' '}
            <b>{data.companies.find((c) => c.id === confirmId)?.name}</b>
          </>
        }
      />
    </div>
  )
}
