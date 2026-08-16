import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { dictionaries, defaultLang, LANGUAGES, type LangCode } from './locales'
import { pages } from './locales/pages'

type Dict = Record<string, unknown>

export type I18nVars = Record<string, string | number>

interface I18nContextValue {
  lang: LangCode
  setLang: (l: LangCode) => void
  t: (key: string, vars?: I18nVars) => string
  dir: 'rtl' | 'ltr'
  months: string[]
}

const I18nCtx = createContext<I18nContextValue | null>(null)

const STORAGE_KEY = 'taxiq_lang'

function isObj(v: unknown): v is Dict {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function deepMerge(base: Dict, extra: Dict): Dict {
  const out: Dict = { ...base }
  for (const k of Object.keys(extra)) {
    const b = out[k]
    const e = extra[k]
    out[k] = isObj(b) && isObj(e) ? deepMerge(b, e) : e
  }
  return out
}

function resolve(obj: Dict, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, p) => {
    if (isObj(acc)) return acc[p]
    return undefined
  }, obj)
}

function interpolate(val: string, vars?: I18nVars): string {
  if (!vars) return val
  return val.replace(/\{(\w+)\}/g, (_, name: string) =>
    vars[name] !== undefined ? String(vars[name]) : `{${name}}`,
  )
}

let currentDict: Dict = deepMerge(dictionaries[defaultLang], pages[defaultLang])

export function translate(key: string, vars?: I18nVars): string {
  let val = resolve(currentDict, key)
  if (typeof val !== 'string') {
    val = resolve(deepMerge(dictionaries.en, pages.en), key)
  }
  return typeof val === 'string' ? interpolate(val, vars) : key
}

function langDict(lang: LangCode): Dict {
  return deepMerge(dictionaries[lang], pages[lang] ?? {})
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<LangCode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved && saved in dictionaries ? (saved as LangCode) : defaultLang
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang)
    currentDict = langDict(lang)
    const meta = LANGUAGES.find((l) => l.code === lang)
    document.documentElement.dir = meta?.dir ?? 'ltr'
    document.documentElement.lang = lang
  }, [lang])

  const t = useCallback(
    (key: string, vars?: I18nVars): string => {
      const dict = langDict(lang)
      let val = resolve(dict, key)
      if (typeof val !== 'string' && lang !== 'en') {
        val = resolve(langDict('en'), key)
      }
      return typeof val === 'string' ? interpolate(val, vars) : key
    },
    [lang],
  )

  const value = useMemo<I18nContextValue>(() => {
    const meta = LANGUAGES.find((l) => l.code === lang)
    return {
      lang,
      setLang,
      t,
      dir: meta?.dir ?? 'ltr',
      months: dictionaries[lang].months ?? [],
    }
  }, [lang, t])

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>
}

export function useI18n(): I18nContextValue {
  const v = useContext(I18nCtx)
  if (!v) throw new Error('useI18n must be used within I18nProvider')
  return v
}
