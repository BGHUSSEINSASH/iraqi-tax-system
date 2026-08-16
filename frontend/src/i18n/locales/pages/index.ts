import { pgTax } from './tax'
import { pgRegistry } from './registry'
import { pgSecondary } from './secondary'
import { pgDocs } from './docs'
import { pgAnalytics } from './analytics'
import { pgSystem } from './system'
import type { LangCode } from '../index'

const LANGS: LangCode[] = ['ar', 'en', 'zh', 'hi', 'es', 'fr', 'bn', 'pt', 'ru', 'id', 'fa', 'ku']

type Dict = Record<string, unknown>

const GROUPS: Record<string, Partial<Record<LangCode, Dict>>> = {
  pgTax,
  pgRegistry,
  pgSecondary,
  pgDocs,
  pgAnalytics,
  pgSystem,
}

export const pages: Record<LangCode, Dict> = Object.fromEntries(
  LANGS.map((l) => [
    l,
    Object.fromEntries(
      Object.entries(GROUPS).map(([name, g]) => [name, (g as Record<LangCode, Dict>)[l] ?? {}]),
    ),
  ]),
) as Record<LangCode, Dict>
