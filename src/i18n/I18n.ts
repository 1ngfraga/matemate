import { Animal, Locale, Operation } from '../core/Types'
import ar from './locales/ar.json'
import bn from './locales/bn.json'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import hi from './locales/hi.json'
import ja from './locales/ja.json'
import pt from './locales/pt.json'
import ru from './locales/ru.json'
import zh from './locales/zh.json'

type Messages = Record<string, string>

const MESSAGES: Record<Locale, Messages> = {
  [Locale.Ar]: ar,
  [Locale.Bn]: bn,
  [Locale.En]: en,
  [Locale.Es]: es,
  [Locale.Fr]: fr,
  [Locale.Hi]: hi,
  [Locale.Ja]: ja,
  [Locale.Pt]: pt,
  [Locale.Ru]: ru,
  [Locale.Zh]: zh,
}

export const LOCALE_OPTIONS: Array<{ locale: Locale; flag: string }> = [
  { locale: Locale.Es, flag: '🇪🇸' },
  { locale: Locale.En, flag: '🇺🇸' },
  { locale: Locale.Zh, flag: '🇨🇳' },
  { locale: Locale.Hi, flag: '🇮🇳' },
  { locale: Locale.Ar, flag: '🇸🇦' },
  { locale: Locale.Fr, flag: '🇫🇷' },
  { locale: Locale.Bn, flag: '🇧🇩' },
  { locale: Locale.Pt, flag: '🇧🇷' },
  { locale: Locale.Ru, flag: '🇷🇺' },
  { locale: Locale.Ja, flag: '🇯🇵' },
]

let currentLocale: Locale = Locale.Es

function applyDocumentLocale(locale: Locale): void {
  document.documentElement.lang = locale
  document.documentElement.dir = locale === Locale.Ar ? 'rtl' : 'ltr'
}

export function setLocale(locale: Locale): void {
  currentLocale = locale
  applyDocumentLocale(locale)
}

export function getLocale(): Locale {
  return currentLocale
}

export function t(key: string): string {
  return MESSAGES[currentLocale][key] ?? MESSAGES[Locale.Es][key] ?? key
}

export function getFlag(locale: Locale): string {
  return LOCALE_OPTIONS.find((option) => option.locale === locale)?.flag ?? '🌐'
}

export function getHeroName(animal: Animal): string {
  switch (animal) {
    case Animal.Dinosaur: return t('heroDinosaur')
    case Animal.Opossum: return t('heroOpossum')
    case Animal.Capybara: return t('heroCapybara')
  }
}

export function getOperationLabel(operation: Operation): string {
  switch (operation) {
    case Operation.Addition: return t('opAddition')
    case Operation.Subtraction: return t('opSubtraction')
    case Operation.Multiplication: return t('opMultiplication')
    case Operation.Division: return t('opDivision')
  }
}
