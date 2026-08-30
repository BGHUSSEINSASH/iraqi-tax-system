import { useEffect, useMemo, useState } from 'react'
import { Calculator, Save, FileText, FileSpreadsheet, CalendarClock, RotateCcw, Plus, Upload, Pencil, Trash2 } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { PageHead, Card, CardHeader, CardBody, Button, Badge, Modal, DataTable, useToast, Input, Select, Field, Toggle, MoneyInput, ConfirmDialog, type Column } from '../components/ui'
import type { Employee, MonthlyRow, MaritalStatus } from '../lib/types'
import { calcEmployeeMonthly } from '../lib/tax'
import { fmt, money, nowYear, nowMonth, fmtDate, uid } from '../lib/format'
import { exportExcel, exportPdf } from '../lib/export'
import { parseEmployeesExcel, buildFullEmployeesTemplate, FULL_TEMPLATE_COLUMNS } from '../lib/import'
import { buildMonthlyDeclarationHtml, openFormPrintWindow } from '../lib/officialForms'
import { useI18n } from '../i18n'

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
  continuity: 'active' | 'left'
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
  continuity: 'active',
}

export default function MonthlyTax() {
  const { data, currentCompany, add, update, remove, replace } = useApp()
  const { push } = useToast()
  const { t } = useI18n()
  const year = nowYear()
  const cid = data.activeCompanyId

  const [selYear, setSelYear] = useState(year)
  const [selMonth, setSelMonth] = useState(nowMonth())
  const [rows, setRows] = useState<MonthlyRow[]>([])
  const [declModal, setDeclModal] = useState(false)
  const [empModalOpen, setEmpModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const openNewEmployee = () => {
    setForm({ ...emptyForm })
    setEditingEmp(null)
    setEmpModalOpen(true)
  }

  const openEditEmployee = (emp: Employee) => {
    setEditingEmp(emp)
    setForm({
      ...emptyForm,
      name: emp.name,
      nationalId: emp.nationalId,
      birthDate: emp.birthDate,
      gender: emp.gender,
      jobTitle: emp.jobTitle,
      startDate: emp.startDate,
      notes: emp.notes,
      nat: emp.nat ?? 'iraqi',
      res: emp.res ?? 'resident',
      sec: emp.sec ?? 'private',
      mainEmployer: emp.mainEmployer ?? 'yes',
      employerName: emp.employerName ?? '',
      employerId: emp.employerId ?? '',
      marital: emp.marital ?? 'single',
      over63: emp.over63 ?? 'no',
      salary: emp.salary ?? emp.basicSalary ?? 0,
      allow: emp.allow ?? emp.allowances ?? 0,
      cashHous: emp.cashHous ?? emp.otherBenefits ?? 0,
      inKind: emp.inKind ?? 'none',
      actualRent: emp.actualRent ?? 0,
      ins: emp.ins ?? emp.lifeInsurance ?? 0,
      alimony: emp.alimony ?? 0,
      child: emp.child ?? emp.childrenCount ?? 0,
      childrenNames: emp.childrenNames ?? [],
      socialSecurity: emp.socialSecurity,
      isPrimaryEmployer: emp.isPrimaryEmployer,
      spouseName: emp.spouseName ?? '',
      spouseCivilId: emp.spouseCivilId ?? '',
      marriageDate: emp.marriageDate ?? '',
      divorceDate: emp.divorceDate ?? '',
      spouseDisabled: emp.spouseDisabled ?? 'no',
      spouseEmployed: emp.spouseEmployed ?? 'no',
      incomeMerge: emp.incomeMerge ?? 'no',
      spouseEmpId: emp.spouseEmpId ?? '',
      leaveYear: emp.leaveYear ?? '',
      leaveMonth: emp.leaveMonth ?? '',
      leaveDay: emp.leaveDay ?? '',
      continuity: emp.endDate ? 'left' : 'active',
    })
    setEmpModalOpen(true)
  }

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const res = parseEmployeesExcel(reader.result as ArrayBuffer, cid, data.employees)
        if (res.errors.length > 0) {
          res.errors.forEach((err) => push('error', err))
          return
        }
        if (res.employees.length === 0) {
          push('info', t('pgTax.employee.importedAll', { skipped: res.skippedCount }))
          return
        }
        res.employees.forEach((emp) => add('employees', emp))
        push('success', t('pgTax.employee.imported', { count: res.employees.length, skipped: res.skippedCount }))
      } catch (err) {
        push('error', t('pgTax.employee.importFailed'))
      }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  const saveNewEmployee = () => {
    if (!form.name.trim()) {
      push('error', t('pgTax.employee.nameRequired'))
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
      leaveYear: form.continuity === 'left' ? form.leaveYear : '',
      leaveMonth: form.continuity === 'left' ? form.leaveMonth : '',
      leaveDay: form.continuity === 'left' ? form.leaveDay : '',
      
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

    const isLeft = form.continuity === 'left'
    const endDate =
      isLeft && form.leaveYear && form.leaveMonth && form.leaveDay
        ? `${form.leaveYear}-${String(form.leaveMonth).padStart(2, '0')}-${String(form.leaveDay).padStart(2, '0')}`
        : ''

    if (editingEmp) {
      update('employees', editingEmp.id, {
        ...payload,
        active: !isLeft,
        endDate,
      })
      setEmpModalOpen(false)
      setEditingEmp(null)
      push('success', t('pgTax.employee.updated'))
      return
    }

    const emp: Employee = {
      id: uid(),
      companyId: cid,
      ...payload,
      active: !isLeft,
      endDate,
    }
    add('employees', emp)
    setEmpModalOpen(false)
    push('success', isLeft ? t('pgTax.employee.addEmployeeLeft') : t('pgTax.employee.addEmployeeSuccess'))
  }

  const downloadTemplate = () => {
    exportExcel(`${t('pgTax.employee.employeeTemplate').replace(/ /g, '-')}.xlsx`, t('pgTax.employee.employeeTemplate'), FULL_TEMPLATE_COLUMNS, buildFullEmployeesTemplate())
    push('success', t('pgTax.employee.templateDownloaded'))
  }

  const employees = useMemo(
    () => data.employees.filter((e) => e.companyId === cid && e.active),
    [data.employees, cid],
  )

  const loadRows = () => {
    const stored = data.monthlyRows.filter(
      (r) => r.companyId === cid && r.year === selYear && r.month === selMonth,
    )
    if (stored.length > 0) {
      setRows(
        stored.map((r) => {
          const emp = data.employees.find((e) => e.id === r.employeeId)
          if (!emp) return r
          const calc = calcEmployeeMonthly(emp, data.config)
          return {
            ...r,
            gross: calc.gross,
            deductions: calc.deductions,
            taxable: calc.taxable,
            tax: calc.tax,
          }
        }),
      )
      return
    }
    recompute()
  }

  const recompute = () => {
    const next: MonthlyRow[] = employees.map((emp) => {
      const calc = calcEmployeeMonthly(emp, data.config)
      return {
        id: `mr-${emp.id}-${selYear}-${selMonth}`,
        companyId: cid,
        year: selYear,
        month: selMonth,
        employeeId: emp.id,
        gross: calc.gross,
        deductions: calc.deductions,
        taxable: calc.taxable,
        tax: calc.tax,
        adjusted: calc.tax,
        declared: false,
      }
    })
    setRows(next)
  }

  const save = () => {
    replace('monthlyRows', [
      ...data.monthlyRows.filter((r) => !(r.companyId === cid && r.year === selYear && r.month === selMonth)),
      ...rows,
    ])
    push('success', t('pgTax.monthly.saveMonthMsg', { month: t(`pgTax.common.month_${selMonth}`), year: selYear }))
  }

  useEffect(() => {
    loadRows()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selYear, selMonth, cid, data.employees, data.config])

  useEffect(() => {
    setRows((prev) =>
      prev.map((r) => {
        const emp = data.employees.find((e) => e.id === r.employeeId)
        if (!emp) return r
        return { ...r, adjusted: r.adjusted }
      }),
    )
  }, [data.employees])

  const totals = useMemo(() => {
    const empRows = rows
      .map((r) => ({ r, e: data.employees.find((x) => x.id === r.employeeId) }))
      .filter((x) => x.e)
    return {
      count: empRows.length,
      taxed: empRows.filter((x) => x.r.taxable > 0).length,
      exempt: empRows.filter((x) => x.r.taxable <= 0).length,
      gross: rows.reduce((s, r) => s + r.gross, 0),
      deductions: rows.reduce((s, r) => s + r.deductions, 0),
      taxable: rows.reduce((s, r) => s + r.taxable, 0),
      tax: rows.reduce((s, r) => s + r.adjusted, 0),
      declared: rows.filter((r) => r.declared).length,
    }
  }, [rows, data.employees])

  const columns: Column<MonthlyRow>[] = [
    {
      key: 'employee',
      title: t('pgTax.monthly.colEmployee'),
      render: (r) => {
        const e = data.employees.find((x) => x.id === r.employeeId)
        return (
          <div>
            <div className="font-semibold text-ink-800">{e?.name ?? '—'}</div>
            <div className="text-xs text-ink-400">{e?.jobTitle}</div>
          </div>
        )
      },
    },
    { key: 'gross', title: t('pgTax.monthly.colGross'), total: (rs) => rs.reduce((s, r) => s + r.gross, 0), render: (r) => <span className="text-xs">{money(r.gross)}</span> },
    { key: 'deductions', title: t('pgTax.monthly.colDeductions'), total: (rs) => rs.reduce((s, r) => s + r.deductions, 0), render: (r) => <span className="text-xs text-ink-500">{money(r.deductions)}</span> },
    { key: 'taxable', title: t('pgTax.monthly.colTaxable'), total: (rs) => rs.reduce((s, r) => s + r.taxable, 0), render: (r) => <span className="text-xs font-semibold">{money(r.taxable)}</span> },
    {
      key: 'tax',
      title: t('pgTax.monthly.colTax'),
      total: (rs) => rs.reduce((s, r) => s + r.tax, 0),
      render: (r) => <span className="text-xs font-bold text-brand-700">{money(r.tax)}</span>,
    },
    {
      key: 'adjusted',
      title: t('pgTax.monthly.colAdjusted'),
      total: (rs) => rs.reduce((s, r) => s + r.adjusted, 0),
      render: (r) => (
        <input
          className="input max-w-[150px] py-1 text-xs"
          dir="ltr"
          type="number"
          value={r.adjusted}
          onChange={(e) =>
            setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, adjusted: Math.max(0, Number(e.target.value)) } : x)))
          }
        />
      ),
    },
    {
      key: 'declared',
      title: t('pgTax.monthly.colDeclared'),
      render: (r) => (
        <button
          onClick={() => setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, declared: !x.declared } : x)))}
          className="inline-flex"
        >
          {r.declared ? <Badge tone="green">{t('pgTax.monthly.yes')}</Badge> : <Badge tone="slate">{t('pgTax.monthly.no')}</Badge>}
        </button>
      )
    },
    {
      key: 'actions',
      title: '',
      render: (r) => {
        const e = data.employees.find((x) => x.id === r.employeeId)
        if (!e) return null
        return (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => openEditEmployee(e)} className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-brand-600" title="تعديل">
              <Pencil size={15} />
            </button>
            <button onClick={() => setConfirmDeleteId(e.id)} className="rounded p-1 text-ink-400 hover:bg-red-50 hover:text-red-600" title="حذف">
              <Trash2 size={15} />
            </button>
          </div>
        )
      }
    }
  ]

  const doExportExcel = () => {
    const headers = [
      t('pgTax.monthly.colEmployee'),
      t('pgTax.employee.colNationalId'),
      t('pgTax.monthly.colGross'),
      t('pgTax.monthly.colDeductions'),
      t('pgTax.monthly.colTaxable'),
      t('pgTax.monthly.colTax'),
    ]
    const body = rows.map((r) => {
      const e = data.employees.find((x) => x.id === r.employeeId)
      return [e?.name ?? '', e?.nationalId ?? '', r.gross, r.deductions, r.taxable, r.adjusted]
    })
    body.push([t('pgTax.common.total'), '', totals.gross, totals.deductions, totals.taxable, totals.tax])
    exportExcel(`${t('pgTax.monthly.excelSheet').replace(/ /g, '-')}-${t(`pgTax.common.month_${selMonth}`)}-${selYear}.xlsx`, t('pgTax.monthly.excelSheet'), headers, body)
    push('success', t('pgTax.monthly.exportExcelMsg'))
  }

  const doExportPdf = () => {
    const headers = [
      t('pgTax.monthly.colEmployee'),
      t('pgTax.employee.colNationalId'),
      t('pgTax.monthly.colGross'),
      t('pgTax.monthly.colDeductions'),
      t('pgTax.monthly.colTaxable'),
      t('pgTax.monthly.colTax'),
    ]
    const body = rows.map((r) => {
      const e = data.employees.find((x) => x.id === r.employeeId)
      return [e?.name ?? '', e?.nationalId ?? '', fmt(r.gross), fmt(r.deductions), fmt(r.taxable), fmt(r.adjusted)]
    })
    body.push([t('pgTax.common.total'), '', fmt(totals.gross), fmt(totals.deductions), fmt(totals.taxable), fmt(totals.tax)])
    exportPdf({
      title: t('pgTax.monthly.pdfTitle'),
      subtitle: t('pgTax.monthly.pdfSubtitle', { month: t(`pgTax.common.month_${selMonth}`), year: selYear }),
      company: currentCompany,
      headers,
      rows: body,
      footers: [t('pgTax.monthly.pdfFooter1'), t('pgTax.monthly.pdfFooter2')],
    })
  }

  return (
    <div>
      <PageHead
        title={t('pgTax.monthly.title')}
        desc={t('pgTax.monthly.desc')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select className="max-w-[110px]" value={selYear} onChange={(e) => setSelYear(Number(e.target.value))}>
              {[year - 1, year, year + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
            <Select className="max-w-[140px]" value={selMonth} onChange={(e) => setSelMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {t(`pgTax.common.month_${m}`)}
                </option>
              ))}
            </Select>
            <input type="file" id="monthly-excel-import" accept=".xlsx,.xls" className="hidden" onChange={handleImportExcel} />
            <Button variant="secondary" onClick={() => document.getElementById('monthly-excel-import')?.click()}>
              <Upload size={16} /> {t('pgTax.common.importExcel')}
            </Button>
            <Button variant="secondary" onClick={downloadTemplate} title={t('pgTax.common.templateTooltip')}>
              <FileSpreadsheet size={16} /> {t('pgTax.common.employeeTemplate')}
            </Button>
            <Button variant="secondary" onClick={openNewEmployee}>
              <Plus size={16} /> {t('pgTax.common.addEmployee')}
            </Button>
            <Button variant="secondary" onClick={recompute} title={t('pgTax.monthly.recomputeTitle')}>
              <RotateCcw size={16} />
            </Button>
            <Button onClick={save}>
              <Save size={16} /> {t('pgTax.monthly.saveMonth')}
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Card className="p-4">
          <div className="text-xs text-ink-500">{t('pgTax.monthly.statEmployees')}</div>
          <div className="mt-1 text-xl font-bold text-ink-800">{fmt(totals.count)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-ink-500">{t('pgTax.monthly.statTaxed')}</div>
          <div className="mt-1 text-xl font-bold text-brand-700">{fmt(totals.taxed)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-ink-500">{t('pgTax.monthly.statExempt')}</div>
          <div className="mt-1 text-xl font-bold text-ink-800">{fmt(totals.exempt)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-ink-500">{t('pgTax.monthly.statTotalSalaries')}</div>
          <div className="mt-1 text-xl font-bold text-ink-800">{money(totals.gross)}</div>
        </Card>
        <Card className="p-4 bg-brand-600 text-white">
          <div className="text-xs text-emerald-100">{t('pgTax.monthly.statWithheldTax')}</div>
          <div className="mt-1 text-xl font-bold">{money(totals.tax)}</div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title={t('pgTax.monthly.tableTitle', { month: t(`pgTax.common.month_${selMonth}`), year: selYear })}
          subtitle={
            <>
              <CalendarClock size={14} className="ml-1 inline" />
              {t('pgTax.monthly.tableSubtitle', { declared: totals.declared, count: totals.count })}
            </>
          }
          action={
            <>
              <Button variant="secondary" size="sm" onClick={doExportExcel}>
                <FileSpreadsheet size={15} /> {t('pgTax.common.excel')}
              </Button>
              <Button variant="secondary" size="sm" onClick={doExportPdf}>
                <FileText size={15} /> {t('pgTax.common.pdf')}
              </Button>
              <Button size="sm" onClick={() => setDeclModal(true)}>
                <FileText size={15} /> {t('pgTax.monthly.declarationBtn')}
              </Button>
            </>
          }
        />
        <CardBody className="p-0">
          <DataTable columns={columns} rows={rows} dense empty={t('pgTax.monthly.tableEmpty')} />
        </CardBody>
      </Card>

      <Modal open={declModal} onClose={() => setDeclModal(false)} title={t('pgTax.monthly.declTitle')} size="lg">
        <div className="space-y-4 text-sm">
          <div className="text-center">
            <p className="font-black text-ink-900">{t('pgTax.monthly.declHeader1')}</p>
            <p className="font-bold text-brand-700">{t('pgTax.monthly.declHeader2')}</p>
            <p className="mt-1 font-semibold text-ink-700">{t('pgTax.monthly.declHeader3')}</p>
            <p className="text-xs text-ink-500">
              {t('pgTax.monthly.declSubtitle', { month: t(`pgTax.common.month_${selMonth}`), year: selYear, date: fmtDate(new Date().toISOString()) })}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-ink-200 bg-ink-50 p-4 sm:grid-cols-2">
            <div>
              <div className="text-xs text-ink-500">{t('pgTax.monthly.item1')}</div>
              <div className="font-bold">{String(selMonth).padStart(2, '0')} / {selYear}</div>
            </div>
            <div>
              <div className="text-xs text-ink-500">{t('pgTax.monthly.item2')}</div>
              <div className="font-bold" dir="ltr">
                {currentCompany?.taxId ?? '—'}
              </div>
            </div>
            <div className="sm:col-span-2">
              <div className="text-xs text-ink-500">{t('pgTax.monthly.item3')}</div>
              <div className="font-bold">{currentCompany?.name ?? '—'}</div>
            </div>
            <div className="sm:col-span-2">
              <div className="text-xs text-ink-500">{t('pgTax.monthly.item4')}</div>
              <div>{currentCompany?.address ?? '—'}</div>
            </div>
          </div>
          <div className="rounded-xl border border-ink-200 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs text-ink-500">
              <Badge tone="brand">{t('pgTax.monthly.original')}</Badge>
              <Badge>{t('pgTax.monthly.amended')}</Badge>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-brand-200 bg-brand-50 p-3">
                <div className="text-xs text-ink-500">{t('pgTax.monthly.item6')}</div>
                <div className="text-lg font-black text-brand-800">{money(totals.gross)}</div>
              </div>
              <div className="rounded-lg border border-brand-200 bg-brand-50 p-3">
                <div className="text-xs text-ink-500">{t('pgTax.monthly.item7')}</div>
                <div className="text-lg font-black text-brand-800">{money(totals.tax)}</div>
              </div>
              <div className="rounded-lg border border-ink-200 p-3">
                <div className="text-xs text-ink-500">{t('pgTax.monthly.item8')}</div>
                <div className="text-lg font-black">{fmt(totals.count)}</div>
              </div>
              <div className="rounded-lg border border-ink-200 p-3">
                <div className="text-xs text-ink-500">{t('pgTax.monthly.item9')}</div>
                <div className="text-lg font-black">{fmt(totals.taxed)}</div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-ink-200 p-4">
            <div className="text-xs text-ink-500">{t('pgTax.monthly.item10')}</div>
            <div className="text-lg font-black">{fmt(totals.exempt)}</div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                const html = buildMonthlyDeclarationHtml(currentCompany, selYear, selMonth, data, rows)
                openFormPrintWindow(`${t('pgTax.monthly.declTitle')} — ${t(`pgTax.common.month_${selMonth}`)} ${selYear}`, html)
                push('success', t('pgTax.monthly.printOpened', { month: t(`pgTax.common.month_${selMonth}`), year: selYear }))
              }}
            >
              <FileText size={15} /> {t('pgTax.monthly.printOfficial')}
            </Button>
            <a
              href="./monthly-declaration-form.pdf"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 shadow-sm transition hover:bg-ink-50"
            >
              <FileSpreadsheet size={15} /> {t('pgTax.monthly.officialForm')}
            </a>
            <Button
              variant="secondary"
              onClick={() => {
                const headers = [t('pgTax.common.item'), t('pgTax.common.amount')]
                const body: (string | number)[][] = [
                  [t('pgTax.monthly.excelItem1'), `${String(selMonth).padStart(2, '0')}/${selYear}`],
                  [t('pgTax.monthly.excelItem2'), currentCompany?.taxId ?? ''],
                  [t('pgTax.monthly.excelItem3'), currentCompany?.name ?? ''],
                  [t('pgTax.monthly.excelItem4'), currentCompany?.address ?? ''],
                  [t('pgTax.monthly.excelItem6'), totals.gross],
                  [t('pgTax.monthly.excelItem7'), totals.tax],
                  [t('pgTax.monthly.excelItem8'), totals.count],
                  [t('pgTax.monthly.excelItem9'), totals.taxed],
                  [t('pgTax.monthly.excelItem10'), totals.exempt],
                ]
                exportExcel(`${t('pgTax.monthly.declExcelSheet').replace(/ /g, '-')}-${selYear}-${selMonth}.xlsx`, t('pgTax.monthly.declExcelSheet'), headers, body)
                push('success', t('pgTax.monthly.declExcelMsg'))
              }}
            >
              <FileSpreadsheet size={15} /> {t('pgTax.common.excel')}
            </Button>
            <Button
              onClick={() => {
                const headers = [t('pgTax.common.item'), t('pgTax.common.amount')]
                const body: (string | number)[][] = [
                  [t('pgTax.monthly.excelItem1'), `${String(selMonth).padStart(2, '0')}/${selYear}`],
                  [t('pgTax.monthly.excelItem2'), currentCompany?.taxId ?? ''],
                  [t('pgTax.monthly.excelItem3'), currentCompany?.name ?? ''],
                  [t('pgTax.monthly.excelItem4'), currentCompany?.address ?? ''],
                  [t('pgTax.monthly.excelItem6'), fmt(totals.gross)],
                  [t('pgTax.monthly.excelItem7'), fmt(totals.tax)],
                  [t('pgTax.monthly.excelItem8'), fmt(totals.count)],
                  [t('pgTax.monthly.excelItem9'), fmt(totals.taxed)],
                  [t('pgTax.monthly.excelItem10'), fmt(totals.exempt)],
                ]
                exportPdf({
                  title: t('pgTax.monthly.declPdfTitle'),
                  subtitle: t('pgTax.monthly.declPdfSubtitle', { month: t(`pgTax.common.month_${selMonth}`), year: selYear }),
                  company: currentCompany,
                  headers,
                  rows: body,
                  orientation: 'portrait',
                  footers: [t('pgTax.monthly.declPdfFooter1'), t('pgTax.monthly.declPdfFooter2')],
                })
              }}
            >
              <FileText size={15} /> {t('pgTax.common.pdf')}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) {
            remove('employees', confirmDeleteId)
            setConfirmDeleteId(null)
            push('success', 'تم حذف الموظف بنجاح')
          }
        }}
        title="تأكيد الحذف"
        message="هل أنت متأكد من حذف هذا الموظف؟ لا يمكن التراجع عن هذا الإجراء."
      />

      <Modal
        open={empModalOpen}
        onClose={() => setEmpModalOpen(false)}
        title={editingEmp ? 'تعديل بيانات الموظف' : t('pgTax.employee.titleMonthly')}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setEmpModalOpen(false); setEditingEmp(null) }}>
              {t('pgTax.common.cancel')}
            </Button>
            <Button onClick={saveNewEmployee}>{editingEmp ? t('pgTax.common.saveChanges') : t('pgTax.common.addEmployee')}</Button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Section 1: البيانات الشخصية والسكن */}
          <div>
            <h4 className="mb-3 text-sm font-bold text-brand-600 border-b pb-1.5 flex items-center gap-1">
              <span>1.</span> {t('pgTax.employee.section1')}
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label={t('pgTax.employee.fullName')} required>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t('pgTax.employee.namePlaceholder')} />
              </Field>
              <Field label={t('pgTax.employee.nationalId')}>
                <Input dir="ltr" value={form.nationalId} onChange={(e) => setForm({ ...form, nationalId: e.target.value })} placeholder={t('pgTax.employee.nationalIdPlaceholder')} />
              </Field>
              <Field label={t('pgTax.employee.birthDate')}>
                <Input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
              </Field>
              <Field label={t('pgTax.employee.gender')}>
                <Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as 'male' | 'female' })}>
                  <option value="male">{t('pgTax.employee.male')}</option>
                  <option value="female">{t('pgTax.employee.female')}</option>
                </Select>
              </Field>
              <Field label={t('pgTax.employee.nationality')}>
                <Select value={form.nat} onChange={(e) => setForm({ ...form, nat: e.target.value as 'iraqi' | 'foreign' })}>
                  <option value="iraqi">{t('pgTax.employee.iraqi')}</option>
                  <option value="foreign">{t('pgTax.employee.foreign')}</option>
                </Select>
              </Field>
              <Field label={t('pgTax.employee.residence')}>
                <Select value={form.res} onChange={(e) => setForm({ ...form, res: e.target.value as 'resident' | 'nonresident' })}>
                  <option value="resident">{t('pgTax.employee.resident')}</option>
                  <option value="nonresident">{t('pgTax.employee.nonresident')}</option>
                </Select>
              </Field>
            </div>
          </div>

          {/* Section 2: تفاصيل الوظيفة وجهة العمل */}
          <div>
            <h4 className="mb-3 text-sm font-bold text-brand-600 border-b pb-1.5 flex items-center gap-1">
              <span>2.</span> {t('pgTax.employee.section2')}
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label={t('pgTax.employee.jobTitle')}>
                <Input value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} placeholder={t('pgTax.employee.jobTitlePlaceholder')} />
              </Field>
              <Field label={t('pgTax.employee.startDate')} hint={t('pgTax.employee.startDateHint')}>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </Field>
              <Field label={t('pgTax.employee.sector')}>
                <Select value={form.sec} onChange={(e) => setForm({ ...form, sec: e.target.value as 'private' | 'government' })}>
                  <option value="private">{t('pgTax.employee.private')}</option>
                  <option value="government">{t('pgTax.employee.government')}</option>
                </Select>
              </Field>
              <Field label={t('pgTax.employee.mainEmployer')}>
                <Select value={form.mainEmployer} onChange={(e) => setForm({ ...form, mainEmployer: e.target.value as 'yes' | 'no' })}>
                  <option value="yes">{t('pgTax.employee.mainEmployerYes')}</option>
                  <option value="no">{t('pgTax.employee.mainEmployerNo')}</option>
                </Select>
              </Field>
              <Field label={t('pgTax.employee.employerName')}>
                <Input value={form.employerName} onChange={(e) => setForm({ ...form, employerName: e.target.value })} placeholder={t('pgTax.employee.employerNamePlaceholder')} />
              </Field>
              <Field label={t('pgTax.employee.employerTaxId')}>
                <Input dir="ltr" value={form.employerId} onChange={(e) => setForm({ ...form, employerId: e.target.value })} placeholder={t('pgTax.employee.employerTaxIdPlaceholder')} />
              </Field>
              <div className="flex items-end pb-2">
                <Toggle
                  checked={form.socialSecurity}
                  onChange={(v) => setForm({ ...form, socialSecurity: v })}
                  label={t('pgTax.employee.socialSecurity')}
                />
              </div>
            </div>
          </div>

          {/* Section 3: الحالة الاجتماعية والعائلة */}
          <div>
            <h4 className="mb-3 text-sm font-bold text-brand-600 border-b pb-1.5 flex items-center gap-1">
              <span>3.</span> {t('pgTax.employee.section3')}
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label={t('pgTax.employee.maritalStatus')}>
                <Select value={form.marital} onChange={(e) => setForm({ ...form, marital: e.target.value as FormState['marital'] })}>
                  <option value="single">{t('pgTax.employee.single')}</option>
                  <option value="married_housewife">{t('pgTax.employee.marriedHousewife')}</option>
                  <option value="married_working">{t('pgTax.employee.marriedWorking')}</option>
                  <option value="widowed">{t('pgTax.employee.widowed')}</option>
                  <option value="divorced">{t('pgTax.employee.divorced')}</option>
                </Select>
              </Field>
              <Field label={t('pgTax.employee.eligibleChildren')}>
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
                  <h5 className="text-sm font-medium text-ink-600">{t('pgTax.employee.childrenNamesTitle')}</h5>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {form.childrenNames.map((name, idx) => (
                      <Field key={idx} label={t('pgTax.employee.childName', { n: idx + 1 })}>
                        <Input
                          value={name}
                          onChange={(e) => {
                            const newNames = [...form.childrenNames]
                            newNames[idx] = e.target.value
                            setForm({ ...form, childrenNames: newNames })
                          }}
                          placeholder={t('pgTax.employee.childName', { n: idx + 1 })}
                        />
                      </Field>
                    ))}
                  </div>
                </div>
              )}
              <Field label={t('pgTax.employee.over63')}>
                <Select value={form.over63} onChange={(e) => setForm({ ...form, over63: e.target.value as 'yes' | 'no' })}>
                  <option value="no">{t('pgTax.employee.no')}</option>
                  <option value="yes">{t('pgTax.employee.over63Yes')}</option>
                </Select>
              </Field>
            </div>
          </div>

          {/* Section 3b: بيانات الزوجة التفصيلية */}
          <div>
            <h4 className="mb-3 text-sm font-bold text-brand-600 border-b pb-1.5 flex items-center gap-1">
              <span>3ب.</span> {t('pgTax.employee.section3b')}
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label={t('pgTax.employee.spouseName')}>
                <Input value={form.spouseName} onChange={(e) => setForm({ ...form, spouseName: e.target.value })} placeholder={t('pgTax.employee.spouseNamePlaceholder')} />
              </Field>
              <Field label={t('pgTax.employee.spouseNationalId')}>
                <Input dir="ltr" value={form.spouseCivilId} onChange={(e) => setForm({ ...form, spouseCivilId: e.target.value })} placeholder={t('pgTax.employee.spouseNationalIdPlaceholder')} />
              </Field>
              <Field label={t('pgTax.employee.marriageDate')}>
                <Input type="date" value={form.marriageDate} onChange={(e) => setForm({ ...form, marriageDate: e.target.value })} />
              </Field>
              <Field label={t('pgTax.employee.divorceDate')}>
                <Input type="date" value={form.divorceDate} onChange={(e) => setForm({ ...form, divorceDate: e.target.value })} />
              </Field>
              <Field label={t('pgTax.employee.spouseDisabled')}>
                <Select value={form.spouseDisabled} onChange={(e) => setForm({ ...form, spouseDisabled: e.target.value as 'yes' | 'no' })}>
                  <option value="no">{t('pgTax.employee.no')}</option>
                  <option value="yes">{t('pgTax.employee.spouseDisabledYes')}</option>
                </Select>
              </Field>
              <Field label={t('pgTax.employee.spouseEmployed')}>
                <Select value={form.spouseEmployed} onChange={(e) => setForm({ ...form, spouseEmployed: e.target.value as 'yes' | 'no' })}>
                  <option value="no">{t('pgTax.employee.no')}</option>
                  <option value="yes">{t('pgTax.employee.spouseEmployedYes')}</option>
                </Select>
              </Field>
              <Field label={t('pgTax.employee.mergeIncome')}>
                <Select value={form.incomeMerge} onChange={(e) => setForm({ ...form, incomeMerge: e.target.value as 'yes' | 'no' })}>
                  <option value="no">{t('pgTax.employee.no')}</option>
                  <option value="yes">{t('pgTax.employee.mergeIncomeYes')}</option>
                </Select>
              </Field>
              <Field label={t('pgTax.employee.spouseEmployerId')}>
                <Input dir="ltr" value={form.spouseEmpId} onChange={(e) => setForm({ ...form, spouseEmpId: e.target.value })} placeholder={t('pgTax.employee.spouseEmployerIdPlaceholder')} />
              </Field>
            </div>
          </div>

          {/* Section 5: بيانات الإجازة/ترك العمل */}
          <div>
            <h4 className="mb-3 text-sm font-bold text-brand-600 border-b pb-1.5 flex items-center gap-1">
              <span>5.</span> {t('pgTax.employee.section5')}
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label={t('pgTax.employee.continuity')}>
                <Select
                  value={form.continuity}
                  onChange={(e) => {
                    const continuity = e.target.value as 'active' | 'left'
                    setForm({
                      ...form,
                      continuity,
                      leaveYear: continuity === 'active' ? '' : form.leaveYear,
                      leaveMonth: continuity === 'active' ? '' : form.leaveMonth,
                      leaveDay: continuity === 'active' ? '' : form.leaveDay,
                    })
                  }}
                >
                  <option value="active">{t('pgTax.employee.active')}</option>
                  <option value="left">{t('pgTax.employee.left')}</option>
                </Select>
              </Field>
              {form.continuity === 'active' ? (
                <div className="sm:col-span-2 flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
                  {t('pgTax.employee.continuityActiveNoteMonthly')}
                </div>
              ) : (
                <>
                  <Field label={t('pgTax.employee.leaveYear')}>
                    <Select value={form.leaveYear} onChange={(e) => setForm({ ...form, leaveYear: e.target.value })}>
                      <option value="">{t('pgTax.employee.choose')}</option>
                      {[...Array(5)].map((_, i) => {
                        const y = new Date().getFullYear() - i
                        return <option key={y} value={y.toString()}>{y}</option>
                      })}
                    </Select>
                  </Field>
                  <Field label={t('pgTax.employee.leaveMonth')}>
                    <Select value={form.leaveMonth} onChange={(e) => setForm({ ...form, leaveMonth: e.target.value })}>
                      <option value="">{t('pgTax.employee.choose')}</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={`${m}`}>{t(`pgTax.common.month_${m}`)}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label={t('pgTax.employee.leaveDay')}>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={form.leaveDay}
                      onChange={(e) => {
                        const v = e.target.value
                        setForm({ ...form, leaveDay: v === '' ? '' : String(Math.min(31, Math.max(1, Number(v)))) })
                      }}
                      placeholder={t('pgTax.employee.leaveDayPlaceholder')}
                    />
                  </Field>
                </>
              )}
            </div>
          </div>

          {/* Section 6: الرواتب والمخصصات والتنزيلات */}
          <div>
            <h4 className="mb-3 text-sm font-bold text-brand-600 border-b pb-1.5 flex items-center gap-1">
              <span>6.</span> {t('pgTax.employee.section6')}
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label={t('pgTax.employee.salaryBasic')}>
                <MoneyInput value={form.salary} onChange={(v) => setForm({ ...form, salary: v })} />
              </Field>
              <Field label={t('pgTax.employee.allowancesTaxable')}>
                <MoneyInput value={form.allow} onChange={(v) => setForm({ ...form, allow: v })} />
              </Field>
              <Field label={t('pgTax.employee.allowancesHousing')}>
                <MoneyInput value={form.cashHous} onChange={(v) => setForm({ ...form, cashHous: v })} />
              </Field>
              <Field label={t('pgTax.employee.inKindHousing')}>
                <Select value={form.inKind} onChange={(e) => setForm({ ...form, inKind: e.target.value as FormState['inKind'] })}>
                  <option value="none">{t('pgTax.employee.inKindNone')}</option>
                  <option value="unfurnished">{t('pgTax.employee.inKindUnfurnished')}</option>
                  <option value="furnished">{t('pgTax.employee.inKindFurnished')}</option>
                  <option value="employerPart">{t('pgTax.employee.inKindEmployer')}</option>
                  <option value="hotel">{t('pgTax.employee.inKindHotel')}</option>
                  <option value="caravan">{t('pgTax.employee.inKindCaravan')}</option>
                </Select>
              </Field>
              <Field label={t('pgTax.employee.actualRent')}>
                <MoneyInput value={form.actualRent} onChange={(v) => setForm({ ...form, actualRent: v })} />
              </Field>
              <Field label={t('pgTax.employee.lifeInsurance')}>
                <MoneyInput value={form.ins} onChange={(v) => setForm({ ...form, ins: v })} />
              </Field>
              <Field label={t('pgTax.employee.alimony')}>
                <MoneyInput value={form.alimony} onChange={(v) => setForm({ ...form, alimony: v })} />
              </Field>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

