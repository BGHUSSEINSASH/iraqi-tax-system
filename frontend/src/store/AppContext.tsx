import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  AppData,
  CollectionKey,
  Company,
  User,
  UserRole,
  ModuleVisibility,
  RolePermission,
  SubscriptionGrant,
  SubscriptionTier,
} from '../lib/types'
import { buildSeedData, defaultModuleVisibility, defaultRolePermissions } from '../lib/seed'
import { clearAuthToken, loginWithBackend, saveAuthToken } from '../lib/backendApi'

const LS_DATA = 'tax_iq_data_v2'
const LS_SESSION = 'tax_iq_session_v2'
const CURRENT_VERSION = 4

function migrateData(parsed: AppData): AppData {
  // Ensure new founder-control fields exist in old stored data
  if (!Array.isArray(parsed.moduleVisibility) || parsed.moduleVisibility.length === 0) {
    parsed.moduleVisibility = defaultModuleVisibility()
  }
  if (!Array.isArray(parsed.rolePermissions) || parsed.rolePermissions.length === 0) {
    parsed.rolePermissions = defaultRolePermissions()
  }
  if (!Array.isArray(parsed.subscriptionGrants)) {
    parsed.subscriptionGrants = []
  }
  if (typeof parsed.maintenanceMode !== 'boolean') {
    parsed.maintenanceMode = false
  }
  if (typeof parsed.maintenanceMessage !== 'string') {
    parsed.maintenanceMessage = 'النظام في وضع الصيانة. يرجى المحاولة لاحقاً.'
  }
  if (!Array.isArray(parsed.apiKeys)) parsed.apiKeys = []
  return parsed
}

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(LS_DATA)
    if (raw) {
      const parsed = JSON.parse(raw) as AppData
      if (parsed && parsed.version === CURRENT_VERSION && Array.isArray(parsed.companies)) {
        return migrateData(parsed)
      }
    }
  } catch {
    /* ignore */
  }
  return buildSeedData()
}

type ItemOf<K extends CollectionKey> = AppData[K] extends (infer T)[] ? T : never

interface AppCtx {
  data: AppData
  add: <K extends CollectionKey>(key: K, item: ItemOf<K>) => void
  update: <K extends CollectionKey>(key: K, id: string, patch: Partial<ItemOf<K>>) => void
  remove: <K extends CollectionKey>(key: K, id: string) => void
  replace: <K extends CollectionKey>(key: K, items: ItemOf<K>[]) => void
  setConfig: (patch: Partial<AppData['config']>) => void
  setConfigValue: (key: keyof AppData['config'], value: unknown) => void
  setCompanyName: (name: string) => void
  currentCompany: Company | undefined
  setActiveCompany: (id: string) => void
  currentUser: User | undefined
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  resetData: () => void
  clearAllData: () => void
  setCurrentPackage: (pkg: SubscriptionTier) => void
  // ─── Founder Actions ──────────────────────────────────────────────────────
  toggleModule: (path: string, forceHidden: boolean) => void
  setModuleTiers: (path: string, tiers: SubscriptionTier[]) => void
  setModuleRoles: (path: string, roles: UserRole[]) => void
  grantSubscription: (grant: Omit<SubscriptionGrant, 'id'>) => void
  revokeGrant: (grantId: string) => void
  updateRolePermission: (role: UserRole, patch: Partial<Omit<RolePermission, 'role'>>) => void
  setMaintenanceMode: (enabled: boolean, message?: string) => void
  updateUserRole: (userId: string, role: UserRole) => void
  resetUserPassword: (userId: string, newPassword: string) => void
}

const Ctx = createContext<AppCtx | null>(null)

export function useApp(): AppCtx {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp must be used within AppProvider')
  return v
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadData)
  const [currentUser, setCurrentUser] = useState<User | undefined>(() => {
    try {
      const raw = sessionStorage.getItem(LS_SESSION)
      if (raw) return JSON.parse(raw) as User
    } catch {
      /* ignore */
    }
    return undefined
  })

  useEffect(() => {
    try {
      localStorage.setItem(LS_DATA, JSON.stringify(data))
    } catch {
      /* ignore */
    }
  }, [data])

  useEffect(() => {
    try {
      if (currentUser) sessionStorage.setItem(LS_SESSION, JSON.stringify(currentUser))
      else sessionStorage.removeItem(LS_SESSION)
    } catch {
      /* ignore */
    }
  }, [currentUser])

  const add: AppCtx['add'] = (key, item) => {
    setData((d) => ({ ...d, [key]: [...(d[key] as ItemOf<typeof key>[]), item] }))
  }

  const update: AppCtx['update'] = (key, id, patch) => {
    setData((d) => ({
      ...d,
      [key]: (d[key] as { id: string }[]).map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }))
  }

  const remove: AppCtx['remove'] = (key, id) => {
    setData((d) => ({
      ...d,
      [key]: (d[key] as { id: string }[]).filter((it) => it.id !== id),
    }))
  }

  const replace: AppCtx['replace'] = (key, items) => {
    setData((d) => ({ ...d, [key]: items }))
  }

  const setConfig: AppCtx['setConfig'] = (patch) => {
    setData((d) => ({ ...d, config: { ...d.config, ...patch } }))
  }

  const setConfigValue: AppCtx['setConfigValue'] = (key, value) => {
    setData((d) => ({ ...d, config: { ...d.config, [key]: value } }))
  }

  const setCompanyName = (name: string) => {
    setData((d) => ({ ...d, companyName: name }))
  }

  const currentCompany =
    data.companies.find((c) => c.id === data.activeCompanyId) ??
    (data.companyName
      ? {
          id: data.activeCompanyId,
          name: data.companyName,
          taxId: '',
          activity: '',
          sector: 'private' as const,
          address: '',
          phone: '',
          email: '',
          notes: '',
          createdAt: new Date().toISOString(),
        }
      : undefined)

  const setActiveCompany = (id: string) => {
    setData((d) => ({ ...d, activeCompanyId: id }))
  }

  const login: AppCtx['login'] = async (username, password) => {
    try {
      const result = await loginWithBackend({ username, password })
      if (result?.token) {
        saveAuthToken(result.token)
        setCurrentUser(result.user)
        return true
      }
    } catch {
      /* fallback to local dev login if backend is unavailable */
    }

    const u = data.users.find(
      (x) => x.username.toLowerCase() === username.trim().toLowerCase() && x.password === password,
    )
    if (u?.status === 'suspended') return false
    if (u) {
      clearAuthToken()
      setCurrentUser(u)
      return true
    }
    return false
  }

  const logout = () => {
    clearAuthToken()
    setCurrentUser(undefined)
  }

  const resetData = () => {
    setData(buildSeedData())
  }

  const clearAllData = () => {
    setData((d) => ({
      ...d,
      employees: [],
      monthlyRows: [],
      annualRows: [],
      corporateReturns: [],
      contracts: [],
      properties: [],
      lands: [],
      professions: [],
      invoices: [],
      tickets: [],
      workflows: [],
      appointments: [],
      tasks: [],
      auditLogs: [],
      loginHistory: [],
    }))
  }

  const setCurrentPackage = (pkg: SubscriptionTier) => {
    setData((d) => ({ ...d, currentPackage: pkg }))
  }

  // ─── Founder: Module Visibility ───────────────────────────────────────────

  const toggleModule: AppCtx['toggleModule'] = (path, forceHidden) => {
    setData((d) => ({
      ...d,
      moduleVisibility: d.moduleVisibility.map((m) =>
        m.path === path ? { ...m, forceHidden } : m,
      ),
    }))
  }

  const setModuleTiers: AppCtx['setModuleTiers'] = (path, tiers) => {
    setData((d) => ({
      ...d,
      moduleVisibility: d.moduleVisibility.map((m) =>
        m.path === path ? { ...m, enabledForTiers: tiers } : m,
      ),
    }))
  }

  const setModuleRoles: AppCtx['setModuleRoles'] = (path, roles) => {
    setData((d) => ({
      ...d,
      moduleVisibility: d.moduleVisibility.map((m) =>
        m.path === path ? { ...m, visibleToRoles: roles } : m,
      ),
    }))
  }

  // ─── Founder: Subscription Grants ─────────────────────────────────────────

  const grantSubscription: AppCtx['grantSubscription'] = (grant) => {
    const id = 'grant-' + Date.now()
    setData((d) => ({
      ...d,
      subscriptionGrants: [...d.subscriptionGrants, { ...grant, id }],
    }))
  }

  const revokeGrant: AppCtx['revokeGrant'] = (grantId) => {
    setData((d) => ({
      ...d,
      subscriptionGrants: d.subscriptionGrants.map((g) =>
        g.id === grantId ? { ...g, isActive: false } : g,
      ),
    }))
  }

  // ─── Founder: Role Permissions ────────────────────────────────────────────

  const updateRolePermission: AppCtx['updateRolePermission'] = (role, patch) => {
    setData((d) => ({
      ...d,
      rolePermissions: d.rolePermissions.map((rp) =>
        rp.role === role ? { ...rp, ...patch } : rp,
      ),
    }))
  }

  // ─── Founder: Maintenance Mode ────────────────────────────────────────────

  const setMaintenanceMode: AppCtx['setMaintenanceMode'] = (enabled, message) => {
    setData((d) => ({
      ...d,
      maintenanceMode: enabled,
      maintenanceMessage: message ?? d.maintenanceMessage,
    }))
  }

  // ─── Founder: User Role & Password ────────────────────────────────────────

  const updateUserRole: AppCtx['updateUserRole'] = (userId, role) => {
    setData((d) => ({
      ...d,
      users: d.users.map((u) => (u.id === userId ? { ...u, role } : u)),
    }))
    // Keep session in sync if it's the current user
    setCurrentUser((cu) => (cu && cu.id === userId ? { ...cu, role } : cu))
  }

  const resetUserPassword: AppCtx['resetUserPassword'] = (userId, newPassword) => {
    setData((d) => ({
      ...d,
      users: d.users.map((u) => (u.id === userId ? { ...u, password: newPassword } : u)),
    }))
  }

  return (
    <Ctx.Provider
      value={{
        data,
        add,
        update,
        remove,
        replace,
        setConfig,
        setConfigValue,
        setCompanyName,
        currentCompany,
        setActiveCompany,
        currentUser,
        login,
        logout,
        resetData,
        clearAllData,
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
      }}
    >
      {children}
    </Ctx.Provider>
  )
}
