import { translate } from '../i18n'

export const CONTRACT_TAX_RATE = 0.15
export const CONTRACT_EXCHANGE_DINAR_PER_USD = 10
export const CONTRACT_LAWYER_MIN_PROFIT = 20000000
export const CONTRACT_CUSTOMS_FIXED_PROFIT = 15000000
export const CONTRACT_TOURISM_USD_PER_PERSON = 30
export const CONTRACT_HAJJ_USD_PER_PERSON = 35

export type ContractCategoryId = 'undertakings' | 'state' | 'companies' | 'brokerage' | 'tourism'

export interface ContractCategory {
  id: ContractCategoryId
  label: () => string
}

export type ContractSpecial =
  | 'costPlus'
  | 'exchange'
  | 'transferSupported'
  | 'tourism'
  | 'hajj'
  | 'importRates'
  | 'lawyer'
  | 'customs'
  | null

export interface ContractRule {
  id: string
  num: number
  categoryId: ContractCategoryId
  label: () => string
  rate: number | null
  special: ContractSpecial
  higherOf: boolean
  survey: boolean
  commission: boolean
  valueLabel: () => string
  note: () => string
}

export interface ContractCalcInputs {
  value: number
  cost: number
  agreedPct: number
  usd: number
  revenue: number
  bankFee: number
  persons: number
  children: number
  fxRate: number
  importPct: number
  supplyPct: number
  alternative: number
}

export interface ContractCalcResult {
  netProfit: number
  tax: number
  rateLabel: string
  formula: string
  needsApproval: boolean
}

const r = (
  id: string,
  num: number,
  categoryId: ContractCategoryId,
  rate: number | null,
  extra: Partial<ContractRule> = {},
): ContractRule => ({
  id,
  num,
  categoryId,
  rate,
  special: null,
  higherOf: false,
  survey: false,
  commission: false,
  label: () => translate(`pgTax.contracts.rule_${id}.label`),
  note: () => translate(`pgTax.contracts.rule_${id}.note`),
  valueLabel: () => translate(`pgTax.contracts.rule_${id}.valueLabel`),
  ...extra,
})

export const CONTRACT_CATEGORIES: ContractCategory[] = [
  { id: 'undertakings', label: () => translate('pgTax.contracts.cat_undertakings') },
  { id: 'state', label: () => translate('pgTax.contracts.cat_state') },
  { id: 'companies', label: () => translate('pgTax.contracts.cat_companies') },
  { id: 'brokerage', label: () => translate('pgTax.contracts.cat_brokerage') },
  { id: 'tourism', label: () => translate('pgTax.contracts.cat_tourism') },
]

export const CONTRACT_RULES: ContractRule[] = [
  r('c1', 1, 'undertakings', null, { special: 'importRates', survey: true }),
  r('c2', 2, 'undertakings', 18),
  r('c3', 3, 'undertakings', 20),
  r('c4', 4, 'undertakings', 12),
  r('c5', 5, 'undertakings', 2),
  r('c6', 6, 'undertakings', 15),
  r('c7', 7, 'undertakings', 12),
  r('c8', 8, 'undertakings', 12),
  r('c9', 9, 'undertakings', 25),
  r('c10', 10, 'undertakings', 22),
  r('c11', 11, 'undertakings', 15),
  r('c12', 12, 'undertakings', 15),
  r('c13', 13, 'undertakings', 25),
  r('c14', 14, 'undertakings', 20),
  r('c15', 15, 'undertakings', 5),
  r('c16', 16, 'undertakings', 10),
  r('c17', 17, 'undertakings', 10),
  r('c18', 18, 'state', 20),
  r('c19', 19, 'state', 10),
  r('c20', 20, 'state', 15),
  r('c21', 21, 'companies', 50, { commission: true }),
  r('c22', 22, 'companies', 50, { commission: true }),
  r('c23', 23, 'companies', 25),
  r('c24', 24, 'companies', 10, { higherOf: true }),
  r('c25', 25, 'companies', 10, { higherOf: true }),
  r('c26', 26, 'companies', 20),
  r('c27', 27, 'companies', 20),
  r('c28', 28, 'companies', 30),
  r('c29', 29, 'companies', 25, { special: 'lawyer', higherOf: true }),
  r('c30', 30, 'companies', null, { special: 'customs', higherOf: true }),
  r('c31', 31, 'companies', 10),
  r('c32', 32, 'companies', 15),
  r('c33', 33, 'companies', null, { special: 'costPlus' }),
  r('c34', 34, 'companies', 10, { higherOf: true }),
  r('c35', 35, 'brokerage', 40, { commission: true }),
  r('c36', 36, 'brokerage', null, { special: 'exchange' }),
  r('c37', 37, 'brokerage', null, { special: 'transferSupported' }),
  r('c38', 38, 'brokerage', 15),
  r('c39', 39, 'tourism', 20, { higherOf: true }),
  r('c40', 40, 'tourism', null, { special: 'tourism' }),
  r('c41', 41, 'tourism', null, { special: 'hajj' }),
]

export function contractRuleById(id: string): ContractRule | undefined {
  return CONTRACT_RULES.find((x) => x.id === id)
}

export function rulesForCategory(categoryId: ContractCategoryId): ContractRule[] {
  return CONTRACT_RULES.filter((x) => x.categoryId === categoryId)
}

export function defaultContractInputs(): ContractCalcInputs {
  return {
    value: 0,
    cost: 0,
    agreedPct: 0,
    usd: 0,
    revenue: 0,
    bankFee: 0,
    persons: 0,
    children: 0,
    fxRate: 0,
    importPct: 0,
    supplyPct: 0,
    alternative: 0,
  }
}

export function calcContract2026(rule: ContractRule, inp: ContractCalcInputs): ContractCalcResult {
  const ROUND = (n: number) => Math.round(n || 0)

  switch (rule.special) {
    case 'costPlus': {
      const net = ROUND(inp.cost * (inp.agreedPct / 100) * 0.75)
      return {
        netProfit: net,
        tax: ROUND(net * CONTRACT_TAX_RATE),
        rateLabel: translate('pgTax.contracts.rateCostPlus'),
        formula: translate('pgTax.contracts.formulaCostPlus', { cost: fmtD(inp.cost), pct: inp.agreedPct }),
        needsApproval: false,
      }
    }
    case 'exchange': {
      const base = ROUND(inp.usd * CONTRACT_EXCHANGE_DINAR_PER_USD)
      const net = ROUND(base * 0.5)
      return {
        netProfit: net,
        tax: ROUND(net * CONTRACT_TAX_RATE),
        rateLabel: translate('pgTax.contracts.rateExchange', { d: fmtD(CONTRACT_EXCHANGE_DINAR_PER_USD) }),
        formula: translate('pgTax.contracts.formulaExchange', { usd: fmtD(inp.usd), base: fmtD(base) }),
        needsApproval: false,
      }
    }
    case 'transferSupported': {
      const diff = Math.max(0, ROUND(inp.revenue - inp.bankFee))
      const net = ROUND(diff * 0.5)
      return {
        netProfit: net,
        tax: ROUND(net * CONTRACT_TAX_RATE),
        rateLabel: translate('pgTax.contracts.rateTransfer'),
        formula: translate('pgTax.contracts.formulaTransfer', { revenue: fmtD(inp.revenue), fee: fmtD(inp.bankFee), diff: fmtD(diff) }),
        needsApproval: false,
      }
    }
    case 'tourism': {
      const net = ROUND(inp.persons * CONTRACT_TOURISM_USD_PER_PERSON * inp.fxRate)
      return {
        netProfit: net,
        tax: ROUND(net * CONTRACT_TAX_RATE),
        rateLabel: translate('pgTax.contracts.rateTourism', { usd: CONTRACT_TOURISM_USD_PER_PERSON }),
        formula: translate('pgTax.contracts.formulaTourism', { persons: fmtD(inp.persons), usd: CONTRACT_TOURISM_USD_PER_PERSON, fx: fmtD(inp.fxRate) }),
        needsApproval: false,
      }
    }
    case 'hajj': {
      const effective = inp.persons + inp.children / 2
      const net = ROUND(effective * CONTRACT_HAJJ_USD_PER_PERSON * inp.fxRate)
      return {
        netProfit: net,
        tax: ROUND(net * CONTRACT_TAX_RATE),
        rateLabel: translate('pgTax.contracts.rateHajj', { usd: CONTRACT_HAJJ_USD_PER_PERSON }),
        formula: translate('pgTax.contracts.formulaHajj', { persons: fmtD(inp.persons), children: fmtD(inp.children), eff: fmtD(effective), usd: CONTRACT_HAJJ_USD_PER_PERSON, fx: fmtD(inp.fxRate) }),
        needsApproval: false,
      }
    }
    case 'importRates': {
      const rate = Math.max(inp.importPct, inp.supplyPct)
      const net = ROUND(inp.value * (rate / 100))
      return {
        netProfit: net,
        tax: ROUND(net * CONTRACT_TAX_RATE),
        rateLabel: translate('pgTax.contracts.rateImport', { rate, importPct: inp.importPct, supplyPct: inp.supplyPct }),
        formula: translate('pgTax.contracts.formulaImport', { value: fmtD(inp.value), rate }),
        needsApproval: true,
      }
    }
    case 'lawyer': {
      let net = ROUND(inp.value * ((rule.rate ?? 0) / 100))
      net = Math.max(net, CONTRACT_LAWYER_MIN_PROFIT, ROUND(inp.alternative))
      return {
        netProfit: net,
        tax: ROUND(net * CONTRACT_TAX_RATE),
        rateLabel: translate('pgTax.contracts.rateLawyer', { min: fmtD(CONTRACT_LAWYER_MIN_PROFIT) }),
        formula: translate('pgTax.contracts.formulaLawyer', { value: fmtD(inp.value), calc: fmtD(ROUND(inp.value * 0.25)), min: fmtD(CONTRACT_LAWYER_MIN_PROFIT), alt: fmtD(inp.alternative) }),
        needsApproval: false,
      }
    }
    case 'customs': {
      const net = Math.max(CONTRACT_CUSTOMS_FIXED_PROFIT, ROUND(inp.alternative))
      return {
        netProfit: net,
        tax: ROUND(net * CONTRACT_TAX_RATE),
        rateLabel: translate('pgTax.contracts.rateCustoms', { amount: fmtD(CONTRACT_CUSTOMS_FIXED_PROFIT) }),
        formula: translate('pgTax.contracts.formulaCustoms', { amount: fmtD(CONTRACT_CUSTOMS_FIXED_PROFIT), alt: fmtD(inp.alternative) }),
        needsApproval: false,
      }
    }
    default: {
      const rate = rule.rate ?? 0
      let net = ROUND(inp.value * (rate / 100))
      const alt = ROUND(inp.alternative)
      if (rule.higherOf && alt > net) net = alt
      const rateLabel = rule.rate !== null ? `${rule.rate}%` : translate('pgTax.contracts.dash')
      const baseFormula = translate('pgTax.contracts.formulaDefault', { value: fmtD(inp.value), rate })
      const formula =
        rule.higherOf && alt > 0
          ? translate('pgTax.contracts.formulaDefaultHigher', { base: baseFormula, calc: fmtD(ROUND(inp.value * (rate / 100))), alt: fmtD(alt) })
          : translate('pgTax.contracts.formulaDefaultNet', { base: baseFormula, net: fmtD(net) })
      return {
        netProfit: net,
        tax: ROUND(net * CONTRACT_TAX_RATE),
        rateLabel,
        formula,
        needsApproval: false,
      }
    }
  }
}

const fmtD = (n: number): string =>
  Math.round(n || 0)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
