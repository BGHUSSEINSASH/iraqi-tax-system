import { useMemo } from 'react'
import { Flame, MapPin, Users, TrendingUp } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { PageHead, Card, CardBody, Badge } from '../components/ui'
import { useI18n } from '../i18n'

const IRAQ_PROVINCES = [
  'بغداد', 'البصرة', 'نينوى', 'أربيل', 'النجف', 'كربلاء',
  'الأنبار', 'ديالى', 'القادسية', 'ذي قار', 'صلاح الدين',
  'كركوك', 'ميسان', 'واسط', 'بابل', 'المثنى', 'دهوك', 'السليمانية',
]

const PROVINCE_KEYS: Record<string, string> = {
  'بغداد': 'baghdad',
  'البصرة': 'basra',
  'نينوى': 'ninewa',
  'أربيل': 'erbil',
  'النجف': 'najaf',
  'كربلاء': 'karbala',
  'الأنبار': 'anbar',
  'ديالى': 'diyala',
  'القادسية': 'qadisiyah',
  'ذي قار': 'dhiqar',
  'صلاح الدين': 'salahdin',
  'كركوك': 'kirkuk',
  'ميسان': 'maysan',
  'واسط': 'wasit',
  'بابل': 'babil',
  'المثنى': 'muthanna',
  'دهوك': 'duhok',
  'السليمانية': 'sulaymaniyah',
}

export default function Heatmap() {
  const { data } = useApp()
  const { t } = useI18n()
  const pname = (p: string) => t(`pgAnalytics.heatmap.province.${PROVINCE_KEYS[p] ?? 'baghdad'}`)

  const stats = useMemo(() => {
    const counts: Record<string, { taxpayers: number; active: number; invoices: number }> = {}
    IRAQ_PROVINCES.forEach((p) => (counts[p] = { taxpayers: 0, active: 0, invoices: 0 }))

    data.taxpayers.forEach((t) => {
      const key = counts[t.province]
      if (key) {
        key.taxpayers++
        if (t.status === 'active') key.active++
      }
    })

    const max = Math.max(1, ...Object.values(counts).map((c) => c.taxpayers))
    return { counts, max }
  }, [data.taxpayers])

  const totalTaxpayers = data.taxpayers.length
  const provincesWithData = IRAQ_PROVINCES.filter((p) => stats.counts[p].taxpayers > 0).length
  const topProvince = useMemo(
    () =>
      IRAQ_PROVINCES.reduce(
        (best, p) => (stats.counts[p].taxpayers > stats.counts[best].taxpayers ? p : best),
        IRAQ_PROVINCES[0],
      ),
    [stats],
  )

  const intensity = (n: number) => {
    const ratio = n / stats.max
    if (ratio === 0) return { bg: '#f8fafc', text: '#cbd5e1', label: t('pgAnalytics.heatmap.level.none') }
    if (ratio < 0.25) return { bg: '#d1fae5', text: '#047857', label: t('pgAnalytics.heatmap.level.low') }
    if (ratio < 0.5) return { bg: '#fde68a', text: '#b45309', label: t('pgAnalytics.heatmap.level.medium') }
    if (ratio < 0.75) return { bg: '#fdba74', text: '#9a3412', label: t('pgAnalytics.heatmap.level.high') }
    return { bg: '#fb7185', text: '#9f1239', label: t('pgAnalytics.heatmap.level.veryHigh') }
  }

  const sorted = useMemo(
    () => IRAQ_PROVINCES.slice().sort((a, b) => stats.counts[b].taxpayers - stats.counts[a].taxpayers),
    [stats],
  )

  return (
    <div>
      <PageHead title={t('pgAnalytics.heatmap.page.title')} desc={t('pgAnalytics.heatmap.page.desc')} />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-ink-500"><MapPin size={15} className="text-brand-600" /> {t('pgAnalytics.heatmap.stat.activeProvinces')}</div>
          <div className="mt-1 text-xl font-bold text-ink-800">{provincesWithData} / {IRAQ_PROVINCES.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-ink-500"><Users size={15} className="text-brand-600" /> {t('pgAnalytics.heatmap.stat.totalTaxpayers')}</div>
          <div className="mt-1 text-xl font-bold text-ink-800">{totalTaxpayers}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-ink-500"><Flame size={15} className="text-orange-500" /> {t('pgAnalytics.heatmap.stat.topProvince')}</div>
          <div className="mt-1 truncate text-sm font-bold text-ink-800">{pname(topProvince)}</div>
        </Card>
        <Card className="p-4 bg-orange-500 text-white">
          <div className="text-xs text-orange-100">{t('pgAnalytics.heatmap.stat.maxDensity')}</div>
          <div className="mt-1 text-xl font-bold">{stats.max === 1 ? 1 : stats.max}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardBody>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {sorted.map((p, i) => {
                const c = stats.counts[p]
                const tint = intensity(c.taxpayers)
                return (
                  <div
                    key={p}
                    className="rounded-xl border border-ink-100 p-3 text-center transition"
                    style={{ backgroundColor: tint.bg }}
                  >
                    <div className="text-xs font-bold" style={{ color: tint.text }}>{String(i + 1).padStart(2, '0')}</div>
                    <div className="mt-0.5 truncate text-sm font-bold" style={{ color: tint.text }}>{pname(p)}</div>
                    <div className="mt-1 text-lg font-black" style={{ color: tint.text }}>{c.taxpayers}</div>
                    <div className="mt-0.5 text-[10px]" style={{ color: tint.text }}>{c.active} {t('pgAnalytics.heatmap.tile.active')}</div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs">
              <span className="text-ink-500">{t('pgAnalytics.heatmap.legend.scale')}</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded" style={{ background: '#d1fae5' }} /> {t('pgAnalytics.heatmap.level.low')}</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded" style={{ background: '#fde68a' }} /> {t('pgAnalytics.heatmap.level.medium')}</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded" style={{ background: '#fdba74' }} /> {t('pgAnalytics.heatmap.level.high')}</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded" style={{ background: '#fb7185' }} /> {t('pgAnalytics.heatmap.level.veryHigh')}</span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-800">
              <TrendingUp size={16} className="text-brand-600" /> {t('pgAnalytics.heatmap.ranking.title')}
            </h3>
            <div className="space-y-2">
              {sorted.slice(0, 8).map((p, i) => {
                const c = stats.counts[p]
                const pct = Math.max(2, (c.taxpayers / stats.max) * 100)
                return (
                  <div key={p} className="flex items-center gap-3">
                    <span className="w-5 text-xs font-bold text-ink-400">{i + 1}</span>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-semibold text-ink-700">{pname(p)}</span>
                        <span className="font-bold text-ink-600">{c.taxpayers}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                        <div className="h-full rounded-full bg-gradient-to-l from-amber-400 to-orange-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    {i === 0 && <Badge tone="red">{t('pgAnalytics.heatmap.ranking.top')}</Badge>}
                  </div>
                )
              })}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
