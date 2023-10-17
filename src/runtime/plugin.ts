import { getLocaleFromRoute } from './utils'
import { addRouteMiddleware, defineNuxtPlugin, useRoute, useState } from '#imports'
import { options } from '#build/i18n.options'

const clean = (str: string) => str.split('-')[0].trim().toLowerCase()

export default defineNuxtPlugin(async () => {
  // Add route middleware to load locale messages for the target route
  addRouteMiddleware(
    'i18n-set-locale',
    async (to) => {
      if (to.path === '/' && !useCookie('i18n_redirected').value) {
        const headerLocale = (useRequestHeaders(['accept-language'])['accept-language'] || '')
          .split(',').map(l => clean(l.split(';')[0])).filter(l => options.locales.includes(l))[0]
        const browserLocale = typeof navigator !== 'undefined'
          ? navigator.languages.map(clean).filter(l => options.locales.includes(l))[0]
            || (options.locales.includes(clean(navigator.language)) ? clean(navigator.language) : '')
          : ''

        const locale = headerLocale || browserLocale
        if (locale)
          return navigateTo(`/${locale}`)
      }

      const targetLocale = getLocaleFromRoute(to)
      if (targetLocale && options.locales.includes(targetLocale))
        useState<string>('locale').value = targetLocale
    },
    { global: true },
  )
})
