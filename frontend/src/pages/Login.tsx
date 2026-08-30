import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { Button, Field, Input, Select } from '../components/ui'
import { useI18n } from '../i18n'
import { createCaptchaChallenge, registerCompany, requestOwnerOtp, verifyOwnerOtp, type OwnerIdType } from '../lib/backendApi'

// ── Brand Mark (matches PDF identity) ────────────────────────────────────────
function LoginMark() {
  return (
    <div className="flex flex-col items-center gap-3 mb-8">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl shadow-lg" style={{ background: '#2D3580' }}>
        <svg width="52" height="52" viewBox="0 0 56 56" fill="none" aria-hidden="true">
          <polygon points="8,46 26,8 35,46" fill="white" />
          <polygon points="33,46 45,16 52,46" fill="#9BA3C7" opacity="0.85" />
        </svg>
      </div>
      <div className="text-center">
        <div className="text-2xl font-black tracking-tight" style={{ color: '#2D3580' }}>المكلف</div>
        <div className="text-xs font-medium text-ink-400 tracking-wider mt-0.5">حلول ضريبية ذكية</div>
      </div>
    </div>
  )
}

export default function Login() {
  const { data, login, setCompanyName, add, setActiveCompany } = useApp()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyNameInput] = useState('')
  const [ownerIdType, setOwnerIdType] = useState<OwnerIdType>('taxNumber')
  const [ownerIdentifier, setOwnerIdentifier] = useState('')
  const [ownerPhone, setOwnerPhone] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpToken, setOtpToken] = useState('')
  const [captchaId, setCaptchaId] = useState('')
  const [captchaQuestion, setCaptchaQuestion] = useState('')
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [loadingOtp, setLoadingOtp] = useState(false)
  const [loadingRegister, setLoadingRegister] = useState(false)
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const needsCompanySetup = data.companies.length === 0

  useEffect(() => {
    const loadCaptcha = async () => {
      if (!needsCompanySetup) return
      try {
        const c = await createCaptchaChallenge()
        setCaptchaId(c.captchaId)
        setCaptchaQuestion(c.question)
      } catch {
        setError('تعذر إنشاء اختبار Captcha. تأكد من تشغيل الخادم الخلفي.')
      }
    }
    loadCaptcha()
  }, [needsCompanySetup])

  const refreshCaptcha = async () => {
    const c = await createCaptchaChallenge()
    setCaptchaId(c.captchaId)
    setCaptchaQuestion(c.question)
    setCaptchaAnswer('')
  }

  const handleRequestOtp = async () => {
    if (!ownerIdentifier.trim()) {
      setError('يرجى إدخال معرف المالك الفريد')
      return
    }
    if (!captchaId || !captchaAnswer.trim()) {
      setError('يرجى حل اختبار Captcha قبل طلب OTP')
      return
    }

    try {
      setLoadingOtp(true)
      setError('')
      const result = await requestOwnerOtp({
        ownerIdType,
        ownerIdentifier,
        phone: ownerPhone,
        captchaId,
        captchaAnswer,
      })
      if (result?.demoOtp) {
        setError(`رمز OTP التجريبي: ${result.demoOtp}`)
      }
      await refreshCaptcha()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل طلب OTP')
    } finally {
      setLoadingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      setError('يرجى إدخال رمز OTP')
      return
    }
    try {
      setError('')
      const result = await verifyOwnerOtp({ ownerIdType, ownerIdentifier, otpCode })
      setOtpToken(result.otpToken)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل التحقق من OTP')
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (needsCompanySetup && !companyName.trim()) {
      setError('يرجى إدخال اسم الشركة')
      return
    }
    if (needsCompanySetup && !ownerIdentifier.trim()) {
      setError('يرجى إدخال معرف المالك الفريد')
      return
    }
    if (needsCompanySetup && !otpToken) {
      setError('يرجى التحقق من OTP أولاً')
      return
    }
    if (!username.trim() || !password) {
      setError(t('login.errorMissing'))
      return
    }
    if (needsCompanySetup) {
      try {
        setLoadingRegister(true)
        setError('')
        const reg = await registerCompany({
          ownerIdType,
          ownerIdentifier,
          ownerPhone,
          ownerEmail,
          companyName: companyName.trim(),
          otpToken,
          adminUsername: username.trim(),
          adminPassword: password,
          adminName: fullName.trim() || 'مدير النظام',
        })

        add('companies', {
          id: reg.company.id,
          name: reg.company.name,
          taxId: reg.company.taxId,
          activity: '',
          sector: 'private',
          address: '',
          phone: reg.company.ownerPhone || '',
          email: reg.company.ownerEmail || '',
          notes: '',
          createdAt: reg.company.createdAt,
          ownerIdType: reg.company.ownerIdType,
          ownerIdentifier: reg.company.ownerIdentifier,
          ownerPhone: reg.company.ownerPhone || '',
          ownerEmail: reg.company.ownerEmail || '',
          status: reg.company.status,
        })
        setActiveCompany(reg.company.id)
        setCompanyName(reg.company.name)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'فشل إنشاء الشركة')
        return
      } finally {
        setLoadingRegister(false)
      }
    }
    const ok = await login(username, password)
    if (ok) {
      navigate('/dashboard')
    } else {
      setError(t('login.errorInvalid'))
    }
  }

  return (
    <div className="flex min-h-screen bg-ink-100">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 lg:flex" style={{ background: 'linear-gradient(135deg, #2D3580 0%, #1e2461 60%, #0f1229 100%)' }}>
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-[#9BA3C7]/10 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
            <svg width="32" height="32" viewBox="0 0 56 56" fill="none" aria-hidden="true">
              <polygon points="8,46 26,8 35,46" fill="white" />
              <polygon points="33,46 45,16 52,46" fill="#9BA3C7" opacity="0.85" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight">{t('app.name')}</div>
            <div className="text-xs font-medium tracking-widest" style={{ color: '#9BA3C7' }}>حلول ضريبية ذكية</div>
          </div>
        </div>
        <div className="relative">
          <h1 className="text-4xl font-black leading-snug text-white">
            {t('login.heroTitleA')}
            <br />
            {t('login.heroTitleB')}
          </h1>
          <p className="mt-4 max-w-md text-white/70">{t('login.heroDesc')}</p>
          <div className="mt-8 flex flex-wrap gap-2">
            {[t('login.chip1'), t('login.chip2'), t('login.chip3'), t('login.chip4')].map((x) => (
              <span key={x} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
                {x}
              </span>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-emerald-200/60">{t('login.ministry')}</div>
      </div>

      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: '#2D3580' }}>
              <svg width="30" height="30" viewBox="0 0 56 56" fill="none" aria-hidden="true">
                <polygon points="8,46 26,8 35,46" fill="white" />
                <polygon points="33,46 45,16 52,46" fill="#9BA3C7" opacity="0.85" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight" style={{ color: '#2D3580' }}>{t('app.name')}</div>
              <div className="text-xs font-medium tracking-wider text-ink-400">حلول ضريبية ذكية</div>
            </div>
          </div>
          {/* Desktop logo (shown on lg above form) */}
          <div className="hidden lg:block">
            <LoginMark />
          </div>
          <h2 className="text-2xl font-bold text-ink-900">{t('login.title')}</h2>
          <p className="mt-1 text-sm text-ink-500">{t('login.subtitle')}</p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            {needsCompanySetup && (
              <>
                <Field label="اسم الشركة (حسب شهادة التسجيل)" required>
                  <Input
                    value={companyName}
                    onChange={(e) => {
                      setCompanyNameInput(e.target.value)
                      setError('')
                    }}
                    placeholder="أدخل اسم الشركة كما في شهادة التسجيل"
                    autoFocus
                  />
                </Field>
                <Field label="نوع معرف المالك" required>
                  <Select
                    value={ownerIdType}
                    onChange={(e) => {
                      setOwnerIdType(e.target.value as 'nationalId' | 'taxNumber' | 'phoneOtp')
                      setError('')
                    }}
                  >
                    <option value="taxNumber">الرقم الضريبي</option>
                    <option value="nationalId">رقم الهوية / السجل المدني</option>
                    <option value="phoneOtp">رقم الجوال (موثق OTP)</option>
                  </Select>
                </Field>
                <Field label="معرف المالك الفريد" required>
                  <Input
                    value={ownerIdentifier}
                    onChange={(e) => {
                      setOwnerIdentifier(e.target.value)
                      setError('')
                    }}
                    placeholder="أدخل المعرف الفريد للمالك"
                    dir="ltr"
                  />
                </Field>
                <Field label="رقم الجوال (للتحقق OTP)">
                  <Input
                    value={ownerPhone}
                    onChange={(e) => {
                      setOwnerPhone(e.target.value)
                      setError('')
                    }}
                    placeholder="07xxxxxxxxx"
                    dir="ltr"
                  />
                </Field>
                <Field label="البريد الإلكتروني للمالك (اختياري)">
                  <Input
                    value={ownerEmail}
                    onChange={(e) => {
                      setOwnerEmail(e.target.value)
                      setError('')
                    }}
                    placeholder="owner@company.iq"
                    dir="ltr"
                  />
                </Field>
                <Field label={`Captcha: ${captchaQuestion || '...'}`} required>
                  <div className="flex gap-2">
                    <Input
                      value={captchaAnswer}
                      onChange={(e) => {
                        setCaptchaAnswer(e.target.value)
                        setError('')
                      }}
                      placeholder="أدخل ناتج العملية"
                      dir="ltr"
                    />
                    <Button type="button" variant="secondary" onClick={() => refreshCaptcha()}>تحديث</Button>
                  </div>
                </Field>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={handleRequestOtp} disabled={loadingOtp}>
                    {loadingOtp ? 'جاري الطلب...' : 'طلب OTP'}
                  </Button>
                </div>
                <Field label="رمز OTP" required>
                  <div className="flex gap-2">
                    <Input
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(e.target.value)
                        setError('')
                      }}
                      placeholder="أدخل الرمز"
                      dir="ltr"
                    />
                    <Button type="button" variant="secondary" onClick={handleVerifyOtp}>تحقق OTP</Button>
                  </div>
                </Field>
                {otpToken && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                    تم التحقق من OTP بنجاح
                  </div>
                )}
                <Field label="الاسم الكامل لمدير الشركة" required>
                  <Input
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value)
                      setError('')
                    }}
                    placeholder="الاسم الكامل"
                  />
                </Field>
              </>
            )}
            <Field label={t('login.username')}>
              <Input
                dir="ltr"
                className="text-left"
                placeholder="admin"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  setError('')
                }}
              />
            </Field>
            <Field label={t('login.password')}>
              <div className="relative">
                <Input
                  dir="ltr"
                  className="pl-10 text-left"
                  type={show ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full py-2.5 text-base" disabled={loadingRegister}>
              {loadingRegister ? 'جاري إنشاء الشركة...' : t('login.submit')}
            </Button>
          </form>

          <div className="mt-8 rounded-xl border border-ink-200 bg-white p-4 text-xs text-ink-500">
            <p className="mb-1 font-bold text-ink-600">{t('login.demoTitle')}</p>
            <p>
              {t('login.director')}: <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono">admin</code> /{' '}
              <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono">admin123</code>
            </p>
            <p>
              {t('login.accountant')}: <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono">accountant</code> /{' '}
              <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono">123456</code>
            </p>
            <p>
              المؤسس: <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono">founder</code> /{' '}
              <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono">founder@2026</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

