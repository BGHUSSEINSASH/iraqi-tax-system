const asNumber = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const rawAllowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  process.env.CLIENT_ORIGIN ||
  'http://localhost:5173'
)

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: asNumber(process.env.PORT, 4000),

  // PostgreSQL connection
  pgHost:     process.env.PG_HOST     || 'localhost',
  pgPort:     asNumber(process.env.PG_PORT, 5433),
  pgDatabase: process.env.PG_DATABASE || 'tax_iq',
  pgUser:     process.env.PG_USER     || 'tax_iq_user',
  pgPassword: process.env.PG_PASSWORD || '',
  pgSsl:      process.env.PG_SSL === 'true',

  jwtSecret:            process.env.JWT_SECRET || 'change-this-secret-in-production',
  jwtTtlSeconds:        asNumber(process.env.JWT_TTL_SECONDS, 3600),
  otpTtlSeconds:        asNumber(process.env.OTP_TTL_SECONDS, 300),
  captchaTtlSeconds:    asNumber(process.env.CAPTCHA_TTL_SECONDS, 180),
  otpMaxVerifyAttempts: asNumber(process.env.OTP_MAX_VERIFY_ATTEMPTS, 5),
  showDemoOtp:          process.env.SHOW_DEMO_OTP === 'true' || process.env.NODE_ENV !== 'production',

  allowedOrigins: Array.from(new Set(
    String(rawAllowedOrigins)
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean),
  )),
}

export default config
