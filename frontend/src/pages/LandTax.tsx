import { useState, type ReactNode } from 'react'
import { Map, ShieldCheck, UserX, Ruler, Calculator, RotateCcw, BadgeCheck } from 'lucide-react'
import { PageHead, Card, CardHeader, CardBody, Button, Badge, Field, Input, useToast, cx } from '../components/ui'
import { useI18n } from '../i18n'
import { fmt, money } from '../lib/format'

const EXEMPTION_KEYS = ['ex1', 'ex2', 'ex3', 'ex4', 'ex5', 'ex6', 'ex7', 'ex8', 'ex9'] as const

interface LandResult {
  totalArea: number
  exemptArea: number
  taxableArea: number
  unitValue: number
  taxableValue: number
  tax: number
  isMinor: boolean
  exemptByArea: boolean
}

function OptionRow({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-right text-sm transition',
        active ? 'border-brand-500 bg-brand-50 font-semibold text-brand-800' : 'border-ink-200 bg-white text-ink-700 hover:border-brand-300',
      )}
    >
      <span className={cx('flex h-4 w-4 shrink-0 items-center justify-center rounded-full border', active ? 'border-brand-600' : 'border-ink-300')}>
        {active && <span className="h-2 w-2 rounded-full bg-brand-600" />}
      </span>
      {children}
    </button>
  )
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'emerald' }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-ink-200 bg-ink-50 px-4 py-3">
      <div className="text-sm font-bold text-ink-800">{label}</div>
      <div className={cx('text-lg font-black', tone === 'emerald' ? 'text-emerald-700' : 'text-ink-800')}>{value}</div>
    </div>
  )
}

export default function LandTax() {
  const { t } = useI18n()
  const { push } = useToast()

  const [exemption, setExemption] = useState<string | null>(null)
  const [minor, setMinor] = useState<'yes' | 'no' | null>(null)
  const [area, setArea] = useState(0)
  const [value, setValue] = useState(0)
  const [result, setResult] = useState<LandResult | null>(null)

  const totallyExempt = exemption !== null && exemption !== 'none'
  const showMinor = exemption === 'none'
  const showData = showMinor && minor !== null

  const pickExemption = (key: string) => {
    setExemption(key)
    setResult(null)
    if (key !== 'none') {
      setMinor(null)
      setArea(0)
      setValue(0)
    }
  }

  const compute = () => {
    if (!(area > 0)) {
      push('error', t('pgTax.land.areaRequired'))
      return
    }
    if (!(value > 0)) {
      push('error', t('pgTax.land.valueRequired'))
      return
    }
    const isMinor = minor === 'yes'
    const exemptArea = isMinor ? 0 : Math.min(800, area)
    const taxableArea = area - exemptArea
    const unitValue = value / area
    const taxableValue = unitValue * taxableArea
    setResult({
      totalArea: area,
      exemptArea,
      taxableArea,
      unitValue,
      taxableValue,
      tax: taxableValue * 0.02,
      isMinor,
      exemptByArea: !isMinor && area <= 800,
    })
  }

  const reset = () => {
    setExemption(null)
    setMinor(null)
    setArea(0)
    setValue(0)
    setResult(null)
  }

  const steps = [
    { label: t('pgTax.land.step1Title'), state: exemption !== null ? 'done' : 'active' },
    { label: t('pgTax.land.step2Title'), state: !showMinor ? 'todo' : minor !== null ? 'done' : 'active' },
    { label: t('pgTax.land.step3Title'), state: showData ? 'active' : 'todo' },
  ] as const

  return (
    <div>
      <PageHead title={t('pgTax.land.title')} desc={t('pgTax.land.desc')} />

      {/* STEP INDICATOR */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2">
            <span
              className={cx(
                'rounded-full px-3 py-1 text-xs font-bold',
                s.state === 'done' ? 'bg-emerald-100 text-emerald-700' : s.state === 'active' ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-400',
              )}
            >
              {i + 1} · {s.label}
            </span>
            {i < steps.length - 1 && <span className="h-px w-5 bg-ink-200" />}
          </div>
        ))}
      </div>

      {/* STEP 1 — EXEMPTION CHECK */}
      <Card>
        <CardHeader
          title={t('pgTax.land.step1Title')}
          subtitle={t('pgTax.land.step1Question')}
          action={
            exemption !== null && !totallyExempt ? (
              <Button size="sm" variant="secondary" onClick={reset}>
                <RotateCcw size={14} /> {t('pgTax.land.resetBtn')}
              </Button>
            ) : undefined
          }
        />
        <CardBody>
          <div className="space-y-2">
            {EXEMPTION_KEYS.map((k) => (
              <OptionRow key={k} active={exemption === k} onClick={() => pickExemption(k)}>
                {t(`pgTax.land.${k}`)}
              </OptionRow>
            ))}
            <OptionRow active={exemption === 'none'} onClick={() => pickExemption('none')}>
              {t('pgTax.land.exNone')}
            </OptionRow>
          </div>
        </CardBody>
      </Card>

      {/* TOTALLY EXEMPT RESULT */}
      {totallyExempt && (
        <Card className="border-2 border-emerald-300">
          <CardBody>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <BadgeCheck size={20} />
                </span>
                <div>
                  <div className="text-sm font-black text-emerald-800">{t('pgTax.land.exemptFullTitle')}</div>
                  <div className="mt-1 text-sm text-emerald-700">{t('pgTax.land.exemptFull')}</div>
                  <div className="mt-2">
                    <Badge tone="green">
                      {t('pgTax.land.rowTax')} — {money(0)}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-600">{money(0)}</div>
              <Button size="sm" variant="secondary" onClick={reset}>
                <RotateCcw size={14} /> {t('pgTax.land.resetBtn')}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* STEP 2 — MINOR CHECK */}
      {showMinor && (
        <Card>
          <CardHeader title={t('pgTax.land.step2Title')} subtitle={t('pgTax.land.step2Question')} />
          <CardBody className="space-y-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <OptionRow active={minor === 'yes'} onClick={() => setMinor('yes')}>
                {t('pgTax.land.yes')}
              </OptionRow>
              <OptionRow active={minor === 'no'} onClick={() => setMinor('no')}>
                {t('pgTax.land.no')}
              </OptionRow>
            </div>
            {minor === 'yes' && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">{t('pgTax.land.minorNote')}</div>}
          </CardBody>
        </Card>
      )}

      {/* STEP 3 — AREA & VALUE */}
      {showData && (
        <Card>
          <CardHeader title={t('pgTax.land.step3Title')} subtitle={t('pgTax.land.fieldHint')} />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t('pgTax.land.fieldArea')} required>
                <Input type="number" min={1} step="any" value={area || ''} onChange={(e) => setArea(Math.max(0, Number(e.target.value)))} />
              </Field>
              <Field label={t('pgTax.land.fieldValue')} required>
                <Input type="number" min={1} step="any" value={value || ''} onChange={(e) => setValue(Math.max(0, Number(e.target.value)))} />
              </Field>
            </div>
            <Button onClick={compute}>
              <Calculator size={16} /> {t('pgTax.land.calcBtn')}
            </Button>
          </CardBody>
        </Card>
      )}

      {/* RESULT — PARTIAL / EXEMPT BY AREA */}
      {result && (
        <Card className="border-2 border-brand-200">
          <CardHeader title={t('pgTax.land.resultTitle')} />
          <CardBody className="space-y-2">
            {result.exemptByArea && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">{t('pgTax.land.exemptAreaNote')}</div>}
            <Row label={t('pgTax.land.rowTotalArea')} value={`${fmt(result.totalArea)} ${t('pgTax.land.sqm')}`} />
            <Row label={t('pgTax.land.rowExemptArea')} value={`${fmt(result.exemptArea)} ${t('pgTax.land.sqm')}`} tone="emerald" />
            <Row label={t('pgTax.land.rowTaxableArea')} value={`${fmt(result.taxableArea)} ${t('pgTax.land.sqm')}`} />
            <Row label={t('pgTax.land.rowUnitValue')} value={money(result.unitValue)} />
            <Row label={t('pgTax.land.rowTaxableValue')} value={money(result.taxableValue)} />
            <div className="flex items-center justify-between rounded-2xl bg-brand-600 p-5 text-white">
              <div>
                <div className="text-sm font-bold text-emerald-100">{t('pgTax.land.rowTax')}</div>
                <div className="mt-0.5 text-[11px] text-emerald-200">
                  {t('pgTax.land.lawArticle3')} — {t('pgTax.land.lawArticle3Note')}
                </div>
              </div>
              <div className="text-2xl font-black">{money(result.tax)}</div>
            </div>
          </CardBody>
        </Card>
      )}

      <p className="mt-4 text-xs leading-6 text-ink-400">{t('pgTax.land.disclaimer')}</p>
    </div>
  )
}
