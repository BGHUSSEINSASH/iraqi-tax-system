import { round } from './format'

export const PROPERTY_LAW = 'قانون ضريبة العقار رقم 162 لسنة 1959 وتعديلاته'

export const PROPERTY_TAX_RATE = 0.1
export const MAINTENANCE_RATE = 0.1
export const NEW_BUILDING_EXEMPT_YEARS = 5
export const VACANCY_EXEMPT_MONTHS = 3
export const DELAY_PENALTY_RATE = 0.1
export const FALSE_INFO_PENALTY_RATE = 0.1
export const FAKE_EMPTY_MULTIPLIER = 2
export const USE_CHANGE_MULTIPLIER = 1
export const USE_CHANGE_REPEAT_MULTIPLIER = 2

export interface ExemptionOption {
  id: string
  articleKey: string
}

export const PUBLIC_EXEMPTIONS: ExemptionOption[] = [
  { id: 'govt', articleKey: 'law_article3' },
  { id: 'waqf', articleKey: 'law_article3' },
  { id: 'religious', articleKey: 'law_article3' },
  { id: 'charity', articleKey: 'law_article3' },
  { id: 'diplomatic', articleKey: 'law_article3' },
  { id: 'parties', articleKey: 'law_article3' },
  { id: 'donated', articleKey: 'law_article3' },
  { id: 'incomeTax', articleKey: 'law_article3' },
  { id: 'farm', articleKey: 'law_article3' },
]

export const RESIDENTIAL_EXEMPTIONS: ExemptionOption[] = [
  { id: 'owner', articleKey: 'law_article4_1_2' },
  { id: 'relatives', articleKey: 'law_article4_1_2' },
  { id: 'stateBuilt', articleKey: 'law_article4_1_2' },
]

export interface PropertyAssessmentInput {
  publicExemptionId: string | null
  residentialExemptionId: string | null
  isNew: boolean
  buildDate: string
  isEmpty: boolean
  emptyMonths: number
  annualRent: number
  delayYears: number
  falseInfo: boolean
  fakeEmpty: boolean
  useChange: boolean
  useChangeRepeat: boolean
}

export interface PropertyAssessmentStep {
  key: string
  lawKey: string | null
  value: number
  months?: number
}

export interface PropertyAssessmentPenalty {
  labelKey: string
  lawKey: string
  amount: number
}

export interface PropertyAssessment {
  exempt: boolean
  exemptKey: 'public' | 'residential' | 'newBuilding' | 'none'
  articleKey: string | null
  rent: number
  maintenance: number
  taxableBase: number
  emptyDeduction: number
  taxable: number
  baseTax: number
  penalties: PropertyAssessmentPenalty[]
  penalty: number
  finalTax: number
  steps: PropertyAssessmentStep[]
}

export function isNewBuildingExempt(buildDate: string, now = new Date()): boolean {
  if (!buildDate) return false
  const d = new Date(buildDate)
  if (Number.isNaN(d.getTime())) return false
  const years = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 365)
  return years >= 0 && years < NEW_BUILDING_EXEMPT_YEARS
}

export function assessProperty(i: PropertyAssessmentInput): PropertyAssessment {
  const base: PropertyAssessment = {
    exempt: false,
    exemptKey: 'none',
    articleKey: null,
    rent: i.annualRent,
    maintenance: 0,
    taxableBase: 0,
    emptyDeduction: 0,
    taxable: 0,
    baseTax: 0,
    penalties: [],
    penalty: 0,
    finalTax: 0,
    steps: [],
  }

  if (i.publicExemptionId) {
    const opt = PUBLIC_EXEMPTIONS.find((o) => o.id === i.publicExemptionId)
    return {
      ...base,
      exempt: true,
      exemptKey: 'public',
      articleKey: opt?.articleKey ?? 'law_article3',
    }
  }

  if (i.residentialExemptionId) {
    const opt = RESIDENTIAL_EXEMPTIONS.find((o) => o.id === i.residentialExemptionId)
    return {
      ...base,
      exempt: true,
      exemptKey: 'residential',
      articleKey: opt?.articleKey ?? 'law_article4_1_2',
    }
  }

  if (i.isNew && isNewBuildingExempt(i.buildDate)) {
    return {
      ...base,
      exempt: true,
      exemptKey: 'newBuilding',
      articleKey: 'law_article4_3',
    }
  }

  if (i.annualRent <= 0) return base

  const maintenance = round(i.annualRent * MAINTENANCE_RATE)
  const taxableBase = i.annualRent - maintenance
  const steps: PropertyAssessmentStep[] = [
    { key: 'rowRent', lawKey: null, value: i.annualRent },
    { key: 'rowMaintenance', lawKey: 'rowMaintenanceNote', value: maintenance },
  ]

  let emptyDeduction = 0
  if (i.isEmpty && i.emptyMonths >= VACANCY_EXEMPT_MONTHS) {
    emptyDeduction = round((taxableBase / 12) * i.emptyMonths)
    steps.push({ key: 'rowEmptyDeduction', lawKey: 'rowEmptyDeductionNote', value: emptyDeduction, months: i.emptyMonths })
  }

  const taxable = taxableBase - emptyDeduction
  steps.push({ key: 'rowTaxable', lawKey: null, value: taxable })

  const baseTax = round(taxable * PROPERTY_TAX_RATE)
  steps.push({ key: 'rowBaseTax', lawKey: 'rowBaseTaxNote', value: baseTax })

  const penalties: PropertyAssessmentPenalty[] = []
  let penalty = 0
  const add = (labelKey: string, lawKey: string, amount: number) => {
    if (amount > 0) {
      penalties.push({ labelKey, lawKey, amount })
      penalty += amount
    }
  }

  if (i.delayYears > 0) {
    add('penDelayLabel', 'penDelayLaw', round(baseTax * DELAY_PENALTY_RATE * i.delayYears))
  }
  if (i.falseInfo) {
    add('penFalseInfoLabel', 'penFalseInfoLaw', round(baseTax * FALSE_INFO_PENALTY_RATE))
  }
  if (i.fakeEmpty) {
    add('penFakeEmptyLabel', 'penFakeEmptyLaw', round(baseTax * FAKE_EMPTY_MULTIPLIER))
  }
  if (i.useChange) {
    add('penUseChangeLabel', 'penUseChangeLaw', round(baseTax * (i.useChangeRepeat ? USE_CHANGE_REPEAT_MULTIPLIER : USE_CHANGE_MULTIPLIER)))
  }

  return { ...base, maintenance, taxableBase, emptyDeduction, taxable, baseTax, penalties, penalty, finalTax: baseTax + penalty, steps }
}
