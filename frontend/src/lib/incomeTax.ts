import { round } from './format'

export type IncomeGender = 'male' | 'female'
export type IncomeMarital = 'single' | 'married' | 'widowed' | 'divorced'
export type SpouseWork = 'housewife' | 'working' | 'incomeMerged' | 'totallyDisabled'
export type HousingKind = 'none' | 'unfurnished' | 'furnished' | 'shared' | 'hotel' | 'caravan'
export type FoodKind = 'none' | 'provided'
export type Residency = 'resident' | 'nonresident'

export interface IncomeInputs {
  salary: number
  cashAllowances: number
  housing: HousingKind
  food: FoodKind
  actualFoodCost: number
  retirement: number
  lifeInsurance: number
  alimony: number
  gender: IncomeGender
  age: number
  marital: IncomeMarital
  spouseWork: SpouseWork
  children: number
  residency: Residency
}

export const INCOME_HOUSING_PCT: Record<Exclude<HousingKind, 'none'>, number> = {
  unfurnished: 0.15,
  furnished: 0.2,
  shared: 0.1,
  hotel: 0.2,
  caravan: 0.05,
}

export const INCOME_FOOD_PCT = 0.1
export const INCOME_ALLOWANCES_CAP_RATE = 0.3
export const INCOME_AGE_THRESHOLD = 63

export const INCOME_SINGLE_ALLOWANCE = 208333
export const INCOME_MARRIED_HOUSEWIFE_ALLOWANCE = 375000
export const INCOME_MARRIED_DISABLED_ALLOWANCE = 416667
export const INCOME_WIDOWED_DIVORCED_WOMAN_ALLOWANCE = 266667
export const INCOME_SENIOR_ADD = 25000
export const INCOME_CHILD_ADD = 16667

export const INCOME_BRACKETS_2026: { from: number; rate: number }[] = [
  { from: 0, rate: 0.03 },
  { from: 20833, rate: 0.05 },
  { from: 41667, rate: 0.1 },
  { from: 83333, rate: 0.15 },
]

export interface IncomeBracketLine {
  rate: number
  slice: number
  tax: number
}

export interface IncomeResult {
  salary: number
  cashAllowances: number
  housingValue: number
  foodValue: number
  inKindValue: number
  gross: number
  allowancesPool: number
  allowanceExempt: number
  allowanceExcess: number
  deductions: number
  legalAllowance: number
  seniorAdd: number
  childAdd: number
  childrenCount: number
  allowanceKey: string
  taxable: number
  brackets: IncomeBracketLine[]
  tax: number
  nonResident: boolean
}

export function incomeBracketTax(amount: number): { lines: IncomeBracketLine[]; tax: number } {
  const bounds = [0, 20833, 41667, 83333]
  const rates = [0.03, 0.05, 0.1, 0.15]
  const lines: IncomeBracketLine[] = []
  let remaining = Math.max(0, amount)
  let tax = 0
  for (let i = 0; i < rates.length; i++) {
    const lower = bounds[i]
    const upper = i < bounds.length - 1 ? bounds[i + 1] : Infinity
    if (remaining <= 0) {
      lines.push({ rate: rates[i], slice: 0, tax: 0 })
      continue
    }
    const slice = Math.min(remaining, upper - lower)
    const t = round(slice * rates[i])
    lines.push({ rate: rates[i], slice, tax: t })
    tax += t
    remaining -= slice
  }
  return { lines, tax: round(tax) }
}

export function legalAllowanceInfo(i: Pick<IncomeInputs, 'gender' | 'marital' | 'spouseWork'>): {
  base: number
  key: string
  childEligible: boolean
} {
  if (i.marital === 'single') return { base: INCOME_SINGLE_ALLOWANCE, key: 'single', childEligible: false }
  if (i.marital === 'married') {
    if (i.spouseWork === 'totallyDisabled') return { base: INCOME_MARRIED_DISABLED_ALLOWANCE, key: 'disabled', childEligible: true }
    if (i.spouseWork === 'housewife' || i.spouseWork === 'incomeMerged') return { base: INCOME_MARRIED_HOUSEWIFE_ALLOWANCE, key: 'housewife', childEligible: true }
    return { base: INCOME_SINGLE_ALLOWANCE, key: 'marriedWorking', childEligible: false }
  }
  if (i.marital === 'widowed' || i.marital === 'divorced') {
    const woman = i.gender === 'female'
    return woman
      ? { base: INCOME_WIDOWED_DIVORCED_WOMAN_ALLOWANCE, key: 'widowDivorced', childEligible: true }
      : { base: INCOME_SINGLE_ALLOWANCE, key: 'widowerDivorced', childEligible: true }
  }
  return { base: 0, key: 'none', childEligible: false }
}

export function calcIncome2026(i: IncomeInputs): IncomeResult {
  const salary = Math.max(0, i.salary)
  const cash = Math.max(0, i.cashAllowances)

  const housingValue = i.housing !== 'none' && salary > 0 ? round(salary * INCOME_HOUSING_PCT[i.housing]) : 0
  const foodCap = round(salary * INCOME_FOOD_PCT)
  const foodValue = i.food === 'provided' && salary > 0 ? round(Math.min(foodCap, Math.max(0, i.actualFoodCost) > 0 ? Math.min(foodCap, Math.max(0, i.actualFoodCost)) : foodCap)) : 0
  const inKindValue = housingValue + foodValue

  const gross = salary + cash + inKindValue
  const allowancesPool = cash + inKindValue
  const cap = round(salary * INCOME_ALLOWANCES_CAP_RATE)
  const allowanceExempt = Math.min(allowancesPool, cap)
  const allowanceExcess = Math.max(0, allowancesPool - allowanceExempt)

  const deductions = Math.max(0, i.retirement) + Math.max(0, i.lifeInsurance) + Math.max(0, i.alimony)

  const nonResident = i.residency === 'nonresident'
  const info = legalAllowanceInfo(i)
  const base = nonResident ? 0 : info.base
  const seniorAdd = nonResident ? 0 : i.age >= INCOME_AGE_THRESHOLD ? INCOME_SENIOR_ADD : 0
  const childrenCount = Math.max(0, Math.floor(i.children))
  const childAdd = nonResident || !info.childEligible ? 0 : childrenCount * INCOME_CHILD_ADD
  const legalAllowance = base + seniorAdd + childAdd

  const afterDeductions = gross - allowanceExempt - deductions
  const taxable = Math.max(0, afterDeductions - legalAllowance)
  const { lines, tax } = incomeBracketTax(taxable)

  return {
    salary,
    cashAllowances: cash,
    housingValue,
    foodValue,
    inKindValue,
    gross,
    allowancesPool,
    allowanceExempt,
    allowanceExcess,
    deductions,
    legalAllowance,
    seniorAdd,
    childAdd,
    childrenCount,
    allowanceKey: nonResident ? 'none' : info.key,
    taxable,
    brackets: lines,
    tax,
    nonResident,
  }
}

export interface EmployerPenaltyResult {
  daysLate: number
  penaltyRate: number
  penalty: number
  interest: number
  total: number
}

export function calcEmployerPenalty2026(tax: number, daysLate: number, interestRatePct: number): EmployerPenaltyResult {
  const d = Math.max(0, Math.floor(daysLate))
  const penaltyRate = d > 42 ? 0.1 : d > 21 ? 0.05 : 0
  const penalty = round(tax * penaltyRate)
  const interest = round(tax * d * Math.max(0, interestRatePct) / 100)
  return { daysLate: d, penaltyRate, penalty, interest, total: penalty + interest }
}
