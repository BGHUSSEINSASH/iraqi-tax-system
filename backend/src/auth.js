import jwt from 'jsonwebtoken'
import { config } from './config.js'

export function signToken(payload) {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtTtlSeconds,
  })
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret)
}

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    req.user = verifyToken(token)
    return next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
