import { useState } from 'react'
import { Bell, CalendarClock, Scale, Info, BookOpen, Building2, Users, FileText } from 'lucide-react'
import { PageHead, Card, CardHeader, CardBody, Tabs } from '../components/ui'
import { useI18n } from '../i18n'

export default function Notifications() {
  const { t } = useI18n()
  const [tab, setTab] = useState<'deadlines' | 'legal'>('deadlines')

  const DEADLINES = [
    {
      icon: <Building2 size={20} />,
      color: '#ef4444',
      bg: '#fee2e2',
      title: t('pgSystem.notifications.deadline1.title'),
      desc: t('pgSystem.notifications.deadline1.desc'),
      example: t('pgSystem.notifications.deadline1.example'),
    },
    {
      icon: <Users size={20} />,
      color: '#f59e0b',
      bg: '#ffedf5',
      title: t('pgSystem.notifications.deadline2.title'),
      desc: t('pgSystem.notifications.deadline2.desc'),
      example: t('pgSystem.notifications.deadline2.example'),
    },
    {
      icon: <FileText size={20} />,
      color: '#4f46e5',
      bg: '#e0e7ff',
      title: t('pgSystem.notifications.deadline3.title'),
      desc: t('pgSystem.notifications.deadline3.desc'),
      example: t('pgSystem.notifications.deadline3.example'),
    },
  ]

  const LEGAL_NOTICES = [
    {
      icon: <BookOpen size={18} />,
      color: '#0284c7',
      bg: '#e0f2fe',
      title: t('pgSystem.notifications.legal1.title'),
      desc: t('pgSystem.notifications.legal1.desc'),
      date: '2026/01/10',
    },
  ]

  return (
    <div>
      <PageHead title={t('pgSystem.notifications.page.title')} desc={t('pgSystem.notifications.page.desc')} />

      <div className="mb-5">
        <Tabs
          items={[
            { id: 'deadlines', label: t('pgSystem.notifications.tabs.deadlines') },
            { id: 'legal', label: t('pgSystem.notifications.tabs.legal') },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'deadlines' && (
        <Card>
          <CardHeader title={t('pgSystem.notifications.deadlines.title')} subtitle={t('pgSystem.notifications.deadlines.subtitle')} />
          <CardBody>
            <div className="divide-y divide-ink-100">
              {DEADLINES.map((d, i) => (
                <div key={i} className="flex items-start gap-4 py-5">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                    style={{ background: d.bg, color: d.color }}
                  >
                    {d.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1 text-sm font-bold text-ink-800">{d.title}</h4>
                    <p className="text-sm leading-relaxed text-ink-600">{d.desc}</p>
                    <small className="mt-1 block text-xs text-ink-400">{d.example}</small>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-start gap-3 rounded-xl border-r-4 border-ink-400 bg-ink-50 p-4">
              <Info size={18} className="mt-0.5 shrink-0 text-ink-500" />
              <p className="text-sm font-bold text-ink-700">
                {t('pgSystem.notifications.deadlines.note')}
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {tab === 'legal' && (
        <Card>
          <CardHeader title={t('pgSystem.notifications.legal.title')} subtitle={t('pgSystem.notifications.legal.subtitle')} />
          <CardBody>
            <div className="divide-y divide-ink-100">
              {LEGAL_NOTICES.map((n, i) => (
                <div key={i} className="flex items-start gap-4 py-5">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: n.bg, color: n.color }}
                  >
                    {n.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1 text-sm font-bold text-ink-800">{n.title}</h4>
                    <p className="text-sm leading-relaxed text-ink-600">{n.desc}</p>
                    <span className="mt-2 block text-xs text-ink-400">{t('pgSystem.notifications.dateLabel', { date: n.date })}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
