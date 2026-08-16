import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scale, Eye, EyeOff } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { Button, Field, Input } from '../components/ui'
import { useI18n } from '../i18n'

export default function Login() {
  const { login } = useApp()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError(t('login.errorMissing'))
      return
    }
    if (login(username, password)) {
      navigate('/dashboard')
    } else {
      setError(t('login.errorInvalid'))
    }
  }

  return (
    <div className="flex min-h-screen bg-ink-100">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand-900 to-ink-950 p-12 lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-emerald-400/10 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white">
            <Scale size={26} />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{t('app.name')}</div>
            <div className="text-sm font-medium tracking-widest text-emerald-200">{t('app.short')}</div>
          </div>
        </div>
        <div className="relative">
          <h1 className="text-4xl font-black leading-snug text-white">
            {t('login.heroTitleA')}
            <br />
            {t('login.heroTitleB')}
          </h1>
          <p className="mt-4 max-w-md text-emerald-100/80">{t('login.heroDesc')}</p>
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
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
              <Scale size={26} />
            </div>
            <div>
              <div className="text-2xl font-black text-ink-900">{t('app.name')}</div>
              <div className="text-sm font-medium tracking-widest text-brand-600">{t('app.short')}</div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-ink-900">{t('login.title')}</h2>
          <p className="mt-1 text-sm text-ink-500">{t('login.subtitle')}</p>

          <form onSubmit={submit} className="mt-8 space-y-5">
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
                autoFocus
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
            <Button type="submit" className="w-full py-2.5 text-base">
              {t('login.submit')}
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
          </div>
        </div>
      </div>
    </div>
  )
}

