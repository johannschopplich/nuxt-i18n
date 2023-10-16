import { getLocaleFromRoute } from './utils'
import { addRouteMiddleware, defineNuxtPlugin, useRoute, useState } from '#imports'
import { options } from '#build/i18n.options'

export default defineNuxtPlugin(async () => {
  const { locales } = options
  const currentLocale = getLocaleFromRoute(useRoute())

  // Set locale from the current route
  if (currentLocale && locales.includes(currentLocale))
    useState<string>('locale').value = currentLocale

  // Add route middleware to load locale messages for the target route
  if (process.client) {
    addRouteMiddleware(
      'i18n-set-locale',
      async (to) => {
        const targetLocale = getLocaleFromRoute(to)
        if (targetLocale && locales.includes(targetLocale))
          useState<string>('locale').value = targetLocale
      },
      { global: true },
    )
  }
})
