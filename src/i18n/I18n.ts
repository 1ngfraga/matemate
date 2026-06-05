import { Animal, Locale, Operation } from '../core/Types'
import ar from './locales/ar.json'
import bn from './locales/bn.json'
import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import hi from './locales/hi.json'
import ja from './locales/ja.json'
import ko from './locales/ko.json'
import pt from './locales/pt.json'
import ru from './locales/ru.json'
import zh from './locales/zh.json'

type Messages = Record<string, string>

const MESSAGES: Record<Locale, Messages> = {
  [Locale.Ar]: ar,
  [Locale.Bn]: bn,
  [Locale.De]: de,
  [Locale.En]: en,
  [Locale.Es]: es,
  [Locale.Fr]: fr,
  [Locale.Hi]: hi,
  [Locale.Ja]: ja,
  [Locale.Ko]: ko,
  [Locale.Pt]: pt,
  [Locale.Ru]: ru,
  [Locale.Zh]: zh,
}

export const LOCALE_OPTIONS: Array<{ locale: Locale; flagClass: string }> = [
  { locale: Locale.Es, flagClass: 'es' },
  { locale: Locale.En, flagClass: 'gb' },
  { locale: Locale.De, flagClass: 'de' },
  { locale: Locale.Zh, flagClass: 'cn' },
  { locale: Locale.Hi, flagClass: 'in' },
  { locale: Locale.Ko, flagClass: 'kr' },
  { locale: Locale.Ar, flagClass: 'sa' },
  { locale: Locale.Fr, flagClass: 'fr' },
  { locale: Locale.Bn, flagClass: 'bd' },
  { locale: Locale.Pt, flagClass: 'br' },
  { locale: Locale.Ru, flagClass: 'ru' },
  { locale: Locale.Ja, flagClass: 'jp' },
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

export function getFlagClass(locale: Locale): string {
  return LOCALE_OPTIONS.find((option) => option.locale === locale)?.flagClass ?? 'globe'
}

export function getLocaleName(locale: Locale): string {
  return MESSAGES[locale]?.localeName ?? MESSAGES[Locale.Es].localeName
}

export function getHeroName(animal: Animal): string {
  switch (animal) {
    case Animal.Dinosaur: return t('heroDinosaur')
    case Animal.Opossum: return t('heroOpossum')
    case Animal.Capybara: return t('heroCapybara')
    case Animal.Unicorn: return t('heroUnicorn')
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
