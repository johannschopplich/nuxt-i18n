import NuxtI18n from '../src/module'

export default defineNuxtConfig({
  modules: [NuxtI18n],

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de'],
    langImports: true,
    lazy: true,
    strategy: 'prefix',
    pages: {
      about: {
        de: '/ueber-uns',
      },
    },
    routeOverrides: {
      // Use `en` catch-all page as fallback for non-existing pages
      '/en/:id(.*)*': '/:id(.*)*',
    },
    logs: true,
  },
})
