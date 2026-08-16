import type { AppData, Company, Employee, MonthlyRow, TaxConfig } from './types'
import { fmt, monthName } from './format'
import { calcEmployeeMonthly, progressiveTax } from './tax'
import { translate } from '../i18n'
import { dictionaries } from '../i18n/locales'
import type { LangCode } from '../i18n/locales'

const tr = (key: string, vars?: Record<string, string | number>): string =>
  translate(`pgDocs.forms.${key}`, vars)

const monthLabel = (m: number): string => {
  const lang = document.documentElement.lang as LangCode
  const months = dictionaries[lang]?.months
  if (months && months[m - 1]) return months[m - 1]
  return monthName(m)
}

const esc = (v: unknown): string =>
  String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const fmtN = (n: number): string => fmt(Math.round(n || 0))

interface EmployeeMath {
  gross: number
  deductions: number
  taxable: number
  tax: number
  months: number
  paidTax: number
}

export function employeeLeaveDate(emp: Employee): string {
  if (emp.leaveYear && emp.leaveMonth) {
    const y = Number(emp.leaveYear)
    const m = Math.max(1, Math.min(12, Number(emp.leaveMonth)))
    const lastDay = new Date(y, m, 0).getDate()
    const d = emp.leaveDay ? Math.min(lastDay, Math.max(1, Number(emp.leaveDay))) : lastDay
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }
  return emp.endDate || ''
}

export function employeePeriodForYear(
  emp: Employee,
  year: number,
): { start: string; end: string; leaveDate: string } {
  const start = `${year}-01-01`
  const leaveDate = employeeLeaveDate(emp)
  const leaveYear = leaveDate ? Number(leaveDate.slice(0, 4)) : 0
  const end = leaveYear === year && leaveDate ? leaveDate : `${year}-12-31`
  return { start, end, leaveDate }
}

export function computeEmployeeAnnual(
  emp: Employee,
  cfg: TaxConfig,
  year: number,
  data: AppData,
): EmployeeMath {
  const monthly = calcEmployeeMonthly(emp, cfg)
  const cid = emp.companyId
  const rows = (data.monthlyRows || []).filter(
    (r) => r.companyId === cid && r.year === year && r.employeeId === emp.id,
  )
  const months =
    rows.length > 0
      ? rows.length
      : Number(emp.leaveYear) === year && emp.leaveMonth
        ? Math.max(1, Math.min(12, Number(emp.leaveMonth)))
        : 12
  const gross = monthly.gross * months
  const deductions = monthly.deductions * months
  const taxable = Math.max(0, gross - deductions)
  const annualTax = progressiveTax(taxable, cfg.annualBrackets || cfg.employeeBrackets)
  const paidTax = rows.length > 0 ? rows.reduce((s, r) => s + (r.adjusted || 0), 0) : 0
  return { gross, deductions, taxable, tax: annualTax, months, paidTax }
}

function fmtLine(val: unknown, width = '120px', bold = true): string {
  const v = val ? esc(val) : '&nbsp;'
  return `<span style="display:inline-block; border-bottom:1px solid #000; padding:0 5px; min-width:${width}; text-align:center; font-weight:${bold ? 'bold' : 'normal'};">${v}</span>`
}

function box(flag: boolean): string {
  return flag
    ? '<span style="display:inline-block;width:12px;height:12px;border:1px solid #000;text-align:center;line-height:12px;font-size:10px;margin-inline-start:2px;position:relative;top:2px;">&#10003;</span>'
    : '<span style="display:inline-block;width:12px;height:12px;border:1px solid #000;margin-inline-start:2px;position:relative;top:2px;"></span>'
}

function pageHeader(pn: number, year: number, title = tr('dd14Title'), sub = tr('dd14Subtitle')): string {
  return `<div style="display:flex; justify-content:space-between; margin-bottom:10px; align-items:center;">
    <div style="font-size:11px; line-height:1.3;">${tr('formNoLabel')}<br>${tr('financialYearLabel', { year })}<br>${tr('pageLabel', { pn })}</div>
    <div style="text-align:center; font-size:15px; flex-grow:1;"><strong>${title}</strong><br><span style="font-size:10px;">${sub}</span></div>
    <div style="font-size:11px; text-align:right; line-height:1.3;">${tr('republicIraq')}<br>${tr('ministryFinance')}<br>${tr('generalTaxCommission')}</div>
  </div>`
}

export function buildEmployeeDD14Html(
  emp: Employee,
  company: Company | undefined,
  cfg: TaxConfig,
  year: number,
  data: AppData,
): string {
  const math = computeEmployeeAnnual(emp, cfg, year, data)
  const annualGross = math.gross
  const annualDed = math.deductions
  const annualTaxable = math.taxable
  const annualTax = math.tax
  const monthsShown = math.months
  const employerName = company?.name ?? emp.jobTitle
  const employerId = company?.taxId ?? ''

  const period = employeePeriodForYear(emp, year)
  const periodStart = period.start
  const periodEnd = period.end
  const leaveDate = period.leaveDate

  const maritalLabel =
    emp.maritalStatus === 'single' ? tr('maritalSingle') : emp.maritalStatus === 'divorced' ? tr('maritalDivorced') : emp.maritalStatus === 'widowed' ? tr('maritalWidowed') : tr('maritalMarried')

  let childRows = ''
  const childNames = (emp as any).childrenNames || []
  for (let i = 0; i < 6; i++) {
    const has = i < (emp.childrenCount || 0)
    const name = has && i < childNames.length ? (childNames[i] || '') : ''
    childRows += `<tr>
      <td style="border:1px solid #000;padding:4px;text-align:center;">${i + 1}</td>
      <td style="border:1px solid #000;padding:4px;">${esc(name)}</td>
      <td style="border:1px solid #000;padding:4px;text-align:center;">${has ? '—' : ''}</td>
      <td style="border:1px solid #000;padding:4px;text-align:center;">${has ? '—' : ''}</td>
      <td style="border:1px solid #000;padding:4px;text-align:center;">${has ? '—' : ''}</td>
      <td style="border:1px solid #000;padding:4px;text-align:center;">${has ? '—' : ''}</td>
      <td style="border:1px solid #000;padding:4px;text-align:center;">${has ? tr('childrenGenderMale') : ''}</td>
    </tr>`
  }

  const taxableColumn = annualTaxable <= 250000 ? 'a' : annualTaxable <= 500000 ? 'b' : annualTaxable <= 1000000 ? 'c' : 'd'
  const bracketStart = taxableColumn === 'a' ? 0 : taxableColumn === 'b' ? 250000 : taxableColumn === 'c' ? 500000 : 1000000
  const bracketRate = taxableColumn === 'a' ? 0.03 : taxableColumn === 'b' ? 0.05 : taxableColumn === 'c' ? 0.1 : 0.15
  const baseTax = taxableColumn === 'a' ? 0 : taxableColumn === 'b' ? 7500 : taxableColumn === 'c' ? 20000 : 70000
  const row3Amount = Math.max(0, annualTaxable - bracketStart)
  const row5Amount = Math.round(row3Amount * bracketRate)
  const row7Amount = Math.round(baseTax + row5Amount)

  const bracketCells = (v: number): string => {
    const cols = ['a', 'b', 'c', 'd']
    return cols
      .map((c) => {
        const val = c === taxableColumn ? fmtN(v) : ''
        return `<td style="padding:2px;${c === taxableColumn ? ' background:#fef3c7;' : ''}">${
          val === '' ? '&nbsp;' : `<span style="font-weight:bold;">${val}</span>`
        }</td>`
      })
      .join('')
  }

  const strictLinearD14Tax = baseTax + row3Amount * bracketRate
  const settlementDiff = annualTax - strictLinearD14Tax
  let settlementDisplay = ''
  if (Math.abs(settlementDiff) > 2) {
    const diffWord = settlementDiff > 0 ? tr('settlementDue') : tr('settlementSurplus')
    settlementDisplay = `<div style="margin-top:4px; padding:5px; border:1px solid #dc2626; color:#dc2626; background:#fef2f2; font-weight:bold; font-size:10.5px;">${tr('settlementNote', { amount: fmtN(Math.abs(settlementDiff)), currency: tr('currency'), status: diffWord })}</div>`
  }

  const monthly = calcEmployeeMonthly(emp, cfg)
  const salaryLines = monthly.gross
  const houseAllowance = (emp.allowances || 0) + (emp.inKindBenefits || 0)
  const otherAllow = emp.otherBenefits || 0
  const bonuses = emp.bonuses || 0
  const retirement = emp.socialSecurity ? (emp.basicSalary || 0) * (cfg.socialSecurityRate || 0) : 0
  const legalAllow = cfg.legalAllowance + (emp.maritalStatus === 'married' && emp.spouseAtHome ? cfg.spouseAllowance : 0) + Math.min(emp.childrenCount || 0, cfg.maxChildren || 6) * (cfg.childAllowance || 0)
  const privateExempt = Math.min(houseAllowance, (emp.basicSalary || 0) * (cfg.privateSectorExemptionRate || 0))

  const mathStr = `${tr('mathPrefix')} ${monthsShown === 12 ? tr('mathAnnual') : tr('mathMonthly', { months: monthsShown })}`

  const page1 = `<div class="page-break" style="width:210mm; min-height:296mm; margin:0 auto; padding:9mm; background:#fff; color:#000; font-family:Arial,sans-serif; font-size:13.5px; line-height:1.4; direction:rtl; box-sizing:border-box; page-break-after:always; position:relative;">
    ${pageHeader(1, year)}
    <div style="margin-bottom:9px;">
      <div style="display:flex; gap:10px; margin-bottom:6px; flex-wrap:wrap;">
        <div>${tr('dd14Field1Name')} ${fmtLine(emp.name, '250px')}</div>
        <div>${tr('dd14Nationality')} ${fmtLine(tr('nationalityIraqi'), '80px')}</div>
        <div>${tr('dd14Gender')} ${fmtLine(emp.gender === 'male' ? tr('genderMale') : tr('genderFemale'), '50px')}</div>
      </div>
      <div style="display:flex; gap:10px; margin-bottom:6px; flex-wrap:wrap;">
        <div>${tr('dd14CivilId')} ${fmtLine(emp.nationalId, '180px')}</div>
        <div>${tr('dd14BirthDate')} ${fmtLine(emp.birthDate, '100px')}</div>
      </div>
    </div>
    <div style="margin-bottom:9px;">
      <div style="display:flex; gap:10px; margin-bottom:6px; flex-wrap:wrap;">
        <div>${tr('dd14JobTitle')} ${fmtLine(emp.jobTitle, '150px')}</div>
        <div>${tr('dd14StartDate')} ${fmtLine(periodStart, '100px')} ${tr('dd14To')} ${fmtLine(periodEnd, '100px')}</div>
        ${leaveDate && Number(leaveDate.slice(0, 4)) === year
          ? `<div>${tr('dd14LeaveDate')} ${fmtLine(leaveDate, '100px')} &nbsp;&nbsp; <span style="font-size:10.5px; color:#b91c1c; font-weight:bold;">${tr('dd14LeftDuringYear')}</span></div>`
          : ''}
      </div>
      <div style="display:flex; gap:10px; margin-bottom:6px; flex-wrap:wrap;">
        <div>${tr('dd14EmployerName')} ${fmtLine(employerName, '250px')}</div>
        <div>${tr('dd14PrimaryEmployerQuestion')} ${tr('yes')} ${box(emp.isPrimaryEmployer)} ${tr('no')} ${box(!emp.isPrimaryEmployer)}</div>
      </div>
      <div style="margin-bottom:6px;">${tr('dd14EmployerTaxId')} ${fmtLine(employerId, '150px')}</div>
      <div style="margin-bottom:6px;">${tr('dd14SpouseDisabledQuestion')} ${tr('yes')} ${box(emp.gender === 'female' && emp.spouseAtHome)} ${tr('no')} ${box(!(emp.gender === 'female' && emp.spouseAtHome))}</div>
    </div>
    <div style="margin-bottom:9px;">
      <div style="margin-bottom:6px;">${tr('dd14MaritalStatus')} ${fmtLine(maritalLabel, '100px')}</div>
      <div style="display:flex; gap:10px; margin-bottom:6px; flex-wrap:wrap;">
        <div style="width:300px;">${tr('dd14MarriageDate')} ${fmtLine('', '100px')}</div>
        <div>${tr('dd14SpouseName')} ${fmtLine('', '150px')}</div>
      </div>
      <div style="display:flex; gap:10px; margin-bottom:6px; flex-wrap:wrap;">
        <div style="width:300px;">${tr('dd14DivorceDate')} ${fmtLine('', '100px')}</div>
        <div>${tr('dd14SpouseCivilId')} ${fmtLine('', '150px')}</div>
      </div>
      <div style="margin-bottom:6px;">${tr('dd14SpouseDeathDate')} ${fmtLine('', '150px')}</div>
      <div style="margin-bottom:6px;">${tr('dd14WifeHousewifeQuestion')} ${tr('yes')} ${box(emp.maritalStatus === 'married' && emp.spouseAtHome)} ${tr('no')} ${box(!(emp.maritalStatus === 'married' && emp.spouseAtHome))} <span style="font-size:10.5px;">${tr('dd14GoToSection4')}</span></div>
      <div style="margin-bottom:6px;">${tr('dd14SpouseAffiliatedQuestion')} ${tr('yes')} ${box(false)} ${tr('no')} ${box(true)}</div>
      <div style="margin-bottom:6px;">${tr('dd14MergeIncomeQuestion')} ${tr('yes')} ${box(false)} ${tr('no')} ${box(true)} <span style="font-size:10.5px;">${tr('dd14SpouseSignNote')}</span></div>
      <div style="display:flex; justify-content:space-around; margin:8px 0;">
        <div style="text-align:center;">${tr('dd14HusbandSignature')}<br><br>${tr('dd14DateLabel')} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
        <div style="text-align:center;">${tr('dd14WifeSignature')}<br><br>${tr('dd14DateLabel')} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
      </div>
      <div style="margin-bottom:6px;">${tr('dd14SpouseEmployerInfo')}<br>${tr('dd14EmployerName')} ${fmtLine('', '200px')} &nbsp;&nbsp; ${tr('dd14EmployerTaxId')} ${fmtLine('', '150px')}</div>
    </div>
    <div style="margin-bottom:9px;">
      <div style="margin-bottom:4px;">${tr('dd14ChildrenSection')}</div>
      <div style="font-size:10px; line-height:1.35; margin-bottom:6px;">${tr('dd14ChildrenEligibility')}</div>
      <table style="width:100%; border-collapse:collapse; text-align:center; font-size:11.5px;" border="1">
        <tr style="background:#f9f9f9;">
          <th style="padding:3px;">${tr('seqNo')}</th>
          <th style="padding:3px;">${tr('childTableName')}</th>
          <th style="padding:3px;">${tr('childTableGender')}</th>
          <th style="padding:3px;">${tr('childTableCivilId')}</th>
          <th style="padding:3px;">${tr('childTableBirthDate')}</th>
          <th style="padding:3px;">${tr('childTableAnnualIncome')}</th>
          <th style="padding:3px;">${tr('childTableAllowanceReason')}</th>
        </tr>
        ${childRows}
      </table>
      <div style="font-size:10.5px; margin-top:3px;">${tr('dd14SecondFormNote')}</div>
      <div style="margin-top:8px;">${tr('dd14Declaration')}</div>
      <div style="display:flex; justify-content:space-between; margin-top:8px;">
        <div>${tr('dd14EmployeeSignatureLine')}</div>
        <div>${tr('dd14DateLine')}</div>
      </div>
    </div>
    <div style="border-top:2px solid #000; padding-top:6px; margin-top:6px; font-size:10px; line-height:1.4;">
      <strong>${tr('dd14Notes')}</strong>
      <ol style="margin:4px 0; padding-right:20px;">
        <li>${tr('dd14Note1')}</li>
        <li>${tr('dd14Note2')}</li>
        <li>${tr('dd14Note3')}</li>
      </ol>
      ${tr('dd14MultiEmployerNote')}<br>
      ${tr('dd14MergeNote')}
    </div>
  </div>`

  const page2 = `<div class="page-break" style="width:210mm; min-height:296mm; margin:0 auto; padding:7mm; background:#fff; color:#000; font-family:Arial,sans-serif; font-size:11.5px; line-height:1.32; direction:rtl; box-sizing:border-box;">
    ${pageHeader(2, year)}
    ${settlementDisplay}
    <div style="text-align:center; font-size:10.5px; margin-bottom:3px; color:#666; font-weight:bold;">${mathStr}</div>
    <div style="text-align:center; font-size:11px; margin-bottom:8px; font-weight:bold; color:#334155;">${tr('dd14FilledByAccountant')}</div>
    <table style="width:100%; border-collapse:collapse; font-size:11px;" border="1">
      <tr>
        <th style="padding:3px; width:75%;">${tr('incomeTableIncomeHeader')}</th>
        <th style="padding:3px; width:25%; text-align:center;">${tr('dinarHeader')}</th>
      </tr>
      <tr>
        <td style="padding:3px;">${tr('dd14Row1a')}</td>
        <td style="padding:3px; text-align:center; font-weight:bold;">${fmtN(salaryLines * monthsShown)}</td>
      </tr>
      <tr>
        <td style="padding:3px;">${tr('dd14Row1b')}</td>
        <td style="padding:3px; text-align:center; font-weight:bold;">${fmtN(houseAllowance * monthsShown)}</td>
      </tr>
      <tr>
        <td style="padding:3px;">${tr('dd14Row1c')}</td>
        <td style="padding:3px; text-align:center; font-weight:bold;">${fmtN(otherAllow * monthsShown)}</td>
      </tr>
      <tr>
        <td style="padding:3px;">${tr('dd14Row1d')}</td>
        <td style="padding:3px; text-align:center; font-weight:bold;">${fmtN((emp.inKindBenefits || 0) * monthsShown)}</td>
      </tr>
      <tr>
        <td style="padding:3px;">${tr('dd14Row1e')}</td>
        <td style="padding:3px; text-align:center; font-weight:bold;">${fmtN((emp.bonuses || 0) * monthsShown)}</td>
      </tr>
      <tr>
        <td style="padding:3px;">${tr('dd14Row1f')}</td>
        <td style="padding:3px; text-align:center; font-weight:bold;">0</td>
      </tr>
      <tr style="background:#f4f4f4;">
        <td style="padding:3px; font-weight:bold;">${tr('dd14RowTotalIncome')}</td>
        <td style="padding:3px; text-align:center; font-weight:bold;">${fmtN(annualGross)}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding:3px; text-align:center; font-weight:bold; background:#eaeaea;">${tr('dd14DeductionsSectionTitle')}</td>
      </tr>
      <tr>
        <td style="padding:3px;">${tr('dd14Row2a')}</td>
        <td style="padding:3px; text-align:center; font-weight:bold;">${fmtN(legalAllow * monthsShown)}</td>
      </tr>
      <tr>
        <td style="padding:3px;">${tr('dd14Row2b')}</td>
        <td style="padding:3px; text-align:center; font-weight:bold;">${fmtN(retirement * monthsShown)}</td>
      </tr>
      <tr>
        <td style="padding:3px;">${tr('dd14Row2c')}</td>
        <td style="padding:3px; text-align:center; font-weight:bold;">${fmtN(((emp.lifeInsurance || 0) + (emp.alimony || 0)) * monthsShown)}</td>
      </tr>
      <tr>
        <td style="padding:3px;">${tr('dd14Row2d')}</td>
        <td style="padding:3px; text-align:center; font-weight:bold;">${fmtN(privateExempt * monthsShown)}</td>
      </tr>
      <tr>
        <td style="padding:3px;">${tr('dd14Row2e')}</td>
        <td style="padding:3px; text-align:center; font-weight:bold;">0</td>
      </tr>
      <tr style="background:#f4f4f4;">
        <td style="padding:3px; font-weight:bold;">${tr('dd14RowTotalDeductions')}</td>
        <td style="padding:3px; text-align:center; font-weight:bold;">${fmtN(annualDed)}</td>
      </tr>
      <tr style="background:#eef2ff;">
        <td style="padding:4px 3px; font-weight:bold; font-size:12px;">${tr('dd14RowTaxableIncome')}</td>
        <td style="padding:4px 3px; text-align:center; font-weight:bold; font-size:13px; color:#b91c1c;">${fmtN(annualTaxable)}</td>
      </tr>
      <tr>
        <td style="padding:3px; font-weight:bold;">${tr('dd14RowTaxAmount')}</td>
        <td style="padding:4px 3px; text-align:center; font-weight:bold; font-size:13px; color:#15803d;">${fmtN(annualTax)}</td>
      </tr>
    </table>
    <div style="margin-top:7px; font-size:10.5px;">
      <ul style="margin:0; padding-right:20px; line-height:1.35;">
        <li>${tr('dd14Page2Note1')}</li>
        <li>${tr('dd14Page2Note2')}</li>
        <li>${tr('dd14Page2Note3')}</li>
      </ul>
    </div>
    <div style="margin-top:9px; font-weight:bold;">${tr('dd14TaxCalculationTitle')}</div>
    <div style="margin-top:3px; font-size:10.5px;">
      ${tr('dd14TaxCalcIntro')}
      <ul style="margin:3px 0; padding-right:20px; line-height:1.35;">
        <li>${tr('dd14BracketA')}</li>
        <li>${tr('dd14BracketB')}</li>
        <li>${tr('dd14BracketC')}</li>
        <li>${tr('dd14BracketD')}</li>
      </ul>
      <table style="width:100%; border-collapse:collapse; font-size:11px; text-align:center; margin-top:4px;" border="1">
        <tr style="background:#f9f9f9;">
          <th style="padding:2px;">${tr('bracketRowNo')}</th>
          <th style="padding:2px;">${tr('bracketRegarding')}</th>
          <th style="padding:2px;">${tr('bracketColA')}</th>
          <th style="padding:2px;">${tr('bracketColB')}</th>
          <th style="padding:2px;">${tr('bracketColC')}</th>
          <th style="padding:2px;">${tr('bracketColD')}</th>
        </tr>
        <tr>
          <td style="padding:2px; font-weight:bold;">1</td>
          <td style="padding:2px;">${tr('bracketTaxableIncome')}</td>
          ${bracketCells(annualTaxable)}
        </tr>
        <tr style="color:#666;">
          <td style="padding:2px;">2</td>
          <td style="padding:2px;">${tr('bracketTaxRate')}</td>
          <td style="padding:2px;">%3</td>
          <td style="padding:2px;">%5</td>
          <td style="padding:2px;">%10</td>
          <td style="padding:2px;">%15</td>
        </tr>
        <tr>
          <td style="padding:2px; font-weight:bold;">3</td>
          <td style="padding:2px;">${tr('bracketIncomeAtRate')}</td>
          ${bracketCells(row3Amount)}
        </tr>
        <tr style="color:#666;">
          <td style="padding:2px;">4</td>
          <td style="padding:2px;">${tr('bracketTaxRate')}</td>
          <td style="padding:2px;">%3</td>
          <td style="padding:2px;">%5</td>
          <td style="padding:2px;">%10</td>
          <td style="padding:2px;">%15</td>
        </tr>
        <tr>
          <td style="padding:2px; font-weight:bold;">5</td>
          <td style="padding:2px;">${tr('bracketTax')}</td>
          ${bracketCells(row5Amount)}
        </tr>
        <tr style="color:#666;">
          <td style="padding:2px;">6</td>
          <td style="padding:2px;">${tr('bracketFixedTax')}</td>
          <td style="padding:2px;">${tr('bracketZero')}</td>
          <td style="padding:2px;">${tr('bracket7500')}</td>
          <td style="padding:2px;">${tr('bracket20000')}</td>
          <td style="padding:2px;">${tr('bracket70000')}</td>
        </tr>
        <tr>
          <td style="padding:2px; font-weight:bold;">7</td>
          <td style="padding:2px;">${tr('bracketTotalDue')}</td>
          ${bracketCells(row7Amount)}
        </tr>
      </table>
      <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:42px; padding:0 10px;">
        <div style="text-align:center; flex:1;">
          <div style="font-weight:bold;">${tr('signatureAccountant')}</div>
          <div style="height:34px;"></div>
          <div style="border-top:1px solid #000; width:85%; margin:0 auto;"></div>
          <div style="margin-top:5px;">${tr('dd14DateLabel')} &nbsp;&nbsp;/&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;</div>
        </div>
        <div style="width:70px;"></div>
        <div style="text-align:center; flex:1;">
          <div style="font-weight:bold;">${tr('signatureDirector')}</div>
          <div style="height:34px;"></div>
          <div style="border-top:1px solid #000; width:85%; margin:0 auto;"></div>
          <div style="margin-top:5px;">${tr('dd14DateLabel')} &nbsp;&nbsp;/&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;</div>
        </div>
      </div>
    </div>
  </div>`

  return page1 + page2
}

export interface AnnualStatementRow {
  employee: Employee
  math: EmployeeMath
  regNumber: string
  workPeriod: string
}

export function buildAnnualStatementHtml(
  employees: Employee[],
  company: Company | undefined,
  year: number,
  data: AppData,
): string {
  const employerName = company?.name ?? ''
  const employerId = company?.taxId ?? ''

  const rows: AnnualStatementRow[] = employees.map((e, i) => {
    const m = computeEmployeeAnnual(e, data.config, year, data)
    const p = employeePeriodForYear(e, year)
    return {
      employee: e,
      math: m,
      regNumber: `DD14-${year}-${String(i + 1).padStart(3, '0')}`,
      workPeriod: `${p.start} ${tr('periodTo')} ${p.end}`,
    }
  })

  const pageHeader = (pn: number) => `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:7px;">
    <div style="font-size:10px; line-height:1.5;">${tr('republicIraq')}<br>${tr('ministryFinance')}<br>${tr('generalTaxCommission')}</div>
    <div style="text-align:center; font-size:14px; font-weight:800;">${tr('dd14Title')}<br><span style="font-size:9px; font-weight:400;">${tr('dd14Subtitle')}</span></div>
    <div style="font-size:10px; line-height:1.5; text-align:right;">${tr('formNoLabel')}<br>${tr('financialYearLabel', { year })}<br>${tr('pageLabel', { pn })}</div>
  </div>
  <div style="font-size:11px; font-weight:700; margin-bottom:4px;">${tr('statementEmployerNameLabel')} ${employerName || '&nbsp;'} &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; ${tr('statementEmployerIdLabel')} ${employerId || '&nbsp;'}</div>
  <div style="text-align:center; font-weight:800; font-size:12px; margin-bottom:6px;">${tr('statementTableTitle', { year })}</div>`

  const th = (text: string, w: number) => `<th style="border:1px solid #000; padding:2px; width:${w}%;">${text}</th>`

  const tableHead = () => `<table style="width:100%; border-collapse:collapse; table-layout:fixed; font-size:7.5px;">
    <thead>
    <tr>${th('2', 8)}${th('ا', 2)}${th('ت', 3)}${th('1', 8)}${th('2', 11)}${th('3', 7)}${th('4', 8)}${th('5', 8)}${th('6', 8)}${th('7', 7)}${th('8', 7)}${th('9', 6)}${th('10', 5)}${th('11', 8)}${th('12', 4)}</tr>
    <tr>${th(tr('statementColName'), 8)}${th('', 2)}${th('#', 3)}${th(tr('statementColFileNo'), 8)}${th(tr('statementColName'), 11)}${th(tr('statementColCivilId'), 7)}${th(tr('statementColGrossIncome'), 8)}${th(tr('statementColDeductions'), 8)}${th(tr('statementColTaxable'), 8)}${th(tr('statementColLiability'), 7)}${th(tr('statementColPaid'), 7)}${th(tr('statementColUnpaid'), 6)}${th(tr('statementColExcess'), 5)}${th(tr('statementColWorkPeriod'), 8)}${th(tr('statementColEmployer'), 4)}</tr>
    </thead>`

  const GROUP_SIZE = 20
  let pages = ''
  let pageNum = 1
  const grandTotal = { income: 0, deductions: 0, taxable: 0, liability: 0, paid: 0, unpaid: 0, excess: 0 }
  const grandCount = rows.length

  for (let i = 0; i < rows.length; i += GROUP_SIZE) {
    const group = rows.slice(i, i + GROUP_SIZE)
    const gTotal = { income: 0, deductions: 0, taxable: 0, liability: 0 }
    let t = pageHeader(pageNum) + tableHead() + '<tbody>'
    group.forEach((r, gi) => {
      const absIdx = i + gi
      const unpaid = Math.max(0, r.math.tax - r.math.paidTax)
      const excess = Math.max(0, r.math.paidTax - r.math.tax)
      gTotal.income += r.math.gross
      gTotal.deductions += r.math.deductions
      gTotal.taxable += r.math.taxable
      gTotal.liability += r.math.tax
      grandTotal.income += r.math.gross
      grandTotal.deductions += r.math.deductions
      grandTotal.taxable += r.math.taxable
      grandTotal.liability += r.math.tax
      grandTotal.paid += r.math.paidTax
      grandTotal.unpaid += unpaid
      grandTotal.excess += excess
      t += `<tr>
        <td style="border:1px solid #000; padding:2px; text-align:center;">${absIdx + 1}</td>
        <td style="border:1px solid #000; padding:2px; text-align:center;">${absIdx + 1}</td>
        <td style="border:1px solid #000; padding:2px; text-align:center;">${absIdx + 1}</td>
        <td style="border:1px solid #000; padding:2px;">${r.regNumber}</td>
        <td style="border:1px solid #000; padding:2px; font-weight:700;">${esc(r.employee.name)}</td>
        <td style="border:1px solid #000; padding:2px; text-align:center;">${esc(r.employee.nationalId)}</td>
        <td style="border:1px solid #000; padding:2px; text-align:center;">${fmtN(r.math.gross)}</td>
        <td style="border:1px solid #000; padding:2px; text-align:center;">${fmtN(r.math.deductions)}</td>
        <td style="border:1px solid #000; padding:2px; text-align:center;">${fmtN(r.math.taxable)}</td>
        <td style="border:1px solid #000; padding:2px; text-align:center;">${fmtN(r.math.tax)}</td>
        <td style="border:1px solid #000; padding:2px; text-align:center;">${fmtN(r.math.paidTax)}</td>
        <td style="border:1px solid #000; padding:2px; text-align:center;">${fmtN(unpaid)}</td>
        <td style="border:1px solid #000; padding:2px; text-align:center;">${fmtN(excess)}</td>
        <td style="border:1px solid #000; padding:2px;">${r.workPeriod}</td>
        <td style="border:1px solid #000; padding:2px;">${employerName}</td>
      </tr>`
    })
    t += `<tr>
      <td colspan="6" style="border:1px solid #000; padding:3px; font-weight:700; text-align:center;">${tr('subtotal')}</td>
      <td style="border:1px solid #000; padding:3px; text-align:center; font-weight:700;">${fmtN(gTotal.income)}</td>
      <td style="border:1px solid #000; padding:3px; text-align:center; font-weight:700;">${fmtN(gTotal.deductions)}</td>
      <td style="border:1px solid #000; padding:3px; text-align:center; font-weight:700;">${fmtN(gTotal.taxable)}</td>
      <td style="border:1px solid #000; padding:3px; text-align:center; font-weight:700;">${fmtN(gTotal.liability)}</td>
      <td colspan="5" style="border:1px solid #000; padding:3px;"></td>
    </tr>`
    const isLastGroup = i + GROUP_SIZE >= rows.length
    if (isLastGroup) {
      t += `<tr>
        <td colspan="6" style="border:1px solid #000; padding:4px; font-weight:800; text-align:center; background:#eef2ff;">${tr('grandTotalEmployees', { count: grandCount })}</td>
        <td style="border:1px solid #000; padding:4px; text-align:center; font-weight:800;">${fmtN(grandTotal.income)}</td>
        <td style="border:1px solid #000; padding:4px; text-align:center; font-weight:800;">${fmtN(grandTotal.deductions)}</td>
        <td style="border:1px solid #000; padding:4px; text-align:center; font-weight:800;">${fmtN(grandTotal.taxable)}</td>
        <td style="border:1px solid #000; padding:4px; text-align:center; font-weight:800;">${fmtN(grandTotal.liability)}</td>
        <td style="border:1px solid #000; padding:4px; text-align:center; font-weight:800;">${fmtN(grandTotal.paid)}</td>
        <td style="border:1px solid #000; padding:4px; text-align:center; font-weight:800;">${fmtN(grandTotal.unpaid)}</td>
        <td style="border:1px solid #000; padding:4px; text-align:center; font-weight:800;">${fmtN(grandTotal.excess)}</td>
        <td colspan="2" style="border:1px solid #000; padding:4px;"></td>
      </tr>
      <tr><td colspan="15" style="padding:6px;"></td></tr>
      <tr><td colspan="15" style="border:none;">
        <div style="display:flex; justify-content:space-between; margin-top:24px; font-size:11px; font-weight:700;">
          <div style="text-align:center;">${tr('signatureAccountant')}<br><span style="display:block; margin-top:20px; border-top:1px solid #000; padding-top:4px; width:130px;">${tr('nameLine')}</span></div>
          <div style="text-align:center;">${tr('signatureHeadOfAccounts')}<br><span style="display:block; margin-top:20px; border-top:1px solid #000; padding-top:4px; width:130px;">${tr('nameLine')}</span></div>
          <div style="text-align:center;">${tr('signatureEmployer')}<br><span style="display:block; margin-top:20px; border-top:1px solid #000; padding-top:4px; width:130px;">${tr('nameLine')}</span></div>
          <div style="text-align:center;">${tr('employerStamp')}</div>
        </div>
      </td></tr>`
    }
    t += '</tbody></table>'
    pages += `<div class="page-break" style="width:210mm; min-height:296mm; margin:0 auto; padding:9mm; background:#fff; color:#000; font-family:Arial,sans-serif; direction:rtl; box-sizing:border-box; page-break-after:always; position:relative; overflow:hidden;">${t}</div>`
    pageNum++
  }
  return pages
}

export interface MonthlyDeclarationData {
  count: number
  taxedCount: number
  untaxedCount: number
  totalIncome: number
  totalTax: number
  rows: { idx: number; name: string; sector: string; salary: number; allowances: number; deductions: number; taxable: number; tax: number }[]
}

export function buildMonthlyDeclarationData(
  year: number,
  month: number,
  employees: Employee[],
  data: AppData,
  rowsOverride?: MonthlyRow[],
): MonthlyDeclarationData {
  const cid = data.activeCompanyId
  const rows = (rowsOverride ?? data.monthlyRows).filter(
    (r) => r.companyId === cid && r.year === year && r.month === month,
  )
  let totalIncome = 0
  let totalTax = 0
  let taxedCount = 0
  const mapped = rows.map((r, idx) => {
    const e = employees.find((x) => x.id === r.employeeId)
    const name = e?.name ?? '—'
    const sector = tr('sectorPrivate')
    totalIncome += r.gross
    totalTax += r.adjusted
    if (r.adjusted > 0) taxedCount++
    return {
      idx: idx + 1,
      name,
      sector,
      salary: r.gross,
      allowances: r.deductions,
      deductions: r.deductions,
      taxable: r.taxable,
      tax: r.adjusted,
    }
  })
  return {
    count: mapped.length,
    taxedCount,
    untaxedCount: mapped.length - taxedCount,
    totalIncome,
    totalTax,
    rows: mapped,
  }
}

export function buildMonthlyDeclarationHtml(
  company: Company | undefined,
  year: number,
  month: number,
  data: AppData,
  rowsOverride?: MonthlyRow[],
): string {
  const m = Number(month)
  const dd = buildMonthlyDeclarationData(year, m, data.employees, data, rowsOverride)
  const S = 793.7 / 612
  const px = (pt: number) => (pt * S).toFixed(1)
  const img1 = new URL('monthly-decl-page1.png', window.location.href).href
  const img2 = new URL('monthly-decl-page2.png', window.location.href).href

  const ov = (x: number, y: number, html: string, size = 16, ltr = false) =>
    `<span style="position:absolute; left:${px(x)}px; top:${px(y)}px; transform:translate(-50%,-50%); font-size:${size}px; font-weight:700; font-family:'Times New Roman',Arial,sans-serif; color:#000; white-space:nowrap; text-align:center;${ltr ? ' direction:ltr;' : ''}">${html}</span>`

  const taxDigits = String(company?.taxId ?? '').replace(/[^0-9]/g, '').slice(-10)
  const cellCenters = [477.1, 396.2, 360.2, 326.3, 294.8, 261.2, 221.3, 181.2, 146.5, 115.2]
  let digits = ''
  for (let i = 0; i < taxDigits.length; i++) {
    const c = cellCenters[cellCenters.length - 1 - i]
    digits += `<span style="position:absolute; left:${px(c)}px; top:${px(181)}px; transform:translate(-50%,-50%); font-size:17px; font-weight:700; font-family:'Times New Roman',Arial,sans-serif; color:#000; direction:ltr;">${taxDigits[i]}</span>`
  }

  const overlays = [
    ov(410, 160, String(m).padStart(2, '0'), 15, true),
    ov(352, 160, String(year), 15, true),
    digits,
    ov(190, 210.8, esc(company?.name ?? ''), 15),
    ov(190, 254, esc(company?.address ?? ''), 15),
    ov(492, 323, '×', 26),
    ov(221, 385.7, fmtN(dd.totalIncome), 15, true),
    ov(216, 433, fmtN(dd.totalTax), 15, true),
    ov(466, 516, String(dd.count), 17, true),
    ov(306, 516, String(dd.taxedCount), 17, true),
    ov(146, 516, String(dd.untaxedCount), 17, true),
  ].join('')

  const page1 = `<div class="page-break" style="width:793.7px; height:1027px; margin:0 auto; background:#fff; position:relative;">
    <img src="${img1}" alt="" style="display:block; width:793.7px; height:1027px;"/>
    ${overlays}
  </div>`

  const page2 = `<div class="page-break" style="width:793.7px; height:1027px; margin:0 auto; background:#fff; position:relative;">
    <img src="${img2}" alt="" style="display:block; width:793.7px; height:1027px;"/>
  </div>`

  return page1 + page2
}

export function buildMonthlyRegisterHtml(
  company: Company | undefined,
  year: number,
  month: number,
  data: AppData,
): string {
  const m = Number(month)
  const dd = buildMonthlyDeclarationData(year, m, data.employees, data)
  let rows = ''
  if (dd.rows.length === 0) {
    rows = `<tr><td colspan="8" style="border:1px solid #000; padding:8px; text-align:center;">${tr('registerEmpty')}</td></tr>`
  } else {
    rows = dd.rows
      .map(
        (r) => `<tr>
          <td style="border:1px solid #000; padding:3px; text-align:center;">${r.idx}</td>
          <td style="border:1px solid #000; padding:3px; font-weight:700;">${esc(r.name)}</td>
          <td style="border:1px solid #000; padding:3px; text-align:center;">${r.sector}</td>
          <td style="border:1px solid #000; padding:3px; text-align:center;">${fmtN(r.salary)}</td>
          <td style="border:1px solid #000; padding:3px; text-align:center;">${fmtN(r.allowances)}</td>
          <td style="border:1px solid #000; padding:3px; text-align:center;">${fmtN(r.deductions)}</td>
          <td style="border:1px solid #000; padding:3px; text-align:center;">${fmtN(r.taxable)}</td>
          <td style="border:1px solid #000; padding:3px; text-align:center; font-weight:700;">${fmtN(r.tax)}</td>
        </tr>`,
      )
      .join('')
  }
  return `<div class="page-break" style="width:210mm; min-height:296mm; margin:0 auto; padding:9mm; background:#fff; color:#000; font-family:Arial,sans-serif; direction:rtl; box-sizing:border-box; position:relative;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
      <div style="font-size:11px; line-height:1.5;">${tr('republicIraq')}<br>${tr('ministryFinance')}<br>${tr('generalTaxCommission')}</div>
      <div style="text-align:center; font-size:14px; font-weight:800;">${tr('registerMainTitle')}<br><span style="font-size:9px; font-weight:400;">${tr('dd14Subtitle')}</span></div>
      <div style="font-size:11px; text-align:right; line-height:1.5;">${tr('registerMonthLine', { monthNum: m, monthName: monthLabel(m) })}<br>${tr('financialYearLabel', { year })}</div>
    </div>
    <div style="font-size:11px; font-weight:700; margin-bottom:8px;">${tr('registerEmployerNameLabel')} ${esc(company?.name ?? '')} &nbsp;&nbsp;|&nbsp;&nbsp; ${tr('registerEmployerIdLabel')} ${esc(company?.taxId ?? '')}</div>
    <table style="width:100%; border-collapse:collapse; font-size:11px; table-layout:fixed;">
      <thead><tr>
        <th style="border:1px solid #000; padding:3px; width:4%;">${tr('seqNo')}</th>
        <th style="border:1px solid #000; padding:3px;">${tr('employeeNameLabel')}</th>
        <th style="border:1px solid #000; padding:3px; width:8%;">${tr('sectorHeader')}</th>
        <th style="border:1px solid #000; padding:3px;">${tr('monthlySalaryHeader')}</th>
        <th style="border:1px solid #000; padding:3px;">${tr('allowancesHeader')}</th>
        <th style="border:1px solid #000; padding:3px;">${tr('deductionsAllowancesHeader')}</th>
        <th style="border:1px solid #000; padding:3px;">${tr('monthlyTaxableHeader')}</th>
        <th style="border:1px solid #000; padding:3px;">${tr('monthTaxHeader')}</th>
      </tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr>
        <td colspan="3" style="border:1px solid #000; padding:4px; font-weight:800; text-align:center;">${tr('registerTotal', { month: monthLabel(m), count: dd.count })}</td>
        <td colspan="3" style="border:1px solid #000; padding:4px;"></td>
        <td style="border:1px solid #000; padding:4px; text-align:center; font-weight:800;">${fmtN(dd.rows.reduce((s, r) => s + r.taxable, 0))}</td>
        <td style="border:1px solid #000; padding:4px; text-align:center; font-weight:800;">${fmtN(dd.totalTax)}</td>
      </tr></tfoot>
    </table>
    <div style="display:flex; justify-content:space-between; margin-top:70px; font-size:11px; font-weight:700;">
      <div style="text-align:center;">${tr('signatureAccountant')}<br><span style="display:block; margin-top:26px; border-top:1px solid #000; padding-top:4px; width:130px;">${tr('nameLine')}</span></div>
      <div style="text-align:center;">${tr('signatureHeadOfAccounts')}<br><span style="display:block; margin-top:26px; border-top:1px solid #000; padding-top:4px; width:130px;">${tr('nameLine')}</span></div>
      <div style="text-align:center;">${tr('signatureEmployer')}<br><span style="display:block; margin-top:26px; border-top:1px solid #000; padding-top:4px; width:130px;">${tr('nameLine')}</span></div>
      <div style="text-align:center;">${tr('employerStamp')}</div>
    </div>
  </div>`
}

export const FORM_PRINT_CSS = `
  @media print {
    @page { size: A4 portrait; margin: 0; }
    body { background: white; margin: 0; padding: 0; }
    .page-break { page-break-after: always; break-after: page; margin: 0 !important; border: none !important; box-shadow: none !important; overflow: hidden !important; }
    .page-break:last-child { page-break-after: auto; break-after: auto; }
  }
  .page-break { box-sizing: border-box; }
`

async function embedImages(html: string): Promise<string> {
  const srcs = [...html.matchAll(/<img\s[^>]*src="([^"]+)"/g)].map((m) => m[1])
  let out = html
  for (const src of srcs) {
    try {
      const res = await fetch(src)
      const blob = await res.blob()
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const fr = new FileReader()
        fr.onload = () => resolve(fr.result as string)
        fr.onerror = () => reject(fr.error)
        fr.readAsDataURL(blob)
      })
      out = out.split(src).join(dataUrl)
    } catch {
      /* keep original src */
    }
  }
  return out
}

export async function openFormPrintWindow(title: string, html: string): Promise<void> {
  const enriched = await embedImages(html)
  const w = window.open('', '_blank', 'width=900,height=700')
  if (!w) return
  const doc = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
  <style>body { margin:0; padding:0; background:#fff; font-family:'Tajawal',Arial,sans-serif; display:flex; flex-direction:column; align-items:center; } ${FORM_PRINT_CSS}</style>
  </head><body onload="setTimeout(function(){ window.print(); window.close(); }, 700);">${enriched}</body></html>`
  w.document.open()
  w.document.write(doc)
  w.document.close()
  w.focus()
}

export function buildAnnualStatementExcel(
  employees: Employee[],
  company: Company | undefined,
  year: number,
  data: AppData,
): (string | number)[][] {
  const employerName = company?.name ?? ''
  const employerId = company?.taxId ?? ''
  const rows: (string | number)[][] = []
  rows.push([tr('republicIraq'), tr('ministryFinance'), tr('generalTaxCommission'), '', '', tr('dd14Title'), '', '', tr('dd14Subtitle'), '', '', tr('excelFormNo'), '1', tr('excelFinancialYear', { year })])
  rows.push(['', '', '', '', '', '', `${tr('excelEmployerNameLabel')} ${employerName}`, '', '', '', '', '', '', ''])
  rows.push(['', '', '', '', '', '', `${tr('excelEmployerIdLabel')} ${employerId}`, '', '', '', '', '', tr('excelPage'), '1'])
  rows.push(['', '', '', '', '', '', '', '', tr('statementTableShortTitle'), '', '', '', '', '', ''])
  rows.push(['', '', '', '', '', '', '', tr('excelYearLine', { year }), '', '', '', '', '', '', ''])
  rows.push(['2', 'ا', 'ت', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'])
  rows.push([tr('statementColName'), '', '#', tr('statementColFileNo'), tr('statementColName'), tr('statementColCivilId'), tr('statementColGrossIncome'), tr('statementColDeductions'), tr('statementColTaxable'), tr('statementColLiability'), tr('statementColPaid'), tr('statementColUnpaid'), tr('statementColExcess'), tr('statementColWorkPeriod'), tr('statementColEmployer')])
  let grandIncome = 0
  let grandDed = 0
  let grandTaxable = 0
  let grandLiability = 0
  let grandPaid = 0
  let grandUnpaid = 0
  let grandExcess = 0
  employees.forEach((e, i) => {
    const m = computeEmployeeAnnual(e, data.config, year, data)
    const unpaid = Math.max(0, m.tax - m.paidTax)
    const excess = Math.max(0, m.paidTax - m.tax)
    grandIncome += m.gross
    grandDed += m.deductions
    grandTaxable += m.taxable
    grandLiability += m.tax
    grandPaid += m.paidTax
    grandUnpaid += unpaid
    grandExcess += excess
    const eStartYear = e.startDate ? Number(e.startDate.slice(0, 4)) : 0
    const p = employeePeriodForYear(e, year)
    rows.push(['', i + 1, i + 1, `DD14-${year}-${String(i + 1).padStart(3, '0')}`, e.name || '', e.nationalId || '', Math.round(m.gross), Math.round(m.deductions), Math.round(m.taxable), Math.round(m.tax), Math.round(m.paidTax), Math.round(unpaid), Math.round(excess), `${p.start} ${tr('periodToExcel')} ${p.end}`, employerName])
  })
  rows.push([tr('grandTotalExcel'), employees.length, '', '', tr('grandTotalExcel'), '', Math.round(grandIncome), Math.round(grandDed), Math.round(grandTaxable), Math.round(grandLiability), Math.round(grandPaid), Math.round(grandUnpaid), Math.round(grandExcess), '', ''])
  return rows
}

export interface AnnualHistoryRow {
  year: number
  employee: Employee
  math: EmployeeMath
  regNumber: string
  workPeriod: string
}

export function buildEmployeeAnnualHistory(
  employees: Employee[],
  currentYear: number,
  data: AppData,
): AnnualHistoryRow[] {
  const out: AnnualHistoryRow[] = []
  employees.forEach((e) => {
    const startYear = e.startDate ? Number(e.startDate.slice(0, 4)) : currentYear
    let lastYear = currentYear
    const leaveDate = employeeLeaveDate(e)
    if (leaveDate) {
      const ly = Number(leaveDate.slice(0, 4))
      if (ly > 0 && ly < lastYear) lastYear = ly
    }
    for (let y = startYear; y <= lastYear; y++) {
      const m = computeEmployeeAnnual(e, data.config, y, data)
      const p = employeePeriodForYear(e, y)
      out.push({
        year: y,
        employee: e,
        math: m,
        regNumber: `DD14-${y}-${String(e.name.charCodeAt(0) % 100).padStart(2, '0')}-${e.id.replace(/[^0-9]/g, '').slice(-4) || '0001'}`,
        workPeriod: `${p.start} ${tr('periodTo')} ${p.end}`,
      })
    }
  })
  return out.sort((a, b) => a.year - b.year)
}

export function buildAnnualHistoryExcel(
  employees: Employee[],
  company: Company | undefined,
  currentYear: number,
  data: AppData,
): (string | number)[][] {
  const employerName = company?.name ?? ''
  const rows: (string | number)[][] = [
    [tr('republicIraq'), tr('ministryFinance'), tr('generalTaxCommission'), '', '', tr('dd14Title'), '', '', '', '', '', ''],
    ['', '', '', '', '', `${tr('excelEmployerNameLabel')} ${employerName}`, '', '', '', '', '', ''],
    ['', '', '', '', '', '', tr('historyFullRegister'), '', '', '', '', ''],
    ['', '', '', '', '', '', tr('financialYearShort'), '', '', '', '', ''],
    ['', '', '', '', '', '', tr('statementColFileNo'), '', '', '', '', ''],
    [tr('financialYearShort'), tr('statementColName'), tr('statementColCivilId'), tr('statementColFileNo'), tr('statementColWorkPeriod'), tr('statementColGrossIncome'), tr('statementColDeductions'), tr('statementColTaxable'), tr('statementColLiability'), tr('statementColPaid'), tr('statementColUnpaid'), tr('statementColExcess'), tr('statementColEmployer')],
  ]
  const hist = buildEmployeeAnnualHistory(employees, currentYear, data)
  hist.forEach((r) => {
    const unpaid = Math.max(0, r.math.tax - r.math.paidTax)
    const excess = Math.max(0, r.math.paidTax - r.math.tax)
    rows.push([r.year, r.employee.name || '', r.employee.nationalId || '', r.regNumber, r.workPeriod, Math.round(r.math.gross), Math.round(r.math.deductions), Math.round(r.math.taxable), Math.round(r.math.tax), Math.round(r.math.paidTax), Math.round(unpaid), Math.round(excess), employerName])
  })
  return rows
}

export function buildAnnualHistoryHtml(
  employees: Employee[],
  company: Company | undefined,
  currentYear: number,
  data: AppData,
): string {
  const years: number[] = []
  employees.forEach((e) => {
    const startYear = e.startDate ? Number(e.startDate.slice(0, 4)) : currentYear
    let lastYear = currentYear
    const leaveDate = employeeLeaveDate(e)
    if (leaveDate) {
      const ly = Number(leaveDate.slice(0, 4))
      if (ly > 0 && ly < lastYear) lastYear = ly
    }
    for (let y = startYear; y <= lastYear; y++) {
      if (!years.includes(y)) years.push(y)
    }
  })
  years.sort((a, b) => a - b)
  return years
    .map((y) => {
      const yearEmps = employees.filter((e) => {
        const s = e.startDate ? Number(e.startDate.slice(0, 4)) : currentYear
        const leaveDate = employeeLeaveDate(e)
        const l = leaveDate ? Number(leaveDate.slice(0, 4)) : currentYear
        return y >= s && y <= l
      })
      if (yearEmps.length === 0) return ''
      return (
        buildAnnualStatementHtml(yearEmps, company, y, data) +
        yearEmps.map((e) => buildEmployeeDD14Html(e, company, data.config, y, data)).join('')
      )
    })
    .join('')
}
