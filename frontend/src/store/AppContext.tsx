import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppData, CollectionKey, Company, User } from '../lib/types'
import { buildSeedData } from '../lib/seed'

const LS_DATA = 'tax_iq_data_v2'
const LS_SESSION = 'tax_iq_session_v2'
const CURRENT_VERSION = 3

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(LS_DATA)
    if (raw) {
      const parsed = JSON.parse(raw) as AppData
      if (parsed && parsed.version === CURRENT_VERSION && Array.isArray(parsed.companies)) {
        if (!Array.isArray(parsed.apiKeys)) parsed.apiKeys = []
        return parsed
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
  currentCompany: Company | undefined
  setActiveCompany: (id: string) => void
  currentUser: User | undefined
  login: (username: string, password: string) => boolean
  logout: () => void
  resetData: () => void
  clearAllData: () => void
  setCurrentPackage: (pkg: 'basic' | 'professional' | 'enterprise') => void
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

  const currentCompany = data.companies.find((c) => c.id === data.activeCompanyId)

  const setActiveCompany = (id: string) => {
    setData((d) => ({ ...d, activeCompanyId: id }))
  }

  const login: AppCtx['login'] = (username, password) => {
    const u = data.users.find(
      (x) => x.username.toLowerCase() === username.trim().toLowerCase() && x.password === password,
    )
    if (u) {
      setCurrentUser(u)
      return true
    }
    return false
  }

  const logout = () => setCurrentUser(undefined)

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
      sales: [],
      taxpayers: [],
      invoices: [],
      tickets: [],
      workflows: [],
      appointments: [],
      tasks: [],
      auditLogs: [],
      loginHistory: [],
      documents: [],
    }))
  }

  const setCurrentPackage = (pkg: 'basic' | 'professional' | 'enterprise') => {
    setData((d) => ({ ...d, currentPackage: pkg }))
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
        currentCompany,
        setActiveCompany,
        currentUser,
        login,
        logout,
        resetData,
        clearAllData,
        setCurrentPackage,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}
