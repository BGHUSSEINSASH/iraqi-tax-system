import { useState, useRef } from 'react'
import { Headset, Send, CheckCircle2, Building2, Phone, Mail, Briefcase, MessageSquare } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { PageHead, Card, CardHeader, CardBody, Button, Input, Textarea, Select } from '../components/ui'
import { uid } from '../lib/format'
import { useI18n } from '../i18n'

const SERVICES = [
  { value: 'إعداد حسابات ختامية', dept: 'الحسابات الختامية' },
  { value: 'تقديم إقرار ضريبي', dept: 'الإقرارات الضريبية' },
  { value: 'استشارة ضريبية', dept: 'الاستشارات' },
  { value: 'شهادة براءة ذمة', dept: 'براءة الذمة' },
  { value: 'أخرى', dept: 'أخرى' },
]

export default function Contact() {
  const { add } = useApp()
  const { t } = useI18n()

  const serviceLabel = (value: string) => {
    switch (value) {
      case 'إعداد حسابات ختامية': return t('pgSystem.contact.service.op1')
      case 'تقديم إقرار ضريبي': return t('pgSystem.contact.service.op2')
      case 'استشارة ضريبية': return t('pgSystem.contact.service.op3')
      case 'شهادة براءة ذمة': return t('pgSystem.contact.service.op4')
      default: return t('pgSystem.common.other')
    }
  }

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [service, setService] = useState('')
  const [details, setDetails] = useState('')
  const [sent, setSent] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const submit = () => {
    if (!name.trim() || !service || !details.trim()) {
      return
    }
    add('tickets', {
      id: uid(),
      subject: `${service} — ${name.trim()}`,
      dept: SERVICES.find((s) => s.value === service)?.dept ?? 'أخرى',
      priority: 'medium',
      status: 'open',
      date: new Date().toISOString(),
      desc: `الاسم: ${name.trim()}\nالهاتف: ${phone || '—'}\nالبريد: ${email || '—'}\n\n${details.trim()}`,
    })
    setName('')
    setPhone('')
    setEmail('')
    setService('')
    setDetails('')
    setSent(true)
    setTimeout(() => setSent(false), 5000)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const valid = name.trim() && service && details.trim()

  return (
    <div>
      <PageHead title={t('pgSystem.contact.page.title')} desc={t('pgSystem.contact.page.desc')} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={t('pgSystem.contact.form.title')} subtitle={t('pgSystem.contact.form.subtitle')} />
          <CardBody>
            <div ref={formRef}>
              {sent && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-bold text-emerald-700">
                  <CheckCircle2 size={18} /> {t('pgSystem.contact.form.sent')}
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-ink-600">
                    <Building2 size={13} /> {t('pgSystem.contact.form.companyName')} <span className="text-red-500">*</span>
                  </label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('pgSystem.contact.form.companyPlaceholder')} />
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-ink-600">
                    <Phone size={13} /> {t('pgSystem.contact.form.phone')}
                  </label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('pgSystem.contact.form.phonePlaceholder')} dir="ltr" />
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-ink-600">
                    <Mail size={13} /> {t('pgSystem.contact.form.email')}
                  </label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" dir="ltr" />
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-ink-600">
                    <Briefcase size={13} /> {t('pgSystem.contact.form.service')} <span className="text-red-500">*</span>
                  </label>
                  <Select value={service} onChange={(e) => setService(e.target.value)}>
                    <option value="">{t('pgSystem.contact.form.servicePlaceholder')}</option>
                    {SERVICES.map((s) => (
                      <option key={s.value} value={s.value}>{serviceLabel(s.value)}</option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="mt-4">
                <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-ink-600">
                  <MessageSquare size={13} /> {t('pgSystem.contact.form.details')} <span className="text-red-500">*</span>
                </label>
                <Textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={5} placeholder={t('pgSystem.contact.form.detailsPlaceholder')} />
              </div>
              <Button className="mt-5 w-full" disabled={!valid} onClick={submit}>
                <Send size={16} /> {t('pgSystem.contact.form.submit')}
              </Button>
              <p className="mt-3 text-center text-xs text-ink-400">
                {t('pgSystem.contact.form.note')}
              </p>
            </div>
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title={t('pgSystem.contact.channels.title')} subtitle={t('pgSystem.contact.channels.subtitle')} />
            <CardBody>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 rounded-xl bg-ink-50 p-3">
                  <Phone size={16} className="text-brand-600" />
                  <div>
                    <div className="text-xs text-ink-400">{t('pgSystem.contact.channels.phone')}</div>
                    <div className="font-bold text-ink-700" dir="ltr">07701234567</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-ink-50 p-3">
                  <Mail size={16} className="text-brand-600" />
                  <div>
                    <div className="text-xs text-ink-400">{t('pgSystem.contact.channels.email')}</div>
                    <div className="font-bold text-ink-700" dir="ltr">info@almanara.iq</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-ink-50 p-3">
                  <Headset size={16} className="text-brand-600" />
                  <div>
                    <div className="text-xs text-ink-400">{t('pgSystem.contact.channels.address')}</div>
                    <div className="font-bold text-ink-700">{t('pgSystem.contact.channels.addressValue')}</div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t('pgSystem.contact.hours.title')} />
            <CardBody>
              <div className="space-y-2 text-xs text-ink-600">
                <div className="flex justify-between"><span>{t('pgSystem.contact.hours.weekdays')}</span><b>8:00 — 16:00</b></div>
                <div className="flex justify-between"><span>{t('pgSystem.contact.hours.friday')}</span><b className="text-red-500">{t('pgSystem.contact.hours.holiday')}</b></div>
                <div className="flex justify-between"><span>{t('pgSystem.contact.hours.saturday')}</span><b>10:00 — 14:00</b></div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
