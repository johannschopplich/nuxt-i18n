import { createI18n } from '@byjohann/vue-i18n'
import { getLocaleFromRoute, loadLocale } from './utils'
import { addRouteMiddleware, defineNuxtPlugin, useRoute } from '#imports'
import type { Plugin } from '#app'
import { localeMessages, options } from '#build/i18n.options'

const plugin: Plugin = defineNuxtPlugin(async (nuxtApp) => {
  const { defaultLocale, lazy, locales, messages, strategy } = options
  const hasLocaleMessages = Object.keys(localeMessages).length > 0
  const currentLocale = getLocaleFromRoute(useRoute())

  // Loads all locale messages if auto-import is enabled
  if (hasLocaleMessages) {
    // Import all locale messages for SSR or if `lazy` is disabled
    if (import.meta.server || !lazy) {
      await Promise.all(locales.map(locale => loadLocale(messages, locale)))
    }
    // Import default locale message for client
    else {
      await loadLocale(messages, defaultLocale)

      // Import locale messages for the current route
      if (currentLocale && locales.includes(currentLocale))
        await loadLocale(messages, currentLocale)
    }
  }

  const i18n = createI18n({
    defaultLocale,
    locales,
    messages,
    ...(!import.meta.dev && { logLevel: 'silent' }),
  })

  nuxtApp.vueApp.use(i18n)

  // Set locale from the current route
  if (currentLocale && locales.includes(currentLocale))
    i18n.setLocale(currentLocale)

  // Add route middleware to load locale messages for the target route
  if (import.meta.client && hasLocaleMessages && lazy && strategy !== 'no_prefix') {
    addRouteMiddleware(
      'i18n-set-locale',
      async (to) => {
        const targetLocale = getLocaleFromRoute(to)
        if (targetLocale && locales.includes(targetLocale)) {
          await loadLocale(i18n.messages, targetLocale)
          i18n.setLocale(targetLocale)
        }
      },
      { global: true },
    )
  }

  return {
    provide: {
      i18n,
    },
  }
})

export default plugin
