import { useMemo } from 'react'
import { useApp } from '../store/AppContext'
import {
  PageHead,
  Card,
  CardBody,
  Button,
  Badge,
  useToast,
} from '../components/ui'
import { Crown, Check, ShieldCheck, Zap, Award, Flame } from 'lucide-react'
import { useI18n } from '../i18n'

const PACKAGES_LIST = [
  {
    id: 'basic' as const,
    amount: '١٥٠,٠٠٠',
    icon: Zap,
    features: ['f1', 'f2', 'f3', 'f4', 'f5'],
    tone: 'slate' as const,
  },
  {
    id: 'professional' as const,
    amount: '٣٥٠,٠٠٠',
    icon: Flame,
    features: ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'],
    tone: 'amber' as const,
  },
  {
    id: 'enterprise' as const,
    amount: '٧٥٠,٠٠٠',
    icon: Crown,
    features: ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'],
    tone: 'brand' as const,
  },
]

export default function Packages() {
  const { data, setCurrentPackage } = useApp()
  const { push } = useToast()
  const { t } = useI18n()

  const currentPkg = data.currentPackage || 'enterprise'

  const activePkgInfo = useMemo(() => {
    return PACKAGES_LIST.find((x) => x.id === currentPkg) || PACKAGES_LIST[2]
  }, [currentPkg])

  const handleSelectPackage = (id: 'basic' | 'professional' | 'enterprise') => {
    if (id === currentPkg) return
    setCurrentPackage(id)
    push('success', t('pgSystem.packages.toast.upgraded', { name: t(`pgSystem.packages.plan.${id}.name`) }))
  }

  return (
    <div className="space-y-6">
      <PageHead
        title={t('pgSystem.packages.page.title')}
        desc={t('pgSystem.packages.page.desc')}
      />

      {/* Current Package Overview */}
      <Card className="border-2 border-emerald-200 bg-emerald-50/10">
        <CardBody className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-sm animate-pulse">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-emerald-900 flex items-center gap-2">
                {t('pgSystem.packages.current.title', { name: t(`pgSystem.packages.plan.${activePkgInfo.id}.name`) })}
                <Badge tone="green">{t('pgSystem.packages.current.badge')}</Badge>
              </h3>
              <p className="text-xs text-ink-600 mt-1 max-w-xl leading-relaxed">
                {t('pgSystem.packages.current.desc')}
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-baseline gap-1 bg-emerald-100/50 rounded-xl px-4 py-2 text-emerald-800 font-bold">
            <Award size={16} className="ml-1 text-emerald-600" />
            <span className="text-xs">{t('pgSystem.packages.current.priceLabel')}</span>
            <span className="text-base font-black font-mono">{activePkgInfo.amount}</span>
          </div>
        </CardBody>
      </Card>

      {/* Package Matrix Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 pt-4">
        {PACKAGES_LIST.map((pkg) => {
          const Icon = pkg.icon
          const isCurrent = pkg.id === currentPkg
          return (
            <Card
              key={pkg.id}
              className={`flex flex-col h-full border transition duration-300 relative ${isCurrent ? 'border-2 border-brand-500 shadow-lg scale-[1.02] z-10' : 'border-ink-200 hover:border-ink-400 hover:shadow'}`}
            >
              {isCurrent && (
                <span className="absolute -top-3 right-5 bg-brand-600 text-white font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                  {t('pgSystem.packages.card.currentBadge')}
                </span>
              )}

              <CardBody className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-4 ${isCurrent ? 'bg-brand-500 text-white shadow-md' : 'bg-ink-100 text-ink-600'}`}>
                    <Icon size={22} />
                  </div>

                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-ink-800">{t(`pgSystem.packages.plan.${pkg.id}.name`)}</h3>
                    <Badge tone={pkg.tone}>{t(`pgSystem.packages.plan.${pkg.id}.badge`)}</Badge>
                  </div>

                  <p className="text-xs text-ink-500 mt-2 min-h-[48px] leading-relaxed">{t(`pgSystem.packages.plan.${pkg.id}.desc`)}</p>

                  <div className="mt-4 border-b border-ink-100 pb-4">
                    <span className="text-lg font-black text-brand-700 font-mono">{t('pgSystem.packages.priceSuffix', { amount: pkg.amount })}</span>
                  </div>

                  {/* Feature Checklist */}
                  <ul className="mt-5 space-y-2.5 text-xs font-semibold text-ink-600">
                    {pkg.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span className="leading-snug">{t(`pgSystem.packages.plan.${pkg.id}.${feat}`)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-ink-100">
                  <Button
                    onClick={() => handleSelectPackage(pkg.id)}
                    variant={isCurrent ? 'secondary' : 'primary'}
                    className="w-full justify-center"
                    disabled={isCurrent}
                  >
                    {t(isCurrent ? 'pgSystem.packages.card.activeButton' : 'pgSystem.packages.card.upgradeButton')}
                  </Button>
                </div>
              </CardBody>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
