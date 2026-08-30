import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { I18nProvider } from './i18n'
import './index.css'

const COPYRIGHT_NOTICE = '© 2026 BGHUSSEINSASH. All rights reserved. This software is proprietary and may not be copied, modified, redistributed, or used without written authorization.'

// ── Copyright watermark ──────────────────────────────────────────────────────
const appRoot = document.getElementById('root')
if (appRoot) {
  const banner = document.createElement('div')
  banner.setAttribute('data-copyright-banner', 'true')
  banner.style.cssText = 'position:fixed;left:0;bottom:0;right:0;z-index:2147483647;background:rgba(17,24,39,0.88);color:#9BA3C7;font-size:10px;padding:4px 10px;font-family:Arial,sans-serif;text-align:center;border-top:1px solid rgba(255,255,255,0.08);pointer-events:none;'
  banner.textContent = COPYRIGHT_NOTICE
  document.body.appendChild(banner)
}
console.info(COPYRIGHT_NOTICE)

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
