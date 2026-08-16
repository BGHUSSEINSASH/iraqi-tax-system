import { useMemo, useState } from 'react'
import { ChevronRight, ChevronLeft, CalendarDays, AlertCircle, CheckCircle2, CalendarClock } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { PageHead, Card, CardBody, Badge, Button } from '../components/ui'
import { fmtDate } from '../lib/format'
import { useI18n } from '../i18n'

interface TaxEvent {
  date: string
  titleKey: string
  type: 'urgent' | 'normal' | 'done'
}

function taxEventsForYear(year: number): TaxEvent[] {
  return [
    { date: `${year}-01-31`, titleKey: 'pgSecondary.calendar.event.incomeDecl', type: 'urgent' },
    { date: `${year}-03-31`, titleKey: 'pgSecondary.calendar.event.corporateQ1', type: 'urgent' },
    { date: `${year}-04-15`, titleKey: 'pgSecondary.calendar.event.payroll', type: 'normal' },
    { date: `${year}-06-30`, titleKey: 'pgSecondary.calendar.event.corporateQ2', type: 'urgent' },
    { date: `${year}-07-01`, titleKey: 'pgSecondary.calendar.event.fiscalStart', type: 'done' },
    { date: `${year}-09-30`, titleKey: 'pgSecondary.calendar.event.corporateQ3', type: 'urgent' },
    { date: `${year}-10-15`, titleKey: 'pgSecondary.calendar.event.propertyDecl', type: 'normal' },
    { date: `${year}-12-31`, titleKey: 'pgSecondary.calendar.event.corporateQ4', type: 'urgent' },
    { date: `${year}-12-31`, titleKey: 'pgSecondary.calendar.event.fiscalEnd', type: 'normal' },
  ]
}

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export default function Calendar() {
  const { data } = useApp()
  const { t, months } = useI18n()
  const today = new Date()
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  const taxEvents = useMemo(() => taxEventsForYear(year), [year])
  const appointmentEvents = useMemo(
    () =>
      data.appointments
        .filter((a) => a.date?.startsWith(`${year}-`))
        .map((a) => ({ date: a.date, title: `${a.time || ''} — ${a.title}`, type: 'appointment' as const })),
    [data.appointments, year],
  )

  const eventMap = useMemo(() => {
    const map = new Map<string, { title: string; type: string }[]>()
    taxEvents.forEach((e) => {
      const list = map.get(e.date) ?? []
      list.push({ title: t(e.titleKey), type: e.type })
      map.set(e.date, list)
    })
    appointmentEvents.forEach((e) => {
      const list = map.get(e.date) ?? []
      list.push({ title: e.title, type: e.type })
      map.set(e.date, list)
    })
    return map
  }, [taxEvents, appointmentEvents, t])

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevDays = new Date(year, month, 0).getDate()
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`

  const cells: (number | 'prev' | 'next')[] = []
  for (let p = firstDay - 1; p >= 0; p--) cells.push('prev')
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push('next')

  const monthEvents = Array.from(eventMap.entries())
    .filter(([date]) => date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
    .map(([date, evs]) => ({ date, evs }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const upcoming = monthEvents.filter(({ date, evs }) => {
    const d = new Date(date + 'T00:00:00')
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return d >= t && evs.some((e) => e.type === 'urgent' || e.type === 'appointment')
  })

  const typeBadge = (type: string) => {
    if (type === 'urgent') return <Badge tone="red">{t('pgSecondary.calendar.badge.urgent')}</Badge>
    if (type === 'done') return <Badge tone="green">{t('pgSecondary.calendar.badge.done')}</Badge>
    if (type === 'appointment') return <Badge tone="blue">{t('pgSecondary.calendar.badge.appointment')}</Badge>
    return <Badge tone="amber">{t('pgSecondary.calendar.badge.normal')}</Badge>
  }

  const dot = (t: string) => {
    if (t === 'urgent') return 'bg-red-500'
    if (t === 'done') return 'bg-emerald-500'
    if (t === 'appointment') return 'bg-sky-500'
    return 'bg-amber-400'
  }

  return (
    <div>
      <PageHead
        title={t('pgSecondary.calendar.page.title')}
        desc={t('pgSecondary.calendar.page.desc')}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setCursor(new Date(year, month - 1, 1))}
            >
              <ChevronRight size={16} />
            </Button>
            <Button
              variant="secondary"
              onClick={() => setCursor(new Date(year, month + 1, 1))}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="ghost"
              onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
            >
              {t('pgSecondary.calendar.page.today')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card>
            <CardBody className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-ink-800">
                  <CalendarDays size={18} className="ml-1 inline text-brand-600" />
                  {months[month]} {year}
                </h3>
                <span className="text-xs text-ink-400">{t('pgSecondary.calendar.todayLabel', { date: fmtDate(today.toISOString()) })}</span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-ink-500">
                {DAY_KEYS.map((d) => (
                  <div key={d} className="py-2">{t(`pgSecondary.calendar.days.${d}`)}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {cells.map((c, i) => {
                  if (c === 'prev') {
                    const day = prevDays - firstDay + 1 + (i - firstDay)
                    return <div key={i} className="rounded-lg p-2 text-center text-xs text-ink-300">{day}</div>
                  }
                  if (c === 'next') {
                    const idx = i - firstDay - daysInMonth
                    return <div key={i} className="rounded-lg p-2 text-center text-xs text-ink-300">{idx + 1}</div>
                  }
                  const key = `${year}-${month}-${c}`
                  const isToday = key === todayKey
                  const evs = eventMap.get(`${year}-${String(month + 1).padStart(2, '0')}-${String(c).padStart(2, '0')}`) ?? []
                  return (
                    <div
                      key={i}
                      className={`min-h-[64px] rounded-lg border p-2 text-sm transition ${
                        isToday
                          ? 'border-brand-400 bg-brand-50 font-bold text-brand-700 ring-1 ring-brand-200'
                          : evs.length > 0
                            ? 'border-ink-200 bg-white hover:bg-ink-50'
                            : 'border-ink-100 bg-ink-50/60'
                      }`}
                    >
                      <div className="mb-1 flex items-start justify-between">
                        <span className={isToday ? 'font-black' : 'font-semibold text-ink-600'}>{c}</span>
                        {evs.length > 0 && (
                          <span className="flex gap-0.5">
                            {evs.slice(0, 3).map((e, j) => (
                              <span key={j} className={`h-1.5 w-1.5 rounded-full ${dot(e.type)}`} />
                            ))}
                          </span>
                        )}
                      </div>
                      {evs.slice(0, 1).map((e, j) => (
                        <div key={j} className="truncate text-[10px] leading-tight text-ink-500" title={e.title}>
                          {e.title}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink-500">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> {t('pgSecondary.calendar.legend.urgent')}</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> {t('pgSecondary.calendar.legend.normal')}</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> {t('pgSecondary.calendar.legend.done')}</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-500" /> {t('pgSecondary.calendar.legend.appointment')}</span>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardBody>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-800">
                <CalendarClock size={16} className="text-brand-600" />
                {t('pgSecondary.calendar.monthEvents.title', { month: months[month], year })}
              </h3>
              {monthEvents.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink-400">{t('pgSecondary.calendar.monthEvents.empty')}</p>
              ) : (
                <div className="space-y-2">
                  {monthEvents.map(({ date, evs }) => (
                    <div key={date} className="rounded-xl border border-ink-200 bg-ink-50/60 p-3">
                      <div className="mb-1 text-[11px] font-bold text-ink-500">
                        {fmtDate(date)}
                      </div>
                      {evs.map((e, i) => (
                        <div key={i} className="mb-1 flex items-center justify-between gap-2 text-sm text-ink-700 last:mb-0">
                          <span className="flex items-center gap-1.5">
                            {e.type === 'done' ? <CheckCircle2 size={13} className="text-emerald-500" /> : e.type === 'urgent' ? <AlertCircle size={13} className="text-red-500" /> : <CalendarClock size={13} className="text-amber-500" />}
                            {e.title}
                          </span>
                          {typeBadge(e.type)}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h3 className="mb-3 text-sm font-bold text-ink-800">{t('pgSecondary.calendar.upcoming.title')}</h3>
              {upcoming.length === 0 ? (
                <p className="py-4 text-center text-sm text-ink-400">{t('pgSecondary.calendar.upcoming.empty')}</p>
              ) : (
                <div className="space-y-2">
                  {upcoming.map(({ date, evs }) =>
                    evs
                      .filter((e) => e.type === 'urgent' || e.type === 'appointment')
                      .map((e, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/60 px-3 py-2 text-sm">
                          <span className="font-medium text-ink-700">{e.title}</span>
                          <span className="text-xs font-bold text-red-600">{fmtDate(date)}</span>
                        </div>
                      )),
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
