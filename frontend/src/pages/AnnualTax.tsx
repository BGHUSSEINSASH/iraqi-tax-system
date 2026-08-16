import { useEffect, useMemo, useState } from 'react'
import { Calculator, Save, FileSpreadsheet, FileText, Info, Plus, Upload, ScrollText, Eye, Printer, Landmark, FileCheck2 } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { PageHead, Card, CardHeader, CardBody, Button, Badge, DataTable, Select, useToast, Modal, Field, Input, Toggle, MoneyInput, Tabs, type Column } from '../components/ui'
import type { AnnualRow, Employee, MaritalStatus } from '../lib/types'
import { calcEmployeeAnnual, calcEmployeeMonthly } from '../lib/tax'
import { fmt, money, nowYear, uid, fmtDate } from '../lib/format'
import { exportExcel, exportPdf } from '../lib/export'
import { parseEmployeesExcel, buildFullEmployeesTemplate, FULL_TEMPLATE_COLUMNS } from '../lib/import'
import { buildEmployeeDD14Html, buildAnnualStatementHtml, buildAnnualStatementExcel, buildAnnualHistoryHtml, buildAnnualHistoryExcel, employeePeriodForYear, openFormPrintWindow, FORM_PRINT_CSS, computeEmployeeAnnual } from '../lib/officialForms'
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

export default function AnnualTax() {
  const { data, currentCompany, add, replace } = useApp()
  const { push } = useToast()
  const { t } = useI18n()
  const year = nowYear()
  const cid = data.activeCompanyId
  const [selYear, setSelYear] = useState(year)
  const [rows, setRows] = useState<AnnualRow[]>([])
  const [empModalOpen, setEmpModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [tab, setTab] = useState<'data' | 'annual-statement'>('data')
  const [preview, setPreview] = useState<{ title: string; html: string } | null>(null)

  const openNewEmployee = () => {
    setForm({ ...emptyForm })
    setEmpModalOpen(true)
  }

  const openPreview = (title: string, html: string) => {
    setPreview({ title, html: `<style>${FORM_PRINT_CSS}</style>${html}` })
  }

  const printAnnualStatement = () => {
    const employees = data.employees.filter((e) => e.companyId === cid)
    if (employees.length === 0) {
      push('error', t('pgTax.annual.noEmployees'))
      return
    }
    const html = buildAnnualStatementHtml(employees, currentCompany, selYear, data)
    openFormPrintWindow(t('pgTax.annual.tableTitle', { year: selYear }), html)
    push('success', t('pgTax.annual.annualStatementOpened', { year: selYear }))
  }

  const printAnnualWithForms = () => {
    const employees = data.employees.filter((e) => e.companyId === cid)
    if (employees.length === 0) {
      push('error', t('pgTax.annual.noEmployees'))
      return
    }
    const html =
      buildAnnualStatementHtml(employees, currentCompany, selYear, data) +
      employees.map((e) => buildEmployeeDD14Html(e, currentCompany, data.config, selYear, data)).join('')
    openFormPrintWindow(`${t('pgTax.annual.tableTitle', { year: selYear })} + ${t('pgTax.annual.dd14')}`, html)
    push('success', t('pgTax.annual.annualStatementWithFormsOpened'))
  }

  const exportAnnualStatementExcel = () => {
    const employees = data.employees.filter((e) => e.companyId === cid)
    const rows = buildAnnualStatementExcel(employees, currentCompany, selYear, data)
    const headers = Array(15).fill('')
    exportExcel(`${t('pgTax.annual.excelSheet').replace(/ /g, '-')}-${selYear}.xlsx`, `${t('pgTax.annual.excelSheet')} ${selYear}`, headers, rows)
    push('success', t('pgTax.annual.annualExcelExported', { year: selYear }))
  }

  const printAllYears = () => {
    const employees = data.employees.filter((e) => e.companyId === cid)
    if (employees.length === 0) {
      push('error', t('pgTax.annual.noEmployees'))
      return
    }
    const html = buildAnnualHistoryHtml(employees, currentCompany, year, data)
    openFormPrintWindow(`${t('pgTax.annual.statementAllYears')} — ${year}`, html)
    push('success', t('pgTax.annual.allYearsOpened', { year }))
  }

  const exportAllYearsExcel = () => {
    const employees = data.employees.filter((e) => e.companyId === cid)
    if (employees.length === 0) {
      push('error', t('pgTax.annual.noEmployees'))
      return
    }
    const rows = buildAnnualHistoryExcel(employees, currentCompany, year, data)
    const headers = Array(13).fill('')
    exportExcel(`${t('pgTax.annual.statementAllYears').replace(/ /g, '-')}-${year}.xlsx`, `${t('pgTax.annual.statementAllYears')} ${year}`, headers, rows)
    push('success', t('pgTax.annual.allYearsExported', { year }))
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
    () => data.employees.filter((e) => e.companyId === cid),
    [data.employees, cid],
  )

  const compute = () => {
    const next: AnnualRow[] = employees.map((emp) => {
      const monthlyRows = data.monthlyRows.filter(
        (r) => r.companyId === cid && r.year === selYear && r.employeeId === emp.id,
      )
      const paidTax = monthlyRows.reduce((s, r) => s + r.adjusted, 0)
      const r = calcEmployeeAnnual(emp, data.config, 12, paidTax)
      return {
        id: `ar-${emp.id}-${selYear}`,
        companyId: cid,
        year: selYear,
        employeeId: emp.id,
        months: 12,
        gross: r.gross,
        deductions: r.deductions,
        taxable: r.taxable,
        annualTax: r.tax,
        paidTax,
        difference: r.difference,
      }
    })
    setRows(next)
  }

  const load = () => {
    const stored = data.annualRows.filter((r) => r.companyId === cid && r.year === selYear)
    if (stored.length > 0) {
      setRows(stored)
      return
    }
    compute()
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selYear, cid, data.employees, data.config])

  const save = () => {
    replace('annualRows', [
      ...data.annualRows.filter((r) => !(r.companyId === cid && r.year === selYear)),
      ...rows,
    ])
    push('success', t('pgTax.annual.saved', { year: selYear }))
  }

  const totals = useMemo(
    () => ({
      gross: rows.reduce((s, r) => s + r.gross, 0),
      deductions: rows.reduce((s, r) => s + r.deductions, 0),
      taxable: rows.reduce((s, r) => s + r.taxable, 0),
      tax: rows.reduce((s, r) => s + r.annualTax, 0),
      paid: rows.reduce((s, r) => s + r.paidTax, 0),
      diff: rows.reduce((s, r) => s + r.difference, 0),
    }),
    [rows],
  )

  const columns: Column<AnnualRow>[] = [
    {
      key: 'employee',
      title: t('pgTax.annual.colEmployee'),
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
    { key: 'gross', title: t('pgTax.annual.colAnnualGross'), total: (rs) => rs.reduce((s, r) => s + r.gross, 0), render: (r) => <span className="text-xs">{money(r.gross)}</span> },
    { key: 'deductions', title: t('pgTax.annual.colAnnualDeductions'), total: (rs) => rs.reduce((s, r) => s + r.deductions, 0), render: (r) => <span className="text-xs text-ink-500">{money(r.deductions)}</span> },
    { key: 'taxable', title: t('pgTax.annual.colAnnualTaxable'), total: (rs) => rs.reduce((s, r) => s + r.taxable, 0), render: (r) => <span className="text-xs font-semibold">{money(r.taxable)}</span> },
    { key: 'annualTax', title: t('pgTax.annual.colAnnualTax'), total: (rs) => rs.reduce((s, r) => s + r.annualTax, 0), render: (r) => <span className="text-xs font-bold text-brand-700">{money(r.annualTax)}</span> },
    { key: 'paidTax', title: t('pgTax.annual.colPaidYear'), total: (rs) => rs.reduce((s, r) => s + r.paidTax, 0), render: (r) => <span className="text-xs text-ink-500">{money(r.paidTax)}</span> },
    {
      key: 'difference',
      title: t('pgTax.annual.colDiff'),
      total: (rs) => rs.reduce((s, r) => s + r.difference, 0),
      render: (r) =>
        Math.abs(r.difference) < 1 ? (
          <Badge tone="green">{t('pgTax.annual.settled')}</Badge>
        ) : r.difference > 0 ? (
          <Badge tone="red">{t('pgTax.annual.due', { amount: money(r.difference) })}</Badge>
        ) : (
          <Badge tone="amber">{t('pgTax.annual.refund', { amount: money(Math.abs(r.difference)) })}</Badge>
        ),
    },
    {
      key: 'actions',
      title: t('pgTax.annual.colForm'),
      render: (r) => {
        const e = data.employees.find((x) => x.id === r.employeeId)
        if (!e) return null
        return (
          <Button
            size="sm"
            variant="secondary"
            title={t('pgTax.annual.formPrintTitle')}
            onClick={() => {
              const html = buildEmployeeDD14Html(e, currentCompany, data.config, selYear, data)
              openFormPrintWindow(t('pgTax.annual.previewTitle', { name: e.name }), html)
              push('success', t('pgTax.annual.dd14Opened', { name: e.name }))
            }}
          >
            <ScrollText size={13} className="ml-1 inline" /> {t('pgTax.annual.dd14')}
          </Button>
        )
      }
    }
  ]

  const annualRows = useMemo(
    () => employees.map((e) => ({ id: e.id, emp: e, math: computeEmployeeAnnual(e, data.config, selYear, data) })),
    [employees, data.config, selYear, data],
  )

  const annualColumns: Column<(typeof annualRows)[number]>[] = [
    {
      key: 'emp',
      title: t('pgTax.annual.colEmp'),
      render: (r) => <span className="font-semibold text-ink-800">{r.emp.name}</span>,
    },
    { key: 'months', title: t('pgTax.annual.colMonths'), render: (r) => <Badge tone="blue">{r.math.months}</Badge> },
    {
      key: 'status',
      title: t('pgTax.annual.colStatus'),
      render: (r) =>
        r.math.months >= 12 ? (
          <Badge tone="green">{t('pgTax.annual.complete12')}</Badge>
        ) : (
          <Badge tone="amber">{t('pgTax.annual.missingMonths', { n: 12 - r.math.months })}</Badge>
        ),
    },
    {
      key: 'period',
      title: t('pgTax.annual.colPeriod'),
      render: (r) => {
        const p = employeePeriodForYear(r.emp, selYear)
        return (
          <span className="text-xs whitespace-nowrap" dir="ltr">
            {p.start} ← {p.end}
          </span>
        )
      },
    },
    { key: 'gross', title: t('pgTax.annual.colGross'), render: (r) => <span className="text-xs">{money(r.math.gross)}</span> },
    { key: 'ded', title: t('pgTax.annual.colDeductions'), render: (r) => <span className="text-xs">{money(r.math.deductions)}</span> },
    { key: 'taxable', title: t('pgTax.annual.colTaxable'), render: (r) => <span className="text-xs">{money(r.math.taxable)}</span> },
    { key: 'tax', title: t('pgTax.annual.colTax'), render: (r) => <span className="text-xs font-bold text-brand-700">{money(r.math.tax)}</span> },
    { key: 'paid', title: t('pgTax.annual.colPaid'), render: (r) => <span className="text-xs">{money(r.math.paidTax)}</span> },
    {
      key: 'diff',
      title: t('pgTax.annual.colDiff'),
      render: (r) => {
        const d = r.math.tax - r.math.paidTax
        return Math.abs(d) < 1 ? <Badge tone="green">{t('pgTax.annual.settled')}</Badge> : d > 0 ? <Badge tone="red">{t('pgTax.annual.due', { amount: money(d) })}</Badge> : <Badge tone="amber">{t('pgTax.annual.refund', { amount: money(Math.abs(d)) })}</Badge>
      },
    },
    {
      key: 'actions',
      title: '',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="secondary" onClick={() => openPreview(t('pgTax.annual.previewTitle', { name: r.emp.name }), buildEmployeeDD14Html(r.emp, currentCompany, data.config, selYear, data))}>
            <Eye size={13} /> {t('pgTax.annual.formBtn')}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => {
            const html = buildEmployeeDD14Html(r.emp, currentCompany, data.config, selYear, data)
            openFormPrintWindow(t('pgTax.annual.previewTitle', { name: r.emp.name }), html)
            push('success', t('pgTax.annual.dd14Opened', { name: r.emp.name }))
          }}>
            <Printer size={13} />
          </Button>
        </div>
      ),
    },
  ]

  const doExportExcel = () => {
    const headers = [
      t('pgTax.annual.colEmp'),
      t('pgTax.employee.colNationalId'),
      t('pgTax.annual.colGross'),
      t('pgTax.annual.colDeductions'),
      t('pgTax.annual.colTaxable'),
      t('pgTax.annual.colTax'),
      t('pgTax.annual.colPaid'),
      t('pgTax.annual.colDiff'),
    ]
    const body = rows.map((r) => {
      const e = data.employees.find((x) => x.id === r.employeeId)
      return [e?.name ?? '', e?.nationalId ?? '', r.gross, r.deductions, r.taxable, r.annualTax, r.paidTax, r.difference]
    })
    body.push([t('pgTax.common.total'), '', totals.gross, totals.deductions, totals.taxable, totals.tax, totals.paid, totals.diff])
    exportExcel(`${t('pgTax.annual.excelSheet').replace(/ /g, '-')}-${selYear}.xlsx`, t('pgTax.annual.excelSheet'), headers, body)
    push('success', t('pgTax.annual.exportExcelDone'))
  }

  const doExportPdf = () => {
    const headers = [
      t('pgTax.annual.colEmp'),
      t('pgTax.employee.colNationalId'),
      t('pgTax.annual.colGross'),
      t('pgTax.annual.colDeductions'),
      t('pgTax.annual.colTaxable'),
      t('pgTax.annual.colTax'),
      t('pgTax.annual.colPaid'),
      t('pgTax.annual.colDiff'),
    ]
    const body = rows.map((r) => {
      const e = data.employees.find((x) => x.id === r.employeeId)
      return [e?.name ?? '', e?.nationalId ?? '', fmt(r.gross), fmt(r.deductions), fmt(r.taxable), fmt(r.annualTax), fmt(r.paidTax), fmt(r.difference)]
    })
    body.push([t('pgTax.common.total'), '', fmt(totals.gross), fmt(totals.deductions), fmt(totals.taxable), fmt(totals.tax), fmt(totals.paid), fmt(totals.diff)])
    exportPdf({
      title: t('pgTax.annual.pdfTitle'),
      subtitle: t('pgTax.annual.pdfSubtitle', { year: selYear }),
      company: currentCompany,
      headers,
      rows: body,
      footers: [t('pgTax.annual.pdfFooter1'), t('pgTax.annual.pdfFooter2')],
    })
  }

  return (
    <div>
      <PageHead
        title={t('pgTax.annual.title')}
        desc={t('pgTax.annual.desc')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select className="max-w-[110px]" value={selYear} onChange={(e) => setSelYear(Number(e.target.value))}>
              {[year - 2, year - 1, year].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
            <input type="file" id="annual-excel-import" accept=".xlsx,.xls" className="hidden" onChange={handleImportExcel} />
            <Button variant="secondary" onClick={() => document.getElementById('annual-excel-import')?.click()}>
              <Upload size={16} /> {t('pgTax.common.importExcel')}
            </Button>
            <Button variant="secondary" onClick={downloadTemplate} title={t('pgTax.common.templateTooltip')}>
              <FileSpreadsheet size={16} /> {t('pgTax.common.employeeTemplate')}
            </Button>
            <Button variant="secondary" onClick={openNewEmployee}>
              <Plus size={16} /> {t('pgTax.common.addEmployee')}
            </Button>
            <Button variant="secondary" onClick={compute}>
              <Calculator size={16} /> {t('pgTax.annual.recomputeBtn')}
            </Button>
            <Button onClick={save}>
              <Save size={16} /> {t('pgTax.annual.saveBtn')}
            </Button>
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Tabs
          items={[
            { id: 'data', label: t('pgTax.annual.tabData') },
            { id: 'annual-statement', label: t('pgTax.annual.tabAnnualStatement') },
          ]}
          value={tab}
          onChange={setTab}
        />
        <div className="mr-auto flex items-center gap-2">
          <Select className="max-w-[130px]" value={selYear} onChange={(e) => setSelYear(Number(e.target.value))}>
            {[year - 3, year - 2, year - 1, year, year + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {tab === 'data' && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-5">
            <Card className="p-4">
              <div className="text-xs text-ink-500">{t('pgTax.annual.statEmployees')}</div>
              <div className="mt-1 text-xl font-bold text-ink-800">{fmt(rows.length)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-ink-500">{t('pgTax.annual.statAnnualIncome')}</div>
              <div className="mt-1 text-xl font-bold text-ink-800">{money(totals.gross)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-ink-500">{t('pgTax.annual.statTaxable')}</div>
              <div className="mt-1 text-xl font-bold text-ink-800">{money(totals.taxable)}</div>
            </Card>
            <Card className="p-4 bg-brand-600 text-white">
              <div className="text-xs text-emerald-100">{t('pgTax.annual.statAnnualTax')}</div>
              <div className="mt-1 text-xl font-bold">{money(totals.tax)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-ink-500">{t('pgTax.annual.statDiff')}</div>
              <div className="mt-1 text-xl font-bold text-red-600">{money(totals.diff)}</div>
            </Card>
          </div>

          <Card>
            <CardHeader
              title={t('pgTax.annual.tableTitle', { year: selYear })}
              subtitle={t('pgTax.annual.tableSubtitle')}
              action={
                <>
                  <Button variant="secondary" size="sm" onClick={doExportExcel}>
                    <FileSpreadsheet size={15} /> {t('pgTax.common.excel')}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={doExportPdf}>
                    <FileText size={15} /> {t('pgTax.common.pdf')}
                  </Button>
                </>
              }
            />
            <CardBody className="p-0">
              <DataTable columns={columns} rows={rows} dense empty={t('pgTax.annual.tableEmpty')} />
            </CardBody>
          </Card>

          <div className="mt-4 flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
            <Info size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">{t('pgTax.annual.calcMethod')}</p>
              <p className="mt-1 text-sky-700">
                {t('pgTax.annual.calcMethodText')}
              </p>
            </div>
          </div>
        </>
      )}

      {tab === 'annual-statement' && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs text-ink-500"><Landmark size={15} className="text-brand-600" /> {t('pgTax.annual.statEmpCount')}</div>
              <div className="mt-1 text-xl font-bold text-ink-800">{fmt(rows.length)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-ink-500">{t('pgTax.annual.statAnnualGross')}</div>
              <div className="mt-1 text-xl font-bold text-ink-800">{money(totals.gross)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-ink-500">{t('pgTax.annual.statAnnualTaxDue')}</div>
              <div className="mt-1 text-xl font-bold text-brand-700">{money(totals.tax)}</div>
            </Card>
            <Card className="p-4 bg-brand-600 text-white">
              <div className="text-xs text-emerald-100">{t('pgTax.annual.statPaidYear')}</div>
              <div className="mt-1 text-xl font-bold">{money(totals.paid)}</div>
            </Card>
          </div>

          <Card>
            <CardHeader
              title={t('pgTax.annual.statementTitle', { year: selYear })}
              subtitle={t('pgTax.annual.statementSubtitle')}
              action={
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={exportAnnualStatementExcel}>
                    <FileSpreadsheet size={14} /> {t('pgTax.common.excel')}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={printAnnualStatement}>
                    <FileText size={14} /> {t('pgTax.annual.printStatement')}
                  </Button>
                  <Button size="sm" onClick={printAnnualWithForms}>
                    <ScrollText size={14} /> {t('pgTax.annual.statementWithForms')}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={exportAllYearsExcel}>
                    <FileSpreadsheet size={14} /> {t('pgTax.annual.allYearsExcel')}
                  </Button>
                  <Button size="sm" onClick={printAllYears}>
                    <ScrollText size={14} /> {t('pgTax.annual.statementAllYears')}
                  </Button>
                </div>
              }
            />
            <CardBody className="p-0">
              <DataTable columns={annualColumns} rows={annualRows} dense empty={t('pgTax.annual.emptyNoEmployees')} />
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
                <FileCheck2 size={18} className="mt-0.5 shrink-0" />
                <div>
                  <strong>{t('pgTax.annual.infoBlockTitle')}</strong> {t('pgTax.annual.infoBlockText')}
                  <div className="mt-1 text-xs text-sky-700">{t('pgTax.annual.reportDate', { date: fmtDate(new Date().toISOString()) })}</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </>
      )}

      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview?.title ?? ''}
        size="xl"
      >
        {preview && (
          <>
            <iframe
              title={preview.title}
              className="h-[75vh] w-full rounded-xl border border-ink-200 bg-white"
              srcDoc={`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"/><style>body{font-family:'Tajawal','Segoe UI',sans-serif;background:#e2e8f0;}${preview.html}</style></head><body>${preview.html}</body></html>`}
            />
            <div className="mt-3 flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  const html = preview.html.replace(/<style>[\s\S]*?<\/style>/, '').trim()
                  openFormPrintWindow(preview.title, html)
                }}
              >
                <Printer size={14} /> {t('pgTax.annual.printSavePdf')}
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={empModalOpen}
        onClose={() => setEmpModalOpen(false)}
        title={t('pgTax.employee.titleAnnual')}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEmpModalOpen(false)}>
              {t('pgTax.common.cancel')}
            </Button>
            <Button onClick={saveNewEmployee}>{t('pgTax.common.addEmployee')}</Button>
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

          {/* Section 5: الحالة الوظيفية / بيانات ترك العمل */}
          <div>
            <h4 className="mb-3 text-sm font-bold text-brand-600 border-b pb-1.5 flex items-center gap-1">
              <span>5.</span> {t('pgTax.employee.section5Annual')}
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
                  {t('pgTax.employee.continuityActiveNoteAnnual')}
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
