export const MONTH_NAMES = [
  'كانون الثاني',
  'شباط',
  'آذار',
  'نيسان',
  'أيار',
  'حزيران',
  'تموز',
  'آب',
  'أيلول',
  'تشرين الأول',
  'تشرين الثاني',
  'كانون الأول',
]

export function monthName(m: number): string {
  return MONTH_NAMES[Math.max(0, Math.min(11, m - 1))] ?? ''
}

export function fmt(n: number): string {
  const v = Math.round(n || 0)
  const neg = v < 0
  const s = Math.abs(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return (neg ? '-' : '') + s
}

export function round(n: number): number {
  return Math.round(n)
}

export function money(n: number): string {
  return fmt(n) + ' د.ع'
}

export function moneyShort(n: number): string {
  const v = Math.abs(n || 0)
  if (v >= 1000000000) return fmt(n / 1000000000) + ' مليار'
  if (v >= 1000000) return fmt(n / 1000000) + ' مليون'
  if (v >= 1000) return fmt(n / 1000) + ' ألف'
  return fmt(n)
}

export function pct(n: number): string {
  return fmt(n * 100) + '%'
}

export function todayIso(): string {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

export function nowYear(): number {
  return new Date().getFullYear()
}

export function nowMonth(): number {
  return new Date().getMonth() + 1
}

export function fmtDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

export function fmtDateTime(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return `${fmtDate(iso)} — ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function fmtMoney(n: number): string {
  return fmt(n) + ' د.ع'
}

export function fiscalPeriodLabel(year: number, month: number): string {
  return `${monthName(month)} ${year}`
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9)
}

export function downloadText(filename: string, content: string, mime = 'text/plain'): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + (b || 0), 0)
}
