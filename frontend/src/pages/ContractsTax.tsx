import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, FileSpreadsheet, FileText, Calculator } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { PageHead, Card, CardHeader, CardBody, Button, Badge, IconBtn, Modal, Field, Input, Select, MoneyInput, Textarea, DataTable, Toggle, useToast, ConfirmDialog, type Column } from '../components/ui'
import { useI18n } from '../i18n'
import type { ContractRecord } from '../lib/types'
import { fmt, fmtDate, money, todayIso, uid } from '../lib/format'
import { WITHHOLDING_RULES_2026, calcWithholding2026, calcDelayPenalty2026, applyMultiIncomeReduction2026, type WithholdingKey } from '../lib/tax'
import { exportExcel, exportPdf } from '../lib/export'
import {
  CONTRACT_CATEGORIES,
  CONTRACT_RULES,
  CONTRACT_TAX_RATE,
  CONTRACT_LAWYER_MIN_PROFIT,
  CONTRACT_CUSTOMS_FIXED_PROFIT,
  calcContract2026,
  contractRuleById,
  defaultContractInputs,
  rulesForCategory,
  type ContractCategoryId,
  type ContractCalcInputs,
  type ContractRule,
  type ContractCalcResult,
} from '../lib/contractRules2026'

const mainFigure = (rl: ContractRule, inp: ContractCalcInputs): number =>
  rl.special === 'costPlus'
    ? inp.cost
    : rl.special === 'exchange'
      ? inp.usd
      : rl.special === 'transferSupported'
        ? inp.revenue
        : rl.special === 'tourism' || rl.special === 'hajj'
          ? inp.persons
          : inp.value

function InputsFields({
  rule,
  inputs,
  onChange,
}: {
  rule: ContractRule
  inputs: ContractCalcInputs
  onChange: (i: ContractCalcInputs) => void
}) {
  const { t } = useI18n()
  const num =
    (key: keyof ContractCalcInputs) => (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ ...inputs, [key]: Math.max(0, Number(e.target.value)) })
  const moneyF = (key: keyof ContractCalcInputs) => (v: number) =>
    onChange({ ...inputs, [key]: Math.max(0, v || 0) })

  switch (rule.special) {
    case 'costPlus':
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('pgTax.contracts.fieldContractCost')} hint={t('pgTax.contracts.fieldContractCostHint')}>
            <MoneyInput value={inputs.cost} onChange={moneyF('cost')} />
          </Field>
          <Field label={t('pgTax.contracts.fieldAgreedPct')}>
            <Input type="number" dir="ltr" step={0.1} min={0} value={inputs.agreedPct || ''} onChange={num('agreedPct')} />
          </Field>
        </div>
      )
    case 'exchange':
      return (
        <Field label={t('pgTax.contracts.fieldUsd')} hint={t('pgTax.contracts.fieldUsdHint')}>
          <MoneyInput value={inputs.usd} onChange={moneyF('usd')} />
        </Field>
      )
    case 'transferSupported':
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('pgTax.contracts.fieldRevenue')}>
            <MoneyInput value={inputs.revenue} onChange={moneyF('revenue')} />
          </Field>
          <Field label={t('pgTax.contracts.fieldBankFee')}>
            <MoneyInput value={inputs.bankFee} onChange={moneyF('bankFee')} />
          </Field>
        </div>
      )
    case 'tourism':
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('pgTax.contracts.fieldTourists')} hint={t('pgTax.contracts.fieldTouristsHint')}>
            <Input type="number" dir="ltr" min={0} value={inputs.persons || ''} onChange={num('persons')} />
          </Field>
          <Field label={t('pgTax.contracts.fieldFxRate')}>
            <Input type="number" dir="ltr" step={0.1} min={0} value={inputs.fxRate || ''} onChange={num('fxRate')} />
          </Field>
        </div>
      )
    case 'hajj':
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label={t('pgTax.contracts.fieldPilgrims')}>
            <Input type="number" dir="ltr" min={0} value={inputs.persons || ''} onChange={num('persons')} />
          </Field>
          <Field label={t('pgTax.contracts.fieldChildren')} hint={t('pgTax.contracts.fieldChildrenHint')}>
            <Input type="number" dir="ltr" min={0} value={inputs.children || ''} onChange={num('children')} />
          </Field>
          <Field label={t('pgTax.contracts.fieldFxRate')}>
            <Input type="number" dir="ltr" step={0.1} min={0} value={inputs.fxRate || ''} onChange={num('fxRate')} />
          </Field>
        </div>
      )
    case 'importRates':
      return (
        <div className="space-y-4">
          <Field label={t('pgTax.contracts.fieldContractValue')}>
            <MoneyInput value={inputs.value} onChange={moneyF('value')} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('pgTax.contracts.fieldImportPct')}>
              <Input type="number" dir="ltr" step={0.1} min={0} value={inputs.importPct || ''} onChange={num('importPct')} />
            </Field>
            <Field label={t('pgTax.contracts.fieldSupplyPct')} hint={t('pgTax.contracts.fieldSupplyPctHint')}>
              <Input type="number" dir="ltr" step={0.1} min={0} value={inputs.supplyPct || ''} onChange={num('supplyPct')} />
            </Field>
          </div>
        </div>
      )
    case 'lawyer':
      return (
        <div className="space-y-4">
          <Field label={t('pgTax.contracts.fieldTotalRevenue')}>
            <MoneyInput value={inputs.value} onChange={moneyF('value')} />
          </Field>
          <Field label={t('pgTax.contracts.fieldAlternative')} hint={t('pgTax.contracts.fieldAlternativeHint', { min: fmt(CONTRACT_LAWYER_MIN_PROFIT) })}>
            <MoneyInput value={inputs.alternative} onChange={moneyF('alternative')} />
          </Field>
        </div>
      )
    case 'customs':
      return (
        <div className="space-y-4">
          <div className="rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm">
            {t('pgTax.contracts.customsFixedLabel')} <strong>{money(CONTRACT_CUSTOMS_FIXED_PROFIT)}</strong> — {t('pgTax.contracts.takeHigherNote')}
          </div>
          <Field label={t('pgTax.contracts.fieldAlternative')}>
            <MoneyInput value={inputs.alternative} onChange={moneyF('alternative')} />
          </Field>
        </div>
      )
    default:
      return (
        <div className="space-y-4">
          <Field label={rule.valueLabel()} hint={rule.commission ? t('pgTax.contracts.fieldCommissionHint') : undefined}>
            <MoneyInput value={inputs.value} onChange={moneyF('value')} />
          </Field>
          {rule.higherOf && (
            <Field label={t('pgTax.contracts.fieldAlternativeFinancial')} hint={t('pgTax.contracts.fieldAlternativeFinancialHint')}>
              <MoneyInput value={inputs.alternative} onChange={moneyF('alternative')} />
            </Field>
          )}
        </div>
      )
  }
}

export default function ContractsTax() {
  const { data, currentCompany, add, update, remove } = useApp()
  const { t } = useI18n()
  const { push } = useToast()
  const cid = data.activeCompanyId
  const cfg = data.config

  const [cat, setCat] = useState<ContractCategoryId>('undertakings')
  const [ruleId, setRuleId] = useState<string>(CONTRACT_RULES[0].id)
  const rule = contractRuleById(ruleId) ?? CONTRACT_RULES[0]
  const [inputs, setInputs] = useState<ContractCalcInputs>(defaultContractInputs())
  const [result, setResult] = useState<ContractCalcResult | null>(null)
  const [party, setParty] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ContractRecord | null>(null)
  const [recordCat, setRecordCat] = useState<ContractCategoryId>('undertakings')
  const [recordTypeId, setRecordTypeId] = useState<string>(CONTRACT_RULES[0].id)
  const recordRule = contractRuleById(recordTypeId) ?? CONTRACT_RULES[0]
  const [recordInputs, setRecordInputs] = useState<ContractCalcInputs>(defaultContractInputs())
  const [recordDate, setRecordDate] = useState(todayIso())
  const [recordParty, setRecordParty] = useState('')
  const [recordSubject, setRecordSubject] = useState('')
  const [recordPaid, setRecordPaid] = useState(0)
  const [recordNotes, setRecordNotes] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [withKey, setWithKey] = useState<WithholdingKey>('construction')
  const [withAmount, setWithAmount] = useState(0)
  const [daysLate, setDaysLate] = useState(0)
  const [multiIncome, setMultiIncome] = useState(false)
  const [isImportOrContract, setIsImportOrContract] = useState(false)

  const withholding = calcWithholding2026(withAmount, withKey)
  const delayPenalty = calcDelayPenalty2026(result?.tax ?? 0, daysLate)
  const reducedTax = applyMultiIncomeReduction2026(result?.tax ?? 0, multiIncome, isImportOrContract)

  const list = useMemo(
    () => data.contracts.filter((r) => r.companyId === cid).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [data.contracts, cid],
  )

  const total = list.reduce((s, r) => s + r.tax, 0)
  const paid = list.reduce((s, r) => s + r.paid, 0)

  const typeLabel = (id: string) =>
    contractRuleById(id)?.label() ?? cfg.contractTypes.find((x) => x.id === id)?.label ?? id

  const onCatChange = (c: ContractCategoryId) => {
    setCat(c)
    const first = rulesForCategory(c)[0]
    if (first) {
      setRuleId(first.id)
      setInputs(defaultContractInputs())
      setResult(null)
    }
  }

  const onRuleChange = (id: string) => {
    setRuleId(id)
    setInputs(defaultContractInputs())
    setResult(null)
  }

  const calculate = () => {
    const bad = (n: number, label: string) => {
      if (!(n > 0)) push('error', t('pgTax.contracts.errEnter', { label }))
      return !(n > 0)
    }
    let fail = false
    switch (rule.special) {
      case 'costPlus':
        fail = bad(inputs.cost, t('pgTax.contracts.errCost')) || bad(inputs.agreedPct, t('pgTax.contracts.errAgreedPct'))
        break
      case 'exchange':
        fail = bad(inputs.usd, t('pgTax.contracts.errUsd'))
        break
      case 'transferSupported':
        fail = bad(inputs.revenue, t('pgTax.contracts.errRevenue'))
        break
      case 'tourism':
        fail = bad(inputs.persons, t('pgTax.contracts.errTourists')) || bad(inputs.fxRate, t('pgTax.contracts.errFxRate'))
        break
      case 'hajj':
        fail = bad(inputs.persons, t('pgTax.contracts.errPilgrims')) || bad(inputs.fxRate, t('pgTax.contracts.errFxRate'))
        break
      case 'importRates':
        fail = bad(inputs.value, t('pgTax.contracts.errValue')) || bad(inputs.importPct, t('pgTax.contracts.errImportPct')) || bad(inputs.supplyPct, t('pgTax.contracts.errSupplyPct'))
        break
      case 'customs':
        break
      default:
        fail = bad(inputs.value, rule.valueLabel())
    }
    if (fail) return
    setResult(calcContract2026(rule, inputs))
  }

  const saveFromCalculator = () => {
    if (!result) return
    add('contracts', {
      id: uid(),
      companyId: cid,
      date: todayIso(),
      party: party.trim(),
      subject: rule.label(),
      typeId: rule.id,
      amount: mainFigure(rule, inputs),
      rate: rule.rate !== null ? rule.rate / 100 : 0,
      tax: result.tax,
      paid: 0,
      notes: result.formula,
    })
    push('success', t('pgTax.contracts.contractSaved'))
    setParty('')
  }

  const exportResultPdf = () => {
    if (!rule || !result) return
    const headers = [t('pgTax.common.item'), t('pgTax.common.details')]
    const body: (string | number)[][] = [
      [t('pgTax.contracts.pdfRowActivity'), rule.label()],
      [t('pgTax.contracts.pdfRowCategory'), CONTRACT_CATEGORIES.find((c) => c.id === rule.categoryId)?.label() ?? ''],
      [t('pgTax.contracts.pdfRowRate'), result.rateLabel],
      [t('pgTax.contracts.pdfRowFormula'), result.formula],
      [t('pgTax.contracts.pdfRowNetProfit'), t('pgTax.contracts.pdfRowNetProfitVal', { amount: fmt(result.netProfit) })],
      [t('pgTax.contracts.pdfRowTaxRate'), t('pgTax.contracts.pdfRowTaxRateVal', { pct: fmt(CONTRACT_TAX_RATE * 100) })],
      [t('pgTax.contracts.pdfRowTax'), t('pgTax.contracts.pdfRowTaxVal', { amount: fmt(result.tax) })],
    ]
    exportPdf({
      title: t('pgTax.contracts.pdfTitle'),
      subtitle: t('pgTax.contracts.pdfSubtitle'),
      company: currentCompany,
      headers,
      rows: body,
      orientation: 'portrait',
      footers: [t('pgTax.contracts.disclaimer')],
    })
  }

  const openNewRecord = () => {
    setEditing(null)
    setRecordCat('undertakings')
    setRecordTypeId(CONTRACT_RULES[0].id)
    setRecordInputs(defaultContractInputs())
    setRecordDate(todayIso())
    setRecordParty('')
    setRecordSubject('')
    setRecordPaid(0)
    setRecordNotes('')
    setModalOpen(true)
  }

  const openEditRecord = (r: ContractRecord) => {
    const rl = contractRuleById(r.typeId)
    setEditing(r)
    setRecordCat(rl?.categoryId ?? 'undertakings')
    setRecordTypeId(r.typeId)
    setRecordInputs({ ...defaultContractInputs(), value: r.amount })
    setRecordDate(r.date)
    setRecordParty(r.party)
    setRecordSubject(r.subject)
    setRecordPaid(r.paid)
    setRecordNotes(r.notes)
    setModalOpen(true)
  }

  const saveRecord = () => {
    if (!recordParty.trim()) {
      push('error', t('pgTax.contracts.partyRequired'))
      return
    }
    const res = calcContract2026(recordRule, recordInputs)
    const payload = {
      date: recordDate,
      party: recordParty.trim(),
      subject: recordSubject.trim(),
      typeId: recordRule.id,
      amount: mainFigure(recordRule, recordInputs),
      rate: recordRule.rate !== null ? recordRule.rate / 100 : 0,
      tax: res.tax,
      paid: recordPaid,
      notes: res.formula || recordNotes,
    }
    if (editing) {
      update('contracts', editing.id, payload)
      push('success', t('pgTax.contracts.contractUpdated'))
    } else {
      add('contracts', { id: uid(), companyId: cid, ...payload })
      push('success', t('pgTax.contracts.contractAdded'))
    }
    setModalOpen(false)
  }

  const columns: Column<ContractRecord>[] = [
    { key: 'date', title: t('pgTax.contracts.colDate'), render: (r) => <span className="text-xs">{fmtDate(r.date)}</span> },
    {
      key: 'party',
      title: t('pgTax.contracts.colParty'),
      render: (r) => (
        <div>
          <div className="font-semibold text-ink-800">{r.party || '—'}</div>
          <div className="text-xs text-ink-400">{r.subject}</div>
        </div>
      ),
    },
    {
      key: 'type',
      title: t('pgTax.contracts.colType'),
      render: (r) => (
        <div>
          <Badge tone="purple">{typeLabel(r.typeId)}</Badge>
          {contractRuleById(r.typeId)?.num ? <span className="mr-1 text-[10px] text-ink-400">#{contractRuleById(r.typeId)?.num}</span> : null}
        </div>
      ),
    },
    { key: 'amount', title: t('pgTax.contracts.colAmount'), total: (rs) => rs.reduce((s, r) => s + r.amount, 0), render: (r) => <span className="text-xs">{money(r.amount)}</span> },
    {
      key: 'rate',
      title: t('pgTax.contracts.colRate'),
      render: (r) => {
        const rl = contractRuleById(r.typeId)
        return <span className="text-xs">{rl?.special ? t('pgTax.contracts.formulaCell') : fmt(r.rate * 100) + '%'}</span>
      },
    },
    { key: 'tax', title: t('pgTax.contracts.colTax'), total: (rs) => rs.reduce((s, r) => s + r.tax, 0), render: (r) => <span className="text-xs font-bold text-brand-700">{money(r.tax)}</span> },
    { key: 'paid', title: t('pgTax.contracts.colPaid'), total: (rs) => rs.reduce((s, r) => s + r.paid, 0), render: (r) => <span className="text-xs">{money(r.paid)}</span> },
    {
      key: 'balance',
      title: t('pgTax.contracts.colBalance'),
      render: (r) => {
        const b = r.tax - r.paid
        return b <= 0 ? <Badge tone="green">{t('pgTax.contracts.settled')}</Badge> : <Badge tone="red">{money(b)}</Badge>
      },
    },
    {
      key: 'actions',
      title: '',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <IconBtn title={t('pgTax.contracts.edit')} onClick={() => openEditRecord(r)}>
            <Pencil size={16} />
          </IconBtn>
          <IconBtn title={t('pgTax.contracts.delete')} tone="danger" onClick={() => setConfirmId(r.id)}>
            <Trash2 size={16} />
          </IconBtn>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHead
        title={t('pgTax.contracts.title')}
        desc={t('pgTax.contracts.desc')}
        actions={
          <Button onClick={openNewRecord}>
            <Plus size={16} /> {t('pgTax.contracts.newContract')}
          </Button>
        }
      />

      <Card>
        <CardHeader
          title={t('pgTax.contracts.calcTitle')}
          subtitle={t('pgTax.contracts.calcSubtitle')}
        />
        <CardBody>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t('pgTax.contracts.fieldCategory')}>
                <Select value={cat} onChange={(e) => onCatChange(e.target.value as ContractCategoryId)}>
                  {CONTRACT_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label()}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t('pgTax.contracts.fieldActivity')} required>
                <Select value={ruleId} onChange={(e) => onRuleChange(e.target.value)}>
                  {rulesForCategory(cat).map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.num} — {x.label()}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-ink-200 bg-ink-50 p-3 text-sm">
              <span className="font-bold text-ink-700">{t('pgTax.contracts.profitRateLabel')}</span>
              <Badge tone="brand">{rule.special ? (rule.special === 'costPlus' ? t('pgTax.contracts.specialCostPlus') : rule.special === 'exchange' ? t('pgTax.contracts.specialExchange') : rule.special === 'transferSupported' ? t('pgTax.contracts.specialTransfer') : rule.special === 'tourism' ? t('pgTax.contracts.specialTourism') : rule.special === 'hajj' ? t('pgTax.contracts.specialHajj') : rule.special === 'lawyer' ? t('pgTax.contracts.specialLawyer') : rule.special === 'customs' ? t('pgTax.contracts.specialCustoms') : t('pgTax.contracts.specialImportRates')) : rule.rate !== null ? `${rule.rate}%` : t('pgTax.contracts.dash')}</Badge>
              {rule.note() && <span className="text-xs text-ink-500">{rule.note()}</span>}
            </div>

            {rule.survey && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                {t('pgTax.contracts.surveyNote')}
              </div>
            )}

            <InputsFields rule={rule} inputs={inputs} onChange={setInputs} />

            <div className="flex items-center gap-3">
              <Button onClick={calculate}>
                <Calculator size={16} /> {t('pgTax.contracts.calculateBtn')}
              </Button>
            </div>

            {result && (
              <div className="mt-4 rounded-xl border border-brand-200 bg-gradient-to-b from-brand-50 to-white p-5">
                <div className="mb-3 text-sm font-bold text-brand-700">{t('pgTax.contracts.resultTitle', { label: rule.label() })}</div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-ink-200 bg-white p-3">
                    <div className="text-xs text-ink-500">
                      {rule.special === 'exchange'
                        ? t('pgTax.contracts.figExchange')
                        : rule.special === 'tourism' || rule.special === 'hajj'
                          ? t('pgTax.contracts.figPersons')
                          : rule.special === 'costPlus'
                            ? t('pgTax.contracts.figCost')
                            : rule.special === 'transferSupported'
                              ? t('pgTax.contracts.figRevenue')
                              : rule.special === 'customs'
                                ? t('pgTax.contracts.figAlternative')
                                : rule.valueLabel()}
                    </div>
                    <div className="mt-1 text-base font-bold">{money(mainFigure(rule, inputs))}</div>
                  </div>
                  <div className="rounded-lg border border-ink-200 bg-white p-3">
                    <div className="text-xs text-ink-500">{t('pgTax.contracts.profitRateLabel')}</div>
                    <div className="mt-1 text-base font-bold">{result.rateLabel}</div>
                  </div>
                  <div className="rounded-lg border border-ink-200 bg-white p-3">
                    <div className="text-xs text-ink-500">{t('pgTax.contracts.figNetProfit')}</div>
                    <div className="mt-1 text-base font-bold text-ink-800">{money(result.netProfit)}</div>
                  </div>
                  <div className="rounded-lg border border-brand-600 bg-brand-600 p-3 text-white">
                    <div className="text-xs text-emerald-100">{t('pgTax.contracts.figTaxAmount', { pct: fmt(CONTRACT_TAX_RATE * 100) })}</div>
                    <div className="mt-1 text-xl font-black">{money(result.tax)}</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-ink-500">
                  <span className="font-bold">{t('pgTax.contracts.formulaLabel')}</span> {result.formula}
                </div>
                {result.needsApproval && (
                  <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                    {t('pgTax.contracts.needsApproval')}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Field label={t('pgTax.contracts.partyLabel')}>
                    <div className="min-w-[260px]">
                      <Input value={party} onChange={(e) => setParty(e.target.value)} placeholder={t('pgTax.contracts.partyPlaceholder')} />
                    </div>
                  </Field>
                  <div className="flex items-end gap-2">
                    <Button onClick={saveFromCalculator}>
                      <FileSpreadsheet size={15} /> {t('pgTax.contracts.saveToRegister')}
                    </Button>
                    <Button variant="secondary" onClick={exportResultPdf}>
                      <FileText size={15} /> {t('pgTax.common.pdf')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardHeader
          title={t('pgTax.contracts.withTitle')}
          subtitle={t('pgTax.contracts.withSubtitle')}
        />
        <CardBody>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label={t('pgTax.contracts.withActivity')}>
              <Select value={withKey} onChange={(e) => setWithKey(e.target.value as WithholdingKey)}>
                {(Object.keys(WITHHOLDING_RULES_2026) as WithholdingKey[]).map((k) => (
                  <option key={k} value={k}>
                    {t('pgTax.contracts.with_' + k)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('pgTax.contracts.withAmount')}>
              <MoneyInput value={withAmount} onChange={setWithAmount} />
            </Field>
            <Field label={t('pgTax.contracts.withDaysLate')}>
              <Input type="number" dir="ltr" min={0} value={daysLate || ''} onChange={(e) => setDaysLate(Math.max(0, Number(e.target.value)))} />
            </Field>
            <div className="flex flex-col justify-end gap-2">
              <Toggle checked={multiIncome} onChange={setMultiIncome} label={t('pgTax.contracts.withMultiIncome')} />
              <Toggle checked={isImportOrContract} onChange={setIsImportOrContract} label={t('pgTax.contracts.withImportContract')} />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-ink-200 bg-ink-50 p-3">
              <div className="text-xs text-ink-500">{t('pgTax.contracts.withRate')}</div>
              <div className="mt-1 text-base font-bold text-ink-800">{fmt(withholding.rate * 100)}%</div>
            </div>
            <div className="rounded-lg border border-ink-200 bg-ink-50 p-3">
              <div className="text-xs text-ink-500">{t('pgTax.contracts.withAmountResult')}</div>
              <div className="mt-1 text-base font-bold text-brand-700">{money(withholding.amount)}</div>
            </div>
            <div className="rounded-lg border border-ink-200 bg-ink-50 p-3">
              <div className="text-xs text-ink-500">{t('pgTax.contracts.withDelayPenalty')}</div>
              <div className="mt-1 text-base font-bold text-red-600">{money(delayPenalty)}</div>
            </div>
            <div className="rounded-lg border border-brand-200 bg-brand-50 p-3">
              <div className="text-xs text-ink-500">{t('pgTax.contracts.withReduced')}</div>
              <div className="mt-1 text-base font-bold text-brand-700">{money(reducedTax)}</div>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="mt-4 mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs text-ink-500">{t('pgTax.contracts.statContracts')}</div>
          <div className="mt-1 text-xl font-bold text-ink-800">{fmt(list.length)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-ink-500">{t('pgTax.contracts.statContractValue')}</div>
          <div className="mt-1 text-xl font-bold text-ink-800">{money(list.reduce((s, r) => s + r.amount, 0))}</div>
        </Card>
        <Card className="p-4 bg-brand-600 text-white">
          <div className="text-xs text-emerald-100">{t('pgTax.contracts.statTaxDue')}</div>
          <div className="mt-1 text-xl font-bold">{money(total)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-ink-500">{t('pgTax.contracts.statBalance')}</div>
          <div className="mt-1 text-xl font-bold text-red-600">{money(total - paid)}</div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title={t('pgTax.contracts.regTitle')}
          subtitle={t('pgTax.contracts.regSubtitle')}
          action={
            <>
              <Button variant="secondary" size="sm" onClick={() => {
                const headers = [t('pgTax.contracts.colDate'), t('pgTax.contracts.colParty'), t('pgTax.contracts.fieldSubject'), t('pgTax.contracts.colType'), t('pgTax.contracts.colAmount'), t('pgTax.contracts.colRate'), t('pgTax.contracts.colTax'), t('pgTax.contracts.colPaid')]
                const body = list.map((r) => [r.date, r.party, r.subject, typeLabel(r.typeId), r.amount, contractRuleById(r.typeId)?.special ? t('pgTax.contracts.formulaCell') : fmt(r.rate * 100) + '%', r.tax, r.paid])
                body.push(['', t('pgTax.common.total'), '', '', list.reduce((s, r) => s + r.amount, 0), '', total, paid])
                exportExcel(`${t('pgTax.contracts.title').replace(/ /g, '-')}.xlsx`, t('pgTax.contracts.regTitle'), headers, body)
                push('success', t('pgTax.contracts.exportExcel'))
              }}>
                <FileSpreadsheet size={15} /> {t('pgTax.common.excel')}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => {
                const headers = [t('pgTax.contracts.colDate'), t('pgTax.contracts.colParty'), t('pgTax.contracts.fieldSubject'), t('pgTax.contracts.colType'), t('pgTax.contracts.colAmount'), t('pgTax.contracts.colRate'), t('pgTax.contracts.colTax'), t('pgTax.contracts.colPaid')]
                const body = list.map((r) => [fmtDate(r.date), r.party, r.subject, typeLabel(r.typeId), fmt(r.amount), contractRuleById(r.typeId)?.special ? t('pgTax.contracts.formulaCell') : fmt(r.rate * 100) + '%', fmt(r.tax), fmt(r.paid)])
                body.push(['', t('pgTax.common.total'), '', '', fmt(list.reduce((s, r) => s + r.amount, 0)), '', fmt(total), fmt(paid)])
                exportPdf({ title: t('pgTax.contracts.regPdfTitle'), subtitle: t('pgTax.contracts.regPdfSubtitle'), company: currentCompany, headers, rows: body })
              }}>
                <FileText size={15} /> {t('pgTax.common.pdf')}
              </Button>
            </>
          }
        />
        <CardBody className="p-0">
          <DataTable columns={columns} rows={list} dense empty={t('pgTax.contracts.regEmpty')} />
        </CardBody>
      </Card>

      <div className="mt-4 rounded-lg border border-ink-200 bg-ink-50 p-3 text-center text-xs text-ink-500">
        {t('pgTax.contracts.disclaimer')}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t('pgTax.contracts.modalEditTitle') : t('pgTax.contracts.modalAddTitle')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              {t('pgTax.common.cancel')}
            </Button>
            <Button onClick={saveRecord}>{editing ? t('pgTax.common.saveChanges') : t('pgTax.common.add')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('pgTax.contracts.fieldDate')}>
              <Input type="date" value={recordDate} onChange={(e) => setRecordDate(e.target.value)} />
            </Field>
            <Field label={t('pgTax.contracts.fieldCategory')}>
              <Select
                value={recordCat}
                onChange={(e) => {
                  const c = e.target.value as ContractCategoryId
                  setRecordCat(c)
                  const first = rulesForCategory(c)[0]
                  if (first) setRecordTypeId(first.id)
                }}
              >
                {CONTRACT_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label()}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label={t('pgTax.contracts.fieldActivity')} required>
            <Select value={recordTypeId} onChange={(e) => setRecordTypeId(e.target.value)}>
              {rulesForCategory(recordCat).map((x) => (
                <option key={x.id} value={x.id}>
                  {x.num} — {x.label()}
                </option>
              ))}
            </Select>
          </Field>
          {recordRule.note() && <div className="rounded-lg bg-ink-50 p-2 text-xs text-ink-500">{recordRule.note()}</div>}
          <InputsFields rule={recordRule} inputs={recordInputs} onChange={setRecordInputs} />
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('pgTax.contracts.fieldPartyReq')} required>
              <Input value={recordParty} onChange={(e) => setRecordParty(e.target.value)} placeholder={t('pgTax.contracts.partyPlaceholder')} />
            </Field>
            <Field label={t('pgTax.contracts.fieldSubject')}>
              <Input value={recordSubject} onChange={(e) => setRecordSubject(e.target.value)} placeholder={t('pgTax.contracts.subjectPlaceholder')} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('pgTax.contracts.fieldPaid')}>
              <MoneyInput value={recordPaid} onChange={(v) => setRecordPaid(v)} />
            </Field>
            <Field label={t('pgTax.contracts.fieldNotes')}>
              <Textarea value={recordNotes} onChange={(e) => setRecordNotes(e.target.value)} />
            </Field>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-brand-50 p-4">
            <span className="flex items-center gap-2 text-sm font-bold text-brand-800">
              <Calculator size={16} /> {t('pgTax.contracts.taxDue')}
            </span>
            <span className="text-2xl font-black text-brand-700">{money(calcContract2026(recordRule, recordInputs).tax)}</span>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={confirmId !== null} onClose={() => setConfirmId(null)} onConfirm={() => { if (confirmId) { remove('contracts', confirmId); setConfirmId(null); push('success', t('pgTax.contracts.deleted')) } }} title={t('pgTax.contracts.deleteTitle')} message={t('pgTax.contracts.deleteMessage')} />
    </div>
  )
}
