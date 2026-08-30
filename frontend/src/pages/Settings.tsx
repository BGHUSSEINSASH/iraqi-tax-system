import { useEffect, useState } from 'react'
import { Save, Building2, SlidersHorizontal, Database, Plus, Trash2, Download, Pencil, ShieldCheck } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { useI18n } from '../i18n'
import { PageHead, Card, CardHeader, CardBody, Button, Field, Input, Select, Textarea, Modal, Badge, useToast, Tabs, ConfirmDialog, type Column, DataTable } from '../components/ui'
import type { ContractType, User } from '../lib/types'
import { uid } from '../lib/format'

function NumInput({ value, onChange, step = 1000, suffix }: { value: number; onChange: (v: number) => void; step?: number; suffix?: string }) {
  return (
    <div className="relative">
      <Input type="number" dir="ltr" step={step} value={value || ''} onChange={(e) => onChange(Math.max(0, Number(e.target.value)))} className="pl-12 text-left" />
      {suffix && <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-ink-400">{suffix}</span>}
    </div>
  )
}

function PctInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="relative">
      <Input type="number" dir="ltr" step={0.1} value={Math.round(value * 1000) / 10 || ''} onChange={(e) => onChange(Math.max(0, Number(e.target.value)) / 100)} className="pl-12 text-left" />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-ink-400">%</span>
    </div>
  )
}

export default function Settings() {
  const { data, currentCompany, update, setConfig, setConfigValue, add, resetData, clearAllData } = useApp()
  const { t } = useI18n()
  const { push } = useToast()
  const cfg = data.config
  const [tab, setTab] = useState<'company' | 'tax' | 'users' | 'data'>('company')

  const [co, setCo] = useState({ name: '', taxId: '', activity: '', sector: currentCompany?.sector ?? 'private', address: '', phone: '', email: '', notes: '' })
  const [types, setTypes] = useState<ContractType[]>([])
  const [userModal, setUserModal] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [userForm, setUserForm] = useState({ username: '', name: '', password: '', role: 'accountant' as User['role'] })
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [passState, setPassState] = useState({ old: '', new: '', confirm: '' })
  const [changePassFor, setChangePassFor] = useState<User | null>(null)

  useEffect(() => {
    if (currentCompany) {
      setCo({
        name: currentCompany.name,
        taxId: currentCompany.taxId,
        activity: currentCompany.activity,
        sector: currentCompany.sector,
        address: currentCompany.address,
        phone: currentCompany.phone,
        email: currentCompany.email,
        notes: currentCompany.notes,
      })
    }
  }, [currentCompany?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setTypes(cfg.contractTypes)
  }, [cfg.contractTypes])

  const saveCompany = () => {
    if (!currentCompany) return
    if (!co.name.trim()) {
      push('error', t('pgRegistry.settings.toast.companyNameRequired'))
      return
    }
    update('companies', currentCompany.id, co)
    push('success', t('pgRegistry.settings.toast.companySaved'))
  }

  const saveTypes = () => {
    const clean = types.filter((t) => t.label.trim() && t.rate >= 0)
    setConfig({ contractTypes: clean })
    push('success', t('pgRegistry.settings.toast.typesSaved'))
  }

  const saveUser = () => {
    if (!userForm.name.trim() || !userForm.username.trim() || !userForm.password) {
      push('error', t('pgRegistry.settings.toast.userIncomplete'))
      return
    }
    if (editUser) {
      update('users', editUser.id, userForm)
      push('success', t('pgRegistry.settings.toast.userUpdated'))
    } else {
      if (data.users.some((u) => u.username === userForm.username)) {
        push('error', t('pgRegistry.settings.toast.usernameTaken'))
        return
      }
      add('users', { ...userForm, id: uid() })
      push('success', t('pgRegistry.settings.toast.userAdded'))
    }
    setUserModal(false)
  }

  const changePassword = () => {
    if (!changePassFor) return
    if (passState.new.length < 6) {
      push('error', t('pgRegistry.settings.toast.passTooShort'))
      return
    }
    if (passState.new !== passState.confirm) {
      push('error', t('pgRegistry.settings.toast.passMismatch'))
      return
    }
    update('users', changePassFor.id, { password: passState.new })
    setChangePassFor(null)
    setPassState({ old: '', new: '', confirm: '' })
    push('success', t('pgRegistry.settings.toast.passChanged'))
  }

  const doBackup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tax-iq-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    push('success', t('pgRegistry.settings.toast.backupDownloaded'))
  }

  const userColumns: Column<User>[] = [
    {
      key: 'name',
      title: t('pgRegistry.settings.col.user'),
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <ShieldCheck size={17} />
          </div>
          <div>
            <div className="font-semibold text-ink-800">{u.name}</div>
            <div className="text-xs text-ink-400" dir="ltr">{u.username}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      title: t('pgRegistry.settings.col.role'),
      render: (u) => {
        if (u.role === 'founder') return <Badge tone="purple">مؤسس النظام</Badge>
        return u.role === 'admin' ? <Badge tone="brand">{t('pgRegistry.settings.role.admin')}</Badge> : <Badge tone="slate">{t('pgRegistry.settings.role.accountant')}</Badge>
      },
    },
    {
      key: 'actions',
      title: '',
      render: (u) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="secondary" onClick={() => { setEditUser(u); setUserForm({ username: u.username, name: u.name, password: u.password, role: u.role }); setUserModal(true) }}>
            <Pencil size={14} /> {t('pgRegistry.settings.action.edit')}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => { setChangePassFor(u); setPassState({ old: '', new: '', confirm: '' }) }}>
            {t('pgRegistry.settings.action.changePassword')}
          </Button>
        </div>
      ),
    },
  ]

  const paramRows: { key: keyof typeof cfg; label: string; hint?: string; pct?: boolean; step?: number }[] = [
    { key: 'legalAllowance', label: t('pgRegistry.settings.param.legalAllowance'), hint: t('pgRegistry.settings.param.legalAllowanceHint'), step: 1000 },
    { key: 'spouseAllowance', label: t('pgRegistry.settings.param.spouseAllowance'), step: 1000 },
    { key: 'childAllowance', label: t('pgRegistry.settings.param.childAllowance'), step: 1000 },
    { key: 'maxChildren', label: t('pgRegistry.settings.param.maxChildren'), step: 1 },
    { key: 'privateSectorExemptionRate', label: t('pgRegistry.settings.param.privateSectorExemptionRate'), pct: true },
    { key: 'socialSecurityRate', label: t('pgRegistry.settings.param.socialSecurityRate'), pct: true },
    { key: 'corporateRate', label: t('pgRegistry.settings.param.corporateRate'), pct: true },
    { key: 'corporateOilRate', label: t('pgRegistry.settings.param.corporateOilRate'), pct: true },
    { key: 'propertyRate', label: t('pgRegistry.settings.param.propertyRate'), pct: true },
    { key: 'propertyPenaltyRate', label: t('pgRegistry.settings.param.propertyPenaltyRate'), pct: true },
    { key: 'landRate', label: t('pgRegistry.settings.param.landRate'), pct: true },
    { key: 'landExemptionArea', label: t('pgRegistry.settings.param.landExemptionArea'), step: 1 },
    { key: 'professionAllowance', label: t('pgRegistry.settings.param.professionAllowance'), step: 1000 },
  ]

  return (
    <div>
      <PageHead title={t('pgRegistry.settings.page.title')} desc={t('pgRegistry.settings.page.desc')} />

      <div className="mb-5">
        <Tabs
          items={[
            { id: 'company', label: t('pgRegistry.settings.tab.company') },
            { id: 'tax', label: t('pgRegistry.settings.tab.tax') },
            { id: 'users', label: t('pgRegistry.settings.tab.users') },
            { id: 'data', label: t('pgRegistry.settings.tab.data') },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'company' && (
        <Card>
          <CardHeader title={t('pgRegistry.settings.company.title')} subtitle={t('pgRegistry.settings.company.subtitle')} action={<Building2 size={18} className="text-brand-600" />} />
          <CardBody>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t('pgRegistry.settings.company.name')} required>
                <Input value={co.name} onChange={(e) => setCo({ ...co, name: e.target.value })} />
              </Field>
              <Field label={t('pgRegistry.settings.company.taxId')}>
                <Input dir="ltr" value={co.taxId} onChange={(e) => setCo({ ...co, taxId: e.target.value })} />
              </Field>
              <Field label={t('pgRegistry.settings.company.activity')}>
                <Input value={co.activity} onChange={(e) => setCo({ ...co, activity: e.target.value })} />
              </Field>
              <Field label={t('pgRegistry.settings.company.sector')}>
                <Select value={co.sector} onChange={(e) => setCo({ ...co, sector: e.target.value as typeof co.sector })}>
                  <option value="private">{t('pgRegistry.settings.sector.private')}</option>
                  <option value="public">{t('pgRegistry.settings.sector.public')}</option>
                  <option value="mixed">{t('pgRegistry.settings.sector.mixed')}</option>
                </Select>
              </Field>
              <Field label={t('pgRegistry.settings.company.address')}>
                <Input value={co.address} onChange={(e) => setCo({ ...co, address: e.target.value })} />
              </Field>
              <Field label={t('pgRegistry.settings.company.phone')}>
                <Input dir="ltr" value={co.phone} onChange={(e) => setCo({ ...co, phone: e.target.value })} />
              </Field>
              <Field label={t('pgRegistry.settings.company.email')}>
                <Input dir="ltr" value={co.email} onChange={(e) => setCo({ ...co, email: e.target.value })} />
              </Field>
              <Field label={t('pgRegistry.settings.company.notes')}>
                <Textarea value={co.notes} onChange={(e) => setCo({ ...co, notes: e.target.value })} />
              </Field>
            </div>
            <div className="mt-5 flex justify-end">
              <Button onClick={saveCompany}>
                <Save size={16} /> {t('pgRegistry.settings.company.save')}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {tab === 'tax' && (
        <div className="space-y-5">
          <Card>
            <CardHeader title={t('pgRegistry.settings.tax.allowancesTitle')} subtitle={t('pgRegistry.settings.tax.allowancesSubtitle')} action={<SlidersHorizontal size={18} className="text-brand-600" />} />
            <CardBody>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paramRows.map((p) => (
                  <Field key={p.key} label={p.label} hint={p.hint}>
                    {p.pct ? (
                      <PctInput value={cfg[p.key] as number} onChange={(v) => setConfigValue(p.key, v)} />
                    ) : (
                      <NumInput value={cfg[p.key] as number} onChange={(v) => setConfigValue(p.key, v)} step={p.step ?? 1000} suffix={p.key === 'maxChildren' || p.key === 'landExemptionArea' ? '' : t('common.currency')} />
                    )}
                  </Field>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t('pgRegistry.settings.tax.contractsTitle')} subtitle={t('pgRegistry.settings.tax.contractsSubtitle')} />
            <CardBody className="space-y-3">
              {types.map((ct, i) => (
                <div key={ct.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-ink-200 p-3">
                  <Input className="flex-1 min-w-[180px]" value={ct.label} onChange={(e) => setTypes(types.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder={t('pgRegistry.settings.tax.contractNamePlaceholder')} />
                  <div className="w-32">
                    <div className="relative">
                      <Input type="number" dir="ltr" step={0.1} value={Math.round(ct.rate * 1000) / 10} onChange={(e) => setTypes(types.map((x, j) => (j === i ? { ...x, rate: Math.max(0, Number(e.target.value)) / 100 } : x)))} className="pl-10 text-left" />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-ink-400">%</span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setTypes(types.filter((_, j) => j !== i))}>
                    <Trash2 size={15} />
                  </Button>
                </div>
              ))}
              <Button variant="secondary" size="sm" onClick={() => setTypes([...types, { id: uid(), label: t('pgRegistry.settings.tax.newContractType'), rate: 0.05 }])}>
                <Plus size={15} /> {t('pgRegistry.settings.tax.addContractType')}
              </Button>
            </CardBody>
          </Card>

          <div className="flex justify-end">
            <Button onClick={saveTypes}>
              <Save size={16} /> {t('pgRegistry.settings.tax.save')}
            </Button>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <Card>
          <CardHeader
            title={t('pgRegistry.settings.users.title')}
            subtitle={t('pgRegistry.settings.users.subtitle')}
            action={
              <Button size="sm" onClick={() => { setEditUser(null); setUserForm({ username: '', name: '', password: '', role: 'accountant' }); setUserModal(true) }}>
                <Plus size={15} /> {t('pgRegistry.settings.users.add')}
              </Button>
            }
          />
          <CardBody className="p-0">
            <DataTable columns={userColumns} rows={data.users} />
          </CardBody>
        </Card>
      )}

      {tab === 'data' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title={t('pgRegistry.settings.data.backupTitle')} subtitle={t('pgRegistry.settings.data.backupSubtitle')} action={<Download size={18} className="text-brand-600" />} />
            <CardBody>
              <p className="mb-4 text-sm text-ink-500">
                {t('pgRegistry.settings.data.backupDesc')}
              </p>
              <Button onClick={doBackup}>
                <Download size={16} /> {t('pgRegistry.settings.data.downloadBackup')}
              </Button>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={t('pgRegistry.settings.data.manageTitle')} subtitle={t('pgRegistry.settings.data.manageSubtitle')} action={<Database size={18} className="text-brand-600" />} />
            <CardBody className="space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-bold text-amber-800">{t('pgRegistry.settings.data.resetTitle')}</p>
                <p className="mt-1 text-xs text-amber-700">{t('pgRegistry.settings.data.resetDesc')}</p>
                <Button variant="secondary" size="sm" className="mt-3" onClick={() => setConfirmReset(true)}>
                  {t('pgRegistry.settings.data.reset')}
                </Button>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-bold text-red-800">{t('pgRegistry.settings.data.clearTitle')}</p>
                <p className="mt-1 text-xs text-red-700">{t('pgRegistry.settings.data.clearDesc')}</p>
                <Button variant="danger" size="sm" className="mt-3" onClick={() => setConfirmClear(true)}>
                  {t('pgRegistry.settings.data.clear')}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      <Modal open={userModal} onClose={() => setUserModal(false)} title={editUser ? t('pgRegistry.settings.modal.editTitle') : t('pgRegistry.settings.modal.addTitle')} size="sm" footer={
        <>
          <Button variant="secondary" onClick={() => setUserModal(false)}>{t('pgRegistry.common.cancel')}</Button>
          <Button onClick={saveUser}>{editUser ? t('pgRegistry.settings.modal.save') : t('pgRegistry.settings.modal.add')}</Button>
        </>
      }>
        <div className="space-y-4">
          <Field label={t('pgRegistry.settings.modal.name')}>
            <Input value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
          </Field>
          <Field label={t('pgRegistry.settings.modal.username')}>
            <Input dir="ltr" value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} />
          </Field>
          <Field label={t('pgRegistry.settings.modal.password')}>
            <Input dir="ltr" type="text" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
          </Field>
          <Field label={t('pgRegistry.settings.modal.role')}>
            <Select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value as User['role'] })}>
              <option value="accountant">{t('pgRegistry.settings.roleOption.accountant')}</option>
              <option value="admin">{t('pgRegistry.settings.roleOption.admin')}</option>
            </Select>
          </Field>
        </div>
      </Modal>

      <Modal open={changePassFor !== null} onClose={() => setChangePassFor(null)} title={t('pgRegistry.settings.passModal.title', { name: changePassFor?.name ?? '' })} size="sm" footer={
        <>
          <Button variant="secondary" onClick={() => setChangePassFor(null)}>{t('pgRegistry.common.cancel')}</Button>
          <Button onClick={changePassword}>{t('pgRegistry.settings.passModal.save')}</Button>
        </>
      }>
        <div className="space-y-4">
          <Field label={t('pgRegistry.settings.passModal.newPass')}>
            <Input dir="ltr" type="password" value={passState.new} onChange={(e) => setPassState({ ...passState, new: e.target.value })} />
          </Field>
          <Field label={t('pgRegistry.settings.passModal.confirmPass')}>
            <Input dir="ltr" type="password" value={passState.confirm} onChange={(e) => setPassState({ ...passState, confirm: e.target.value })} />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => { resetData(); setConfirmReset(false); push('success', t('pgRegistry.settings.toast.resetDone')) }}
        title={t('pgRegistry.settings.resetConfirm.title')}
        message={t('pgRegistry.settings.resetConfirm.message')}
        confirmText={t('pgRegistry.settings.resetConfirm.confirmText')}
      />
      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => { clearAllData(); setConfirmClear(false); push('success', t('pgRegistry.settings.toast.cleared')) }}
        title={t('pgRegistry.settings.clearConfirm.title')}
        message={t('pgRegistry.settings.clearConfirm.message')}
        confirmText={t('pgRegistry.settings.clearConfirm.confirmText')}
      />
    </div>
  )
}