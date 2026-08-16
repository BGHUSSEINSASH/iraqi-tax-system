import { ar } from './ar'
import { en } from './en'
import { zh } from './zh'
import { hi } from './hi'
import { es } from './es'
import { fr } from './fr'
import { bn } from './bn'
import { pt } from './pt'
import { ru } from './ru'
import { id } from './id'
import { fa } from './fa'
import { ku } from './ku'

export const dictionaries = { ar, en, zh, hi, es, fr, bn, pt, ru, id, fa, ku }

export const defaultLang = 'ar'

export const LANGUAGES = [
  { code: 'ar', native: 'العربية', dir: 'rtl' },
  { code: 'en', native: 'English', dir: 'ltr' },
  { code: 'zh', native: '中文', dir: 'ltr' },
  { code: 'hi', native: 'हिन्दी', dir: 'ltr' },
  { code: 'es', native: 'Español', dir: 'ltr' },
  { code: 'fr', native: 'Français', dir: 'ltr' },
  { code: 'bn', native: 'বাংলা', dir: 'ltr' },
  { code: 'pt', native: 'Português', dir: 'ltr' },
  { code: 'ru', native: 'Русский', dir: 'ltr' },
  { code: 'id', native: 'Bahasa Indonesia', dir: 'ltr' },
  { code: 'fa', native: 'فارسی', dir: 'rtl' },
  { code: 'ku', native: 'کوردی', dir: 'rtl' },
] as const

export type LangCode = (typeof LANGUAGES)[number]['code']
