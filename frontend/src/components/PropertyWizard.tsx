import { useMemo, useState } from 'react'
import { Building2, Home, Timer, Calculator, CheckCircle2, Printer, Save, RotateCcw, ChevronRight, ChevronLeft, Landmark } from 'lucide-react'
import { useI18n } from '../i18n'
import { Card, Button, Field, Input, MoneyInput, Toggle, useToast } from './ui'
import { money, todayIso } from '../lib/format'
import { printWindowHtml } from '../lib/export'
import {
  PUBLIC_EXEMPTIONS,
  RESIDENTIAL_EXEMPTIONS,
  assessProperty,
  isNewBuildingExempt,
  PROPERTY_TAX_RATE,
  type PropertyAssessment,
} from '../lib/propertyLaw'
import type { PropertyRecord } from '../lib/types'

const P = 'pgTax.property'

const stepMeta = [
  { n: 1, key: 'step1', icon: Landmark },
  { n: 2, key: 'step2', icon: Home },
  { n: 3, key: 'step3', icon: Timer },
  { n: 4, key: 'step4', icon: Calculator },
] as const

export default function PropertyWizard({
  defaultYear,
  onSave,
}: {
  defaultYear: number
  onSave: (p: Omit<PropertyRecord, 'id' | 'companyId'>) => void
}) {
  const { t } = useI18n()
  const { push } = useToast()
  const law = t(`${P}.law`)

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [pubSel, setPubSel] = useState<string | null>(null)
  const [resSel, setResSel] = useState<string | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [buildDate, setBuildDate] = useState('')
  const [isEmpty, setIsEmpty] = useState(false)
  const [emptyMonths, setEmptyMonths] = useState(0)
  const [annualRent, setAnnualRent] = useState(0)
  const [delayYears, setDelayYears] = useState(0)
  const [falseInfo, setFalseInfo] = useState(false)
  const [fakeEmpty, setFakeEmpty] = useState(false)
  const [useChange, setUseChange] = useState(false)
  const [useChangeRepeat, setUseChangeRepeat] = useState(false)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [assess, setAssess] = useState<PropertyAssessment | null>(null)

  const live = useMemo(
    () =>
      assessProperty({
        publicExemptionId: pubSel,
        residentialExemptionId: resSel,
        isNew,
        buildDate,
        isEmpty,
        emptyMonths,
        annualRent,
        delayYears,
        falseInfo,
        fakeEmpty,
        useChange,
        useChangeRepeat,
      }),
    [pubSel, resSel, isNew, buildDate, isEmpty, emptyMonths, annualRent, delayYears, falseInfo, fakeEmpty, useChange, useChangeRepeat],
  )

  const reason = live.exempt ? t(`${P}.reason_${live.exemptKey}`, { law }) : ''

  const reset = () => {
    setStep(1)
    setPubSel(null)
    setResSel(null)
    setIsNew(false)
    setBuildDate('')
    setIsEmpty(false)
    setEmptyMonths(0)
    setAnnualRent(0)
    setDelayYears(0)
    setFalseInfo(false)
    setFakeEmpty(false)
    setUseChange(false)
    setUseChangeRepeat(false)
    setName('')
    setLocation('')
    setAssess(null)
  }

  const handleCompute = () => {
    if (annualRent <= 0) {
      push('error', t(`${P}.rentRequired`))
      return
    }
    setAssess(live)
  }

  const handleSave = () => {
    if (!name.trim()) {
      push('error', t(`${P}.nameRequired`))
      return
    }
    onSave({
      year: defaultYear,
      name: name.trim(),
      location,
      annualRent: live.rent,
      exemptAmount: 0,
      rate: PROPERTY_TAX_RATE,
      taxable: live.taxable,
      tax: live.baseTax,
      paid: 0,
      penaltyMonths: 0,
      penalty: live.penalty,
      totalDue: live.finalTax,
      notes: '',
      nature: live.exemptKey === 'public' ? 'state' : live.exemptKey === 'residential' ? 'family' : 'none',
      familyHome: live.exemptKey === 'residential',
      isNew,
      buildDate,
      isEmpty,
      emptyMonths,
      maintenance: live.maintenance,
      exempt: live.exempt,
      exemptReason: live.exempt ? reason : '',
      penaltyDelay: delayYears > 0,
      penaltyFalseInfo: falseInfo,
      penaltyFakeEmpty: fakeEmpty,
      penaltyUseChange: useChange,
    })
    push('success', t(`${P}.saveSuccess`))
  }

  const reportStyles = `table{width:100%;border-collapse:collapse;margin:12px 0}td,th{border:1px solid #e2e8f0;padding:8px 10px;font-size:14px}th{background:#f1f5f9;text-align:start}.final{background:#0f766e;color:#fff;padding:12px 16px;border-radius:8px;font-weight:800;text-align:center;margin:14px 0}h1,h2{margin:6px 0}ol{padding-inline-start:22px;line-height:2}`

  const handlePrint = () => {
    if (!assess) return
    const a = assess
    const tr = (k: string, vars?: Record<string, string | number>) => t(`${P}.${k}`, vars)
    const summaryRows: [string, string][] = [
      [tr('rowRent'), money(a.rent)],
      [tr('rowMaintenance'), money(a.maintenance)],
    ]
    if (a.emptyDeduction > 0) summaryRows.push([tr('rowEmptyDeduction', { months: emptyMonths }), money(a.emptyDeduction)])
    summaryRows.push([tr('rowTaxable'), money(a.taxable)])
    summaryRows.push([tr('rowBaseTax'), money(a.baseTax)])
    a.penalties.forEach((p) => summaryRows.push([tr(p.labelKey), money(p.amount)]))
    const table = `<table><tr><th style="text-align:start">${tr('resultSummaryTitle')}</th><th style="text-align:end">${t('common.currency')}</th></tr>${summaryRows
      .map(([l, v]) => `<tr><td>${l}</td><td style="text-align:end">${v}</td></tr>`)
      .join('')}</table>`
    const stepsHtml = a.steps
      .map((s, i) => `<li>${tr(s.key, s.months !== undefined ? { months: s.months } : undefined)}${s.lawKey ? ` — (${tr(s.lawKey)})` : ''}: <b>${money(s.value)}</b></li>`)
      .join('')
    const body = `<h1 style="text-align:center">${tr('title')}</h1>
      <h2 style="text-align:center;font-weight:500;color:#64748b;font-size:14px">${tr('wizardDesc', { law })}</h2>
      <h2>${tr('resultSummaryTitle')}</h2>
      ${table}
      <div class="final">${tr('finalTaxLabel')}: ${money(a.finalTax)}</div>
      <h2>${tr('resultHowTitle')}</h2>
      <ol>${stepsHtml}</ol>
      <p style="color:#64748b;font-size:13px">${tr('wizardDisclaimer')}</p>
      <p style="text-align:end;color:#94a3b8;font-size:12px">${tr('reportDateNote', { date: todayIso() })}</p>`
    printWindowHtml(tr('reportTitle'), body, reportStyles)
  }

  const ResultCard = () => {
    if (!live.exempt) return null
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" /> {t(`${P}.resultExemptTitle`)}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-emerald-800">{reason}</p>
        <div className="mt-1 text-xs font-bold text-emerald-700">{t(`${P}.resultExemptAmount`)}</div>
        {live.articleKey && (
          <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
            {t(`${P}.${live.articleKey}`)}
          </span>
        )}
        <div className="mt-3 grid max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t(`${P}.fieldName`)}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t(`${P}.defaultRecordName`)} />
          </Field>
          <Field label={t(`${P}.fieldLocation`)}>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={handleSave}>
            <Save size={15} /> {t(`${P}.saveRecordBtn`)}
          </Button>
          <Button variant="secondary" onClick={handlePrint}>
            <Printer size={15} /> {t(`${P}.printBtn`)}
          </Button>
          <Button variant="ghost" onClick={reset}>
            <RotateCcw size={15} /> {t(`${P}.resetBtn`)}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card className="mb-4">
      <div className="border-b border-ink-100 px-5 py-4">
        <h3 className="flex items-center gap-2 text-base font-bold text-ink-800">
          <Landmark size={18} className="text-brand-600" /> {t(`${P}.wizardTitle`)}
        </h3>
        <p className="mt-0.5 text-xs text-ink-500">{t(`${P}.wizardDesc`, { law })}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-5 py-3">
        {stepMeta.map((s, idx) => {
          const Icon = s.icon
          const active = step === s.n
          const done = step > s.n
          return (
            <div key={s.n} className="flex items-center gap-2">
              {idx > 0 && <ChevronLeft size={16} className="text-ink-300" />}
              <button
                type="button"
                onClick={() => setStep(s.n as 1 | 2 | 3 | 4)}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition ${active ? 'bg-brand-600 text-white' : done ? 'bg-emerald-100 text-emerald-700' : 'bg-ink-100 text-ink-500 hover:bg-ink-200'}`}
              >
                <Icon size={14} />
                {t(`${P}.${s.key}`)}
                {done && <CheckCircle2 size={13} />}
              </button>
            </div>
          )
        })}
      </div>

      <div className="px-5 pb-5">
        {step === 1 && (
          <div>
            <h4 className="text-sm font-bold text-ink-800">{t(`${P}.step1Title`)}</h4>
            <p className="mt-0.5 text-xs text-ink-500">{t(`${P}.step1Desc`)}</p>
            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
              {PUBLIC_EXEMPTIONS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setPubSel(o.id)}
                  className={`flex items-start gap-3 rounded-xl border p-3 text-start transition ${pubSel === o.id ? 'border-brand-500 bg-brand-50' : 'border-ink-200 hover:border-brand-300 hover:bg-ink-50'}`}
                >
                  <Building2 size={18} className="mt-0.5 shrink-0 text-brand-600" />
                  <span className="text-sm leading-relaxed text-ink-700">{t(`${P}.pub_${o.id}`)}</span>
                </button>
              ))}
            </div>
            {pubSel && <div className="mt-4"><ResultCard /></div>}
            <div className="mt-4">
              <Button variant="secondary" onClick={() => setStep(2)}>
                {t(`${P}.step1None`)} <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h4 className="text-sm font-bold text-ink-800">{t(`${P}.step2Title`)}</h4>
            <p className="mt-0.5 text-xs text-ink-500">{t(`${P}.step2Desc`)}</p>
            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
              {RESIDENTIAL_EXEMPTIONS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setResSel(o.id)}
                  className={`flex items-start gap-3 rounded-xl border p-3 text-start transition ${resSel === o.id ? 'border-brand-500 bg-brand-50' : 'border-ink-200 hover:border-brand-300 hover:bg-ink-50'}`}
                >
                  <Home size={18} className="mt-0.5 shrink-0 text-brand-600" />
                  <span className="text-sm leading-relaxed text-ink-700">{t(`${P}.res_${o.id}`)}</span>
                </button>
              ))}
            </div>
            {resSel && <div className="mt-4"><ResultCard /></div>}
            <div className="mt-4 flex gap-2">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ChevronLeft size={16} /> {t('pgTax.common.back')}
              </Button>
              <Button variant="secondary" onClick={() => setStep(3)}>
                {t(`${P}.step2None`)} <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h4 className="text-sm font-bold text-ink-800">{t(`${P}.step3Title`)}</h4>
            <p className="mt-0.5 text-xs text-ink-500">{t(`${P}.step3Desc`)}</p>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-ink-200 p-4">
                <div className="text-sm font-bold text-ink-800">{t(`${P}.tempNewQ`)}</div>
                <div className="mt-2 flex items-center gap-3">
                  <Toggle checked={isNew} onChange={(v) => setIsNew(v)} label={t(`${P}.yes`)} />
                </div>
                {isNew && (
                  <div className="mt-3">
                    <Field label={t(`${P}.buildDateField`)}>
                      <Input type="date" dir="ltr" value={buildDate} onChange={(e) => setBuildDate(e.target.value)} />
                    </Field>
                    {buildDate && isNewBuildingExempt(buildDate) && (
                      <div className="mt-2 flex items-start gap-2 rounded-lg bg-emerald-50 p-2 text-xs font-bold text-emerald-700">
                        <CheckCircle2 size={15} className="mt-0.5 shrink-0" /> {t(`${P}.tempNewExempt`)}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-ink-200 p-4">
                <div className="text-sm font-bold text-ink-800">{t(`${P}.tempVacantQ`)}</div>
                <div className="mt-2 flex items-center gap-3">
                  <Toggle checked={isEmpty} onChange={(v) => setIsEmpty(v)} label={t(`${P}.yes`)} />
                </div>
                {isEmpty && (
                  <div className="mt-3">
                    <Field label={t(`${P}.emptyMonthsField`)} hint={t(`${P}.tempVacantHint`)}>
                      <Input type="number" min={0} value={emptyMonths || ''} onChange={(e) => setEmptyMonths(Math.max(0, Number(e.target.value)))} />
                    </Field>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="ghost" onClick={() => setStep(2)}>
                <ChevronLeft size={16} /> {t('pgTax.common.back')}
              </Button>
              <Button onClick={() => setStep(4)}>
                {t(`${P}.nextBtn`)} <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h4 className="text-sm font-bold text-ink-800">{t(`${P}.step4Title`)}</h4>
            <p className="mt-0.5 text-xs text-ink-500">{t(`${P}.step4Desc`)}</p>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label={t(`${P}.fieldName`)} required>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t(`${P}.defaultRecordName`)} />
              </Field>
              <Field label={t(`${P}.fieldLocation`)}>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} />
              </Field>
              <Field label={t(`${P}.annualRentField`)} required>
                <MoneyInput value={annualRent} onChange={setAnnualRent} />
              </Field>
            </div>

            <div className="mt-4 rounded-xl border border-ink-200 p-4">
              <div className="text-sm font-bold text-ink-800">{t(`${P}.penaltyTitle`)}</div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Toggle checked={delayYears > 0} onChange={(v) => setDelayYears(v ? 1 : 0)} label={t(`${P}.penaltyDelayYears`)} />
                  {delayYears > 0 && (
                    <div className="pr-12">
                      <Input type="number" min={0} value={delayYears || ''} onChange={(e) => setDelayYears(Math.max(0, Number(e.target.value)))} className="mt-1" placeholder={t(`${P}.delayYearsField`)} />
                    </div>
                  )}
                  <p className="pr-12 text-[11px] text-ink-400">{t(`${P}.delayYearsHint`)}</p>
                </div>
                <Toggle checked={falseInfo} onChange={setFalseInfo} label={t(`${P}.penaltyFalseInfo`)} />
                <Toggle checked={fakeEmpty} onChange={setFakeEmpty} label={t(`${P}.penaltyFakeEmpty`)} />
                <div className="space-y-1">
                  <Toggle checked={useChange} onChange={setUseChange} label={t(`${P}.penaltyUseChange`)} />
                  {useChange && (
                    <div className="pr-12">
                      <Toggle checked={useChangeRepeat} onChange={setUseChangeRepeat} label={t(`${P}.useChangeRepeatField`)} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="ghost" onClick={() => setStep(3)}>
                <ChevronLeft size={16} /> {t('pgTax.common.back')}
              </Button>
              <Button onClick={handleCompute}>
                <Calculator size={16} /> {t(`${P}.computeBtn`)}
              </Button>
              <Button variant="ghost" onClick={reset}>
                <RotateCcw size={15} /> {t(`${P}.resetBtn`)}
              </Button>
            </div>

            {assess && assess.exempt && (
              <div className="mt-4">
                <ResultCard />
              </div>
            )}

            {assess && !assess.exempt && (
              <div className="mt-4 rounded-xl border border-ink-200 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-800">
                  <Calculator size={15} className="text-brand-600" /> {t(`${P}.resultTitle`)}
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div>
                    <div className="mb-2 text-xs font-bold text-ink-500">{t(`${P}.resultSummaryTitle`)}</div>
                    <div className="space-y-2">
                      <SummaryRow label={t(`${P}.rowRent`)} value={money(assess.rent)} />
                      <SummaryRow label={t(`${P}.rowMaintenance`)} value={money(assess.maintenance)} note={t(`${P}.rowMaintenanceNote`)} />
                      {assess.emptyDeduction > 0 && <SummaryRow label={t(`${P}.rowEmptyDeduction`, { months: emptyMonths })} value={money(assess.emptyDeduction)} note={t(`${P}.rowEmptyDeductionNote`)} />}
                      <SummaryRow label={t(`${P}.rowTaxable`)} value={money(assess.taxable)} />
                      <SummaryRow label={t(`${P}.rowBaseTax`)} value={money(assess.baseTax)} note={t(`${P}.rowBaseTaxNote`)} />
                      {assess.penalties.map((p) => (
                        <SummaryRow key={p.labelKey} label={t(`${P}.${p.labelKey}`)} value={money(p.amount)} note={t(`${P}.${p.lawKey}`)} />
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between rounded-xl bg-gradient-to-l from-brand-700 to-brand-500 px-4 py-3 text-white">
                      <span className="text-sm font-bold">{t(`${P}.finalTaxLabel`)}</span>
                      <span className="text-xl font-black">{money(assess.finalTax)}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button onClick={handleSave}>
                        <Save size={15} /> {t(`${P}.saveRecordBtn`)}
                      </Button>
                      <Button variant="secondary" onClick={handlePrint}>
                        <Printer size={15} /> {t(`${P}.printBtn`)}
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-xl bg-ink-50/60 p-4">
                    <div className="mb-2 text-xs font-bold text-ink-500">{t(`${P}.resultHowTitle`)}</div>
                    <ol className="space-y-2">
                      {assess.steps.map((s, i) => (
                        <li key={s.key + i} className="flex items-start gap-2 text-sm">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-black text-brand-700">{i + 1}</span>
                          <span className="text-ink-700">
                            {t(`${P}.${s.key}`, s.months !== undefined ? { months: s.months } : undefined)} <strong>{money(s.value)}</strong>
                            {s.lawKey && <span className="mt-0.5 block text-[11px] text-ink-400">{t(`${P}.${s.lawKey}`)}</span>}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-ink-400">{t(`${P}.wizardDisclaimer`)}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

function SummaryRow({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-600">{label}</span>
        <strong className="text-sm font-bold text-ink-800">{value}</strong>
      </div>
      {note && <p className="mt-0.5 pr-4 text-[11px] leading-snug text-ink-400">{note}</p>}
    </div>
  )
}
