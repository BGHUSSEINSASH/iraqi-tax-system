import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  FileSpreadsheet,
  Landmark,
  FileSignature,
  Home,
  Map,
  Briefcase,
  Gavel,
  Kanban,
  Calendar,
  ClipboardList,
  History,
  Bell,
  Crown,
  Database,
  Headset,
  Settings,
  LogOut,
  Menu,
  X,
  WrenchIcon,
} from 'lucide-react'

// ── Brand Mark SVG (Folded Planes — from brand identity PDF) ─────────────────
function BrandMark({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <polygon points="8,46 26,8 35,46" fill="white" />
      <polygon points="33,46 45,16 52,46" fill="#9BA3C7" opacity="0.85" />
    </svg>
  )
}
import { useApp } from '../store/AppContext'
import { cx } from './ui'
import type { UserRole } from '../lib/types'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  group: string
  roles?: UserRole[]
}

const NAV: NavItem[] = [
  { to: '/dashboard', label: 'لوحة التحكم', icon: <LayoutDashboard size={18} />, group: 'الرئيسية والإدارة' },
  { to: '/employees', label: 'إدارة الموظفين', icon: <Users size={18} />, group: 'الرئيسية والإدارة' },
  { to: '/users', label: 'إدارة المستخدمين', icon: <Users size={18} />, group: 'الرئيسية والإدارة' },

  { to: '/tax/monthly', label: 'الاستقطاع المباشر - الشهري', icon: <CalendarClock size={18} />, group: 'إدارة الضرائب' },
  { to: '/tax/annual', label: 'الاستقطاع المباشر - السنوي', icon: <FileSpreadsheet size={18} />, group: 'إدارة الضرائب' },
  { to: '/tax/corporate', label: 'ضريبة أرباح الشركات', icon: <Landmark size={18} />, group: 'إدارة الضرائب' },
  { to: '/tax/contracts', label: 'ضريبة العقود الرسمية', icon: <FileSignature size={18} />, group: 'إدارة الضرائب' },
  { to: '/tax/property', label: 'ضريبة العقار', icon: <Home size={18} />, group: 'إدارة الضرائب' },
  { to: '/tax/land', label: 'ضريبة العرصات', icon: <Map size={18} />, group: 'إدارة الضرائب' },
  { to: '/tax/profession', label: 'ضريبة المهن', icon: <Briefcase size={18} />, group: 'إدارة الضرائب' },

  { to: '/penalties', label: 'احتساب الغرامات', icon: <Gavel size={18} />, group: 'المتابعة والتنبيهات' },
  { to: '/workflow', label: 'مسارات سير العمل', icon: <Kanban size={18} />, group: 'المتابعة والتنبيهات' },
  { to: '/appointments', label: 'المواعيد الضريبية', icon: <Calendar size={18} />, group: 'المتابعة والتنبيهات' },
  { to: '/tasks', label: 'المهام والتنبيهات', icon: <ClipboardList size={18} />, group: 'المتابعة والتنبيهات' },
  { to: '/notifications', label: 'الإشعارات', icon: <Bell size={18} />, group: 'المتابعة والتنبيهات' },

  { to: '/packages', label: 'باقات الاشتراك', icon: <Crown size={18} />, group: 'الإعدادات والنظام' },
  { to: '/audit', label: 'سجل العمليات', icon: <History size={18} />, group: 'الإعدادات والنظام' },
  { to: '/backup', label: 'النسخ الاحتياطي', icon: <Database size={18} />, group: 'الإعدادات والنظام' },
  { to: '/contact', label: 'تواصل معنا', icon: <Headset size={18} />, group: 'الإعدادات والنظام' },
  { to: '/settings', label: 'الإعدادات', icon: <Settings size={18} />, group: 'الإعدادات والنظام' },
  { to: '/founder', label: 'لوحة المؤسس', icon: <Crown size={18} />, group: 'لوحة المؤسس', roles: ['founder'] },
]

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'لوحة التحكم',
  '/employees': 'إدارة الموظفين',
  '/users': 'إدارة المستخدمين',
  '/tax/monthly': 'ضريبة الاستقطاع المباشر الشهري',
  '/tax/annual': 'ضريبة الاستقطاع المباشر السنوي',
  '/tax/corporate': 'ضريبة أرباح الشركات',
  '/tax/contracts': 'ضريبة العقود',
  '/tax/property': 'ضريبة العقار',
  '/tax/land': 'ضريبة العرصات',
  '/tax/profession': 'ضريبة المهن',
  '/penalties': 'احتساب الغرامات والمدد القانونية',
  '/workflow': 'لوحة مسارات سير العمل الضريبي',
  '/appointments': 'المواعيد الضريبية',
  '/tasks': 'المهام والتنبيهات الضريبية',
  '/notifications': 'الإشعارات والتنبيهات',
  '/packages': 'باقات الاشتراك والترقية',
  '/audit': 'سجل عمليات تدقيق النظام',
  '/login-history': 'سجل الدخول والأمان',
  '/api': 'لوحة واجهة API والتكامل',
  '/e-signature': 'التوقيع الإلكتروني',
  '/tickets': 'تذاكر الدعم والطلبات',
  '/backup': 'النسخ الاحتياطي والاستعادة',
  '/contact': 'تواصل معنا وطلبات الخدمة',
  '/settings': 'الإعدادات والبارامترات الضريبية',
  '/founder': 'لوحة تحكم المؤسس',
}

const ROLE_LABEL: Record<UserRole, string> = {
  founder: 'مؤسس النظام',
  admin: 'مدير النظام',
  accountant: 'محاسب',
}

export default function AppLayout() {
  const [open, setOpen] = useState(false)
  const { currentCompany, currentUser, logout, data } = useApp()
  const location = useLocation()
  const navigate = useNavigate()

  const currentTitle = PAGE_TITLES[location.pathname] ?? 'المكلف'
  const role = currentUser?.role ?? 'accountant'
  const currentPackage = data.currentPackage ?? 'enterprise'
  const moduleVisibility = data.moduleVisibility ?? []

  // ─── Maintenance Mode: block everyone except founder ─────────────────────
  if (data.maintenanceMode && role !== 'founder') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-100 p-6">
        <div className="max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-10 text-center shadow-lg">
          <WrenchIcon size={48} className="mx-auto mb-4 text-amber-500" />
          <h1 className="mb-2 text-2xl font-black text-amber-900">وضع الصيانة</h1>
          <p className="text-sm leading-7 text-amber-800">
            {data.maintenanceMessage || 'النظام في وضع الصيانة. يرجى المحاولة لاحقاً.'}
          </p>
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="mt-6 rounded-lg bg-amber-600 px-6 py-2 text-sm font-bold text-white hover:bg-amber-700"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    )
  }

  // ─── Three-level NAV filter: role + tier + forceHidden ────────────────────
  const visibleNav = NAV.filter((item) => {
    // role-gated items (e.g. /founder only for founder)
    if (item.roles && !item.roles.includes(role)) return false

    // founder always sees everything not role-gated above
    if (role === 'founder') return true

    // check moduleVisibility config
    const cfg = moduleVisibility.find((m) => m.path === item.to)
    if (!cfg) return true  // no config = visible by default
    if (cfg.forceHidden) return false
    if (!cfg.enabledForTiers.includes(currentPackage)) return false
    if (!cfg.visibleToRoles.includes(role)) return false
    return true
  })

  const groups = ['الرئيسية والإدارة', 'إدارة الضرائب', 'المتابعة والتنبيهات', 'الإعدادات والنظام', 'لوحة المؤسس']

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
          <BrandMark size={36} />
        </div>
        <div>
          <div className="text-lg font-black leading-none text-white tracking-tight">المكلف</div>
          <div className="mt-0.5 text-[10px] font-medium tracking-widest text-[#9BA3C7]">حلول ضريبية ذكية</div>
        </div>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {groups.map((grp) => {
          const items = visibleNav.filter((x) => x.group === grp)
          if (!items.length) return null
          return (
            <div key={grp} className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#9BA3C7]/60">
                {grp}
              </div>
              {items.map((item) => {
                const isTaxPage = item.to.startsWith('/tax/')
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cx(
                        'flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition',
                        isActive
                          ? 'bg-white text-[#2D3580] shadow-sm font-semibold'
                          : 'text-[#C5CAE9] hover:bg-white/10 hover:text-white',
                        !isActive && isTaxPage && 'mr-2',
                      )
                    }
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          )
        })}
      </nav>
      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white">
            {currentUser?.name?.[0] ?? 'م'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-white">{currentUser?.name}</div>
            <div className="text-[11px] text-[#9BA3C7]">
              {currentUser ? ROLE_LABEL[currentUser.role] : ''}
            </div>
          </div>
          <button
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="rounded-lg p-2 text-[#9BA3C7] transition hover:bg-white/10 hover:text-white"
            title="تسجيل الخروج"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-ink-100">
      <div className="fixed inset-y-0 right-0 z-40 hidden w-64 lg:block">
        <div className="h-full bg-gradient-to-b from-[#2D3580] via-[#232970] to-[#0f1229]">{sidebar}</div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-72 bg-gradient-to-b from-[#2D3580] via-[#232970] to-[#0f1229] shadow-xl animate-slidein">
            <button
              className="absolute left-3 top-4 rounded-lg p-1.5 text-white hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              <X size={20} />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <div className="lg:pr-64">
        <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-6">
            <div className="flex items-center gap-3">
              <button
                className="rounded-lg border border-ink-200 p-2 text-ink-600 lg:hidden"
                onClick={() => setOpen(true)}
              >
                <Menu size={20} />
              </button>
              <div>
                <div className="flex items-center gap-2 text-xs text-ink-400">
                  <span>المكلف</span>
                  <span>/</span>
                  <span className="font-medium text-ink-600">{currentTitle}</span>
                </div>
                <h1 className="text-lg font-bold text-ink-900">{currentTitle}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden rounded-lg bg-ink-100 px-3 py-1.5 text-xs font-medium text-ink-600 md:block">
                {currentCompany?.name ?? 'المكلف'}
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-5 lg:px-6 lg:py-6">
          <Outlet />
        </main>

        <footer className="border-t border-ink-200 px-6 py-4 text-center text-xs text-ink-400">
          نظام المكلف — TAX IQ © {new Date().getFullYear()} | نظام إدارة ضريبية متكامل
        </footer>
      </div>
    </div>
  )
}
