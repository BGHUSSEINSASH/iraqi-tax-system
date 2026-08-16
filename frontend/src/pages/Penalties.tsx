import { useState } from 'react'
import { useApp } from '../store/AppContext'
import {
  PageHead,
  Card,
  CardBody,
  Button,
  Field,
  Input,
  Select,
  MoneyInput,
  useToast,
} from '../components/ui'
import { Gavel, Calculator, AlertTriangle, CalendarRange, CheckCircle } from 'lucide-react'
import { fmt } from '../lib/format'
import { useI18n } from '../i18n'

const penaltyTypes = {
  late_payment: { nameKey: 'pgSecondary.penalties.type.latePayment', ratePerMonth: 0.05, descKey: 'pgSecondary.penalties.typeDesc.latePayment' },
  late_declaration: { nameKey: 'pgSecondary.penalties.type.lateDeclaration', ratePerMonth: 0.025, descKey: 'pgSecondary.penalties.typeDesc.lateDeclaration' },
  tax_evasion: { nameKey: 'pgSecondary.penalties.type.taxEvasion', rateFlat: 1.0, descKey: 'pgSecondary.penalties.typeDesc.taxEvasion' },
  false_info: { nameKey: 'pgSecondary.penalties.type.falseInfo', rateFlat: 0.5, descKey: 'pgSecondary.penalties.typeDesc.falseInfo' },
  no_records: { nameKey: 'pgSecondary.penalties.type.noRecords', rateFlat: 0.25, descKey: 'pgSecondary.penalties.typeDesc.noRecords' },
}

export default function Penalties() {
  const { add, currentUser } = useApp()
  const { push } = useToast()
  const { t } = useI18n()

  const [type, setType] = useState<keyof typeof penaltyTypes>('late_payment')
  const [originalTax, setOriginalTax] = useState(0)
  const [dueDate, setDueDate] = useState('')
  const [payDate, setPayDate] = useState('')

  // Result state
  const [result, setResult] = useState<{
    calculated: boolean
    typeNameKey: string
    daysLate: number
    monthsLate: number
    rate: number
    penalty: number
  } | null>(null)

  const handleCalculate = () => {
    if (!originalTax || originalTax <= 0) {
      push('error', t('pgSecondary.penalties.toast.noAmount'))
      return
    }

    const info = penaltyTypes[type]
    let penalty = 0
    let daysLate = 0
    let monthsLate = 0
    let rate = 0

    if ('rateFlat' in info) {
      rate = info.rateFlat
      penalty = originalTax * rate
    } else {
      if (!dueDate || !payDate) {
        push('error', t('pgSecondary.penalties.toast.noDates'))
        return
      }
      const d1 = new Date(dueDate)
      const d2 = new Date(payDate)
      
      if (d2 <= d1) {
        push('info', t('pgSecondary.penalties.toast.noPenalty'))
        setResult({
          calculated: true,
          typeNameKey: type,
          daysLate: 0,
          monthsLate: 0,
          rate: 0,
          penalty: 0,
        })
        return
      }

      const diffTime = Math.abs(d2.getTime() - d1.getTime())
      daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      monthsLate = Math.ceil(daysLate / 30)

      rate = Math.min(monthsLate * (info.ratePerMonth || 0), 0.5) // limit max rate to 50% for late payment
      penalty = originalTax * rate
    }

    setResult({
      calculated: true,
      typeNameKey: type,
      daysLate,
      monthsLate,
      rate,
      penalty,
    })

    push('success', t('pgSecondary.penalties.toast.calculated'))
  }

  const handleRecordInfraction = () => {
    if (!result) return
    const id = 'AUD-' + Date.now()
    add('auditLogs', {
      id,
      action: t('pgSecondary.penalties.audit.action'),
      user: currentUser?.name || 'مدير النظام',
      details: t('pgSecondary.penalties.audit.details', { type: t(result.typeNameKey), penalty: fmt(Math.round(result.penalty)), tax: fmt(originalTax) }),
      time: new Date().toLocaleString('ar-IQ'),
    })
    push('success', t('pgSecondary.penalties.toast.recorded'))
  }

  return (
    <div className="space-y-6">
      <PageHead
        title={t('pgSecondary.penalties.page.title')}
        desc={t('pgSecondary.penalties.page.desc')}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Card>
            <CardBody className="space-y-4">
              <h3 className="text-sm font-bold text-ink-800 border-b border-ink-100 pb-2 mb-4">{t('pgSecondary.penalties.input.title')}</h3>

              <Field label={t('pgSecondary.penalties.field.type')} required>
                <Select value={type} onChange={(e) => {
                  setType(e.target.value as any)
                  setResult(null)
                }}>
                  {Object.entries(penaltyTypes).map(([key, val]) => (
                    <option key={key} value={key}>
                      {t(val.nameKey)} ({t(val.descKey)})
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label={t('pgSecondary.penalties.field.originalTax')} required>
                <MoneyInput value={originalTax} onChange={(v) => {
                  setOriginalTax(v)
                  setResult(null)
                }} />
              </Field>

              {penaltyTypes[type] && !('rateFlat' in penaltyTypes[type]) && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 p-4 bg-ink-50 rounded-xl border border-ink-200">
                  <div className="sm:col-span-2 text-xs font-bold text-ink-600 flex items-center gap-1.5 mb-2">
                    <CalendarRange size={14} />
                    <span>{t('pgSecondary.penalties.field.periodTitle')}</span>
                  </div>
                  <Field label={t('pgSecondary.penalties.field.dueDate')}>
                    <Input type="date" value={dueDate} onChange={(e) => {
                      setDueDate(e.target.value)
                      setResult(null)
                    }} />
                  </Field>
                  <Field label={t('pgSecondary.penalties.field.payDate')}>
                    <Input type="date" value={payDate} onChange={(e) => {
                      setPayDate(e.target.value)
                      setResult(null)
                    }} />
                  </Field>
                </div>
              )}

              <div className="pt-2">
                <Button onClick={handleCalculate} className="w-full">
                  <Calculator size={16} className="ml-2" />
                  {t('pgSecondary.penalties.calc.button')}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-5">
          {result ? (
            <Card className="border-2 border-brand-200 bg-brand-50/20">
              <CardBody className="space-y-5">
                <div className="flex items-center gap-3 border-b border-brand-100 pb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                    <Gavel size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-brand-800">{t('pgSecondary.penalties.result.title')}</h4>
                    <p className="text-[11px] text-ink-500">{t('pgSecondary.penalties.result.subtitle')}</p>
                  </div>
                </div>

                <div className="space-y-3 divide-y divide-ink-100 text-sm">
                  <div className="flex justify-between py-1.5">
                    <span className="text-ink-500">{t('pgSecondary.penalties.result.type')}</span>
                    <span className="font-bold text-ink-800">{t(result.typeNameKey)}</span>
                  </div>

                  {result.daysLate > 0 && (
                    <>
                      <div className="flex justify-between py-1.5">
                        <span className="text-ink-500">{t('pgSecondary.penalties.result.daysLate')}</span>
                        <span className="font-semibold text-ink-800 font-mono">{t('pgSecondary.penalties.result.daysLateValue', { days: result.daysLate })}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-ink-500">{t('pgSecondary.penalties.result.monthsLate')}</span>
                        <span className="font-semibold text-ink-800 font-mono">{t('pgSecondary.penalties.result.monthsLateValue', { months: result.monthsLate })}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between py-1.5">
                    <span className="text-ink-500">{t('pgSecondary.penalties.result.rate')}</span>
                    <span className="font-bold text-amber-700 font-mono">{(result.rate * 100).toFixed(1)}%</span>
                  </div>

                  <div className="flex justify-between py-1.5">
                    <span className="text-ink-500">{t('pgSecondary.penalties.result.originalTax')}</span>
                    <span className="font-semibold text-ink-800 font-mono">{t('pgSecondary.penalties.result.originalTaxValue', { amount: fmt(originalTax) })}</span>
                  </div>

                  <div className="flex justify-between py-3 border-t-2 border-brand-200">
                    <span className="text-base font-bold text-brand-900">{t('pgSecondary.penalties.result.penalty')}</span>
                    <span className="text-lg font-black text-red-600 font-mono">{t('pgSecondary.penalties.result.penaltyValue', { amount: fmt(Math.round(result.penalty)) })}</span>
                  </div>

                  <div className="flex justify-between py-3 border-t border-brand-200">
                    <span className="text-base font-bold text-brand-900">{t('pgSecondary.penalties.result.total')}</span>
                    <span className="text-xl font-black text-brand-800 font-mono">{t('pgSecondary.penalties.result.totalValue', { amount: fmt(originalTax + Math.round(result.penalty)) })}</span>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <Button variant="secondary" className="w-full" onClick={() => setResult(null)}>
                    {t('pgSecondary.penalties.result.recalc')}
                  </Button>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 border-emerald-600" onClick={handleRecordInfraction}>
                    <CheckCircle size={16} className="ml-1.5" />
                    {t('pgSecondary.penalties.result.record')}
                  </Button>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card className="border-dashed border-ink-300">
              <CardBody className="flex flex-col items-center justify-center py-20 text-center text-ink-400">
                <AlertTriangle size={36} className="text-ink-300 mb-3" />
                <h4 className="font-bold text-ink-600 text-sm">{t('pgSecondary.penalties.empty.title')}</h4>
                <p className="text-xs text-ink-400 mt-1 max-w-[240px]">{t('pgSecondary.penalties.empty.desc')}</p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
