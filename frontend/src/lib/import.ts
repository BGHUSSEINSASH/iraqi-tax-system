import * as XLSX from 'xlsx'
import type { Employee, MaritalStatus } from './types'
import { uid } from './format'

export interface ExcelImportResult {
  employees: Employee[]
  errors: string[]
  skippedCount: number
}

export const FULL_TEMPLATE_COLUMNS = [
  'الاسم الكامل', 'الجنسية', 'الإقامة الضريبية', 'الجنس', 'تاريخ الميلاد (YYYY-MM-DD)',
  'رقم الهوية الوطنية', 'العنوان الوظيفي', 'تاريخ المباشرة (YYYY-MM-DD)', 'القطاع (خاص/عام)',
  'صاحب العمل الرئيسي (نعم/كلا)', 'اسم صاحب العمل', 'الرقم الضريبي لصاحب العمل',
  'الحالة الزوجية', 'الاسم الرباعي للزوج(ة)', 'رقم هوية الزوج(ة)', 'تاريخ الزواج',
  'تاريخ الطلاق', 'الزوج(ة) من ذوي الإعاقة (نعم/كلا)', 'الزوج(ة) يعمل (نعم/كلا)',
  'دمج الدخل (نعم/كلا)', 'رقم صاحب عمل الزوج(ة)', 'عدد الأولاد المستحقين للسماح',
  'أسماء الأولاد (افصل بفاصلة منقوطة ;)', 'الموظف أتم 63 عاماً (نعم/كلا)',
  'الراتب الأساسي الشهري (د.ع)', 'المخصصات الخاضعة كلياً (د.ع)',
  'مخصصات السكن والطعام - معفاة 30% (د.ع)', 'السكن العيني', 'الإيجار الفعلي الشهري (د.ع)',
  'أقساط التأمين على الحياة (د.ع)', 'النفقة الشرعية (د.ع)',
  'الضمان الاجتماعي والتقاعد 5% (نعم/كلا)', 'الحالة الوظيفية (مستمر/ترك العمل)',
  'سنة ترك العمل', 'شهر ترك العمل', 'يوم ترك العمل', 'تاريخ نهاية العمل (YYYY-MM-DD)', 'ملاحظات',
]

export function buildFullEmployeesTemplate(): (string | number)[][] {
  return [
    [
      'مثال: أحمد عبد الكريم الحسيني', 'عراقي', 'مقيم', 'ذكر', '1980-01-15', '12345678901',
      'مدير مالي', '2026-02-01', 'خاص', 'نعم', 'شركة المنارة للتجارة العامة', '4102012345',
      'متزوج (الزوجة ربة بيت)', 'فاطمة علي', '98765432109', '2010-06-01', '',
      'كلا', 'كلا', 'كلا', '', '2', 'حسن ; زينب', 'كلا',
      '950000', '250000', '150000', 'لا يوجد سكن عيني', '0',
      '25000', '0', 'نعم', 'مستمر', '', '', '', '', 'مثال تعليمي',
    ],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
  ]
}

const num = (cell: unknown): number => {
  const v = parseFloat(String(cell ?? '').replace(/,/g, '').replace(/[^\d.-]/g, ''))
  return isNaN(v) ? 0 : v
}

const yesNo = (cell: unknown, defaultValue = false): boolean => {
  const s = String(cell ?? '').trim()
  if (!s) return defaultValue
  return s === 'نعم' || s === 'نعم ' || s === 'yes' || s === '1' || s === 'Y'
}

const toDateStr = (cell: unknown): string => {
  if (cell === null || cell === undefined || cell === '') return ''
  if (cell instanceof Date && !isNaN(cell.getTime())) {
    const y = cell.getFullYear()
    const m = String(cell.getMonth() + 1).padStart(2, '0')
    const d = String(cell.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  if (typeof cell === 'number' && isFinite(cell) && cell > 20000 && cell < 80000) {
    const ms = Math.round((cell - 25569) * 86400000)
    const dt = new Date(ms)
    if (!isNaN(dt.getTime())) {
      const y = dt.getUTCFullYear()
      const m = String(dt.getUTCMonth() + 1).padStart(2, '0')
      const d = String(dt.getUTCDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    }
  }
  return String(cell ?? '').trim()
}

function parseFullTemplate(
  rows: unknown[][],
  headerRowIdx: number,
  companyId: string,
  existingEmployees: Employee[],
): ExcelImportResult {
  const employees: Employee[] = []
  const errors: string[] = []
  let skippedCount = 0
  const C = FULL_TEMPLATE_COLUMNS.map((_, idx) => idx)

  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r]
    if (!row || row.length === 0) continue

    const name = String(row[C[0]] || '').trim()
    if (!name || name.startsWith('مثال')) {
      skippedCount++
      continue
    }

    const nationalId = String(row[C[5]] || '').trim()
    const existing = existingEmployees.find(
      (e) => e.companyId === companyId && e.name === name && e.nationalId === nationalId,
    )
    if (existing) {
      skippedCount++
      continue
    }

    const gender = String(row[C[3]] || '').trim().includes('أنثى') ? 'female' as const : 'male' as const
    const rawMarital = String(row[C[12]] || '').trim()
    let marital: FormStateMarital = 'single'
    let spouseAtHome = false
    if (rawMarital.includes('متزوج') && (rawMarital.includes('ربة بيت') || rawMarital.includes('بدون دخل'))) {
      marital = 'married_housewife'
      spouseAtHome = true
    } else if (rawMarital.includes('متزوج')) {
      marital = 'married_working'
    } else if (rawMarital.includes('مطلق') || rawMarital.includes('مطلقة')) {
      marital = 'divorced'
    } else if (rawMarital.includes('أرمل') || rawMarital.includes('أرملة')) {
      marital = 'widowed'
    }

    const rawInKind = String(row[C[27]] || '').trim()
    const inKind = rawInKind.includes('غير مؤثث')
      ? 'unfurnished'
      : rawInKind.includes('مؤثث')
        ? 'furnished'
        : rawInKind.includes('مساهمة')
          ? 'employerPart'
          : rawInKind.includes('فندقي')
            ? 'hotel'
            : rawInKind.includes('كرفان')
              ? 'caravan'
              : ('none' as const)

    const rawContinuity = String(row[C[32]] || '').trim()
    const isLeft = rawContinuity.includes('ترك') || String(row[C[33]] || '').trim() !== ''
    const leaveYear = isLeft ? String(row[C[33]] || '').trim() : ''
    const leaveMonth = isLeft ? String(row[C[34]] || '').trim() : ''
    const leaveDay = isLeft ? String(row[C[35]] || '').trim() : ''
    const endDate = isLeft ? toDateStr(row[C[36]]) : ''

    const childrenCount = Math.max(0, Math.min(6, Math.round(num(row[C[21]]))))
    const childrenNames = String(row[C[22]] || '')
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)

    const basicSalary = num(row[C[24]])
    const allowances = num(row[C[25]])
    const cashHous = num(row[C[26]])
    const actualRent = num(row[C[28]])
    const ins = num(row[C[29]])
    const alimony = num(row[C[30]])

    const emp: Employee = {
      id: uid(),
      companyId,
      name,
      nationalId,
      birthDate: toDateStr(row[C[4]]),
      gender,
      maritalStatus: (marital.startsWith('married') ? 'married' : marital) as MaritalStatus,
      jobTitle: String(row[C[6]] || '').trim(),
      startDate: toDateStr(row[C[7]]) || new Date().toISOString().slice(0, 10),
      endDate,
      active: !isLeft,
      basicSalary,
      allowances,
      otherBenefits: cashHous,
      inKindBenefits: 0,
      bonuses: 0,
      isPrimaryEmployer: yesNo(row[C[9]], true),
      spouseAtHome,
      childrenCount,
      socialSecurity: yesNo(row[C[31]], true),
      lifeInsurance: ins,
      alimony,
      notes: String(row[C[37]] || '').trim(),

      nat: String(row[C[1]] || '').trim().includes('أجنبي') ? ('foreign' as const) : ('iraqi' as const),
      res: String(row[C[2]] || '').trim().includes('غير مقيم') ? ('nonresident' as const) : ('resident' as const),
      sec: String(row[C[8]] || '').trim().includes('عام') ? ('government' as const) : ('private' as const),
      mainEmployer: yesNo(row[C[9]], true) ? ('yes' as const) : ('no' as const),
      employerName: String(row[C[10]] || '').trim(),
      employerId: String(row[C[11]] || '').trim(),
      marital,
      spouseName: String(row[C[13]] || '').trim(),
      spouseCivilId: String(row[C[14]] || '').trim(),
      marriageDate: toDateStr(row[C[15]]),
      divorceDate: toDateStr(row[C[16]]),
      spouseDisabled: yesNo(row[C[17]]) ? ('yes' as const) : ('no' as const),
      spouseEmployed: yesNo(row[C[18]]) ? ('yes' as const) : ('no' as const),
      incomeMerge: yesNo(row[C[19]]) ? ('yes' as const) : ('no' as const),
      spouseEmpId: String(row[C[20]] || '').trim(),
      child: childrenCount,
      childrenNames,
      over63: yesNo(row[C[23]]) ? ('yes' as const) : ('no' as const),
      salary: basicSalary,
      allow: allowances,
      cashHous,
      inKind,
      actualRent,
      ins,
      leaveYear,
      leaveMonth,
      leaveDay,
    }
    employees.push(emp)
  }
  return { employees, errors, skippedCount }
}

type FormStateMarital = 'single' | 'married_housewife' | 'married_working' | 'widowed' | 'divorced'

const BULK_IMPORT_COLUMNS = [
  'الاسم الثلاثي واللقب', 'الجنسية', 'الإقامة الضريبية', 'الجنس', 'تاريخ الميلاد',
  'رقم الهوية الوطنية', 'رقم الهاتف', 'البريد الإلكتروني', 'القطاع', 'تاريخ بداية العمل',
  'تاريخ نهاية العمل', 'صاحب العمل الرئيسي', 'العنوان الوظيفي', 'اسم جهة العمل',
  'الرقم التعريفي لجهة العمل', 'المحافظة', 'المدينة', 'الحي/المحلة', 'الشارع',
  'الحالة الزوجية', 'اسم الزوج(ة)', 'عدد الأولاد', 'الموظف أتم 63 عاماً',
  'الراتب الشهري الأساسي (د.ع)', 'المخصصات الشهرية الخاضعة (د.ع)', 'السنة المالية / الفترة (اختياري)'
]

export function parseEmployeesExcel(
  fileData: ArrayBuffer,
  companyId: string,
  existingEmployees: Employee[],
): ExcelImportResult {
  const employees: Employee[] = []
  const errors: string[] = []
  let skippedCount = 0

  try {
    const data = new Uint8Array(fileData)
    const wb = XLSX.read(data, { type: 'array', cellDates: true })
    const ws = wb.Sheets[wb.SheetNames[0]]
    if (!ws) {
      return { employees: [], errors: ['لم يتم العثور على ورقة عمل في ملف Excel'], skippedCount: 0 }
    }

    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' })
    if (rows.length === 0) {
      return { employees: [], errors: ['ملف Excel فارغ'], skippedCount: 0 }
    }

    // Determine template type
    let isFullTemplate = false
    let fullHeaderRowIdx = -1
    let isBulkTemplate = false
    let bulkHeaderRowIdx = -1

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (!row) continue
      if (
        row.some((cell) => String(cell).includes('أسماء الأولاد')) &&
        row.some((cell) => String(cell).includes('الراتب الأساسي الشهري'))
      ) {
        isFullTemplate = true
        fullHeaderRowIdx = i
        break
      }
      if (
        row.some((cell) => String(cell).includes('الاسم الثلاثي واللقب')) &&
        row.some((cell) => String(cell).includes('الحالة الزوجية'))
      ) {
        isBulkTemplate = true
        bulkHeaderRowIdx = i
        break
      }
    }

    if (isFullTemplate && fullHeaderRowIdx !== -1) {
      const fullResult = parseFullTemplate(rows, fullHeaderRowIdx, companyId, existingEmployees)
      if (fullResult.employees.length > 0 || fullResult.skippedCount > 0 || fullResult.errors.length > 0) {
        return fullResult
      }
    }

    if (isBulkTemplate && bulkHeaderRowIdx !== -1) {
      // 25-column bulk import template
      for (let r = bulkHeaderRowIdx + 1; r < rows.length; r++) {
        const row = rows[r]
        if (!row || row.length === 0) continue

        const name = String(row[0] || '').trim()
        if (!name) {
          skippedCount++
          continue
        }

        const nationalId = String(row[5] || '').trim()
        const existing = existingEmployees.find(
          (e) => e.companyId === companyId && e.name === name && e.nationalId === nationalId,
        )
        if (existing) {
          skippedCount++
          continue
        }

        const gender = String(row[3] || '').trim().includes('أنثى') ? 'female' as const : 'male' as const
        const rawMarital = String(row[19] || '').trim()
        let maritalStatus: MaritalStatus = 'single'
        let spouseAtHome = false

        if (rawMarital.includes('متزوج') && (rawMarital.includes('ربة بيت') || rawMarital.includes('بدون دخل'))) {
          maritalStatus = 'married'
          spouseAtHome = true
        } else if (rawMarital.includes('متزوج')) {
          maritalStatus = 'married'
        } else if (rawMarital.includes('مطلق') || rawMarital.includes('مطلقة')) {
          maritalStatus = 'divorced'
        } else if (rawMarital.includes('أرمل') || rawMarital.includes('أرملة')) {
          maritalStatus = 'widowed'
        }

        const basicSalary = parseFloat(String(row[23] || '0').replace(/,/g, '')) || 0
        const allowances = parseFloat(String(row[24] || '0').replace(/,/g, '')) || 0
        const childrenCount = Math.max(0, Math.min(6, parseInt(String(row[21]), 10) || 0))
        const isPrimaryEmployer = String(row[11] || 'نعم').trim() === 'نعم'

        const emp: Employee = {
          id: uid(),
          companyId,
          name,
          nationalId,
          birthDate: toDateStr(row[4]),
          gender,
          maritalStatus,
          jobTitle: String(row[12] || '').trim(),
          startDate: toDateStr(row[9]) || new Date().toISOString().slice(0, 10),
          endDate: toDateStr(row[10]),
          active: true,
          basicSalary,
          allowances,
          otherBenefits: 0,
          inKindBenefits: 0,
          bonuses: 0,
          isPrimaryEmployer,
          spouseAtHome,
          childrenCount,
          socialSecurity: true, // Default to true
          lifeInsurance: parseFloat(String(row[37] || '0').replace(/,/g, '')) || 0,
          alimony: parseFloat(String(row[38] || '0').replace(/,/g, '')) || 0,
          notes: '',
        }
        employees.push(emp)
      }
    } else {
      // Look for government / simpler format
      let headerRowIdx = -1
      for (let h = 0; h < rows.length; h++) {
        const r = rows[h]
        if (
          r &&
          r.some((cell) => {
            const s = String(cell)
            return s.includes('اجمالي الدخل') || s.includes('اجمالى الدخل') || s.includes('اسم الموظف')
          })
        ) {
          headerRowIdx = h
          break
        }
      }

      if (headerRowIdx === -1) {
        return { employees: [], errors: ['تعذر تحديد تخطيط الأعمدة أو رأس الجدول في ملف Excel'], skippedCount: 0 }
      }

      for (let r = headerRowIdx + 1; r < rows.length; r++) {
        const row = rows[r]
        if (!row || row.length < 3) continue

        const name = String(row[0] || row[1] || '').trim()
        if (
          !name ||
          name === 'المجموع' ||
          name === 'المجموع الفرعي' ||
          name === 'الإجمالي' ||
          name.startsWith('توقيع')
        ) {
          skippedCount++
          continue
        }

        const nationalId = String(row[1] || row[2] || '').trim()
        const existing = existingEmployees.find(
          (e) => e.companyId === companyId && e.name === name,
        )
        if (existing) {
          skippedCount++
          continue
        }

        const basicSalary = parseFloat(String(row[2] || '0').replace(/,/g, '')) || 0
        const allowances = parseFloat(String(row[3] || '0').replace(/,/g, '')) || 0

        const emp: Employee = {
          id: uid(),
          companyId,
          name,
          nationalId,
          birthDate: '',
          gender: 'male',
          maritalStatus: 'single',
          jobTitle: '',
          startDate: new Date().toISOString().slice(0, 10),
          endDate: '',
          active: true,
          basicSalary,
          allowances,
          otherBenefits: 0,
          inKindBenefits: 0,
          bonuses: 0,
          isPrimaryEmployer: true,
          spouseAtHome: false,
          childrenCount: 0,
          socialSecurity: false,
          lifeInsurance: 0,
          alimony: 0,
          notes: '',
        }
        employees.push(emp)
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    errors.push(`حدث خطأ أثناء معالجة الملف: ${msg}`)
  }

  return { employees, errors, skippedCount }
}
