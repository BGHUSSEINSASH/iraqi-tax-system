import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Crown,
  Building2,
  Users,
  BadgeDollarSign,
  ShieldAlert,
  Power,
  PauseCircle,
  PlayCircle,
  Archive,
  UserCog,
  LayoutGrid,
  Eye,
  EyeOff,
  ShieldCheck,
  WrenchIcon,
  Gift,
  BarChart3,
  CheckCircle2,
  XCircle,
  KeyRound,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react'
import { useApp } from '../store/AppContext'
import {
  PageHead,
  Card,
  CardHeader,
  CardBody,
  Button,
  Badge,
  DataTable,
  useToast,
  type Column,
} from '../components/ui'
import type { Company, User, UserRole, SubscriptionTier, RolePermission, SubscriptionGrant } from '../lib/types'
import { fmtDate, uid } from '../lib/format'

// ─── Tab definitions ──────────────────────────────────────────────────────────
type Tab = 'stats' | 'subscriptions' | 'modules' | 'users' | 'permissions' | 'system'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'stats', label: 'الإحصاء', icon: <BarChart3 size={16} /> },
  { id: 'subscriptions', label: 'الاشتراكات', icon: <BadgeDollarSign size={16} /> },
  { id: 'modules', label: 'الأقسام', icon: <LayoutGrid size={16} /> },
  { id: 'users', label: 'المستخدمون', icon: <Users size={16} /> },
  { id: 'permissions', label: 'الصلاحيات', icon: <ShieldCheck size={16} /> },
  { id: 'system', label: 'النظام', icon: <WrenchIcon size={16} /> },
]

const TIER_LABELS: Record<SubscriptionTier, string> = {
  basic: 'أساسية',
  professional: 'احترافية',
  enterprise: 'مؤسسية',
}

const TIER_TONES: Record<SubscriptionTier, 'slate' | 'amber' | 'brand'> = {
  basic: 'slate',
  professional: 'amber',
  enterprise: 'brand',
}

const ROLE_LABELS: Record<UserRole, string> = {
  founder: 'مؤسس',
  admin: 'مدير',
  accountant: 'محاسب',
}

const PERMISSION_LABELS: Record<keyof Omit<RolePermission, 'role'>, string> = {
  canEditTaxConfig: 'تعديل معاملات الضريبة',
  canManageUsers: 'إدارة المستخدمين',
  canViewAuditLog: 'عرض سجل العمليات',
  canExportData: 'تصدير البيانات',
  canManageInvoices: 'إدارة الفواتير',
  canManageAppointments: 'إدارة المواعيد',
  canDeleteRecords: 'حذف السجلات',
  canViewReports: 'عرض التقارير',
}

const MODULE_LABELS: Record<string, string> = {
  '/dashboard': 'لوحة التحكم',
  '/employees': 'إدارة الموظفين',
  '/users': 'إدارة المستخدمين',
  '/tax/monthly': 'الاستقطاع الشهري',
  '/tax/annual': 'الاستقطاع السنوي',
  '/tax/corporate': 'ضريبة الشركات',
  '/tax/contracts': 'ضريبة العقود',
  '/tax/property': 'ضريبة العقار',
  '/tax/land': 'ضريبة العرصات',
  '/tax/profession': 'ضريبة المهن',
  '/penalties': 'احتساب الغرامات',
  '/workflow': 'مسارات العمل',
  '/appointments': 'المواعيد',
  '/tasks': 'المهام والتنبيهات',
  '/notifications': 'الإشعارات',
  '/packages': 'باقات الاشتراك',
  '/audit': 'سجل العمليات',
  '/backup': 'النسخ الاحتياطي',
  '/contact': 'تواصل معنا',
  '/settings': 'الإعدادات',
  '/founder': 'لوحة المؤسس',
}

// ─── Grant Modal ──────────────────────────────────────────────────────────────
interface GrantModalProps {
  companies: Company[]
  currentUser: User
  onSave: (grant: Omit<SubscriptionGrant, 'id'>) => void
  onClose: () => void
}
function GrantModal({ companies, currentUser, onSave, onClose }: GrantModalProps) {
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? '')
  const [tier, setTier] = useState<SubscriptionTier>('professional')
  const [expiresAt, setExpiresAt] = useState('')
  const [reason, setReason] = useState('')
  const [creditDays, setCreditDays] = useState(0)
  const [noExpiry, setNoExpiry] = useState(false)

  const handleSave = () => {
    const company = companies.find((c) => c.id === companyId)
    onSave({
      companyId,
      companyName: company?.name ?? '',
      tier,
      grantedAt: new Date().toISOString(),
      expiresAt: noExpiry ? null : expiresAt || null,
      grantedBy: currentUser.name,
      reason,
      creditDays,
      isActive: true,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
          <h3 className="font-bold text-ink-800">منح اشتراك جديد</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-ink-400 hover:bg-ink-100"><XCircle size={18} /></button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-600">الشركة</label>
            <select value={companyId} onChange={(e) => setCompanyId(e.target.value)}
              className="w-full rounded-lg border border-ink-200 bg-ink-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400">
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-600">الباقة الممنوحة</label>
            <div className="grid grid-cols-3 gap-2">
              {(['basic', 'professional', 'enterprise'] as SubscriptionTier[]).map((t) => (
                <button key={t} onClick={() => setTier(t)}
                  className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${tier === t ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-600 hover:border-ink-300'}`}>
                  {TIER_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-600">سبب المنح</label>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="مثال: تعويض عن عطل فني"
              className="w-full rounded-lg border border-ink-200 bg-ink-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-600">أيام تعويض إضافية</label>
            <input type="number" min={0} value={creditDays} onChange={(e) => setCreditDays(Number(e.target.value))}
              className="w-full rounded-lg border border-ink-200 bg-ink-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <input id="noexpiry" type="checkbox" checked={noExpiry} onChange={(e) => setNoExpiry(e.target.checked)}
                className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-400" />
              <label htmlFor="noexpiry" className="text-xs font-semibold text-ink-600">لا تاريخ انتهاء (دائم)</label>
            </div>
            {!noExpiry && (
              <>
                <label className="mb-1 block text-xs font-semibold text-ink-600">تاريخ الانتهاء</label>
                <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full rounded-lg border border-ink-200 bg-ink-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              </>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-ink-100 px-6 py-4">
          <Button variant="secondary" size="sm" onClick={onClose}>إلغاء</Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={!companyId || !reason}>
            <Gift size={14} /> منح الاشتراك
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Reset Password Modal ─────────────────────────────────────────────────────
interface ResetPwdModalProps {
  user: User
  onSave: (newPwd: string) => void
  onClose: () => void
}
function ResetPwdModal({ user, onSave, onClose }: ResetPwdModalProps) {
  const [pwd, setPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const mismatch = pwd && confirm && pwd !== confirm
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
          <h3 className="font-bold text-ink-800">إعادة تعيين كلمة المرور</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-ink-400 hover:bg-ink-100"><XCircle size={18} /></button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <p className="text-xs text-ink-500">تعيين كلمة مرور جديدة للمستخدم: <span className="font-bold text-ink-800">{user.name}</span></p>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-600">كلمة المرور الجديدة</label>
            <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} minLength={6}
              className="w-full rounded-lg border border-ink-200 bg-ink-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-600">تأكيد كلمة المرور</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 ${mismatch ? 'border-red-400 bg-red-50' : 'border-ink-200 bg-ink-50'}`} />
            {mismatch && <p className="mt-1 text-xs text-red-600">كلمتا المرور غير متطابقتين</p>}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-ink-100 px-6 py-4">
          <Button variant="secondary" size="sm" onClick={onClose}>إلغاء</Button>
          <Button variant="primary" size="sm" onClick={() => { onSave(pwd); onClose() }}
            disabled={!pwd || pwd.length < 6 || pwd !== confirm}>
            <KeyRound size={14} /> تغيير كلمة المرور
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FounderControl() {
  const {
    currentUser,
    data,
    update,
    add,
    setCurrentPackage,
    toggleModule,
    setModuleTiers,
    setModuleRoles,
    grantSubscription,
    revokeGrant,
    updateRolePermission,
    setMaintenanceMode,
    updateUserRole,
    resetUserPassword,
  } = useApp()
  const navigate = useNavigate()
  const { push } = useToast()

  const [activeTab, setActiveTab] = useState<Tab>('stats')
  const [showGrantModal, setShowGrantModal] = useState(false)
  const [resetPwdUser, setResetPwdUser] = useState<User | null>(null)
  const [maintenanceMsg, setMaintenanceMsg] = useState(data.maintenanceMessage)
  const [expandedModule, setExpandedModule] = useState<string | null>(null)

  if (currentUser?.role !== 'founder') {
    return (
      <div className="space-y-4">
        <PageHead title="لوحة المؤسس" desc="صلاحيات مقيدة: هذه الصفحة متاحة للمؤسس فقط" />
        <Card>
          <CardBody>
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              لا تملك صلاحية الوصول إلى لوحة المؤسس.
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  const logAction = (action: string, details: string) => {
    add('auditLogs', {
      id: uid(),
      action,
      user: currentUser.name,
      details,
      time: new Date().toISOString(),
    })
  }

  // ─── Stats ────────────────────────────────────────────────────────────────
  const companyStats = useMemo(() => ({
    total: data.companies.length,
    active: data.companies.filter((c) => (c.status ?? 'active') === 'active').length,
    suspended: data.companies.filter((c) => c.status === 'suspended').length,
    archived: data.companies.filter((c) => c.status === 'archived').length,
  }), [data.companies])

  const userStats = useMemo(() => ({
    total: data.users.length,
    founders: data.users.filter((u) => u.role === 'founder').length,
    admins: data.users.filter((u) => u.role === 'admin').length,
    accountants: data.users.filter((u) => u.role === 'accountant').length,
    suspended: data.users.filter((u) => u.status === 'suspended').length,
  }), [data.users])

  const grantStats = useMemo(() => ({
    total: data.subscriptionGrants.length,
    active: data.subscriptionGrants.filter((g) => g.isActive).length,
    revoked: data.subscriptionGrants.filter((g) => !g.isActive).length,
  }), [data.subscriptionGrants])

  const pkgDist = useMemo(() => ({
    basic: 0,
    professional: 0,
    enterprise: 1, // the current system package
  }), [data.currentPackage])

  // ─── Company actions ──────────────────────────────────────────────────────
  const updateCompanyStatus = (company: Company, status: 'active' | 'suspended' | 'archived') => {
    update('companies', company.id, { status })
    logAction('Founder.CompanyStatus', `تغيير حالة الشركة "${company.name}" إلى ${status}`)
    push('success', `تم تحديث حالة الشركة إلى: ${status}`)
  }

  // ─── User actions ─────────────────────────────────────────────────────────
  const toggleUserStatus = (user: User) => {
    if (user.role === 'founder' && user.id === currentUser.id) {
      push('error', 'لا يمكن تعطيل حساب المؤسس الحالي')
      return
    }
    const next = user.status === 'suspended' ? 'active' : 'suspended'
    update('users', user.id, { status: next })
    logAction('Founder.UserStatus', `تغيير حالة "${user.username}" إلى ${next}`)
    push('success', `تم تحديث حالة المستخدم`)
  }

  const handleRoleChange = (user: User, role: UserRole) => {
    if (user.id === currentUser.id && role !== 'founder') {
      push('error', 'لا يمكن تغيير دورك بنفسك')
      return
    }
    updateUserRole(user.id, role)
    logAction('Founder.RoleChange', `تغيير دور "${user.username}" إلى ${role}`)
    push('success', `تم تحديث الدور إلى: ${ROLE_LABELS[role]}`)
  }

  // ─── Package action ───────────────────────────────────────────────────────
  const setPkg = (pkg: SubscriptionTier) => {
    if (data.currentPackage === pkg) return
    setCurrentPackage(pkg)
    logAction('Founder.PackageChange', `تغيير الباقة العامة إلى ${pkg}`)
    push('success', `تم تغيير الباقة إلى: ${TIER_LABELS[pkg]}`)
  }

  // ─── Module helpers ───────────────────────────────────────────────────────
  const handleToggleHide = (path: string, hide: boolean) => {
    toggleModule(path, hide)
    logAction('Founder.ModuleToggle', `${hide ? 'إخفاء' : 'إظهار'} القسم: ${path}`)
    push('success', hide ? 'تم إخفاء القسم' : 'تم إظهار القسم')
  }

  const handleModuleTier = (path: string, tier: SubscriptionTier, enabled: boolean) => {
    const cfg = data.moduleVisibility.find((m) => m.path === path)
    if (!cfg) return
    const tiers = enabled
      ? [...new Set([...cfg.enabledForTiers, tier])]
      : cfg.enabledForTiers.filter((t) => t !== tier)
    setModuleTiers(path, tiers)
  }

  const handleModuleRole = (path: string, role: UserRole, visible: boolean) => {
    const cfg = data.moduleVisibility.find((m) => m.path === path)
    if (!cfg) return
    const roles = visible
      ? [...new Set([...cfg.visibleToRoles, role])]
      : cfg.visibleToRoles.filter((r) => r !== role)
    setModuleRoles(path, roles)
  }

  // ─── Columns ──────────────────────────────────────────────────────────────
  const companyColumns: Column<Company>[] = [
    {
      key: 'name', title: 'الشركة',
      render: (c) => (
        <div>
          <div className="font-semibold text-ink-800">{c.name}</div>
          <div className="text-xs text-ink-400">{c.taxId || 'بدون رقم ضريبي'}</div>
        </div>
      ),
    },
    {
      key: 'status', title: 'الحالة',
      render: (c) => {
        const st = c.status ?? 'active'
        if (st === 'active') return <Badge tone="green">نشط</Badge>
        if (st === 'suspended') return <Badge tone="red">معلّق</Badge>
        return <Badge tone="slate">مؤرشف</Badge>
      },
    },
    {
      key: 'createdAt', title: 'تاريخ الإنشاء',
      render: (c) => <span className="text-xs">{fmtDate(c.createdAt)}</span>,
    },
    {
      key: 'actions', title: '',
      render: (c) => (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={() => updateCompanyStatus(c, 'active')}>
            <PlayCircle size={13} /> تفعيل
          </Button>
          <Button size="sm" variant="secondary" onClick={() => updateCompanyStatus(c, 'suspended')}>
            <PauseCircle size={13} /> تعليق
          </Button>
          <Button size="sm" variant="ghost" onClick={() => updateCompanyStatus(c, 'archived')}>
            <Archive size={13} /> أرشفة
          </Button>
        </div>
      ),
    },
  ]

  const userColumns: Column<User>[] = [
    {
      key: 'user', title: 'المستخدم',
      render: (u) => (
        <div>
          <div className="font-semibold text-ink-800">{u.name}</div>
          <div className="text-xs text-ink-400" dir="ltr">{u.username}</div>
        </div>
      ),
    },
    {
      key: 'role', title: 'الدور',
      render: (u) => (
        <select
          value={u.role}
          onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
          disabled={u.id === currentUser.id}
          className="rounded-lg border border-ink-200 bg-white px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-50"
        >
          <option value="accountant">محاسب</option>
          <option value="admin">مدير</option>
          <option value="founder">مؤسس</option>
        </select>
      ),
    },
    {
      key: 'status', title: 'الحالة',
      render: (u) => (u.status === 'suspended' ? <Badge tone="red">معلّق</Badge> : <Badge tone="green">نشط</Badge>),
    },
    {
      key: 'actions', title: '',
      render: (u) => (
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={() => setResetPwdUser(u)}>
            <KeyRound size={13} /> كلمة المرور
          </Button>
          <Button size="sm" variant="secondary" onClick={() => toggleUserStatus(u)}
            disabled={u.id === currentUser.id}>
            <Power size={13} /> {u.status === 'suspended' ? 'تفعيل' : 'تعليق'}
          </Button>
        </div>
      ),
    },
  ]

  const grantColumns: Column<SubscriptionGrant>[] = [
    {
      key: 'company', title: 'الشركة',
      render: (g) => <span className="font-semibold text-ink-800">{g.companyName}</span>,
    },
    {
      key: 'tier', title: 'الباقة',
      render: (g) => <Badge tone={TIER_TONES[g.tier]}>{TIER_LABELS[g.tier]}</Badge>,
    },
    {
      key: 'reason', title: 'السبب',
      render: (g) => <span className="text-xs text-ink-600">{g.reason}</span>,
    },
    {
      key: 'credit', title: 'أيام تعويض',
      render: (g) => g.creditDays > 0 ? <Badge tone="green">+{g.creditDays} يوم</Badge> : <span className="text-xs text-ink-400">—</span>,
    },
    {
      key: 'expires', title: 'ينتهي',
      render: (g) => g.expiresAt ? <span className="text-xs">{fmtDate(g.expiresAt)}</span> : <Badge tone="brand">دائم</Badge>,
    },
    {
      key: 'status', title: 'الحالة',
      render: (g) => g.isActive ? <Badge tone="green">فعّال</Badge> : <Badge tone="red">ملغى</Badge>,
    },
    {
      key: 'actions', title: '',
      render: (g) => g.isActive ? (
        <Button size="sm" variant="ghost" onClick={() => {
          revokeGrant(g.id)
          logAction('Founder.RevokeGrant', `إلغاء منحة الاشتراك للشركة: ${g.companyName}`)
          push('success', 'تم إلغاء المنحة')
        }}>
          <XCircle size={13} /> إلغاء
        </Button>
      ) : null,
    },
  ]

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHead
        title="لوحة المؤسس"
        desc="تحكم مركزي شامل — الأقسام، الاشتراكات، المستخدمون، الصلاحيات، وإعدادات النظام"
        actions={
          <Button variant="secondary" onClick={() => navigate('/audit')}>
            <ShieldAlert size={16} /> سجل التدقيق
          </Button>
        }
      />

      {/* Tab Bar */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-ink-200 bg-white p-2 shadow-sm">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.id
                ? 'bg-brand-600 text-white shadow'
                : 'text-ink-600 hover:bg-ink-100'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Stats ── */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* KPI grid */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: 'إجمالي الشركات', value: companyStats.total, color: 'text-ink-800' },
              { label: 'شركات نشطة', value: companyStats.active, color: 'text-emerald-700' },
              { label: 'شركات معلقة', value: companyStats.suspended, color: 'text-red-700' },
              { label: 'شركات مؤرشفة', value: companyStats.archived, color: 'text-ink-400' },
            ].map((s) => (
              <Card key={s.label} className="p-4">
                <div className="text-xs text-ink-500">{s.label}</div>
                <div className={`mt-1 text-2xl font-black ${s.color}`}>{s.value}</div>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: 'إجمالي المستخدمين', value: userStats.total, color: 'text-ink-800' },
              { label: 'مدراء النظام', value: userStats.admins, color: 'text-brand-700' },
              { label: 'المحاسبون', value: userStats.accountants, color: 'text-amber-700' },
              { label: 'معلقون', value: userStats.suspended, color: 'text-red-700' },
            ].map((s) => (
              <Card key={s.label} className="p-4">
                <div className="text-xs text-ink-500">{s.label}</div>
                <div className={`mt-1 text-2xl font-black ${s.color}`}>{s.value}</div>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {[
              { label: 'إجمالي المنح', value: grantStats.total, color: 'text-ink-800' },
              { label: 'منح فعّالة', value: grantStats.active, color: 'text-emerald-700' },
              { label: 'منح ملغاة', value: grantStats.revoked, color: 'text-red-700' },
            ].map((s) => (
              <Card key={s.label} className="p-4">
                <div className="text-xs text-ink-500">{s.label}</div>
                <div className={`mt-1 text-2xl font-black ${s.color}`}>{s.value}</div>
              </Card>
            ))}
          </div>

          {/* Package distribution */}
          <Card>
            <CardHeader title="الباقة الحالية للنظام" subtitle="الباقة المفعّلة على مستوى النظام بالكامل" action={<Crown className="text-brand-600" size={18} />} />
            <CardBody>
              <div className="grid grid-cols-3 gap-3">
                {(['basic', 'professional', 'enterprise'] as SubscriptionTier[]).map((pkg) => (
                  <div key={pkg} className={`rounded-xl border p-4 text-center ${data.currentPackage === pkg ? 'border-brand-400 bg-brand-50' : 'border-ink-200'}`}>
                    <div className="font-bold text-ink-800">{TIER_LABELS[pkg]}</div>
                    {data.currentPackage === pkg && <div className="mt-1"><Badge tone="green">الحالية</Badge></div>}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Recent audit */}
          <Card>
            <CardHeader title="آخر إجراءات المؤسس" subtitle="أحدث 5 عمليات مسجّلة" action={<ShieldAlert className="text-brand-600" size={18} />} />
            <CardBody>
              <div className="space-y-2">
                {data.auditLogs
                  .filter((l) => l.action.startsWith('Founder.'))
                  .slice(-5)
                  .reverse()
                  .map((l) => (
                    <div key={l.id} className="flex items-start gap-3 rounded-lg border border-ink-100 bg-ink-50 px-3 py-2">
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-brand-500" />
                      <div className="flex-1 text-xs">
                        <span className="font-semibold text-ink-700">{l.action}</span>
                        <span className="mx-2 text-ink-400">—</span>
                        <span className="text-ink-600">{l.details}</span>
                      </div>
                      <span className="shrink-0 text-[10px] text-ink-400">{fmtDate(l.time)}</span>
                    </div>
                  ))}
                {data.auditLogs.filter((l) => l.action.startsWith('Founder.')).length === 0 && (
                  <p className="text-center text-xs text-ink-400 py-4">لا توجد إجراءات مسجّلة بعد</p>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ── Tab: Subscriptions ── */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          {/* Current package selector */}
          <Card>
            <CardHeader title="الباقة العامة للنظام" subtitle="تغيير باقة النظام بالكامل — يؤثر على فلترة الأقسام لكل المستخدمين" action={<Crown className="text-brand-600" size={18} />} />
            <CardBody>
              <div className="grid grid-cols-3 gap-3">
                {(['basic', 'professional', 'enterprise'] as SubscriptionTier[]).map((pkg) => (
                  <button
                    key={pkg}
                    onClick={() => setPkg(pkg)}
                    className={`rounded-xl border p-4 text-right transition ${data.currentPackage === pkg ? 'border-brand-500 bg-brand-50' : 'border-ink-200 bg-white hover:border-brand-300'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-ink-800">{TIER_LABELS[pkg]}</div>
                      {data.currentPackage === pkg && <Badge tone="green">الحالية</Badge>}
                    </div>
                    <div className="mt-2 text-xs text-ink-400">{pkg}</div>
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Grant new subscription */}
          <Card>
            <CardHeader
              title="منح الاشتراكات والتعويضات"
              subtitle="منح باقة محددة لشركة مع تحديد مدة وسبب وأيام تعويض إضافية"
              action={
                <Button size="sm" variant="primary" onClick={() => setShowGrantModal(true)}>
                  <Gift size={14} /> منح اشتراك جديد
                </Button>
              }
            />
            <CardBody className="p-0">
              {data.subscriptionGrants.length > 0 ? (
                <DataTable columns={grantColumns} rows={[...data.subscriptionGrants].reverse()} />
              ) : (
                <div className="py-10 text-center text-sm text-ink-400">
                  لم يتم منح أي اشتراك بعد. اضغط "منح اشتراك جديد" للبدء.
                </div>
              )}
            </CardBody>
          </Card>

          {/* Companies quick overview */}
          <Card>
            <CardHeader title="الشركات وحالاتها" subtitle="تفعيل، تعليق، أرشفة" action={<Building2 className="text-brand-600" size={18} />} />
            <CardBody className="p-0">
              <DataTable columns={companyColumns} rows={data.companies} />
            </CardBody>
          </Card>
        </div>
      )}

      {/* ── Tab: Modules ── */}
      {activeTab === 'modules' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
            <strong>ملاحظة:</strong> المؤسس يرى دائماً كل الأقسام. الإعدادات هنا تنطبق على المدراء والمحاسبين فقط.
          </div>
          <Card>
            <CardHeader
              title="التحكم في الأقسام"
              subtitle="إخفاء أو إظهار كل قسم حسب الباقة أو الدور أو إخفاؤه كلياً"
              action={<LayoutGrid className="text-brand-600" size={18} />}
            />
            <CardBody className="p-0">
              <div className="divide-y divide-ink-100">
                {data.moduleVisibility.map((mod) => {
                  const label = MODULE_LABELS[mod.path] ?? mod.path
                  const isExpanded = expandedModule === mod.path
                  return (
                    <div key={mod.path} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {mod.forceHidden
                            ? <EyeOff size={16} className="text-red-500 shrink-0" />
                            : <Eye size={16} className="text-emerald-500 shrink-0" />
                          }
                          <div>
                            <div className="text-sm font-semibold text-ink-800">{label}</div>
                            <div className="text-[10px] text-ink-400" dir="ltr">{mod.path}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Force hide toggle */}
                          <button
                            onClick={() => handleToggleHide(mod.path, !mod.forceHidden)}
                            className={`rounded-lg border px-3 py-1 text-xs font-bold transition ${mod.forceHidden ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100' : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                          >
                            {mod.forceHidden ? 'مخفي كلياً' : 'ظاهر'}
                          </button>
                          {/* Expand for detailed config */}
                          <button
                            onClick={() => setExpandedModule(isExpanded ? null : mod.path)}
                            className="rounded-lg border border-ink-200 p-1 text-ink-500 hover:bg-ink-100"
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded: tier + role config */}
                      {isExpanded && (
                        <div className="mt-3 grid grid-cols-2 gap-4 rounded-xl bg-ink-50 p-4">
                          <div>
                            <div className="mb-2 text-xs font-bold text-ink-600">ظاهر للباقات:</div>
                            <div className="space-y-1">
                              {(['basic', 'professional', 'enterprise'] as SubscriptionTier[]).map((tier) => (
                                <label key={tier} className="flex items-center gap-2 text-xs text-ink-700 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={mod.enabledForTiers.includes(tier)}
                                    onChange={(e) => handleModuleTier(mod.path, tier, e.target.checked)}
                                    className="h-3.5 w-3.5 rounded border-ink-300 text-brand-600"
                                  />
                                  {TIER_LABELS[tier]}
                                </label>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="mb-2 text-xs font-bold text-ink-600">ظاهر للأدوار:</div>
                            <div className="space-y-1">
                              {(['admin', 'accountant'] as UserRole[]).map((role) => (
                                <label key={role} className="flex items-center gap-2 text-xs text-ink-700 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={mod.visibleToRoles.includes(role)}
                                    onChange={(e) => handleModuleRole(mod.path, role, e.target.checked)}
                                    className="h-3.5 w-3.5 rounded border-ink-300 text-brand-600"
                                  />
                                  {ROLE_LABELS[role]}
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ── Tab: Users ── */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="إدارة المستخدمين"
              subtitle="تغيير الأدوار بما فيها ترقية لمؤسس، تعليق/تفعيل، إعادة تعيين كلمة المرور"
              action={<Users className="text-brand-600" size={18} />}
            />
            <CardBody className="p-0">
              <DataTable columns={userColumns} rows={data.users} />
            </CardBody>
          </Card>
          <Card className="border border-amber-200 bg-amber-50">
            <CardBody>
              <div className="flex items-start gap-3 text-amber-800 text-sm">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold">تنبيه الأمان</div>
                  <div className="text-xs leading-6">ترقية مستخدم إلى دور "مؤسس" تمنحه صلاحية كاملة على النظام بما في ذلك هذه اللوحة. تأكد من هوية المستخدم قبل الترقية.</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ── Tab: Permissions ── */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="صلاحيات الأدوار"
              subtitle="تحديد ما يمكن لكل دور القيام به داخل النظام"
              action={<ShieldCheck className="text-brand-600" size={18} />}
            />
            <CardBody>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink-200">
                      <th className="py-3 pr-2 text-right text-xs font-bold text-ink-600">الصلاحية</th>
                      {(['admin', 'accountant'] as UserRole[]).map((r) => (
                        <th key={r} className="px-4 py-3 text-center text-xs font-bold text-ink-600">{ROLE_LABELS[r]}</th>
                      ))}
                      <th className="px-4 py-3 text-center text-xs font-bold text-purple-600">المؤسس</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {(Object.keys(PERMISSION_LABELS) as (keyof typeof PERMISSION_LABELS)[]).map((perm) => (
                      <tr key={perm} className="hover:bg-ink-50">
                        <td className="py-3 pr-2 text-xs font-medium text-ink-700">{PERMISSION_LABELS[perm]}</td>
                        {(['admin', 'accountant'] as UserRole[]).map((r) => {
                          const rp = data.rolePermissions.find((x) => x.role === r)
                          const val = rp ? rp[perm] : false
                          return (
                            <td key={r} className="px-4 py-3 text-center">
                              <button
                                onClick={() => {
                                  updateRolePermission(r, { [perm]: !val })
                                  logAction('Founder.Permission', `تغيير صلاحية "${PERMISSION_LABELS[perm]}" للدور "${ROLE_LABELS[r]}" إلى ${!val}`)
                                  push('success', 'تم تحديث الصلاحية')
                                }}
                                className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full transition ${val ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 text-red-500 hover:bg-red-200'}`}
                              >
                                {val ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                              </button>
                            </td>
                          )
                        })}
                        {/* Founder always has all permissions */}
                        <td className="px-4 py-3 text-center">
                          <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                            <CheckCircle2 size={14} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ── Tab: System ── */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          {/* Maintenance Mode */}
          <Card className={data.maintenanceMode ? 'border-2 border-amber-400' : ''}>
            <CardHeader
              title="وضع الصيانة"
              subtitle="إيقاف الوصول لجميع المستخدمين عدا المؤسس مع عرض رسالة مخصصة"
              action={<WrenchIcon className={data.maintenanceMode ? 'text-amber-600' : 'text-ink-400'} size={18} />}
            />
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      setMaintenanceMode(!data.maintenanceMode, maintenanceMsg)
                      logAction('Founder.Maintenance', `${!data.maintenanceMode ? 'تفعيل' : 'إيقاف'} وضع الصيانة`)
                      push(!data.maintenanceMode ? 'error' : 'success', !data.maintenanceMode ? 'تم تفعيل وضع الصيانة' : 'تم إيقاف وضع الصيانة')
                    }}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${data.maintenanceMode ? 'bg-amber-500' : 'bg-ink-300'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${data.maintenanceMode ? '-translate-x-6' : '-translate-x-1'}`} />
                  </button>
                  <span className={`text-sm font-bold ${data.maintenanceMode ? 'text-amber-700' : 'text-ink-500'}`}>
                    {data.maintenanceMode ? 'الصيانة مفعّلة — المستخدمون محجوبون' : 'النظام يعمل بشكل طبيعي'}
                  </span>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-600">رسالة الصيانة (تظهر للمستخدمين)</label>
                  <textarea
                    value={maintenanceMsg}
                    onChange={(e) => setMaintenanceMsg(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-ink-200 bg-ink-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                  <Button size="sm" variant="secondary" className="mt-2" onClick={() => {
                    setMaintenanceMode(data.maintenanceMode, maintenanceMsg)
                    push('success', 'تم حفظ الرسالة')
                  }}>
                    حفظ الرسالة
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Quick links */}
          <Card>
            <CardHeader title="روابط الإدارة السريعة" subtitle="وصول مباشر لأدوات النظام الحساسة" action={<UserCog className="text-brand-600" size={18} />} />
            <CardBody>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button variant="secondary" onClick={() => navigate('/settings')}>إدارة إعدادات النظام</Button>
                <Button variant="secondary" onClick={() => navigate('/users')}>إدارة المستخدمين التفصيلية</Button>
                <Button variant="secondary" onClick={() => navigate('/packages')}>تفاصيل الباقات</Button>
                <Button variant="secondary" onClick={() => navigate('/login-history')}>سجل الدخول الأمني</Button>
                <Button variant="secondary" onClick={() => navigate('/audit')}>سجل عمليات التدقيق</Button>
                <Button variant="secondary" onClick={() => navigate('/backup')}>النسخ الاحتياطي</Button>
              </div>
            </CardBody>
          </Card>

          {/* Governance notice */}
          <Card className="border border-brand-200 bg-brand-50">
            <CardBody>
              <div className="flex items-start gap-3 text-brand-800">
                <Crown size={20} className="mt-0.5 shrink-0" />
                <div className="text-sm leading-7">
                  <div className="font-bold">تنبيه الحوكمة</div>
                  <div className="text-xs">جميع إجراءات هذه اللوحة تُسجَّل تلقائياً في سجل التدقيق. للحماية النهائية يُنصح بتأمين Backend بقاعدة بيانات مع Unique Constraint على معرف المالك لمنع أي تجاوز عبر API.</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Modals */}
      {showGrantModal && (
        <GrantModal
          companies={data.companies}
          currentUser={currentUser}
          onSave={(grant) => {
            grantSubscription(grant)
            logAction('Founder.Grant', `منح باقة "${TIER_LABELS[grant.tier]}" للشركة "${grant.companyName}" — السبب: ${grant.reason}`)
            push('success', 'تم منح الاشتراك بنجاح')
          }}
          onClose={() => setShowGrantModal(false)}
        />
      )}

      {resetPwdUser && (
        <ResetPwdModal
          user={resetPwdUser}
          onSave={(pwd) => {
            resetUserPassword(resetPwdUser.id, pwd)
            logAction('Founder.ResetPassword', `إعادة تعيين كلمة مرور المستخدم: ${resetPwdUser.username}`)
            push('success', 'تم تغيير كلمة المرور بنجاح')
          }}
          onClose={() => setResetPwdUser(null)}
        />
      )}
    </div>
  )
}
