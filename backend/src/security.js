import bcrypt from 'bcryptjs'
import { customAlphabet, nanoid } from 'nanoid'

const otpDigits = customAlphabet('0123456789', 6)

export function nowIso() {
  return new Date().toISOString()
}

export function addSeconds(iso, seconds) {
  return new Date(new Date(iso).getTime() + seconds * 1000).toISOString()
}

export function isExpired(iso) {
  return new Date(iso).getTime() <= Date.now()
}

export function normalizeIdentifier(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '')
}

export function makeOwnerKey(ownerIdType, ownerIdentifier) {
  return `${ownerIdType}:${normalizeIdentifier(ownerIdentifier)}`
}

export function newId(prefix) {
  return `${prefix}_${nanoid(12)}`
}

export function generateOtpCode() {
  return otpDigits()
}

export async function hashText(value) {
  return bcrypt.hash(value, 10)
}

export async function verifyHash(value, hash) {
  return bcrypt.compare(value, hash)
}

export function randomCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1
  const b = Math.floor(Math.random() * 9) + 1
  const isAdd = Math.random() > 0.4
  if (isAdd) {
    return { question: `${a} + ${b} = ?`, answer: String(a + b) }
  }
  const high = Math.max(a, b)
  const low = Math.min(a, b)
  return { question: `${high} - ${low} = ?`, answer: String(high - low) }
}
