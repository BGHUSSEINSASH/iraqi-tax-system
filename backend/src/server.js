import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { pool, query, withTransaction, initSchema } from './db.js'
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

const app = express()
app.disable('x-powered-by')

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc:     ["'self'", 'data:'],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      scriptSrc:  ["'self'"],
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
app.use('/api/', rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false }))

const otpRequestLimiter = rateLimit({
  windowMs: 60_000, max: 5,
  message: { error: 'Too many OTP requests. Please wait and retry.' },
})
const registerLimiter = rateLimit({
  windowMs: 15 * 60_000, max: 15,
  message: { error: 'Too many registration attempts. Please retry later.' },
})

// ── helpers ──────────────────────────────────────────────────────────────────
async function audit(action, details, req, actor = 'system') {
  try {
    await query(
      `INSERT INTO audit_logs (id, action, actor, details, ip, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [newId('aud'), action, actor, details, req.ip, nowIso()],
    )
  } catch (err) {
    console.error('audit error:', err.message)
  }
}

function validateOwnerInput(body) {
  const { ownerIdType, ownerIdentifier } = body || {}
  if (!['nationalId', 'taxNumber', 'phoneOtp'].includes(ownerIdType)) return 'Invalid ownerIdType'
  if (!ownerIdentifier || String(ownerIdentifier).trim().length < 3) return 'ownerIdentifier is required'
  return null
}

// ── routes ────────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'tax-iq-backend', db: 'postgresql', time: nowIso() })
})

// ── tax calculate ─────────────────────────────────────────────────────────────
app.post('/api/tax/calculate', requireAuth, (req, res) => {
  const { taxableIncome, deductions, rate, fixedTax } = req.body || {}
  const result = calculateTaxSummary({ taxableIncome, deductions, rate, fixedTax })
  res.json({ ok: true, data: result, calculatedBy: req.user?.username || 'system', calculatedAt: nowIso() })
})

// ── captcha ───────────────────────────────────────────────────────────────────
app.post('/api/captcha/challenge', async (req, res) => {
  try {
    const { question, answer } = randomCaptcha()
    const id = newId('cap')
    const now = nowIso()
    const expiresAt = addSeconds(now, config.captchaTtlSeconds)
    const answerHash = await hashText(answer)
    await query(
      `INSERT INTO captcha_challenges (id, question, answer_hash, expires_at, used, created_at)
       VALUES ($1, $2, $3, $4, FALSE, $5)`,
      [id, question, answerHash, expiresAt, now],
    )
    res.json({ captchaId: id, question, expiresAt })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── OTP request ───────────────────────────────────────────────────────────────
app.post('/api/otp/request', otpRequestLimiter, async (req, res) => {
  const validationError = validateOwnerInput(req.body)
  if (validationError) return res.status(400).json({ error: validationError })

  const { ownerIdType, ownerIdentifier, phone, captchaId, captchaAnswer } = req.body
  if (!captchaId || !captchaAnswer) return res.status(400).json({ error: 'Captcha is required' })

  try {
    const capRes = await query(`SELECT * FROM captcha_challenges WHERE id = $1`, [captchaId])
    const captcha = capRes.rows[0]
    if (!captcha || captcha.used)       return res.status(400).json({ error: 'Invalid captcha challenge' })
    if (isExpired(captcha.expires_at))  return res.status(400).json({ error: 'Captcha expired' })

    const captchaOk = await verifyHash(String(captchaAnswer).trim(), captcha.answer_hash)
    if (!captchaOk) return res.status(400).json({ error: 'Invalid captcha answer' })

    await query(`UPDATE captcha_challenges SET used = TRUE WHERE id = $1`, [captchaId])

    const ownerKey = makeOwnerKey(ownerIdType, ownerIdentifier)
    const existOwner = await query(`SELECT id FROM owners WHERE owner_key = $1 AND deleted_at IS NULL`, [ownerKey])
    if (existOwner.rows.length) {
      await audit('registration.blocked.duplicate_owner', `ownerKey=${ownerKey}`, req)
      return res.status(409).json({ error: 'Owner already has a registered company' })
    }

    const now = nowIso()
    const expiresAt = addSeconds(now, config.otpTtlSeconds)
    const code = generateOtpCode()
    const codeHash = await hashText(code)

    await query(
      `INSERT INTO otp_codes (id, owner_key, phone, code_hash, expires_at, attempts, verified, created_at)
       VALUES ($1, $2, $3, $4, $5, 0, FALSE, $6)`,
      [newId('otp'), ownerKey, phone || null, codeHash, expiresAt, now],
    )
    await audit('otp.requested', `ownerKey=${ownerKey}`, req)

    const response = { message: 'OTP generated', expiresAt }
    if (config.showDemoOtp) response.demoOtp = code
    res.json(response)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── OTP verify ────────────────────────────────────────────────────────────────
app.post('/api/otp/verify', async (req, res) => {
  const validationError = validateOwnerInput(req.body)
  if (validationError) return res.status(400).json({ error: validationError })

  const { ownerIdType, ownerIdentifier, otpCode } = req.body
  if (!otpCode) return res.status(400).json({ error: 'otpCode is required' })

  try {
    const ownerKey = makeOwnerKey(ownerIdType, ownerIdentifier)
    const otpRes = await query(
      `SELECT * FROM otp_codes WHERE owner_key = $1 ORDER BY created_at DESC LIMIT 1`,
      [ownerKey],
    )
    const otp = otpRes.rows[0]
    if (!otp)                               return res.status(400).json({ error: 'No OTP request found' })
    if (isExpired(otp.expires_at))          return res.status(400).json({ error: 'OTP expired' })
    if (otp.verified)                       return res.status(400).json({ error: 'OTP already used' })
    if (otp.attempts >= config.otpMaxVerifyAttempts) return res.status(429).json({ error: 'Too many OTP attempts' })

    const ok = await verifyHash(String(otpCode).trim(), otp.code_hash)
    if (!ok) {
      await query(`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1`, [otp.id])
      return res.status(400).json({ error: 'Invalid OTP code' })
    }

    await query(`UPDATE otp_codes SET verified = TRUE WHERE id = $1`, [otp.id])

    const token = newId('otpv')
    const now = nowIso()
    const expiresAt = addSeconds(now, config.otpTtlSeconds)
    await query(
      `INSERT INTO otp_verifications (id, owner_key, otp_token, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [newId('ovr'), ownerKey, token, expiresAt, now],
    )
    await audit('otp.verified', `ownerKey=${ownerKey}`, req)
    res.json({ otpToken: token, expiresAt })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── Company register ──────────────────────────────────────────────────────────
app.post('/api/companies/register', registerLimiter, async (req, res) => {
  const validationError = validateOwnerInput(req.body)
  if (validationError) return res.status(400).json({ error: validationError })

  const {
    ownerIdType, ownerIdentifier, ownerPhone, ownerEmail,
    companyName, taxId, activity, sector, address, phone, email, notes,
    otpToken, adminUsername, adminPassword, adminName,
  } = req.body

  if (!companyName || String(companyName).trim().length < 2)
    return res.status(400).json({ error: 'companyName is required' })
  if (!otpToken)
    return res.status(400).json({ error: 'otpToken is required' })
  if (!adminUsername || !adminPassword || !adminName)
    return res.status(400).json({ error: 'Admin credentials are required' })

  try {
    const ownerKey = makeOwnerKey(ownerIdType, ownerIdentifier)

    const verRes = await query(
      `SELECT * FROM otp_verifications WHERE owner_key = $1 AND otp_token = $2 ORDER BY created_at DESC LIMIT 1`,
      [ownerKey, otpToken],
    )
    const ver = verRes.rows[0]
    if (!ver)                      return res.status(400).json({ error: 'Invalid OTP token' })
    if (isExpired(ver.expires_at)) return res.status(400).json({ error: 'OTP token expired' })

    const existOwner = await query(`SELECT id FROM owners WHERE owner_key = $1 AND deleted_at IS NULL`, [ownerKey])
    if (existOwner.rows.length) {
      await audit('registration.blocked.duplicate_owner', `ownerKey=${ownerKey}`, req)
      return res.status(409).json({ error: 'Owner already has a registered company' })
    }

    const existUser = await query(`SELECT id FROM users WHERE lower(username) = lower($1)`, [String(adminUsername).trim()])
    if (existUser.rows.length) return res.status(409).json({ error: 'Admin username already exists' })

    const now = nowIso()
    const ownerId = newId('own')
    const companyId = newId('com')
    const userId = newId('usr')
    const passwordHash = await hashText(String(adminPassword))

    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO owners (id, owner_id_type, owner_identifier_raw, owner_identifier_normalized,
           owner_key, owner_phone, owner_email, otp_verified_at, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [ownerId, ownerIdType, String(ownerIdentifier).trim(), normalizeIdentifier(ownerIdentifier),
         ownerKey, ownerPhone || null, ownerEmail || null, now, now],
      )
      await client.query(
        `INSERT INTO companies (id, owner_id, name, tax_id, activity, sector, address, phone, email, notes, status, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'active',$11)`,
        [companyId, ownerId, String(companyName).trim(), taxId ? String(taxId).trim() : null,
         activity || null, sector || 'private', address || null, phone || null, email || null, notes || null, now],
      )
      await client.query(
        `INSERT INTO users (id, company_id, username, password_hash, name, role, status, created_at)
         VALUES ($1,$2,$3,$4,$5,'admin','active',$6)`,
        [userId, companyId, String(adminUsername).trim(), passwordHash, String(adminName).trim(), now],
      )
      await client.query(`DELETE FROM otp_verifications WHERE owner_key = $1`, [ownerKey])
    })

    await audit('company.registered', `companyId=${companyId};ownerKey=${ownerKey}`, req, String(adminUsername).trim())

    res.status(201).json({
      message: 'Company registered successfully',
      company: { id: companyId, name: String(companyName).trim(), taxId: taxId || '',
        ownerIdType, ownerIdentifier: String(ownerIdentifier).trim(),
        ownerPhone: ownerPhone || '', ownerEmail: ownerEmail || '', status: 'active', createdAt: now },
      admin: { id: userId, username: String(adminUsername).trim(), name: String(adminName).trim(),
        role: 'admin', status: 'active' },
    })
  } catch (err) {
    console.error(err)
    const msg = String(err?.message || '')
    if (msg.includes('idx_companies_tax_id_unique')) return res.status(409).json({ error: 'Tax ID already registered' })
    if (msg.includes('owners_owner_key'))            return res.status(409).json({ error: 'Owner already has a registered company' })
    res.status(500).json({ error: 'Failed to register company' })
  }
})

// ── Login ─────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) return res.status(400).json({ error: 'username and password are required' })

  try {
    const userRes = await query(`SELECT * FROM users WHERE lower(username) = lower($1) LIMIT 1`, [String(username).trim()])
    const user = userRes.rows[0]
    if (!user)                      return res.status(401).json({ error: 'Invalid credentials' })
    if (user.status === 'suspended') return res.status(403).json({ error: 'User is suspended' })

    const ok = await verifyHash(String(password), user.password_hash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

    const token = signToken({ sub: user.id, username: user.username, companyId: user.company_id, role: user.role })

    let company = null
    if (user.company_id) {
      const compRes = await query(`SELECT * FROM companies WHERE id = $1 LIMIT 1`, [user.company_id])
      company = compRes.rows[0] || null
    }

    await audit('auth.login.success', `username=${user.username}`, req, user.username)

    res.json({
      token,
      user:    { id: user.id, username: user.username, name: user.name, role: user.role, status: user.status },
      company: company ? { id: company.id, name: company.name, taxId: company.tax_id || '', status: company.status } : null,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

// ── start ─────────────────────────────────────────────────────────────────────
if (config.nodeEnv !== 'test') {
  initSchema()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`✓ Backend API listening on http://localhost:${PORT}`)
        console.log(`✓ PostgreSQL: ${config.pgHost}:${config.pgPort}/${config.pgDatabase}`)
      })
    })
    .catch((err) => {
      console.error('Failed to initialize database schema:', err)
      process.exit(1)
    })
}

export { app }
