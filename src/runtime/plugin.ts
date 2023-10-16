import { getLocaleFromRoute } from './utils'
import { addRouteMiddleware, defineNuxtPlugin, useRoute, useState } from '#imports'
import { options } from '#build/i18n.options'

export default defineNuxtPlugin(async () => {
  // Add route middleware to load locale messages for the target route
  addRouteMiddleware(
    'i18n-set-locale',
    async (to) => {
      const targetLocale = getLocaleFromRoute(to)
      if (targetLocale && options.locales.includes(targetLocale))
        useState<string>('locale').value = targetLocale
    },
    { global: true },
  )
})
