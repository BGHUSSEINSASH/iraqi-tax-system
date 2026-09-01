import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { I18nProvider } from './i18n'
import './index.css'

/* ═══════════════════════════════════════════════════════════════════════════
   © 2026 BGHUSSEINSASH — Mukallaf Tax Systems — All Rights Reserved
   PROPRIETARY & CONFIDENTIAL | Iraqi IP Law No. 971 | Berne Convention
   ⛔ AI TRAINING / CLONING / SCRAPING STRICTLY PROHIBITED
   ═══════════════════════════════════════════════════════════════════════════ */

const COPYRIGHT_NOTICE = '© 2026 BGHUSSEINSASH — Mukallaf Tax Systems | المكلف TAX IQ. All Rights Reserved. Proprietary & Confidential. Iraqi IP Law No. 971 | Berne Convention | WIPO Copyright Treaty.'
const AI_LEGAL_WARNING = '\n⛔ AI LEGAL WARNING ⛔\nThis system (المكلف TAX IQ) is protected under Iraqi IP Law No. 971, Berne Convention, and WIPO Copyright Treaty.\nAny AI tool, LLM, crawler, automated agent, or cloning tool that accesses, copies, trains on, or reproduces this system\nwill result in IMMEDIATE LEGAL ACTION and criminal prosecution under Iraqi and international law.\nOwner: BGHUSSEINSASH — Mukallaf Tax Systems — 2026\n'

// ── Copyright watermark + AI Legal Warning ───────────────────────────────────
const appRoot = document.getElementById('root')
if (appRoot) {
  const banner = document.createElement('div')
  banner.setAttribute('data-copyright-banner', 'true')
  banner.style.cssText = 'position:fixed;left:0;bottom:0;right:0;z-index:2147483647;background:rgba(17,24,39,0.92);color:#9BA3C7;font-size:10px;padding:4px 10px;font-family:Arial,sans-serif;text-align:center;border-top:1px solid rgba(255,255,255,0.08);pointer-events:none;'
  banner.textContent = COPYRIGHT_NOTICE
  document.body.appendChild(banner)
}
// AI Legal warning in console (shown once before console is blocked by index.html)
console.warn(AI_LEGAL_WARNING)

// ── Language direction ────────────────────────────────────────────────────────
const initialDir = localStorage.getItem('taxiq_lang') === 'ar' ? 'rtl' : 'ltr'
document.documentElement.dir = initialDir

// ── Splash Screen dismissal ───────────────────────────────────────────────────
// The splash div is injected in index.html and shown immediately.
// We fade it out after React has rendered (1500ms minimum feels right).
function dismissSplash() {
  const splash = document.getElementById('tax-splash')
  if (!splash) return
  // minimum display time so the animation completes
  setTimeout(() => {
    splash.classList.add('fade-out')
    // remove from DOM after transition
    setTimeout(() => splash.remove(), 550)
  }, 1400)
}

// ── Mount React ───────────────────────────────────────────────────────────────
ReactDOM.createRoot(appRoot!).render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>,
)

// Dismiss after mount + minimum delay
dismissSplash()
