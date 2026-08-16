import { useState } from 'react'
import { Calculator, FileText, Gavel, Scale, BadgePercent, Users } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { PageHead, Card, CardHeader, CardBody, Button, Badge, Field, Input, Select, MoneyInput, useToast } from '../components/ui'
import { useI18n } from '../i18n'
import { fmt, money, fmtDate } from '../lib/format'
import { calcIncome2026, calcEmployerPenalty2026, type IncomeInputs, type IncomeResult, type EmployerPenaltyResult } from '../lib/incomeTax'
import { printWindowHtml } from '../lib/export'

function nextMonth15(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + 1, 15).toISOString().slice(0, 10)
}

const defaultInputs: IncomeInputs = {
  salary: 0,
  cashAllowances: 0,
  housing: 'none',
  food: 'none',
  actualFoodCost: 0,
  retirement: 0,
  lifeInsurance: 0,
  alimony: 0,
  gender: 'male',
  age: 30,
  marital: 'single',
  spouseWork: 'housewife',
  children: 0,
  residency: 'resident',
}

export default function ProfessionTax() {
  const { currentCompany } = useApp()
  const { t } = useI18n()
  const { push } = useToast()

  const [inputs, setInputs] = useState<IncomeInputs>(defaultInputs)
  const [result, setResult] = useState<IncomeResult | null>(null)

  const [penTax, setPenTax] = useState(0)
  const [penDue, setPenDue] = useState(nextMonth15())
  const [penPay, setPenPay] = useState('')
  const [penRate, setPenRate] = useState(0.1)
  const [penResult, setPenResult] = useState<EmployerPenaltyResult | null>(null)

  const set = (patch: Partial<IncomeInputs>) => setInputs((prev) => ({ ...prev, ...patch }))

  const compute = () => {
    if (!(inputs.salary > 0)) {
      push('error', t('pgTax.income.salaryRequired'))
      return
    }
    setResult(calcIncome2026(inputs))
  }

  const computePenalty = () => {
    if (!(penTax > 0)) {
      push('error', t('pgTax.income.salaryRequired'))
      return
    }
    if (!penDue || !penPay) {
      push('error', t('pgTax.income.penNoDates'))
      return
    }
    const d1 = new Date(penDue)
    const d2 = new Date(penPay)
    const days = Math.max(0, Math.ceil((d2.getTime() - d1.getTime()) / 86400000))
    setPenResult(calcEmployerPenalty2026(penTax, days, penRate))
  }

  const allowanceKeyLabel = (k: IncomeResult['allowanceKey']) => {
    const map: Record<string, string> = {
      single: t('pgTax.income.allowKeySingle'),
      disabled: t('pgTax.income.allowKeyDisabled'),
      housewife: t('pgTax.income.allowKeyHousewife'),
      marriedWorking: t('pgTax.income.allowKeyMarriedWorking'),
      widowDivorced: t('pgTax.income.allowKeyWidowDivorced'),
      widowerDivorced: t('pgTax.income.allowKeyWidowerDivorced'),
      none: t('pgTax.income.allowKeyNone'),
    }
    return map[k] ?? ''
  }

  const doPrint = () => {
    if (!result) return
    const moneyLine = (label: string, law: string, amount: number) =>
      `<tr><td>${label}</td><td style="text-align:center;color:#334155;font-size:11px">${law}</td><td style="text-align:center;font-weight:700">${money(amount)}</td></tr>`
    const bracketRows = result.brackets
      .map((b) => `<tr><td>${b.rate * 100}%</td><td style="text-align:center">${fmt(b.slice)}</td><td style="text-align:center;font-weight:700">${money(b.tax)}</td></tr>`)
      .join('')
    const html = `
      <div style="font-family:'Tajawal','Segoe UI',sans-serif;direction:rtl;color:#0f172a">
        <h2 style="text-align:center;color:#065f46;margin:0 0 4px">${t('pgTax.income.resultTitle')}</h2>
        <p style="text-align:center;color:#475569;font-size:13px;margin:0 0 6px">${t('pgTax.income.pdfSubtitle')}</p>
        ${currentCompany ? `<p style="text-align:center;font-size:12px;color:#334155;margin:0 0 12px">${currentCompany.name} — رقم المكلف: ${currentCompany.taxId}</p>` : ''}
        <table style="width:100%;border-collapse:collapse;font-size:12px" border="1">
          <thead><tr style="background:#065f46;color:#fff">
            <th style="padding:6px">${t('pgTax.income.pdfRowItem')}</th>
            <th style="padding:6px">${t('pgTax.income.pdfRowLaw')}</th>
            <th style="padding:6px">${t('pgTax.income.pdfRowAmount')}</th>
          </tr></thead>
          <tbody>
            ${moneyLine(t('pgTax.income.rowGross'), t('pgTax.income.lawArticle2'), result.gross)}
            ${moneyLine(t('pgTax.income.rowAllowance'), t('pgTax.income.lawArticle6'), result.allowanceExempt)}
            ${moneyLine(t('pgTax.income.rowDeductions'), t('pgTax.income.lawArticle3'), result.deductions)}
            ${moneyLine(t('pgTax.income.rowLegal'), t('pgTax.income.lawArticle5'), result.legalAllowance)}
            <tr><td>${t('pgTax.income.taxableLabel')}</td><td style="text-align:center;color:#334155;font-size:11px">—</td><td style="text-align:center;font-weight:700">${money(result.taxable)}</td></tr>
            <tr style="background:#ecfdf5"><td colspan="3" style="padding:6px;font-weight:900;color:#065f46">${t('pgTax.income.taxBracketTitle')} — ${t('pgTax.income.lawArticle8')}</td></tr>
            <tr><td>${t('pgTax.income.bracketRate')}</td><td style="text-align:center">${t('pgTax.income.bracketSlice')}</td><td style="text-align:center">${t('pgTax.income.bracketTax')}</td></tr>
            ${bracketRows}
            <tr style="background:#d1fae5"><td colspan="2" style="padding:8px;font-weight:900">${t('pgTax.income.finalTax')}</td><td style="text-align:center;padding:8px;font-weight:900;font-size:14px;color:#065f46">${money(result.tax)}</td></tr>
          </tbody>
        </table>
        <p style="font-size:11px;color:#64748b;margin-top:12px;line-height:1.7">${t('pgTax.income.disclaimer')}</p>
      </div>`
    printWindowHtml(t('pgTax.income.pdfTitle'), html)
  }

  return (
    <div>
      <PageHead title={t('pgTax.income.title')} desc={t('pgTax.income.desc')} />

      {/* ======================== CALCULATOR ======================== */}
      <Card>
        <CardHeader
          title={t('pgTax.income.calcTitle')}
          subtitle={t('pgTax.income.calcSubtitle')}
        />
        <CardBody className="space-y-6">
          {/* Section أ: social */}
          <div>
            <h4 className="mb-3 flex items-center gap-1 border-b pb-1.5 text-sm font-bold text-brand-600">
              <Users size={15} /> {t('pgTax.income.secSocial')}
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label={t('pgTax.income.fieldAge')} hint={t('pgTax.income.ageHint')}>
                <Input type="number" min={0} value={inputs.age || ''} onChange={(e) => set({ age: Math.max(0, Number(e.target.value)) })} />
              </Field>
              <Field label={t('pgTax.income.fieldGender')}>
                <Select value={inputs.gender} onChange={(e) => set({ gender: e.target.value as IncomeInputs['gender'] })}>
                  <option value="male">{t('pgTax.income.genderMale')}</option>
                  <option value="female">{t('pgTax.income.genderFemale')}</option>
                </Select>
              </Field>
              <Field label={t('pgTax.income.fieldMarital')}>
                <Select value={inputs.marital} onChange={(e) => set({ marital: e.target.value as IncomeInputs['marital'] })}>
                  <option value="single">{t('pgTax.income.maritalSingle')}</option>
                  <option value="married">{t('pgTax.income.maritalMarried')}</option>
                  <option value="widowed">{t('pgTax.income.maritalWidowed')}</option>
                  <option value="divorced">{t('pgTax.income.maritalDivorced')}</option>
                </Select>
              </Field>
              {inputs.marital === 'married' && (
                <Field label={t('pgTax.income.fieldSpouseWork')}>
                  <Select value={inputs.spouseWork} onChange={(e) => set({ spouseWork: e.target.value as IncomeInputs['spouseWork'] })}>
                    <option value="housewife">{t('pgTax.income.spouseHousewife')}</option>
                    <option value="working">{t('pgTax.income.spouseWorking')}</option>
                    <option value="incomeMerged">{t('pgTax.income.spouseIncomeMerged')}</option>
                    <option value="totallyDisabled">{t('pgTax.income.spouseDisabled')}</option>
                  </Select>
                </Field>
              )}
              <Field label={t('pgTax.income.fieldChildren')} hint={t('pgTax.income.childrenHint')}>
                <Input type="number" min={0} value={inputs.children || ''} onChange={(e) => set({ children: Math.max(0, Number(e.target.value)) })} />
              </Field>
              <Field label={t('pgTax.income.fieldResidency')}>
                <Select value={inputs.residency} onChange={(e) => set({ residency: e.target.value as IncomeInputs['residency'] })}>
                  <option value="resident">{t('pgTax.income.resident')}</option>
                  <option value="nonresident">{t('pgTax.income.nonresident')}</option>
                </Select>
              </Field>
              {inputs.residency === 'nonresident' && (
                <div className="flex items-center rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
                  {t('pgTax.income.nonResidentNote')}
                </div>
              )}
            </div>
          </div>

          {/* Section ب: financial */}
          <div>
            <h4 className="mb-3 flex items-center gap-1 border-b pb-1.5 text-sm font-bold text-brand-600">
              <BadgePercent size={15} /> {t('pgTax.income.secFinancial')}
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label={t('pgTax.income.fieldSalary')} required>
                <MoneyInput value={inputs.salary} onChange={(v) => set({ salary: v })} />
              </Field>
              <Field label={t('pgTax.income.fieldCashAllowances')} hint={t('pgTax.income.cashAllowancesHint')}>
                <MoneyInput value={inputs.cashAllowances} onChange={(v) => set({ cashAllowances: v })} />
              </Field>
              <Field label={t('pgTax.income.fieldHousing')}>
                <Select value={inputs.housing} onChange={(e) => set({ housing: e.target.value as IncomeInputs['housing'] })}>
                  <option value="none">{t('pgTax.income.housingNone')}</option>
                  <option value="unfurnished">{t('pgTax.income.housingUnfurnished')}</option>
                  <option value="furnished">{t('pgTax.income.housingFurnished')}</option>
                  <option value="shared">{t('pgTax.income.housingShared')}</option>
                  <option value="hotel">{t('pgTax.income.housingHotel')}</option>
                  <option value="caravan">{t('pgTax.income.housingCaravan')}</option>
                </Select>
              </Field>
              <Field label={t('pgTax.income.fieldFood')}>
                <Select value={inputs.food} onChange={(e) => set({ food: e.target.value as IncomeInputs['food'] })}>
                  <option value="none">{t('pgTax.income.foodNone')}</option>
                  <option value="provided">{t('pgTax.income.foodProvided')}</option>
                </Select>
              </Field>
              {inputs.food === 'provided' && (
                <Field label={t('pgTax.income.fieldFoodCost')} hint={t('pgTax.income.foodCostHint')}>
                  <MoneyInput value={inputs.actualFoodCost} onChange={(v) => set({ actualFoodCost: v })} />
                </Field>
              )}
            </div>
          </div>

          {/* Section ج: legal deductions */}
          <div>
            <h4 className="mb-3 flex items-center gap-1 border-b pb-1.5 text-sm font-bold text-brand-600">
              <Scale size={15} /> {t('pgTax.income.secDeductions')}
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label={t('pgTax.income.fieldRetirement')}>
                <MoneyInput value={inputs.retirement} onChange={(v) => set({ retirement: v })} />
              </Field>
              <Field label={t('pgTax.income.fieldInsurance')}>
                <MoneyInput value={inputs.lifeInsurance} onChange={(v) => set({ lifeInsurance: v })} />
              </Field>
              <Field label={t('pgTax.income.fieldAlimony')} hint={t('pgTax.income.alimonyHint')}>
                <MoneyInput value={inputs.alimony} onChange={(v) => set({ alimony: v })} />
              </Field>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={compute}>
              <Calculator size={16} /> {t('pgTax.income.calcBtn')}
            </Button>
            {result && (
              <Button variant="secondary" onClick={doPrint}>
                <FileText size={16} /> {t('pgTax.income.printBtn')}
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* ======================== RESULT / AUDIT TRAIL ======================== */}
      {result && (
        <Card className="border-2 border-brand-200">
          <CardHeader title={t('pgTax.income.resultTitle')} subtitle={t('pgTax.income.resultSubtitle')} />
          <CardBody className="space-y-5">
            {result.nonResident && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
                {t('pgTax.income.nonResidentNote')}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-start justify-between rounded-xl border border-ink-200 bg-ink-50 p-4">
                <div>
                  <div className="text-sm font-bold text-ink-800">{t('pgTax.income.rowGross')}</div>
                  <div className="mt-1 text-[11px] text-ink-500">
                    {t('pgTax.income.lawArticle2')} — {t('pgTax.income.grossLawDetail', { s: money(result.salary), c: money(result.cashAllowances), h: money(result.housingValue), f: money(result.foodValue) })}
                  </div>
                </div>
                <div className="text-lg font-black text-ink-800">{money(result.gross)}</div>
              </div>

              <div className="flex items-start justify-between rounded-xl border border-ink-200 bg-ink-50 p-4">
                <div>
                  <div className="text-sm font-bold text-ink-800">{t('pgTax.income.rowAllowance')}</div>
                  <div className="mt-1 text-[11px] text-ink-500">{t('pgTax.income.lawArticle6')} — {t('pgTax.income.allowanceNote', { pct: 30 })}</div>
                  {result.allowanceExcess > 0 && (
                    <div className="mt-1 text-[11px] text-amber-700">{t('pgTax.income.excessNote', { amount: money(result.allowanceExcess) })}</div>
                  )}
                </div>
                <div className="text-lg font-black text-emerald-700">{money(result.allowanceExempt)}</div>
              </div>

              <div className="flex items-start justify-between rounded-xl border border-ink-200 bg-ink-50 p-4">
                <div>
                  <div className="text-sm font-bold text-ink-800">{t('pgTax.income.rowDeductions')}</div>
                  <div className="mt-1 text-[11px] text-ink-500">{t('pgTax.income.lawArticle3')} — {t('pgTax.income.lawArticle3Detail')}</div>
                </div>
                <div className="text-lg font-black text-emerald-700">{money(result.deductions)}</div>
              </div>

              <div className="flex items-start justify-between rounded-xl border border-ink-200 bg-ink-50 p-4">
                <div>
                  <div className="text-sm font-bold text-ink-800">{t('pgTax.income.rowLegal')}</div>
                  <div className="mt-1 text-[11px] text-ink-500">
                    {t('pgTax.income.lawArticle5')} — {allowanceKeyLabel(result.allowanceKey)}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-ink-600">
                    <Badge tone="brand">{money(result.legalAllowance - result.seniorAdd - result.childAdd)}</Badge>
                    {result.seniorAdd > 0 && <Badge>{t('pgTax.income.seniorAddLabel', { amount: money(result.seniorAdd) })}</Badge>}
                    {result.childAdd > 0 && <Badge>{t('pgTax.income.childAddLabel', { n: result.childrenCount, amount: money(result.childAdd) })}</Badge>}
                  </div>
                </div>
                <div className="text-lg font-black text-emerald-700">{money(result.legalAllowance)}</div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 p-4">
              <div className="text-sm font-bold text-brand-800">{t('pgTax.income.taxableLabel')}</div>
              <div className="text-xl font-black text-brand-800">{money(result.taxable)}</div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-bold text-ink-800">{t('pgTax.income.taxBracketTitle')}</div>
                <Badge tone="brand">{t('pgTax.income.lawArticle8')}</Badge>
              </div>
              <div className="overflow-hidden rounded-xl border border-ink-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-ink-50 text-xs text-ink-500">
                      <th className="px-3 py-2 text-right font-medium">{t('pgTax.income.bracketRate')}</th>
                      <th className="px-3 py-2 text-right font-medium">{t('pgTax.income.bracketSlice')}</th>
                      <th className="px-3 py-2 text-right font-medium">{t('pgTax.income.bracketTax')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.brackets.map((b) => (
                      <tr key={b.rate} className="border-t border-ink-100">
                        <td className="px-3 py-2 font-semibold">{b.rate * 100}%</td>
                        <td className="px-3 py-2">{money(b.slice)}</td>
                        <td className="px-3 py-2 font-bold text-brand-700">{money(b.tax)}</td>
                      </tr>
                    ))}
                    {result.taxable <= 0 && (
                      <tr className="border-t border-ink-100">
                        <td colSpan={3} className="px-3 py-3 text-center text-xs text-emerald-700">{t('pgTax.income.zeroTaxNote')}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-brand-600 p-5 text-white">
              <div className="text-sm font-bold text-emerald-100">{t('pgTax.income.finalTax')}</div>
              <div className="text-2xl font-black">{money(result.tax)}</div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ======================== EMPLOYER PENALTIES (ADMIN) ======================== */}
      <Card>
        <CardHeader title={t('pgTax.income.penaltyTitle')} subtitle={t('pgTax.income.penaltyDesc')} />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label={t('pgTax.income.penTaxAmount')}>
              <div className="flex items-center gap-2">
                <MoneyInput value={penTax} onChange={setPenTax} className="flex-1" />
                {result && (
                  <Button size="sm" variant="secondary" onClick={() => setPenTax(result.tax)} title={t('pgTax.income.penUseResult')}>
                    <Calculator size={14} /> {t('pgTax.income.penUseResult')}
                  </Button>
                )}
              </div>
            </Field>
            <Field label={t('pgTax.income.penDueDate')}>
              <Input type="date" value={penDue} onChange={(e) => setPenDue(e.target.value)} />
            </Field>
            <Field label={t('pgTax.income.penPayDate')}>
              <Input type="date" value={penPay} onChange={(e) => setPenPay(e.target.value)} />
            </Field>
            <Field label={t('pgTax.income.penInterestRate')} hint={t('pgTax.income.penInterestHint')}>
              <Input type="number" min={0} step={0.01} value={penRate} onChange={(e) => setPenRate(Number(e.target.value))} />
            </Field>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={computePenalty}>
              <Gavel size={16} /> {t('pgTax.income.penCalcBtn')}
            </Button>
          </div>

          {penResult && (
            <div className="space-y-3 rounded-2xl border border-ink-200 bg-ink-50 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="brand">{t('pgTax.income.penLaw6')}</Badge>
                <Badge>{t('pgTax.income.penLaw8')}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-white p-3">
                  <div className="text-xs text-ink-500">{t('pgTax.income.penDaysLate')}</div>
                  <div className="text-lg font-black text-ink-800">{fmt(penResult.daysLate)}</div>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <div className="text-xs text-ink-500">{t('pgTax.income.penRateLabel')}</div>
                  <div className="text-lg font-black text-amber-700">{fmt(penResult.penaltyRate * 100)}%</div>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <div className="text-xs text-ink-500">{t('pgTax.income.penPenalty')}</div>
                  <div className="text-lg font-black text-red-600">{money(penResult.penalty)}</div>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <div className="text-xs text-ink-500">{t('pgTax.income.penInterest')}</div>
                  <div className="text-lg font-black text-red-600">{money(penResult.interest)}</div>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-brand-600 p-4 text-white">
                <div className="text-sm font-bold text-emerald-100">{t('pgTax.income.penTotal')}</div>
                <div className="text-2xl font-black">{money(penResult.total)}</div>
              </div>
              {penResult.daysLate <= 21 && (
                <div className="text-xs text-emerald-700">{t('pgTax.income.penNoPenalty')}</div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      <p className="mt-4 text-xs leading-6 text-ink-400">{t('pgTax.income.disclaimer')}</p>
    </div>
  )
}
