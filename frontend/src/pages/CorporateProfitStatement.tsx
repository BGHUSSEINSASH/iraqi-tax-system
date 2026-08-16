import { useState } from 'react'
import { Calculator, FileText, Printer, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { Card, CardHeader, CardBody, Button, Badge, Field, Select, MoneyInput, useToast } from '../components/ui'
import { useI18n } from '../i18n'
import { fmt, money, fmtDate, todayIso, uid } from '../lib/format'
import { CORP_PROFIT_RATES, calcCorporateProfitStatement, type CorpProfitCompanyType } from '../lib/tax'
import { printWindowHtml } from '../lib/export'

const K = 'pgTax.corporate.statement.'

export default function CorporateProfitStatement() {
  const { t, lang } = useI18n()
  const { currentCompany } = useApp()
  const { push } = useToast()

  const [companyType, setCompanyType] = useState<CorpProfitCompanyType>('ordinary')
  const [revenue, setRevenue] = useState(0)
  const [expenses, setExpenses] = useState(0)
  const [result, setResult] = useState<ReturnType<typeof calcCorporateProfitStatement> | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [errors, setErrors] = useState<{ revenue?: string; expenses?: string }>({})

  const rate = CORP_PROFIT_RATES[companyType]

  const validate = () => {
    const e: { revenue?: string; expenses?: string } = {}
    if (!revenue || revenue <= 0) e.revenue = t(K + 'errRevenue')
    if (!expenses || expenses <= 0) e.expenses = t(K + 'errExpenses')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onInputChange = (field: 'revenue' | 'expenses', v: number) => {
    const clean = Math.max(0, v || 0)
    if (field === 'revenue') setRevenue(clean)
    else setExpenses(clean)
    setErrors({ ...errors, [field]: undefined })
    // recalculate immediately on change
    const next = calcCorporateProfitStatement(companyType, field === 'revenue' ? clean : revenue, field === 'expenses' ? clean : expenses)
    setResult(next)
  }

  const onTypeChange = (val: CorpProfitCompanyType) => {
    setCompanyType(val)
    // recalculate immediately on change
    const next = calcCorporateProfitStatement(val, revenue, expenses)
    setResult(next)
  }

  const handleCalculate = () => {
    if (!validate()) return
    const next = calcCorporateProfitStatement(companyType, revenue, expenses)
    setResult(next)
    setShowDetails(true)
    push('success', t(K + 'calculate'))
  }

  const printReport = () => {
    if (!result) return
    const opNo = uid().slice(0, 8).toUpperCase()
    const rows: [string, string][] = [
      [t(K + 'reportNo'), opNo],
      [t(K + 'calcDate'), fmtDate(todayIso())],
      [t(K + 'companyName'), currentCompany?.name ?? t('app.noCompany')],
      [t(K + 'companyType'), companyType === 'ordinary' ? t(K + 'ordinary') : t(K + 'oilServices')],
      [t(K + 'revenue'), money(result.revenue)],
      [t(K + 'expenses'), money(result.expenses)],
      [t(K + 'netProfit'), result.isLoss ? `${t(K + 'loss')} ${money(Math.abs(result.netProfit))}` : money(result.netProfit)],
      [t(K + 'taxRate'), fmt(rate * 100) + '%'],
      [t(K + 'taxDue'), money(result.tax)],
    ]
    const body = rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')
    const formulaBlock = result.isLoss
      ? ''
      : `<p>${t(K + 'formulaTax')}</p><p class="eq">${fmt(result.netProfit)} × ${fmt(rate * 100)}% = ${fmt(result.tax)} د.ع</p>`
    const html = `
      <div class="head">
        <div class="brand">${t(K + 'title')}</div>
        <div class="sub">${currentCompany?.name ?? t('app.noCompany')}</div>
      </div>
      <table>${body}</table>
      <div class="formula">
        <p>${t(K + 'formulaNet')}</p>
        <p class="eq">${fmt(result.revenue)} − ${fmt(result.expenses)} = ${fmt(result.netProfit)} د.ع</p>
        ${formulaBlock}
      </div>
      <div class="note">${t(K + 'legalNote')}</div>`
    printWindowHtml(
      t(K + 'title'),
      html,
      `body{font-family:'Tajawal','Segoe UI',sans-serif;direction:${lang === 'ar' || lang === 'fa' || lang === 'ku' ? 'rtl' : 'ltr'};padding:24px;color:#0f172a;}
      .head{text-align:center;margin-bottom:18px;}
      .brand{font-size:22px;font-weight:900;color:#065f46;}
      .sub{font-size:14px;font-weight:700;color:#334155;margin-top:2px;}
      table{width:100%;border-collapse:collapse;font-size:13px;}
      th{background:#ecfdf5;color:#065f46;padding:8px 10px;border:1px solid #a7f3d0;text-align:right;width:45%;}
      td{padding:8px 10px;border:1px solid #e2e8f0;font-weight:700;}
      .formula{margin-top:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;font-size:13px;line-height:1.8;}
      .formula .eq{font-family:monospace;color:#065f46;font-weight:700;}
      .note{margin-top:14px;font-size:11px;color:#64748b;line-height:1.7;}`,
    )
  }

  return (
    <div>
      <Card>
        <CardHeader title={t(K + 'companyData')} subtitle={t(K + 'desc')} />
        <CardBody>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t(K + 'companyType')} required>
                <Select value={companyType} onChange={(e) => onTypeChange(e.target.value as CorpProfitCompanyType)}>
                  <option value="ordinary">{t(K + 'ordinary')}</option>
                  <option value="oil_services">{t(K + 'oilServices')}</option>
                </Select>
              </Field>
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-ink-200 bg-ink-50 p-3 text-sm">
              <span className="font-bold text-ink-700">{t(K + 'taxRate')}</span>
              <Badge tone="brand">{companyType === 'ordinary' ? t(K + 'ordinary') : t(K + 'oilServices')} — {fmt(rate * 100)}%</Badge>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t(K + 'revenue')} required error={errors.revenue}>
                <MoneyInput value={revenue} onChange={(v) => onInputChange('revenue', v)} />
              </Field>
              <Field label={t(K + 'expenses')} required error={errors.expenses}>
                <MoneyInput value={expenses} onChange={(v) => onInputChange('expenses', v)} />
              </Field>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleCalculate}>
                <Calculator size={16} /> {t(K + 'calculate')}
              </Button>
            </div>

            {result && (
              <div className="mt-4 rounded-xl border border-brand-200 bg-gradient-to-b from-brand-50 to-white p-5">
                <div className="mb-3 text-sm font-bold text-brand-700">{t(K + 'summaryTitle')}</div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-ink-200 bg-white p-3">
                    <div className="text-xs text-ink-500">{t(K + 'revenue')}</div>
                    <div className="mt-1 text-base font-bold">{money(result.revenue)}</div>
                  </div>
                  <div className="rounded-lg border border-ink-200 bg-white p-3">
                    <div className="text-xs text-ink-500">{t(K + 'expenses')}</div>
                    <div className="mt-1 text-base font-bold">{money(result.expenses)}</div>
                  </div>
                  <div className="rounded-lg border border-ink-200 bg-white p-3">
                    <div className="text-xs text-ink-500">{t(K + 'netProfit')}</div>
                    {result.isLoss ? (
                      <div className="mt-1 text-base font-bold text-red-600">{t(K + 'loss')} {money(Math.abs(result.netProfit))}</div>
                    ) : (
                      <div className="mt-1 text-base font-bold text-ink-800">{money(result.netProfit)}</div>
                    )}
                  </div>
                  <div className="rounded-lg border border-ink-200 bg-white p-3">
                    <div className="text-xs text-ink-500">{t(K + 'taxRate')}</div>
                    <div className="mt-1 text-base font-bold text-ink-800">{fmt(rate * 100)}%</div>
                  </div>
                </div>

                <div className="mt-3 rounded-xl bg-brand-600 p-5 text-white">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-bold">
                      <Calculator size={18} /> {t(K + 'taxDue')}
                    </span>
                    <span className="text-3xl font-black">{money(result.tax)}</span>
                  </div>
                  {result.isLoss && (
                    <div className="mt-2 flex items-center gap-2 border-t border-emerald-300/30 pt-2 text-xs text-emerald-100">
                      <AlertTriangle size={14} /> {t(K + 'noProfit')}
                    </div>
                  )}
                </div>

                <div className="mt-3 text-xs text-ink-500">
                  <span className="font-bold">{t(K + 'formulaNet')}</span>{' '}
                  <span className="font-mono font-bold text-brand-700">{fmt(result.revenue)} − {fmt(result.expenses)} = {fmt(result.netProfit)} د.ع</span>
                </div>
                {!result.isLoss && (
                  <div className="mt-2 text-xs text-ink-500">
                    <span className="font-bold">{t(K + 'formulaTax')}</span>{' '}
                    <span className="font-mono font-bold text-brand-700">{fmt(result.netProfit)} × {fmt(rate * 100)}% = {fmt(result.tax)} د.ع</span>
                  </div>
                )}

                {result.isLoss && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertTriangle size={15} /> {t(K + 'noProfit')}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button variant="secondary" size="sm" onClick={() => setShowDetails((s) => !s)}>
                    {showDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    {showDetails ? t(K + 'hideDetails') : t(K + 'showDetails')}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={printReport}>
                    <Printer size={15} /> {t(K + 'print')}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={printReport}>
                    <FileText size={15} /> {t(K + 'pdf')}
                  </Button>
                </div>

                {showDetails && (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-lg border border-ink-100 bg-ink-50/60 p-3">
                      <div className="flex items-center gap-1.5 font-semibold text-ink-700">
                        <CheckCircle2 size={15} className="text-brand-600" /> {t(K + 'formulaNet')}
                      </div>
                      <p className="mt-1 font-mono text-xs font-bold text-brand-700">
                        {fmt(result.revenue)} − {fmt(result.expenses)} = {fmt(result.netProfit)} د.ع
                      </p>
                    </div>
                    {!result.isLoss && (
                      <div className="rounded-lg border border-ink-100 bg-ink-50/60 p-3">
                        <div className="flex items-center gap-1.5 font-semibold text-ink-700">
                          <CheckCircle2 size={15} className="text-brand-600" /> {t(K + 'formulaTax')}
                        </div>
                        <p className="mt-1 font-mono text-xs font-bold text-brand-700">
                          {fmt(result.netProfit)} × {fmt(rate * 100)}% = {fmt(result.tax)} د.ع
                        </p>
                      </div>
                    )}
                    {result.isLoss && (
                      <div className="flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-700">
                        <AlertTriangle size={15} /> {t(K + 'noProfit')}
                      </div>
                    )}
                  </div>
                )}

                <p className="mt-3 text-xs text-ink-400">{t(K + 'legalNote')}</p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
