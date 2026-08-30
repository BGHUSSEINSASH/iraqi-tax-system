export function calculateTaxSummary({ taxableIncome = 0, deductions = 0, rate = 0.15, fixedTax = 0 }) {
  const safeTaxableIncome = Number(taxableIncome) || 0
  const safeDeductions = Number(deductions) || 0
  const safeRate = Number(rate) || 0
  const safeFixedTax = Number(fixedTax) || 0

  const netTaxable = Math.max(0, safeTaxableIncome - safeDeductions)
  const tax = Math.max(0, netTaxable * safeRate + safeFixedTax)

  return {
    taxableIncome: safeTaxableIncome,
    deductions: safeDeductions,
    netTaxable,
    rate: safeRate,
    fixedTax: safeFixedTax,
    tax,
    effectiveRate: netTaxable > 0 ? tax / netTaxable : 0,
  }
}
