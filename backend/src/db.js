import pg from 'pg'
import { config } from './config.js'

const { Pool } = pg

export const pool = new Pool({
  host:     config.pgHost,
  port:     config.pgPort,
  database: config.pgDatabase,
  user:     config.pgUser,
  password: config.pgPassword,
  ssl:      config.pgSsl ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err)
})

// Helper: run a query with optional parameters
export async function query(sql, params = []) {
  return pool.query(sql, params)
}

// Helper: run inside a transaction
export async function withTransaction(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// Initialize schema (CREATE TABLE IF NOT EXISTS)
export async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS owners (
      id                        TEXT PRIMARY KEY,
      owner_id_type             TEXT NOT NULL CHECK (owner_id_type IN ('nationalId','taxNumber','phoneOtp')),
      owner_identifier_raw      TEXT NOT NULL,
      owner_identifier_normalized TEXT NOT NULL,
      owner_key                 TEXT NOT NULL UNIQUE,
      owner_phone               TEXT,
      owner_email               TEXT,
      otp_verified_at           TIMESTAMPTZ,
      created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at                TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS companies (
      id         TEXT PRIMARY KEY,
      owner_id   TEXT NOT NULL UNIQUE REFERENCES owners(id),
      name       TEXT NOT NULL,
      tax_id     TEXT,
      activity   TEXT,
      sector     TEXT,
      address    TEXT,
      phone      TEXT,
      email      TEXT,
      notes      TEXT,
      status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','archived')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_tax_id_unique
      ON companies(tax_id)
      WHERE tax_id IS NOT NULL AND tax_id <> '';

    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      company_id    TEXT REFERENCES companies(id),
      username      TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name          TEXT NOT NULL,
      role          TEXT NOT NULL CHECK (role IN ('founder','admin','accountant')),
      status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS otp_codes (
      id         TEXT PRIMARY KEY,
      owner_key  TEXT NOT NULL,
      phone      TEXT,
      code_hash  TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      attempts   INTEGER NOT NULL DEFAULT 0,
      verified   BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_otp_owner_key ON otp_codes(owner_key);

    CREATE TABLE IF NOT EXISTS otp_verifications (
      id         TEXT PRIMARY KEY,
      owner_key  TEXT NOT NULL,
      otp_token  TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS captcha_challenges (
      id          TEXT PRIMARY KEY,
      question    TEXT NOT NULL,
      answer_hash TEXT NOT NULL,
      expires_at  TIMESTAMPTZ NOT NULL,
      used        BOOLEAN NOT NULL DEFAULT FALSE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id         TEXT PRIMARY KEY,
      action     TEXT NOT NULL,
      actor      TEXT,
      details    TEXT,
      ip         TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)
  console.log('PostgreSQL schema initialized ✓')
}
