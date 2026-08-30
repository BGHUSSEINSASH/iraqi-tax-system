import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { db } from './db.js'
import { config } from './config.js'
import { requireAuth, signToken } from './auth.js'
import { calculateTaxSummary } from './business/taxEngine.js'
import {
  addSeconds,
  generateOtpCode,
  hashText,
  isExpired,
  makeOwnerKey,
  newId,
  normalizeIdentifier,
  nowIso,
  randomCaptcha,
  verifyHash,
} from './security.js'

const PORT = config.port
const isProduction = config.nodeEnv === 'production'
const allowedOrigins = new Set(config.allowedOrigins)
const OTP_TTL_SECONDS = config.otpTtlSeconds
const CAPTCHA_TTL_SECONDS = config.captchaTtlSeconds
const OTP_MAX_VERIFY_ATTEMPTS = config.otpMaxVerifyAttempts
const SHOW_DEMO_OTP = config.showDemoOtp

const app = express()
app.disable('x-powered-by')
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", ...Array.from(allowedOrigins)],
    },
  },
  crossOriginResourcePolicy: { policy: 'same-site' },
  hidePoweredBy: true,
  noSniff: true,
  frameguard: { action: 'deny' },
  hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
}))
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  next()
})
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true)
    if (allowedOrigins.has(origin)) return callback(null, true)
    return callback(new Error('Origin not allowed by CORS'))
  },
  credentials: false,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}))
app.options('*', cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true)
    if (allowedOrigins.has(origin)) return callback(null, true)
    return callback(new Error('Origin not allowed by CORS'))
  },
  credentials: false,
}))
app.use(express.json({ limit: '300kb' }))

app.use('/api/', rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
}))

const otpRequestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many OTP requests. Please wait and retry.' },
})

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Too many registration attempts. Please retry later.' },
})

function audit(action, details, req, actor = 'system') {
  const stmt = db.prepare(`INSERT INTO audit_logs (id, action, actor, details, ip, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
  stmt.run(newId('aud'), action, actor, details, req.ip, nowIso())
}

function validateOwnerInput(body) {
  const ownerIdType = body?.ownerIdType
  const ownerIdentifier = body?.ownerIdentifier
  if (!['nationalId', 'taxNumber', 'phoneOtp'].includes(ownerIdType)) {
    return 'Invalid ownerIdType'
  }
  if (!ownerIdentifier || String(ownerIdentifier).trim().length < 3) {
    return 'ownerIdentifier is required'
  }
  return null
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'tax-iq-backend', time: nowIso() })
})

app.post('/api/tax/calculate', requireAuth, (req, res) => {
  const { taxableIncome, deductions, rate, fixedTax } = req.body || {}
  const result = calculateTaxSummary({
    taxableIncome,
    deductions,
    rate,
    fixedTax,
  })

  res.json({
    ok: true,
    data: result,
    calculatedBy: req.user?.username || 'system',
    calculatedAt: nowIso(),
  })
})

app.post('/api/captcha/challenge', async (req, res) => {
  const { question, answer } = randomCaptcha()
  const id = newId('cap')
  const now = nowIso()
  const expiresAt = addSeconds(now, CAPTCHA_TTL_SECONDS)
  const answerHash = await hashText(answer)
  db.prepare(`INSERT INTO captcha_challenges (id, question, answer_hash, expires_at, used, created_at) VALUES (?, ?, ?, ?, 0, ?)`)
    .run(id, question, answerHash, expiresAt, now)
  res.json({ captchaId: id, question, expiresAt })
})

app.post('/api/otp/request', otpRequestLimiter, async (req, res) => {
  const validationError = validateOwnerInput(req.body)
  if (validationError) return res.status(400).json({ error: validationError })

  const { ownerIdType, ownerIdentifier, phone, captchaId, captchaAnswer } = req.body
  if (!captchaId || !captchaAnswer) {
    return res.status(400).json({ error: 'Captcha is required' })
  }

  const captcha = db.prepare(`SELECT * FROM captcha_challenges WHERE id = ?`).get(captchaId)
  if (!captcha || captcha.used) return res.status(400).json({ error: 'Invalid captcha challenge' })
  if (isExpired(captcha.expires_at)) return res.status(400).json({ error: 'Captcha expired' })

  const captchaOk = await verifyHash(String(captchaAnswer).trim(), captcha.answer_hash)
  if (!captchaOk) return res.status(400).json({ error: 'Invalid captcha answer' })

  db.prepare(`UPDATE captcha_challenges SET used = 1 WHERE id = ?`).run(captchaId)

  const ownerKey = makeOwnerKey(ownerIdType, ownerIdentifier)
  const existingOwner = db.prepare(`SELECT id FROM owners WHERE owner_key = ? AND deleted_at IS NULL`).get(ownerKey)
  if (existingOwner) {
    audit('registration.blocked.duplicate_owner', `ownerKey=${ownerKey}`, req)
    return res.status(409).json({ error: 'Owner already has a registered company' })
  }

  const now = nowIso()
  const expiresAt = addSeconds(now, OTP_TTL_SECONDS)
  const code = generateOtpCode()
  const codeHash = await hashText(code)

  db.prepare(`INSERT INTO otp_codes (id, owner_key, phone, code_hash, expires_at, attempts, verified, created_at)
              VALUES (?, ?, ?, ?, ?, 0, 0, ?)`)
    .run(newId('otp'), ownerKey, phone || null, codeHash, expiresAt, now)

  audit('otp.requested', `ownerKey=${ownerKey}`, req)

  const response = {
    message: 'OTP generated',
    expiresAt,
  }

  if (SHOW_DEMO_OTP) {
    response.demoOtp = code
  }

  res.json(response)
})

app.post('/api/otp/verify', async (req, res) => {
  const validationError = validateOwnerInput(req.body)
  if (validationError) return res.status(400).json({ error: validationError })

  const { ownerIdType, ownerIdentifier, otpCode } = req.body
  if (!otpCode) return res.status(400).json({ error: 'otpCode is required' })

  const ownerKey = makeOwnerKey(ownerIdType, ownerIdentifier)
  const otp = db.prepare(`SELECT * FROM otp_codes WHERE owner_key = ? ORDER BY created_at DESC LIMIT 1`).get(ownerKey)
  if (!otp) return res.status(400).json({ error: 'No OTP request found' })
  if (isExpired(otp.expires_at)) return res.status(400).json({ error: 'OTP expired' })
  if (otp.verified) return res.status(400).json({ error: 'OTP already used' })
  if (otp.attempts >= OTP_MAX_VERIFY_ATTEMPTS) return res.status(429).json({ error: 'Too many OTP attempts' })

  const ok = await verifyHash(String(otpCode).trim(), otp.code_hash)
  if (!ok) {
    db.prepare(`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?`).run(otp.id)
    return res.status(400).json({ error: 'Invalid OTP code' })
  }

  db.prepare(`UPDATE otp_codes SET verified = 1 WHERE id = ?`).run(otp.id)

  const token = newId('otpv')
  const now = nowIso()
  const expiresAt = addSeconds(now, OTP_TTL_SECONDS)
  db.prepare(`INSERT INTO otp_verifications (id, owner_key, otp_token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)`)
    .run(newId('ovr'), ownerKey, token, expiresAt, now)

  audit('otp.verified', `ownerKey=${ownerKey}`, req)

  res.json({ otpToken: token, expiresAt })
})

app.post('/api/companies/register', registerLimiter, async (req, res) => {
  const validationError = validateOwnerInput(req.body)
  if (validationError) return res.status(400).json({ error: validationError })

  const {
    ownerIdType,
    ownerIdentifier,
    ownerPhone,
    ownerEmail,
    companyName,
    taxId,
    activity,
    sector,
    address,
    phone,
    email,
    notes,
    otpToken,
    adminUsername,
    adminPassword,
    adminName,
  } = req.body

  if (!companyName || String(companyName).trim().length < 2) {
    return res.status(400).json({ error: 'companyName is required' })
  }
  if (!otpToken) return res.status(400).json({ error: 'otpToken is required' })
  if (!adminUsername || !adminPassword || !adminName) {
    return res.status(400).json({ error: 'Admin credentials are required' })
  }

  const ownerKey = makeOwnerKey(ownerIdType, ownerIdentifier)
  const ver = db.prepare(`SELECT * FROM otp_verifications WHERE owner_key = ? AND otp_token = ? ORDER BY created_at DESC LIMIT 1`)
    .get(ownerKey, otpToken)
  if (!ver) return res.status(400).json({ error: 'Invalid OTP token' })
  if (isExpired(ver.expires_at)) return res.status(400).json({ error: 'OTP token expired' })

  const existingOwner = db.prepare(`SELECT id FROM owners WHERE owner_key = ? AND deleted_at IS NULL`).get(ownerKey)
  if (existingOwner) {
    audit('registration.blocked.duplicate_owner', `ownerKey=${ownerKey}`, req)
    return res.status(409).json({ error: 'Owner already has a registered company' })
  }

  const existingUsername = db.prepare(`SELECT id FROM users WHERE lower(username) = lower(?)`).get(String(adminUsername).trim())
  if (existingUsername) return res.status(409).json({ error: 'Admin username already exists' })

  const now = nowIso()
  const ownerId = newId('own')
  const companyId = newId('com')
  const userId = newId('usr')
  const passwordHash = await hashText(String(adminPassword))

  const tx = db.transaction(() => {
    db.prepare(`INSERT INTO owners (
      id, owner_id_type, owner_identifier_raw, owner_identifier_normalized,
      owner_key, owner_phone, owner_email, otp_verified_at, created_at, deleted_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`)
      .run(
        ownerId,
        ownerIdType,
        String(ownerIdentifier).trim(),
        normalizeIdentifier(ownerIdentifier),
        ownerKey,
        ownerPhone || null,
        ownerEmail || null,
        now,
        now,
      )

    db.prepare(`INSERT INTO companies (
      id, owner_id, name, tax_id, activity, sector, address, phone, email, notes, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`)
      .run(
        companyId,
        ownerId,
        String(companyName).trim(),
        taxId ? String(taxId).trim() : null,
        activity || null,
        sector || 'private',
        address || null,
        phone || null,
        email || null,
        notes || null,
        now,
      )

    db.prepare(`INSERT INTO users (
      id, company_id, username, password_hash, name, role, status, created_at
    ) VALUES (?, ?, ?, ?, ?, 'admin', 'active', ?)`)
      .run(
        userId,
        companyId,
        String(adminUsername).trim(),
        passwordHash,
        String(adminName).trim(),
        now,
      )

    db.prepare(`DELETE FROM otp_verifications WHERE owner_key = ?`).run(ownerKey)
  })

  try {
    tx()
  } catch (error) {
    const msg = String(error?.message || '')
    if (msg.includes('idx_companies_tax_id_unique')) {
      return res.status(409).json({ error: 'Tax ID already registered' })
    }
    if (msg.includes('owners.owner_key')) {
      return res.status(409).json({ error: 'Owner already has a registered company' })
    }
    return res.status(500).json({ error: 'Failed to register company' })
  }

  audit('company.registered', `companyId=${companyId};ownerKey=${ownerKey}`, req, String(adminUsername).trim())

  res.status(201).json({
    message: 'Company registered successfully',
    company: {
      id: companyId,
      name: String(companyName).trim(),
      taxId: taxId || '',
      ownerIdType,
      ownerIdentifier: String(ownerIdentifier).trim(),
      ownerPhone: ownerPhone || '',
      ownerEmail: ownerEmail || '',
      status: 'active',
      createdAt: now,
    },
    admin: {
      id: userId,
      username: String(adminUsername).trim(),
      name: String(adminName).trim(),
      role: 'admin',
      status: 'active',
    },
  })
})

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) return res.status(400).json({ error: 'username and password are required' })

  const user = db.prepare(`SELECT * FROM users WHERE lower(username) = lower(?) LIMIT 1`).get(String(username).trim())
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })
  if (user.status === 'suspended') return res.status(403).json({ error: 'User is suspended' })

  const ok = await verifyHash(String(password), user.password_hash)
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

  const token = signToken({
    sub: user.id,
    username: user.username,
    companyId: user.company_id,
    role: user.role,
  })

  const company = user.company_id
    ? db.prepare(`SELECT * FROM companies WHERE id = ? LIMIT 1`).get(user.company_id)
    : null

  audit('auth.login.success', `username=${user.username}`, req, user.username)

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      status: user.status,
    },
    company: company
      ? {
          id: company.id,
          name: company.name,
          taxId: company.tax_id || '',
          status: company.status,
        }
      : null,
  })
})

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

export { app }

if (config.nodeEnv !== 'test') {
  app.listen(PORT, () => {
    console.log(`Backend API listening on http://localhost:${PORT}`)
  })
}
