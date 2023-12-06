import { loadLocale } from '../utils'
import { useI18n } from './useI18n'

/**
 * Ensures to load the translation messages for the given locale
 * before switching to it
 */
export async function useLazyLocaleSwitch(locale: string) {
  const { locales, messages, setLocale } = useI18n()
  if (locales.includes(locale))
    await loadLocale(messages, locale)
  setLocale(locale)
}
