import type { Lang } from '#build/i18n'
import { type ComputedRef, computed, useCookie, useRoute, useState } from '#imports'
import { options } from '#build/i18n'

export type { Lang }

export type Translations<T> = {
  [key in Lang]: T extends Record<string, any> ? T : never
}

export interface Locale {
  locale: ComputedRef<Lang>
  setLocale(locale: Lang): void
  localizePath(path: string, locale: Lang): string
}

export interface LocaleTranslate<T> extends Locale {
  t: T
}

export function useLocale(): Locale
export function useLocale<T>(
  translations: Translations<T>
): LocaleTranslate<Translations<T>[Lang]>
export function useLocale<T>(
  translations?: Translations<T>,
): Locale | LocaleTranslate<Translations<T>[Lang]> {
  const locale = useState<Lang>('locale')

  const t = translations?.[locale.value]

  function setLocale(newLocale: Lang) {
    const route = useRoute()
    if (locale.value === newLocale)
      return
    useCookie('i18n_redirected').value = newLocale
    locale.value = newLocale
    if (typeof document !== 'undefined')
      window.location.pathname = localizePath(route.path, newLocale)
  }

  function localizePath(path: string, targetLocale: Lang) {
    const parts = path.replace(/^\//, '').split('/')
    if (options.locales.includes(parts[0]))
      parts.shift()
    parts.unshift(targetLocale === options.defaultLocale ? '' : targetLocale)
    return parts.join('/').replace(/^\/?/, '/')
  }

  return {
    locale: computed(() => locale.value),
    setLocale,
    localizePath,
    t: t!,
  }
}
