import type { Employee, TaxConfig, TaxBracket } from './types'
import { round } from './format'

export const DEFAULT_EMPLOYEE_BRACKETS: TaxBracket[] = [
  { from: 0, rate: 0.03 },
  { from: 250000, rate: 0.05 },
  { from: 500000, rate: 0.1 },
  { from: 1000000, rate: 0.15 },
]

export function progressiveTax(amount: number, brackets: TaxBracket[]): number {
  if (amount <= 0) return 0
  const sorted = [...brackets].sort((a, b) => a.from - b.from)
  let tax = 0
  for (let i = 0; i < sorted.length; i++) {
    const b = sorted[i]
    if (amount <= b.from) continue
    const nextFrom = i < sorted.length - 1 ? sorted[i + 1].from : Infinity
    const top = Math.min(amount, nextFrom)
    tax += (top - b.from) * b.rate
    if (amount <= nextFrom) break
  }
  return round(tax)
}

export function effectiveRate(tax: number, taxable: number): number {
  return taxable > 0 ? tax / taxable : 0
}

export function monthlyEmployeeGross(emp: Employee): number {
  return (
    (emp.basicSalary || 0) +
    (emp.allowances || 0) +
    (emp.otherBenefits || 0) +
    (emp.inKindBenefits || 0) +
    (emp.bonuses || 0)
  )
}

export function monthlyEmployeeDeductions(emp: Employee, cfg: TaxConfig): number {
  let d = 0
  d += cfg.legalAllowance || 0
  if (emp.maritalStatus === 'married' && emp.spouseAtHome) d += cfg.spouseAllowance || 0
  d += Math.min(emp.childrenCount || 0, cfg.maxChildren || 6) * (cfg.childAllowance || 0)
  const allowances = (emp.allowances || 0) + (emp.inKindBenefits || 0)
  d += Math.min(allowances, (emp.basicSalary || 0) * (cfg.privateSectorExemptionRate || 0))
  if (emp.socialSecurity) d += (emp.basicSalary || 0) * (cfg.socialSecurityRate || 0)
  d += (emp.lifeInsurance || 0) + (emp.alimony || 0)
  return d
}

export interface TaxResult {
  gross: number
  deductions: number
  taxable: number
  tax: number
}

export function calcEmployeeMonthly(emp: Employee, cfg: TaxConfig): TaxResult {
  // Translate fields from both names (legacy compatibility)
  const salary = emp.salary ?? emp.basicSalary ?? 0
  const allowances = emp.allow ?? emp.allowances ?? 0
  const cashHous = emp.cashHous ?? emp.otherBenefits ?? 0
  const inKind = emp.inKind ?? 'none'
  const actualRent = emp.actualRent ?? 0
  const sector = emp.sec ?? (emp.socialSecurity ? 'private' : 'government')
  const residency = emp.res ?? 'resident'
  const marital = emp.marital ?? (emp.maritalStatus === 'married' ? (emp.spouseAtHome ? 'married_housewife' : 'married_working') : emp.maritalStatus)
  const children = Math.min(emp.child ?? emp.childrenCount ?? 0, 6)
  const isOver63 = emp.over63 === 'yes'
  const insurance = emp.ins ?? emp.lifeInsurance ?? 0
  const alimony = emp.alimony ?? 0

  // 1) Housing In-Kind calculation (P)
  let P = 0
  if (inKind === 'furnished') P = salary * 0.20
  else if (inKind === 'unfurnished') P = salary * 0.15
  else if (inKind === 'employerPart') P = salary * 0.10
  else if (inKind === 'hotel') P = salary * 0.20
  else if (inKind === 'caravan') P = salary * 0.05
  
  if (actualRent > 0) {
    P = Math.min(P, actualRent)
  }

  // Q (Gross Salary)
  const gross = salary + allowances + cashHous + P

  // R (Private Exemption 30% of Basic Salary)
  const R = sector === 'private' ? Math.min(cashHous, salary * 0.30) : 0

  // S (Social Security Contribution)
  const S = emp.socialSecurity ? Math.min(salary + allowances + cashHous, 1750000) * 0.05 : 0

  // Total Deductions (V)
  const deductions = R + S + Math.min(insurance, 166667) + alimony

  // Legal Allowances (W)
  let W = 0
  if (residency === 'resident') {
    let baseAllowance = 2500000 // single / married working
    if (marital === 'married_housewife') {
      baseAllowance = 4500000
    } else if (marital === 'widowed' || marital === 'divorced') {
      baseAllowance = 3200000
    }
    const childAllowance = children * 200000
    const ageAllowance = isOver63 ? 300000 : 0
    W = (baseAllowance + childAllowance + ageAllowance) / 12
  }

  // Taxable Base (X)
  const taxable = Math.max(0, gross - deductions - W)

  // Monthly Tax progressive calculation (Y)
  let tax = 0
  if (taxable > 0) {
    const brackets = [
      { upTo: 20833.33, rate: 0.03 },
      { upTo: 41666.67, rate: 0.05 },
      { upTo: 83333.33, rate: 0.10 },
      { upTo: Infinity, rate: 0.15 }
    ]
    let cumulative = 0
    let prevUpper = 0
    for (let i = 0; i < brackets.length; i++) {
      const b = brackets[i]
      const upper = b.upTo
      if (taxable <= upper) {
        tax = cumulative + (taxable - prevUpper) * b.rate
        break
      }
      cumulative += (upper - prevUpper) * b.rate
      prevUpper = upper
    }
  }

  return { gross, deductions: deductions + W, taxable, tax: round(tax) }
}

export interface AnnualTaxResult extends TaxResult {
  months: number
  paidTax: number
  difference: number
}

export function calcEmployeeAnnual(emp: Employee, cfg: TaxConfig, months: number, paidTax: number): AnnualTaxResult {
  const monthly = calcEmployeeMonthly(emp, cfg)
  
  // For partial years (< 12 months), use monthly tax calculation repeated for each month
  // For full year (12 months), use annual brackets
  if (months < 12) {
    const gross = monthly.gross * months
    const deductions = monthly.deductions * months
    const taxable = Math.max(0, gross - deductions)
    const annualTax = monthly.tax * months
    
    return { gross, deductions, taxable, tax: round(annualTax), months, paidTax, difference: round(annualTax - paidTax) }
  }
  
  // Full year - use annual brackets
  const gross = monthly.gross * months
  const deductions = monthly.deductions * months
  const taxable = Math.max(0, gross - deductions)
  
  let annualTax = 0
  if (taxable > 0) {
    const brackets = [
      { upTo: 250000, rate: 0.03 },
      { upTo: 500000, rate: 0.05 },
      { upTo: 1000000, rate: 0.10 },
      { upTo: Infinity, rate: 0.15 }
    ]
    let cumulative = 0
    let prevUpper = 0
    for (let i = 0; i < brackets.length; i++) {
      const b = brackets[i]
      const upper = b.upTo
      if (taxable <= upper) {
        annualTax = cumulative + (taxable - prevUpper) * b.rate
        break
      }
      cumulative += (upper - prevUpper) * b.rate
      prevUpper = upper
    }
  }

  return { gross, deductions, taxable, tax: round(annualTax), months, paidTax, difference: round(annualTax - paidTax) }
}

export function calcCorporate(profits: number, exemptions: number, rate: number): TaxResult {
  const taxable = Math.max(0, profits - exemptions)
  return { gross: profits, deductions: exemptions, taxable, tax: round(taxable * rate) }
}

export type CorpProfitCompanyType = 'ordinary' | 'oil_services'

export interface CorpProfitRatesConfig {
  ordinary: number
  oil_services: number
}

export const CORP_PROFIT_RATES: CorpProfitRatesConfig = {
  ordinary: 0.15,
  oil_services: 0.35,
}

export interface CorpProfitStatementResult {
  revenue: number
  expenses: number
  netProfit: number
  isLoss: boolean
  rate: number
  tax: number
}

export function calcCorporateProfitStatement(
  companyType: CorpProfitCompanyType,
  revenue: number,
  expenses: number,
): CorpProfitStatementResult {
  const netProfit = round(revenue - expenses)
  const isLoss = netProfit <= 0
  const rate = CORP_PROFIT_RATES[companyType] ?? CORP_PROFIT_RATES.ordinary
  const tax = isLoss ? 0 : round(netProfit * rate)
  return { revenue, expenses, netProfit, isLoss, rate, tax }
}

export function calcProperty(annualRent: number, exemptAmount: number, rate: number): TaxResult {
  const taxable = Math.max(0, annualRent - exemptAmount)
  return { gross: annualRent, deductions: exemptAmount, taxable, tax: round(taxable * rate) }
}

export function calcPropertyPenalty(tax: number, monthsLate: number, penaltyRate: number): number {
  return round(tax * penaltyRate * Math.max(0, monthsLate))
}

export const PROPERTY_LAW = 'قانون ضريبة العقار رقم 162 لسنة 1959 وتعديلاته'

export interface PropertyFormInput {
  annualRent: number
  nature: string
  familyHome: boolean
  isNew: boolean
  buildDate: string
  isEmpty: boolean
  emptyMonths: number
  rate: number
  penaltyDelay: boolean
  penaltyFalseInfo: boolean
  penaltyFakeEmpty: boolean
  penaltyUseChange: boolean
  penaltyMonths: number
  monthlyPenaltyRate: number
}

export interface PropertyPenaltyLine {
  label: string
  law: string
  amount: number
}

export interface PropertyFormResult {
  exempt: boolean
  exemptKey: 'none' | 'nature' | 'family' | 'newBuilding'
  exemptReason: string
  rent: number
  maintenance: number
  taxableBase: number
  emptyDeduction: number
  taxable: number
  baseTax: number
  penalties: PropertyPenaltyLine[]
  penalty: number
  finalTax: number
}

export function isNewBuildingExempt(buildDate: string, now = new Date()): boolean {
  if (!buildDate) return false
  const d = new Date(buildDate)
  if (isNaN(d.getTime())) return false
  const diffDays = Math.abs(now.getTime() - d.getTime()) / 86400000
  return diffDays <= 5 * 365
}

export function calcPropertyForm(i: PropertyFormInput): PropertyFormResult {
  const base: PropertyFormResult = {
    exempt: false,
    exemptKey: 'none',
    exemptReason: '',
    rent: i.annualRent,
    maintenance: 0,
    taxableBase: 0,
    emptyDeduction: 0,
    taxable: 0,
    baseTax: 0,
    penalties: [],
    penalty: 0,
    finalTax: 0,
  }

  if (i.nature !== 'none') {
    return {
      ...base,
      exempt: true,
      exemptKey: 'nature',
      exemptReason: `تم إعفاء هذا العقار بالكامل بناءً على صفته أو منفعته العامة، وذلك استناداً إلى أحكام (المادة الثالثة) من ${PROPERTY_LAW} التي تنص على إعفاء دور الدولة والأوقاف والنفع العام.`,
    }
  }
  if (i.familyHome) {
    return {
      ...base,
      exempt: true,
      exemptKey: 'family',
      exemptReason: `تم إعفاء هذا العقار بالكامل لأنه يمثل (دار سكن للعائلة)، وذلك استناداً إلى أحكام (المادة الرابعة - الفقرتين 1 و 2) من ${PROPERTY_LAW}، والتي تنص على إعفاء دار السكن والشقة التي يسكنها المالك أو أقاربه من الدرجة الأولى.`,
    }
  }
  if (i.isNew && isNewBuildingExempt(i.buildDate)) {
    return {
      ...base,
      exempt: true,
      exemptKey: 'newBuilding',
      exemptReason: `تم إعفاء هذا العقار بالكامل لأنه عقار مشيد حديثاً لم تمضِ على إتمامه 5 سنوات، استناداً إلى أحكام (المادة الرابعة - الفقرة 3) من ${PROPERTY_LAW}.`,
    }
  }

  if (i.annualRent <= 0) return base

  const rate = i.rate > 0 ? i.rate : 0.1
  const maintenance = round(i.annualRent * 0.1)
  let taxable = i.annualRent - maintenance
  let emptyDeduction = 0
  if (i.isEmpty && i.emptyMonths >= 3) {
    emptyDeduction = round((taxable / 12) * i.emptyMonths)
    taxable = taxable - emptyDeduction
  }
  const baseTax = round(taxable * rate)
  const penalties: PropertyPenaltyLine[] = []
  let penalty = 0
  const add = (label: string, law: string, amount: number) => {
    if (amount > 0) {
      penalties.push({ label, law, amount })
      penalty += amount
    }
  }
  if (i.penaltyDelay) add('غرامة تأخير', 'المادة 22 - الفقرة 1-أ', round(baseTax * 0.1))
  if (i.penaltyFalseInfo) add('إخفاء معلومات', 'المادة 7 - الفقرة 2', round(baseTax * 0.1))
  if (i.penaltyFakeEmpty) add('خلو وهمي', 'الغرامات - مثلي الضريبة المهربة', round(baseTax * 2))
  if (i.penaltyUseChange) add('تغيير استعمال العقار بدون إخبار', 'الغرامات - مثل الضريبة', round(baseTax * 1))
  if (i.penaltyMonths > 0)
    add('غرامة تأخير شهرية', `${i.penaltyMonths} شهر × 2% شهرياً`, round(baseTax * i.monthlyPenaltyRate * i.penaltyMonths))

  return { ...base, maintenance, taxableBase: i.annualRent - maintenance, emptyDeduction, taxable, baseTax, penalties, penalty, finalTax: baseTax + penalty }
}

export function calcLand(value: number, area: number, exemptArea: number, rate: number): TaxResult {
  const effExempt = area > 0 ? Math.min(area, exemptArea) / area : 0
  const taxable = Math.max(0, value * (1 - effExempt))
  return { gross: value, deductions: value * effExempt, taxable, tax: round(taxable * rate) }
}

export function calcProfession(income: number, allowance: number, brackets: TaxBracket[]): TaxResult {
  const taxable = Math.max(0, income - allowance)
  return { gross: income, deductions: allowance, taxable, tax: progressiveTax(taxable, brackets || DEFAULT_EMPLOYEE_BRACKETS) }
}

export function calcSales(amount: number, rate: number): number {
  return round(amount * rate)
}

export function calcContract(amount: number, rate: number): number {
  return round(amount * rate)
}

export const WITHHOLDING_RULES_2026 = {
  telecom: { rate: 0.005, label: 'شركات الاتصالات والإنترنت الرئيسية 0.50%' },
  construction: { rate: 0.008, label: 'أعمال الهدم والبناء والصيانة 0.80%' },
  services: { rate: 0.005, label: 'عقود الاستشارة والتدقيق والتدريب 0.50%' },
  transport: { rate: 0.001, label: 'النقل والشحن والتخليص الكمركي 0.10%' },
  foreign: { rate: 0.0014, label: 'شركات أجنبية غير مسجلة تستخدم اليد العاملة 0.14%' },
} as const

export type WithholdingKey = keyof typeof WITHHOLDING_RULES_2026

export interface WithholdingResult {
  key: WithholdingKey
  rate: number
  amount: number
  label: string
}

export function calcWithholding2026(amount: number, key: WithholdingKey): WithholdingResult {
  const rule = WITHHOLDING_RULES_2026[key]
  return { key, rate: rule.rate, amount: round(amount * rule.rate), label: rule.label }
}

export function calcDelayPenalty2026(tax: number, daysLate: number): number {
  if (daysLate > 42) return round(tax * 0.1)
  if (daysLate > 21) return round(tax * 0.05)
  return 0
}

export function applyMultiIncomeReduction2026(tax: number, multiSource: boolean, excluded: boolean): number {
  if (!multiSource || excluded) return tax
  return round(tax * 0.5)
}

export function calcEstimatedBusiness2026(revenue: number, profitRatio: number): TaxResult {
  const netProfit = round(revenue * profitRatio)
  return { gross: revenue, deductions: revenue - netProfit, taxable: netProfit, tax: round(netProfit * 0.15) }
}
