const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api'
const AUTH_TOKEN_KEY = 'taxiq_jwt'

function getStoredToken() {
  try {
    return sessionStorage.getItem(AUTH_TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

async function request(path: string, init?: RequestInit) {
  const token = getStoredToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = json?.error || `Request failed (${res.status})`
    throw new Error(message)
  }
  return json
}

export type OwnerIdType = 'nationalId' | 'taxNumber' | 'phoneOtp'

export function saveAuthToken(token: string) {
  try {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token)
  } catch {
    /* ignore */
  }
}

export function clearAuthToken() {
  try {
    sessionStorage.removeItem(AUTH_TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export async function loginWithBackend(payload: { username: string; password: string }) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function calculateTaxSummary(payload: {
  taxableIncome: number
  deductions?: number
  rate?: number
  fixedTax?: number
}) {
  return request('/tax/calculate', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function createCaptchaChallenge() {
  return request('/captcha/challenge', { method: 'POST' })
}

export async function requestOwnerOtp(payload: {
  ownerIdType: OwnerIdType
  ownerIdentifier: string
  phone?: string
  captchaId: string
  captchaAnswer: string
}) {
  return request('/otp/request', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function verifyOwnerOtp(payload: {
  ownerIdType: OwnerIdType
  ownerIdentifier: string
  otpCode: string
}) {
  return request('/otp/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function registerCompany(payload: {
  ownerIdType: OwnerIdType
  ownerIdentifier: string
  ownerPhone?: string
  ownerEmail?: string
  companyName: string
  taxId?: string
  activity?: string
  sector?: 'private' | 'public' | 'mixed'
  address?: string
  phone?: string
  email?: string
  notes?: string
  otpToken: string
  adminUsername: string
  adminPassword: string
  adminName: string
}) {
  return request('/companies/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
