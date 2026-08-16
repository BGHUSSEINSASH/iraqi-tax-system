import { useMemo, useState } from 'react'
import { Users, Plus, Pencil, Trash2, FileSpreadsheet, Upload, ScrollText } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { useI18n } from '../i18n'
import { PageHead, Card, CardHeader, CardBody, DataTable, Button, IconBtn, Badge, Modal, Field, Input, Select, Toggle, MoneyInput, ConfirmDialog, useToast, EmptyState, type Column } from '../components/ui'
import type { Employee, MaritalStatus } from '../lib/types'
import { fmt, fmtDate, money, uid } from '../lib/format'
import { calcEmployeeMonthly } from '../lib/tax'
import { parseEmployeesExcel } from '../lib/import'
import { buildEmployeeDD14Html, openFormPrintWindow } from '../lib/officialForms'

const MARITAL: Employee['maritalStatus'][] = ['single', 'married', 'divorced', 'widowed']

interface FormState {
  name: string
  nationalId: string
  birthDate: string
  gender: 'male' | 'female'
  jobTitle: string
  startDate: string
  notes: string
  
  nat: 'iraqi' | 'foreign'
  res: 'resident' | 'nonresident'
  sec: 'private' | 'government'
  mainEmployer: 'yes' | 'no'
  employerName: string
  employerId: string
  marital: 'single' | 'married_housewife' | 'married_working' | 'widowed' | 'divorced'
  over63: 'yes' | 'no'
  salary: number
  allow: number
  cashHous: number
  inKind: 'none' | 'unfurnished' | 'furnished' | 'employerPart' | 'hotel' | 'caravan'
  actualRent: number
  ins: number
  alimony: number
  child: number
  childrenNames: string[]
  socialSecurity: boolean
  isPrimaryEmployer: boolean
  
  // حقول إضافية من النظام القديم
  spouseName: string
  spouseCivilId: string
  marriageDate: string
  divorceDate: string
  spouseDisabled: 'yes' | 'no'
  spouseEmployed: 'yes' | 'no'
  incomeMerge: 'yes' | 'no'
  spouseEmpId: string
  leaveYear: string
  leaveMonth: string
  leaveDay: string
}

const emptyForm: FormState = {
  name: '',
  nationalId: '',
  birthDate: '',
  gender: 'male',
  jobTitle: '',
  startDate: new Date().toISOString().slice(0, 10),
  notes: '',
  
  nat: 'iraqi',
  res: 'resident',
  sec: 'private',
  mainEmployer: 'yes',
  employerName: '',
  employerId: '',
  marital: 'single',
  over63: 'no',
  salary: 0,
  allow: 0,
  cashHous: 0,
  inKind: 'none',
  actualRent: 0,
  ins: 0,
  alimony: 0,
  child: 0,
  childrenNames: [],
  socialSecurity: true,
  isPrimaryEmployer: true,
  
  // حقول إضافية من النظام القديم
  spouseName: '',
  spouseCivilId: '',
  marriageDate: '',
  divorceDate: '',
  spouseDisabled: 'no',
  spouseEmployed: 'no',
  incomeMerge: 'no',
  spouseEmpId: '',
  leaveYear: '',
  leaveMonth: '',
  leaveDay: '',
}

export default function Employees() {
  const { data, currentCompany, add, update, remove, setActiveCompany } = useApp()
  const { t } = useI18n()
  const { push } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState(data.activeCompanyId)

  const openNew = () => {
    setEditing(null)
    setForm({ ...emptyForm })
    setModalOpen(true)
  }

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const res = parseEmployeesExcel(reader.result as ArrayBuffer, companyFilter, data.employees)
        if (res.errors.length > 0) {
          res.errors.forEach((err) => push('error', err))
          return
        }
        if (res.employees.length === 0) {
          push('info', t('pgRegistry.employees.toast.importSkippedAll', { skipped: res.skippedCount }))
          return
        }
        res.employees.forEach((emp) => add('employees', emp))
        push('success', t('pgRegistry.employees.toast.imported', { count: res.employees.length, skipped: res.skippedCount }))
      } catch (err) {
        push('error', t('pgRegistry.employees.toast.importFailed'))
      }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  const openEdit = (e: Employee) => {
    setEditing(e)
    setForm({
      name: e.name,
      nationalId: e.nationalId,
      birthDate: e.birthDate,
      gender: e.gender,
      jobTitle: e.jobTitle,
      startDate: e.startDate,
      notes: e.notes || '',
      
      nat: e.nat ?? 'iraqi',
      res: e.res ?? 'resident',
      sec: e.sec ?? (e.socialSecurity ? 'private' : 'government'),
      mainEmployer: e.mainEmployer ?? (e.isPrimaryEmployer ? 'yes' : 'no'),
      employerName: e.employerName ?? '',
      employerId: e.employerId ?? '',
      marital: e.marital ?? (e.maritalStatus === 'married' ? (e.spouseAtHome ? 'married_housewife' : 'married_working') : e.maritalStatus) as FormState['marital'],
      over63: e.over63 ?? 'no',
      salary: e.salary ?? e.basicSalary ?? 0,
      allow: e.allow ?? e.allowances ?? 0,
      cashHous: e.cashHous ?? e.otherBenefits ?? 0,
      inKind: e.inKind ?? 'none',
      actualRent: e.actualRent ?? 0,
      ins: e.ins ?? e.lifeInsurance ?? 0,
      alimony: e.alimony ?? 0,
      child: e.child ?? e.childrenCount ?? 0,
      childrenNames: e.childrenNames ?? [],
      socialSecurity: e.socialSecurity ?? true,
      isPrimaryEmployer: e.isPrimaryEmployer ?? true,
      
      // حقول إضافية من النظام القديم
      spouseName: e.spouseName ?? '',
      spouseCivilId: e.spouseCivilId ?? '',
      marriageDate: e.marriageDate ?? '',
      divorceDate: e.divorceDate ?? '',
      spouseDisabled: e.spouseDisabled ?? 'no',
      spouseEmployed: e.spouseEmployed ?? 'no',
      incomeMerge: e.incomeMerge ?? 'no',
      spouseEmpId: e.spouseEmpId ?? '',
      leaveYear: e.leaveYear ?? '',
      leaveMonth: e.leaveMonth ?? '',
      leaveDay: e.leaveDay ?? '',
    })
    setModalOpen(true)
  }

  const save = () => {
    if (!form.name.trim()) {
      push('error', t('pgRegistry.employees.toast.nameRequired'))
      return
    }

    const legacyPayload = {
      nat: form.nat,
      res: form.res,
      sec: form.sec,
      mainEmployer: form.mainEmployer,
      employerName: form.employerName,
      employerId: form.employerId,
      marital: form.marital,
      over63: form.over63,
      salary: form.salary,
      allow: form.allow,
      cashHous: form.cashHous,
      inKind: form.inKind,
      actualRent: form.actualRent,
      ins: form.ins,
      child: form.child,
      
      // حقول إضافية من النظام القديم
      spouseName: form.spouseName,
      spouseCivilId: form.spouseCivilId,
      marriageDate: form.marriageDate,
      divorceDate: form.divorceDate,
      spouseDisabled: form.spouseDisabled,
      spouseEmployed: form.spouseEmployed,
      incomeMerge: form.incomeMerge,
      spouseEmpId: form.spouseEmpId,
      leaveYear: form.leaveYear,
      leaveMonth: form.leaveMonth,
      leaveDay: form.leaveDay,
      
      // Sync to modern fields
      basicSalary: form.salary,
      allowances: form.allow,
      otherBenefits: form.cashHous,
      inKindBenefits: 0,
      bonuses: 0,
      lifeInsurance: form.ins,
      alimony: form.alimony,
      childrenCount: form.child,
      maritalStatus: (form.marital.startsWith('married') ? 'married' : form.marital) as MaritalStatus,
      spouseAtHome: form.marital === 'married_housewife',
      socialSecurity: form.socialSecurity,
      isPrimaryEmployer: form.isPrimaryEmployer,
      notes: form.notes,
    }

    const payload = {
      ...form,
      ...legacyPayload
    }

    if (editing) {
      update('employees', editing.id, payload)
      push('success', t('pgRegistry.employees.toast.updated'))
    } else {
      const emp: Employee = {
        id: uid(),
        companyId: companyFilter,
        ...payload,
        active: true,
        endDate: '',
      }
      add('employees', emp)
      push('success', t('pgRegistry.employees.toast.added'))
    }
    setModalOpen(false)
  }

  const toggleActive = (e: Employee) => {
    update('employees', e.id, { active: !e.active })
  }

  const removeEmployee = () => {
    if (!confirmId) return
    remove('employees', confirmId)
    setConfirmId(null)
    push('success', t('pgRegistry.employees.toast.deleted'))
  }

  const list = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.employees.filter((e) => {
      if (e.companyId !== companyFilter) return false
      if (!q) return true
      return e.name.toLowerCase().includes(q) || e.nationalId.includes(q) || e.jobTitle.toLowerCase().includes(q)
    })
  }, [data.employees, companyFilter, search])

  const totals = useMemo(() => {
    const active = list.filter((e) => e.active)
    return {
      count: active.length,
      payroll: active.reduce((a, e) => a + e.basicSalary + e.allowances, 0),
      tax: active.reduce((a, e) => a + calcEmployeeMonthly(e, data.config).tax, 0),
    }
  }, [list, data.config])

  const columns: Column<Employee>[] = [
    {
      key: 'name',
      title: t('pgRegistry.employees.col.employee'),
      render: (e) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
            {e.name.trim().charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-ink-800">{e.name}</div>
            <div className="text-xs text-ink-400">{e.jobTitle || '—'}</div>
          </div>
        </div>
      ),
    },
    { key: 'nationalId', title: t('pgRegistry.employees.col.nationalId'), render: (e) => <span dir="ltr" className="text-xs">{e.nationalId || '—'}</span> },
    {
      key: 'maritalStatus',
      title: t('pgRegistry.employees.col.status'),
      render: (e) => (
        <div className="text-xs">
          {t(`pgRegistry.employees.marital.${e.maritalStatus}`)}
          {e.maritalStatus === 'married' && e.spouseAtHome && <Badge tone="blue">{t('pgRegistry.employees.badge.housewife')}</Badge>}
          {e.childrenCount > 0 && <Badge tone="amber">{t('pgRegistry.employees.badge.children', { count: e.childrenCount })}</Badge>}
        </div>
      ),
    },
    {
      key: 'basicSalary',
      title: t('pgRegistry.employees.col.basicSalary'),
      render: (e) => <span className="text-xs font-semibold">{money(e.basicSalary)}</span>,
    },
    {
      key: 'allowances',
      title: t('pgRegistry.employees.col.allowances'),
      render: (e) => <span className="text-xs">{money(e.allowances)}</span>,
    },
    {
      key: 'tax',
      title: t('pgRegistry.employees.col.monthlyTax'),
      render: (e) => <Badge tone={calcEmployeeMonthly(e, data.config).tax > 0 ? 'brand' : 'green'}>{money(calcEmployeeMonthly(e, data.config).tax)}</Badge>,
    },
    {
      key: 'status',
      title: t('pgRegistry.employees.col.status'),
      render: (e) =>
        e.active ? (
          <button onClick={() => toggleActive(e)}>
            <Badge tone="green">{t('pgRegistry.employees.badge.active')}</Badge>
          </button>
        ) : (
          <button onClick={() => toggleActive(e)}>
            <Badge tone="slate">{t('pgRegistry.employees.badge.suspended')}</Badge>
          </button>
        ),
    },
    {
      key: 'actions',
      title: '',
      render: (e) => (
        <div className="flex items-center justify-end gap-1">
          <IconBtn
            title={t('pgRegistry.employees.action.printDD14')}
            onClick={() => {
              const html = buildEmployeeDD14Html(e, currentCompany, data.config, new Date().getFullYear(), data)
              openFormPrintWindow(t('pgRegistry.employees.modal.printTitle', { name: e.name }), html)
              push('success', t('pgRegistry.employees.toast.formOpened', { name: e.name }))
            }}
          >
            <ScrollText size={16} className="text-brand-600" />
          </IconBtn>
          <IconBtn title={t('pgRegistry.employees.action.edit')} onClick={() => openEdit(e)}>
            <Pencil size={16} />
          </IconBtn>
          <IconBtn title={t('pgRegistry.employees.action.delete')} tone="danger" onClick={() => setConfirmId(e.id)}>
            <Trash2 size={16} />
          </IconBtn>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHead
        title={t('pgRegistry.employees.page.title')}
        desc={t('pgRegistry.employees.page.desc')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <input type="file" id="excel-import-input" accept=".xlsx,.xls" className="hidden" onChange={handleImportExcel} />
            <Button variant="secondary" onClick={() => document.getElementById('excel-import-input')?.click()}>
              <Upload size={16} /> {t('pgRegistry.employees.page.importExcel')}
            </Button>
            <Button onClick={openNew}>
              <Plus size={16} /> {t('pgRegistry.employees.page.addEmployee')}
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs text-ink-500">{t('pgRegistry.employees.stat.activeCount')}</div>
          <div className="mt-1 text-2xl font-bold text-ink-800">{fmt(totals.count)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-ink-500">{t('pgRegistry.employees.stat.payroll')}</div>
          <div className="mt-1 text-2xl font-bold text-ink-800">{money(totals.payroll)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-ink-500">{t('pgRegistry.employees.stat.expectedWithholding')}</div>
          <div className="mt-1 text-2xl font-bold text-brand-700">{money(totals.tax)}</div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title={t('pgRegistry.employees.list.title')}
          subtitle={t('pgRegistry.employees.list.subtitle', { count: fmt(list.length) })}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Select className="max-w-[220px] py-1.5 text-xs" value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
                {data.companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <input
                className="input max-w-[200px] py-1.5 text-xs"
                placeholder={t('pgRegistry.employees.search.placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          }
        />
        <CardBody className="p-0">
          {list.length === 0 ? (
            <EmptyState
              icon={<Users size={44} />}
              title={t('pgRegistry.employees.empty.title')}
              desc={t('pgRegistry.employees.empty.desc')}
              action={
                <Button onClick={openNew}>
                  <Plus size={16} /> {t('pgRegistry.employees.page.addEmployee')}
                </Button>
              }
            />
          ) : (
            <DataTable columns={columns} rows={list} dense />
          )}
        </CardBody>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t('pgRegistry.employees.modal.editTitle', { name: editing.name }) : t('pgRegistry.employees.modal.addTitle')}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              {t('pgRegistry.common.cancel')}
            </Button>
            <Button onClick={save}>{editing ? t('pgRegistry.employees.modal.saveEdit') : t('pgRegistry.employees.modal.add')}</Button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Section 1: البيانات الشخصية والسكن */}
          <div>
            <h4 className="mb-3 text-sm font-bold text-brand-600 border-b pb-1.5 flex items-center gap-1">
              <span>1.</span> {t('pgRegistry.employees.section.personal')}
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label={t('pgRegistry.employees.field.fullName')} required>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t('pgRegistry.employees.field.fullNamePlaceholder')} />
              </Field>
              <Field label={t('pgRegistry.employees.field.nationalId')}>
                <Input dir="ltr" value={form.nationalId} onChange={(e) => setForm({ ...form, nationalId: e.target.value })} placeholder={t('pgRegistry.employees.field.nationalIdPlaceholder')} />
              </Field>
              <Field label={t('pgRegistry.employees.field.birthDate')}>
                <Input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
              </Field>
              <Field label={t('pgRegistry.employees.field.gender')}>
                <Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as 'male' | 'female' })}>
                  <option value="male">{t('pgRegistry.employees.gender.male')}</option>
                  <option value="female">{t('pgRegistry.employees.gender.female')}</option>
                </Select>
              </Field>
              <Field label={t('pgRegistry.employees.field.nationality')}>
                <Select value={form.nat} onChange={(e) => setForm({ ...form, nat: e.target.value as 'iraqi' | 'foreign' })}>
                  <option value="iraqi">{t('pgRegistry.employees.nationality.iraqi')}</option>
                  <option value="foreign">{t('pgRegistry.employees.nationality.foreign')}</option>
                </Select>
              </Field>
              <Field label={t('pgRegistry.employees.field.taxResidency')}>
                <Select value={form.res} onChange={(e) => setForm({ ...form, res: e.target.value as 'resident' | 'nonresident' })}>
                  <option value="resident">{t('pgRegistry.employees.residency.resident')}</option>
                  <option value="nonresident">{t('pgRegistry.employees.residency.nonresident')}</option>
                </Select>
              </Field>
            </div>
          </div>

          {/* Section 2: تفاصيل الوظيفة وجهة العمل */}
          <div>
            <h4 className="mb-3 text-sm font-bold text-brand-600 border-b pb-1.5 flex items-center gap-1">
              <span>2.</span> {t('pgRegistry.employees.section.job')}
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label={t('pgRegistry.employees.field.jobTitle')}>
                <Input value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} placeholder={t('pgRegistry.employees.field.jobTitlePlaceholder')} />
              </Field>
              <Field label={t('pgRegistry.employees.field.startDate')}>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </Field>
              <Field label={t('pgRegistry.employees.field.workSector')}>
                <Select value={form.sec} onChange={(e) => setForm({ ...form, sec: e.target.value as 'private' | 'government' })}>
                  <option value="private">{t('pgRegistry.employees.workSector.private')}</option>
                  <option value="government">{t('pgRegistry.employees.workSector.government')}</option>
                </Select>
              </Field>
              <Field label={t('pgRegistry.employees.field.mainEmployer')}>
                <Select value={form.mainEmployer} onChange={(e) => setForm({ ...form, mainEmployer: e.target.value as 'yes' | 'no' })}>
                  <option value="yes">{t('pgRegistry.employees.mainEmployer.yes')}</option>
                  <option value="no">{t('pgRegistry.employees.mainEmployer.no')}</option>
                </Select>
              </Field>
              <Field label={t('pgRegistry.employees.field.employerName')}>
                <Input value={form.employerName} onChange={(e) => setForm({ ...form, employerName: e.target.value })} placeholder={t('pgRegistry.employees.field.employerNamePlaceholder')} />
              </Field>
              <Field label={t('pgRegistry.employees.field.employerId')}>
                <Input value={form.employerId} onChange={(e) => setForm({ ...form, employerId: e.target.value })} placeholder={t('pgRegistry.employees.field.employerIdPlaceholder')} />
              </Field>
              <div className="flex items-end pb-2">
                <Toggle
                  checked={form.socialSecurity}
                  onChange={(v) => setForm({ ...form, socialSecurity: v })}
                  label={t('pgRegistry.employees.toggle.socialSecurity')}
                />
              </div>
            </div>
          </div>

          {/* Section 3: الحالة الاجتماعية والعائلة */}
          <div>
            <h4 className="mb-3 text-sm font-bold text-brand-600 border-b pb-1.5 flex items-center gap-1">
              <span>3.</span> {t('pgRegistry.employees.section.marital')}
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label={t('pgRegistry.employees.field.maritalStatus')}>
                <Select value={form.marital} onChange={(e) => setForm({ ...form, marital: e.target.value as FormState['marital'] })}>
                  <option value="single">{t('pgRegistry.employees.maritalOption.single')}</option>
                  <option value="married_housewife">{t('pgRegistry.employees.maritalOption.married_housewife')}</option>
                  <option value="married_working">{t('pgRegistry.employees.maritalOption.married_working')}</option>
                  <option value="widowed">{t('pgRegistry.employees.maritalOption.widowed')}</option>
                  <option value="divorced">{t('pgRegistry.employees.maritalOption.divorced')}</option>
                </Select>
              </Field>
              <Field label={t('pgRegistry.employees.field.childrenCount')}>
                <Input
                  type="number"
                  min={0}
                  max={6}
                  value={form.child || ''}
                  onChange={(e) => {
                    const newChildCount = Math.max(0, Math.min(6, Number(e.target.value)))
                    const newChildrenNames = [...form.childrenNames]
                    if (newChildCount > newChildrenNames.length) {
                      for (let i = newChildrenNames.length; i < newChildCount; i++) {
                        newChildrenNames.push('')
                      }
                    } else if (newChildCount < newChildrenNames.length) {
                      newChildrenNames.splice(newChildCount)
                    }
                    setForm({ ...form, child: newChildCount, childrenNames: newChildrenNames })
                  }}
                />
              </Field>
              {form.child > 0 && (
                <div className="sm:col-span-3 space-y-2 border-t pt-4 mt-2">
                  <h5 className="text-sm font-medium text-ink-600">{t('pgRegistry.employees.children.namesTitle')}</h5>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {form.childrenNames.map((name, idx) => (
                      <Field key={idx} label={t('pgRegistry.employees.children.childName', { n: idx + 1 })}>
                        <Input
                          value={name}
                          onChange={(e) => {
                            const newNames = [...form.childrenNames]
                            newNames[idx] = e.target.value
                            setForm({ ...form, childrenNames: newNames })
                          }}
                          placeholder={t('pgRegistry.employees.children.childName', { n: idx + 1 })}
                        />
                      </Field>
                    ))}
                  </div>
                </div>
              )}
              <Field label={t('pgRegistry.employees.field.over63')}>
                <Select value={form.over63} onChange={(e) => setForm({ ...form, over63: e.target.value as 'yes' | 'no' })}>
                  <option value="no">{t('pgRegistry.employees.over63.no')}</option>
                  <option value="yes">{t('pgRegistry.employees.over63.yes')}</option>
                </Select>
              </Field>
            </div>
          </div>

          {/* Section 3b: بيانات الزوجة التفصيلية */}
          <div>
            <h4 className="mb-3 text-sm font-bold text-brand-600 border-b pb-1.5 flex items-center gap-1">
              <span>3ب.</span> {t('pgRegistry.employees.section.spouse')}
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label={t('pgRegistry.employees.field.spouseName')}>
                <Input value={form.spouseName} onChange={(e) => setForm({ ...form, spouseName: e.target.value })} placeholder={t('pgRegistry.employees.field.spouseNamePlaceholder')} />
              </Field>
              <Field label={t('pgRegistry.employees.field.spouseNationalId')}>
                <Input dir="ltr" value={form.spouseCivilId} onChange={(e) => setForm({ ...form, spouseCivilId: e.target.value })} placeholder={t('pgRegistry.employees.field.spouseNationalIdPlaceholder')} />
              </Field>
              <Field label={t('pgRegistry.employees.field.marriageDate')}>
                <Input type="date" value={form.marriageDate} onChange={(e) => setForm({ ...form, marriageDate: e.target.value })} />
              </Field>
              <Field label={t('pgRegistry.employees.field.divorceDate')}>
                <Input type="date" value={form.divorceDate} onChange={(e) => setForm({ ...form, divorceDate: e.target.value })} />
              </Field>
              <Field label={t('pgRegistry.employees.field.spouseDisabled')}>
                <Select value={form.spouseDisabled} onChange={(e) => setForm({ ...form, spouseDisabled: e.target.value as 'yes' | 'no' })}>
                  <option value="no">{t('pgRegistry.employees.spouseDisabled.no')}</option>
                  <option value="yes">{t('pgRegistry.employees.spouseDisabled.yes')}</option>
                </Select>
              </Field>
              <Field label={t('pgRegistry.employees.field.spouseEmployed')}>
                <Select value={form.spouseEmployed} onChange={(e) => setForm({ ...form, spouseEmployed: e.target.value as 'yes' | 'no' })}>
                  <option value="no">{t('pgRegistry.employees.spouseEmployed.no')}</option>
                  <option value="yes">{t('pgRegistry.employees.spouseEmployed.yes')}</option>
                </Select>
              </Field>
              <Field label={t('pgRegistry.employees.field.incomeMerge')}>
                <Select value={form.incomeMerge} onChange={(e) => setForm({ ...form, incomeMerge: e.target.value as 'yes' | 'no' })}>
                  <option value="no">{t('pgRegistry.employees.incomeMerge.no')}</option>
                  <option value="yes">{t('pgRegistry.employees.incomeMerge.yes')}</option>
                </Select>
              </Field>
              <Field label={t('pgRegistry.employees.field.spouseEmployerId')}>
                <Input dir="ltr" value={form.spouseEmpId} onChange={(e) => setForm({ ...form, spouseEmpId: e.target.value })} placeholder={t('pgRegistry.employees.field.spouseEmployerIdPlaceholder')} />
              </Field>
            </div>
          </div>

          {/* Section 5: بيانات الإجازة/ترك العمل */}
          <div>
            <h4 className="mb-3 text-sm font-bold text-brand-600 border-b pb-1.5 flex items-center gap-1">
              <span>5.</span> {t('pgRegistry.employees.section.leave')}
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label={t('pgRegistry.employees.field.leaveYear')}>
                <Select value={form.leaveYear} onChange={(e) => setForm({ ...form, leaveYear: e.target.value })}>
                  <option value="">{t('pgRegistry.employees.select.choose')}</option>
                  {[...Array(5)].map((_, i) => {
                    const y = new Date().getFullYear() - i
                    return <option key={y} value={y.toString()}>{y}</option>
                  })}
                </Select>
              </Field>
              <Field label={t('pgRegistry.employees.field.leaveMonth')}>
                <Select value={form.leaveMonth} onChange={(e) => setForm({ ...form, leaveMonth: e.target.value })}>
                  <option value="">{t('pgRegistry.employees.select.choose')}</option>
                  <option value="1">{t('pgRegistry.employees.month.jan')}</option>
                  <option value="2">{t('pgRegistry.employees.month.feb')}</option>
                  <option value="3">{t('pgRegistry.employees.month.mar')}</option>
                  <option value="4">{t('pgRegistry.employees.month.apr')}</option>
                  <option value="5">{t('pgRegistry.employees.month.may')}</option>
                  <option value="6">{t('pgRegistry.employees.month.jun')}</option>
                  <option value="7">{t('pgRegistry.employees.month.jul')}</option>
                  <option value="8">{t('pgRegistry.employees.month.aug')}</option>
                  <option value="9">{t('pgRegistry.employees.month.sep')}</option>
                  <option value="10">{t('pgRegistry.employees.month.oct')}</option>
                  <option value="11">{t('pgRegistry.employees.month.nov')}</option>
                  <option value="12">{t('pgRegistry.employees.month.dec')}</option>
                </Select>
              </Field>
              <Field label={t('pgRegistry.employees.field.leaveDay')}>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={form.leaveDay}
                  onChange={(e) => {
                    const v = e.target.value
                    setForm({ ...form, leaveDay: v === '' ? '' : String(Math.min(31, Math.max(1, Number(v)))) })
                  }}
                  placeholder={t('pgRegistry.employees.field.leaveDayPlaceholder')}
                />
              </Field>
            </div>
          </div>

          {/* Section 6: الرواتب والمخصصات والتنزيلات */}
          <div>
            <h4 className="mb-3 text-sm font-bold text-brand-600 border-b pb-1.5 flex items-center gap-1">
              <span>6.</span> {t('pgRegistry.employees.section.salary')}
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label={t('pgRegistry.employees.field.basicSalary')}>
                <MoneyInput value={form.salary} onChange={(v) => setForm({ ...form, salary: v })} />
              </Field>
              <Field label={t('pgRegistry.employees.field.allowancesFull')}>
                <MoneyInput value={form.allow} onChange={(v) => setForm({ ...form, allow: v })} />
              </Field>
              <Field label={t('pgRegistry.employees.field.housing')}>
                <MoneyInput value={form.cashHous} onChange={(v) => setForm({ ...form, cashHous: v })} />
              </Field>
              <Field label={t('pgRegistry.employees.field.inKind')}>
                <Select value={form.inKind} onChange={(e) => setForm({ ...form, inKind: e.target.value as FormState['inKind'] })}>
                  <option value="none">{t('pgRegistry.employees.inKind.none')}</option>
                  <option value="unfurnished">{t('pgRegistry.employees.inKind.unfurnished')}</option>
                  <option value="furnished">{t('pgRegistry.employees.inKind.furnished')}</option>
                  <option value="employerPart">{t('pgRegistry.employees.inKind.employerPart')}</option>
                  <option value="hotel">{t('pgRegistry.employees.inKind.hotel')}</option>
                  <option value="caravan">{t('pgRegistry.employees.inKind.caravan')}</option>
                </Select>
              </Field>
              <Field label={t('pgRegistry.employees.field.actualRent')}>
                <MoneyInput value={form.actualRent} onChange={(v) => setForm({ ...form, actualRent: v })} />
              </Field>
              <Field label={t('pgRegistry.employees.field.insurance')}>
                <MoneyInput value={form.ins} onChange={(v) => setForm({ ...form, ins: v })} />
              </Field>
              <Field label={t('pgRegistry.employees.field.alimony')}>
                <MoneyInput value={form.alimony} onChange={(v) => setForm({ ...form, alimony: v })} />
              </Field>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={removeEmployee}
        title={t('pgRegistry.employees.confirm.title')}
        message={t('pgRegistry.employees.confirm.message')}
      />
    </div>
  )
}
