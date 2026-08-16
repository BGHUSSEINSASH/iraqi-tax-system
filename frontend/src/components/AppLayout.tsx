import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Users,
  CalendarClock,
  FileSpreadsheet,
  Landmark,
  FileSignature,
  Home,
  Map,
  Briefcase,
  ShoppingCart,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Scale,
  UserCheck,
  Receipt,
  Gavel,
  Kanban,
  Calendar,
  ClipboardList,
  MapPin,
  UploadCloud,
  History,
  LifeBuoy,
  Crown,
  FileCheck2,
  TrendingUp,
  Lock,
  KeyRound,
  PenLine,
  Bell,
  Database,
  Headset,
  Flame,
  GitCompareArrows,
} from 'lucide-react'
import { useApp } from '../store/AppContext'
import { cx } from './ui'
import { Select } from './ui'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  group: string
}

const NAV: NavItem[] = [
  { to: '/dashboard', label: 'لوحة التحكم', icon: <LayoutDashboard size={18} />, group: 'الرئيسية والإدارة' },
  { to: '/companies', label: 'إدارة الشركات', icon: <Building2 size={18} />, group: 'الرئيسية والإدارة' },
  { to: '/employees', label: 'إدارة الموظفين', icon: <Users size={18} />, group: 'الرئيسية والإدارة' },
  { to: '/users', label: 'إدارة المستخدمين', icon: <Users size={18} />, group: 'الرئيسية والإدارة' },

  { to: '/tax/monthly', label: 'ضريبة الاستقطاع المباشر', icon: <CalendarClock size={18} />, group: 'إدارة الضرائب' },
  { to: '/tax/annual', label: 'الضريبة السنوية', icon: <FileSpreadsheet size={18} />, group: 'إدارة الضرائب' },
  { to: '/tax/corporate', label: 'ضريبة أرباح الشركات', icon: <Landmark size={18} />, group: 'إدارة الضرائب' },
  { to: '/tax/contracts', label: 'ضريبة العقود الرسمية', icon: <FileSignature size={18} />, group: 'إدارة الضرائب' },
  { to: '/tax/property', label: 'ضريبة العقار', icon: <Home size={18} />, group: 'إدارة الضرائب' },
  { to: '/tax/land', label: 'ضريبة العرصات', icon: <Map size={18} />, group: 'إدارة الضرائب' },
  { to: '/tax/profession', label: 'ضريبة المهن', icon: <Briefcase size={18} />, group: 'إدارة الضرائب' },
  { to: '/tax/sales', label: 'ضريبة المبيعات', icon: <ShoppingCart size={18} />, group: 'إدارة الضرائب' },

  { to: '/taxpayers', label: 'سجل المكلفين', icon: <UserCheck size={18} />, group: 'الأقسام الثانوية' },
  { to: '/invoices', label: 'الفواتير والمطالبات', icon: <Receipt size={18} />, group: 'الأقسام الثانوية' },
  { to: '/penalties', label: 'احتساب الغرامات', icon: <Gavel size={18} />, group: 'الأقسام الثانوية' },
  { to: '/workflow', label: 'مسارات سير العمل', icon: <Kanban size={18} />, group: 'الأقسام الثانوية' },
  { to: '/appointments', label: 'المواعيد والمقابلات', icon: <Calendar size={18} />, group: 'الأقسام الثانوية' },
  { to: '/tasks', label: 'المهام والملاحظات', icon: <ClipboardList size={18} />, group: 'الأقسام الثانوية' },
  { to: '/provinces', label: 'المحافظات والتخمينات', icon: <MapPin size={18} />, group: 'الأقسام الثانوية' },
  { to: '/documents', label: 'مرفوعات الوثائق', icon: <UploadCloud size={18} />, group: 'الأقسام الثانوية' },
  { to: '/declarations', label: 'الإقرارات والوثائق', icon: <FileText size={18} />, group: 'الأقسام الثانوية' },
  { to: '/official-forms', label: 'الاستمارات الرسمية', icon: <FileCheck2 size={18} />, group: 'الأقسام الثانوية' },
  { to: '/reports', label: 'التقارير والتحليلات', icon: <BarChart3 size={18} />, group: 'الأقسام الثانوية' },
  { to: '/analytics', label: 'مؤشرات الأداء والمقارنات', icon: <TrendingUp size={18} />, group: 'الأقسام الثانوية' },
  { to: '/comparison', label: 'مقارنة الضرائب', icon: <GitCompareArrows size={18} />, group: 'الأقسام الثانوية' },
  { to: '/heatmap', label: 'الخريطة الحرارية', icon: <Flame size={18} />, group: 'الأقسام الثانوية' },
  { to: '/calendar', label: 'التقويم الضريبي', icon: <Calendar size={18} />, group: 'الأقسام الثانوية' },
  { to: '/audit', label: 'سجل العمليات', icon: <History size={18} />, group: 'الأقسام الثانوية' },
  { to: '/login-history', label: 'سجل الدخول والأمان', icon: <Lock size={18} />, group: 'الأقسام الثانوية' },
  { to: '/api', label: 'واجهة API', icon: <KeyRound size={18} />, group: 'الأقسام الثانوية' },
  { to: '/e-signature', label: 'التوقيع الإلكتروني', icon: <PenLine size={18} />, group: 'الأقسام الثانوية' },
  { to: '/tickets', label: 'تذاكر الدعم', icon: <LifeBuoy size={18} />, group: 'الأقسام الثانوية' },
  { to: '/packages', label: 'باقات الاشتراك', icon: <Crown size={18} />, group: 'الأقسام الثانوية' },
  { to: '/backup', label: 'النسخ الاحتياطي', icon: <Database size={18} />, group: 'الأقسام الثانوية' },
  { to: '/contact', label: 'تواصل معنا', icon: <Headset size={18} />, group: 'الأقسام الثانوية' },
  { to: '/settings', label: 'الإعدادات', icon: <Settings size={18} />, group: 'الأقسام الثانوية' },
  { to: '/notifications', label: 'الإشعارات', icon: <Bell size={18} />, group: 'الأقسام الثانوية' },
]

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'لوحة التحكم',
  '/companies': 'إدارة الشركات',
  '/employees': 'إدارة الموظفين',
  '/taxpayers': 'سجل المكلفين والمسجلين',
  '/tax/monthly': 'ضريبة الاستقطاع الشهري',
  '/tax/annual': 'الضريبة السنوية للموظفين',
  '/tax/corporate': 'ضريبة أرباح الشركات',
  '/tax/contracts': 'ضريبة العقود',
  '/tax/property': 'ضريبة العقار',
  '/tax/land': 'ضريبة العرصات',
  '/tax/profession': 'ضريبة المهن',
  '/tax/sales': 'ضريبة المبيعات',
  '/invoices': 'الفواتير والمطالبات الضريبية',
  '/penalties': 'احتساب الغرامات والمدد القانونية',
  '/workflow': 'لوحة مسارات سير العمل الضريبي',
  '/appointments': 'المواعيد والمقابلات الضريبية',
  '/tasks': 'المهام والمذكرات اليومية',
  '/provinces': 'المحافظات العراقية وتخمينات الأراضي',
  '/documents': 'مرفوعات الوثائق والملفات الرسمية',
  '/declarations': 'الإقرارات والوثائق',
  '/official-forms': 'الاستمارات الرسمية',
  '/reports': 'التقارير المجمعة',
  '/analytics': 'مؤشرات الأداء والمقارنات',
  '/comparison': 'مقارنة الضرائب بين السنوات',
  '/heatmap': 'الخريطة الحرارية للمحافظات',
  '/calendar': 'التقويم الضريبي',
  '/audit': 'سجل عمليات تدقيق النظام',
  '/login-history': 'سجل الدخول والأمان',
  '/api': 'لوحة واجهة API والتكامل',
  '/e-signature': 'التوقيع الإلكتروني',
  '/tickets': 'تذاكر الدعم والطلبات',
  '/notifications': 'الإشعارات والتنبيهات',
  '/packages': 'باقات الاشتراك والترقية',
  '/backup': 'النسخ الاحتياطي والاستعادة',
  '/contact': 'تواصل معنا وطلبات الخدمة',
  '/users': 'إدارة المستخدمين',
  '/settings': 'الإعدادات والبارامترات الضريبية',
}

export default function AppLayout() {
  const [open, setOpen] = useState(false)
  const { data, currentCompany, setActiveCompany, currentUser, logout } = useApp()
  const location = useLocation()
  const navigate = useNavigate()

  const currentTitle = PAGE_TITLES[location.pathname] ?? 'المكلف'

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white">
          <Scale size={22} />
        </div>
        <div>
          <div className="text-lg font-black leading-none text-white">المكلف</div>
          <div className="mt-1 text-[11px] font-medium tracking-wider text-emerald-200">TAX IQ</div>
        </div>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {['الرئيسية والإدارة', 'إدارة الضرائب', 'الأقسام الثانوية'].map((grp) => {
          const items = NAV.filter((x) => x.group === grp)
          return (
            <div key={grp} className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300/50">
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
                          ? 'bg-white text-brand-700 shadow-sm font-semibold'
                          : 'text-emerald-100 hover:bg-white/10 hover:text-white',
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
            <div className="text-[11px] text-emerald-200">
              {currentUser?.role === 'admin' ? 'مدير النظام' : 'محاسب'}
            </div>
          </div>
          <button
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="rounded-lg p-2 text-emerald-200 transition hover:bg-white/10 hover:text-white"
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
        <div className="h-full bg-gradient-to-b from-brand-800 via-brand-900 to-ink-950">{sidebar}</div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-72 bg-gradient-to-b from-brand-800 via-brand-900 to-ink-950 shadow-xl animate-slidein">
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
              <div className="hidden sm:block">
                <Select
                  className="min-w-[240px] py-1.5 text-xs font-medium"
                  value={data.activeCompanyId}
                  onChange={(e) => setActiveCompany(e.target.value)}
                >
                  {data.companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="hidden rounded-lg bg-ink-100 px-3 py-1.5 text-xs font-medium text-ink-600 md:block">
                {currentCompany?.name ?? 'بدون شركة'}
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
