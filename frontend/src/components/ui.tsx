import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { X, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import clsx from 'clsx'
import { fmt } from '../lib/format'
import { useI18n } from '../i18n'

export function cx(...args: (string | false | null | undefined)[]): string {
  return clsx(...args)
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('card', className)}>{children}</div>
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
      <div>
        <h3 className="text-base font-bold text-ink-800">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  )
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('p-5', className)}>{children}</div>
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-base' }
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
  }
  return (
    <button className={cx(variants[variant], sizes[size], className)} {...rest}>
      {children}
    </button>
  )
}

export function IconBtn({
  children,
  onClick,
  title,
  tone = 'default',
}: {
  children: ReactNode
  onClick?: () => void
  title?: string
  tone?: 'default' | 'danger'
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cx(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent transition',
        tone === 'danger'
          ? 'text-red-600 hover:bg-red-50'
          : 'text-ink-500 hover:bg-ink-100 hover:text-ink-800',
      )}
    >
      {children}
    </button>
  )
}

export type Tone = 'brand' | 'green' | 'red' | 'amber' | 'blue' | 'slate' | 'purple'

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: Tone }) {
  const tones: Record<Tone, string> = {
    brand: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200',
    green: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    red: 'bg-red-50 text-red-700 ring-1 ring-red-200',
    amber: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    blue: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
    slate: 'bg-ink-100 text-ink-600 ring-1 ring-ink-200',
    purple: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  }
  return <span className={cx('badge', tones[tone])}>{children}</span>
}

export function Field({
  label,
  children,
  error,
  hint,
  required,
}: {
  label: string
  children: ReactNode
  error?: string
  hint?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="label">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input {...props} className={cx('input', props.invalid && 'input-error', props.className)} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx('input min-h-[80px]', props.className)} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx('input cursor-pointer', props.className)} />
}

export function MoneyInput({
  value,
  onChange,
  placeholder,
  disabled,
  className,
}: {
  value: number
  onChange: (v: number) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}) {
  const { t } = useI18n()
  const [text, setText] = useState(value ? String(value) : '')
  const [focus, setFocus] = useState(false)

  useEffect(() => {
    if (!focus) setText(value ? String(value) : '')
  }, [value, focus])

  const formatCommas = (t: string) => {
    const clean = t.replace(/[^\d.]/g, '')
    const parts = clean.split('.')
    const int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return parts.length > 1 ? `${int}.${parts.slice(1).join('')}` : int
  }

  const commit = (t: string) => {
    const clean = t.replace(/[^\d.-]/g, '')
    const n = parseFloat(clean)
    onChange(isNaN(n) ? 0 : n)
  }

  return (
    <div className={cx('relative', className)}>
      <input
        className={cx('input pl-14 text-left')}
        inputMode="numeric"
        dir="ltr"
        placeholder={placeholder ?? '0'}
        value={focus ? text : value ? fmt(value) : ''}
        disabled={disabled}
        onFocus={() => {
          setFocus(true)
          setText(value ? formatCommas(String(value)) : '')
        }}
        onBlur={() => {
          setFocus(false)
          commit(text)
        }}
        onChange={(e) => {
          const formatted = formatCommas(e.target.value)
          setText(formatted)
          commit(formatted)
        }}
      />
      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-xs text-ink-400">
        {t('common.currency')}
      </span>
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2"
    >
      <span
        className={cx(
          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition',
          checked ? 'bg-brand-600' : 'bg-ink-300',
        )}
      >
        <span
          className={cx(
            'inline-block h-4 w-4 transform rounded-full bg-white shadow transition',
            checked ? '-translate-x-4' : 'translate-x-1',
          )}
        />
      </span>
      {label && <span className="text-sm text-ink-700">{label}</span>}
    </button>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const { t } = useI18n()
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open) return null
  const sizes = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm animate-fadein" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cx(
          'relative z-10 max-h-[90vh] w-full overflow-hidden rounded-2xl bg-white shadow-pop animate-pop',
          sizes[size],
        )}
      >
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h3 className="text-base font-bold text-ink-800">{title}</h3>
          <IconBtn onClick={onClose} title={t('common.close')}>
            <X size={18} />
          </IconBtn>
        </div>
        <div className="max-h-[65vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-ink-100 bg-ink-50 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: ReactNode
  confirmText?: string
}) {
  const { t } = useI18n()
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertTriangle size={20} />
        </div>
        <div className="text-sm text-ink-600">{message}</div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {confirmText ?? t('common.confirmDelete')}
        </Button>
      </div>
    </Modal>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  const { t } = useI18n()
  return (
    <div className={cx('relative', className)}>
      <input
        className="input pr-9"
        placeholder={placeholder ?? t('common.search')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <svg
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
  )
}

export interface Column<T> {
  key: string
  title: ReactNode
  render?: (row: T) => ReactNode
  total?: (rows: T[]) => number
  className?: string
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  empty,
  onRowClick,
  dense,
}: {
  columns: Column<T>[]
  rows: T[]
  empty?: ReactNode
  onRowClick?: (row: T) => void
  dense?: boolean
}) {
  const { t } = useI18n()
  const showFooter = columns.some((c) => c.total)
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse">
        <thead>
          <tr className="border-b border-ink-200 bg-ink-50">
            {columns.map((c) => (
              <th key={c.key} className={cx('th', c.className)}>
                {c.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-ink-400">
                {empty ?? t('common.noData')}
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row)}
              className={cx('tr-hover border-b border-ink-100', onRowClick && 'cursor-pointer')}
            >
              {columns.map((c) => (
                <td key={c.key} className={cx('td', dense && 'py-2.5', c.className)}>
                  {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {showFooter && (
          <tfoot>
            <tr className="border-t-2 border-ink-200 bg-ink-50 font-bold">
              {columns.map((c) => (
                <td key={c.key} className="td">
                  {c.total ? fmt(c.total(rows)) : ''}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}

export function StatCard({
  icon,
  label,
  value,
  sub,
  tone = 'brand',
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  sub?: ReactNode
  tone?: Tone
}) {
  const tones: Record<Tone, string> = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-sky-50 text-sky-600',
    slate: 'bg-ink-100 text-ink-600',
    purple: 'bg-violet-50 text-violet-600',
  }
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={cx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', tones[tone])}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-ink-500">{label}</p>
          <p className="truncate text-lg font-bold text-ink-800">{value}</p>
          {sub && <p className="truncate text-xs text-ink-400">{sub}</p>}
        </div>
      </div>
    </Card>
  )
}

export function EmptyState({ icon, title, desc, action }: { icon?: ReactNode; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      {icon && <div className="mb-3 text-ink-300">{icon}</div>}
      <h4 className="text-base font-bold text-ink-700">{title}</h4>
      {desc && <p className="mt-1 max-w-sm text-sm text-ink-400">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cx('text-xl font-bold text-ink-800', className)}>{children}</h2>
}

export function PageHead({
  title,
  desc,
  actions,
}: {
  title: string
  desc?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">{title}</h1>
        {desc && <p className="mt-1 text-sm text-ink-500">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { id: T; label: ReactNode }[]
  value: T
  onChange: (id: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl bg-ink-100 p-1">
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onChange(it.id)}
          className={cx(
            'rounded-lg px-4 py-1.5 text-sm font-medium transition',
            value === it.id ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-500 hover:text-ink-800',
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}

interface ToastItem {
  id: number
  type: 'success' | 'error' | 'info'
  msg: string
}

const ToastCtx = createContext<{ push: (type: ToastItem['type'], msg: string) => void } | null>(null)

export function useToast() {
  const v = useContext(ToastCtx)
  if (!v) throw new Error('useToast must be used within ToastProvider')
  return v
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const push = useCallback((type: ToastItem['type'], msg: string) => {
    const id = Date.now() + Math.random()
    setItems((prev) => [...prev, { id, type, msg }])
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 left-4 z-[70] flex w-80 flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={cx(
              'flex items-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm shadow-lg animate-slidein',
              t.type === 'success' && 'border-emerald-200 text-emerald-800',
              t.type === 'error' && 'border-red-200 text-red-700',
              t.type === 'info' && 'border-sky-200 text-sky-800',
            )}
          >
            {t.type === 'success' && <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />}
            {t.type === 'error' && <AlertTriangle size={18} className="shrink-0 text-red-500" />}
            {t.type === 'info' && <Info size={18} className="shrink-0 text-sky-500" />}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

