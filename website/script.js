/* ══════════════════════════════════════════════════════════════════════════
   المكلف — Website Script
   ══════════════════════════════════════════════════════════════════════════ */

const APP_URL = 'http://127.0.0.1:5173/iraqi-tax-system/'

// ── Open app ──────────────────────────────────────────────────────────────────
function openApp() {
  window.open(APP_URL, '_blank')
}

// Attach CTA buttons
document.addEventListener('DOMContentLoaded', () => {
  const startBtns = document.querySelectorAll('#ctaStartBtn, .btn-primary[href="#cta"]')
  startBtns.forEach(btn => btn.addEventListener('click', e => { e.preventDefault(); openApp() }))

  const demoBtns = document.querySelectorAll('#ctaDemoBtn')
  demoBtns.forEach(btn => btn.addEventListener('click', e => {
    e.preventDefault()
    document.getElementById('interestForm')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }))
})

// ── Navbar scroll effect ──────────────────────────────────────────────────────
const navbar = document.getElementById('navbar')
window.addEventListener('scroll', () => {
  if (!navbar) return
  navbar.classList.toggle('scrolled', window.scrollY > 20)
}, { passive: true })

// ── Mobile menu ───────────────────────────────────────────────────────────────
const menuToggle  = document.getElementById('menuToggle')
const mobileMenu  = document.getElementById('mobileMenu')

menuToggle?.addEventListener('click', () => {
  mobileMenu?.classList.toggle('open')
})

function closeMobileMenu() {
  mobileMenu?.classList.remove('open')
}

// ── Scroll reveal ─────────────────────────────────────────────────────────────
const revealEls = document.querySelectorAll('.reveal')
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible')
      revealObserver.unobserve(entry.target)
    }
  })
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })

revealEls.forEach(el => revealObserver.observe(el))

// ── Animated counters ─────────────────────────────────────────────────────────
const counterEls = document.querySelectorAll('[data-target]')
const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return
    const el     = entry.target
    const target = parseInt(el.dataset.target, 10)
    const suffix = el.dataset.suffix || ''
    const dur    = 1600
    const start  = performance.now()
    const tick   = (now) => {
      const progress = Math.min((now - start) / dur, 1)
      const eased    = 1 - Math.pow(1 - progress, 3)
      el.textContent = Math.round(eased * target).toLocaleString('ar-EG') + suffix
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    counterObserver.unobserve(el)
  })
}, { threshold: 0.5 })

counterEls.forEach(el => counterObserver.observe(el))

// ── FAQ accordion ─────────────────────────────────────────────────────────────
function toggleFaq(btn) {
  const item = btn.closest('.faq-item')
  const isOpen = item.classList.contains('open')
  // close all
  document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'))
  // open clicked if it was closed
  if (!isOpen) item.classList.add('open')
}

// ── Copy to clipboard ─────────────────────────────────────────────────────────
function copyText(text, btn) {
  if (!navigator.clipboard) {
    // Fallback
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  } else {
    navigator.clipboard.writeText(text).catch(() => {})
  }
  const orig = btn.textContent
  btn.textContent = '✓'
  setTimeout(() => { btn.textContent = orig }, 1800)
}

// ── Interest form ─────────────────────────────────────────────────────────────
function submitInterest(e) {
  e.preventDefault()
  const name  = document.getElementById('interestName')?.value.trim()
  const phone = document.getElementById('interestPhone')?.value.trim()
  if (!name || !phone) return

  // Save to localStorage
  const leads = JSON.parse(localStorage.getItem('mukallaf_leads') || '[]')
  leads.push({ name, phone, at: new Date().toISOString() })
  localStorage.setItem('mukallaf_leads', JSON.stringify(leads))

  // Show success
  const form    = document.getElementById('interestForm')
  const success = document.getElementById('formSuccess')
  if (form) form.style.display = 'none'
  if (success) success.style.display = 'block'
}

// ── Stagger reveal delay for grids ───────────────────────────────────────────
document.querySelectorAll(
  '.modules-grid .module-card, .extras-grid .extra-card, .steps-grid .step-card, .audience-grid .audience-card, .security-grid .security-card, .pricing-grid .pricing-card, .testimonials-grid .testimonial-card'
).forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 80}ms`
})
