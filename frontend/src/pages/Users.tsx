import { useMemo, useState } from 'react'
import { Users as UsersIcon, UserPlus, Shield, Trash2, Check, X } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { useI18n } from '../i18n'
import {
  PageHead, Card, CardHeader, CardBody, Button, Input, Select, Badge,
  Modal, useToast, DataTable, type Column,
} from '../components/ui'
import { uid } from '../lib/format'
import type { User } from '../lib/types'

const ROLE_TONE: Record<User['role'], 'brand' | 'amber' | 'purple'> = {
  founder: 'purple',
  admin: 'brand',
  accountant: 'amber',
}

const roleLabel = (role: User['role']) => {
  if (role === 'founder') return 'مؤسس النظام'
  if (role === 'admin') return 'مدير النظام'
  return 'محاسب ضريبي'
}

export default function Users() {
  const { data, add, remove } = useApp()
  const { t } = useI18n()
  const { push } = useToast()

  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<User['role']>('accountant')

  const users = useMemo(() => data.users, [data.users])

  const save = () => {
    if (!username.trim() || !fullName.trim() || !password.trim()) {
      push('error', t('pgRegistry.users.toast.required'))
      return
    }
    if (users.some((u) => u.username.toLowerCase() === username.trim().toLowerCase())) {
      push('error', t('pgRegistry.users.toast.usernameTaken'))
      return
    }
    add('users', {
      id: uid(),
      username: username.trim(),
      name: fullName.trim(),
      password: password.trim(),
      role,
      status: 'active',
    })
    setUsername('')
    setFullName('')
    setPassword('')
    setRole('accountant')
    setOpen(false)
    push('success', t('pgRegistry.users.toast.added'))
  }

  const del = (u: User) => {
    if (u.username === 'admin' || u.role === 'founder') {
      push('error', t('pgRegistry.users.toast.cannotDeleteAdmin'))
      return
    }
    remove('users', u.id)
    push('success', t('pgRegistry.users.toast.deleted'))
  }

  const columns: Column<User>[] = [
    {
      key: 'username',
      title: t('pgRegistry.users.col.username'),
      render: (u) => (
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Shield size={15} />
          </div>
          <div>
            <div className="font-semibold text-ink-800" dir="ltr">{u.username}</div>
            <div className="text-xs text-ink-400" dir="ltr">{u.id}</div>
          </div>
        </div>
      ),
    },
    { key: 'name', title: t('pgRegistry.users.col.fullName'), render: (u) => <span className="text-ink-700">{u.name}</span> },
    {
      key: 'role',
      title: t('pgRegistry.users.col.role'),
      render: (u) => <Badge tone={ROLE_TONE[u.role]}>{roleLabel(u.role)}</Badge>,
    },
    {
      key: 'status',
      title: t('pgRegistry.users.col.status'),
      render: (u) =>
        u.status === 'suspended' ? (
          <Badge tone="red">معلّق</Badge>
        ) : u.username === 'admin' || u.role === 'founder' ? (
          <Badge tone="green"><Check size={12} /> {t('pgRegistry.users.status.active')}</Badge>
        ) : (
          <Badge tone="slate">{t('pgRegistry.users.status.registered')}</Badge>
        ),
    },
    {
      key: 'actions',
      title: '',
      render: (u) => (
        <Button
          size="sm"
          variant="ghost"
          className="text-ink-400 hover:text-red-600"
          onClick={() => del(u)}
          title={t('pgRegistry.users.action.delete')}
        >
          {u.username === 'admin' || u.role === 'founder' ? <X size={14} /> : <Trash2 size={14} />}
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHead
        title={t('pgRegistry.users.page.title')}
        desc={t('pgRegistry.users.page.desc')}
        actions={
          <Button onClick={() => setOpen(true)}>
            <UserPlus size={16} /> {t('pgRegistry.users.page.addUser')}
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-ink-500"><UsersIcon size={15} className="text-brand-600" /> {t('pgRegistry.users.stat.total')}</div>
          <div className="mt-1 text-xl font-bold text-ink-800">{users.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-ink-500"><Shield size={15} className="text-brand-600" /> {t('pgRegistry.users.stat.admins')}</div>
          <div className="mt-1 text-xl font-bold text-ink-800">{users.filter((u) => u.role === 'admin' || u.role === 'founder').length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-ink-500"><Check size={15} className="text-emerald-600" /> {t('pgRegistry.users.stat.accountants')}</div>
          <div className="mt-1 text-xl font-bold text-ink-800">{users.filter((u) => u.role === 'accountant').length}</div>
        </Card>
        <Card className="p-4 bg-brand-600 text-white">
          <div className="text-xs text-emerald-100">{t('pgRegistry.users.stat.lastAdded')}</div>
          <div className="mt-1 truncate text-sm font-bold">{users[users.length - 1]?.name ?? '—'}</div>
        </Card>
      </div>

      <Card>
        <CardHeader title={t('pgRegistry.users.list.title')} subtitle={t('pgRegistry.users.list.subtitle')} />
        <CardBody className="p-0">
          <DataTable columns={columns} rows={users} dense empty={t('pgRegistry.users.list.empty')} />
        </CardBody>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={t('pgRegistry.users.modal.title')}>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-600">{t('pgRegistry.users.modal.username')} <span className="text-red-500">*</span></label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder={t('pgRegistry.users.modal.usernamePlaceholder')} dir="ltr" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-600">{t('pgRegistry.users.modal.fullName')} <span className="text-red-500">*</span></label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t('pgRegistry.users.modal.fullNamePlaceholder')} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-600">{t('pgRegistry.users.modal.password')} <span className="text-red-500">*</span></label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('pgRegistry.users.modal.passwordPlaceholder')} dir="ltr" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-600">{t('pgRegistry.users.modal.role')}</label>
            <Select value={role} onChange={(e) => setRole(e.target.value as User['role'])}>
              <option value="admin">{t('pgRegistry.users.role.admin')}</option>
              <option value="accountant">{t('pgRegistry.users.role.accountant')}</option>
            </Select>
          </div>
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {t('pgRegistry.users.modal.note')}
          </p>
          <Button className="w-full" onClick={save}>{t('pgRegistry.users.modal.saveUser')}</Button>
        </div>
      </Modal>
    </div>
  )
}
