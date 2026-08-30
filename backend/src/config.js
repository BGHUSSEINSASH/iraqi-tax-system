const asNumber = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const rawAllowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.CLIENT_ORIGIN || 'http://localhost:5173')

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: asNumber(process.env.PORT, 4000),
  dbPath: process.env.DB_PATH || './data/tax-iq.db',
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret-in-production',
  jwtTtlSeconds: asNumber(process.env.JWT_TTL_SECONDS, 3600),
  otpTtlSeconds: asNumber(process.env.OTP_TTL_SECONDS, 300),
  captchaTtlSeconds: asNumber(process.env.CAPTCHA_TTL_SECONDS, 180),
  otpMaxVerifyAttempts: asNumber(process.env.OTP_MAX_VERIFY_ATTEMPTS, 5),
  showDemoOtp: process.env.SHOW_DEMO_OTP === 'true' || process.env.NODE_ENV !== 'production',
  allowedOrigins: Array.from(new Set(
    String(rawAllowedOrigins)
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  )),
}

export default config
