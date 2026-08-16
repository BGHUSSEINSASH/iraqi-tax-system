import { useMemo, useState } from 'react'
import { useApp } from '../store/AppContext'
import { useI18n } from '../i18n'
import type { Taxpayer } from '../lib/types'
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
  SearchInput,
  StatCard,
  useToast,
} from '../components/ui'
import { Plus, Users, UserCheck, ShieldAlert, Trash2, Edit } from 'lucide-react'

export default function Taxpayers() {
  const { data, add, update, remove } = useApp()
  const { t } = useI18n()
  const { push } = useToast()
  
  const [q, setQ] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  
  const [openAdd, setOpenAdd] = useState(false)
  const [editTp, setEditTp] = useState<Taxpayer | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Form State
  const [form, setForm] = useState<Partial<Taxpayer>>({
    taxId: '',
    name: '',
    type: 'company',
    province: 'بغداد',
    phone: '',
    email: '',
    address: '',
    status: 'active',
  })

  const resetForm = () => {
    setForm({
      taxId: '',
      name: '',
      type: 'company',
      province: 'بغداد',
      phone: '',
      email: '',
      address: '',
      status: 'active',
    })
  }

  const list = useMemo(() => {
    return (data.taxpayers || []).filter((x) => {
      const matchQ =
        x.name.toLowerCase().includes(q.toLowerCase()) ||
        x.taxId.toLowerCase().includes(q.toLowerCase()) ||
        x.phone.includes(q)
      const matchType = typeFilter === 'all' || x.type === typeFilter
      const matchStatus = statusFilter === 'all' || x.status === statusFilter
      return matchQ && matchType && matchStatus
    })
  }, [data.taxpayers, q, typeFilter, statusFilter])

  const stats = useMemo(() => {
    const tps = data.taxpayers || []
    return {
      total: tps.length,
      active: tps.filter((x) => x.status === 'active').length,
      suspended: tps.filter((x) => x.status === 'suspended').length,
    }
  }, [data.taxpayers])

  const handleAdd = () => {
    if (!form.taxId || !form.name) {
      push('error', t('pgRegistry.taxpayers.toast.required'))
      return
    }
    const newId = 'TP-' + String((data.taxpayers || []).length + 1).padStart(3, '0')
    const item: Taxpayer = {
      id: newId,
      taxId: form.taxId || '',
      name: form.name || '',
      type: form.type || 'company',
      province: form.province || 'بغداد',
      phone: form.phone || '',
      email: form.email || '',
      address: form.address || '',
      status: form.status || 'active',
    }
    add('taxpayers', item)
    push('success', t('pgRegistry.taxpayers.toast.added'))
    setOpenAdd(false)
    resetForm()
  }

  const handleEditSave = () => {
    if (!editTp) return
    if (!editTp.taxId || !editTp.name) {
      push('error', t('pgRegistry.taxpayers.toast.editRequired'))
      return
    }
    update('taxpayers', editTp.id, editTp)
    push('success', t('pgRegistry.taxpayers.toast.updated'))
    setEditTp(null)
  }

  const handleDelete = () => {
    if (!deleteId) return
    remove('taxpayers', deleteId)
    push('success', t('pgRegistry.taxpayers.toast.deleted'))
    setDeleteId(null)
  }

  const columns = [
    { key: 'taxId', title: t('pgRegistry.taxpayers.col.taxId'), className: 'font-mono' },
    { key: 'name', title: t('pgRegistry.taxpayers.col.name') },
    {
      key: 'type',
      title: t('pgRegistry.taxpayers.col.type'),
      render: (r: Taxpayer) => {
        return <span>{t(`pgRegistry.taxpayers.type.${r.type}`)}</span>
      },
    },
    { key: 'province', title: t('pgRegistry.taxpayers.col.province') },
    { key: 'phone', title: t('pgRegistry.taxpayers.col.phone'), className: 'font-mono' },
    {
      key: 'status',
      title: t('pgRegistry.taxpayers.col.status'),
      render: (r: Taxpayer) => {
        if (r.status === 'active') return <Badge tone="green">{t('pgRegistry.taxpayers.status.active')}</Badge>
        if (r.status === 'inactive') return <Badge tone="slate">{t('pgRegistry.taxpayers.status.inactive')}</Badge>
        return <Badge tone="red">{t('pgRegistry.taxpayers.status.suspended')}</Badge>
      },
    },
    {
      key: 'actions',
      title: t('pgRegistry.taxpayers.col.actions'),
      render: (r: Taxpayer) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setEditTp(r)} title={t('pgRegistry.taxpayers.action.edit')}>
            <Edit size={14} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteId(r.id)} className="text-red-600 hover:bg-red-50" title={t('pgRegistry.taxpayers.action.delete')}>
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHead
        title={t('pgRegistry.taxpayers.page.title')}
        desc={t('pgRegistry.taxpayers.page.desc')}
        actions={
          <Button onClick={() => setOpenAdd(true)}>
            <Plus size={16} className="ml-1.5" />
            {t('pgRegistry.taxpayers.page.add')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<Users size={22} />} label={t('pgRegistry.taxpayers.stat.total')} value={stats.total} tone="brand" />
        <StatCard icon={<UserCheck size={22} />} label={t('pgRegistry.taxpayers.stat.active')} value={stats.active} tone="green" />
        <StatCard icon={<ShieldAlert size={22} />} label={t('pgRegistry.taxpayers.stat.suspended')} value={stats.suspended} tone="red" />
      </div>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput className="w-full max-w-xs" value={q} onChange={setQ} placeholder={t('pgRegistry.taxpayers.search.placeholder')} />
            
            <Select className="w-40 py-1.5 text-xs" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">{t('pgRegistry.taxpayers.filter.allTypes')}</option>
              <option value="company">{t('pgRegistry.taxpayers.filter.companies')}</option>
              <option value="individual">{t('pgRegistry.taxpayers.filter.individuals')}</option>
              <option value="government">{t('pgRegistry.taxpayers.filter.government')}</option>
            </Select>

            <Select className="w-40 py-1.5 text-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">{t('pgRegistry.taxpayers.filter.allStatuses')}</option>
              <option value="active">{t('pgRegistry.taxpayers.filter.active')}</option>
              <option value="inactive">{t('pgRegistry.taxpayers.filter.inactive')}</option>
              <option value="suspended">{t('pgRegistry.taxpayers.filter.suspended')}</option>
            </Select>
          </div>

          <DataTable columns={columns} rows={list} />
        </CardBody>
      </Card>

      {/* Add Modal */}
      <Modal open={openAdd} onClose={() => setOpenAdd(false)} title={t('pgRegistry.taxpayers.modal.addTitle')}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('pgRegistry.taxpayers.modal.taxId')} required>
            <Input
              value={form.taxId}
              onChange={(e) => setForm({ ...form, taxId: e.target.value })}
              placeholder={t('pgRegistry.taxpayers.modal.taxIdPlaceholder')}
            />
          </Field>
          <Field label={t('pgRegistry.taxpayers.modal.name')} required>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t('pgRegistry.taxpayers.modal.namePlaceholder')}
            />
          </Field>
          <Field label={t('pgRegistry.taxpayers.modal.type')}>
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
              <option value="company">{t('pgRegistry.taxpayers.modal.typeCompany')}</option>
              <option value="individual">{t('pgRegistry.taxpayers.modal.typeIndividual')}</option>
              <option value="government">{t('pgRegistry.taxpayers.modal.typeGovernment')}</option>
            </Select>
          </Field>
          <Field label={t('pgRegistry.taxpayers.modal.province')}>
            <Input
              value={form.province}
              onChange={(e) => setForm({ ...form, province: e.target.value })}
              placeholder={t('pgRegistry.taxpayers.modal.provincePlaceholder')}
            />
          </Field>
          <Field label={t('pgRegistry.taxpayers.modal.phone')}>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder={t('pgRegistry.taxpayers.modal.phonePlaceholder')}
            />
          </Field>
          <Field label={t('pgRegistry.taxpayers.modal.email')}>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder={t('pgRegistry.taxpayers.modal.emailPlaceholder')}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label={t('pgRegistry.taxpayers.modal.address')}>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder={t('pgRegistry.taxpayers.modal.addressPlaceholder')}
              />
            </Field>
          </div>
          <Field label={t('pgRegistry.taxpayers.modal.status')}>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
              <option value="active">{t('pgRegistry.taxpayers.modal.statusActive')}</option>
              <option value="inactive">{t('pgRegistry.taxpayers.modal.statusInactive')}</option>
              <option value="suspended">{t('pgRegistry.taxpayers.modal.statusSuspended')}</option>
            </Select>
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpenAdd(false)}>{t('pgRegistry.common.cancel')}</Button>
          <Button onClick={handleAdd}>{t('pgRegistry.taxpayers.modal.save')}</Button>
        </div>
      </Modal>

      {/* Edit Modal */}
      {editTp && (
        <Modal open={true} onClose={() => setEditTp(null)} title={t('pgRegistry.taxpayers.modal.editTitle')}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('pgRegistry.taxpayers.modal.taxId')} required>
              <Input
                value={editTp.taxId}
                onChange={(e) => setEditTp({ ...editTp, taxId: e.target.value })}
              />
            </Field>
            <Field label={t('pgRegistry.taxpayers.modal.name')} required>
              <Input
                value={editTp.name}
                onChange={(e) => setEditTp({ ...editTp, name: e.target.value })}
              />
            </Field>
            <Field label={t('pgRegistry.taxpayers.modal.type')}>
              <Select value={editTp.type} onChange={(e) => setEditTp({ ...editTp, type: e.target.value as any })}>
                <option value="company">{t('pgRegistry.taxpayers.modal.typeCompany')}</option>
                <option value="individual">{t('pgRegistry.taxpayers.modal.typeIndividual')}</option>
                <option value="government">{t('pgRegistry.taxpayers.modal.typeGovernment')}</option>
              </Select>
            </Field>
            <Field label={t('pgRegistry.taxpayers.modal.province')}>
              <Input
                value={editTp.province}
                onChange={(e) => setEditTp({ ...editTp, province: e.target.value })}
              />
            </Field>
            <Field label={t('pgRegistry.taxpayers.modal.phone')}>
              <Input
                value={editTp.phone}
                onChange={(e) => setEditTp({ ...editTp, phone: e.target.value })}
              />
            </Field>
            <Field label={t('pgRegistry.taxpayers.modal.email')}>
              <Input
                type="email"
                value={editTp.email}
                onChange={(e) => setEditTp({ ...editTp, email: e.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label={t('pgRegistry.taxpayers.modal.address')}>
                <Input
                  value={editTp.address}
                  onChange={(e) => setEditTp({ ...editTp, address: e.target.value })}
                />
              </Field>
            </div>
            <Field label={t('pgRegistry.taxpayers.modal.status')}>
              <Select value={editTp.status} onChange={(e) => setEditTp({ ...editTp, status: e.target.value as any })}>
                <option value="active">{t('pgRegistry.taxpayers.modal.statusActive')}</option>
                <option value="inactive">{t('pgRegistry.taxpayers.modal.statusInactive')}</option>
                <option value="suspended">{t('pgRegistry.taxpayers.modal.statusSuspended')}</option>
              </Select>
            </Field>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditTp(null)}>{t('pgRegistry.common.cancel')}</Button>
            <Button onClick={handleEditSave}>{t('pgRegistry.taxpayers.modal.update')}</Button>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t('pgRegistry.taxpayers.confirm.title')}
        message={t('pgRegistry.taxpayers.confirm.message')}
      />
    </div>
  )
}
